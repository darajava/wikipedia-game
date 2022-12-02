import { useEffect, useState } from "react";
import { GameState, Question } from "types";
import styles from "./Round.module.css";

type Props = {
  gameState: GameState;
  showNextHint: () => void;
};

const Round = (props: Props) => {
  const [questions, setQuestions] = useState<string[]>([]);

  useEffect(() => {
    try {
      if (props.gameState.currentQuestion?.questions) {
        setQuestions(JSON.parse(props.gameState.currentQuestion.questions));
      }
    } catch (e) {
      alert("Something really strange happened. Please refresh the page.");
      console.error(e);
    }
  }, [props.gameState]);

  return (
    <div className={styles.round}>
      <ul>
        {questions.map((question, i) => {
          if (i >= props.gameState.showingNumHints) return null;

          return (
            <li className={styles.fadeIn} key={question}>
              {question}
            </li>
          );
        })}
      </ul>
      {props.gameState.showingNumHints < questions.length && (
        <button onClick={props.showNextHint}>Next Hint</button>
      )}
    </div>
  );
};

export default Round;
