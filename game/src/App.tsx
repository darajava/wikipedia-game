// import React, { useEffect, useRef, useState } from "react";

// import {
//   ServerMessageType,
//   ClientMessageType,
//   GameState,
//   Player,
//   Question,
//   CreatedGameData,
//   JoinedGameData,
//   ServerMessageData,
//   CreateGameData,
//   ServerMessage,
//   ClientMessage,
//   JoinGameData,
//   ClientMessageData,
//   GuessData,
//   YouAreData,
//   ErrorData,
//   NextRoundData,
//   StartGameData,
//   StateUpdateData,
// } from "types";
// import Errors from "./Errors/Errors";
// import { Route, Router, Routes, useNavigate } from "react-router-dom";

// import { w3cwebsocket as W3CWebSocket } from "websocket";
// import Round from "./Round/Round";
// import Intro from "./Intro/Intro";

// function App() {
//   const [me, setMe] = useState<number>(10);

//   const createGame = () => {
//     console.log("create game", me);
//   };

//   useEffect(() => {
//     setTimeout(() => {
//       setMe(100);
//     }, 100);
//   }, []);

//   return (
//     <div>
//       <button onClick={() => createGame()}>Guess!</button>
//     </div>
//   );
// }

// export default App;

import React, { useEffect, useRef, useState } from "react";

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
import { Route, Router, Routes, useNavigate } from "react-router-dom";

import { w3cwebsocket as W3CWebSocket } from "websocket";
import Round from "./Round/Round";
import Intro from "./Intro/Intro";

function App() {
  const [me, setMe] = useState<Player | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [gameId, setGameId] = useState("");
  const [dummy, setDummy] = useState<number>();
  const [guess, setGuess] = useState("");
  const [client, setClient] = useState<W3CWebSocket>();

  let navigate = useNavigate();

  const sendData = (data: ClientMessage<ClientMessageData>) => {
    if (!client) return;

    client.send(JSON.stringify(data));
  };

  const sendGuess = (guess: string) => {
    if (!client) return;
    if (client.readyState === client.OPEN) {
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
    console.log("create game", client, dummy);
    if (!client) return;
    if (client.readyState === client.OPEN) {
      sendData({
        type: ClientMessageType.CreateGame,
        data: {
          amount: 5,
          name: localStorage.getItem("name") || "John (who?)",
          difficulties: ["Easy", "Medium", "Hard"],
        },
      } as ClientMessage<CreateGameData>);
    }
  };

  const joinGame = (gameId: string) => {
    if (!client) {
      return;
    }
    if (client.readyState === client.OPEN) {
      sendData({
        type: ClientMessageType.JoinGame,
        data: {
          gameId,
          name: localStorage.getItem("name") || "Fred (who?)",
        },
      } as ClientMessage<JoinGameData>);
    }
  };

  const startGame = () => {
    if (!client) return;
    if (client.readyState === client.OPEN) {
      sendData({
        type: ClientMessageType.StartGame,
        data: {
          gameId: gameState?.id,
        },
      } as ClientMessage<StartGameData>);
    }
  };

  const showNextHint = () => {
    if (!client) return;
    if (client.readyState === client.OPEN) {
      sendData({
        type: ClientMessageType.ShowNextHint,
        data: {
          gameId: gameState?.id,
          playerId: me?.id,
        },
      } as ClientMessage<GuessData>);
    }
  };

  const [errors, setErrors] = React.useState<string[]>([]);

  useEffect(() => {
    setDummy(100);
  }, []);

  useEffect(() => {
    const localClient = new W3CWebSocket(
      "ws://localhost:8080/",
      "echo-protocol"
    );

    localClient.onerror = () => {
      console.log("Connection Error");
    };

    setDummy(2);
    localClient.onopen = () => {
      setDummy(1);
      setClient(localClient);
      console.log("WebSocket Client Connected");
    };

    localClient.onclose = function () {
      setClient(undefined);
      console.log("Client Closed");
    };

    localClient.onmessage = function (e) {
      if (typeof e.data === "string") {
        const message = JSON.parse(e.data) as ServerMessage<ServerMessageData>;

        switch (message.type) {
          case ServerMessageType.CreatedGame:
            const createdGameData = message.data as CreatedGameData;
            console.log("Created Game", createdGameData);

            navigate("/" + createdGameData.gameState.id, { replace: true });
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

  // <input
  //       value={name}
  //       onChange={(e) => setName(e.target.value)}
  //       placeholder={"Name..."}
  //     />
  //     <input
  //       value={gameId}
  //       onChange={(e) => setGameId(e.target.value)}
  //       placeholder={"Game ID"}
  //     />

  const [content, setContent] = useState<JSX.Element | null>(null);

  useEffect(() => {
    if (!gameState) {
      setContent(
        <Routes>
          <Route
            path=":gameId"
            element={
              <Intro joinGame={joinGame} createGame={createGame} ws={client} />
            }
          />
        </Routes>
      );
    } else {
      setContent(
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
      );
    }
  }, [gameState, client]);

  return (
    <div>
      {errors && <Errors>{errors}</Errors>}

      {content}
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
