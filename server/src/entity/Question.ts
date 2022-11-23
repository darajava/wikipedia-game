import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class Question {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  question: string;

  @Column()
  possibleAnswers: string;

  @Column()
  link: string;

  @Column()
  difficulty: "Easy" | "Medium" | "Hard" | "Insane";
}
