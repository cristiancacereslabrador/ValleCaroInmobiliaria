import { MigrationInterface, QueryRunner } from 'typeorm';

export class FuchsiaPaletteDefault1788900000004 implements MigrationInterface {
  name = 'FuchsiaPaletteDefault1788900000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`broker_settings\` MODIFY COLUMN \`primary_color\` varchar(16) NOT NULL DEFAULT '#E11D8A'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`broker_settings\` MODIFY COLUMN \`secondary_color\` varchar(16) NOT NULL DEFAULT '#6D28D9'`,
    );
    await queryRunner.query(`
      UPDATE \`broker_settings\`
      SET \`primary_color\` = '#E11D8A', \`secondary_color\` = '#6D28D9'
      WHERE \`primary_color\` IN ('#1f6f5c', '#1a3c34', '#1F6F5C')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`broker_settings\` MODIFY COLUMN \`primary_color\` varchar(16) NOT NULL DEFAULT '#1f6f5c'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`broker_settings\` MODIFY COLUMN \`secondary_color\` varchar(16) NOT NULL DEFAULT '#16543f'`,
    );
  }
}
