import styles from "./Button.module.css";

type Props = {
  children: string;
  onClick: () => void;
  secondary?: boolean;
};

export const Button = (props: Props) => {
  return (
    <button
      className={`${styles.button} ${props.secondary ? styles.secondary : ""}`}
      onClick={props.onClick}
    >
      {props.children}
    </button>
  );
};
