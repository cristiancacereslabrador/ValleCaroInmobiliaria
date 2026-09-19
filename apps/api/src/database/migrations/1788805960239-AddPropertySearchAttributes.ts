import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPropertySearchAttributes1788805960239 implements MigrationInterface {
    name = 'AddPropertySearchAttributes1788805960239'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`properties\` ADD \`has_elevator\` tinyint NULL`);
        await queryRunner.query(`ALTER TABLE \`properties\` ADD \`needs_renovation\` tinyint NULL`);
        await queryRunner.query(`ALTER TABLE \`properties\` ADD \`is_bank_owned\` tinyint NULL`);
        await queryRunner.query(`ALTER TABLE \`properties\` CHANGE \`surface_m2\` \`surface_m2\` decimal(10,2) NULL`);
        await queryRunner.query(`ALTER TABLE \`properties\` CHANGE \`bedrooms\` \`bedrooms\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`properties\` CHANGE \`bathrooms\` \`bathrooms\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`properties\` CHANGE \`floor\` \`floor\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`properties\` CHANGE \`construction_year\` \`construction_year\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`properties\` CHANGE \`status\` \`status\` varchar(100) NULL`);
        await queryRunner.query(`ALTER TABLE \`properties\` CHANGE \`energy_certificate\` \`energy_certificate\` varchar(50) NULL`);
        await queryRunner.query(`ALTER TABLE \`properties\` CHANGE \`address\` \`address\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`properties\` CHANGE \`latitude\` \`latitude\` decimal(10,7) NULL`);
        await queryRunner.query(`ALTER TABLE \`properties\` CHANGE \`longitude\` \`longitude\` decimal(10,7) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`properties\` CHANGE \`longitude\` \`longitude\` decimal(10,7) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`properties\` CHANGE \`latitude\` \`latitude\` decimal(10,7) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`properties\` CHANGE \`address\` \`address\` varchar(255) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`properties\` CHANGE \`energy_certificate\` \`energy_certificate\` varchar(50) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`properties\` CHANGE \`status\` \`status\` varchar(100) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`properties\` CHANGE \`construction_year\` \`construction_year\` int NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`properties\` CHANGE \`floor\` \`floor\` int NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`properties\` CHANGE \`bathrooms\` \`bathrooms\` int NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`properties\` CHANGE \`bedrooms\` \`bedrooms\` int NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`properties\` CHANGE \`surface_m2\` \`surface_m2\` decimal(10,2) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`properties\` DROP COLUMN \`is_bank_owned\``);
        await queryRunner.query(`ALTER TABLE \`properties\` DROP COLUMN \`needs_renovation\``);
        await queryRunner.query(`ALTER TABLE \`properties\` DROP COLUMN \`has_elevator\``);
    }

}
