import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { type w3cwebsocket } from "websocket";
import { Button } from "../Button/Button";
import { EnterName } from "../EnterName/EnterName";
import useLocalStorage from "../hooks/useLocalStorage";
import { Logo } from "../Logo/Logo";

import styles from "./Intro.module.css";

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
        <div className={styles.buttons}>
          <Button onClick={() => props.createGame()}>How to play</Button>
          <Button onClick={() => props.createGame()}>Start a new game</Button>
          <Button onClick={() => setShowJoinGame(true)}>
            Join an existing game
          </Button>
        </div>
      </>
    );
  }

  return (
    <div className={styles.intro}>
      <Logo />
      {content}
    </div>
  );
};

export default Intro;
