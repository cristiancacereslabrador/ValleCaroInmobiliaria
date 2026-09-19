---
name: feedback_npm_workspace_hoisting_and_typeorm_cli
description: In an npm workspaces monorepo, a workspace package's node_modules/.bin is often empty (deps hoisted to root) - relative `./node_modules/x/cli.js` paths in package.json scripts break; use the package's dedicated bin name instead. Also - TypeORM's CLI datasource file must export exactly one DataSource (not both named and default).
metadata:
  type: feedback
---

Two gotchas hit while wiring TypeORM migration scripts in an npm-workspaces
monorepo ([[project_real-estate-platform-mvp_backend]], apps/api):

1. **Hoisting breaks relative `node_modules/<pkg>/cli.js` script paths.**
   With npm workspaces, a workspace package (e.g. `apps/api`) usually has NO
   local `node_modules/.bin` and no local `node_modules/<pkg>` folder for
   deps that got fully hoisted to the repo root — even though `npm ls
   <pkg>` shows it correctly resolved for that workspace. A package.json
   script like `"typeorm": "ts-node ./node_modules/typeorm/cli.js ..."`
   run from inside that workspace fails with `MODULE_NOT_FOUND` because
   there's no local copy. Fix: use the package's own published bin name
   instead of hand-rolling a path — npm's script runner adds every
   `node_modules/.bin` from cwd up to the root onto PATH, so a bare bin
   name resolves correctly regardless of hoisting. For TypeORM
   specifically, use the `typeorm-ts-node-commonjs` bin (ships specifically
   for this ts-node use case) instead of piecing together `ts-node -r
   tsconfig-paths/register ./node_modules/typeorm/cli.js`:
   ```json
   "typeorm": "typeorm-ts-node-commonjs -d src/database/data-source.ts"
   ```

2. **TypeORM CLI datasource file: exactly one DataSource export.** If a
   `data-source.ts` does both `export const AppDataSource = new
   DataSource(...)` AND `export default AppDataSource`, `typeorm
   migration:generate`/`migration:run` fails with "Given data source file
   must contain only one export of DataSource instance" — TypeORM's
   `CommandUtils.loadDataSource` counts every export binding, and a named +
   default export of the same value counts as two. Fix: export it only one
   way (default export is simplest for a CLI-only datasource file).
