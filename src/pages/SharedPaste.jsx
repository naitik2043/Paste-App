import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Clipboard, Download, ExternalLink, LockKeyhole, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import CodeBlock from "../components/CodeBlock";
import PageTitle from "../components/PageTitle";
import { downloadSnippet } from "../utils/downloadSnippet.js";

export default function SharedPaste() {
  const { shareId } = useParams();
  const [paste, setPaste] = useState(null);
  const [error, setError] = useState("");
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [unlocking, setUnlocking] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/share/" + encodeURIComponent(shareId), { credentials: "same-origin" })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (response.status === 401 && data.requiresPassword) {
          if (active) setRequiresPassword(true);
          return;
        }
        if (!response.ok) throw new Error(data.error || "This shared snippet is unavailable.");
        if (active) setPaste(data.paste);
      })
      .catch((reason) => { if (active) setError(reason.message); });
    return () => { active = false; };
  }, [shareId]);

  async function unlock(event) {
    event.preventDefault();
    if (!password) return;
    setUnlocking(true);
    setError("");
    try {
      const response = await fetch("/api/share/" + encodeURIComponent(shareId), {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ password })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        if ([400, 404, 410].includes(response.status)) setRequiresPassword(false);
        throw new Error(data.error || "Unable to unlock this snippet.");
      }
      setPaste(data.paste);
      setRequiresPassword(false);
      setPassword("");
    } catch (reason) {
      setError(reason.message);
      setPassword("");
    } finally {
      setUnlocking(false);
    }
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(paste.content);
      toast.success("Copied to clipboard.");
    } catch {
      toast.error("Clipboard access was blocked by your browser.");
    }
  }

  function downloadCode() {
    try {
      downloadSnippet(paste);
      toast.success("Code download started.");
    } catch (reason) {
      toast.error(reason.message || "Unable to download this snippet.");
    }
  }

  if (error && !paste && !requiresPassword) {
    return <div className="empty-panel">{error}<p><Link to="/">Open Paste Vault</Link></p></div>;
  }

  if (requiresPassword && !paste) {
    return (
      <>
        <PageTitle title="Password-protected snippet" />
        <section className="share-password-gate">
          <div className="share-password-icon"><LockKeyhole size={22} /></div>
          <p className="eyebrow">PRIVATE SHARE LINK</p>
          <h1>This snippet is password protected.</h1>
          <p>Enter the password shared by the owner to view this read-only code snippet.</p>
          <form onSubmit={unlock}>
            <label htmlFor="shared-snippet-password">SHARE PASSWORD</label>
            <input id="shared-snippet-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" maxLength={128} required autoFocus />
            {error && <p className="share-password-error" role="alert">{error}</p>}
            <button className="primary-button" type="submit" disabled={unlocking || !password}><ShieldCheck size={15} /> {unlocking ? "Verifying…" : "Unlock snippet"}</button>
          </form>
          <div className="share-password-footnote"><LockKeyhole size={13} /> Password verification is handled securely by Paste Vault.</div>
        </section>
      </>
    );
  }

  if (!paste) return <div className="empty-panel">Loading shared snippet…</div>;

  return (
    <>
      <PageTitle title={paste.title} />
      <div className="detail-back"><Link to="/"><ArrowLeft size={15} /> Open Paste Vault</Link></div>
      <section className="detail-header">
        <div>
          <p className="eyebrow">SHARED SNIPPET · {paste.language.toUpperCase()}</p>
          <h1>{paste.title}</h1>
          <div className="detail-meta">
            <span>Shared by a Paste Vault user</span>
            <span>{paste.viewCount} views</span>
            {paste.shareExpiresAt && <span>Expires {new Date(paste.shareExpiresAt).toLocaleString()}</span>}
          </div>
        </div>
        <div className="detail-actions">
          <button type="button" onClick={copyCode}><Clipboard size={15} /> Copy code</button>
          <button type="button" onClick={downloadCode}><Download size={15} /> Download</button>
        </div>
      </section>
      <section className="detail-main">
        <div className="code-toolbar"><span><i></i><i></i><i></i> <b>{paste.language}</b></span></div>
        <CodeBlock code={paste.content} language={paste.language} />
        {paste.problemTitle && <div className="problem-context"><strong>{paste.problemTitle}</strong>{paste.difficulty && <span className={"difficulty-pill " + paste.difficulty.toLowerCase()}>{paste.difficulty}</span>}{paste.problemUrl && <a href={paste.problemUrl} target="_blank" rel="noreferrer">Open problem <ExternalLink size={13} /></a>}</div>}
        {(paste.approach || paste.timeComplexity || paste.spaceComplexity || paste.keyTakeaway) && <section className="learning-notes" aria-label="Shared solution learning notes">
          <p className="eyebrow">THE THINKING BEHIND THE CODE</p>
          {paste.approach && <div><h3>Approach & intuition</h3><p>{paste.approach}</p></div>}
          {(paste.timeComplexity || paste.spaceComplexity) && <div className="complexity-row">
            {paste.timeComplexity && <span><small>TIME</small><strong>{paste.timeComplexity}</strong></span>}
            {paste.spaceComplexity && <span><small>SPACE</small><strong>{paste.spaceComplexity}</strong></span>}
          </div>}
          {paste.keyTakeaway && <div><h3>Key takeaway & edge cases</h3><p>{paste.keyTakeaway}</p></div>}
        </section>}
      </section>
    </>
  );
}
