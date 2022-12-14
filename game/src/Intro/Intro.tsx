import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { GameState } from "types";
import { type w3cwebsocket } from "websocket";
import { Button } from "../Button/Button";
import { EnterName } from "../EnterName/EnterName";
import useLocalStorage from "../hooks/useLocalStorage";
import { Input } from "../Input/Input";
import { Logo } from "../Logo/Logo";

import styles from "./Intro.module.css";

type Props = {
  joinGame: (gameId: string) => void;
  createGame: () => void;
  ws?: w3cwebsocket;
};

const Intro = (props: Props) => {
  const [name] = useLocalStorage("name", "");

  const [nameComplete, setNameComplete] = useState(
    // false
    !!name
  );

  const [showJoinGame, setShowJoinGame] = useState(false);

  const [hasAttemptedJoin, setHasAttemptedJoin] = useState(false);

  let params = useParams();
  const [gameId, setGameId] = useState(params.gameId || "");
  let navigate = useNavigate();

  const [content, setContent] = useState<JSX.Element>();
  const [rerender, setRerender] = useState(0);

  // if (!nameComplete) {
  //   content = <EnterName setNameComplete={setNameComplete} />;
  // } else

  useEffect(() => {
    if (showJoinGame) {
      setContent(
        <div className={styles.joinGame}>
          <h1>Join a game</h1>
          <Input
            value={gameId}
            setValue={setGameId}
            placeholder={"Game ID"}
            autoFocus
          />
          <Button onClick={() => props.joinGame(gameId)}>Join</Button>
          <Button onClick={() => setShowJoinGame(false)} secondary>
            Go back
          </Button>
        </div>
      );
    } else {
      setContent(
        <>
          <Logo />

          <div className={styles.buttons}>
            <Button
              onClick={() => {
                alert("It should be obvious!");
              }}
            >
              How to play
            </Button>
            <Button
              onClick={() => {
                if (nameComplete) {
                  props.createGame();
                } else {
                  setContent(
                    <EnterName
                      setNameComplete={() => {
                        props.createGame();
                      }}
                      cancel={() => {
                        setRerender(Math.random());
                        // setContent(undefined);
                      }}
                    />
                  );
                }
              }}
            >
              Start a new game
            </Button>
            <Button onClick={() => setShowJoinGame(true)}>
              Join an existing game
            </Button>
          </div>
        </>
      );
    }

    if (hasAttemptedJoin) {
      return;
    }

    if (props.ws && props.ws.readyState === props.ws.OPEN && params.gameId) {
      if (nameComplete) {
        console.log(" I am here");
        props.joinGame(params.gameId);
        setHasAttemptedJoin(true);
      } else {
        setContent(
          <EnterName
            setNameComplete={() => {
              setNameComplete(true);
            }}
            cancel={() => {
              navigate("/");
              setGameId("");
            }}
          />
        );
      }
      console.log("params", params.gameId);
    }
  }, [
    props.ws,
    nameComplete,
    hasAttemptedJoin,
    showJoinGame,
    nameComplete,
    gameId,
    rerender,
  ]);

  return <div className={styles.intro}>{content}</div>;
};

export default Intro;
