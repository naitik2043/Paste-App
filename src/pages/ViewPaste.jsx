import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Clipboard, Download, ExternalLink, History, Link2, Pencil, Pin, RotateCcw, Share2, Trash2, Save, X } from "lucide-react";
import toast from "react-hot-toast";
import CodeBlock from "../components/CodeBlock";
import PageTitle from "../components/PageTitle";
import SecretWarningNotice from "../components/SecretWarningNotice";
import { detectPotentialSecrets } from "../utils/secretDetection.js";
import { downloadSnippet } from "../utils/downloadSnippet.js";

function toEditForm(paste) {
  return {
    title: paste.title || "",
    content: paste.content || "",
    language: paste.language || "text",
    category: paste.category || "solution",
    problemTitle: paste.problemTitle || "",
    problemUrl: paste.problemUrl || "",
    difficulty: paste.difficulty || "",
    topic: paste.topic || "",
    approach: paste.approach || "",
    timeComplexity: paste.timeComplexity || "",
    spaceComplexity: paste.spaceComplexity || "",
    keyTakeaway: paste.keyTakeaway || "",
    tags: (paste.tags || []).join(", "),
    folderId: paste.folderId || ""
  };
}

export default function ViewPaste() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [paste, setPaste] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [shareDuration, setShareDuration] = useState("7d");
  const [shareViewLimit, setShareViewLimit] = useState("0");
  const [sharePassword, setSharePassword] = useState("");
  const [removeSharePassword, setRemoveSharePassword] = useState(false);
  const [folders, setFolders] = useState([]);
  const [secretAcknowledged, setSecretAcknowledged] = useState(false);
  const [shareSecretAcknowledged, setShareSecretAcknowledged] = useState(false);
  const editSecretWarnings = detectPotentialSecrets(editForm?.content || "");
  const shareSecretWarnings = detectPotentialSecrets(paste?.content || "");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/pastes/" + encodeURIComponent(id), { credentials: "same-origin" });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Unable to load this snippet.");
      setPaste(result.paste);
      setEditForm(toEditForm(result.paste));
      setShareViewLimit(String(result.paste.shareViewLimit || 0));
    } catch (error) {
      toast.error(error.message);
      setPaste(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    fetch("/api/folders", { credentials: "same-origin" })
      .then(async (response) => {
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.error || "Unable to load collections.");
        setFolders(result.folders || []);
      })
      .catch((error) => toast.error(error.message));
  }, []);

  function downloadCode() {
    try {
      downloadSnippet(paste);
      toast.success("Code download started.");
    } catch (error) {
      toast.error(error.message || "Unable to download this snippet.");
    }
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(paste.content);
      toast.success("Code copied.");
    } catch {
      toast.error("Clipboard access was blocked by your browser.");
    }
  }

  function beginEditing() {
    setEditForm(toEditForm(paste));
    setSecretAcknowledged(false);
    setEditing(true);
  }

  async function saveEdit(event) {
    event.preventDefault();
    if (!editForm.title.trim() || !editForm.content.trim()) {
      return toast.error("A title and code are required.");
    }
    if (editSecretWarnings.length && !secretAcknowledged) {
      return toast.error("Review the potential sensitive information warning before saving.");
    }
    setSaving(true);
    try {
      const payload = {
        ...editForm,
        tags: editForm.tags.split(",").map((tag) => tag.trim()).filter(Boolean)
      };
      const response = await fetch("/api/pastes/" + encodeURIComponent(id), {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Unable to save your changes.");
      setPaste(result.paste);
      setEditForm(toEditForm(result.paste));
      setEditing(false);
      setSecretAcknowledged(false);
      setShareSecretAcknowledged(false);
      toast.success("Snippet and learning notes updated.");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function update(fields) {
    const response = await fetch("/api/pastes/" + encodeURIComponent(id), {
      method: "PATCH",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields)
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Update failed.");
    setPaste(result.paste);
    setEditForm(toEditForm(result.paste));
    setShareViewLimit(String(result.paste.shareViewLimit || 0));
    return result.paste;
  }

  async function remove() {
    if (!window.confirm("Permanently delete this snippet and its version history?")) return;
    const response = await fetch("/api/pastes/" + encodeURIComponent(id), {
      method: "DELETE",
      credentials: "same-origin"
    });
    if (!response.ok) return toast.error("Could not delete this snippet.");
    toast.success("Snippet deleted.");
    navigate("/pastes");
  }

  async function share() {
    if (paste.visibility !== "unlisted" && shareSecretWarnings.length && !shareSecretAcknowledged) {
      return toast.error("Review the sensitive-content warning before creating a share link.");
    }
    try {
      if (sharePassword && sharePassword.length < 8) {
        return toast.error("Share passwords must contain at least 8 characters.");
      }
      const wasAlreadyShared = paste.visibility === "unlisted";
      const fields = { visibility: "unlisted", shareDuration, shareViewLimit: Number(shareViewLimit) };
      if (sharePassword) fields.sharePassword = sharePassword;
      if (removeSharePassword) fields.removeSharePassword = true;
      const updated = await update(fields);
      setSharePassword("");
      setRemoveSharePassword(false);
      if (!wasAlreadyShared) {
        const url = window.location.origin + "/share/" + updated.shareId;
        await navigator.clipboard.writeText(url);
        toast.success("Unlisted share link copied.");
      } else {
        toast.success("Share settings updated.");
      }
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function copyShareLink() {
    try {
      await navigator.clipboard.writeText(window.location.origin + "/share/" + paste.shareId);
      toast.success("Share link copied.");
    } catch {
      toast.error("Clipboard access was blocked by your browser.");
    }
  }

  async function disableShare() {
    try {
      await update({ visibility: "private" });
      toast.success("Sharing disabled. This snippet is private again.");
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function restore(revisionId) {
    if (!window.confirm("Restore this version? Your current version will be kept in history.")) return;
    const response = await fetch("/api/pastes/" + encodeURIComponent(id) + "/restore", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ revisionId })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) return toast.error(result.error || "Could not restore this version.");
    setPaste(result.paste);
    setEditForm(toEditForm(result.paste));
    setEditing(false);
    toast.success("Version restored.");
  }

  const changeEditField = (key, value) => {
    setEditForm((current) => ({ ...current, [key]: value }));
    if (key === "content") setSecretAcknowledged(false);
  };

  if (loading) return <div className="empty-panel">Loading your snippet…</div>;
  if (!paste) return <div className="empty-panel">Snippet not found.<p><Link to="/pastes">Return to library</Link></p></div>;

  return (
    <>
      <PageTitle title={paste.title} />
      <div className="detail-back"><Link to="/pastes"><ArrowLeft size={15} /> Back to library</Link></div>
      <section className="detail-header">
        <div>
          <p className="eyebrow">{paste.category.toUpperCase()} · {paste.language.toUpperCase()}</p>
          <h1>{paste.title}</h1>
          <div className="detail-meta">
            <span>Updated {new Date(paste.updatedAt).toLocaleString()}</span>
            <span>{paste.historyCount} saved versions</span>
            <span>{paste.viewCount} link views</span>
          </div>
        </div>
        <div className="detail-actions">
          <button type="button" onClick={copyCode}><Clipboard size={15} /> Copy code</button>
          <button type="button" onClick={downloadCode}><Download size={15} /> Download</button>
          <button type="button" onClick={beginEditing}><Pencil size={15} /> Edit</button>
          <button type="button" onClick={() => update({ isPinned: !paste.isPinned }).then(() => toast.success("Pin updated.")).catch((error) => toast.error(error.message))}>
            <Pin size={15} /> {paste.isPinned ? "Unpin" : "Pin"}
          </button>
          
          <button className="danger-action" type="button" onClick={remove}><Trash2 size={15} /> Delete</button>
        </div>
      </section>

      <section className="share-settings">
        <div className="share-settings-copy">
          <p className="eyebrow">CONTROLLED SHARING</p>
          <h2>Unlisted share link</h2>
          <p>{paste.visibility === "unlisted" ? (paste.shareExpiresAt && new Date(paste.shareExpiresAt).getTime() <= Date.now() ? "This link has expired. Update the share settings to reactivate it." : "Your snippet is available to anyone with the active link. Update its protection or disable the link at any time.") : "Create a read-only link when you need to share this snippet. It stays private until you enable sharing."}</p>
          {paste.visibility === "unlisted" && <p className="share-security-status">{paste.hasSharePassword ? "Password protection is enabled." : "Anyone with the active link can view this snippet."}</p>}
          <label className="share-password-field" htmlFor="share-password">{paste.hasSharePassword ? "CHANGE SHARE PASSWORD" : "OPTIONAL SHARE PASSWORD"}
            <input id="share-password" type="password" autoComplete="new-password" minLength={8} maxLength={128} value={sharePassword} onChange={(event) => setSharePassword(event.target.value)} placeholder={paste.hasSharePassword ? "Enter a new password to replace it" : "At least 8 characters"} disabled={removeSharePassword} />
          </label>
          {paste.hasSharePassword && <label className="share-remove-password"><input type="checkbox" checked={removeSharePassword} onChange={(event) => setRemoveSharePassword(event.target.checked)} /> Remove password protection</label>}
          {paste.visibility === "unlisted" && <small>{paste.shareExpiresAt ? "Current expiry: " + new Date(paste.shareExpiresAt).toLocaleString() : "Current link has no expiry."}</small>}
          {paste.visibility === "unlisted" && Number(paste.shareViewLimit || 0) > 0 && (
            <p className="share-view-status" role="status">
              {Number(paste.shareViewCount || 0) >= Number(paste.shareViewLimit)
                ? "This link has reached its view limit. Increase the limit or choose Unlimited to reactivate it."
                : "Views used: " + Number(paste.shareViewCount || 0) + " / " + Number(paste.shareViewLimit) +
                  " · Remaining: " + Math.max(0, Number(paste.shareViewLimit) - Number(paste.shareViewCount || 0))}
            </p>
          )}
          {paste.visibility === "unlisted" && Number(paste.shareViewLimit || 0) === 0 && (
            <p className="share-view-status">Views used: {Number(paste.shareViewCount || 0)} · No view limit.</p>
          )}
          {paste.visibility !== "unlisted" && <SecretWarningNotice warnings={shareSecretWarnings} acknowledged={shareSecretAcknowledged} onAcknowledge={setShareSecretAcknowledged} />}
        </div>
        <div className="share-settings-actions">
          <label htmlFor="share-view-limit">MAXIMUM SUCCESSFUL VIEWS
            <select id="share-view-limit" value={shareViewLimit} onChange={(event) => setShareViewLimit(event.target.value)}>
              <option value="0">Unlimited</option>
              <option value="1">1 view</option>
              <option value="5">5 views</option>
              <option value="10">10 views</option>
              <option value="25">25 views</option>
              <option value="100">100 views</option>
            </select>
          </label>
          <small className="share-view-help">Only successful content views count. Incorrect password attempts do not consume a view.</small>
          <label htmlFor="share-duration">LINK LIFETIME
            <select id="share-duration" value={shareDuration} onChange={(event) => setShareDuration(event.target.value)}>
              <option value="1d">1 day</option>
              <option value="7d">7 days</option>
              <option value="30d">30 days</option>
              <option value="never">No expiration</option>
            </select>
          </label>
          <button className="primary-button" type="button" onClick={share}><Share2 size={15} /> {paste.visibility === "unlisted" ? "Update share settings" : "Create share link"}</button>
          {paste.visibility === "unlisted" && <button className="secondary-button" type="button" onClick={copyShareLink}><Link2 size={14} /> Copy link</button>}
          {paste.visibility === "unlisted" && <button className="secondary-button" type="button" onClick={disableShare}>Disable link</button>}
        </div>
      </section>

      {editing && editForm && (
        <form className="editor-panel snippet-form edit-snippet-form" onSubmit={saveEdit}>
          <div className="panel-heading">
            <div><p className="eyebrow">UPDATE YOUR KNOWLEDGE BASE</p><h2>Edit snippet</h2></div>
            <button className="icon-button" type="button" onClick={() => { setEditing(false); setEditForm(toEditForm(paste)); }} aria-label="Cancel editing"><X size={17} /></button>
          </div>
          <label htmlFor="edit-title">TITLE</label>
          <input id="edit-title" value={editForm.title} maxLength={100} onChange={(event) => changeEditField("title", event.target.value)} required />
          <div className="form-row">
            <div><label htmlFor="edit-language">LANGUAGE</label><select id="edit-language" value={editForm.language} onChange={(event) => changeEditField("language", event.target.value)}>{["cpp","python","javascript","typescript","java","go","rust","sql","html","css","json","bash","text"].map((value) => <option key={value}>{value}</option>)}</select></div>
            <div><label htmlFor="edit-category">TYPE</label><select id="edit-category" value={editForm.category} onChange={(event) => changeEditField("category", event.target.value)}><option value="solution">LeetCode solution</option><option value="snippet">Code snippet</option><option value="template">Template</option><option value="notes">Notes</option></select></div>
          </div>
          <label htmlFor="edit-content">CODE / NOTES</label>
          <textarea id="edit-content" className="code-input" rows={12} maxLength={1048576} value={editForm.content} onChange={(event) => changeEditField("content", event.target.value)} required />
          <SecretWarningNotice warnings={editSecretWarnings} acknowledged={secretAcknowledged} onAcknowledge={setSecretAcknowledged} />
          <label htmlFor="edit-approach">APPROACH / INTUITION</label>
          <textarea id="edit-approach" rows={4} maxLength={2000} value={editForm.approach} onChange={(event) => changeEditField("approach", event.target.value)} />
          <div className="form-row">
            <div><label htmlFor="edit-time">TIME COMPLEXITY</label><input id="edit-time" maxLength={80} value={editForm.timeComplexity} onChange={(event) => changeEditField("timeComplexity", event.target.value)} placeholder="O(n log n)" /></div>
            <div><label htmlFor="edit-space">SPACE COMPLEXITY</label><input id="edit-space" maxLength={80} value={editForm.spaceComplexity} onChange={(event) => changeEditField("spaceComplexity", event.target.value)} placeholder="O(n)" /></div>
          </div>
          <label htmlFor="edit-takeaway">KEY TAKEAWAY / EDGE CASES</label>
          <textarea id="edit-takeaway" rows={3} maxLength={1000} value={editForm.keyTakeaway} onChange={(event) => changeEditField("keyTakeaway", event.target.value)} />
          <div className="form-row">
            <div><label htmlFor="edit-problem">LEETCODE PROBLEM</label><input id="edit-problem" maxLength={120} value={editForm.problemTitle} onChange={(event) => changeEditField("problemTitle", event.target.value)} /></div>
            <div><label htmlFor="edit-difficulty">DIFFICULTY</label><select id="edit-difficulty" value={editForm.difficulty} onChange={(event) => changeEditField("difficulty", event.target.value)}><option value="">Not set</option><option>Easy</option><option>Medium</option><option>Hard</option></select></div>
          </div>
          <label htmlFor="edit-url">PROBLEM URL</label>
          <input id="edit-url" type="url" value={editForm.problemUrl} onChange={(event) => changeEditField("problemUrl", event.target.value)} />
          <div className="form-row">
            <div><label htmlFor="edit-topic">TOPIC / PATTERN</label><input id="edit-topic" maxLength={60} value={editForm.topic} onChange={(event) => changeEditField("topic", event.target.value)} /></div>
            <div><label htmlFor="edit-tags">TAGS <span className="label-muted">COMMA SEPARATED</span></label><input id="edit-tags" value={editForm.tags} onChange={(event) => changeEditField("tags", event.target.value)} /></div>
          </div>
          <label htmlFor="edit-folder">COLLECTION</label>
          <select id="edit-folder" value={editForm.folderId} onChange={(event) => changeEditField("folderId", event.target.value)}>
            <option value="">Unfiled</option>
            {folders.map((folder) => <option key={folder.id} value={folder.id}>{folder.name}</option>)}
          </select>
          <div className="editor-actions">
            <span>Edits are saved to version history.</span>
            <button className="primary-button" type="submit" disabled={saving}><Save size={15} /> {saving ? "Saving…" : "Save changes"}</button>
          </div>
        </form>
      )}

      <div className="detail-layout">
        <section className="detail-main">
          <div className="code-toolbar"><span><i></i><i></i><i></i> <b>{paste.language}</b></span><button type="button" onClick={copyCode}><Clipboard size={14} /> Copy</button></div>
          <CodeBlock code={paste.content} language={paste.language} />
          {paste.problemTitle && (
            <div className="problem-context">
              <p className="eyebrow">LINKED LEETCODE PROBLEM</p><strong>{paste.problemTitle}</strong>
              {paste.difficulty && <span className={"difficulty-pill " + paste.difficulty.toLowerCase()}>{paste.difficulty}</span>}
              {paste.problemUrl && <a href={paste.problemUrl} target="_blank" rel="noreferrer">Open problem <ExternalLink size={13} /></a>}
            </div>
          )}
          {(paste.approach || paste.timeComplexity || paste.spaceComplexity || paste.keyTakeaway) && (
            <section className="learning-notes" aria-label="Solution learning notes">
              <p className="eyebrow">THE THINKING BEHIND THE CODE</p>
              {paste.approach && <div><h3>Approach & intuition</h3><p>{paste.approach}</p></div>}
              {(paste.timeComplexity || paste.spaceComplexity) && <div className="complexity-row">
                {paste.timeComplexity && <span><small>TIME</small><strong>{paste.timeComplexity}</strong></span>}
                {paste.spaceComplexity && <span><small>SPACE</small><strong>{paste.spaceComplexity}</strong></span>}
              </div>}
              {paste.keyTakeaway && <div><h3>Key takeaway & edge cases</h3><p>{paste.keyTakeaway}</p></div>}
            </section>
          )}
          {paste.tags?.length > 0 && <div className="tag-row detail-tags">{paste.tags.map((tag) => <span key={tag}># {tag}</span>)}</div>}
          {paste.topic && <p className="topic-note">Pattern / topic: <strong>{paste.topic}</strong></p>}
        </section>
        <aside className="history-panel">
          <button className="history-toggle" type="button" onClick={() => setShowHistory(!showHistory)}><History size={16} /> Version history <span>{paste.historyCount}</span></button>
          {showHistory && <div className="history-list">{(paste.history || []).length ? paste.history.map((version) => (
            <article key={version.revisionId}>
              <div><strong>{version.title}</strong><small>{new Date(version.changedAt).toLocaleString()}</small><small>{version.language}</small></div>
              <button type="button" onClick={() => restore(version.revisionId)} title="Restore this version"><RotateCcw size={14} /></button>
            </article>
          )) : <p>No earlier versions yet. Edits are recorded here.</p>}</div>}
          <div className="visibility-note"><Link2 size={15} /><p><strong>{paste.visibility === "unlisted" ? "Unlisted link is active" : "Private snippet"}</strong><span>{paste.visibility === "unlisted" ? "Anyone with the link can view it. It is not listed in search." : "Only you can open this snippet while signed in."}</span></p></div>
        </aside>
      </div>
    </>
  );
}
