import "./constants";

export type Difficulties = "Easy" | "Medium" | "Hard" | "Insane";

export type Player = {
  id: string;
  name: string;
  score: number;
  isHost: boolean;
  typing: boolean;
  skipped: boolean;
};

export type GameState = {
  id: string;
  players: Player[];
  hostName: string;
  currentQuestion?: Question;
  showingNumHints: number;
  questionsAnswered: number;
  difficulties: Difficulties[];
  timeLeftInMs: number;
  cameClose?: boolean;
  isIntermission: boolean;
};

export type Question = {
  id: number;
  questions: string;
  possibleAnswers: string;
  link: string;
  addedBy: string;
  difficulty: Difficulties;
};

// Client message types
export type ClientMessage<T extends ClientMessageData> = {
  type: ClientMessageType;
  data: T;
};

export type ClientMessageData =
  | JoinGameData
  | CreateGameData
  | StartGameData
  | GuessData
  | ShowNextHintData
  | RejoinGameData
  | EndGameData
  | TypingData
  | SkipData
  | PingData;

export enum ClientMessageType {
  JoinGame = "join-game",
  CreateGame = "create-game",
  StartGame = "start-game",
  RejoinGame = "rejoin-game",
  Guess = "guess",
  ShowNextHint = "show-next-hint",
  EndGame = "end-game",
  Typing = "typing",
  Skip = "skip",
  Ping = "ping",
}

export type JoinGameData = {
  gameId: string;
  name: string;
};

export type RejoinGameData = {
  gameId: string;
  playerId: string;
};

export type CreateGameData = {
  name: string;
  difficulties: Difficulties[];
};

export type StartGameData = {
  gameId: string;
};

export type GuessData = {
  playerId: string;
  gameId: string;
  guess: string;
};

export type ShowNextHintData = {
  playerId: string;
  gameId: string;
};

export type EndGameData = {
  gameId: string;
};

export type TypingData = {
  playerId: string;
  gameId: string;
  typing: boolean;
};

export type SkipData = {
  playerId: string;
  gameId: string;
};

export type PingData = {
  gameId: string;
  playerId: string;
};

// Server message types
export type ServerMessage<T extends ServerMessageData> = {
  type: ServerMessageType;
  data: T;
};

export type ServerMessageData =
  | JoinedGameData
  | CreatedGameData
  | ErrorData
  | YouAreData
  | NextRoundData
  | GameOverData
  | ScoreUpdateData
  | StateUpdateData
  | RejoinedGameFailedData
  | GameOverData
  | TimeUpdateData
  | IntermissionData;

export enum ServerMessageType {
  JoinedGame = "joined-game",
  CreatedGame = "created-game",
  Error = "error",
  YouAre = "you-are",
  NextRound = "next-round",
  Intermission = "intermission",
  ScoreUpdate = "score-update",
  GameOver = "game-over",
  StateUpdate = "state-update",
  RejoinedGameFailed = "rejoined-game-failed",
  TimeUpdate = "time-update",
}

export type JoinedGameData = {
  player: Player;
  gameState: GameState;
};

export type CreatedGameData = {
  name: string;
  gameState: GameState;
};

export type ErrorData = {
  message: string;
};

export type YouAreData = {
  player: Player;
  host?: boolean;
};

export type IntermissionData = {};

export type NextRoundData = {
  gameState: GameState;
  immediate?: boolean;
};

export type GameOverData = {
  gameState: GameState;
};

export type RejoinedGameFailedData = {
  gameId: string;
};

export type StateUpdateData = {
  gameState: GameState;
};

export type TimeUpdateData = {
  timeLeftInMs: number;
};

export type ScoreUpdateData = {
  points: number;
  player: Player;
  guess?: string;
  reason?: ScoreReasons;
  gameState: GameState;
};

export enum ScoreReasons {
  Correct = "correct",
  Incorrect = "incorrect",
  Close = "close",
  ShowHint = "show-hint",
  Skipped = "skipped",
}
