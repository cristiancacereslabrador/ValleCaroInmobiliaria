import { MigrationInterface, QueryRunner } from 'typeorm';

export class VeBrokerWhitelabel1788900000001 implements MigrationInterface {
  name = 'VeBrokerWhitelabel1788900000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`properties\` MODIFY COLUMN \`type\` enum ('flat','house','chalet','attic','duplex','commercial','land','apartment','quinta','townhouse','penthouse','studio','warehouse','office','farm') NOT NULL`,
    );
    await queryRunner.query(`UPDATE \`properties\` SET \`type\` = 'apartment' WHERE \`type\` = 'flat'`);
    await queryRunner.query(`UPDATE \`properties\` SET \`type\` = 'quinta' WHERE \`type\` = 'chalet'`);
    await queryRunner.query(`UPDATE \`properties\` SET \`type\` = 'penthouse' WHERE \`type\` = 'attic'`);
    await queryRunner.query(`UPDATE \`properties\` SET \`type\` = 'townhouse' WHERE \`type\` = 'duplex'`);
    await queryRunner.query(
      `ALTER TABLE \`properties\` MODIFY COLUMN \`type\` enum ('apartment','house','quinta','townhouse','penthouse','studio','commercial','warehouse','office','land','farm') NOT NULL`,
    );

    await queryRunner.query(
      `ALTER TABLE \`properties\` ADD \`listing_status\` enum ('draft','published','paused') NOT NULL DEFAULT 'published'`,
    );
    await queryRunner.query(`ALTER TABLE \`properties\` ADD \`title\` varchar(150) NULL`);
    await queryRunner.query(`ALTER TABLE \`properties\` ADD \`description\` text NULL`);
    await queryRunner.query(`ALTER TABLE \`properties\` ADD \`land_surface_m2\` decimal(10,2) NULL`);
    await queryRunner.query(`ALTER TABLE \`properties\` ADD \`parking_spaces\` int NULL`);
    await queryRunner.query(`ALTER TABLE \`properties\` ADD \`state\` varchar(80) NULL`);
    await queryRunner.query(`ALTER TABLE \`properties\` ADD \`municipality\` varchar(80) NULL`);
    await queryRunner.query(`ALTER TABLE \`properties\` ADD \`parish\` varchar(80) NULL`);
    await queryRunner.query(`ALTER TABLE \`properties\` ADD \`urbanization\` varchar(120) NULL`);
    await queryRunner.query(`ALTER TABLE \`properties\` ADD \`has_power_plant\` tinyint NULL`);
    await queryRunner.query(`ALTER TABLE \`properties\` ADD \`has_cistern\` tinyint NULL`);
    await queryRunner.query(`ALTER TABLE \`properties\` ADD \`has_water_well\` tinyint NULL`);
    await queryRunner.query(`ALTER TABLE \`properties\` ADD \`has_direct_gas\` tinyint NULL`);
    await queryRunner.query(`ALTER TABLE \`properties\` ADD \`has_security\` tinyint NULL`);
    await queryRunner.query(`ALTER TABLE \`properties\` ADD \`is_gated_community\` tinyint NULL`);
    await queryRunner.query(`ALTER TABLE \`properties\` ADD \`is_furnished\` tinyint NULL`);
    await queryRunner.query(`ALTER TABLE \`properties\` ADD \`has_air_conditioning\` tinyint NULL`);
    await queryRunner.query(`ALTER TABLE \`properties\` ADD \`has_pool\` tinyint NULL`);
    await queryRunner.query(`ALTER TABLE \`properties\` ADD \`has_garden\` tinyint NULL`);

    await queryRunner.query(`ALTER TABLE \`properties\` DROP COLUMN \`energy_certificate\``);

    const isBankOwned = await queryRunner.query(
      `SHOW COLUMNS FROM \`properties\` LIKE 'is_bank_owned'`,
    );
    if (isBankOwned.length > 0) {
      await queryRunner.query(`ALTER TABLE \`properties\` DROP COLUMN \`is_bank_owned\``);
    }

    await queryRunner.query(
      `CREATE TABLE \`broker_users\` (\`id\` varchar(36) NOT NULL, \`email\` varchar(180) NOT NULL, \`password_hash\` varchar(120) NOT NULL, \`name\` varchar(120) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_broker_users_email\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );

    await queryRunner.query(
      `CREATE TABLE \`broker_settings\` (\`id\` varchar(36) NOT NULL, \`business_name\` varchar(120) NOT NULL DEFAULT 'Mi Inmobiliaria', \`slogan\` varchar(180) NULL, \`advisor_name\` varchar(120) NULL, \`advisor_title\` varchar(120) NULL, \`logo_url\` varchar(500) NULL, \`photo_url\` varchar(500) NULL, \`whatsapp\` varchar(20) NULL, \`phone\` varchar(30) NULL, \`email\` varchar(180) NULL, \`instagram\` varchar(120) NULL, \`facebook\` varchar(180) NULL, \`tiktok\` varchar(120) NULL, \`office_address\` varchar(255) NULL, \`primary_color\` varchar(16) NOT NULL DEFAULT '#1f6f5c', \`secondary_color\` varchar(16) NOT NULL DEFAULT '#16543f', \`map_center_lat\` decimal(10,7) NOT NULL DEFAULT 7.7497768, \`map_center_lng\` decimal(10,7) NOT NULL DEFAULT -72.2293373, \`map_zoom\` int NOT NULL DEFAULT 13, \`coverage_text\` varchar(255) NULL, \`business_hours\` varchar(180) NULL, \`footer_legal\` varchar(500) NULL, \`about_text\` text NULL, \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );

    await queryRunner.query(
      `CREATE TABLE \`property_leads\` (\`id\` varchar(36) NOT NULL, \`property_id\` varchar(36) NOT NULL, \`name\` varchar(120) NOT NULL, \`email\` varchar(180) NULL, \`phone\` varchar(30) NULL, \`message\` varchar(1000) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`), INDEX \`IDX_property_leads_property\` (\`property_id\`), CONSTRAINT \`FK_property_leads_property\` FOREIGN KEY (\`property_id\`) REFERENCES \`properties\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION) ENGINE=InnoDB`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`property_leads\``);
    await queryRunner.query(`DROP TABLE \`broker_settings\``);
    await queryRunner.query(`DROP TABLE \`broker_users\``);
    await queryRunner.query(`ALTER TABLE \`properties\` ADD \`energy_certificate\` varchar(50) NULL`);
    await queryRunner.query(`ALTER TABLE \`properties\` ADD \`is_bank_owned\` tinyint NULL`);
    await queryRunner.query(`ALTER TABLE \`properties\` DROP COLUMN \`has_garden\``);
    await queryRunner.query(`ALTER TABLE \`properties\` DROP COLUMN \`has_pool\``);
    await queryRunner.query(`ALTER TABLE \`properties\` DROP COLUMN \`has_air_conditioning\``);
    await queryRunner.query(`ALTER TABLE \`properties\` DROP COLUMN \`is_furnished\``);
    await queryRunner.query(`ALTER TABLE \`properties\` DROP COLUMN \`is_gated_community\``);
    await queryRunner.query(`ALTER TABLE \`properties\` DROP COLUMN \`has_security\``);
    await queryRunner.query(`ALTER TABLE \`properties\` DROP COLUMN \`has_direct_gas\``);
    await queryRunner.query(`ALTER TABLE \`properties\` DROP COLUMN \`has_water_well\``);
    await queryRunner.query(`ALTER TABLE \`properties\` DROP COLUMN \`has_cistern\``);
    await queryRunner.query(`ALTER TABLE \`properties\` DROP COLUMN \`has_power_plant\``);
    await queryRunner.query(`ALTER TABLE \`properties\` DROP COLUMN \`urbanization\``);
    await queryRunner.query(`ALTER TABLE \`properties\` DROP COLUMN \`parish\``);
    await queryRunner.query(`ALTER TABLE \`properties\` DROP COLUMN \`municipality\``);
    await queryRunner.query(`ALTER TABLE \`properties\` DROP COLUMN \`state\``);
    await queryRunner.query(`ALTER TABLE \`properties\` DROP COLUMN \`parking_spaces\``);
    await queryRunner.query(`ALTER TABLE \`properties\` DROP COLUMN \`land_surface_m2\``);
    await queryRunner.query(`ALTER TABLE \`properties\` DROP COLUMN \`description\``);
    await queryRunner.query(`ALTER TABLE \`properties\` DROP COLUMN \`title\``);
    await queryRunner.query(`ALTER TABLE \`properties\` DROP COLUMN \`listing_status\``);
  }
}
