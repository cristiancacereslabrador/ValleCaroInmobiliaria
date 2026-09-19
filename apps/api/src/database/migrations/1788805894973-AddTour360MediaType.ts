import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * property-virtual-tours - tasks.md 1.1: añade `tour360` al enum `type` de
 * `property_media` (design.md - Decision 1: mismo almacenamiento que
 * fotos/videos, sin tabla nueva). No toca ninguna otra tabla ni entidad:
 * se recorta a mano el diff generado por `migration:generate`, que además
 * incluía drift de esquema preexistente y ajeno a este cambio en
 * `properties` (fuera de alcance, ver CLAUDE.md de este change).
 */
export class AddTour360MediaType1788805894973 implements MigrationInterface {
    name = 'AddTour360MediaType1788805894973'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`property_media\` CHANGE \`type\` \`type\` enum ('photo', 'video', 'tour360') NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`property_media\` CHANGE \`type\` \`type\` enum ('photo', 'video') NOT NULL`);
    }

}
