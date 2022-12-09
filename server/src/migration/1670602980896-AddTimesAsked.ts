import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTimesAsked1670602980896 implements MigrationInterface {
  name = "AddTimesAsked1670602980896";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`question\` ADD \`amountOfTimesAsked\` int NOT NULL DEFAULT '0'`
    );
    await queryRunner.query(
      `ALTER TABLE \`question\` ADD \`amountOfTimesCorrect\` int NOT NULL DEFAULT '0'`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`question\` DROP COLUMN \`amountOfTimesCorrect\``
    );
    await queryRunner.query(
      `ALTER TABLE \`question\` DROP COLUMN \`amountOfTimesAsked\``
    );
  }
}
