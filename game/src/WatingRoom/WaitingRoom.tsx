import { useEffect, useState } from "react";
import { GameState, Player, Question } from "types";
import styles from "./WaitingRoom.module.css";

type Props = {
  players: Player[];
  host: boolean;
  startGame: () => void;
};

const Round = (props: Props) => {
  const [questions, setQuestions] = useState<string[]>([]);

  let bottomContent = <>Waiting for another player</>;

  if (props.players.length > 1) {
    if (props.host) {
      bottomContent = <button onClick={props.startGame}>Start Game</button>;
    } else {
      bottomContent = <p>Waiting for host to start game</p>;
    }
  }

  return (
    <div className={styles.round}>
      <ul>
        {props.players.map((player) => {
          return (
            <li className={styles.fadeIn} key={player.id}>
              {player.name}
            </li>
          );
        })}
      </ul>
      <div className={styles.bottomContent}>{bottomContent}</div>
    </div>
  );
};

export default Round;
