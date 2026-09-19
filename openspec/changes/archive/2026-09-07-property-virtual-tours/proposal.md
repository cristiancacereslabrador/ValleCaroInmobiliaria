## Why

Idealista y Fotocasa ofrecen tours virtuales 360° en la ficha de propiedad, que permiten explorar el interior sin visitarlo en persona. El catálogo actual solo admite fotos y videos planos.

## What Changes

- Se añade un nuevo tipo de medio a la propiedad: "tour virtual" (panorama 360°), referenciado por una URL de imagen equirectangular, visualizable de forma interactiva (zoom/rotación) en la ficha de la propiedad.

## Capabilities

### New Capabilities
<!-- Ninguna: extiende una capability ya existente. -->

### Modified Capabilities
- `property-media`: se añade un nuevo tipo de medio ("tour virtual 360°") además de foto y video, con su propio visor interactivo en el frontend.

## Impact

- **Backend**: extensión del enum de tipo de medio en `PropertyMedia` para incluir `tour360`; el archivo se sigue almacenando igual que una foto (imagen equirectangular), sin lógica de procesamiento adicional en el backend.
- **Frontend**: nuevo visor de panorama 360° (librería ligera tipo Pannellum) integrado en la galería de la ficha de propiedad.
- **Base de datos**: ninguna migración de esquema más allá de ampliar el enum de tipo ya existente en `property_media`.
- **Limitación aceptada**: para un proyecto de prueba, no se genera contenido 360° real automáticamente - se sube como una imagen equirectangular ya preparada (de demostración o real si el usuario la tiene), igual que cualquier otra foto.
