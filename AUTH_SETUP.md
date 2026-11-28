# Standalone authentication setup

Paste Vault supports two sign-in paths that converge on the same application user record:

1. Standalone email/password accounts.
2. LeetMetric single sign-on through the existing one-time launch ticket exchange.

## Production configuration

Configure these server environment variables:

- `MONGODB_URI`: connection string to the trusted MongoDB database containing the shared `users` collection and Paste Vault collections.
- `JWT_SECRET`: a Paste Vault-specific random secret of at least 32 characters. Do not reuse LeetMetric's JWT secret.
- `PUBLIC_APP_URL`: canonical HTTPS application origin, for example `https://paste-app.example.com`.
- `RESEND_API_KEY`: Resend API key.
- `RESEND_FROM_EMAIL`: sender address on a domain verified in Resend.

Set `PUBLIC_APP_URL` explicitly in production. Verification and password-reset URLs are built from this canonical origin rather than trusting request Host headers.

Generate `JWT_SECRET` with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

## Resend configuration

Verify the sender domain in Resend, create an API key with email-sending access and configure the sender address. Send a test email before opening registration publicly. Verification links expire after 24 hours; password-reset links expire after one hour. Both tokens are single-use and only their SHA-256 digests are stored in MongoDB.

Without Resend credentials, the local development environment logs development-only action links. The development fallback is disabled in production. A production registration may create a pending, unverified credential before delivery configuration is corrected; configure the mail service and use the resend-verification endpoint to issue a new link.

## Account linking model

- The standalone registration flow normalizes the email address and searches the shared `users` collection.
- If a matching user exists, the new standalone credential is attached to that user's existing ID only after the email is verified.
- If no matching user exists, registration creates a Paste Vault user record.
- An authenticated LeetMetric user can also add standalone sign-in from Paste Vault Settings. That flow uses the current session's email from the database (not an email supplied by the browser), creates credentials for the same user ID, and requires email verification before standalone password sign-in is enabled.
- LeetMetric SSO continues to consume a short-lived, one-time ticket and creates the same Paste Vault session type.
- Different email addresses are never merged automatically.
- Both applications must point to the same trusted user identity database for automatic same-user linking. Do not attempt to link accounts solely because a user types an email address into a form.

## Collections

| Collection | Purpose |
| --- | --- |
| `users` | Shared account identity, authentication-provider metadata and isolated Paste Vault `pasteProfile` fields |
| `paste_credentials` | Salted password hashes, email verification state, token digests and expiry |
| `integration_tickets` | Hashed one-time LeetMetric launch tickets |
| `code_pastes` | User-owned snippets and revision history |
| `paste_folders` | User-owned collections |

## Operations checklist

1. Set the database and all five environment variables.
2. Verify the Resend sender domain and deliver a test email.
3. Confirm `PUBLIC_APP_URL` exactly matches the public HTTPS origin.
4. Register a new test email address and complete verification.
5. Test sign-in, sign-out, forgot password, password reset and password change.
6. Test profile edits and confirm they persist after a fresh sign-in.
7. Test a LeetMetric launch ticket against an existing shared user record.
8. Confirm the same user ID sees the same folders and snippets through both sign-in methods.

Never copy real credentials into the repository or commit a populated `.env` file.
