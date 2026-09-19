# Design

## Context

White-label de un solo inquilino sobre el monorepo NestJS + Next.js + MariaDB. Visitantes sin cuenta (se mantiene el modelo de alertas/listas por token). Staff = broker autenticado. Mercado: Venezuela, idioma es-VE, precios en USD, mapa en San Cristóbal.

## Goals / Non-Goals

**Goals:**
- Un broker configura marca y contacto desde `/admin/ajustes` y el sitio público lo refleja.
- El catálogo público no expone CRUD ni inmuebles no publicados.
- El dominio inmobiliario es venezolano; no queda copy ni campos de España.
- El mapa vacío se centra en San Cristóbal, Táchira (`7.7497768`, `-72.2293373`, zoom 13).
- Despliegue documentado en Oracle Cloud Always Free (VM + Docker Compose + volúmenes persistentes para fotos y MariaDB).

**Non-Goals:**
- Multi-tenant SaaS (varios brokers en una sola BD).
- Marketplace de particulares (cualquier usuario publica).
- Leaflet como mapa principal (Google Maps se conserva; OSM queda fuera de este change).
- PWA, WhatsApp Business API oficial, o pasarela de pagos.

## Decisions

### 1. Un tenant por instalación
`broker_settings` es una fila singleton (id fijo). Otro broker = otro deploy. Más simple de vender y de hospedar en una VM gratis.

### 2. Auth solo para staff
JWT en cookie httpOnly `broker_session`. Visitantes siguen sin login. Mutaciones de propiedades/medios/ajustes exigen cookie. `GET /properties` solo lista `listingStatus=published`.

### 3. Quitar, no esconder, España
Se elimina el módulo `mortgage-calculator` (código, tests, UI, env). Se dropean `energy_certificate` e `is_bank_owned`. Los tipos `flat/chalet/attic/duplex` migran a `apartment/quinta/penthouse/townhouse`.

### 4. Taxonomía VE en el enum `type`
`apartment`, `house`, `quinta`, `townhouse`, `penthouse`, `studio`, `commercial`, `warehouse`, `office`, `land`, `farm`.

### 5. Geo estructurada además de `city`
Columnas `state`, `municipality`, `parish`, `urbanization`. `city` se conserva para tendencias de zona. `postalCode` queda opcional (no es eje de búsqueda).

### 6. Centro de mapa
Constante `SAN_CRISTOBAL_CENTER` usada como default de `BrokerSettings.mapCenterLat/Lng` y como fallback de los mapas si aún no hay settings. El broker puede cambiarlo en ajustes.

### 7. WhatsApp como CTA, lead como respaldo
La ficha arma `https://wa.me/<E164>?text=...` con título + URL. `POST /properties/:id/leads` guarda nombre/email/teléfono/mensaje.

### 8. Hosting: Oracle Cloud Always Free
Render/Fly duermen o cobraron el free; Vercel no sirve para Nest + disco de fotos + MariaDB. Oracle Always Free (Ampere A1 + block volume) permite Compose persistente sin caducidad de trial. Guía en `docs/deploy-oracle-cloud.md`.

## Risks / Trade-offs

- [Capacidad ARM de Oracle a veces agotada] → Mitigación: documentar reintento de AD/región y alternativa AMD E2.Micro.
- [CORS + cookies exige origen explícito] → Mitigación: `CORS_ORIGINS` y `credentials: true` en el cliente.
- [Cambio de enum MySQL es frágil] → Mitigación: UPDATE de valores viejos antes del ALTER ENUM.
- [Auth cambia la decisión histórica “sin login”] → Mitigación: login solo staff; clientes sin cuenta.

## Open Questions

Ninguna que bloquee implementación: San Cristóbal es el centro; España se elimina.
