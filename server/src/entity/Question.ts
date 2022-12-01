import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";
import { Difficulties } from "types";

@Entity()
export class Question {
  @PrimaryGeneratedColumn()
  id: number;

  @Column("longtext")
  questions: string;

  @Column("longtext")
  possibleAnswers: string;

  @Column()
  link: string;

  @Column()
  addedBy: string;

  @Column({ default: "Easy" })
  difficulty: Difficulties;
}
