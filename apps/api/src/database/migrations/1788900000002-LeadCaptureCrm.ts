import { MigrationInterface, QueryRunner } from 'typeorm';

export class LeadCaptureCrm1788900000002 implements MigrationInterface {
  name = 'LeadCaptureCrm1788900000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`property_leads\` DROP FOREIGN KEY \`FK_property_leads_property\``);
    await queryRunner.query(
      `ALTER TABLE \`property_leads\` MODIFY COLUMN \`property_id\` varchar(36) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`property_leads\` ADD \`origin\` varchar(32) NOT NULL DEFAULT 'web'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`property_leads\` ADD \`status\` varchar(32) NOT NULL DEFAULT 'nuevo'`,
    );
    await queryRunner.query(`ALTER TABLE \`property_leads\` ADD \`intent\` varchar(32) NULL`);
    await queryRunner.query(`ALTER TABLE \`property_leads\` ADD \`visit_at\` datetime NULL`);
    await queryRunner.query(
      `ALTER TABLE \`property_leads\` ADD CONSTRAINT \`FK_property_leads_property\` FOREIGN KEY (\`property_id\`) REFERENCES \`properties\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `CREATE INDEX \`IDX_property_leads_status\` ON \`property_leads\` (\`status\`)`,
    );
    await queryRunner.query(`ALTER TABLE \`broker_settings\` ADD \`testimonials\` text NULL`);
    await queryRunner.query(`
      UPDATE \`broker_settings\` SET \`testimonials\` = '[{"quote":"Liseth nos acompañó en la compra de la quinta. Clara con planta eléctrica, cisterna y papeles.","author":"Familia M.","place":"Pirineos, San Cristóbal"},{"quote":"Alquilamos el local en menos de dos semanas. Respuesta por WhatsApp el mismo día.","author":"Comerciante R.","place":"Centro"},{"quote":"Vendimos el apartamento con fotos reales y visitas organizadas. Sin rodeos.","author":"Ana G.","place":"La Concordia"}]'
      WHERE \`id\` = 'default' AND (\`testimonials\` IS NULL OR \`testimonials\` = '')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`broker_settings\` DROP COLUMN \`testimonials\``);
    await queryRunner.query(`DROP INDEX \`IDX_property_leads_status\` ON \`property_leads\``);
    await queryRunner.query(`ALTER TABLE \`property_leads\` DROP FOREIGN KEY \`FK_property_leads_property\``);
    await queryRunner.query(`ALTER TABLE \`property_leads\` DROP COLUMN \`visit_at\``);
    await queryRunner.query(`ALTER TABLE \`property_leads\` DROP COLUMN \`intent\``);
    await queryRunner.query(`ALTER TABLE \`property_leads\` DROP COLUMN \`status\``);
    await queryRunner.query(`ALTER TABLE \`property_leads\` DROP COLUMN \`origin\``);
    await queryRunner.query(
      `ALTER TABLE \`property_leads\` MODIFY COLUMN \`property_id\` varchar(36) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`property_leads\` ADD CONSTRAINT \`FK_property_leads_property\` FOREIGN KEY (\`property_id\`) REFERENCES \`properties\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
