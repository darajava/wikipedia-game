import styles from "./PlayerBox.module.css";

import { ScoreUpdateData, Player } from "types";
import { ScoreUpdate } from "../ScoreUpdate/ScoreUpdate";

type Props = {
  player: Player;
  isMe?: boolean;
  winning?: boolean;
  scoreUpdates?: ScoreUpdateData[];
};

export const PlayerBox = (props: Props) => {
  return (
    <div
      className={`${styles.playerBox} ${props.isMe ? styles.me : ""} ${
        props.winning ? styles.winning : ""
      }`}
    >
      <div className={styles.playerName}>
        {props.winning ? "👑 " : ""}
        {props.player.name}
        <div className={styles.playerScore}>
          {props.scoreUpdates?.map((result, i) => {
            if (result.player.id !== props.player.id) return null;

            return <ScoreUpdate key={i} update={result} />;
          })}
          {parseFloat(props.player.score.toFixed(2))}
        </div>
      </div>
    </div>
  );
};
