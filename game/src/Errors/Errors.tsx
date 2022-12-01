import styles from "./Errors.module.css";

type Props = {
  children: string[];
};

const Errors = (props: Props) => {
  return (
    <div className={styles.errors}>
      {props.children.map((error, index) => (
        <div key={index} className={styles.error}>
          {error}
        </div>
      ))}
    </div>
  );
};

export default Errors;
