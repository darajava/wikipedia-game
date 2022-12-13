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
  ScoreUpdateData,
  ScoreReasons,
  TypingData,
  SkipData,
  TimeUpdateData,
  PingData,
  ServerMessageDataWithGameState,
  AskForCanvasData,
  CanvasDataUpdateData,
  RestartGameData,
  ClientChatData,
  ServerChatData,
} from "types";
import Errors from "./Errors/Errors";
import { Route, Router, Routes, useNavigate } from "react-router-dom";

import { w3cwebsocket as W3CWebSocket } from "websocket";
import Round from "./Round/Round";
import Intro from "./Intro/Intro";
import WaitingRoom from "./WatingRoom/WaitingRoom";
import { INTERMISSION_TIME } from "types/build/constants";
import useLocalStorage from "./hooks/useLocalStorage";
import { GameOver } from "./GameOver/GameOver";
import { AboutToStart } from "./AboutToStart/AboutToStart";

function App() {
  const [gameState, setGameState] = useState<GameState>();
  const [guess, setGuess] = useState("");
  const [client, setClient, clientRef] = useState<W3CWebSocket>();
  const [roundOver, setRoundOver] = useState(false);
  const [gameOver, setGameOver, gameOverRef] = useState(false);

  const [name, setName, nameRef] = useLocalStorage("name", "");
  const [savedCanvases, setSavedCanvases] = useLocalStorage<{
    [key: string]: string;
  }>("savedCanvases", {});
  const [canvasData, setCanvasData, canvasDataRef] = useLocalStorage<string>(
    "canvasData",
    ""
  );
  const [playerId, setPlayerId, playerIdRef] = useLocalStorage<string>(
    "playerId",
    ""
  );

  let navigate = useNavigate();

  const sendData = (data: ClientMessage<ClientMessageData>) => {
    if (!clientRef.current) return;

    clientRef.current.send(JSON.stringify(data));
  };

  useEffect(() => {
    console.log("Name changed", name);
  }, [name]);

  const sendGuess = (guess: string) => {
    if (!clientRef.current) return;
    if (clientRef.current.readyState === clientRef.current.OPEN) {
      sendData({
        type: ClientMessageType.Guess,
        data: {
          guess,
          gameId: gameState?.id,
          playerId: playerIdRef.current,
        },
      } as ClientMessage<GuessData>);
    }

    setGuess("");
  };

  const timeoutRef = useRef<NodeJS.Timeout>();

  const sendTyping = (typing: boolean) => {
    if (!clientRef.current) return;
    if (clientRef.current.readyState === clientRef.current.OPEN) {
      sendData({
        type: ClientMessageType.Typing,
        data: {
          gameId: gameState?.id,
          playerId: playerIdRef.current,
          typing,
        },
      } as ClientMessage<TypingData>);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      if (typing) {
        timeoutRef.current = setTimeout(() => {
          sendTyping(false);
        }, 1000);
      }
    }

    setGuess("");
  };

  const createGame = () => {
    console.log("create game", clientRef.current);

    console.log("name", name);
    if (!clientRef.current) return;
    if (clientRef.current.readyState === clientRef.current.OPEN) {
      sendData({
        type: ClientMessageType.CreateGame,
        data: {
          amount: 5,
          name: nameRef.current,
          difficulties: ["Easy", "Medium", "Hard"],
          canvasData: canvasDataRef.current,
        },
      } as ClientMessage<CreateGameData>);
    }
  };

  const rejoinFailed = (gameId: string) => {
    setPlayerId("");

    joinGame(gameId);
  };

  const joinGame = function (gameId: string) {
    // console.log("join game", clientRef.current);
    // log calling function
    if (!clientRef.current) {
      return;
    }
    if (clientRef.current.readyState === clientRef.current.OPEN) {
      if (playerIdRef.current) {
        sendData({
          type: ClientMessageType.RejoinGame,
          data: {
            gameId,
            playerId: playerIdRef.current,
          },
        } as ClientMessage<RejoinGameData>);
      } else {
        sendData({
          type: ClientMessageType.JoinGame,
          data: {
            gameId,
            name: nameRef.current,
            canvasData: canvasDataRef.current,
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

  const sendChat = (message: string) => {
    if (!clientRef.current) return;
    if (clientRef.current.readyState === clientRef.current.OPEN) {
      if (message.trim() === "") return;

      sendData({
        type: ClientMessageType.Chat,
        data: {
          gameId: gameState?.id,
          playerId: playerIdRef.current,
          message,
        },
      } as ClientMessage<ClientChatData>);
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
    // setGameState(undefined);
    setGameOver(true);
    setScoreUpdates([]);
    // setPlayerId("");
  };

  const showNextHint = () => {
    if (!clientRef.current) return;
    if (clientRef.current.readyState === clientRef.current.OPEN) {
      sendData({
        type: ClientMessageType.ShowNextHint,
        data: {
          gameId: gameState?.id,
          playerId: playerIdRef.current,
        },
      } as ClientMessage<GuessData>);
    }
  };

  const restartGame = () => {
    if (!clientRef.current) return;
    if (clientRef.current.readyState === clientRef.current.OPEN) {
      sendData({
        type: ClientMessageType.RestartGame,
        data: {
          gameId: gameState?.id,
        },
      } as ClientMessage<RestartGameData>);
    }
  };

  const skip = () => {
    if (!clientRef.current) return;
    if (clientRef.current.readyState === clientRef.current.OPEN) {
      sendData({
        type: ClientMessageType.Skip,
        data: {
          gameId: gameState?.id,
          playerId: playerIdRef.current,
        },
      } as ClientMessage<SkipData>);
    }
  };

  const ping = () => {
    if (!clientRef.current) return;
    if (clientRef.current.readyState === clientRef.current.OPEN) {
      sendData({
        type: ClientMessageType.Ping,
        data: {
          gameId: gameState?.id,
          playerId: playerIdRef.current,
        },
      } as ClientMessage<PingData>);
    }
  };

  const checkCanvasData = (gs: GameState) => {
    if (!gs) return;

    // loop through plaers with a normal foreach loop
    for (const player of gs.players) {
      if (!savedCanvases[player.canvasDataHash]) {
        sendData({
          type: ClientMessageType.AskForCanvasData,
          data: {
            gameId: gs.id,
          },
        } as ClientMessage<AskForCanvasData>);
        return;
      }
    }
  };

  const saveCanvasData = (canvasDatas: {
    [canvasDataHash: string]: string;
  }) => {
    for (const canvasDataHash in canvasDatas) {
      savedCanvases[canvasDataHash] = canvasDatas[canvasDataHash];
    }

    setSavedCanvases({ ...savedCanvases });
  };

  const [errors, setErrors] = React.useState<string[]>([]);

  const [scoreUpdates, setScoreUpdates] = useState<ScoreUpdateData[]>([]);

  const [timeLeft, setTimeLeft, timeLeftRef] = useState(0);

  const [chatMessages, setChatMessages] = useState<
    { message: string; playerId: string }[]
  >([]);

  const timeIntervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    setTimeLeft(gameState?.timeLeftInMs || 10);

    if (timeIntervalRef.current) {
      clearInterval(timeIntervalRef.current);
    }

    timeIntervalRef.current = setInterval(() => {
      setTimeLeft((timeLeft) => {
        if (timeLeft <= 0) {
          clearInterval(timeIntervalRef.current);
          return 0;
        }
        return timeLeft - 100;
      });
    }, 100);

    if (gameState?.stateOfPlay === "intermission") {
      if (gameState?.timeLeftInMs <= 0) {
        // play timeout.mp3
        const time = new Audio("/sound/timeout.mp3");
        time.play();
      }
      setRoundOver(true);
    }
  }, [gameState]);

  useEffect(() => {
    const client = new W3CWebSocket(
      // @ts-ignore
      process.env.REACT_APP_WS_URL,
      "echo-protocol"
    );

    client.onerror = (e) => {
      console.log("Connection Error", e);
    };

    client.onopen = () => {
      setClient(client);
      console.log("WebSocket Client Connected");
    };

    client.onclose = function () {
      setClient(undefined);

      console.log("Client Closed");
    };

    const hasGameState = (
      toBeDetermined: ServerMessageData
    ): toBeDetermined is ServerMessageDataWithGameState => {
      if ((toBeDetermined as ServerMessageDataWithGameState).gameState) {
        return true;
      }
      return false;
    };

    client.onmessage = function (e) {
      if (typeof e.data === "string") {
        const message = JSON.parse(e.data) as ServerMessage<ServerMessageData>;

        if (hasGameState(message.data)) {
          setGameState(message.data.gameState);
          checkCanvasData(message.data.gameState);
        }

        switch (message.type) {
          case ServerMessageType.CreatedGame:
            const createdGameData = message.data as CreatedGameData;
            console.log("Created Game", createdGameData);

            navigate("/" + createdGameData.gameState.id, { replace: true });

            break;
          case ServerMessageType.JoinedGame:
            const joinedGameData = message.data as JoinedGameData;
            console.log("Joined Game", joinedGameData);

            break;
          case ServerMessageType.YouAre:
            const youAreData = message.data as YouAreData;
            console.log("You Are", youAreData.player.id);
            setPlayerId(youAreData.player.id);

            break;

          case ServerMessageType.Intermission:
            setRoundOver(true);

            break;
          case ServerMessageType.NextRound:
            const nextRoundData = message.data as NextRoundData;

            console.log("Next Round", nextRoundData.gameState);

            if (!gameOverRef.current) {
              setRoundOver(false);
              // ping();
            }

            break;
          case ServerMessageType.ScoreUpdate:
            const scoreUpdateData = message.data as ScoreUpdateData;
            console.log("Guess Result", message.data);

            setScoreUpdates((scoreUpdates) => [
              ...scoreUpdates,
              scoreUpdateData,
            ]);
            break;
          case ServerMessageType.RejoinedGameFailed:
            const rejoinFailedData = message.data as RejoinedGameFailedData;
            console.log("Rejoin Failed", message.data);
            rejoinFailed(rejoinFailedData.gameId);
            break;
          case ServerMessageType.StateUpdate:
            const stateUpdateData = message.data as StateUpdateData;
            console.log(
              "State Update",
              stateUpdateData.gameState.players.map(
                (p) => p.name + " " + p.typing
              )
            );
            break;

          case ServerMessageType.GameOver:
            const gameOverData = message.data as GameOverData;

            finishGame();
            break;

          case ServerMessageType.RestartedGame:
            setGameOver(false);

            break;
          case ServerMessageType.TimeUpdate:
            const timeUpdateData = message.data as TimeUpdateData;
            console.log("Time Update", message.data);
            setTimeLeft(timeUpdateData.timeLeftInMs);
            break;

          case ServerMessageType.Chat:
            const chatData = message.data as ServerChatData;

            // play chat.mp3
            const chat = new Audio("/sound/click.mp3");
            chat.play();

            setChatMessages((chatMessages) => [
              ...chatMessages,
              { message: chatData.message, playerId: chatData.playerId },
            ]);

            break;

          case ServerMessageType.Error:
            const errorData = message.data as ErrorData;

            navigate("/", { replace: true });

            setErrors((errors) => [...errors, errorData.message]);
            break;

          case ServerMessageType.CanvasDataUpdate:
            const canvasDataUpdateData = message.data as CanvasDataUpdateData;
            saveCanvasData(canvasDataUpdateData.canvasDatas);
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
      switch (gameState.stateOfPlay) {
        case "game-over":
          setContent(
            <GameOver gameState={gameState} restartGame={restartGame} />
          );
          break;
        case "intermission":
        case "playing":
          setContent(
            <Round
              gameState={gameState}
              sendGuess={sendGuess}
              showNextHint={showNextHint}
              sendTyping={sendTyping}
              skip={skip}
              me={playerId}
              scoreUpdates={scoreUpdates}
              roundOver={roundOver}
              timeLeft={timeLeft}
            />
          );
          break;
        case "lobby":
          const myPlayer = gameState.players.find((p) => p.id === playerId);

          setContent(
            <WaitingRoom
              gameState={gameState}
              host={myPlayer?.isHost || false}
              startGame={() => startGame()}
              sendChat={sendChat}
              chatMessages={chatMessages}
            />
          );
          break;
        case "about-to-start":
          setContent(<AboutToStart />);
          break;
      }
    }
  }, [
    gameState,
    client,
    scoreUpdates,
    roundOver,
    timeLeft,
    gameOver,
    name,
    canvasData,
    savedCanvases,
    playerId,
    chatMessages,
  ]);

  return (
    <>
      {errors && <Errors>{errors}</Errors>}
      {content}
    </>
  );
}

export default App;
