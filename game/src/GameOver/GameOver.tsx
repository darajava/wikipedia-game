import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { GameState } from "types";
import ProfilePic from "../ProfilePic/ProfilePic";

import styles from "./GameOver.module.css";

type Props = {
  restartGame: () => void;
  gameState: GameState;
};

export const GameOver = (props: Props) => {
  const orderedPlayers = props.gameState.players.sort(
    (a, b) => b.score - a.score
  );

  return (
    <div className={styles.gameOver}>
      {/* <h1>Game Over!</h1> */}

      {orderedPlayers[0] && (
        <div className={`${styles.playerContainer} ${styles.winner}`}>
          <h1>Winner!</h1>
          <h2>{orderedPlayers[0].name}</h2>
          <h3>#1</h3>
          <ProfilePic
            player={orderedPlayers[0]}
            width={100}
            margin={10}
            immediateLoading={false}
            rotate
          />
        </div>
      )}

      {orderedPlayers.map((player, index) => {
        if (index === 0) {
          return;
        }
        return (
          <div key={index} className={styles.playerContainer}>
            <h2>{player.name}</h2>
            <h3>Score: {player.score}</h3>
            <ProfilePic
              player={player}
              width={100}
              margin={10}
              immediateLoading={false}
              rotate
            />
          </div>
        );
      })}
    </div>
  );
};
