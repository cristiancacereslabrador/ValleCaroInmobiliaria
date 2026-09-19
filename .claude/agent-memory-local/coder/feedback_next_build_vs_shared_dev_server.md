---
name: feedback-next-build-vs-shared-dev-server
description: Read [[project_saved-property-lists_change]]'s shared-dev-server section BEFORE touching apps/web build/dev tooling - I didn't and broke it
metadata:
  type: feedback
---

I ran `npx next build` in `apps/web` on 2026-09-07 (implementing
`property-virtual-tours`) to sanity-check the frontend, without first
checking whether a shared `next dev` server was live. It was (another
agent's), and my build corrupted the shared `apps/web/.next` directory it
depends on — every route started 404ing/500ing for everyone
(`__webpack_modules__[moduleId] is not a function`, `ENOENT ... .next`).
[[project_saved-property-lists_change]] had ALREADY documented this exact
failure mode and a clean workaround (isolated `distDir` + a second `next
dev` on another port) — it was sitting right there in my own MEMORY.md
index ("found multi-agent shared next-dev/.next contention +
isolated-distDir workaround") and I didn't open it before acting. That's
the real mistake: not the build itself, but not checking existing memory
for a known trap before touching shared frontend tooling.

**Why:** multiple coder agents share one `apps/web` dev server + `.next`
dir in this sandbox; a `next build` from anyone silently wrecks it for
everyone else and is only noticed later as a mystery 404 storm.

**How to apply:** before running `next build`, `rm -rf .next`, or starting
a second `next dev` in `apps/web`, always re-read
[[project_saved-property-lists_change]] first — it has the proven
isolated-distDir procedure and its gotchas (e.g. reverting the
`tsconfig.json` `include` mutation). Prefer `npx tsc --noEmit` for a quick
type-safety check instead of a full build when that's all you need.

Recovery, if it's already broken (what I actually had to do, without
knowing the distDir trick yet): find the live dev server's log via
`ls -la /proc/<next-server-pid>/fd | grep '\-> '` (fd 1 points at its log
file even if no one told you the path), `rm -rf apps/web/.next`, then kill
the WHOLE process tree (`sh -c next dev` -> `node .../next` ->
`next-server`, not just one PID) and restart `next dev -p <original
port>` in the background — a killed dev server does NOT self-heal from a
deleted `.next`, it needs an actual restart. Something in this environment
auto-respawns a killed dev server, but without the original `-p` flag, in
which case it lands on default port 3000 (`next dev`'s default) — do not
assume port 3000 is this project's API: on this host it collides with an
unrelated system service already bound there, "Gotenberg" (a PDF/doc
conversion API for a totally different site). The API dev server is on
3001 (`nest start --watch`); apps/web dev has been on 3002.

See also [[project_real-estate-platform-mvp_backend]], [[project_real-estate-platform-mvp_frontend]].
