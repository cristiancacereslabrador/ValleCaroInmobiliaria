import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

/**
 * spec.md, Requirement "Crear una lista de propiedades guardadas": el unico
 * dato de entrada es el nombre de la lista.
 */
export class CreateSavedPropertyListDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;
}
