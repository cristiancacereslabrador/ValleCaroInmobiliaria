import { MigrationInterface, QueryRunner } from 'typeorm';

export class CapturePortalFeedback1788900000003 implements MigrationInterface {
  name = 'CapturePortalFeedback1788900000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`properties\` ADD \`is_semi_furnished\` tinyint NULL`);
    await queryRunner.query(
      `ALTER TABLE \`broker_settings\` MODIFY COLUMN \`business_name\` varchar(120) NOT NULL DEFAULT 'Portal de captaciones'`,
    );
    await queryRunner.query(`
      UPDATE \`broker_settings\`
      SET \`business_name\` = 'Portal de captaciones'
      WHERE \`business_name\` IN ('Mi Inmobiliaria', 'ValleCaro Inmobiliaria', 'Inmobiliaria')
    `);
    await queryRunner.query(`
      UPDATE \`broker_settings\`
      SET \`slogan\` = 'Portal de captaciones en San Cristóbal, Táchira'
      WHERE \`slogan\` IS NULL OR \`slogan\` = '' OR \`slogan\` LIKE '%Inmobiliaria%'
    `);
    await queryRunner.query(`
      UPDATE \`broker_settings\`
      SET \`footer_legal\` = 'Portal de captaciones · San Cristóbal, Táchira'
      WHERE \`footer_legal\` IS NULL OR \`footer_legal\` = '' OR \`footer_legal\` LIKE '%Inmobiliaria%'
    `);
    await queryRunner.query(`
      UPDATE \`broker_settings\`
      SET \`testimonials\` = REPLACE(\`testimonials\`, 'cisterna', 'tanque de agua')
      WHERE \`testimonials\` LIKE '%cisterna%'
    `);
    await queryRunner.query(`
      UPDATE \`broker_settings\`
      SET \`advisor_title\` = 'Asesora · Century 21'
      WHERE \`advisor_title\` LIKE '%inmobiliaria%'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`properties\` DROP COLUMN \`is_semi_furnished\``);
    await queryRunner.query(
      `ALTER TABLE \`broker_settings\` MODIFY COLUMN \`business_name\` varchar(120) NOT NULL DEFAULT 'Mi Inmobiliaria'`,
    );
  }
}
