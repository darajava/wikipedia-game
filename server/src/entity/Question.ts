import { Entity, PrimaryGeneratedColumn, Column, BaseEntity } from "typeorm";
import { Difficulties } from "types";
import { Model } from "./Model";

@Entity()
export class Question extends Model {
  @Column("longtext")
  questions: string;

  @Column("longtext")
  possibleAnswers: string;

  @Column("longtext")
  link: string;

  @Column("longtext")
  addedBy: string;

  @Column({ default: "Easy" })
  difficulty: Difficulties;
}
