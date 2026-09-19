## Context

Extiende `property-media` (ya implementado en el MVP). Ver proposal.md - Why/What Changes.

## Goals / Non-Goals

**Goals:**
- Añadir un tipo de medio nuevo con un visor 360° interactivo, reutilizando el almacenamiento de medios ya existente.

**Non-Goals:**
- No se genera ni procesa contenido 360° (stitching de fotos, captura con cámara especial) - se asume que la imagen equirectangular ya viene preparada, igual que cualquier otra foto subida.

## Decisions

### 1. `tour360` como nuevo valor del enum `type` de `PropertyMedia`, sin tabla ni almacenamiento nuevo
Se reutiliza exactamente la misma tabla y el mismo `MediaStorageService` ya implementados para fotos/videos, añadiendo `tour360` como tercer valor posible de `type` (además de `photo`/`video`).
- **Por qué**: un tour 360° es, a efectos de almacenamiento, una imagen más; la única diferencia real es cómo se renderiza en el frontend.

### 2. Visor: librería ligera de panorama (Pannellum o equivalente vía CDN/npm)
El frontend usa una librería JS ligera especializada en panoramas equirectangulares para el visor interactivo, en vez de implementar la proyección esférica a mano.
- **Por qué**: es un problema ya resuelto de forma estándar (proyección WebGL/Canvas de una imagen equirectangular); reinventarlo no aporta valor a este proyecto de prueba.

## Risks / Trade-offs

- [Una imagen que no sea realmente equirectangular se vería distorsionada en el visor] → Mitigación: aceptado como limitación de un proyecto de prueba sin validación de contenido de imagen; se documenta en la UI que debe ser una panorámica 360° válida.

## Open Questions

Ninguna que cambie specs, approach o tasks.
