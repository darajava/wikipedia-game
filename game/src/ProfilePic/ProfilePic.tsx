import styles from "./ProfilePic.module.css";
import CanvasDraw from "react-canvas-draw";
import { useEffect, useRef, useState } from "react";
import useLocalStorage from "../hooks/useLocalStorage";
import { Player } from "types";

type Props = {
  immediateLoading: boolean;
  width: number;
  player: Player;
  fade?: boolean;
  rotate?: boolean;
  margin?: number;
};

const ProfilePic = (props: Props) => {
  const canvasRef = useRef<CanvasDraw>(null);

  const [savedCanvases, setSavedCanvases] = useLocalStorage<{
    [key: string]: string;
  }>("savedCanvases", {});
  const [myCanvas, setMyCanvas] = useState<string>("");

  useEffect(() => {
    if (props.player.canvasDataHash) {
      setMyCanvas(savedCanvases[props.player.canvasDataHash]);
    }
  }, [savedCanvases, props.player.canvasDataHash]);

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
        saveData={myCanvas}
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
