# Security Policy

## Supported versions

Security fixes are maintained on the default `master` branch. Please use the latest revision when reporting an issue.

## Reporting a vulnerability

Please do not disclose security vulnerabilities in public issues, discussions, pull requests, screenshots or social posts.

Use GitHub's **Report a vulnerability** option in the repository's Security tab to send a private report. Include:

- The affected route, feature or commit (when known).
- A clear description of the security impact.
- Reproduction steps and a minimal proof of concept.
- Sanitized logs or screenshots, with credentials and personal data removed.

Please allow time for the report to be reviewed before making it public. Do not test against other users' data or attempt to disrupt the hosted service.

## Security boundaries

- Snippet contents are user-provided data and are never intended to be executed by the application.
- Secret detection is a client-side heuristic warning, not a secrets scanner or guarantee that credentials will be blocked.
- Unlisted share URLs are bearer links. Password protection and expiry reduce exposure but do not make a link equivalent to private account access.
- The current in-memory rate limiter is scoped to an application process/serverless instance. It is not a distributed denial-of-service control.
- Do not include real API keys, passwords, tokens, private keys, database credentials or personal information in bug reports.
