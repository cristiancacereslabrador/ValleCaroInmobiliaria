# Memory Index

- [real-estate-platform-mvp backend state](project_real-estate-platform-mvp_backend.md) — what's built, how to run/test it, judgment calls made
- [real-estate-platform-mvp frontend state](project_real-estate-platform-mvp_frontend.md) — apps/web built (groups 6-9); found+fixed a stale lockfile that left next/react uninstalled
- [NestJS CLI @latest now scaffolds ESM+vitest](feedback_nestjs_cli_latest_scaffolds_esm_vitest.md) — pin @nestjs/cli@10 for classic CommonJS+Jest
- [npm workspace hoisting breaks TypeORM CLI paths](feedback_npm_workspace_hoisting_and_typeorm_cli.md) — use typeorm-ts-node-commonjs bin; datasource file needs exactly one export
- [dotenv v17 marketing banner (not malicious)](feedback_dotenv_v17_marketing_banner.md) — pin dotenv ^16.x to avoid ad banner + agent-targeted skill files bundled in the package
- [mortgage-calculator change state](project_mortgage-calculator_change.md) — isolated module, judgment calls (0-quota vs 400, local operationType literal, downPayment as amount)
- [saved-property-lists change state](project_saved-property-lists_change.md) — isolated module; found multi-agent shared next-dev/.next contention + isolated-distDir workaround
- [property-virtual-tours change state](project_property-virtual-tours_change.md) — Pannellum 360 viewer; CSS specificity trap with pnlm-container
- [I broke shared next dev by not checking memory first](feedback_next_build_vs_shared_dev_server.md) — READ project_saved-property-lists_change before touching apps/web build tooling
- [neighborhood-market-insights change state](project_neighborhood-market-insights_change.md) — city/postalCode, price history, nearby-services + price-trends; no browser tool this session
- [saved-search-alerts change state](project_saved-search-alerts_change.md) — email alerts, double opt-in; found+fixed a real mysql2/TypeORM timezone bug breaking a time-window rate limit
- [commute-search change state](project_commute-search_change.md) — isolated module, Distance Matrix client + bounding-box pre-filter; own GET endpoint (not extending /properties)
- [property-valuation-estimator change state](project_property-valuation-estimator_change.md) — comparables/percentile estimator; change dir vanished mid-session (already archived elsewhere) with my state intact
- [similar-properties change state](project_similar-properties_change.md) — isolated module; confirmed Property has NO active/inactive concept anywhere in codebase
