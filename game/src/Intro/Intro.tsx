import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { type w3cwebsocket } from "websocket";

type Props = {
  joinGame: (gameId: string) => void;
  createGame: () => void;
  ws?: w3cwebsocket;
};

const Intro = (props: Props) => {
  const [name, setName] = useState(localStorage.getItem("name") || "");
  const [nameComplete, setNameComplete] = useState(
    localStorage.getItem("name") !== null
  );

  const [showJoinGame, setShowJoinGame] = useState(false);

  let params = useParams();
  const [gameId, setGameId] = useState(params.gameId || "");

  const [content, setContent] = useState<JSX.Element>();

  useEffect(() => {
    if (props.ws) {
      console.log("params", params.gameId);
      if (params.gameId) {
        props.joinGame(params.gameId);
      }
    }
  }, [params.gameId, props.ws]);

  useEffect(() => {
    if (!nameComplete) {
      setContent(
        <>
          <h1>Who are you?</h1>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name..."
          />
          <button
            onClick={() => {
              localStorage.setItem("name", name);
              setNameComplete(true);
            }}
          >
            Submit
          </button>
        </>
      );
    } else if (showJoinGame) {
      setContent(
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
      setContent(
        <>
          <h1>Hi {name}! What do you want to do? </h1>

          <button onClick={() => setNameComplete(false)}>Edit name</button>
          <button onClick={props.createGame}>Start a new game</button>
          <button onClick={() => setShowJoinGame(true)}>
            Join an existing game
          </button>
        </>
      );
    }
  }, [name, showJoinGame, gameId, nameComplete]);

  return <div className="intro">{content} </div>;
};

export default Intro;
