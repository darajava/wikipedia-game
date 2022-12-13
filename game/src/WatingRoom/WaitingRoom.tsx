import { useEffect, useState } from "react";
import { GameState, Player, Question } from "types";
import styles from "./WaitingRoom.module.css";
import CanvasDraw from "react-canvas-draw";
import useLocalStorage from "../hooks/useLocalStorage";
import ProfilePic from "../ProfilePic/ProfilePic";
import { Button } from "../Button/Button";

type Props = {
  gameState: GameState;
  host: boolean;
  startGame: () => void;
  sendChat: (message: string) => void;
  chatMessages: { playerId: string; message: string }[];
};

const WaitingRoom = (props: Props) => {
  const [canvases, setCanvases] = useState<{ [key: string]: string }>({});

  const [savedCanvases, setSavedCanvases] = useLocalStorage<{
    [key: string]: string;
  }>("savedCanvases", {});

  const [playerId] = useLocalStorage<string>("playerId", "");

  useEffect(() => {
    const canvases1 = savedCanvases;

    let result: { [key: string]: string } = {};
    // loop
    for (const player of props.gameState.players) {
      if (canvases1[player.canvasDataHash]) {
        result[player.canvasDataHash] = canvases1[player.canvasDataHash];
      }
    }

    setCanvases(result);
    // setTest("test2");
  }, [savedCanvases, props.gameState.players]);

  // play click when players.length changes
  useEffect(() => {
    const click = new Audio("/sound/click.mp3");
    click.play();
  }, [props.gameState.players.length]);

  const [questions, setQuestions] = useState<string[]>([]);

  let topContent = <>Waiting for more players...</>;

  if (props.gameState.players.length > 1) {
    if (props.host) {
      topContent = (
        <Button pulse onClick={props.startGame}>
          Start!
        </Button>
      );
    } else {
      // get host's name
      const host = props.gameState.players.find(
        (player) => player.isHost
      )?.name;

      if (host) {
        topContent = (
          <p>
            Waiting for <b>{host}</b> to start the game...
          </p>
        );
      } else {
        topContent = <p>Waiting for host to start the game...</p>;
      }
    }
  }

  const [copiedText, setCopiedText] = useState(false);
  const [chat, setChat] = useState<string>("");

  let shareContent = <></>;

  // if there are less than 4 players
  if (props.gameState.players.length < 4) {
    shareContent = (
      <div className={styles.share}>
        {/* You can play with up to 4 players, share this link to invite people */}
        You can play Wikibaby with up to 4 people. Copy this link to invite
        players:
        <div
          className={styles.shareInput}
          onClick={() => {
            // get my name
            const myName = props.gameState.players.find(
              (player) => player.id === playerId
            )?.name;

            navigator.clipboard.writeText(`You've been invited ${
              myName ? `by ${myName} ` : ""
            }to play a game of Wikibaby!

Click here to join: ${window.location.href}`);
            setCopiedText(true);
            setTimeout(() => {
              setCopiedText(false);
            }, 3000);
          }}
        >
          {window.location.href.replace("http://", "").replace("https://", "")}{" "}
          📋
          {copiedText && (
            <div className={styles.copied}>Copied to clipboard! ✅</div>
          )}
        </div>
        {/* copied */}
      </div>
    );
  }

  return (
    <div className={styles.waitingRoom}>
      <h1>Lobby</h1>
      <div className={styles.bottomContent}>{topContent}</div>
      {shareContent}

      <div className={styles.playersHolder}>
        {props.gameState.players.map((player, index) => {
          // crown emoji
          const crown = "👑";

          return (
            <>
              <div className={styles.canvasContainer} key={index}>
                {/* <div className={styles.crown}>{player?.isHost ? crown : ""}</div> */}

                {props.chatMessages
                  .filter((message) => message.playerId === player.id)
                  .map((message, chatIndex) => {
                    return (
                      <div
                        className={`${styles.chatMessage} ${
                          message.message.trim().endsWith("!!!")
                            ? styles.biggest
                            : message.message.trim().endsWith("!!")
                            ? styles.bigger
                            : message.message.trim().endsWith("!")
                            ? styles.big
                            : ""
                        }`}
                        key={chatIndex}
                      >
                        {message.message}
                      </div>
                    );
                  })}

                <ProfilePic
                  player={player}
                  width={100}
                  margin={10}
                  immediateLoading={false}
                  rotate
                />
                <div className={styles.name}>{player?.name}</div>
              </div>
            </>
          );
        })}
      </div>
      <input
        value={chat}
        onChange={(e) => {
          // if message longer than 30 characters, don't update
          if (e.target.value.length > 30) return;

          setChat(e.target.value);
        }}
        placeholder="Chat..."
        autoFocus
        className={styles.chatInput}
        onKeyPress={(e) => {
          if (e.key === "Enter") {
            props.sendChat(chat);
            setChat("");
          }
        }}
      />
    </div>
  );
};

export default WaitingRoom;
