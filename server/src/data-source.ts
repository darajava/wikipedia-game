import "reflect-metadata";
import { DataSource } from "typeorm";
import { Question } from "./entity/Question";

export const AppDataSource = new DataSource({
  type: "mysql",
  host: "localhost",
  port: 3306,
  username: "root",
  password: "password",
  database: "wikigame",
  synchronize: true,
  logging: false,
  entities: [Question],
  migrations: [],
  subscribers: [],
});
