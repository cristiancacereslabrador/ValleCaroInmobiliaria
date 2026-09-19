---
name: project_real-estate-platform-mvp_frontend
description: Current state of the real-estate-platform-mvp OpenSpec change frontend (apps/web) as of 2026-09-07 - what's built, how to run it, known gaps.
metadata:
  type: project
---

Implemented tasks.md ids 6.1-6.2, 7.1-7.3, 8.1-8.2, 9.1-9.3 (frontend groups
6-9) plus verified the pending half of 1.3, for the `real-estate-platform-mvp`
OpenSpec change in `/var/www/html/TestOpenSpecs`. Backend context in
[[project_real-estate-platform-mvp_backend]].

**Found and fixed before writing any frontend code**: a previous agent had
authored `apps/web/package.json` (next 14.2.35, react 18.3, @react-google-maps/api
2.20.8) but the root `package-lock.json` still had `apps/web` as an empty
`{"version": "0.0.1"}` entry — `next`/`react`/`@react-google-maps/api` were
never actually installed under `node_modules`. Running plain `npm run
dev --workspace=apps/web` would have failed with "next: command not found".
Fix: `npm install` from the repo root (workspaces monorepo) resolved and
installed everything correctly in ~25s. **Lesson for any future agent in an
npm-workspaces monorepo**: don't assume a workspace's declared deps are
actually installed just because `package.json` lists them — check
`node_modules/.bin/<cli>` or grep the lockfile's `packages["apps/<name>"]`
entry for a real `dependencies` object before running its scripts.

Structure built: `apps/web/src/app/{layout.tsx,globals.css,page.tsx}` (catalog
listing), `apps/web/src/app/properties/new/page.tsx` (create),
`apps/web/src/app/properties/[id]/page.tsx` (detail),
`apps/web/src/app/properties/[id]/edit/page.tsx` (edit). All pages are client
components (`'use client'`) that fetch from the real API client-side via
`useEffect` — no server-side data fetching was used, since Next still
server-renders the initial (pre-fetch) shell of a client component, which was
enough to sanity-check every route with plain `curl` (no headless browser was
available in this sandbox — see verification note below).

New components: `PropertyCard`, `PropertyFiltersBar`, `PropertyForm` (shared
create/edit), `MediaUploader`, `MediaGallery`, `ListingMap` (multi-marker map
+ InfoWindow on click, `apps/web/src/components/ListingMap.tsx`). Reused
as-is from the prior agent's partial work (reviewed, found correct, no
changes needed): `apps/web/src/lib/config.ts`, `googleMaps.ts`, `format.ts`,
`api/{types,client,properties,media}.ts`, `components/{PropertyMap,
MapStatusNotice}.tsx` — I only added wrapper `<div className="detail-map-
wrapper">` / `listing-map-wrapper` around their non-null return paths so
`.map-container` (width/height:100%) has a sized parent.

**Verification method used (no browser tooling in this sandbox)**: rather
than skipping the "verificar manualmente" criteria in tasks 7.x-9.x, I ran
the real API (`npm run start:dev` in apps/api) and Next dev server together
and drove every scenario the spec describes directly against the live API
with `curl` (create/edit/delete property, filter combinations, upload valid
+ invalid media formats, mark/promote cover photo, geocoding-address-without-
key-configured fallback, coordinate range rejection, 404s) to confirm the
exact response shapes the frontend TypeScript types assume are correct, plus
confirmed every route's SSR shell renders without error via `curl`. This is
not equivalent to an actual visual/interactive browser pass (clicking
markers, seeing map tiles, drag-drop uploads) — flagged explicitly to the
user in the final report rather than silently claiming full manual QA.

Known gap carried over from backend (not mine to fix, see
[[project_real-estate-platform-mvp_backend]]): deleting a Property cascades
`property_media` DB rows but not the physical files on disk — orphaned files
accumulate under `apps/api/storage/properties/<id>/`. Frontend delete button
just calls `DELETE /properties/:id`; nothing frontend-side can fix this.

To run locally end-to-end: `docker compose up -d mariadb` (repo root) →
`cp apps/api/.env.example apps/api/.env` → `cd apps/api && npm run
migration:run && npm run start:dev` → separately `cp apps/web/.env.example
apps/web/.env.local` → `npm run dev --workspace=apps/web` (or `cd apps/web
&& npm run dev`). Without `NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_API_KEY` set, maps
degrade gracefully to a "no hay clave configurada" notice instead of
crashing (verified this is the actual behavior, both components check for an
empty key before ever mounting `useJsApiLoader`).

**Gotcha found 2026-09-07 during task 10.1**: running `npm run build`
(production build) in `apps/web` while a `next dev` server is ALSO running
against the same `apps/web/.next` directory corrupts that directory for the
dev server (webpack-runtime.js becomes stale/mismatched -> `MODULE_NOT_FOUND`
-> every route 500s). Fix is `rm -rf apps/web/.next` and restart `next dev`.
Lesson: never run `next build` and `next dev` concurrently against the same
`.next` dir — stop the dev server first, or build in a separate checkout.

**Re-confirmed 2026-09-07 during `advanced-search-filters` (multi-agent
angle)**: this host runs several coder agents on this same repo concurrently.
While implementing `advanced-search-filters`, another agent already had
`next dev -p 3002` running in `apps/web` (started before I touched anything).
Running `npx next build` (even after `rm -rf .next`) then failed with
`PageNotFoundError: Cannot find module for page: /properties/new` /
`/properties/[id]/edit` during "Collecting page data" — webpack compile and
`tsc` both succeeded cleanly first, so this was NOT a code bug in my diff.
This is almost certainly the same `.next`-directory-collision gotcha above,
just triggered by a DIFFERENT agent's already-running `next dev` this time
instead of my own. **Lesson: on this host, treat `apps/web/.next` as
possibly owned by another agent's live `next dev` at any moment — check
`ps aux | grep "next dev"` before running `next build` here at all**, and if
a build must be verified, prefer `tsc --noEmit` (safe, doesn't touch
`.next`) plus hitting a running `next dev` instance with `curl` instead.
Also: **never run a broad `pkill -f <pattern>`** on this host to clean up
your own background processes — I killed another agent's `next dev -p 3002`
by accident this way (see
[[project_real-estate-platform-mvp_backend]]); only `kill <exact-pid>` for
PIDs you started yourself.

**advanced-search-filters frontend work (tasks 4.1-5.3, all verified)**:
extended `PropertyFiltersBar` and `PropertyForm` with a small
`TriStateFilterSelect`/tri-state-select pattern (`''` = sin especificar /
`'true'` / `'false'`, mapped to `boolean | undefined`) for
`hasElevator`/`groundFloor`/`needsRenovation`/`isBankOwned` — reusable
pattern if more tri-state boolean attributes get added later. `ListingMap`
now always mounts (given an API key) even with zero geolocated properties,
because it also hosts the Drawing Manager polygon tool for area search —
falls back to a fixed Madrid-centered/zoom-6 view when there's nothing to
fit bounds to. Google Maps `libraries` array in `apps/web/src/lib/googleMaps.ts`
had to gain `'drawing'` for ALL maps (not just the listing one), because
`useJsApiLoader`'s script tag is shared by `id` across every mount — you
cannot load a second library set later for just one component. No
`NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_API_KEY` was configured in this sandbox
and no browser automation tool was connected, so the actual polygon-drawing
interaction could only be verified by code review + type-check + confirming
the graceful "no map key" fallback renders without crashing — flagged to
the user rather than claimed as a full interactive pass.
