---
name: project_mortgage-calculator_change
description: Implementation state and judgment calls for the mortgage-calculator OpenSpec change (self-contained mortgage/expenses/rental-yield simulator) as of 2026-09-07.
metadata:
  type: project
---

Implemented all of tasks.md (1.1-5.1) for the `mortgage-calculator` change in
`/var/www/html/TestOpenSpecs`, a self-contained capability that does not
touch `Property`/`properties.*`/`property-media.*` at all. Backend context
for the base MVP this sits alongside: [[project_real-estate-platform-mvp_backend]],
[[project_real-estate-platform-mvp_frontend]].

**Backend**: new isolated module `apps/api/src/mortgage-calculator/` (no
`TypeOrmModule.forFeature`, no dependency on `PropertiesModule` — registered
standalone in `app.module.ts`). Single combined endpoint
`POST /api/v1/mortgage-calculator/quote` returns mortgage quote + purchase
expenses + rental yield together in one response (design.md left this
combination open; combining was the simplest reading of "puede combinarse").
Three pure calculator functions (`mortgage-payment.util.ts`,
`purchase-expenses.util.ts`, `rental-yield.util.ts`), each throwing a shared
`InvalidCalculationParamsError` that `MortgageCalculatorService` translates
to a 400. Percentages configurable via env vars
(`MORTGAGE_EXPENSE_TAXES_PERCENT` etc., `MORTGAGE_RENTAL_ANNUAL_EXPENSES_PERCENT`),
documented in `apps/api/.env.example`, with in-code defaults so nothing
breaks if unset.

**Judgment calls not explicit in design.md/spec.md** (flagged in the final
summary too):
- spec.md's "Entrada igual o mayor que el precio" scenario explicitly allows
  either rejecting OR returning a 0 quota ("según corresponda... sin lanzar
  un error inesperado"). Chose **return 0 quota (200 OK)**, not a 400 — kept
  the same behavior at both the pure-function level and the HTTP endpoint
  level for consistency, rather than having the two layers disagree.
- `operationType` in the request DTO is a **local string literal
  `'sale' | 'rent'`**, not a reuse of `PropertiesModule`'s `OperationType`
  enum — deliberate to keep this module import-free from `properties/`
  (isolation requirement from the task brief + reduces breakage risk from
  parallel agents touching the catalog module).
- Down payment (`downPayment`) is an **absolute currency amount** in the API
  contract, not a percentage, despite proposal.md saying "importe o
  porcentaje". The frontend `MortgageSimulator` component is the one that
  offers a percentage input (default 20%) and converts to an amount before
  calling the API — kept the backend contract to a single unambiguous shape.
- `monthlyRent` is optional in the DTO: when `operationType` is `'sale'` but
  `monthlyRent` is omitted, `rentalYield` in the response is `null` (not
  computed, not an error) — covers the simulator's initial state before the
  user has focused the rent field. `applicable: false` (with a `reason`) is
  reserved specifically for `operationType: 'rent'`.
- Default simulator values: 20% down payment, 3% interest, 30-year term,
  and monthly rent defaulted to ~0.4% of price/month (~4.8% gross yield) as
  a reasonable non-zero starting point for the rentability fields.

**Frontend**: `apps/web/src/components/MortgageSimulator.tsx` (client
component, 300ms debounce on param changes, POSTs to the quote endpoint on
every change), inserted into `apps/web/src/app/properties/[id]/page.tsx`
between the "Especificaciones" and "Fotos y vídeos" sections. API client +
mirrored response/request types live in their own isolated file
`apps/web/src/lib/api/mortgageCalculator.ts` (not merged into the shared
`lib/api/types.ts`) for the same isolation reason as the backend.

**Verification method (no browser tooling in this sandbox, same constraint
as [[project_real-estate-platform-mvp_frontend]])**: `tsc --noEmit` clean
across the whole web app; confirmed via the Next dev server's own log file
(found under the session scratchpad dir, `web-dev3.log`) that
`/properties/<id>` compiles and returns 200 for both a real `sale` property
and a real `rent` property with the new component wired in, with zero
runtime/compile errors reported. Full backend math cross-checked by hand
against `curl` calls to the live API (running via `nest start --watch`, real
MariaDB via docker) for: normal quote, entrada >= precio (0 quota, 200),
invalid term (400), and a `rent` property (rentalYield.applicable: false).
This is not an actual clicked-through browser QA pass — same transparency
caveat as the base MVP frontend memory.

**Environment note specific to this session**: multiple other agents were
working in parallel on sibling changes (`saved-property-lists`, a virtual
tours capability, and an in-progress catalog area/map filter). Saw one
transient `tsc --noEmit` failure in `apps/web/src/app/page.tsx`
(`ListingMapProps` missing `area`/`onAreaChange`) that was just another
agent's mid-edit state — resolved itself ~15s later on retry. Lesson: a
shared-file typecheck/test failure during heavy parallel work should be
re-verified after a short wait before assuming your own change broke it,
especially for files you never touched.
