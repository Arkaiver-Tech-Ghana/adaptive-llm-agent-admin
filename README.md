# Qantonic

Business Admin / onboarding frontend for
[adaptive-llm-agent](https://github.com/Arkaiver-Tech-Ghana/adaptive-llm-agent)
— issue [#17](https://github.com/Arkaiver-Tech-Ghana/adaptive-llm-agent/issues/17).
Any business owner can sign themselves up (creating a whole new Business
end-to-end) and then manages their own AI agent's config and data — no
staff/multi-user accounts, and nothing here is primed for any one business
type. See that repo's `docs/adr/0007-*`, `docs/adr/0008-*`, and
`CONTEXT.md`'s `Business Admin UI`/`Custom Table` glossary entries for the
design this implements.

React + TypeScript + Vite. The backend is a separate FastAPI service (one
Render deploy, `adaptive-llm-agent`'s `interfaces/admin/router.py` +
`entities_router.py`) — this app is a pure API client with no server of
its own.

## Local dev

```sh
cp .env.example .env   # point VITE_API_BASE_URL at your local backend
npm install
npm run dev
```

Needs the backend running locally (`uv run uvicorn adaptive_agent.interfaces.whatsapp.app:app`
in `adaptive-llm-agent`) with `ADMIN_CORS_ORIGINS` including `http://localhost:5173`
(the default if unset). Either sign up a fresh Business through the app
itself, or seed one of the two flagship demo owner accounts
(`scripts/seed_admin_owner.py`).

## Structure

- `src/lib/api.ts` — typed client for `/admin/api/v1/*`.
- `src/lib/auth.tsx` — JWT bearer token in `localStorage`; decodes role/business_id client-side for routing only (the backend re-verifies on every request).
- `src/components/layout/AppShell.tsx` / `SidebarNav.tsx` — vertical sidebar nav (desktop-fixed + mobile Sheet drawer, same content in both). Nav items, user info, and logout live there only, never in a top bar.
- `src/components/EntityCrudPage.tsx` — generic list/create/edit/delete table, driven by a column config rather than duplicated per resource; powers the Database section against each table's own dynamic columns.
- `src/components/TableBuilderDialog.tsx` — lets an owner define a new Custom Table (name + typed columns) through the UI.
- `src/components/ConfirmDeleteDialog.tsx` — the two-step `confirm_token` delete flow every destructive backend route uses.
- `src/pages/` — one page per route: login, signup, config (owner), database + database/:tableName (owner), audit log (owner + platform operator).

## Deploy

Cloudflare Workers, via `wrangler.jsonc` (`qantonic.arkaiver.com`):

```sh
npm run deploy   # vite build && wrangler deploy
```

Set `VITE_API_BASE_URL` to the deployed backend's URL before building (it's
baked in at build time, not read at runtime), and add this app's deployed
URL to the backend's `ADMIN_CORS_ORIGINS`.
