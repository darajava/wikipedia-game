import React, { useEffect, useRef } from "react";

import {
  ServerMessageType,
  ClientMessageType,
  GameState,
  Player,
  Question,
  CreatedGameData,
  JoinedGameData,
  ServerMessageData,
  CreateGameData,
  ServerMessage,
  ClientMessage,
  JoinGameData,
  ClientMessageData,
  GuessData,
  YouAreData,
  ErrorData,
  NextRoundData,
  StartGameData,
  StateUpdateData,
} from "types";
import Errors from "./Errors/Errors";

import { w3cwebsocket as W3CWebSocket } from "websocket";
import Round from "./Round/Round";

function App() {
  const [me, setMe] = React.useState<Player | null>(null);
  const [gameState, setGameState] = React.useState<GameState | null>(null);
  const [name, setName] = React.useState(localStorage.getItem("name") || "");
  const [gameId, setGameId] = React.useState("");
  const [guess, setGuess] = React.useState("");

  const sendData = (data: ClientMessage<ClientMessageData>) => {
    if (!client.current) return;

    client.current.send(JSON.stringify(data));
  };

  const sendGuess = (guess: string) => {
    if (!client.current) return;
    if (client.current.readyState === client.current.OPEN) {
      sendData({
        type: ClientMessageType.Guess,
        data: {
          guess,
          gameId: gameState?.id,
          playerId: me?.id,
          s: "",
        },
      } as ClientMessage<GuessData>);
    }

    setGuess("");
  };

  const createGame = () => {
    if (!client.current) return;
    if (client.current.readyState === client.current.OPEN) {
      sendData({
        type: ClientMessageType.CreateGame,
        data: {
          amount: 5,
          name,
          difficulties: ["Easy"],
        },
      } as ClientMessage<CreateGameData>);
    }
  };

  const joinGame = () => {
    if (!client.current) return;
    if (client.current.readyState === client.current.OPEN) {
      sendData({
        type: ClientMessageType.JoinGame,
        data: {
          gameId,
          name,
        },
      } as ClientMessage<JoinGameData>);
    }
  };

  const startGame = () => {
    if (!client.current) return;
    if (client.current.readyState === client.current.OPEN) {
      sendData({
        type: ClientMessageType.StartGame,
        data: {
          gameId: gameState?.id,
        },
      } as ClientMessage<StartGameData>);
    }
  };

  const showNextHint = () => {
    if (!client.current) return;
    if (client.current.readyState === client.current.OPEN) {
      sendData({
        type: ClientMessageType.ShowNextHint,
        data: {
          gameId: gameState?.id,
          playerId: me?.id,
        },
      } as ClientMessage<GuessData>);
    }
  };

  const client = useRef<W3CWebSocket | null>(null);

  const [errors, setErrors] = React.useState<string[]>([]);

  useEffect(() => {
    if (name) {
      localStorage.setItem("name", name);
    } else {
      localStorage.removeItem("name");
    }
  }, [name]);

  useEffect(() => {
    client.current = new W3CWebSocket("ws://localhost:8080/", "echo-protocol");

    client.current.onerror = () => {
      console.log("Connection Error");
    };

    client.current.onopen = () => {
      console.log("WebSocket Client Connected");
    };

    client.current.onclose = function () {
      console.log("Client Closed");
    };

    client.current.onmessage = function (e) {
      if (typeof e.data === "string") {
        const message = JSON.parse(e.data) as ServerMessage<ServerMessageData>;

        switch (message.type) {
          case ServerMessageType.CreatedGame:
            const createdGameData = message.data as CreatedGameData;
            console.log("Created Game", createdGameData);
            setGameState(createdGameData.gameState);
            break;
          case ServerMessageType.JoinedGame:
            const joinedGameData = message.data as JoinedGameData;
            console.log("Joined Game", joinedGameData);
            setGameState(joinedGameData.gameState);
            break;
          case ServerMessageType.YouAre:
            const youAreData = message.data as YouAreData;
            console.log("You Are", youAreData);
            setMe(youAreData.player);
            break;
          case ServerMessageType.NextRound:
            const nextRoundData = message.data as NextRoundData;
            console.log("Next Round", message.data);
            setGameState(nextRoundData.gameState);
            break;
          case ServerMessageType.GuessResult:
            const guessResultData = message.data as NextRoundData;
            console.log("Guess Result", message.data);
            setGameState(guessResultData.gameState);
            break;
          case ServerMessageType.StateUpdate:
            const stateUpdateData = message.data as StateUpdateData;
            console.log("State Update", message.data);
            setGameState(stateUpdateData.gameState);
            break;
          case ServerMessageType.Error:
            const errorData = message.data as ErrorData;

            setErrors((errors) => [...errors, errorData.message]);
            break;
        }
      }
    };
  }, []);

  return (
    <div className="App">
      {errors && <Errors>{errors}</Errors>}
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={"Name..."}
      />
      <input
        value={gameId}
        onChange={(e) => setGameId(e.target.value)}
        placeholder={"Game ID"}
      />

      <button onClick={createGame}>Create a game!</button>
      <button onClick={joinGame}>Join a game!</button>
      <button onClick={startGame}>Start!</button>

      {gameState && (
        <div>
          <h1>{gameState.id}</h1>
          <h2>Players</h2>
          <ul>
            {gameState.players.map((player) => (
              <li key={player.id}>
                {player.name} {me?.id === player.id ? "*" : ""}{" "}
                {player.isHost ? "m" : ""}
                {player.score}
              </li>
            ))}
          </ul>
          <h2>Questions</h2>
          <ul>
            <Round gameState={gameState} showNextHint={showNextHint} />
          </ul>
        </div>
      )}

      {gameState && gameState.currentQuestion && (
        <div>
          <input value={guess} onChange={(e) => setGuess(e.target.value)} />
          <button onClick={() => sendGuess(guess)}>Guess!</button>
        </div>
      )}
    </div>
  );
}

export default App;
