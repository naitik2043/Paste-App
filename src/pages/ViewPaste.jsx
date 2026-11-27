import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Clipboard, ExternalLink, History, Link2, Pin, RotateCcw, Share2, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import CodeBlock from "../components/CodeBlock";
import PageTitle from "../components/PageTitle";

export default function ViewPaste() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [paste, setPaste] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/pastes/" + encodeURIComponent(id), { credentials: "same-origin" });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Unable to load this snippet.");
      setPaste(result.paste);
    } catch (error) { toast.error(error.message); setPaste(null); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function copyCode() {
    try { await navigator.clipboard.writeText(paste.content); toast.success("Code copied."); }
    catch { toast.error("Clipboard access was blocked by your browser."); }
  }

  async function update(fields) {
    const response = await fetch("/api/pastes/" + encodeURIComponent(id), {
      method: "PATCH", credentials: "same-origin",
      headers: { "Content-Type": "application/json" }, body: JSON.stringify(fields)
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Update failed.");
    setPaste(result.paste);
    return result.paste;
  }

  async function remove() {
    if (!window.confirm("Permanently delete this snippet and its version history?")) return;
    const response = await fetch("/api/pastes/" + encodeURIComponent(id), { method: "DELETE", credentials: "same-origin" });
    if (!response.ok) return toast.error("Could not delete this snippet.");
    toast.success("Snippet deleted.");
    navigate("/pastes");
  }

  async function share() {
    try {
      const next = paste.visibility === "unlisted" ? "private" : "unlisted";
      const updated = await update({ visibility: next });
      if (next === "unlisted") {
        const url = window.location.origin + "/share/" + updated.shareId;
        await navigator.clipboard.writeText(url);
        toast.success("Unlisted share link copied.");
      } else toast.success("Sharing disabled. This snippet is private again.");
    } catch (error) { toast.error(error.message); }
  }

  async function restore(revisionId) {
    if (!window.confirm("Restore this version? Your current version will be kept in history.")) return;
    const response = await fetch("/api/pastes/" + encodeURIComponent(id) + "/restore", {
      method: "POST", credentials: "same-origin",
      headers: { "Content-Type": "application/json" }, body: JSON.stringify({ revisionId })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) return toast.error(result.error || "Could not restore this version.");
    setPaste(result.paste);
    toast.success("Version restored.");
  }

  if (loading) return <div className="empty-panel">Loading your snippet…</div>;
  if (!paste) return <div className="empty-panel">Snippet not found.<p><Link to="/pastes">Return to library</Link></p></div>;

  return (
    <>
      <PageTitle title={paste.title} />
      <div className="detail-back"><Link to="/pastes"><ArrowLeft size={15} /> Back to library</Link></div>
      <section className="detail-header">
        <div><p className="eyebrow">{paste.category.toUpperCase()} · {paste.language.toUpperCase()}</p><h1>{paste.title}</h1><div className="detail-meta"><span>Updated {new Date(paste.updatedAt).toLocaleString()}</span><span>{paste.historyCount} saved versions</span><span>{paste.viewCount} link views</span></div></div>
        <div className="detail-actions"><button type="button" onClick={copyCode}><Clipboard size={15} /> Copy code</button><button type="button" onClick={() => update({ isPinned: !paste.isPinned }).then(() => toast.success("Pin updated.")).catch((e) => toast.error(e.message))}><Pin size={15} /> {paste.isPinned ? "Unpin" : "Pin"}</button><button type="button" onClick={share}><Share2 size={15} /> {paste.visibility === "unlisted" ? "Disable link" : "Create share link"}</button><button className="danger-action" type="button" onClick={remove}><Trash2 size={15} /> Delete</button></div>
      </section>
      <div className="detail-layout">
        <section className="detail-main">
          <div className="code-toolbar"><span><i></i><i></i><i></i> <b>{paste.language}</b></span><button type="button" onClick={copyCode}><Clipboard size={14} /> Copy</button></div>
          <CodeBlock code={paste.content} language={paste.language} />
          {paste.problemTitle && <div className="problem-context"><p className="eyebrow">LINKED LEETCODE PROBLEM</p><strong>{paste.problemTitle}</strong>{paste.difficulty && <span className={"difficulty-pill " + paste.difficulty.toLowerCase()}>{paste.difficulty}</span>}{paste.problemUrl && <a href={paste.problemUrl} target="_blank" rel="noreferrer">Open problem <ExternalLink size={13} /></a>}</div>}
          {paste.tags?.length > 0 && <div className="tag-row detail-tags">{paste.tags.map((tag) => <span key={tag}># {tag}</span>)}</div>}
          {paste.topic && <p className="topic-note">Pattern / topic: <strong>{paste.topic}</strong></p>}
        </section>
        <aside className="history-panel">
          <button className="history-toggle" type="button" onClick={() => setShowHistory(!showHistory)}><History size={16} /> Version history <span>{paste.historyCount}</span></button>
          {showHistory && <div className="history-list">{(paste.history || []).length ? paste.history.map((version) => <article key={version.revisionId}><div><strong>{version.title}</strong><small>{new Date(version.changedAt).toLocaleString()}</small><small>{version.language}</small></div><button type="button" onClick={() => restore(version.revisionId)} title="Restore this version"><RotateCcw size={14} /></button></article>) : <p>No earlier versions yet. Edits are recorded here.</p>}</div>}
          <div className="visibility-note"><Link2 size={15} /><p><strong>{paste.visibility === "unlisted" ? "Unlisted link is active" : "Private snippet"}</strong><span>{paste.visibility === "unlisted" ? "Anyone with the link can view it. It is not listed in search." : "Only you can open this snippet while signed in."}</span></p></div>
        </aside>
      </div>
    </>
  );
}
