import styles from "./ScoreUpdate.module.css";

import { ScoreUpdateData, Player, ScoreReasons } from "types";
import { useEffect, useState } from "react";

type Props = {
  update: ScoreUpdateData;
};

// fucntion to choose random element from array
const randomElement = (array: any[]) => {
  return array[Math.floor(Math.random() * array.length)];
};

export const ScoreUpdate = (props: Props) => {
  const correctLabels = [
    "Correct!",
    "Good job!",
    "Nice!",
    "Perfect!",
    "Yay!",
    "You got it!",
    "Wow!",
    "Smart!",
  ];
  const incorrectLabels = [
    "Incorrect!",
    "Wrong!",
    "Oops!",
    "Ouch!",
    "Yikes...",
    "Uh oh!",
  ];
  const closeLabels = ["Almost!", "So close!", "Nearly..."];

  const hintLabels = ["Used a hint", "Took a hint", "Hint used", "Hint taken"];

  const skippedLabels = ["Skipped", "Skipped question", "Question skipped"];

  const shouldHaveSkippedLabels = ["Should have skipped"];

  const [label, setLabel] = useState("");
  const [guess, setGuess] = useState<string>();
  const [style, setStyle] = useState(styles.green);

  useEffect(() => {
    let label;
    let guess;
    switch (props.update.reason) {
      case ScoreReasons.Close:
        label = randomElement(closeLabels);
        guess = props.update.guess;
        break;
      case ScoreReasons.Correct:
        label = randomElement(correctLabels);
        break;
      case ScoreReasons.Incorrect:
        label = randomElement(incorrectLabels);
        guess = props.update.guess;
        break;
      case ScoreReasons.ShowHint:
        label = randomElement(hintLabels);
        break;
      case ScoreReasons.Skipped:
        label = randomElement(skippedLabels);
        break;
      case ScoreReasons.LetTimeRunOut:
        label =
          "Should have skipped like " +
          props.update.gameState.players
            .filter((player) => player.skipped)
            .map((player) => player.name)
            .slice(0, 2)
            .join(" and ");

        break;
    }

    if (props.update.points > 5) {
      setStyle(styles.green);
    } else if (props.update.points < 0) {
      setStyle(styles.red);
    } else {
      setStyle(styles.amber);
    }

    setGuess(guess);
    setLabel(label);
  }, [props.update]);

  return (
    <div className={`${styles.scoreUpdate} ${style}`}>
      <div className={styles.scoreUpdateContent}>
        <div className={styles.left}>
          <div className={styles.label}>{label}</div>
          {guess && <div className={styles.guess}>"{guess}"</div>}
        </div>
        <div className={styles.points}>
          {props.update.points > 0 && "+"}
          {props.update.points}
        </div>
      </div>
    </div>
  );
};
