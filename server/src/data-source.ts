import "reflect-metadata";
import { DataSource } from "typeorm";
import { Question } from "./entity/Question";
require("dotenv").config();

export const AppDataSource = new DataSource({
  type: "mysql",
  host: "localhost",
  port: 3306,
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  synchronize: true,
  logging: false,
  entities: [Question],
  migrations: [],
  subscribers: [],
});
