import styles from "./Sentence.module.css";

import { ScoreUpdateData, Player } from "types";
import { ScoreUpdate } from "../ScoreUpdate/ScoreUpdate";

type Props = {
  sentence: string;
  revealed: boolean;
  odd?: boolean;
  showSome?: boolean;
};

export const Sentence = (props: Props) => {
  const cleanedUpSentence = props.sentence
    .replace(/'''''/g, "BOLD")
    .replace(/'''/g, "BOLD")
    .replace(/''/g, "ITALIC");

  const boldparts = cleanedUpSentence.split(/BOLD/g);

  const bolded = boldparts.map((part, i) => {
    if (i % 2 === 0) {
      return part;
    } else {
      return part.split("").map((p, i) => {
        if (p === " ") {
          return p;
        }

        let show = props.revealed;

        if (props.showSome) {
          show = i % 3 === 0;
        }

        return (
          <b className={`${styles.underline} ${show ? styles.show : ""}`}>
            {p}
          </b>
        );
      });
    }
  });

  const italicparts = bolded.map((part) => {
    if (typeof part === "string") {
      return part.split(/ITALIC/g).map((p, i) => {
        if (i % 2 === 0) {
          return p;
        } else {
          return <i>{p}</i>;
        }
      });
    } else {
      return part;
    }
  });

  return (
    <div className={`${styles.sentence} ${props.odd ? styles.odd : ""}`}>
      {italicparts}
    </div>
  );
};
