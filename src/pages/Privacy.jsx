import { LockKeyhole, ShieldCheck } from "lucide-react";
import PageTitle from "../components/PageTitle";

export default function Privacy() {
  return (
      <PageTitle title="Privacy overview" description="Understand how Paste Vault handles account information, private snippets, authentication and sharing." noindex={false} />
    <div className="public-content-page legal-page">
      <section className="public-page-hero compact"><div className="landing-pill"><LockKeyhole size={14} /> PRIVACY OVERVIEW</div><h1>Your code is <span>yours.</span></h1><p>This page explains the main data practices built into Paste Vault. It is a product overview, not a substitute for legal advice.</p></section>
      <div className="legal-updated"><ShieldCheck size={15} /> Product privacy overview · Updated November 2026</div>
      <article className="legal-copy">
        <h2>1. Information stored</h2><p>Paste Vault stores the account information needed to authenticate you, including your name and email address. Profile details you choose to add, such as a bio, location, avatar URL and social links, are also stored.</p>
        <h2>2. Your snippets and collections</h2><p>Snippets, folders, tags, revision history, pin states and sharing settings are stored in the application database. New snippets are private by default and are scoped to the account that created them.</p>
        <h2>3. Sharing controls</h2><p>Unlisted snippets can be opened by anyone who has the share URL. You may add a password, expiry and successful-view limit. Do not put passwords, API keys, personal data or confidential source code in a snippet you choose to share.</p>
        <h2>4. Authentication and email</h2><p>Standalone account passwords are stored as salted password hashes, not plaintext. Verification and password-reset tokens are stored as digests and expire. Transactional verification and reset emails are sent through the configured email delivery provider. LeetMetric sign-in uses a separate, short-lived one-time launch ticket.</p>
        <h2>5. Cookies and security</h2><p>Paste Vault uses an HttpOnly session cookie to keep you signed in. Mutating API requests are checked for same-origin requests, and authentication endpoints are rate-limited. No security measure can guarantee absolute protection, so keep your credentials private.</p>
        <h2>6. Export and control</h2><p>You can export your snippets and collections from the library. You can edit profile details and delete individual snippets or folders from the workspace. For questions about account data, use the project repository to contact the maintainer.</p>
        <h2>7. Code execution and analytics</h2><p>Paste Vault stores and renders code as text; it does not execute saved snippets. This product does not require access to your coding-platform passwords.</p>
        <h2>8. Changes</h2><p>This overview may change as the product evolves. The latest version will be published on this page.</p>
      </article>
    </div>
  );
}
