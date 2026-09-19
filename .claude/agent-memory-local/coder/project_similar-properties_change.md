---
name: project_similar-properties_change
description: similar-properties change state — isolated module; no active/inactive concept exists on Property, so "propiedades activas" filter is a no-op beyond self-exclusion
metadata:
  type: project
---

Implemented `similar-properties` fully (backend + frontend), all tasks 1.1-3.1 marked done in openspec/changes/similar-properties/tasks.md.

**Key finding reusable across the project**: the `Property` entity (apps/api/src/properties/entities/property.entity.ts) has NO active/inactive/draft/soft-delete concept anywhere in the codebase — `remove()` in properties.service.ts is a hard DELETE, and `status` is free text (e.g. "buen estado"), not a lifecycle state. Any future spec that says "propiedades activas" (this one, and likely others) can only mean "todas las propiedades existentes en el catálogo" — grepped `isActive|active` across apps/api/src and found nothing. Worth folding into CLAUDE.md if another change hits the same ambiguity.

Backend: apps/api/src/similar-properties/ (module/controller/service + specs), own `TypeOrmModule.forFeature([Property])`, own controller `@Controller('properties/:id/similar')` — same isolation pattern as price-trends/nearby-services (registered in app.module.ts, did not touch properties.controller.ts/service.ts). Reused `pickCoverPhotoUrl` (property-media/cover-photo.util.ts) and `haversineDistanceMeters` (geolocation/haversine.util.ts) — both are pure, dependency-free utils explicitly designed for cross-module reuse.

Judgment calls made (documented in code comments too):
- Reference property missing surfaceM2 or bedrooms → skip that specific filter criterion instead of excluding everything (no ±20% of null).
- Candidates without coordinates, when reference has coordinates: kept at the end of the result (not excluded) since spec says "prioriza" not "excluye".
- Candidate pool size = limit × 5 (design.md's own example ratio, 30 for default 6), hardcoded constant, not configurable (only the final limit is, via `SIMILAR_PROPERTIES_LIMIT` env, matching the ConfigService pattern used by price-trends' `PRICE_TREND_MIN_PROPERTIES`).

Frontend: apps/web/src/lib/api/similarProperties.ts (own file, mirrors priceTrends.ts pattern) + apps/web/src/components/SimilarPropertiesSection.tsx, wired into apps/web/src/app/properties/[id]/page.tsx (one import + one JSX line, minimal diff). Reused the existing `PropertyCard` component as-is (already shows cover/price/type and is a navigable Link) instead of duplicating card markup — it already matched the spec's card requirements exactly.

Verified end-to-end against the live shared dev DB (api :3001, web :3002 already running from other agents) by creating throwaway test properties via POST /api/v1/properties, confirming exact expected ordering (near-coords < far-coords < no-coords, non-matching type/operation/surface excluded), then DELETEing only the properties I created afterward. No headless browser available in this environment (confirmed again: no puppeteer, no chromium binary) — frontend verification relied on tsc --noEmit, dev-server compile logs (no errors for the new component), and confirming via curl that the client-rendered detail page returns 200 (SSR only ever emits the "Cargando..." loading shell for this page — true for every section, not specific to mine).
