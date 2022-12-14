import styles from "./Button.module.css";

type Props = {
  children: string;
  onClick: () => void;
  secondary?: boolean;
  selected?: boolean;
  pulse?: boolean;
  disabled?: boolean;
};

export const Button = (props: Props) => {
  const click = new Audio("/sound/click.mp3");

  return (
    <button
      disabled={props.disabled}
      className={`${styles.button} ${props.secondary ? styles.secondary : ""} ${
        props.selected ? styles.selected : ""
      }
      ${props.disabled ? styles.disabled : ""}
      ${props.pulse ? styles.pulse : ""}`}
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
