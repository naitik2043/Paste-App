import { FileText, ShieldCheck } from "lucide-react";
import PageTitle from "../components/PageTitle";

export default function Terms() {
  return (
      <div className="public-content-page legal-page">
      <PageTitle title="Terms of use" description="Read the terms and usage expectations for the Paste Vault developer workspace." noindex={false} />
      <section className="public-page-hero compact"><div className="landing-pill"><FileText size={14} /> TERMS OF USE</div><h1>Use it thoughtfully.<br /><span>Keep it respectful.</span></h1><p>These product terms describe the expected use of Paste Vault while the service is provided.</p></section>
      <div className="legal-updated"><ShieldCheck size={15} /> Product terms overview · Updated November 2026</div>
      <article className="legal-copy">
        <h2>1. Your account</h2><p>You are responsible for keeping your sign-in credentials confidential and for activity performed through your account. Provide accurate account information and use an email address you control.</p>
        <h2>2. Your content</h2><p>You retain responsibility for the code, text and other content you save. Do not store or share material you do not have the right to use. Keep secrets, access tokens and private keys out of shared snippets.</p>
        <h2>3. Sharing</h2><p>Unlisted links are not private once distributed. Anyone with an unlisted link may access it unless an active password or expiry restriction prevents access. You are responsible for choosing appropriate sharing settings and recipients.</p>
        <h2>4. Prohibited use</h2><p>Do not use the service to distribute malware, abuse the platform, attempt unauthorized access, violate applicable law or interfere with another person&apos;s use of the service.</p>
        <h2>5. Availability and changes</h2><p>Paste Vault is provided as an evolving software project. Features, limits and availability may change. Keep your own backups of important work using the export feature.</p>
        <h2>6. No code execution</h2><p>Paste Vault is a storage and organization tool. It does not execute submitted code or guarantee that saved code is correct, secure or suitable for a particular purpose.</p>
        <h2>7. Contact and updates</h2><p>These terms may be updated as the service evolves. Continued use after an updated version is published indicates acceptance of the revised product terms.</p>
      </article>
    </div>
  );
}
