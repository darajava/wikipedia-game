import { createRef, useEffect, useRef, useState } from "react";
import Div100vh from "react-div-100vh";
import { GameState, ScoreUpdateData, Player, Question } from "types";
import { ROUND_TIME } from "types/build/constants";
import useDocumentHeight from "../hooks/useDocumentHeight";
import { PlayerBox } from "../PlayerBox/PlayerBox";
import { Sentence } from "../Sentence/Sentence";
import styles from "./Round.module.css";

type Props = {
  gameState: GameState;
  showNextHint: () => void;
  sendGuess: (guess: string) => void;
  sendTyping: (isTyping: boolean) => void;
  skip: () => void;
  me?: string;
  scoreUpdates?: ScoreUpdateData[];
  roundOver: boolean;
  timeLeft: number;
};

const Round = (props: Props) => {
  const [questions, setQuestions] = useState<string[]>([]);
  const [guess, setGuess] = useState("");

  // play nextround.mp3, unless first question
  useEffect(() => {
    console.log("questions answered", props.gameState.questionsAnswered);
    if (props.gameState.questionsAnswered > 0) {
      const audio = new Audio("/sound/nextround.mp3");
      // audio.play();
    }
  }, [props.gameState.questionsAnswered]);

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

  useEffect(() => {
    console.log(
      "Getting new question",
      props.gameState.currentQuestion?.possibleAnswers
    );
    // focus on the input
    inputRef.current?.focus();
    setGuess("");
  }, [props.gameState.currentQuestion?.id]);

  // player with the highest score
  const leader = props.gameState.players.reduce((prev, current) =>
    prev.score > current.score ? prev : current
  );

  // useEffect(() => {
  //   if (props.me) {
  //     console.log("skipped?", props.me.skipped);
  //   }
  // }, [props.me]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const myPlayer = props.gameState.players.find(
    (player) => player.id === props.me
  );

  useEffect(() => {
    console.log("showing num hints");
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [myPlayer?.showingNumHints]);

  const [fadeOut, setFadeOut] = useState(false);

  const fadeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [showedSomeLetters, setShowedSomeLetters] = useState(false);

  const documentHeight = useDocumentHeight();

  useEffect(() => {
    console.log("showing num hints");
    if (scrollRef.current) {
      // scroll to top smoothly
      scrollRef.current.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }

    fadeTimeoutRef.current = setTimeout(() => {
      console.log("setting fade out");
      setFadeOut(true);
    }, 3000);

    if (!props.roundOver) {
      setFadeOut(false);
      clearTimeout(fadeTimeoutRef.current!);
    }
  }, [props.roundOver]);

  const wholeBarDisabled = myPlayer?.skipped || props.roundOver;

  useEffect(() => {
    // set body height to document height
    document.body.style.height = documentHeight + "px";
  }, [documentHeight]);

  return (
    <div className={`${styles.round} `}>
      {process.env.NODE_ENV === "development" && (
        <div className={styles.questionId}>
          {props.gameState.currentQuestion?.possibleAnswers}
        </div>
      )}
      <div
        className={styles.roundContainer}
        style={
          {
            // height: documentHeight,
          }
        }
        onClick={() => {
          inputRef.current?.focus();
        }}
      >
        <div className={styles.playersContainer}>
          {props.gameState.players
            .sort((p1, p2) => {
              // put me first
              if (myPlayer?.id === p1.id) return -1;
              if (myPlayer?.id === p2.id) return 1;

              // then sort by score
              return p2.score - p1.score;
            })
            .map((player) => (
              <>
                <PlayerBox
                  key={player.id}
                  player={player}
                  isMe={myPlayer?.id === player.id}
                  winning={leader.id === player.id}
                  scoreUpdates={props.scoreUpdates}
                />
              </>
            ))}
        </div>

        <div
          style={{
            background: "var(--secondary)",
            width: ((props.timeLeft - 100 || 0) / ROUND_TIME) * 100 + "%",
            marginTop: "10px",
            height: 3,
            transition: "width 100ms linear",
            opacity: props.roundOver
              ? 0
              : (props.timeLeft - 100 || 0) / ROUND_TIME + 0.5,
          }}
        />

        <div
          className={`${styles.questionContainer} ${
            fadeOut ? styles.fadeOut : ""
          }`}
          ref={scrollRef}
        >
          <div className={styles.questionContent} ref={contentRef}>
            <div className={`${styles.title} ${fadeOut ? styles.fadeOut : ""}`}>
              <span className={styles.left}>
                {/* {props.gameState.questionsAnswered}/{props.gameState.totalQuestions} */}
                {props.gameState.currentQuestion?.difficulty}
                {props.gameState.currentQuestion?.difficulty === "Hard" && "!"}
              </span>
              <span className={styles.center}>
                {decodeURIComponent(props.gameState.currentQuestion?.link || "")
                  .split("")
                  .map((c, i) => {
                    if (c === " ") {
                      return <span key={i}>&nbsp;</span>;
                    }
                    return (
                      <span
                        key={i}
                        className={`${styles.underline}${
                          props.roundOver ? styles.show : ""
                        }`}
                      >
                        {c}
                      </span>
                    );
                  })}
              </span>
              <span className={styles.right}></span>
            </div>
            {questions.map((question, i) => {
              if (i >= (myPlayer?.showingNumHints || 0)) return null;

              return (
                <Sentence
                  key={question}
                  odd={i % 2 === 0}
                  sentence={question}
                  revealed={props.roundOver}
                  showSome={showedSomeLetters}
                />
              );
            })}
          </div>
        </div>

        <div className={`${styles.guessBar}`}>
          <input
            value={guess}
            onKeyPress={(e) => {
              if (e.key === "Enter" && guess.length > 0) {
                props.sendGuess(guess);
                setGuess("");
                props.sendTyping(false);
              } else {
                props.sendTyping(true);
              }
            }}
            ref={inputRef}
            onChange={(e) => {
              if (e.target.value.length > 50) return;

              setGuess(e.target.value);
            }}
            placeholder="Type..."
            autoFocus
            className={styles.guessInput}
            disabled={wholeBarDisabled}
          />
          <button
            className={`${styles.guessButton} ${styles.join}`}
            onClick={() => {
              if (guess.length === 0) return;
              props.sendGuess(guess);
              setGuess("");
              props.sendTyping(false);
              inputRef.current?.focus();
            }}
            disabled={wholeBarDisabled}
          >
            Guess!
          </button>
          <button
            className={`${styles.guessButton} ${styles.hideMobile}`}
            onClick={() => {
              props.showNextHint();
            }}
            disabled={
              wholeBarDisabled ||
              (myPlayer && myPlayer.showingNumHints >= questions.length)
            }
          >
            Hint
          </button>
          <button
            className={`${styles.guessButton}  ${styles.hideMobile}`}
            onClick={() => {
              setGuess("");
              props.skip();
            }}
            disabled={wholeBarDisabled}
          >
            Skip{myPlayer?.skipped ? "ped!" : ""}
          </button>
        </div>
        <div className={`${styles.mobileOnly} ${styles.mobileButtons}`}>
          <button
            className={`${styles.mobileButton}`}
            onClick={() => {
              props.showNextHint();
            }}
            disabled={
              wholeBarDisabled ||
              (myPlayer && myPlayer.showingNumHints >= questions.length)
            }
          >
            Hint
          </button>
          <button
            className={`${styles.mobileButton}  `}
            onClick={() => {
              setGuess("");
              props.skip();
            }}
            disabled={wholeBarDisabled}
          >
            Skip{myPlayer?.skipped ? "ped!" : ""}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Round;
