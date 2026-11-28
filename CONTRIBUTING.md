# Contributing

Thanks for helping improve Paste Vault. Contributions should preserve the product's private-by-default behavior and account-level data isolation.

## Development setup

1. Install Node.js 26.x and npm.
2. Clone the repository and install the locked dependencies:

   ```bash
   git clone https://github.com/naitik2043/Paste-App.git
   cd Paste-App
   npm ci
   ```

3. Copy `.env.example` to `.env` and configure `MONGODB_URI` and a unique `JWT_SECRET` of at least 32 characters.
4. Start the frontend with `npm run dev`.

Never commit `.env`, credentials, database exports or real user snippets.

## Before opening a pull request

Run the same quality gate used in CI:

```bash
npm run check
```

This runs ESLint, syntax checks for browser and API modules, the Node.js test suite and a production build. CI additionally audits production dependencies.

For user-facing changes, include a concise manual test note and screenshots when a visual change is involved. For security-sensitive changes, explain the threat addressed and the authorization, privacy and failure cases covered by tests.

## Pull request expectations

- Keep changes focused and explain the problem they solve.
- Add or update tests for changed behavior and regressions.
- Preserve server-side ownership checks; never rely on client-side visibility or folder filters for authorization.
- Keep new snippets private by default. Imports must not reactivate share links or expose data.
- Avoid introducing new dependencies unless they provide clear value.
- Update README or API documentation when behavior, configuration or routes change.
- Use clear commit subjects, preferably in the Conventional Commits style (for example, `fix(sharing): reject expired links`).

A passing local check is necessary but not a substitute for the GitHub Actions result on the pull request.
