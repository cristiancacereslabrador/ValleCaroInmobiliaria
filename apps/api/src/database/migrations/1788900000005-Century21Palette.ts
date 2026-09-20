import { MigrationInterface, QueryRunner } from 'typeorm';

export class Century21Palette1788900000005 implements MigrationInterface {
  name = 'Century21Palette1788900000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`broker_settings\` MODIFY COLUMN \`primary_color\` varchar(16) NOT NULL DEFAULT '#BEAF87'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`broker_settings\` MODIFY COLUMN \`secondary_color\` varchar(16) NOT NULL DEFAULT '#121212'`,
    );
    await queryRunner.query(`
      UPDATE \`broker_settings\`
      SET \`primary_color\` = '#BEAF87', \`secondary_color\` = '#121212'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`broker_settings\` MODIFY COLUMN \`primary_color\` varchar(16) NOT NULL DEFAULT '#E11D8A'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`broker_settings\` MODIFY COLUMN \`secondary_color\` varchar(16) NOT NULL DEFAULT '#6D28D9'`,
    );
  }
}
