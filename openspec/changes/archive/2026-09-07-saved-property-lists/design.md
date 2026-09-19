## Context

Capability autocontenida, sin dependencias de otros changes propuestos. Sigue el mismo patrón "sin cuenta, identificado por token" ya usado en `saved-search-alerts`. Ver proposal.md - Why/What Changes.

## Goals / Non-Goals

**Goals:**
- Guardar y compartir selecciones de propiedades sin fricción de registro.

**Non-Goals:**
- No hay noción de "usuario propietario" de una lista más allá de quien conserva su identificador de gestión (igual que las alertas) - perder ese identificador significa perder el control de edición de la lista, aceptado como limitación de este alcance sin cuentas.

## Decisions

### 1. Dos tokens por lista: gestión y solo lectura, ambos UUID aleatorios
`management_token` (para añadir/quitar) y `share_token` (para consulta pública de solo lectura) se generan como UUID v4 independientes en la creación; el frontend guarda el `management_token` en `localStorage` del navegador que creó la lista.
- **Por qué**: separar ambos tokens evita que compartir el enlace de la lista (para que otros la vean) exponga también capacidad de edición.

### 2. `saved_property_list_items` como tabla de relación simple, sin duplicados (constraint único lista+propiedad)
Una restricción única en (`list_id`, `property_id`) resuelve el escenario de "añadir una propiedad ya presente" sin lógica adicional en la aplicación (upsert/ignore).

## Risks / Trade-offs

- [Perder el `management_token` (p. ej. borrar localStorage) significa perder la capacidad de editar la lista] → Mitigación: aceptado como limitación conocida del modelo sin cuentas, igual que en `saved-search-alerts`.

## Open Questions

Ninguna que cambie specs, approach o tasks.
