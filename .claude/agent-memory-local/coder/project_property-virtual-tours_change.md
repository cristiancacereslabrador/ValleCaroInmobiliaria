---
name: project_property-virtual-tours_change
description: Implementation state of the property-virtual-tours OpenSpec change (backend + frontend) as of 2026-09-07 - Pannellum integration, judgment calls, CSS trap.
metadata:
  type: project
---

Implemented tasks.md ids 1.1, 1.2, 2.1, 2.2, 3.1 (all groups) for the
`property-virtual-tours` OpenSpec change in `/var/www/html/TestOpenSpecs`,
built alongside several other agents working on parallel changes
(mortgage-calculator, saved-property-lists, advanced-search-filters,
commute-search all mid-flight in the same repo/dev-servers).

Backend: added `MediaType.TOUR_360 = 'tour360'` to the existing
`property-media` module only (entity enum, migration
`1788805894973-AddTour360MediaType` — a single `ALTER TABLE ... CHANGE
type enum(...)`, hand-trimmed after `migration:generate` picked up
unrelated pre-existing schema drift on the `properties` table that I must
not touch per scope). No new table/module.

**Key judgment call (not explicit in design.md/spec.md)**: the backend
had no way to tell a tour360 upload apart from a normal photo upload —
both are plain images with the same allowed extensions
(`ALLOWED_PHOTO_EXTENSIONS`), and the pre-existing `resolveMediaType()`
inferred type purely from file extension. I added an optional `type` form
field to `POST /properties/:id/media` (`@Body('type')` in the controller,
threaded through as `requestedType` in
`PropertyMediaService.uploadMedia`): omitted or anything other than
`'tour360'` keeps the exact old behavior (infer photo/video by
extension); `type=tour360` validates against the same
`ALLOWED_PHOTO_EXTENSIONS` list and reuses the image size limit
(`MEDIA_MAX_IMAGE_SIZE_MB`). `isCover`/`markCover` logic already gated on
`=== MediaType.PHOTO` so tour360 items are naturally excluded from cover
selection without extra code.

Frontend: installed `pannellum@2.5.7` from npm (the real
mpetroff/pannellum project, matches design.md's suggestion) — it's a
vanilla script with NO ES/CommonJS exports, just assigns
`window.pannellum` and touches `window`/`document` at top-level module
scope, so it is loaded via `import('pannellum')` INSIDE a `useEffect`
(browser-only) in `components/PanoramaViewer.tsx`, never as a static
top-level import (that would crash Next's SSR pass with "window is not
defined"). Needed a `src/types/pannellum.d.ts` with `declare module
'pannellum';` since it ships no types. Its CSS
(`pannellum/build/pannellum.css`) is imported once in the root
`app/layout.tsx` (App Router requires global CSS imports to live in a
layout/page file).

**CSS trap worth knowing if anyone touches this viewer again**: Pannellum
adds the class `pnlm-container` to the same div you hand it
(`pannellum.viewer(containerRef.current, {...})`), and
`pannellum.css`'s `.pnlm-container{height:100%}` rule is imported AFTER
`globals.css` in the cascade — so a plain `.panorama-viewer{height:320px}`
single-class selector in globals.css LOSES the specificity tie and the
viewer collapses to ~0px tall. Fixed with a two-class selector
`.tour-item .panorama-viewer{height:320px}`. Verify any future CSS change
to this viewer actually renders (check computed height), not just that it
compiles.

New components: `components/PanoramaViewer.tsx` (thin Pannellum wrapper),
`components/PropertyTours.tsx` (the "Tour virtual 360°" section on the
property detail page — filters `media` for `TOUR_360`, renders nothing
when empty per the spec's "sin tours -> sin sección" scenario, one
viewer + delete button per tour). `MediaGallery.tsx` was narrowed to only
render photo/video (tours have their own section, avoiding duplicate
rendering of the same media items). `MediaUploader.tsx` got a checkbox
"Es un tour virtual 360°" that sets the `type=tour360` field on upload.

Verified end-to-end for real: uploaded a real generated equirectangular
JPEG (PIL, 2048x1024 gradient with a text watermark) via curl to a real
property, confirmed it's listed with `type: "tour360"`, then used a
throwaway Puppeteer install (in scratchpad, NOT added to the project) to
load the actual running property detail page, screenshot the viewer,
simulate a mouse-drag (rotation, visually confirmed the image content
shifted) and a mouse-wheel (zoom, visually confirmed), and confirmed the
section is entirely absent on a property with no media. See
[[feedback_next_build_vs_shared_dev_server]] for a costly mistake made
along the way (running a production build against the shared dev
server's `.next`) and how it was fixed.

To run/verify this module alone: `cd apps/api && npx jest property-media`
(27 tests across its 3 spec files after this change). Frontend: `cd
apps/web && npx tsc --noEmit`.
