import axios from "axios";
import React, { useEffect } from "react";

function Chooser() {
  const [gameData, setGameData] = React.useState<{
    answers: string[];
    questions: string[];
    links: string[];
    link: string;
  } | null>(null);

  useEffect(() => {
    chooseAnswer("The_C_Programming_Language");
  }, []);

  const chooseAnswer = async (answer: string) => {
    const { data } = await axios.get(
      "http://localhost:3211/article-info/" + encodeURIComponent(answer)
    );

    setGameData(data);
  };

  return (
    <div>
      {gameData && (
        <div>
          <a href={gameData.link}>View on Wikipedia</a>
        </div>
      )}
      {gameData &&
        gameData.answers.map((answer) => (
          <div key={answer}>
            <h1>{answer}</h1>
          </div>
        ))}
      {gameData &&
        gameData.questions.map((question) => (
          <div key={question}>
            <li>{question}</li>
          </div>
        ))}

      {gameData &&
        gameData.links.map((link) => (
          <span key={link}>
            <a
              onClick={() => {
                chooseAnswer(link);
              }}
              href="#"
            >
              {link}
            </a>{" "}
            {"  "}
          </span>
        ))}
    </div>
  );
}

export default Chooser;
