import { useEffect } from "react";
import styles from "./AboutToStart.module.css";

export const AboutToStart = () => {
  useEffect(() => {
    // play countdown.mp3 when number changes

    setTimeout(() => {
      const countdown = new Audio("/sound/countdown.mp3");
      countdown.play();
    }, 0);

    setTimeout(() => {
      const countdown = new Audio("/sound/countdown.mp3");

      countdown.play();
    }, 1200);

    setTimeout(() => {
      const countdown = new Audio("/sound/countdown.mp3");
      countdown.play();
    }, 2400);

    // play countdown_end.mp3 when number changes
    const countdownEnd = new Audio("/sound/countdown_end.mp3");

    setTimeout(() => {
      countdownEnd.play();
    }, 3900);
  }, []);

  return (
    <div className={styles.aboutToStart}>
      <h1 className={styles.getReady}>Get ready to play!</h1>
      <div className={styles.countdown}>
        <div
          className={styles.countdownNumber}
          style={{ animationDelay: "0s" }}
        >
          3
        </div>
        <div
          className={styles.countdownNumber}
          style={{ animationDelay: "1.2s" }}
        >
          2
        </div>
        <div
          className={styles.countdownNumber}
          style={{ animationDelay: "2.4s" }}
        >
          1
        </div>
      </div>
    </div>
  );
};
