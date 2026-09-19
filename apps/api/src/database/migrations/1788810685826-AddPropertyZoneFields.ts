import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Nota: `migration:generate` tambien incluia una tanda de
 * `ALTER TABLE properties CHANGE ...` espurios (mismo ruido conocido de
 * TypeORM al diffear columnas nullable sin default explicito, ver
 * AddPropertySearchAttributes/AddSavedPropertyLists). Se eliminaron a mano:
 * esta migracion solo anade las dos columnas nuevas.
 */
export class AddPropertyZoneFields1788810685826 implements MigrationInterface {
    name = 'AddPropertyZoneFields1788810685826'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`properties\` ADD \`city\` varchar(100) NULL`);
        await queryRunner.query(`ALTER TABLE \`properties\` ADD \`postal_code\` varchar(20) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`properties\` DROP COLUMN \`postal_code\``);
        await queryRunner.query(`ALTER TABLE \`properties\` DROP COLUMN \`city\``);
    }

}
