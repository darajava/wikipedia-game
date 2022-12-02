import { useEffect, useState } from "react";
import { GameState, Player, Question } from "types";
import { PlayerBox } from "../PlayerBox/PlayerBox";
import styles from "./Round.module.css";

type Props = {
  gameState: GameState;
  showNextHint: () => void;
  sendGuess: (guess: string) => void;
  me?: Player;
};

const Round = (props: Props) => {
  const [questions, setQuestions] = useState<string[]>([]);
  const [guess, setGuess] = useState("");

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

  // player with the highest score
  const leader = props.gameState.players.reduce((prev, current) =>
    prev.score > current.score ? prev : current
  );

  return (
    <div className={styles.round}>
      <div className={styles.playersContainer}>
        {props.gameState.players
          .sort((p1, p2) => {
            // put me first
            if (props.me?.id === p1.id) return -1;
            if (props.me?.id === p2.id) return 1;

            // then sort by score
            return p2.score - p1.score;
          })
          .map((player) => (
            <PlayerBox
              key={player.id}
              player={player}
              isMe={props.me?.id === player.id}
              winning={leader.id === player.id}
            />
          ))}
      </div>
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
      {props.gameState.currentQuestion && (
        <div>
          <input value={guess} onChange={(e) => setGuess(e.target.value)} />
          <button
            onClick={() => {
              props.sendGuess(guess);
              setGuess("");
            }}
          >
            Guess!
          </button>
        </div>
      )}
    </div>
  );
};

export default Round;
