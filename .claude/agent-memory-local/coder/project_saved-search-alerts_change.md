---
name: project_saved-search-alerts_change
description: Implementation state of the saved-search-alerts OpenSpec change (backend + frontend) as of 2026-09-07 - all 12 tasks done; found+fixed a real mysql2/TypeORM timezone bug that silently broke a time-window rate limit.
metadata:
  type: project
---

Implemented tasks.md ids 1.1-8.1 (all groups, all 12 tasks) for the
`saved-search-alerts` OpenSpec change in `/var/www/html/TestOpenSpecs`, built
alongside 3 other parallel agents (confirmed final full suite: 296/296 Jest
tests green, `cd apps/api && npx jest`; `npx tsc --noEmit` clean on both
apps/api and apps/web).

**New deps installed** (workspace `apps/api`): `nodemailer@6.9.16` +
`@types/nodemailer@6.4.17` (dev), `@nestjs/event-emitter@2.1.1` (peer-compat
with Nest 10, NOT the `@latest` 12.0.0 which needs a newer core), and
`smtp-server@3.19.9` + `@types/smtp-server@3.5.13` (dev only, for
`mail.service.spec.ts` - spins up a real ephemeral local SMTP server per
test instead of depending on Ethereal/network or a Docker container for
unit tests).

**Backend module** `apps/api/src/saved-search-alerts/` (fully isolated, own
entity `SavedSearchAlert`, does NOT import `PropertiesModule` - the
`property.created`/`property.priceChanged` event payloads carry the full
`Property` entity already loaded, so no own `Property` repository is
needed at all, unlike `saved-property-lists`/`price-trends`/
`nearby-services` which each still register their own read-only
`TypeOrmModule.forFeature([Property])`).
- `property-criteria-matcher.ts`: pure function reimplementing
  `PropertiesService.findAll`'s exact filter predicate (tri-state booleans,
  groundFloor derived from floor=0, area via the same
  `geolocation/point-in-polygon.util.ts`), evaluated against ONE in-memory
  property instead of a SQL WHERE chain. Deliberately NOT extracted into a
  shared util inside `properties/` to avoid touching
  `properties.service.ts`'s `findAll` beyond the minimal event-emission
  edit the brief allowed - reimplementation is a judgment call, flagged in
  the final report.
- `CreateSavedSearchAlertDto.criteria` reuses the actual
  `properties/dto/query-properties.dto.ts` class via `@ValidateNested() +
  @Type(() => QueryPropertiesDto)` - confirmed this works identically for a
  JSON body (not just query-string): `QueryPropertiesDto`'s own
  `@Transform` callbacks (`toBooleanFilter`, the `area` JSON.parse guard)
  are no-ops when the incoming value is already a real boolean/array, so
  the exact same DTO class validates both `GET /properties?...` query
  params AND a JSON `{ criteria: {...} }` body with zero changes.
- `MailService` (`saved-search-alerts/mail/mail.service.ts`): thin
  Nodemailer/SMTP wrapper, `sendMail()` never throws - catches and logs,
  returns `false` (design.md explicit requirement: a broken SMTP must not
  break alert creation or property create/edit). Applied that same
  swallow-and-log philosophy uniformly to ALL 3 email sends in this module
  (confirmation included, not just the notification ones design.md called
  out) - judgment call, flagged in final report.
- Event listeners are plain `@OnEvent('property.created')` /
  `@OnEvent('property.priceChanged')` methods on `SavedSearchAlertsService`
  itself (no separate listener class) - confirmed `@nestjs/event-emitter`
  finds `@OnEvent`-decorated methods on ANY provider app-wide via its own
  discovery scan, they don't need to live in a specific module as long as
  `EventEmitterModule.forRoot()` is registered once at root (`app.module.ts`,
  it's `@Global`). Each listener wraps its whole body in try/catch (belt +
  suspenders on top of the emitter not being awaited by the caller) so a
  DB error or a mailer rejection never becomes an unhandled rejection.
- Entity has an extra `requestIp` column (not explicitly listed in
  proposal.md's "criterios, email, estado, tokens, timestamps") - needed to
  persist the per-IP rate-limit window across requests. Judgment call,
  flagged in final report.
- 3 alert statuses only: `pending` / `active` / `unsubscribed` (no separate
  `expired` status) - task 2.3's "alerta nunca confirmada no se considera
  activa" is satisfied structurally (matching only ever queries
  `status = 'active'`, so a stale `pending` row never matches regardless of
  its `confirmationExpiresAt`); the confirm endpoint additionally checks
  `confirmationExpiresAt` and throws a distinct `GoneException` (410) vs
  `NotFoundException` (404) for a nonexistent token, so the frontend can
  show "invalid" vs "expired" separately per tasks.md 2.2's wording. No
  periodic cleanup job for expired-pending rows (design.md's Decision 3
  "no periodic job" is literally scoped to match-evaluation only, but I
  read is as the general spirit of this change too - flagged as a judgment
  call).
