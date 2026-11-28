import { useState } from "react";
import { Folder, FolderPlus, Pencil, Trash2, Check, X, Layers3, Inbox } from "lucide-react";
import toast from "react-hot-toast";

const COLORS = ["blue", "violet", "green", "amber", "rose", "slate"];

export default function FolderManager({ folders = [], activeFolderId = "", onSelect, onRefresh }) {
  const [creating, setCreating] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createColor, setCreateColor] = useState("blue");
  const [editingId, setEditingId] = useState("");
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("blue");
  const [busy, setBusy] = useState(false);

  async function createFolder(event) {
    event.preventDefault();
    if (!createName.trim()) return;
    setBusy(true);
    try {
      const response = await fetch("/api/folders", {
        method: "POST", credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: createName, color: createColor })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Unable to create folder.");
      setCreateName("");
      setCreateColor("blue");
      setCreating(false);
      await onRefresh();
      onSelect(result.folder.id);
      toast.success("Collection created.");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusy(false);
    }
  }

  function beginEdit(folder) {
    setEditingId(folder.id);
    setEditName(folder.name);
    setEditColor(folder.color || "blue");
  }

  async function saveEdit(event) {
    event.preventDefault();
    setBusy(true);
    try {
      const response = await fetch("/api/folders/" + encodeURIComponent(editingId), {
        method: "PATCH", credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, color: editColor })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Unable to rename folder.");
      setEditingId("");
      await onRefresh();
      toast.success("Collection updated.");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function deleteFolder(folder) {
    if (!window.confirm('Delete the "' + folder.name + '" collection? Its snippets will move to Unfiled; no code will be deleted.')) return;
    setBusy(true);
    try {
      const response = await fetch("/api/folders/" + encodeURIComponent(folder.id), {
        method: "DELETE", credentials: "same-origin"
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Unable to delete folder.");
      if (activeFolderId === folder.id) onSelect("");
      await onRefresh();
      toast.success("Collection deleted. Its snippets were kept in Unfiled.");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="folder-manager" aria-label="Snippet collections">
      <div className="folder-manager-heading">
        <div><p className="eyebrow">ORGANIZE YOUR WORK</p><h2>Collections</h2></div>
        <button className="icon-button" type="button" onClick={() => { setCreating((value) => !value); setEditingId(""); }} aria-label="Create collection" title="Create collection" disabled={busy}><FolderPlus size={16} /></button>
      </div>
      <div className="folder-list">
        <button type="button" className={"folder-row" + (activeFolderId === "" ? " active" : "")} onClick={() => onSelect("")}>
          <span className="folder-row-icon"><Layers3 size={16} /></span><span className="folder-row-name">All snippets</span>
        </button>
        <button type="button" className={"folder-row" + (activeFolderId === "unfiled" ? " active" : "")} onClick={() => onSelect("unfiled")}>
          <span className="folder-row-icon"><Inbox size={16} /></span><span className="folder-row-name">Unfiled</span>
        </button>
        {folders.map((folder) => editingId === folder.id ? (
          <form className="folder-edit-row" key={folder.id} onSubmit={saveEdit}>
            <input aria-label="Collection name" value={editName} maxLength={40} onChange={(event) => setEditName(event.target.value)} required autoFocus />
            <select aria-label="Collection color" value={editColor} onChange={(event) => setEditColor(event.target.value)}>{COLORS.map((color) => <option key={color} value={color}>{color}</option>)}</select>
            <button type="submit" aria-label="Save collection" disabled={busy}><Check size={14} /></button>
            <button type="button" aria-label="Cancel edit" onClick={() => setEditingId("")}><X size={14} /></button>
          </form>
        ) : (
          <div className={"folder-row-wrap" + (activeFolderId === folder.id ? " active" : "")} key={folder.id}>
            <button type="button" className={"folder-row folder-color-" + (folder.color || "blue")} onClick={() => onSelect(folder.id)}>
              <span className="folder-row-icon"><Folder size={16} /></span>
              <span className="folder-row-name">{folder.name}</span>
              <span className="folder-row-count">{folder.count || 0}</span>
            </button>
            <div className="folder-row-actions">
              <button type="button" onClick={() => beginEdit(folder)} aria-label={"Rename " + folder.name} title="Rename"><Pencil size={12} /></button>
              <button type="button" onClick={() => deleteFolder(folder)} aria-label={"Delete " + folder.name} title="Delete" disabled={busy}><Trash2 size={12} /></button>
            </div>
          </div>
        ))}
      </div>
      {creating && <form className="folder-create-form" onSubmit={createFolder}>
        <input aria-label="New collection name" value={createName} maxLength={40} onChange={(event) => setCreateName(event.target.value)} placeholder="e.g. Dynamic Programming" required autoFocus />
        <div className="folder-create-actions">
          <select aria-label="Collection color" value={createColor} onChange={(event) => setCreateColor(event.target.value)}>{COLORS.map((color) => <option key={color} value={color}>{color}</option>)}</select>
          <button className="primary-button" type="submit" disabled={busy}>{busy ? "Saving…" : "Create"}</button>
          <button className="secondary-button" type="button" onClick={() => setCreating(false)}><X size={13} /> Cancel</button>
        </div>
      </form>}
      {!folders.length && !creating && <p className="folder-empty-copy">Create collections to keep DSA patterns, project snippets and reusable templates together.</p>}
    </section>
  );
}
