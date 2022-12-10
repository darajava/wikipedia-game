import styles from "./AboutToStart.module.css";

export const AboutToStart = () => {
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
          style={{ animationDelay: "1.5s" }}
        >
          2
        </div>
        <div
          className={styles.countdownNumber}
          style={{ animationDelay: "3s" }}
        >
          1
        </div>
      </div>
    </div>
  );
};
