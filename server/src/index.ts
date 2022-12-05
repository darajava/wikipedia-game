import "reflect-metadata";

import { AppDataSource } from "./data-source";
import { Question } from "./entity/Question";
import express from "express";
import cors from "cors";
import main from "./routes/main";
require("dotenv").config();
import fetch from "node-fetch";

import init from "./ws/game";

global.fetch = fetch;

AppDataSource.initialize()
  .then(async () => {
    console.log("Connected to database");
    const app = express();

    app.use(cors());

    app.use(express.json({ limit: "50mb" }));

    app.use(main);

    app.listen(3211, () => {
      console.log("listening on 3211!");
    });

    // initialize websocket server
    init();
  })
  .catch((error) => console.log(error));
