---
name: project_commute-search_change
description: Implementation state of the commute-search OpenSpec change (backend + frontend) as of 2026-09-07 - all 6 tasks done; no live Google API key in sandbox, same known limitation as other Maps-dependent changes.
metadata:
  type: project
---

Implemented tasks.md ids 1.1, 1.2, 2.1, 2.2, 3.1, 4.1 (all groups) for the
`commute-search` OpenSpec change in `/var/www/html/TestOpenSpecs`, built
alongside several other agents working in parallel on other backend
modules (property-valuation-estimator, similar-properties,
saved-search-alerts all landed in `app.module.ts` during this session too).

**Backend**: fully isolated module `apps/api/src/commute-search/`
(transport-mode.enum.ts, bounding-box.util.ts + spec, distance-matrix.service.ts
+ spec, commute-search.service.ts + spec, commute-search.controller.ts,
commute-search.module.ts, dto/query-commute-search.dto.ts,
commute-search-result.interface.ts). Follows the `nearby-services`
precedent: own `TypeOrmModule.forFeature([Property])` (read-only),
imports `GeolocationModule` to reuse `GeocodingService` (unmodified). Did
NOT touch `Property` entity, `properties.controller.ts`,
`properties.service.ts`. Only shared-file edit was one line in
`app.module.ts` (adding the import + module to the array) — collided
harmlessly with 3 other agents' additions to the same array in the same
session, `git`-less repo so no conflict markers, just re-read before the
second edit.

Endpoint: `GET /api/v1/commute-search`, own controller/DTO, NOT an
extension of `GET /api/v1/properties` (isolation instruction from
orchestrator overrode tasks.md's literal "extender el endpoint de listado"
wording — flagged as a judgment call in the final report).

**Key judgment calls (not explicit in design.md/spec.md)**:
- Response shape is a discriminated union `{available:true, properties}` |
  `{available:false, reason:'service-unavailable'}` — copied verbatim from
  `NearbyServicesResult` (nearby-services/nearby-place.interface.ts), which
  already solves the exact same "external Google API degrades gracefully"
  requirement in this codebase. Chose this over throwing a 503
  ServiceUnavailableException so the frontend can show an inline message
  without a generic error page, matching the spec's wording ("permitiendo
  seguir usando el resto de filtros del catálogo").
- "Destino no resoluble" (missing destination OR ungeocodable address) is
  instead a thrown `BadRequestException` (400) — a client input problem,
  distinct from the external-service-degradation path above. Both an
  address `GeocodingService` can't resolve AND a bad/missing destination
  param map to the same 400 message.
- Conservative pre-filter speeds (bounding-box.util.ts): walking 6km/h,
  transit 60km/h, driving 120km/h — picked to be generously ABOVE real
  average speed per mode (design.md explicitly wants the pre-filter to
  never wrongly exclude a real candidate), not tuned to real-world averages.
- DTO accepts `destinationAddress` OR `destinationLat`/`destinationLng`
  (spec says "dirección o coordenadas") — cross-field "at least one
  required" is NOT expressible cleanly with class-validator on two
  independent optional fields, so that check lives in
  `CommuteSearchService.resolveDestination` instead of the DTO.
- DTO replicates a SUBSET of `QueryPropertiesDto`'s catalog filters
  (type/operationType/price range/hasElevator/groundFloor/needsRenovation/
  isBankOwned) to satisfy the "Combinación con otros filtros del catálogo"
  scenario — deliberately excludes `area` (polygon): combining a drawn-area
  filter with a commute-time filter isn't in scope, and the frontend
  disables the map/polygon UI while a commute search is active instead.
- Distance Matrix batching: 25 origins per request (`MAX_ORIGINS_PER_REQUEST`
  in distance-matrix.service.ts) — Google's real per-request cap for
  origins/destinations, chosen defensively since the design doc didn't
  specify a number.

**Frontend**: `apps/web/src/lib/api/commuteSearch.ts` (own types/API call,
mirrors the backend DTO/response), `apps/web/src/components/
CommuteSearchControl.tsx` (controlled-form component, same architecture as
`PropertyFiltersBar`/`ListingMap` — page.tsx owns the actual fetch and
state, the component only emits `onSearch`/`onClear`). `PropertyCard.tsx`
got one new OPTIONAL prop `commuteDurationMinutes` (badge overlay, only
rendered when passed — the other 2 call sites, saved-lists pages, are
unaffected). `app/page.tsx` (the shared catalog page) now branches: when a
commute search is active it calls `searchByCommute(...)` instead of
`listProperties(...)`, forwarding the current `PropertyFiltersBar` filters
(minus `area`) as extra query params, and hides `ListingMap` while active
(judgment call: not spec'd, avoids showing an irrelevant "draw a polygon"
control next to trayecto results).

**Environment limitation (same as neighborhood-market-insights,
[[project_neighborhood-market-insights_change]])**: `GOOGLE_MAPS_SERVER_API_KEY`
is empty in this sandbox's `apps/api/.env`, so a REAL Distance Matrix call
is impossible here. Task 4.1's live/e2e verification was done via curl
against the real running API + real DB rows (create 3 properties at known
distances from Puerta del Sol, delete them after) covering every scenario
that does NOT require an actual Google response: destino ausente (400),
destino no geocodificable (400, same code path Google would hit),
pre-filtro sin candidatas -> vacío sin llamar a la API externa, servicio
no disponible (real code path, since no key = real failure), y
combinación con filtro de catálogo (probado indirectamente: un filtro que
excluye la única candidata en la caja produce `{available:true,
properties:[]}` SIN intentar Distance Matrix, mientras que un filtro que
sí matchea llega hasta `service-unavailable` — confirma que el filtro se
aplica en la consulta SQL antes de tocar el servicio externo). The
"success: durations within max time" classification itself is only
verified via mocked Jest tests (`distance-matrix.service.spec.ts`,
`commute-search.service.spec.ts`), same limitation and same mitigation as
every other Google-Maps-dependent feature in this project.

Full backend suite: 259/259 Jest tests passing after this change
(`cd apps/api && npx jest`). Frontend: `npx tsc --noEmit` clean in
`apps/web`.

See also [[project_saved-property-lists_change]] (shared next-dev/.next
contention — did NOT run `next build`/`rm -rf .next` here, only source
edits + `tsc --noEmit` + curl against the already-running dev servers on
3001/3002, per [[feedback_next_build_vs_shared_dev_server]]).
