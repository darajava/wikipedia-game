import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { type w3cwebsocket } from "websocket";
import { EnterName } from "../EnterName/EnterName";
import useLocalStorage from "../hooks/useLocalStorage";

type Props = {
  joinGame: (gameId: string) => void;
  createGame: () => void;
  ws?: w3cwebsocket;
  canvasData?: string;
};

const Intro = (props: Props) => {
  const [name, setName] = useLocalStorage("name", "");

  const [nameComplete, setNameComplete] = useState(
    // false
    !!name
  );

  const [showJoinGame, setShowJoinGame] = useState(false);

  const [hasAttemptedJoin, setHasAttemptedJoin] = useState(false);

  let params = useParams();
  const [gameId, setGameId] = useState(params.gameId || "");

  useEffect(() => {
    if (hasAttemptedJoin) {
      return;
    }
    if (
      props.ws &&
      props.ws.readyState === props.ws.OPEN &&
      nameComplete &&
      props.canvasData
    ) {
      console.log("params", params.gameId);
      if (params.gameId) {
        props.joinGame(params.gameId);
        setHasAttemptedJoin(true);
      }
    }
  }, [props.ws, nameComplete, hasAttemptedJoin, props.canvasData]);

  let content;

  if (!nameComplete) {
    content = <EnterName setNameComplete={setNameComplete} />;
  } else if (showJoinGame) {
    content = (
      <>
        <h1>Join a game</h1>
        <input
          value={gameId}
          onChange={(e) => setGameId(e.target.value)}
          placeholder={"Game ID"}
        />
        <button onClick={() => setShowJoinGame(false)}>Go back</button>
        <button onClick={() => props.joinGame(gameId)}>Join</button>
      </>
    );
  } else {
    content = (
      <>
        <h1>Hi {name}! What do you want to do? </h1>

        <button onClick={() => setNameComplete(false)}>Edit name</button>
        <button onClick={() => props.createGame()}>Start a new game</button>
        <button onClick={() => setShowJoinGame(true)}>
          Join an existing game
        </button>
      </>
    );
  }

  return <div className="intro">{content}</div>;
};

export default Intro;
