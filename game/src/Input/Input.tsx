import styles from "./Input.module.css";

type Props = {
  value: string;
  setValue: (value: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
};

export const Input = (props: Props) => {
  return (
    <input
      className={styles.input}
      onChange={(c) => props.setValue(c.currentTarget.value)}
      value={props.value}
      placeholder={props.placeholder}
      autoFocus={props.autoFocus}
    />
  );
};
