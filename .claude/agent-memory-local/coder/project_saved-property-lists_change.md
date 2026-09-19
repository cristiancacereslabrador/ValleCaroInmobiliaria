---
name: project_saved-property-lists_change
description: Implementation state of the saved-property-lists OpenSpec change (backend + frontend) as of 2026-09-07 - isolated module, judgment calls, shared-dev-server contention discovered.
metadata:
  type: project
---

Implemented tasks.md ids 1.1, 2.1-2.3, 3.1-3.2, 4.1 (all groups) for the
`saved-property-lists` OpenSpec change in `/var/www/html/TestOpenSpecs`,
built alongside several other agents working on parallel changes
(mortgage-calculator, property-virtual-tours, advanced-search-filters,
commute-search were all mid-flight in the same repo/dev-servers).

Backend: fully isolated module `apps/api/src/saved-property-lists/`
(entities `SavedPropertyList` + `SavedPropertyListItem`, service,
controller, module, migration `1788806024924-AddSavedPropertyLists`).
Only touched shared files for registration: `app.module.ts`,
`database.module.ts`, `database/data-source.ts` (entities arrays). Did not
touch `properties.controller.ts`/`properties.service.ts`/`Property` entity
as instructed — only injected `Repository<Property>` read-only for
existence checks when adding to a list.

Key judgment calls (not explicit in design.md/spec.md):
- Both "identificador de gestión inválido" and "intento de modificar via
  shareToken" scenarios unify into the SAME lookup
  (`findListByManagementTokenOrFail`, queries only the `management_token`
  column) and the SAME 404 NotFoundException with a generic message. A
  `shareToken` never matches that column, so it naturally 404s exactly like
  an unknown token, without leaking whether the token belongs to a real
  list. Chose 404 over 403 for consistency with the rest of the codebase
  (properties.service.ts uses NotFoundException exclusively, no
  ForbiddenException anywhere).
- "No duplicar" (add duplicate) implemented as literal INSERT IGNORE via
  TypeORM's `.createQueryBuilder().insert().orIgnore()` — design.md
  Decision 2 explicitly says "sin logica adicional en la aplicacion
  (upsert/ignore)", read as a direct instruction to use DB-level IGNORE
  rather than a pre-check-then-insert pattern.
- Adding a `propertyId` that doesn't exist in the catalog throws
  NotFoundException (not an explicit spec scenario, but necessary to avoid
  a raw FK-violation 500 — same defensive pattern properties module uses
  elsewhere).
- Shared-view response is exactly `{ name, properties }` (no shareToken
  echoed back either, even though the caller already has it via the URL) —
  kept minimal per the literal spec text rather than adding fields "just in
  case".
- Frontend: `SaveToListButton` reused on both `PropertyCard` (heart-icon
  overlay via a `.property-card-wrapper` sibling, NOT nested inside the
  `<Link>`, to avoid needing stopPropagation for card navigation — I still
  kept stopPropagation defensively) and the detail page's action row.
  `localStorage` schema: `apps/web/src/lib/savedListsStorage.ts`, key
  `savedPropertyLists`, array of `{id, name, managementToken, shareToken}`.

**Environment/process discovery worth escalating to CLAUDE.md (told
orchestrator explicitly in final report)**: multiple agents in this
sandbox share ONE `next dev` process + ONE `apps/web/.next` directory.
When one agent runs `next build` (or `rm -rf .next`) while that shared
`next dev` is running, every other agent's routes start 500ing with
`TypeError: __webpack_modules__[moduleId] is not a function` or
`ENOENT ... lstat '.../.next'`, matching the OLD known "don't run next
build and next dev concurrently" note but now proven to ALSO happen
cross-agent, not just self-inflicted. Workaround I used successfully:
temporarily add `...(process.env.CLAUDE_DIST_DIR ? { distDir:
process.env.CLAUDE_DIST_DIR } : {})` to `next.config.mjs`, run a second
`next dev -p <other-port>` with `CLAUDE_DIST_DIR=.next-verify-<name>` set,
verify against that port, then kill it, `rm -rf` the temp distDir, and
revert `next.config.mjs`. Gotcha: `next dev` on a fresh distDir
auto-mutates the shared `tsconfig.json`'s `include` array to add
`<distDir>/types/**/*.ts` — must revert that line too or it leaves a
dangling reference. This whole isolated-instance dance is the reliable way
to get real manual/browser-shaped verification in this repo without racing
other agents on the shared dev server; worth reaching for immediately next
time rather than fighting over the shared one.

To run/verify this module alone: `cd apps/api && npx jest
saved-property-lists` (25 tests). Full curl E2E flow used for task 4.1 is
itemized in tasks.md 4.1's own description — create list, add property, add
duplicate (no-op), add second property, GET manage view (both tokens), GET
shared view (no managementToken), POST to manage endpoint using the
shareToken (404), GET manage with a garbage token (404), DELETE an item,
re-GET to confirm removal.
