# Claude handoff — Xantara web frontend

Read `AGENTS.md` and `C:\Dev\Xantara-POS-project-knowledge.md` before making
changes. The shared knowledge file covers this Next.js admin, the Django/MySQL API
in `C:\Dev\xantara-web-backend`, and the Flutter POS in
`C:\Dev\Xantara-POS`. Later numbered entries supersede older status text when
behavior evolved.

Update the shared knowledge file after every meaningful UI behavior, route, API,
authentication, setup, deployment, or architecture change. Code and tests remain
authoritative if documentation is stale.

## Local runtime

- Admin frontend: `http://127.0.0.1:3000`
- Django API: `http://127.0.0.1:8000`
- Flutter preview: `http://127.0.0.1:8086` (fixed canonical port)

```powershell
npm run dev -- --hostname 127.0.0.1 --port 3000
npx tsc --noEmit --incremental false
npm run lint
npm run build
```

Fresh databases redirect login to the one-time `/setup` wizard for company,
main branch, and first administrator. Completed installations redirect `/setup`
back to login. The current local MySQL installation is already complete as
`Xantara POS` with business ID `xantara`.

Use the Django API as the source of truth for staff, branches, inventory, and
shared store settings. Preserve authentication redirects, admin-only actions,
server validation, and existing user data.
