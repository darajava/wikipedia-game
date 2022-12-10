import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GameState } from "types";
import ProfilePic from "../ProfilePic/ProfilePic";
import ConfettiExplosion from "react-confetti";

import styles from "./GameOver.module.css";
import useLocalStorage from "../hooks/useLocalStorage";
import { Button } from "../Button/Button";

type Props = {
  restartGame: () => void;
  gameState: GameState;
};

export const GameOver = (props: Props) => {
  const orderedPlayers = props.gameState.players.sort(
    (a, b) => b.score - a.score
  );
  const [isExploding, setIsExploding] = useState(false);
  const [playerId] = useLocalStorage<string>("playerId", "");

  useEffect(() => {
    // if my score is the highest, explode
    if (orderedPlayers[0].id === playerId) {
      setTimeout(() => {
        clap.play();
        setTimeout(() => {
          setIsExploding(true);
        }, 800);
        fireworks.play();

        // after 5 seconds, fade out clap
        setTimeout(() => {
          setInterval(() => {
            clap.volume -= 0.1;
          }, 100);
        }, 5000);
      }, 700);
    }
  }, []);

  const clap = new Audio("/sound/clap.mp3");
  const fireworks = new Audio("/sound/fireworks.mp3");

  return (
    <div className={styles.gameOver}>
      {/* <h1>Game Over!</h1> */}

      {isExploding && (
        <>
          <ConfettiExplosion />
        </>
      )}

      <h1 className={styles.gameOverText}>Game Over!</h1>

      {orderedPlayers[0] && (
        <div className={`${styles.playerContainer} ${styles.winner}`}>
          <h1>{orderedPlayers[0].name}</h1>
          <ProfilePic
            player={orderedPlayers[0]}
            width={100}
            margin={10}
            immediateLoading={false}
            rotate
          />
          <h2>#1</h2>
        </div>
      )}

      <div className={styles.losersContainer}>
        {orderedPlayers.map((player, index) => {
          if (index === 0) {
            return;
          }
          return (
            <div
              key={index}
              className={styles.playerContainer}
              style={
                {
                  // animationDelay: `${(index - 1) * 0.3}s`,
                }
              }
            >
              <h2>{player.name}</h2>
              <ProfilePic
                player={player}
                width={100}
                margin={10}
                immediateLoading={false}
                rotate
              />
              <h2>#{index + 1}</h2>
            </div>
          );
        })}
      </div>
      <Button onClick={props.restartGame}>Play again</Button>
    </div>
  );
};
