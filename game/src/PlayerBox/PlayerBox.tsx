import styles from "./PlayerBox.module.css";

import { ScoreUpdateData, Player } from "types";
import { ScoreUpdate } from "../ScoreUpdate/ScoreUpdate";
import { useEffect, useState } from "react";
import useLocalStorage from "../hooks/useLocalStorage";
import ProfilePic from "../ProfilePic/ProfilePic";

type Props = {
  player: Player;
  isMe?: boolean;
  winning?: boolean;
  scoreUpdates?: ScoreUpdateData[];
};

// function to interpolate two colours based on a percentage
const interpolateColor = (color1: string, color2: string, percent: number) => {
  const r = parseInt(color1.substring(1, 3), 16);
  const g = parseInt(color1.substring(3, 5), 16);
  const b = parseInt(color1.substring(5, 7), 16);
  const r2 = parseInt(color2.substring(1, 3), 16);
  const g2 = parseInt(color2.substring(3, 5), 16);
  const b2 = parseInt(color2.substring(5, 7), 16);
  const pc = percent / 100;
  const r3 = Math.floor(r * pc + r2 * (1 - pc));
  const g3 = Math.floor(g * pc + g2 * (1 - pc));
  const b3 = Math.floor(b * pc + b2 * (1 - pc));

  const r4 =
    r3.toString(16).length === 1 ? "0" + r3.toString(16) : r3.toString(16);
  const g4 =
    g3.toString(16).length === 1 ? "0" + g3.toString(16) : g3.toString(16);
  const b4 =
    b3.toString(16).length === 1 ? "0" + b3.toString(16) : b3.toString(16);

  return "#" + r4 + g4 + b4;
};

export const MAX_SCORE = 50;

export const PlayerBox = (props: Props) => {
  const [hideText, setHideText] = useState(false);

  useEffect(() => {
    if (props.scoreUpdates && props.scoreUpdates.length > 0) {
      // if the last element is me
      if (
        props.scoreUpdates[props.scoreUpdates.length - 1].player.id ===
        props.player.id
      ) {
        setHideText(true);
        setTimeout(() => {
          setHideText(false);
        }, 2000);
      }
    }
  }, [props.scoreUpdates]);

  const percentageDone = (props.player.score / MAX_SCORE) * 100;

  return (
    <div
      className={`${styles.playerBox} ${props.isMe ? styles.me : ""}
      ${props.winning ? styles.winning : ""}
      ${props.player.skipped ? styles.skipped : ""}
      `}
    >
      <div
        className={styles.scoreBar}
        style={{
          width: `${percentageDone}%`,
        }}
      />
      {props.scoreUpdates?.map((result, i) => {
        if (result.player.id !== props.player.id) return null;

        return <ScoreUpdate key={i} update={result} />;
      })}
      <div
        className={`${styles.playerName} ${hideText ? styles.hideText : ""}`}
      >
        <span className={styles.nameHolder}>
          <ProfilePic
            player={props.player}
            immediateLoading={true}
            width={60}
            fade={props.player.skipped}
          />
          <div className={styles.name}>
            {props.isMe ? "You" : props.player.name}
            {props.player.skipped ? " (skipped)" : ""}
          </div>
          <span
            className={`${styles.typingDots} ${
              !props.isMe && props.player.typing ? "" : styles.hidden
            }`}
          >
            ...
          </span>{" "}
        </span>
        <div className={styles.playerScore}>
          {parseFloat(props.player.score.toFixed(2))}
        </div>
      </div>
    </div>
  );
};
