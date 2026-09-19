import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Nota: `migration:generate` tambien incluia la tanda de
 * `ALTER TABLE properties CHANGE ...` espurios de siempre (mismo ruido
 * conocido de TypeORM al diffear columnas nullable sin default explicito,
 * ver AddPropertySearchAttributes/AddPropertyZoneFields/
 * AddSavedPropertyLists). Se eliminaron a mano: esta migracion solo crea la
 * tabla nueva `saved_search_alerts`, sin tocar `properties`.
 */
export class AddSavedSearchAlerts1788812919925 implements MigrationInterface {
    name = 'AddSavedSearchAlerts1788812919925'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`saved_search_alerts\` (\`id\` varchar(36) NOT NULL, \`email\` varchar(255) NOT NULL, \`criteria\` json NOT NULL, \`status\` enum ('pending', 'active', 'unsubscribed') NOT NULL DEFAULT 'pending', \`confirmation_token\` varchar(36) NOT NULL, \`confirmation_expires_at\` datetime NOT NULL, \`unsubscribe_token\` varchar(36) NOT NULL, \`request_ip\` varchar(45) NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_5389eb71dc88ff4f33e979d5d2\` (\`confirmation_token\`), UNIQUE INDEX \`IDX_af315865b936bcb0d664e44074\` (\`unsubscribe_token\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`IDX_af315865b936bcb0d664e44074\` ON \`saved_search_alerts\``);
        await queryRunner.query(`DROP INDEX \`IDX_5389eb71dc88ff4f33e979d5d2\` ON \`saved_search_alerts\``);
        await queryRunner.query(`DROP TABLE \`saved_search_alerts\``);
    }

}
