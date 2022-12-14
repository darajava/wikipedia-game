import { useEffect, useState } from "react";
import { Difficulties } from "types";
import { Button } from "../Button/Button";

import styles from "./CreateGame.module.css";

type Props = {
  setDifficulties: (difficulties: Difficulties[]) => void;
  setAllowMistakes: (allowMistakes: boolean) => void;
  allowMistakes: boolean;
  createGame: () => void;
};

export const CreateGame = (props: Props) => {
  const [difficulties, setDifficulties] = useState<Difficulties[]>([
    "Easy",
    "Medium",
  ]);

  useEffect(() => {
    props.setDifficulties(difficulties);
  }, [difficulties]);

  // remove difficulty from state
  const removeDifficulty = (difficulty: Difficulties) => {
    setDifficulties((prevDifficulties) =>
      prevDifficulties.filter((d) => d !== difficulty)
    );
  };

  // add difficulty to state
  const addDifficulty = (difficulty: Difficulties) => {
    setDifficulties((prevDifficulties) => [...prevDifficulties, difficulty]);
  };

  // toggle difficulty in state
  const toggleDifficulty = (difficulty: Difficulties) => {
    if (difficulties.includes(difficulty)) {
      removeDifficulty(difficulty);
    } else {
      addDifficulty(difficulty);
    }
  };

  return (
    <div className={styles.createGame}>
      <h1>Create Game</h1>

      <h2>Include:</h2>
      <div className={styles.difficulties}>
        <Button
          onClick={() => toggleDifficulty("Easy")}
          selected={difficulties.includes("Easy")}
        >
          Easy
        </Button>
        <Button
          onClick={() => toggleDifficulty("Medium")}
          selected={difficulties.includes("Medium")}
        >
          Medium
        </Button>
        <Button
          onClick={() => toggleDifficulty("Hard")}
          selected={difficulties.includes("Hard")}
        >
          Hard
        </Button>
      </div>

      <h2>Allow slight mispellings?</h2>
      <Button
        onClick={() => props.setAllowMistakes(!props.allowMistakes)}
        selected={props.allowMistakes}
      >
        {props.allowMistakes ? "Yes" : "No"}
      </Button>
      <br />
      <br />
      <br />
      <br />
      <Button onClick={props.createGame} disabled={difficulties.length === 0}>
        Create Game!
      </Button>
    </div>
  );
};
