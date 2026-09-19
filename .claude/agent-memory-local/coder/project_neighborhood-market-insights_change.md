---
name: project_neighborhood-market-insights_change
description: Implementation state of the neighborhood-market-insights OpenSpec change (backend + frontend) as of 2026-09-07 - all 14 tasks done, key judgment calls on price-trends data source and endpoint shapes.
metadata:
  type: project
---

Implemented tasks.md ids 1.1-8.1 (all groups, all 14 tasks) for the
`neighborhood-market-insights` OpenSpec change in
`/var/www/html/TestOpenSpecs`. Backend: 193/193 Jest tests passing
(`cd apps/api && npx jest`); frontend: `npx tsc --noEmit` clean.

**New backend modules** (both follow the `saved-property-lists` precedent of
NOT importing `PropertiesModule`, instead doing their own
`TypeOrmModule.forFeature([Property, ...])` read-only):
- `apps/api/src/nearby-services/` - `NearbyServicesService` calls Google
  Places Nearby Search (`GOOGLE_MAPS_SERVER_API_KEY`, same key as
  Geocoding). "Transporte" has no single Google type, so it's 3 calls
  (`transit_station`/`bus_station`/`subway_station`) merged+deduped by
  `place_id`. Distance isn't returned by Places API - computed with
  `apps/api/src/geolocation/haversine.util.ts` (new pure util, same style as
  `point-in-polygon.util.ts`). Any category HTTP failure collapses the WHOLE
  response to `{available:false, reason:'service-unavailable'}` (not
  partial-per-category) - spec frames the error scenario at "el servicio"
  level, not per-category.
- `apps/api/src/price-trends/` - `PriceTrendsService` + pure
  `computeMonthlyPriceTrend` util (price/m2 per point -> monthly average
  buckets, sorted). Endpoint: `GET /properties/:id/price-trend` (property-
  scoped, resolves zone from the property's own city/postalCode -
  analogous to nearby-services, NOT a generic `?city=&postalCode=` zone
  endpoint - judgment call, see below).

**Entity placement**: `PropertyPriceHistory`
(`apps/api/src/properties/entities/property-price-history.entity.ts`) lives
under `properties/`, not under `price-trends/` - it's populated by
`PropertiesService.update()` (group 2 tasks), while `price-trends` only
*reads* it for zone aggregation (group 4). Registered in both
`PropertiesModule` (write) and `PriceTrendsModule` (read) via their own
separate `TypeOrmModule.forFeature` calls - also added to
`database.module.ts` + `data-source.ts` entities arrays (required for
`migration:generate` to see it).

**Judgment call not explicit in design.md/specs (flagged in final report,
should go in CLAUDE.md/spec clarification if this project continues)**:
price-trends aggregation reads EXCLUSIVELY from `property_price_history`
rows, never from a property's current live price in `properties.price`.
Rationale: the threshold Requirement literally says "propiedades distintas
CON HISTORICO", and the table is literally named
`property_price_history` - "los precios historicos" reads most literally as
"rows in that table". Practical effect: a property that has NEVER had its
price edited contributes ZERO points to its zone's trend (even though its
initial price is real data) until the first price edit creates a history
row. This is a defensible narrow reading but genuinely ambiguous - the
alternative (also treating the current live price as a data point, e.g. at
`createdAt`) would make untouched properties count too. Verified via a full
curl E2E flow that with 3 properties all edited once, the zone trend
appears; a property in a different zone with only 1 edit does NOT meet the
default threshold of 3 alone (needs 3 distinct properties with history in
that exact zone).

**Zone normalization**: `LOWER(TRIM(property.city)) = LOWER(TRIM(:city))`
and `TRIM(property.postalCode) = TRIM(:postalCode)` written directly as
TypeORM QueryBuilder raw-SQL fragments referencing `alias.entityPropertyName`
- confirmed this works against real MariaDB (TypeORM's alias->column
substitution applies even inside SQL functions like `LOWER(TRIM(...))`, not
just bare `.select()`/`.where()` targets). Verified live: created properties
with city `"Madrid"`, `" madrid "`, `"MADRID"` and confirmed they all match
the same zone.

**Surface for price/m2**: only PRICE is historized, not surface. Every
historical point uses the property's CURRENT `surfaceM2` (design.md
literally says "superficie en el momento de ese registro" but surface isn't
tracked over time, so "en el momento" collapses to "current value" - stated
explicitly as a simplification in the util's own doc comment).

**Frontend**: `PropertyForm.tsx` got `city`/`postalCode` optional text
fields (no `required`/asterisk, matching their optional-at-creation spec
status). New components `NearbyServicesSection.tsx` and
`PriceTrendSection.tsx` in the detail page, both self-fetching
(`useEffect` + own loading/unavailable states), same pattern as
`MortgageSimulator.tsx`. **No charting library is installed in apps/web**
(checked package.json: only `@react-google-maps/api`, `pannellum`) - built
a minimal inline-SVG line chart by hand in `PriceTrendSection.tsx` rather
than adding a new npm dependency, consistent with this project's
minimal-dependency style.

**No browser automation available this session** (`claude-in-chrome` skill
reported the extension isn't set up, no puppeteer/playwright/chromium in
the sandbox either) - "verificar manualmente" for tasks 5.1/6.1/7.1 was
done via: `tsc --noEmit` (clean), confirming the shared `next dev` server
(port 3002, log at
`/tmp/claude-0/.../scratchpad/next-dev.log` - this session's OWN scratchpad,
so it's a dev server this same session started earlier) compiles every
touched route with no runtime errors, grepping the compiled
`.next/server/.../page.js` bundle for the new UI strings/API paths to
confirm they're actually wired in, and confirming via direct curl against
the real running API that the exact JSON shapes the new components expect
are what the endpoints actually return. Real interactive click-through
verification was not possible - flag this to the user/orchestrator if
pixel-level UI verification is later required.

**Known, accepted, pre-existing limitation** (not something I introduced):
`GOOGLE_MAPS_SERVER_API_KEY` is empty in this sandbox's `apps/api/.env`
(same as it was for Geocoding before this change). So nearby-services'
"con resultados" / "sin resultados en el radio" scenarios (which need a
live Google Places response) could only be verified via mocked Jest tests
(`nearby-services.service.spec.ts`), not a real end-to-end call - confirmed
live only that "no coordinates" and "no API key -> service-unavailable"
degrade correctly, mirroring how `GeocodingService` already behaves without
a key.

**E2E verification (task 8.1)**: full curl-driven flow - 3 properties in
Madrid/28013 (one with coordinates), price edits generating history,
`price-trend` insufficient->sufficient transition, `no-zone` for a property
without city/postalCode, `nearby-services` no-coordinates/service-
unavailable, 404s on all 3 new endpoints for an unknown id. Test data
cleaned up afterward (cascade-deleted `property_price_history` rows too,
confirmed FK `ON DELETE CASCADE` works).

See also [[project_real-estate-platform-mvp_backend]],
[[project_real-estate-platform-mvp_frontend]],
[[feedback_npm_workspace_hoisting_and_typeorm_cli]] (same migration-generate
spurious-CHANGE-column noise pattern recurred twice more here, cleaned by
hand each time, same as always).
