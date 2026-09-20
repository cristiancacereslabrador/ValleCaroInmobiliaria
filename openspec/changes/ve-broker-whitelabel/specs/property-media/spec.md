## ADDED Requirements

### Requirement: Mutaciones de medios restringidas al staff
Subir, borrar o marcar portada de un medio SHALL exigir sesión de staff. La consulta de medios de una propiedad publicada permanece pública.

#### Scenario: Visitante no puede subir
- **WHEN** un visitante no autenticado intenta subir un archivo a una propiedad
- **THEN** el sistema rechaza la operación

#### Scenario: Staff sube foto
- **WHEN** un staff autenticado sube una foto válida
- **THEN** el sistema la almacena y la asocia a la propiedad

### Requirement: Formatos de captura en celular
El sistema SHALL aceptar fotos HEIC/HEIF (convirtiéndolas a JPEG) y videos MP4, WebM, MOV o M4V, además de JPG, PNG y WebP.

#### Scenario: Foto HEIC de iPhone
- **WHEN** el staff sube una foto `.heic`
- **THEN** el sistema la convierte a JPEG y la asocia a la propiedad

#### Scenario: Video MOV
- **WHEN** el staff sube un video `.mov` válido
- **THEN** el sistema lo almacena como video de la propiedad
