import { useEffect, useState } from "react";
import { GameState, Player, Question } from "types";
import styles from "./WaitingRoom.module.css";
import CanvasDraw from "react-canvas-draw";
import useLocalStorage from "../hooks/useLocalStorage";

type Props = {
  gameState: GameState;
  host: boolean;
  startGame: () => void;
};

const Round = (props: Props) => {
  const [canvases, setCanvases] = useState<{ [key: string]: string }>({});

  const [savedCanvases, setSavedCanvases] = useLocalStorage<{
    [key: string]: string;
  }>("savedCanvases", {});

  useEffect(() => {
    const canvases1 = savedCanvases;

    console.log(savedCanvases);

    let result: { [key: string]: string } = {};
    // loop
    for (const player of props.gameState.players) {
      if (canvases1[player.canvasDataHash]) {
        result[player.canvasDataHash] = canvases1[player.canvasDataHash];
      }
    }

    setCanvases(result);
    // setTest("test2");
  }, [savedCanvases, props.gameState.players]);

  const [questions, setQuestions] = useState<string[]>([]);

  let bottomContent = <>Waiting for another player</>;

  if (props.gameState.players.length > 1) {
    if (props.host) {
      bottomContent = <button onClick={props.startGame}>Start Game</button>;
    } else {
      bottomContent = <p>Waiting for host to start game</p>;
    }
  }

  return (
    <div className={styles.round}>
      <ul>
        {props.gameState.players.map((player) => {
          return (
            <li className={styles.fadeIn} key={player.id}>
              {player.name}
            </li>
          );
        })}
      </ul>
      <div className={styles.bottomContent}>{bottomContent}</div>

      {Object.entries(canvases).map((canvas, index) => {
        return (
          <CanvasDraw
            loadTimeOffset={0}
            saveData={canvas[1]}
            immediateLoading={true}
            hideGrid={true}
            hideInterface={true}
            disabled={true}
            key={index}
          />
        );
      })}
    </div>
  );
};

export default Round;