- Confirm/unsubscribe are `GET /saved-search-alerts/confirm/:token` and
  `GET /saved-search-alerts/unsubscribe/:token` (not POST) - deliberate:
  both are triggered purely by clicking an email link with no form/JS
  involved in principle, matching the universal mailing-list-unsubscribe-
  link convention. Confirming an already-`active` alert or re-hitting an
  already-`unsubscribed` token are both idempotent 200s (never a 4xx on
  retry), matching spec.md's explicit "ya usado" scenario for unsubscribe
  and extended the same idempotency to confirm by symmetry (not an explicit
  spec scenario, judgment call).

**Real bug found + fixed (matters for ANY future time-window query in this
project)**: this sandbox's mysql2/TypeORM setup has a timezone round-trip
bug - `@CreateDateColumn` is populated via MariaDB's own
`DEFAULT CURRENT_TIMESTAMP`, but when a JS `Date` (from `Date.now()` in
Node) is sent as a query PARAMETER into a comparison like
`WHERE created_at >= ?`, mysql2 serializes it using the Node process's
LOCAL timezone (CEST, UTC+2 in this environment) while MariaDB's own clock
appears to run in UTC - a real elapsed-2-minutes window compared as
`createdAt: MoreThanOrEqual(new Date(Date.now() - 1hr))` silently returned
count=0 for rows created 2 minutes ago (confirmed by writing a throwaway
`ts-node` script directly against `AppDataSource` - `repository.count()`
returned 0 while `repository.find()` for the same IP returned 7 rows, and
their `createdAt` came back shifted by exactly -2h vs the real wall clock
shown by `date -u`). This silently made the IP rate limit far LESS strict
than configured (never actually triggering) rather than throwing - would
have shipped as a real, quiet security/abuse gap in production if not
manually curl-tested end-to-end. **Fix applied**: never compare a JS `Date`
window against a DB-populated timestamp column across the driver boundary
- instead build the whole window comparison in MariaDB's own clock via
`createQueryBuilder().andWhere('alert.createdAt >= (NOW() - INTERVAL
:windowHours HOUR)', { windowHours })`. Verified live: before the fix, 9
consecutive alert creations from the same IP all returned 201; after the
fix, the 6th+ correctly returned 429. **This should go in CLAUDE.md as a
project-wide gotcha** - any other module comparing a JS-computed
timestamp against a TypeORM-managed datetime column (price-trends
bucketing, any future "created in the last N days" query, etc.) should be
checked for the same issue, or should adopt the same
`NOW() - INTERVAL` pattern to stay entirely in MariaDB's clock domain.
Root cause (global datasource `timezone` option not pinned in
`database.module.ts`/`data-source.ts`) was NOT touched - fixing it globally
would need re-verifying every other module's date handling, out of scope
for an isolated change.

**Frontend**: `SaveSearchAlertForm.tsx` (new, in the catalog page right
after `PropertyFiltersBar`) reuses `PropertyFilters` directly as the
`criteria` payload with zero transformation - its shape already matches
`QueryPropertiesDto` field-for-field. Deliberately ignores the
`commute-search` feature's `CommuteSearchValue` state (not part of the
catalog's own filter criteria per proposal.md's explicit scope: "los mismos
filtros ya disponibles en el catálogo... y advanced-search-filters").
New pages `apps/web/src/app/alerts/confirm/[token]/page.tsx` and
`.../unsubscribe/[token]/page.tsx`, same self-fetching client-component
pattern as `apps/web/src/app/lists/[managementToken]/page.tsx`.

**E2E verification (task 8.1)**: ran a full docker MailHog container
(`docker run -d --name real-estate-mailhog-e2e -p 1025:1025 -p 8025:8025
mailhog/mailhog`, NOT added to the shared root `docker-compose.yml` -
kept fully out-of-band/standalone specifically to avoid a concurrent edit
collision with the 3 other agents also touching this repo) against the
live `nest start --watch` dev server already running in this session
(confirmed via its log that it auto-reloaded and registered all new
routes). Full curl-driven flow: create -> confirmation email received via
MailHog's HTTP API (`GET http://localhost:8025/api/v2/messages`) -> confirm
(+ idempotent re-confirm, + 404 on garbage token) -> create a matching
property -> new-match email received -> edit its price -> price-change
email received with correct old/new price and "bajado"/"subido" wording ->
unsubscribe (+ "ya estaba dada de baja" on retry, + 404 on garbage token)
-> create another matching property -> confirmed NO further email arrives.
All test DB rows and the MailHog container were cleaned up afterward.
No browser tool was available this session either (consistent with every
prior change in this project) - frontend pages verified via `tsc --noEmit`
+ confirming the live shared `next dev -p 3002` server (already running
this session, log at this session's own scratchpad) serves all 3 routes
with 200 and the new form's copy appears in the SSR HTML.

See also [[project_real-estate-platform-mvp_backend]],
[[project_saved-property-lists_change]] (managementToken/shareToken
pattern this change's confirm/unsubscribe tokens follow),
[[feedback_npm_workspace_hoisting_and_typeorm_cli]] (same spurious
`CHANGE column` migration-generate noise recurred again here, hand-cleaned
the same way).
