import styles from "./Logo.module.css";

export const Logo = () => {
  return (
    <div className={styles.logo}>
      <div className={styles.logoText}>WIKI</div>
      <div className={styles.logoBold}>BABY</div>
    </div>
  );
};
