import axios from "axios";
import React, { useEffect, useRef } from "react";

import styles from "./styles.module.css";

function Chooser() {
  const [gameData, setGameData] = React.useState<{
    answers: string[];
    questions: string[];
    links: string[];
    link: string;
    difficulty?: string;
    seeAlso?: string[];
    addedBy?: string;
    difficulties: { [key: string]: number };
  } | null>(null);

  const links = useRef<string[]>([]);
  const thisLink = useRef<string>("");

  useEffect(() => {
    getRandom();
  }, []);

  const getRandom = async () => {
    const random = await axios.get(`${process.env.REACT_APP_API_URL}/random`);
    chooseAnswer(random.data.title);
  };

  const submitAnswer = async (difficulty: string = "Easy") => {
    console.error(refArr.current[0]);

    await axios.post(`${process.env.REACT_APP_API_URL}/add-question`, {
      difficulty,
      link: gameData?.link,
      questions: JSON.stringify(
        refArr.current.filter((x) => x !== null && x !== "")
      ),
      possibleAnswers: JSON.stringify(
        possibleAnswerRef.current.split(/, */).map((a) => a.trim())
      ),
      addedBy: localStorage.getItem("addedBy"),
    });
    if (gameData) {
      chooseAnswer(gameData.link);
    }
  };

  const chooseAnswer = async (answer: string) => {
    const { data } = await axios.get(
      `${process.env.REACT_APP_API_URL}/article-info/` +
        encodeURIComponent(answer)
    );

    if (thisLink.current) {
      links.current.push(thisLink.current);
    }
    thisLink.current = answer;

    // setGameData(null);
    // setTimeout(() => {
    setGameData(data);
    // }, 50);

    // const res = await axios.post(`${process.env.REACT_APP_API_KEY}/get-question/`, {
    //   link: data.link,
    // });

    // console.log(res.data);
  };

  const inputRef = React.useRef<HTMLInputElement>(null);

  const refArr = React.useRef<string[]>([]);
  const possibleAnswerRef = React.useRef<string>("");

  if (!localStorage.getItem("addedBy")) {
    return (
      <div className={styles.enterName}>
        <h1>Enter your name</h1>

        <input
          ref={inputRef}
          type="text"
          placeholder="Enter your name"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              localStorage.setItem("addedBy", inputRef.current?.value || "");
              window.location.reload();
            }
          }}
        />
      </div>
    );
  }

  if (!gameData) {
    return <div>Loading...</div>;
  }

  return (
    <div className={styles.container}>
      <h1>{decodeURIComponent(gameData.link)}</h1>
      {gameData.answers.length > 0 && (
        <div className={styles.answerContainer}>
          Possible Answers:{" "}
          <b
            contentEditable
            suppressContentEditableWarning
            ref={(r) => (possibleAnswerRef.current = r?.innerText || "")}
            onInput={(e) => {
              console.log(e.currentTarget.innerText);
              possibleAnswerRef.current = e.currentTarget.innerText;
            }}
          >
            {gameData.answers.join(", ")}
          </b>
        </div>
      )}

      <div className={styles.questionContainer}>
        <h3>Hints:</h3>
        {gameData.questions.map((question, index) => (
          <div
            key={question}
            className={styles.question}
            contentEditable
            suppressContentEditableWarning={true}
            onInput={(e) => {
              refArr.current[index] = e.currentTarget.innerText;
              console.log(refArr.current);
            }}
            ref={(r) => {
              if (r) {
                refArr.current[index] = r.innerText;
              }
            }}
          >
            {question}
          </div>
        ))}
      </div>

      <div className={styles.buttonHolder}>
        <button
          onClick={() => submitAnswer("Easy")}
          className={gameData.difficulty === "Easy" ? styles.highlight : ""}
        >
          Easy ({gameData.difficulties.easy})
        </button>
        <button
          onClick={() => submitAnswer("Medium")}
          className={gameData.difficulty === "Medium" ? styles.highlight : ""}
        >
          Medium ({gameData.difficulties.medium})
        </button>
        <button
          onClick={() => submitAnswer("Hard")}
          className={gameData.difficulty === "Hard" ? styles.highlight : ""}
        >
          Hard ({gameData.difficulties.hard})
        </button>
        <button
          onClick={() => submitAnswer("Insane")}
          className={gameData.difficulty === "Insane" ? styles.highlight : ""}
        >
          Insane
        </button>
      </div>

      {gameData.addedBy && (
        <div className={styles.addedBy}>
          Added by: <b>{gameData.addedBy}</b>
        </div>
      )}

      <div>
        <input
          ref={inputRef}
          onKeyUp={(e) => {
            if (e.key === "Enter") {
              chooseAnswer(inputRef.current?.value || "");
            }
          }}
          placeholder="Search for an article"
        />
      </div>
      <br />
      <br />
      <span
        className={styles.link}
        onClick={() => {
          console.log(links.current);
          const last = links.current.pop();
          if (last) {
            chooseAnswer(last);
          }
        }}
      >
        {/* /// back arrow unicode */}
        &#x21A9; Back
      </span>

      {gameData.seeAlso && gameData.seeAlso.length > 0 && (
        <>
          <h3>See also</h3>
          <div className={styles.linksContainer}>
            {gameData.seeAlso?.map((link, index) => (
              <span
                className={styles.link}
                key={link + index}
                onClick={() => {
                  chooseAnswer(link);
                }}
              >
                {link}
              </span>
            ))}
          </div>
        </>
      )}
      <br />

      <h3>Links</h3>
      <div className={styles.linksContainer}>
        {gameData.links.map((link, index) => (
          <span
            className={styles.link}
            key={link + index}
            onClick={() => {
              chooseAnswer(link);
            }}
          >
            {link}
          </span>
        ))}
      </div>

      <br />
      <br />
      <br />
      <div>
        <a
          className={styles.link}
          href={"https://en.wikipedia.org/wiki/" + gameData.link}
          target="_blank"
        >
          View on Wikipedia
        </a>
        <span
          className={styles.link}
          onClick={() => {
            getRandom();
          }}
        >
          Random Article
        </span>
        <span
          className={styles.link}
          onClick={() => {
            chooseAnswer("Time");
          }}
        >
          Time
        </span>
        <br />
        <br />
      </div>
    </div>
  );
}

export default Chooser;
