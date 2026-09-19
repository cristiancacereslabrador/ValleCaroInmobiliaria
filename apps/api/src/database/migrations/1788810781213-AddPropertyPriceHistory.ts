import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Nota: `migration:generate` tambien incluia la misma tanda de
 * `ALTER TABLE properties CHANGE ...` espurios de siempre (ver
 * AddPropertyZoneFields). Se eliminaron a mano: esta migracion solo crea la
 * tabla nueva `property_price_history` y su FK hacia `properties`.
 */
export class AddPropertyPriceHistory1788810781213 implements MigrationInterface {
    name = 'AddPropertyPriceHistory1788810781213'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`property_price_history\` (\`id\` varchar(36) NOT NULL, \`property_id\` varchar(36) NOT NULL, \`price\` decimal(12,2) NOT NULL, \`recorded_at\` datetime NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`property_price_history\` ADD CONSTRAINT \`FK_95ffd9cec7ef2c9b521013555d5\` FOREIGN KEY (\`property_id\`) REFERENCES \`properties\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`property_price_history\` DROP FOREIGN KEY \`FK_95ffd9cec7ef2c9b521013555d5\``);
        await queryRunner.query(`DROP TABLE \`property_price_history\``);
    }

}
