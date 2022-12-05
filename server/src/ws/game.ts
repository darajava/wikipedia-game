import WebSocket, { WebSocketServer } from "ws";
import { AppDataSource } from "../data-source";

import { Question as QuestionEntity } from "../entity/Question";

import {
  ServerMessageType,
  ClientMessageType,
  GameState,
  Player,
  Question,
  ServerMessage,
  ErrorData,
  JoinedGameData,
  CreatedGameData,
  CreateGameData,
  ServerMessageData,
  JoinGameData,
  ClientMessage,
  ClientMessageData,
  YouAreData,
  Difficulties,
  StartGameData,
  GuessData,
  ScoreUpdateData,
  GameOverData,
  ShowNextHintData,
  StateUpdateData,
  RejoinGameData,
  RejoinedGameFailedData,
  EndGameData,
  ScoreReasons,
  NextRoundData,
  TypingData,
  SkipData,
  TimeUpdateData,
  PingData,
  IntermissionData,
} from "types";
import { In } from "typeorm";
import levenshtein from "js-levenshtein";
import {
  INTERMISSION_TIME,
  POINT_GOAL,
  ROUND_TIME,
} from "types/build/constants";

const randomString = (len) => {
  let result = "";
  const characters = "acemnorsuvwxz";
  for (let i = 0; i < len; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

const init = () => {
  const games: GameState[] = [];

  const clients = new Map<string, WebSocket>();

  const wss = new WebSocketServer({ port: 8080 });

  const pickQuestion = async (difficulties: Difficulties[]) => {
    const userRepository = AppDataSource.getRepository(QuestionEntity);

    const questions = await userRepository.find({
      // where difficulty is in difficulties
      where: {
        difficulty: In(difficulties),
      },
    });

    // return  random question
    return questions[Math.floor(Math.random() * questions.length)];
  };

  const sendMessage = (ws: WebSocket, message: ServerMessage<any>) => {
    ws.send(JSON.stringify(message));
  };

  const sendError = (ws: WebSocket, message: string) => {
    sendMessage(ws, {
      type: ServerMessageType.Error,
      data: {
        message,
      },
    });
  };

  // send a message to all players in a game
  const broadcast = (
    gameState: GameState,
    message: ServerMessage<any>,
    except?: Player[]
  ) => {
    gameState.players.forEach((player) => {
      if (except && except.includes(player)) {
        return;
      }
      sendMessage(clients.get(player.id), message);
    });
  };

  const joinGame = (ws: WebSocket, data: JoinGameData) => {
    const gameState = games.find((gameState) => gameState.id === data.gameId);
    if (!gameState) {
      return sendError(ws, "Game not found!!");
    }

    const playerId = randomString(10);
    const player = {
      id: playerId,
      name: data.name,
      score: 0,
      isHost: false,
      typing: false,
    } as Player;

    clients.set(playerId, ws);

    if (gameState.currentQuestion) {
      return sendError(ws, "Game already started");
    }

    if (gameState.players.length >= 4) {
      return sendError(ws, "Game is full");
    }

    gameState.players.push(player);

    broadcast(gameState, {
      type: ServerMessageType.JoinedGame,
      data: {
        player,
        gameState,
      },
    } as ServerMessage<JoinedGameData>);

    sendMessage(ws, {
      type: ServerMessageType.YouAre,
      data: {
        player,
        host: false,
      },
    } as ServerMessage<YouAreData>);
  };

  let roundIntervals: Map<string, NodeJS.Timeout> = new Map();
  const nextRound = async (
    gameState: GameState,
    immediate: boolean = false,
    ranOutOfTime: boolean = false
  ) => {
    gameState.players.forEach((player) => {
      player.typing = false;
      player.skipped = false;
    });

    gameState.timeLeftInMs = 0;
    gameState.isIntermission = true;

    broadcast(gameState, {
      type: ServerMessageType.Intermission,
      data: {
        gameState,
        immediate,
      },
    } as ServerMessage<IntermissionData>);

    console.log("Will start next round in", INTERMISSION_TIME, "ms");
    clearInterval(roundIntervals.get(gameState.id));
    setTimeout(
      async () => {
        console.log("next round");
        gameState.timeLeftInMs = ROUND_TIME;
        gameState.showingNumHints = 1;
        gameState.cameClose = false;
        gameState.isIntermission = false;
        gameState.questionsAnswered = gameState.questionsAnswered + 1;

        const question = await pickQuestion(gameState.difficulties);
        gameState.currentQuestion = question;

        // after ROUND_TIME, start next round
        roundIntervals.set(
          gameState.id,
          setInterval(() => {
            gameState.timeLeftInMs -= 100;

            if (gameState.timeLeftInMs <= 0) {
              nextRound(gameState, false, true);
            }
          }, 100)
        );

        broadcast(gameState, {
          type: ServerMessageType.NextRound,
          data: {
            gameState,
            immediate,
          },
        } as ServerMessage<NextRoundData>);
      },
      immediate ? 0 : INTERMISSION_TIME
    );
  };

  const startGame = async (ws: WebSocket, data: StartGameData) => {
    const gameState = games.find((game) => game.id === data.gameId);

    if (!gameState) {
      return sendError(ws, "Game not found!");
    }

    if (gameState.currentQuestion) {
      return sendError(ws, "Game already started");
    }

    if (gameState.players.length < 2) {
      return sendError(ws, "Not enough players");
    }

    nextRound(gameState, true);
    return;
  };

  const endGame = (gameState: GameState) => {
    gameState.currentQuestion = null;

    clearTimeout(roundIntervals.get(gameState.id));
    roundIntervals.delete(gameState.id);

    broadcast(gameState, {
      type: ServerMessageType.GameOver,
      data: {
        gameState,
      },
    } as ServerMessage<GameOverData>);
  };

  const updateScore = (
    gameState: GameState,
    player: Player,
    score: number,
    reason: ScoreReasons,
    guess?: string
  ) => {
    player.score = player.score + score;
    if (player.score < 0) {
      player.score = 0;
    }
    // if score greated than 50
    if (player.score >= POINT_GOAL) {
      // end game
      endGame(gameState);

      // remove gamestate
      games.splice(games.indexOf(gameState), 1);

      return;
    }
    broadcast(gameState, {
      type: ServerMessageType.ScoreUpdate,
      data: {
        player,
        guess,
        gameState,
        reason,
        points: score,
      },
    } as ServerMessage<ScoreUpdateData>);
  };

  const createGame = async (ws: WebSocket, data: CreateGameData) => {
    console.log("create game", data);
    const playerId = randomString(10);
    const player = {
      id: playerId,
      name: data.name,
      score: 0,
      isHost: true,
      typing: false,
    } as Player;

    let id = randomString(5);
    while (games.find((game) => game.id === id)) {
      id = randomString(5);
    }

    const gameState: GameState = {
      id,
      players: [player],
      hostName: data.name,
      currentQuestion: null,
      difficulties: data.difficulties,
      questionsAnswered: -1,
      showingNumHints: 1,
      timeLeftInMs: undefined,
      isIntermission: false,
    };

    clients.set(playerId, ws);

    games.push(gameState);

    sendMessage(ws, {
      type: ServerMessageType.CreatedGame,
      data: { gameState, name: data.name },
    } as ServerMessage<CreatedGameData>);

    sendMessage(ws, {
      type: ServerMessageType.YouAre,
      data: {
        player,
        host: true,
      },
    } as ServerMessage<YouAreData>);
  };

  const answerQuestion = (ws: WebSocket, data: GuessData) => {
    const gameState = games.find((game) => game.id === data.gameId);

    if (!gameState) {
      return sendError(ws, "Game not found");
    }

    if (!gameState.currentQuestion) {
      return sendError(ws, "Game not started");
    }

    const player = gameState.players.find(
      (player) => player.id === data.playerId
    );

    if (!player) {
      return sendError(ws, "Player not found");
    }

    try {
      const possibleAnswers = JSON.parse(
        gameState.currentQuestion.possibleAnswers.toLowerCase()
      );

      let reason: ScoreReasons = ScoreReasons.Correct;

      let points = 0;
      if (possibleAnswers.includes(data.guess.toLowerCase())) {
        points = 10;
      } else {
        points = -3;
        reason = ScoreReasons.Incorrect;

        // if any of the possible answers are within 2 edits of the guess, give them a point
        if (!gameState.cameClose) {
          for (const possibleAnswer of possibleAnswers) {
            if (
              levenshtein(
                possibleAnswer.toLowerCase(),
                data.guess.toLowerCase()
              ) <= 2
            ) {
              points = 2;
              reason = ScoreReasons.Close;
              gameState.cameClose = true;
              break;
            }
          }
        }
      }

      updateScore(gameState, player, points, reason, data.guess);
      if (reason === ScoreReasons.Correct) {
        nextRound(gameState);
      }
    } catch (e) {
      return sendError(ws, "Invalid question");
    }
  };

  const showNextHint = (ws: WebSocket, data: ShowNextHintData) => {
    const gameState = games.find((game) => game.id === data.gameId);

    if (!gameState) {
      return sendError(ws, "Game not found");
    }

    if (!gameState.currentQuestion) {
      return sendError(ws, "Game not started");
    }

    const player = gameState.players.find(
      (player) => player.id === data.playerId
    );

    if (!player) {
      return sendError(ws, "Player not found");
    }

    updateScore(gameState, player, -1, ScoreReasons.ShowHint);

    gameState.showingNumHints = gameState.showingNumHints + 1;

    broadcast(gameState, {
      type: ServerMessageType.StateUpdate,
      data: {
        gameState,
      },
    } as ServerMessage<StateUpdateData>);
  };

  const rejoinGame = (ws: WebSocket, data: RejoinGameData) => {
    const gameState = games.find((game) => game.id === data.gameId);

    if (!gameState) {
      return sendMessage(ws, {
        type: ServerMessageType.RejoinedGameFailed,
        data: {
          gameId: data.gameId,
        },
      } as ServerMessage<RejoinedGameFailedData>);
    }

    const player = gameState.players.find(
      (player) => player.id === data.playerId
    );

    if (!player) {
      return sendMessage(ws, {
        type: ServerMessageType.RejoinedGameFailed,
        data: {
          gameId: data.gameId,
        },
      } as ServerMessage<RejoinedGameFailedData>);
    }

    clients.set(player.id, ws);

    sendMessage(ws, {
      type: ServerMessageType.JoinedGame,
      data: {
        gameState,
        player,
      },
    } as ServerMessage<JoinedGameData>);
    sendMessage(ws, {
      type: ServerMessageType.YouAre,
      data: {
        player,
        host: false,
      },
    } as ServerMessage<YouAreData>);
  };

  const broadcastTyping = (ws: WebSocket, typingData: TypingData) => {
    const gameState = games.find((game) => game.id === typingData.gameId);

    if (!gameState) {
      return sendError(ws, "Game not found");
    }

    // find player in game
    const player = gameState?.players.find(
      (player) => player.id === typingData.playerId
    );

    // if player not found, return
    if (!player) {
      return;
    }

    // update player typing status
    player.typing = typingData.typing;

    broadcast(
      gameState,
      {
        type: ServerMessageType.StateUpdate,
        data: {
          gameState,
        },
      } as ServerMessage<StateUpdateData>,
      [player]
    );
  };

  const pong = (ws: WebSocket, data: PingData) => {
    const gameState = games.find((game) => game.id === data.gameId);

    if (!gameState) {
      return sendError(ws, "Game not found");
    }

    broadcast(gameState, {
      type: ServerMessageType.StateUpdate,
      data: {
        gameState,
      },
    } as ServerMessage<StateUpdateData>);
  };

  const skipQuestion = (ws: WebSocket, skipData: SkipData) => {
    const gameState = games.find((game) => game.id === skipData.gameId);

    if (!gameState) {
      return sendError(ws, "Game not found");
    }

    // find player in game
    const player = gameState?.players.find(
      (player) => player.id === skipData.playerId
    );

    // if player not found, return
    if (!player) {
      return;
    }

    // update player typing status
    player.skipped = true;

    updateScore(gameState, player, -1, ScoreReasons.Skipped);

    // if all players have skipped, move to next round
    if (gameState.players.every((player) => player.skipped)) {
      nextRound(gameState);
    }

    broadcast(gameState, {
      type: ServerMessageType.StateUpdate,
      data: {
        gameState,
      },
    } as ServerMessage<StateUpdateData>);
  };

  wss.on("connection", (ws) => {
    ws.on("message", (data) => {
      const message = JSON.parse(
        data.toString()
      ) as ClientMessage<ClientMessageData>;

      switch (message.type) {
        case ClientMessageType.JoinGame: {
          return joinGame(ws, message.data as JoinGameData);
        }
        case ClientMessageType.CreateGame: {
          return createGame(ws, message.data as CreateGameData);
        }
        case ClientMessageType.StartGame: {
          return startGame(ws, message.data as StartGameData);
        }
        case ClientMessageType.Guess: {
          return answerQuestion(ws, message.data as GuessData);
        }
        case ClientMessageType.ShowNextHint: {
          return showNextHint(ws, message.data as ShowNextHintData);
        }
        case ClientMessageType.RejoinGame: {
          return rejoinGame(ws, message.data as RejoinGameData);
        }
        case ClientMessageType.Typing: {
          return broadcastTyping(ws, message.data as TypingData);
        }
        case ClientMessageType.Skip: {
          return skipQuestion(ws, message.data as SkipData);
        }
        case ClientMessageType.Ping: {
          return pong(ws, message.data as PingData);
        }
      }
    });
  });
};

export default init;
