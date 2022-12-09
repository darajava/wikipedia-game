import { MigrationInterface, QueryRunner } from "typeorm";

export class Initial1670602748445 implements MigrationInterface {
  name = "Initial1670602748445";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`picture\` (\`id\` int NOT NULL AUTO_INCREMENT, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`canvasData\` longtext NOT NULL, \`canvasDataHash\` varchar(255) NOT NULL, \`name\` longtext NOT NULL, \`sfw\` tinyint NOT NULL DEFAULT 0, INDEX \`IDX_31ccf37c74bae202e771c0c2a3\` (\`id\`), INDEX \`IDX_df7bd821c00fb196d767b0253d\` (\`canvasDataHash\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`
    );
    await queryRunner.query(
      `CREATE TABLE \`question\` (\`id\` int NOT NULL AUTO_INCREMENT, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`questions\` longtext NOT NULL, \`possibleAnswers\` longtext NOT NULL, \`link\` longtext NOT NULL, \`addedBy\` longtext NOT NULL, \`difficulty\` varchar(255) NOT NULL DEFAULT 'Easy', INDEX \`IDX_21e5786aa0ea704ae185a79b2d\` (\`id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX \`IDX_21e5786aa0ea704ae185a79b2d\` ON \`question\``
    );
    await queryRunner.query(`DROP TABLE \`question\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_df7bd821c00fb196d767b0253d\` ON \`picture\``
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_31ccf37c74bae202e771c0c2a3\` ON \`picture\``
    );
    await queryRunner.query(`DROP TABLE \`picture\``);
  }
}
