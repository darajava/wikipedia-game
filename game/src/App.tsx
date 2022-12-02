import React, { useEffect, useRef } from "react";
import useState from "react-usestateref";

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
  RejoinGameData,
  RejoinedGameFailedData,
  GameOverData,
} from "types";
import Errors from "./Errors/Errors";
import { Route, Router, Routes, useNavigate } from "react-router-dom";

import { w3cwebsocket as W3CWebSocket } from "websocket";
import Round from "./Round/Round";
import Intro from "./Intro/Intro";
import WaitingRoom from "./WatingRoom/WaitingRoom";

function App() {
  const [me, setMe] = useState<Player>();
  const [gameState, setGameState] = useState<GameState>();
  const [guess, setGuess] = useState("");
  const [client, setClient, clientRef] = useState<W3CWebSocket>();

  let navigate = useNavigate();

  const sendData = (data: ClientMessage<ClientMessageData>) => {
    if (!clientRef.current) return;

    clientRef.current.send(JSON.stringify(data));
  };

  const sendGuess = (guess: string) => {
    if (!clientRef.current) return;
    if (clientRef.current.readyState === clientRef.current.OPEN) {
      sendData({
        type: ClientMessageType.Guess,
        data: {
          guess,
          gameId: gameState?.id,
          playerId: me?.id,
        },
      } as ClientMessage<GuessData>);
    }

    setGuess("");
  };

  const createGame = () => {
    console.log("create game", clientRef.current);

    if (!clientRef.current) return;
    if (clientRef.current.readyState === clientRef.current.OPEN) {
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

  const rejoinFailed = (gameId: string) => {
    localStorage.removeItem("playerId");

    joinGame(gameId);
  };

  const joinGame = function (gameId: string) {
    // console.log("join game", clientRef.current);
    // log calling function
    if (!clientRef.current) {
      return;
    }
    if (clientRef.current.readyState === clientRef.current.OPEN) {
      if (localStorage.getItem("playerId")) {
        sendData({
          type: ClientMessageType.RejoinGame,
          data: {
            gameId,
            playerId: localStorage.getItem("playerId"),
          },
        } as ClientMessage<RejoinGameData>);
      } else {
        sendData({
          type: ClientMessageType.JoinGame,
          data: {
            gameId,
            name: localStorage.getItem("name") || "Fred (who?)",
          },
        } as ClientMessage<JoinGameData>);
      }
    }
  };

  const startGame = () => {
    if (!clientRef.current) return;
    if (clientRef.current.readyState === clientRef.current.OPEN) {
      sendData({
        type: ClientMessageType.StartGame,
        data: {
          gameId: gameState?.id,
        },
      } as ClientMessage<StartGameData>);
    }
  };

  const endGame = () => {
    if (!clientRef.current) return;
    if (clientRef.current.readyState === clientRef.current.OPEN) {
      sendData({
        type: ClientMessageType.EndGame,
        data: {
          gameId: gameState?.id,
        },
      } as ClientMessage<StartGameData>);
    }

    navigate("/", { replace: true });
    setGameState(undefined);
  };

  const finishGame = () => {
    navigate("/", { replace: true });
    setGameState(undefined);

    localStorage.removeItem("playerId");
  };

  const showNextHint = () => {
    if (!clientRef.current) return;
    if (clientRef.current.readyState === clientRef.current.OPEN) {
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
    const client = new W3CWebSocket("ws://localhost:8080/", "echo-protocol");

    client.onerror = () => {
      console.log("Connection Error");
    };

    client.onopen = () => {
      setClient(client);
      console.log("WebSocket Client Connected");
    };

    client.onclose = function () {
      setClient(undefined);
      console.log("Client Closed");
    };

    client.onmessage = function (e) {
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
            localStorage.setItem("playerId", youAreData.player.id);

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
          case ServerMessageType.RejoinedGameFailed:
            const rejoinFailedData = message.data as RejoinedGameFailedData;
            console.log("Rejoin Failed", message.data);
            rejoinFailed(rejoinFailedData.gameId);
            break;
          case ServerMessageType.StateUpdate:
            const stateUpdateData = message.data as StateUpdateData;
            console.log("State Update", message.data);
            setGameState(stateUpdateData.gameState);
            break;

          case ServerMessageType.GameOver:
            const gameOverData = message.data as GameOverData;
            console.log("Game Over", message.data);
            finishGame();
            break;
          default:

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
              <Intro
                joinGame={joinGame}
                createGame={createGame}
                ws={clientRef.current}
              />
            }
          />
          <Route
            path="/"
            element={
              <Intro
                joinGame={joinGame}
                createGame={createGame}
                ws={clientRef.current}
              />
            }
          />
        </Routes>
      );
    } else {
      if (gameState.currentQuestion) {
        setContent(
          <Round
            sendGuess={sendGuess}
            gameState={gameState}
            showNextHint={showNextHint}
            me={me}
          />
        );
      } else {
        setContent(
          <WaitingRoom
            players={gameState.players}
            host={me?.isHost || false}
            startGame={() => startGame()}
          />
        );
      }
    }
  }, [gameState, client, me]);

  return (
    <div>
      {errors && <Errors>{errors}</Errors>}

      {content}
    </div>
  );
}

export default App;
