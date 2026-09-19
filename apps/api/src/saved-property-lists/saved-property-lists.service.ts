import { randomUUID } from 'crypto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SavedPropertyList } from './entities/saved-property-list.entity';
import { SavedPropertyListItem } from './entities/saved-property-list-item.entity';
import { CreateSavedPropertyListDto } from './dto/create-saved-property-list.dto';
import { AddPropertyToListDto } from './dto/add-property-to-list.dto';
import { Property } from '../properties/entities/property.entity';
import { pickCoverPhotoUrl } from '../property-media/cover-photo.util';

/** Propiedad tal y como se devuelve embebida en una lista (mismo contrato que PropertiesService: entidad + coverPhotoUrl calculado). */
export type SavedListProperty = Property & { coverPhotoUrl: string | null };

/** spec.md, Requirement "Consultar una lista en modo gestión": incluye ambos identificadores. */
export interface ManagementListView {
  id: string;
  name: string;
  managementToken: string;
  shareToken: string;
  properties: SavedListProperty[];
  createdAt: Date;
  updatedAt: Date;
}

/** spec.md, Requirement "Consultar una lista compartida en modo solo lectura": nunca incluye managementToken. */
export interface PublicListView {
  name: string;
  properties: SavedListProperty[];
}

const LIST_RELATIONS = {
  items: { property: { media: true } },
} as const;

const LIST_ITEMS_ORDER = { items: { createdAt: 'ASC' as const } };

@Injectable()
export class SavedPropertyListsService {
  constructor(
    @InjectRepository(SavedPropertyList)
    private readonly listsRepository: Repository<SavedPropertyList>,
    @InjectRepository(SavedPropertyListItem)
    private readonly itemsRepository: Repository<SavedPropertyListItem>,
    @InjectRepository(Property)
    private readonly propertiesRepository: Repository<Property>,
  ) {}

  /**
   * spec.md, Requirement "Crear una lista de propiedades guardadas":
   * `managementToken` y `shareToken` son UUID v4 independientes
   * (design.md - Decision 1), generados en la aplicacion (no son columnas
   * `PrimaryGeneratedColumn`).
   */
  async create(dto: CreateSavedPropertyListDto): Promise<ManagementListView> {
    const list = this.listsRepository.create({
      name: dto.name,
      managementToken: randomUUID(),
      shareToken: randomUUID(),
    });

    const saved = await this.listsRepository.save(list);
    saved.items = [];
    return this.toManagementView(saved);
  }

  /** spec.md, Requirement "Consultar una lista en modo gestión". */
  async findByManagementToken(managementToken: string): Promise<ManagementListView> {
    const list = await this.findListByManagementTokenOrFail(managementToken);
    return this.toManagementView(list);
  }

  /** spec.md, Requirement "Consultar una lista compartida en modo solo lectura". */
  async findByShareToken(shareToken: string): Promise<PublicListView> {
    const list = await this.listsRepository.findOne({
      where: { shareToken },
      relations: LIST_RELATIONS,
      order: LIST_ITEMS_ORDER,
    });

    if (!list) {
      throw new NotFoundException('No existe ninguna lista con ese enlace de solo lectura');
    }

    return this.toPublicView(list);
  }

  /**
   * spec.md, Requirement "Añadir y quitar propiedades de una lista",
   * Scenario "Añadir una propiedad existente" y "Añadir una propiedad ya
   * presente en la lista": el INSERT IGNORE (design.md - Decision 2) resuelve
   * el duplicado sin logica adicional, dejando la lista sin cambios si la
   * propiedad ya estaba incluida.
   */
  async addProperty(
    managementToken: string,
    dto: AddPropertyToListDto,
  ): Promise<ManagementListView> {
    const list = await this.findListByManagementTokenOrFail(managementToken);

    const property = await this.propertiesRepository.findOne({ where: { id: dto.propertyId } });
    if (!property) {
      throw new NotFoundException(`No existe ninguna propiedad con id "${dto.propertyId}"`);
    }

    await this.itemsRepository
      .createQueryBuilder()
      .insert()
      .into(SavedPropertyListItem)
      .values({ listId: list.id, propertyId: dto.propertyId })
      .orIgnore()
      .execute();

    const refreshed = await this.findListByManagementTokenOrFail(managementToken);
    return this.toManagementView(refreshed);
  }

  /** spec.md, Requirement "Añadir y quitar propiedades de una lista", Scenario "Quitar una propiedad de la lista". */
  async removeProperty(managementToken: string, propertyId: string): Promise<void> {
    const list = await this.findListByManagementTokenOrFail(managementToken);
    await this.itemsRepository.delete({ listId: list.id, propertyId });
  }

  /**
   * Busqueda por `managementToken` exclusivamente (nunca por `shareToken`):
   * spec.md, Scenario "Gestión con identificador inválido" y "Intento de
   * modificar la lista desde el identificador de solo lectura" resuelven al
   * mismo caso — un `shareToken` valido no existe en la columna
   * `management_token`, por lo que ambos terminan en el mismo 404 sin
   * distinguir "no existe" de "es el token equivocado" (no filtra
   * informacion sobre si el identificador pertenece a una lista real).
   */
  private async findListByManagementTokenOrFail(managementToken: string): Promise<SavedPropertyList> {
    const list = await this.listsRepository.findOne({
      where: { managementToken },
      relations: LIST_RELATIONS,
      order: LIST_ITEMS_ORDER,
    });

    if (!list) {
      throw new NotFoundException(
        'No existe ninguna lista gestionable con ese identificador de gestión',
      );
    }

    return list;
  }

  private toManagementView(list: SavedPropertyList): ManagementListView {
    return {
      id: list.id,
      name: list.name,
      managementToken: list.managementToken,
      shareToken: list.shareToken,
      properties: (list.items ?? []).map((item) => this.withCoverPhoto(item.property)),
      createdAt: list.createdAt,
      updatedAt: list.updatedAt,
    };
  }

  private toPublicView(list: SavedPropertyList): PublicListView {
    return {
      name: list.name,
      properties: (list.items ?? []).map((item) => this.withCoverPhoto(item.property)),
    };
  }

  private withCoverPhoto(property: Property): SavedListProperty {
    return {
      ...property,
      coverPhotoUrl: pickCoverPhotoUrl(property.media ?? []),
    };
  }
}
