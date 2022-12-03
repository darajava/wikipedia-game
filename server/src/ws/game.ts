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
} from "types";
import { In } from "typeorm";
import levenshtein from "js-levenshtein";

const words = [
  "a",
  "access",
  "accuse",
  "across",
  "announce",
  "answer",
  "area",
  "arm",
  "as",
  "assess",
  "assume",
  "assure",
  "aware",
  "awareness",
  "camera",
  "can",
  "cancer",
  "car",
  "care",
  "career",
  "case",
  "cause",
  "come",
  "common",
  "concern",
  "consensus",
  "consume",
  "consumer",
  "core",
  "corn",
  "corner",
  "course",
  "cover",
  "cow",
  "cream",
  "crew",
  "cross",
  "ear",
  "earn",
  "ease",
  "enormous",
  "ensure",
  "era",
  "error",
  "even",
  "ever",
  "man",
  "manner",
  "mass",
  "me",
  "mean",
  "measure",
  "menu",
  "mere",
  "mess",
  "mom",
  "moon",
  "more",
  "moreover",
  "mouse",
  "move",
  "museum",
  "name",
  "narrow",
  "near",
  "nerve",
  "nervous",
  "never",
  "new",
  "news",
  "no",
  "none",
  "nor",
  "nose",
  "now",
  "numerous",
  "nurse",
  "occur",
  "ocean",
  "on",
  "once",
  "one",
  "or",
  "our",
  "oven",
  "over",
  "overcome",
  "owe",
  "own",
  "owner",
  "race",
  "rare",
  "raw",
  "reason",
  "recover",
  "remove",
  "resource",
  "revenue",
  "room",
  "rose",
  "row",
  "run",
  "same",
  "sauce",
  "save",
  "scene",
  "score",
  "scream",
  "screen",
  "sea",
  "season",
  "secure",
  "see",
  "seem",
  "sense",
  "serve",
  "seven",
  "severe",
  "sex",
  "snow",
  "so",
  "soccer",
  "some",
  "someone",
  "son",
  "soon",
  "source",
  "success",
  "sue",
  "summer",
  "sun",
  "sure",
  "swear",
  "us",
  "use",
  "user",
  "versus",
  "vs",
  "war",
  "warm",
  "warn",
  "wave",
  "we",
  "wear",
  "woman",
  "zone",
];

const randomString = (len: number) => {
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
  const broadcast = (gameState: GameState, message: ServerMessage<any>) => {
    gameState.players.forEach((player) => {
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

  const nextRound = async (
    gameState: GameState,
    immediate: boolean = false
  ) => {
    gameState.questionsAnswered = gameState.questionsAnswered + 1;

    gameState.cameClose = false;
    gameState.showingNumHints = 1;

    if (gameState.questionsAnswered > gameState.maxQuestions) {
      gameState.currentQuestion = null;
      broadcast(gameState, {
        type: ServerMessageType.GameOver,
        data: {
          gameId: gameState.id,
        },
      } as ServerMessage<GameOverData>);
      return;
    }
    const question = await pickQuestion(gameState.difficulties);
    gameState.currentQuestion = question;

    broadcast(gameState, {
      type: ServerMessageType.NextRound,
      data: {
        gameState,
        immediate,
      },
    } as ServerMessage<NextRoundData>);
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

  const updateScore = (
    gameState: GameState,
    player: Player,
    score: number,
    reason: ScoreReasons,
    guess?: string
  ) => {
    player.score = player.score + score;
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
    } as Player;

    const gameState: GameState = {
      id: `${randomString(3)}-${randomString(2)}-${randomString(3)}`,
      // random word

      players: [player],
      hostName: data.name,
      currentQuestion: null,
      maxQuestions: data.amount,
      difficulties: data.difficulties,
      questionsAnswered: -1,
      showingNumHints: 1,
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
        points = 1;
      } else {
        points = -0.5;
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
              points = 0.2;
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

    updateScore(gameState, player, -0.1, ScoreReasons.ShowHint);

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

  const endGame = (ws: WebSocket, data: EndGameData) => {
    const gameState = games.find((game) => game.id === data.gameId);

    if (!gameState) {
      return sendError(ws, "Game not found");
    }

    const players = gameState.players;

    broadcast(gameState, {
      type: ServerMessageType.GameOver,
      data: {
        gameId: data.gameId,
      },
    } as ServerMessage<GameOverData>);

    broadcast(gameState, {
      type: ServerMessageType.Error,
      data: {
        message: "Game ended",
      },
    } as ServerMessage<ErrorData>);

    games.splice(games.indexOf(gameState), 1);

    for (const player of players) {
      clients.delete(player.id);
    }
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
        case ClientMessageType.EndGame: {
          return endGame(ws, message.data as EndGameData);
        }
      }
    });
  });
};

export default init;
