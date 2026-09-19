---
name: feedback_nestjs_cli_latest_scaffolds_esm_vitest
description: npx @nestjs/cli@latest new now scaffolds Nest 12 with ESM ("type":"module"), TypeScript 6, oxlint and vitest instead of the classic CommonJS + Jest setup - pin @nestjs/cli@10 when the task wants standard Jest-based NestJS.
metadata:
  type: feedback
---

As of 2026-09, `npx @nestjs/cli@latest new <name>` scaffolds a very different
default project than "standard NestJS": Nest 12, `"type": "module"` (ESM),
TypeScript 6, `oxlint` instead of eslint, and **vitest** instead of Jest for
`test`/`test:watch`/`test:e2e` scripts. No `jest` dependency at all.

When a task brief says "tests with Jest, the NestJS standard" (as
[[project_real-estate-platform-mvp_backend]]'s brief did), that's describing
the *classic* Nest scaffold, not what `@latest` produces today. Don't try to
force Jest onto the ESM/vitest scaffold — just pin the CLI version instead:

```
npx --yes @nestjs/cli@10 new <name> --package-manager npm --skip-git --skip-install
```

This reliably produces the CommonJS + Jest + eslint project shape that
matches what "standard NestJS" conventions (and most task briefs written
with that in mind) actually expect. Confirmed working with @nestjs/core
^10.0.0 + TypeORM 0.3 + mysql2 + class-validator without any ESM-interop
headaches.
