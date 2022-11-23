import { AppDataSource } from "./data-source";
import { Question } from "./entity/Question";
import express from "express";
import cors from "cors";
import main from "./routes/main";

AppDataSource.initialize()
  .then(async () => {
    console.log("Connected to database");
    const app = express();

    app.use(cors());

    app.use(express.json({ limit: "50mb" }));

    app.use(main);

    app.listen(3211, () => {
      console.log("listening!");
    });
  })
  .catch((error) => console.log(error));
