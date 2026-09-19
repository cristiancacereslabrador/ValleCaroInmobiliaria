import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Nota: el `migration:generate` inicial tambien incluia una tanda de
 * `ALTER TABLE properties CHANGE ...` espurios (ruido conocido de TypeORM al
 * diffear columnas nullable sin default explicito tras las migraciones
 * concurrentes de otro change sobre `properties`), sin relacion con
 * `saved-property-lists`. Se eliminaron a mano: esta migracion solo crea las
 * dos tablas nuevas de este modulo, sin tocar `properties`.
 */
export class AddSavedPropertyLists1788806024924 implements MigrationInterface {
    name = 'AddSavedPropertyLists1788806024924'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`saved_property_list_items\` (\`id\` varchar(36) NOT NULL, \`list_id\` varchar(36) NOT NULL, \`property_id\` varchar(36) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), UNIQUE INDEX \`UQ_saved_property_list_item_list_property\` (\`list_id\`, \`property_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`saved_property_lists\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(150) NOT NULL, \`management_token\` varchar(36) NOT NULL, \`share_token\` varchar(36) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_1b8e00a782b649a5daebe196bd\` (\`management_token\`), UNIQUE INDEX \`IDX_919088bb1290a1a4fa429d2fa9\` (\`share_token\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`saved_property_list_items\` ADD CONSTRAINT \`FK_b77a81491d55b02c37a7d803540\` FOREIGN KEY (\`list_id\`) REFERENCES \`saved_property_lists\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`saved_property_list_items\` ADD CONSTRAINT \`FK_ec42984f4979d5e4caf259f9082\` FOREIGN KEY (\`property_id\`) REFERENCES \`properties\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`saved_property_list_items\` DROP FOREIGN KEY \`FK_ec42984f4979d5e4caf259f9082\``);
        await queryRunner.query(`ALTER TABLE \`saved_property_list_items\` DROP FOREIGN KEY \`FK_b77a81491d55b02c37a7d803540\``);
        await queryRunner.query(`DROP INDEX \`IDX_919088bb1290a1a4fa429d2fa9\` ON \`saved_property_lists\``);
        await queryRunner.query(`DROP INDEX \`IDX_1b8e00a782b649a5daebe196bd\` ON \`saved_property_lists\``);
        await queryRunner.query(`DROP TABLE \`saved_property_lists\``);
        await queryRunner.query(`DROP INDEX \`UQ_saved_property_list_item_list_property\` ON \`saved_property_list_items\``);
        await queryRunner.query(`DROP TABLE \`saved_property_list_items\``);
    }

}
