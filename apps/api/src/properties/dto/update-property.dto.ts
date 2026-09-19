import { PartialType } from '@nestjs/mapped-types';
import { CreatePropertyDto } from './create-property.dto';

/**
 * property-catalog spec, Requirement "Editar propiedad inmobiliaria": todos
 * los campos son opcionales en edicion (solo se validan/actualizan los que
 * se envian), pero mantienen las mismas reglas de validacion que en la
 * creacion cuando estan presentes.
 */
export class UpdatePropertyDto extends PartialType(CreatePropertyDto) {}
