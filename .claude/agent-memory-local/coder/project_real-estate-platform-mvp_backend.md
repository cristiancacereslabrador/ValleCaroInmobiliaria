---
name: project_real-estate-platform-mvp_backend
description: Current state of the real-estate-platform-mvp OpenSpec change backend (apps/api) as of 2026-09-07 - what's built, how to run it, what's still pending.
metadata:
  type: project
---

Implemented tasks.md ids 1.1-1.2, 2.1-2.3, 3.1-3.5, 4.1-4.5, 5.1-5.3 (backend groups
1-5) for the `real-estate-platform-mvp` OpenSpec change in
`/var/www/html/TestOpenSpecs`. Task 1.3 was later fully verified (both halves)
once the frontend was built — see [[project_real-estate-platform-mvp_frontend]].

Stack actually in place: NestJS 10 (CommonJS + Jest, not the newer Nest 12/
ESM/vitest scaffold that `npx @nestjs/cli@latest new` produces now — see
[[feedback_nestjs_cli_latest_scaffolds_esm_vitest]]), TypeORM 0.3 + mysql2,
class-validator/class-transformer, @nestjs/config, @nestjs/axios,
@nestjs/serve-static, multer (memoryStorage).

Key files: `apps/api/src/app.module.ts` (wires DatabaseModule +
PropertiesModule + PropertyMediaModule + GeolocationModule + static file
serving at `/media/properties`), `apps/api/src/database/data-source.ts`
(TypeORM CLI datasource — must have exactly ONE DataSource export, named
+ default together breaks `migration:generate`, see
[[feedback_npm_workspace_hoisting_and_typeorm_cli]]).

Business logic notes not obvious from spec text alone (my judgment calls,
should go in the final summary / CLAUDE.md too):
- `status` (condition) and `energyCertificate` are free-text strings, not
  enums — spec only gives examples ("por ejemplo") and has no explicit
  rejection scenario for them, unlike `type` and `operationType` which do.
- Only `type`, `operationType`, `price` are mandatory on create; everything
  else nullable (design.md explicitly says fields that don't apply to a
  given property type stay null).
- `Property` responses include a computed `coverPhotoUrl` (not a DB column)
  via `pickCoverPhotoUrl()` in `apps/api/src/property-media/cover-photo.util.ts`
  — a pure function with no Nest/TypeORM coupling specifically so
  PropertiesService can use it without PropertiesModule depending on
  PropertyMediaModule (which itself depends on PropertiesModule to check
  property existence on upload — avoids a circular module dependency).
- First uploaded photo auto-gets `isCover=true`; deleting the current cover
  photo promotes the next-oldest photo to cover automatically (not an
  explicit spec scenario, but a natural invariant — "if there are photos,
  one should be marked cover").
- Deleting a Property cascades removal of `property_media` rows via DB FK
  (`ON DELETE CASCADE`), but does NOT delete the physical files on disk
  (that only happens through `PropertyMediaService.remove`, which the DB
  cascade bypasses). Known accepted gap for this MVP — orphaned files build
  up under `apps/api/storage/properties/<id>/` after a property delete.
  Would need `PropertiesModule` to depend on `MediaStorageService` (via
  forwardRef, since the module graph already goes
  PropertyMediaModule -> PropertiesModule) to fix properly.

Local dev DB: `docker-compose.yml` at repo root runs MariaDB on **host port
3307** (not 3306) specifically because this host already has a system
MariaDB bound to 127.0.0.1:3306 (see /var/www/html/CLAUDE.md — this is the
shared `dashboard` host). `apps/api/.env.example` points DB_PORT at 3307 to
match.

To run locally: `docker compose up -d mariadb` (repo root) -> `cp
apps/api/.env.example apps/api/.env` -> `cd apps/api && npm run
migration:run` -> `npm run start:dev`. Full Jest suite: `cd apps/api && npx
jest` (52 tests passing as of last run).

**2026-09-07, task 10.1 (end-to-end verification) closed the change.** Found
and fixed one real API contract bug while doing the full curl-driven flow:
`PropertiesService.create()` returned the new Property WITHOUT a `media` key
at all (TypeORM `create()`+`save()` never populates the `media` relation on
a brand-new entity, so it stayed `undefined` and JSON.stringify dropped it),
while `findOne`/`findAll` always include `media` as an array. Fixed with
`saved.media = []` before `withCoverPhoto()` in
`apps/api/src/properties/properties.service.ts`. Didn't break the 52 tests.
No frontend code actually crashed on this (create page only reads
`property.id`; detail page already defended with `data.media ?? []`), but
the typed contract (`apps/web/src/lib/api/types.ts` `Property.media:
PropertyMedia[]`) was genuinely violated — worth remembering as a pattern:
**whenever a NestJS+TypeORM service does `repo.create()` + `repo.save()` and
returns the result directly, any relation fields will be `undefined` unless
manually set/reloaded, even if the same service's read methods always
populate them via `leftJoinAndSelect`/`relations`.** Check for this any time
a create/save response is compared against a read response's shape.

Full E2E flow (both properties, media upload/reject cases, cover
promotion, all filter combos, edit/delete, 404s) verified via real curl
against the running API — see tasks.md 10.1 for the itemized scenario list.
Docker mariadb container `real-estate-mariadb` and the api process were
already running from a prior session when this one started (dashboard host
keeps them up between sessions) — checked with `docker ps` / `pgrep` before
assuming a cold start was needed.

**2026-09-07, `advanced-search-filters` change (backend groups 1-3, all
13 tasks done):** added `hasElevator`/`needsRenovation`/`isBankOwned`
(nullable boolean columns on `properties`, migration
`1788805960239-AddPropertySearchAttributes`) plus filters `hasElevator`,
`groundFloor` (derived from `floor = 0`, not its own column),
`needsRenovation`, `isBankOwned` on `GET /properties`, and area/polygon
search (`area` query param, JSON-encoded array of `{lat,lng}`, validated by
a custom `IsValidPolygon` class-validator decorator requiring >=3 vertices
in range). Point-in-polygon is ray-casting done in-memory in
`PropertiesService.findAll` after the SQL query (not spatial SQL) — see
`apps/api/src/geolocation/point-in-polygon.util.ts`, a pure function, edge
cases (vertex/edge) treated as "inside". Boolean query filters are
tri-state: transform `'true'/'false'` strings via a small `@Transform`
helper, `undefined` = filter not applied, `false` filters for exactly
`false` (excludes `null` "not indicated" rows too, since SQL `= false`
naturally excludes NULL — no extra `IS NOT NULL` needed).

Confirmed via `npm run typeorm -- migration:generate` that this project's
generator picks up cosmetic `CHANGE column ... NULL` no-op statements for
every other nullable column whenever you add a new column to `Property` —
harmless MariaDB metadata-diff noise, not something to hand-edit away.

**Multi-agent caution (this host runs several coder agents in parallel on
the same repo/processes):** a `saved-property-lists` module appeared mid-session
from a different agent working the same repo concurrently (own controller/
service/module, only imports the `Property` entity — no shared DTOs). Its
test failures were pre-existing/unrelated to my diffs (confirmed by
checking it imports nothing I touched) and were later fixed by that other
agent independently (full suite went 15/15 green by end of session, 150
tests). **Never run a broad `pkill -f <pattern>` on this host** — I killed
another agent's already-running `next dev -p 3002` by accident with
`pkill -f "next dev$"` even though the pattern looked port-specific; only
kill exact PIDs you yourself spawned (check `ps aux` before AND after
starting your own background dev servers so you know which PIDs are
yours), and check `docker ps` / `ss -ltnp` for already-running services
before assuming you need to start one.
