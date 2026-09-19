---
name: project_property-valuation-estimator_change
description: Implementation state of the property-valuation-estimator OpenSpec change (backend + frontend) as of 2026-09-07 - all 6 tasks done and verified end-to-end against the real API/DB; change was archived by another process mid-session, checkbox/spec-sync state confirmed intact in the archive.
metadata:
  type: project
---

Implemented tasks.md ids 1.1-4.1 (all 6 tasks) for the
`property-valuation-estimator` OpenSpec change in `/var/www/html/TestOpenSpecs`.
Backend: 259/259 Jest tests passing (`cd apps/api && npx jest`); frontend:
`npx tsc --noEmit` clean. Context: [[project_real-estate-platform-mvp_backend]],
[[project_real-estate-platform-mvp_frontend]], [[project_neighborhood-market-insights_change]]
(this change reuses its `city`/`postalCode` fields and zone-normalization SQL
pattern verbatim).

**Backend**: new isolated module `apps/api/src/property-valuation-estimator/`
— own `TypeOrmModule.forFeature([Property])` (read-only), no import of
`PropertiesModule`, same precedent as `price-trends`/`nearby-services`.
`POST /api/v1/property-valuation-estimator/estimate`. Pure util
`valuation-price-range.util.ts` (`computePercentile` + linear-interpolation
percentile method, `computeValuationPriceRange` = p25/p75 of price/m2 *
input surface). Service builds a QueryBuilder over `Property` with
type/operationType/surface±25%/zone/bedrooms±1 filters, computed
independently for sale and rent, threshold `VALUATION_ESTIMATOR_MIN_COMPARABLES`
(default 3, own env var — did NOT reuse `PRICE_TREND_MIN_PROPERTIES` literally
to keep the module's config self-contained, even though design.md says "mismo
criterio").

**Judgment calls not explicit in design.md/spec.md** (flagged in final
report):
- Zona = "ciudad O código postal, basta uno" (spec's rejection scenario only
  requires tipo+zona+superficie, not both city AND postalCode together) —
  different from price-trends, which always requires BOTH city+postalCode as
  one combined zone key. Cross-field "at least one of two optional fields"
  rule isn't expressible declaratively with class-validator, so it's a manual
  `BadRequestException` check in the service, not a DTO decorator.
- `status` (estado) is accepted in the DTO/response `criteria` (spec lists it
  as one of the input "características") but is explicitly NOT used as a
  comparable-selection filter — design.md's Decision 1 algorithm literally
  only lists tipo/zona/superficie/habitaciones, omitting estado.
- Reused `PropertyType` enum from `properties/entities` directly in the DTO
  (unlike `mortgage-calculator`, which deliberately uses a local literal to
  stay import-free from `properties/`) — justified because this module
  already depends on the `Property` entity itself via `TypeOrmModule.forFeature`,
  same coupling level as `price-trends`/`nearby-services`.
- `bedrooms` filter (±1) only applied when the request provides it; not
  required, and not defaulted to any value when absent (comparables of any
  bedroom count then qualify).

**Frontend**: new standalone route `apps/web/src/app/valuation/page.tsx` +
`apps/web/src/components/ValuationEstimatorForm.tsx` (does NOT reuse
`PropertyForm` — this doesn't create/edit a catalog property, it's a pure
calculator). API client `apps/web/src/lib/api/propertyValuationEstimator.ts`.
Added a "Estimar valor" nav link in the shared root `layout.tsx` next to
"+ Nueva propiedad", and a handful of new CSS classes appended at the end of
`globals.css` (`.page-subtitle`, `.valuation-result`, `.valuation-range-card`,
etc.) — both are shared files also being edited concurrently by other
parallel agents this session; edits landed cleanly with no conflicts (small,
additive, non-overlapping changes).

**E2E verification (task 4.1)**: real curl flow against the live
`nest start --watch` API + real MariaDB — created 3 flats for sale in a
throwaway city ("ValuationTestCity", 100m², 3 bedrooms, prices
210000/220000/230000 → price/m² 2100/2200/2300), confirmed the endpoint
returns the hand-computed p25/p75 range (215000-225000) with
`comparablesCount:3`, confirmed rent is independently `insufficient-data`
(no rent comparables), confirmed city normalization (trim+lowercase) matches
like price-trends, confirmed bedrooms±1 and surface±25% filters correctly
EXCLUDE non-matching comparables (tested with bedrooms=5 and surfaceM2=300
against the same 3 fixtures → both correctly insufficient). Test data
deleted afterward (204s), re-verified the zone reverts to insufficient-data.

**Notable session event, not a mistake**: partway through this task (after I
had finished and marked 3.1-4.1 done), the entire
`openspec/changes/property-valuation-estimator/` directory disappeared from
under me — a `Read` on `tasks.md` failed with "File does not exist". Another
process (orchestrator or a parallel `openspec-archive-change` run) had
already archived the change to
`openspec/changes/archive/2026-09-07-property-valuation-estimator/` and
synced its spec into `openspec/specs/property-valuation-estimator/` while I
was still doing final verification passes. Checked the archived copy: all 6
of my task checkboxes and their verification notes were preserved intact,
and the synced main spec matched what I'd implemented. Lesson: on this
project, `openspec/changes/<name>/` can vanish mid-session because someone
else finished the archive step concurrently — if a Read/Edit on a change's
own tasks.md/proposal.md suddenly 404s after you know you already wrote
correct final state to it, check `openspec/changes/archive/` before assuming
something broke; don't panic-recreate the file.

**Concurrent multi-agent evidence this session** (consistent with
[[project_mortgage-calculator_change]]'s note): `apps/api/src/app.module.ts`
gained `CommuteSearchModule`/`SimilarPropertiesModule` entries from other
agents between my own edits to that same file; `apps/web/src/app/globals.css`
got a large concurrent CSS block from a `commute-search` agent; a transient
`properties.service.spec.ts` Jest failure (DI error) self-resolved 15s later
on retry, same pattern as before — always re-run once before concluding a
shared-file failure is real.
