# Facility Manager — Frontend

Static multi-page application (HTML, CSS, vanilla JavaScript). **Source** lives in `src/`; **production** output is `dist/` (used by Docker/nginx).

## Layout

```
frontend/
├── src/                    # Edit here
│   ├── index.html          # Home
│   ├── pages/              # Feature HTML (auth, dashboard, profile, student)
│   ├── assets/
│   │   ├── css/
│   │   ├── js/             # api, auth, components, pages, shared, student
│   │   ├── images/
│   │   ├── icons/
│   │   └── fonts/
│   └── locales/            # vi.json, en.json, ja.json
├── dist/                   # npm run build → copy of src/
├── docs/
│   └── api-contract.md
├── scripts/
│   └── build.mjs
├── package.json
├── Dockerfile
└── nginx.conf
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run build` | Copy `src/` → `dist/` |
| `npm run dev` | Build, then serve `dist/` on port 5173 |

## API base URL

In `src/assets/js/api/api-client.js`, set before loading the script:

```html
<script>window.API_BASE_URL = 'http://localhost:8081';</script>
```

(`API_CO_SO` is still accepted for backward compatibility.)

Global client: `window.FmApi` (alias: `window.CoSoApi`).

## Conventions

- **Folders:** lowercase, English (`pages/dashboard`, not mixed duplicates).
- **Files:** kebab-case (`api-client.js`, `register.html`, `view-info.svg`).
- **Do not edit `dist/` by hand** — run `npm run build` after changing `src/`.
