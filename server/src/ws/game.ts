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
  AskForCanvasData,
  CanvasDataUpdateData,
  RestartGameData,
  RestartedGameData,
} from "types";
import { getRepository, In } from "typeorm";
import levenshtein from "js-levenshtein";
import {
  HINT_TIME,
  INTERMISSION_TIME,
  POINT_GOAL,
  POINT_GOAL_DEV,
  ROUND_TIME,
} from "types/build/constants";
import { Picture } from "../entity/Picture";
import crypto from "crypto";

export const SCORES = {
  [ScoreReasons.Close]: 2,
  [ScoreReasons.Correct]: 10,
  [ScoreReasons.Incorrect]: -2,
  [ScoreReasons.ShowHint]: -1,
  [ScoreReasons.Skipped]: -1,
  [ScoreReasons.LetTimeRunOut]: -5,
};
const randomString = (len) => {
  let result = "";
  const characters = "acemnorsuvwxz";
  for (let i = 0; i < len; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

const init = () => {
  // TODO: Chore: Make this a map
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

  const joinGame = async (ws: WebSocket, data: JoinGameData) => {
    let canvasDataHash = null;
    try {
      canvasDataHash = await savePicture(data.canvasData, data.name);
    } catch (e) {
      console.error("Error saving picture", e);
      sendError(
        ws,
        "Something really weird happened, please redo your drawing..."
      );

      return;
    }

    const gameState = games.find((gameState) => gameState.id === data.gameId);
    if (!gameState) {
      return sendError(ws, "Game not found!!");
    }

    const playerId = randomString(20);
    const player = {
      id: playerId,
      name: data.name,
      canvasDataHash,
      skipped: false,
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

  const scoreEndRound = (gameState: GameState) => {
    const players = gameState.players;

    console.log("Scoring round");

    // if one or more people skipped, then the others get penalized
    const skipped = players.filter((player) => player.skipped);
    if (skipped.length > 0) {
      players.forEach((player) => {
        if (!player.skipped) {
          console.log(
            `Player ${player.name} skipped, penalizing ${player.name} by ${
              SCORES[ScoreReasons.Skipped]
            }`
          );
          updateScore(gameState, player, ScoreReasons.LetTimeRunOut);
        }
      });
    }
  };

  let roundIntervals: Map<string, NodeJS.Timeout> = new Map();
  let roundTimeouts: Map<string, NodeJS.Timeout> = new Map();
  const nextRound = async (
    gameState: GameState,
    immediate: boolean = false,
    ranOutOfTime: boolean = false
  ) => {
    if (ranOutOfTime) {
      scoreEndRound(gameState);
    }

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

    const to = setTimeout(
      async () => {
        console.log("next round");
        gameState.timeLeftInMs = ROUND_TIME;
        gameState.showingNumHints = 1;
        gameState.cameClose = false;
        gameState.isIntermission = false;
        gameState.questionsAnswered = gameState.questionsAnswered + 1;

        const question = await pickQuestion(gameState.difficulties);
        gameState.currentQuestion = question;

        clearInterval(roundIntervals.get(gameState.id));

        roundIntervals.set(
          gameState.id,
          setInterval(() => {
            gameState.timeLeftInMs -= 100;

            if (gameState.timeLeftInMs <= 0) {
              console.log("Time ran out");
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

    roundTimeouts.set(gameState.id, to);
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

    console.log("Starting game", gameState.id);
    nextRound(gameState, true);
    return;
  };

  const endGame = (gameState: GameState) => {
    console.log("Ending game", gameState.id);
    gameState.currentQuestion = null;

    clearTimeout(roundIntervals.get(gameState.id));
    roundIntervals.delete(gameState.id);
    clearInterval(roundTimeouts.get(gameState.id));
    roundTimeouts.delete(gameState.id);

    broadcast(gameState, {
      type: ServerMessageType.GameOver,
      data: {
        gameState,
      },
    } as ServerMessage<GameOverData>);
  };

  const restartGame = (ws: WebSocket, data: RestartGameData) => {
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

    gameState.cameClose = false;
    gameState.questionsAnswered = 0;
    gameState.showingNumHints = 1;

    gameState.players.forEach((player) => {
      player.score = 0;
      player.skipped = false;
      player.typing = false;
    });

    console.log("Restarting game", gameState.id);
    nextRound(gameState, true);

    broadcast(gameState, {
      type: ServerMessageType.RestartedGame,
      data: {
        gameState,
      },
    } as ServerMessage<RestartedGameData>);

    return;
  };

  const updateScore = (
    gameState: GameState,
    player: Player,
    reason: ScoreReasons,
    guess?: string
  ) => {
    player.score = player.score + SCORES[reason];
    if (player.score < 0) {
      player.score = 0;
    }

    // if score greated than 50
    const pointGoal =
      process.env.NODE_ENV === "production" ? POINT_GOAL : POINT_GOAL_DEV;
    if (player.score >= pointGoal) {
      // end game
      endGame(gameState);

      return;
    }
    broadcast(gameState, {
      type: ServerMessageType.ScoreUpdate,
      data: {
        player,
        guess,
        gameState,
        reason,
        points: SCORES[reason],
      },
    } as ServerMessage<ScoreUpdateData>);
  };

  // function to hash a string to a string of length 32
  const hash = (str: string) => {
    return crypto.createHash("sha256").update(str, "utf8").digest("hex");
  };

  const savePicture = async (canvasData: string, name: string) => {
    const canvasDataHash = hash(canvasData);

    const pictureRepository = AppDataSource.getRepository(Picture);

    let picture = await pictureRepository.findOne({
      where: {
        canvasDataHash,
      },
    });

    if (!picture) {
      picture = pictureRepository.create({
        canvasDataHash,
        canvasData,
        name,
      });

      await pictureRepository.save(picture);
    }

    return canvasDataHash;
  };

  const createGame = async (ws: WebSocket, data: CreateGameData) => {
    let canvasDataHash = null;
    try {
      canvasDataHash = await savePicture(data.canvasData, data.name);
    } catch (e) {
      console.error("Error saving picture", e);
      sendError(
        ws,
        "Something really weird happened, please redo your drawing..."
      );

      return;
    }

    console.log("create game", data);
    const playerId = randomString(20);
    const player = {
      id: playerId,
      name: data.name,
      score: 0,
      isHost: true,
      typing: false,
      canvasDataHash,
      skipped: false,
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
      stateOfPlay: "lobby",
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
      ).map((pa: string) => {
        return pa
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]/g, "");
      });

      let reason: ScoreReasons;

      const guess = data.guess
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]/gi, "");

      console.log("guess", guess);
      console.log("possible answers", possibleAnswers);

      if (possibleAnswers.includes(guess)) {
        reason = ScoreReasons.Correct;
      } else {
        reason = ScoreReasons.Incorrect;

        // if any of the possible answers are within 2 edits of the guess, give them a point
        if (!gameState.cameClose) {
          for (const possibleAnswer of possibleAnswers) {
            if (levenshtein(possibleAnswer.toLowerCase(), guess) <= 2) {
              reason = ScoreReasons.Close;
              gameState.cameClose = true;
              break;
            }
          }
        }
      }

      if (reason === ScoreReasons.Correct) {
        console.log("correct answer");
        nextRound(gameState);
      }
      updateScore(gameState, player, reason, data.guess);
    } catch (e) {
      return sendError(ws, "Invalid question");
    }
  };

  const showNextHint = (ws: WebSocket, data: ShowNextHintData) => {
    const gameState = games.find((game) => game.id === data.gameId);

    if (!gameState) {
      return sendError(ws, "Game not found");
    }

    gameState.timeLeftInMs = gameState.timeLeftInMs + HINT_TIME;

    if (gameState.timeLeftInMs > ROUND_TIME) {
      gameState.timeLeftInMs = ROUND_TIME;
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

    updateScore(gameState, player, ScoreReasons.ShowHint);

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

    updateScore(gameState, player, ScoreReasons.Skipped);

    // if all players have skipped, move to next round
    if (gameState.players.every((player) => player.skipped)) {
      console.log("all players skipped");
      nextRound(gameState);
    }

    broadcast(gameState, {
      type: ServerMessageType.StateUpdate,
      data: {
        gameState,
      },
    } as ServerMessage<StateUpdateData>);
  };

  const askForCanvasData = async (ws: WebSocket, data: AskForCanvasData) => {
    const gameState = games.find((game) => game.id === data.gameId);

    if (!gameState) {
      return sendError(ws, "Game not found");
    }

    const canvasDatas: { [canvasDataHash: string]: string } = {};

    for (const player of gameState.players) {
      if (player.canvasDataHash) {
        const pictureRepository = AppDataSource.getRepository(Picture);

        let picture = await pictureRepository.findOne({
          where: {
            canvasDataHash: player.canvasDataHash,
          },
        });

        if (picture) {
          canvasDatas[player.canvasDataHash] = picture.canvasData;
        }
      }
    }
    // send to requesting player
    sendMessage(ws, {
      type: ServerMessageType.CanvasDataUpdate,
      data: {
        canvasDatas,
      },
    } as ServerMessage<CanvasDataUpdateData>);
  };

  wss.on("connection", (ws) => {
    ws.on("message", (data) => {
      const message = JSON.parse(
        data.toString()
      ) as ClientMessage<ClientMessageData>;

      console.log("Got message:", message.type);

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
        case ClientMessageType.AskForCanvasData: {
          return askForCanvasData(ws, message.data as AskForCanvasData);
        }
        case ClientMessageType.Ping: {
          return pong(ws, message.data as PingData);
        }
        case ClientMessageType.RestartGame: {
          return restartGame(ws, message.data as RestartGameData);
        }
      }
    });
  });
};

export default init;
