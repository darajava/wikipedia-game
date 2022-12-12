import styles from "./Button.module.css";

type Props = {
  children: string;
  onClick: () => void;
  secondary?: boolean;
  pulse?: boolean;
};

export const Button = (props: Props) => {
  const click = new Audio("/sound/click.mp3");

  return (
    <button
      className={`${styles.button} ${props.secondary ? styles.secondary : ""} ${
        props.pulse ? styles.pulse : ""
      }`}
      onClick={() => {
        if (!props.secondary) {
          // click.play();
        }
        props.onClick();
      }}
    >
      {props.children}
    </button>
  );
};
