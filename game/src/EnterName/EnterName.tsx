import { useRef, useState } from "react";
import CanvasDraw from "react-canvas-draw";
import { Button } from "../Button/Button";
import useLocalStorage from "../hooks/useLocalStorage";

import styles from "./EnterName.module.css";

type Props = {
  setNameComplete: (nameComplete: boolean) => void;
};

function randomHSL() {
  return "hsla(" + ~~(360 * Math.random()) + "," + "70%," + "60%,1)";
}

export const EnterName = (props: Props) => {
  const [name, setName] = useLocalStorage("name", "");
  const [canvasData, setCanvasData] = useLocalStorage<string>("canvasData", "");

  const [color, setColor] = useState(randomHSL());

  const canvas = useRef<any>(null);

  const initialCanvasData = useRef<string>(canvasData);

  // const canvasData = useRef<string>("");

  return (
    <div className={styles.enterName}>
      <h1>Who are you?</h1>

      <div className={styles.canvasContainer}>
        <CanvasDraw
          ref={canvas}
          loadTimeOffset={0}
          immediateLoading={true}
          brushColor={color}
          saveData={initialCanvasData.current}
          brushRadius={12}
          onChange={() => {
            console.log("canvas changed");
            setColor(randomHSL());
          }}
        />
      </div>
      <input
        type="text"
        value={name}
        onChange={(e) => {
          if (e.target.value.length > 16) {
            return;
          }
          setName(e.target.value);
        }}
        placeholder="Name..."
        className={styles.nameInput}
      />
      <div className={styles.buttons}>
        <div className={styles.button}>
          <Button
            onClick={() => {
              // localStorage.setItem("name", name);
              // props.setNameComplete(true);
              console.log(canvas.current.undo());
            }}
          >
            Undo
          </Button>
        </div>
        <div className={styles.button}>
          <Button
            onClick={() => {
              // localStorage.setItem("name", name);
              // props.setNameComplete(true);
              if (
                window.confirm(
                  "Wait! Are you sure you want to delete your snapsterpiece?"
                )
              ) {
                console.log(canvas.current.clear());
              }
            }}
          >
            Clear
          </Button>
        </div>
        <div className={styles.button}>
          <Button
            onClick={() => {
              // localStorage.setItem("name", name);
              // props.setNameComplete(true);
              let obj = JSON.parse(canvas.current.getSaveData());

              obj.lines.forEach((line: any) => {
                line.points.forEach((point: any) => {
                  point.x = Math.round(point.x);
                  point.y = Math.round(point.y);
                });
              });

              if (obj.lines.length === 0) {
                alert("Please draw yourself!");
                return;
              }

              if (!name || name.length === 0) {
                alert("Please enter a name!");
                return;
              }

              setName(name);
              setCanvasData(JSON.stringify(obj));

              props.setNameComplete(true);
            }}
          >
            Save
          </Button>
        </div>
        {/* <button
          className={styles.button}
          onClick={() => {
            // localStorage.setItem("name", name);
            // props.setNameComplete(true);
            // canvas.current.clear();
            setTimeout(() => {
              setTest(name);
            }, 1000);
          }}
        >
          load
        </button> */}
      </div>
    </div>
  );
};
