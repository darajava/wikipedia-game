import styles from "./Sentence.module.css";

import { ScoreUpdateData, Player } from "types";
import { ScoreUpdate } from "../ScoreUpdate/ScoreUpdate";

type Props = {
  sentence: string;
  revealed: boolean;
  odd?: boolean;
};

// join array into new array
function joinArray(arr: any[], joiner: any) {
  return arr.reduce(function (a, b) {
    return a.concat(joiner, b);
  }, []);
}

export const Sentence = (props: Props) => {
  const cleanedUpSentence = props.sentence
    .replace(/'''''/g, "BOLD")
    .replace(/'''/g, "BOLD")
    .replace(/''/g, "ITALIC");

  const boldparts = cleanedUpSentence.split(/BOLD/g);

  console.log("HIHI", boldparts);

  const bolded = boldparts.map((part, i) => {
    if (i % 2 === 0) {
      return part;
    } else {
      return joinArray(
        part.split(" ").map((p) => {
          return (
            <b
              className={`${styles.underline} ${
                props.revealed ? styles.show : ""
              }`}
            >
              {p}
            </b>
          );
        }),
        " "
      );
    }
  });

  return (
    <div className={`${styles.sentence} ${props.odd ? styles.odd : ""}`}>
      {bolded}
    </div>
  );
};
