# Paste Vault

A private, searchable code workspace connected to LeetMetric.

Paste Vault captures LeetCode solutions, reusable code patterns and debugging notes so that you can retrieve the approach behind a solution, not only the code.

## Product capabilities

- Private-by-default snippets with explicit unlisted-link sharing.
- Syntax-aware code rendering for common programming languages.
- Search by title, code content, problem title, tags and topic.
- Filter by language, category and pinned status.
- LeetCode context: problem title, canonical URL, difficulty and topic/pattern.
- Structured solution journal: approach/intuition, time complexity, space complexity and key takeaways/edge cases.
- Full snippet editing with automatic version snapshots and restore.
- Workspace analytics for snippet totals, pinned items, share links, storage and languages.
- Up to 20 saved revisions per snippet, with restore.
- Copy-ready detail view and direct problem navigation.
- Responsive light/dark interface and installable PWA shell.
- One-time SSO handoff from a signed-in LeetMetric dashboard.
- Server-side ownership checks for private reads, updates and deletes.

## Integration architecture

LeetMetric validates the user's active session and generates a random 256-bit, 90-second one-time launch ticket. Only the ticket's SHA-256 hash is stored in MongoDB. Paste Vault atomically consumes that hash, checks the user's current token version and creates a separate HttpOnly session signed with Paste Vault's own JWT secret. The ticket is delivered in the URL fragment, not the initial HTTP request.

Both Vercel projects use the same MongoDB database, but each keeps its own independent JWT signing secret. LeetMetric users and account deletion remain owned by LeetMetric; Paste Vault stores snippets in its own code_pastes collection linked by user ID.

## Environment variables

On Paste-App (Paste Vault), set:
- MONGODB_URI — same database used by LeetMetric.
- JWT_SECRET — Paste Vault's own random session-signing secret (minimum 32 characters); it must be different from LeetMetric's secret.

On LeetMetric, set:
- PASTE_APP_URL — https://paste-app-wine.vercel.app
- MONGODB_URI — same database used by Paste Vault.
- JWT_SECRET — LeetMetric's own session-signing secret (minimum 32 characters); do not share it with Paste Vault.

Never commit .env files, connection strings or secrets. Configure them in Vercel Project Settings → Environment Variables, then redeploy both projects.

## Local development

Run npm install, then npm run dev.

Run the quality checks with npm run check. Authenticated API routes require MongoDB and a valid launch ticket from LeetMetric.

## API overview

| Method | Route | Purpose |
| --- | --- | --- |
| POST | /api/auth/exchange | Consume a one-time LeetMetric launch ticket |
| GET | /api/auth/me | Read current Paste Vault session |
| POST | /api/auth/logout | Clear Paste Vault session |
| GET / POST | /api/pastes | Search/list or create snippets |
| GET / PATCH / DELETE | /api/pastes/:id | Read or manage an owned snippet |
| POST | /api/pastes/:id/restore | Restore a saved version |
| GET | /api/stats | Workspace and language insights |
| GET | /api/share/:shareId | Read an explicitly unlisted snippet |

## Privacy and safety

- New snippets are private.
- Anyone with an unlisted link can view that snippet. Unlisted links are not suitable for secrets.
- Do not paste passwords, API keys, private keys, session tokens or sensitive personal data.
- Paste Vault does not execute submitted code.
- Private operations require a valid session and are scoped to the signed-in LeetMetric user.
- LeetMetric account deletion is designed to remove that user's snippets and unused SSO tickets.
- Shared recipients can copy content; copied content cannot be recalled.

## License

MIT. See LICENSE.
