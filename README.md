# adaptive-llm-agent-admin

Business Admin frontend for [adaptive-llm-agent](https://github.com/Arkaiver-Tech-Ghana/adaptive-llm-agent)
— issue [#17](https://github.com/Arkaiver-Tech-Ghana/adaptive-llm-agent/issues/17).
Owners manage their Business's config, menu items or rooms, and staff
accounts; platform operators get cross-Business read access to the audit
log. See that repo's `docs/adr/0006-*` and CLAUDE.md for the design this
implements.

React + TypeScript + Vite, deployed on Vercel. The backend is a separate
FastAPI service (one Render deploy, `adaptive-llm-agent`'s
`interfaces/admin/router.py`) — this app is a pure API client with no
server of its own.

## Local dev

```sh
cp .env.example .env   # point VITE_API_BASE_URL at your local backend
npm install
npm run dev
```

Needs the backend running locally (`uv run uvicorn adaptive_agent.interfaces.whatsapp.app:app`
in `adaptive-llm-agent`) with `ADMIN_CORS_ORIGINS` including `http://localhost:5173`
(the default if unset) and at least one seeded owner account
(`scripts/seed_admin_owner.py`).

## Structure

- `src/lib/api.ts` — typed client for `/admin/api/v1/*`.
- `src/lib/auth.tsx` — JWT bearer token in `localStorage`; decodes role/business_id client-side for routing only (the backend re-verifies on every request).
- `src/lib/business.ts` — the two-Business -> data-row-kind map (KampusCrave -> menu items, hotel -> rooms); see that file's comment for why this is hardcoded rather than fetched.
- `src/components/EntityCrudPage.tsx` — generic list/create/edit/delete table, parameterized per resource (menu items, rooms) rather than duplicated.
- `src/components/ConfirmDeleteDialog.tsx` — the two-step `confirm_token` delete flow every destructive backend route uses.
- `src/pages/` — one page per route: login, config (owner), menu items, rooms, staff (owner), audit log (owner + platform operator).

## Deploy

Vercel, pointed at this repo. Set `VITE_API_BASE_URL` to the deployed
backend's URL in the Vercel project's environment variables, and add this
app's Vercel URL to the backend's `ADMIN_CORS_ORIGINS`.
