import styles from "./PlayerBox.module.css";

import { Player } from "types";

type Props = {
  player: Player;
  isMe?: boolean;
  winning?: boolean;
};

export const PlayerBox = (props: Props) => {
  return (
    <div
      className={`${styles.playerBox} ${props.isMe ? styles.me : ""} ${
        props.winning ? styles.winning : ""
      }`}
    >
      <div className={styles.playerName}>
        {props.player.name}
        <div className={styles.playerScore}>
          {parseFloat(props.player.score.toFixed(2))}
        </div>
      </div>
    </div>
  );
};
