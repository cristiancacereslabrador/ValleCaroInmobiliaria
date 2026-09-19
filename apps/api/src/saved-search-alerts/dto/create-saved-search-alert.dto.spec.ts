import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateSavedSearchAlertDto } from './create-saved-search-alert.dto';

/**
 * spec.md, Requirement "Guardar una busqueda con alerta por email",
 * Scenario "Email con formato invalido" (tasks.md 2.1). Se valida usando
 * class-validator directamente (misma ruta que recorre `ValidationPipe` en
 * tiempo de ejecucion), sin necesitar levantar la app completa.
 */
describe('CreateSavedSearchAlertDto', () => {
  it('acepta un email con formato valido y criterios validos', async () => {
    const dto = plainToInstance(CreateSavedSearchAlertDto, {
      email: 'persona@example.com',
      criteria: { minPrice: 100000, maxPrice: 200000 },
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('rechaza un email con formato invalido', async () => {
    const dto = plainToInstance(CreateSavedSearchAlertDto, {
      email: 'no-es-un-email',
      criteria: {},
    });

    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'email')).toBe(true);
  });

  it('acepta criterios vacios (alerta sin filtros, coincide con cualquier propiedad)', async () => {
    const dto = plainToInstance(CreateSavedSearchAlertDto, {
      email: 'persona@example.com',
      criteria: {},
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('rechaza un valor invalido dentro de los criterios anidados (whitelist/tipos de QueryPropertiesDto)', async () => {
    const dto = plainToInstance(CreateSavedSearchAlertDto, {
      email: 'persona@example.com',
      criteria: { type: 'no-es-un-tipo-valido' },
    });

    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'criteria')).toBe(true);
  });
});
