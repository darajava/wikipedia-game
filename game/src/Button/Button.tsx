import styles from "./Button.module.css";

type Props = {
  children: string;
  onClick: () => void;
};

export const Button = (props: Props) => {
  return (
    <button className={styles.button} onClick={props.onClick}>
      {props.children}
    </button>
  );
};
