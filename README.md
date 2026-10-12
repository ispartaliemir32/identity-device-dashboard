# Identity & Device Dashboard

[![CI](https://github.com/ispartaliemir32/identity-device-dashboard/actions/workflows/ci.yml/badge.svg)](https://github.com/ispartaliemir32/identity-device-dashboard/actions/workflows/ci.yml)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)

A small React + TypeScript dashboard for the `report.json` produced by [entra-intune-automation](https://github.com/ispartaliemir32/entra-intune-automation): stale Entra ID accounts, non-compliant Intune devices and privileged role assignments.

Everything runs in the browser. A report you load is parsed locally and **never uploaded**.

> The bundled sample data is fictional (`example.com`). The project contains no employer data.

## Run it

```bash
npm install
npm run dev
```

Then use **Load report.json** to open your own report, or keep browsing the demo data.

Generate a report with the companion project:

```powershell
./scripts/Invoke-Reports.ps1 -DemoData   # or without -DemoData for your own tenant
```

## What it shows

- Summary cards for stale users, non-compliant devices and privileged assignments
- Sortable, filterable tables (keyboard accessible, `aria-sort` on headers)
- Devices per operating system, drawn with plain elements (no chart library)
- Light and dark theme based on the system preference

## Design choices

- **The report is untrusted input.** `src/parseReport.ts` validates the JSON and reports the exact broken field, instead of casting with `as Report`.
- **Small surface.** Only React and the browser platform. No UI framework and no chart library.
- **Accessible tables.** Real `<table>` markup, labelled search boxes and sortable headers that are buttons.
- **Tested logic.** Vitest and Testing Library cover the parser, the table (sorting, empty values, filtering) and the app shell.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the Vite dev server |
| `npm test` | Run the unit tests |
| `npm run typecheck` | Type-check with `tsc` |
| `npm run build` | Type-check and create a production build in `dist/` |

## Project layout

```text
.
├── public/sample-report.json   # fictional demo report
└── src/
    ├── parseReport.ts          # schema validation for report.json
    ├── components/             # DataTable, SummaryCards, OsChart
    └── App.tsx
```

## Deploying

`.github/workflows/pages.yml` builds the site and publishes it to GitHub Pages. In the repository settings, set **Pages → Source** to **GitHub Actions** once.

## Limitations

- Report schema version 1 only.
- No charts over time yet; a report is a single snapshot.
- No live Microsoft Graph connection on purpose. Report generation stays in the read-only PowerShell project.

MIT licensed.
