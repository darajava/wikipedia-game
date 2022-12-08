import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export const GameOver = () => {
  let navigate = useNavigate();

  useEffect(() => {
    navigate("/", { replace: true });
  }, []);

  return <h1>Game Over!</h1>;
};
