import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1788796526529 implements MigrationInterface {
    name = 'InitSchema1788796526529'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`property_media\` (\`id\` varchar(36) NOT NULL, \`property_id\` varchar(36) NOT NULL, \`type\` enum ('photo', 'video') NOT NULL, \`url\` varchar(500) NOT NULL, \`is_cover\` tinyint NOT NULL DEFAULT 0, \`position\` int NOT NULL DEFAULT '0', \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`properties\` (\`id\` varchar(36) NOT NULL, \`type\` enum ('flat', 'house', 'chalet', 'attic', 'duplex', 'commercial', 'land') NOT NULL, \`operation_type\` enum ('sale', 'rent') NOT NULL, \`price\` decimal(12,2) NOT NULL, \`surface_m2\` decimal(10,2) NULL, \`bedrooms\` int NULL, \`bathrooms\` int NULL, \`floor\` int NULL, \`construction_year\` int NULL, \`status\` varchar(100) NULL, \`energy_certificate\` varchar(50) NULL, \`address\` varchar(255) NULL, \`latitude\` decimal(10,7) NULL, \`longitude\` decimal(10,7) NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`property_media\` ADD CONSTRAINT \`FK_8f44a07b8e344393e360b2dd808\` FOREIGN KEY (\`property_id\`) REFERENCES \`properties\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`property_media\` DROP FOREIGN KEY \`FK_8f44a07b8e344393e360b2dd808\``);
        await queryRunner.query(`DROP TABLE \`properties\``);
        await queryRunner.query(`DROP TABLE \`property_media\``);
    }

}
