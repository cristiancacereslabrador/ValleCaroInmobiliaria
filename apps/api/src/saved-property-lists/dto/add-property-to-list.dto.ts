import { IsNotEmpty, IsUUID } from 'class-validator';

/**
 * spec.md, Requirement "Añadir y quitar propiedades de una lista": se
 * identifica la propiedad del catalogo a añadir por su id (uuid de
 * `Property`).
 */
export class AddPropertyToListDto {
  @IsUUID()
  @IsNotEmpty()
  propertyId: string;
}
