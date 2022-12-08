import styles from "./ProfilePic.module.css";
import CanvasDraw from "react-canvas-draw";
import { useEffect, useRef } from "react";

type Props = {
  immediateLoading: boolean;
  saveData: string;
  width: number;
  fade?: boolean;
  rotate?: boolean;
  margin?: number;
};

const ProfilePic = (props: Props) => {
  const canvasRef = useRef<CanvasDraw>(null);

  useEffect(() => {
    console.log("ProfilePic: useEffect", canvasRef.current);
    if (canvasRef.current) {
      // @ts-ignore
      const container = canvasRef.current.canvasContainer as HTMLDivElement;
      // container.style.width = props.width ? `${props.width}px` : "101%";
      // container.style.height = props.height ? `${props.height}px` : "101%";
    }
  }, [canvasRef.current]);

  return (
    <div
      className={`${styles.profilePic} ${props.fade ? styles.fade : ""} ${
        props.rotate ? styles.rotate : ""
      }`}
      style={{
        zoom: props.width / 400,
        margin: props.margin ? `${props.margin}px` : "0px",
      }}
    >
      <CanvasDraw
        // loadTimeOffset={1}
        saveData={props.saveData}
        immediateLoading={true}
        hideGrid={true}
        hideInterface={true}
        disabled={true}
        ref={canvasRef}
        // canvasWidth={props.width}
        // canvasHeight={props.height}
      />
    </div>
  );
};

export default ProfilePic;
