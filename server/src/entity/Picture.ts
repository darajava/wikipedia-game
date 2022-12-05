import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BaseEntity,
  Index,
} from "typeorm";
import { Difficulties } from "types";
import { Model } from "./Model";

@Entity()
export class Picture extends Model {
  @PrimaryGeneratedColumn()
  id: number;

  @Column("longtext")
  canvasData: string;

  @Index()
  @Column("varchar", { length: 255 })
  canvasDataHash: string;

  @Column("longtext")
  name: string;

  @Column("boolean", { default: false })
  sfw?: boolean;
}
