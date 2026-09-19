---
name: project-real-estate-mvp
description: Estado del proyecto TestOpenSpecs - MVP inmobiliario + 9 mejoras incrementales, todo implementado y archivado
metadata:
  type: project
---

El proyecto inmobiliario de prueba en `/var/www/html/TestOpenSpecs` tiene, a fecha 2026-09-07, **10 changes OpenSpec archivados** en `openspec/changes/archive/`:
`real-estate-platform-mvp`, `advanced-search-filters`, `neighborhood-market-insights`, `mortgage-calculator`, `property-virtual-tours`, `saved-property-lists`, `similar-properties`, `commute-search`, `property-valuation-estimator`, `saved-search-alerts`.

Las main specs vivas están en `openspec/specs/` (11 capabilities: property-catalog, property-media, property-geolocation, nearby-services, price-trends, mortgage-calculator, saved-property-lists, similar-properties, commute-search, property-valuation-estimator, saved-search-alerts). Todas validan (`openspec validate --specs`), 0 changes activos, 296/296 tests backend en verde, typecheck limpio en ambas apps.

**Por qué:** el usuario pidió estudiar Idealista/Fotocasa/Pisos.com y "mejorar sustancialmente el proyecto" vía OpenSpec, luego "terminar de implementar todo para que quede 100% funcional". Se implementaron las 9 mejoras en 3 tandas paralelas (agentes en módulos aislados para evitar conflictos de archivos), con archivado inmediato de cada change al completarse.

**Cómo aplicar:** cualquier trabajo futuro sobre este proyecto es un change incremental nuevo. Releer las main specs relevantes en `openspec/specs/` antes de proponer algo para no duplicar. Ver `/var/www/html/TestOpenSpecs/CLAUDE.md` (creado durante esta implementación) para gotchas operativos: `next dev`/`next build` compartidos entre agentes, timezone JS-Date vs MariaDB, ausencia de campo `isActive` en `Property`, `dotenv` fijado, `app.module.ts`/`globals.css` compartidos.

**Estado de acceso/red (importante, no repetir el mismo malentendido):**
- Servidores de desarrollo corriendo en el propio servidor `dashboard`: API en `:3001`, frontend Next.js en `:3002`, MariaDB Docker en `:3307`. Todo sano (verificado con curl y Puppeteer).
- El usuario NO tiene (o no quiere usar) acceso directo de red a este servidor desde su navegador - `localhost:3002` en su mensaje se refiere a SU máquina, no a `dashboard`. Rechazó explícitamente la opción de túnel SSH ("sin conexiones de ssh ni nada complejo").
- Solución aplicada: capturas con Puppeteer headless + Artifact HTML con las imágenes embebidas en base64, publicado en https://claude.ai/code/artifact/4bacce63-2be9-4821-9818-a3c5c89c22a9 (título "Vista Previa Inmobiliaria") - así el usuario ve la app real sin nada de su lado. Ver [[feedback-preview-access]] para el patrón general.
- Pendiente (el usuario dijo "dejalo así por ahora", no seguir insistiendo): si en el futuro quiere interactividad real (clicks, subir fotos, dibujar el mapa), la única vía sin SSH es que él mismo configure un Proxy Host en el Nginx Proxy Manager externo de este servidor apuntando a `192.168.123.250:3002` (frontend) / `192.168.123.250:3001` (API) - el agente no tiene credenciales de ese NPM.

**Estado técnico real dejado por la implementación (verificado, no solo planeado):**
- Backend en `apps/api` (NestJS + TypeORM + mysql2), frontend en `apps/web` (Next.js App Router), monorepo con npm workspaces.
- MariaDB de desarrollo vía `docker-compose.yml` en el **puerto host 3307** (no 3306, el host ya tiene un MariaDB de sistema en 3306).
- Almacenamiento de medios: filesystem local bajo `apps/api/storage/properties/<id>/`, abstraído en `MediaStorageService`.
- Gaps conocidos y aceptados (no arreglar sin que se pida): borrar una propiedad no borra sus archivos físicos de medios; sin campo `isActive`/borrado lógico en `Property`; sin autenticación de usuario en todo el proyecto (alertas/listas usan tokens/email, no cuentas); sin API key real de Google Maps/Places/Distance Matrix configurada (todo se degrada correctamente, pero sin datos reales); SMTP de alertas es de prueba, no real.
- `dotenv` fijado a `^16.4.5` a propósito (ver detalle histórico si hace falta).
- No correr `next build` en `apps/web` mientras un `next dev` compartido esté activo - usar `tsc --noEmit`.

Ver también [[feedback-incremental-progress]] (cómo se reportó el avance) y [[feedback-preview-access]] (cómo se resolvió el acceso sin SSH).
