import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Download, FileJson2, Import, Plus, Search, SlidersHorizontal, ChevronLeft, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";
import PasteCard from "../components/PasteCard";
import PageTitle from "../components/PageTitle";
import FolderManager from "../components/FolderManager";

const EXPORT_FORMAT = "paste-vault-export";
const EXPORT_VERSION = 1;
const EXPORT_PAGE_SIZE = 3;
const IMPORT_BATCH_SIZE = 3;

async function readJsonResponse(response, fallback) {
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || fallback);
  return result;
}

export default function Paste() {
  const [items, setItems] = useState([]);
  const [folders, setFolders] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("search") || searchParams.get("q") || "");
  const [language, setLanguage] = useState(searchParams.get("language") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [pinned, setPinned] = useState(searchParams.get("pinned") === "true");
  const [folderId, setFolderId] = useState(searchParams.get("folderId") || "");
  const [page, setPage] = useState(Math.max(1, Number(searchParams.get("page")) || 1));
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState("");
  const [refreshVersion, setRefreshVersion] = useState(0);
  const fileInputRef = useRef(null);

  const refreshFolders = useCallback(async () => {
    const response = await fetch("/api/folders", { credentials: "same-origin" });
    const result = await readJsonResponse(response, "Unable to load your collections.");
    setFolders(result.folders || []);
  }, []);

  useEffect(() => {
    refreshFolders().catch((error) => toast.error(error.message));
  }, [refreshFolders]);

  useEffect(() => {
    const next = {
      query: searchParams.get("search") || searchParams.get("q") || "",
      language: searchParams.get("language") || "",
      category: searchParams.get("category") || "",
      pinned: searchParams.get("pinned") === "true",
      folderId: searchParams.get("folderId") || "",
      page: Math.max(1, Number(searchParams.get("page")) || 1)
    };
    setQuery((value) => value === next.query ? value : next.query);
    setLanguage((value) => value === next.language ? value : next.language);
    setCategory((value) => value === next.category ? value : next.category);
    setPinned((value) => value === next.pinned ? value : next.pinned);
    setFolderId((value) => value === next.folderId ? value : next.folderId);
    setPage((value) => value === next.page ? value : next.page);
  }, [searchParams]);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      const params = new URLSearchParams({ limit: "50", page: String(page) });
      if (query.trim()) params.set("q", query.trim());
      if (language) params.set("language", language);
      if (category) params.set("category", category);
      if (pinned) params.set("pinned", "true");
      if (folderId) params.set("folderId", folderId);
      try {
        const response = await fetch("/api/pastes?" + params.toString(), {
          credentials: "same-origin", signal: controller.signal
        });
        const result = await readJsonResponse(response, "Unable to search your snippets.");
        if (active) {
          setItems(result.pastes || []);
          setPagination(result.pagination || { page: 1, pages: 1, total: 0 });
        }
      } catch (error) {
        if (active && error.name !== "AbortError") toast.error(error.message);
      } finally {
        if (active) setLoading(false);
      }
    }, 180);
    return () => { active = false; clearTimeout(timer); controller.abort(); };
  }, [query, language, category, pinned, folderId, page, refreshVersion]);

  function updateUrl(next) {
    const params = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(next)) {
      if (value === "" || value === false || value == null) params.delete(key);
      else params.set(key, String(value));
    }
    setSearchParams(params, { replace: true });
  }

  function changeFolder(id) {
    setFolderId(id);
    setPage(1);
    updateUrl({ folderId: id, page: "" });
  }

  async function exportVault() {
    setExporting(true);
    try {
      const firstResponse = await fetch("/api/export?page=1&limit=" + EXPORT_PAGE_SIZE, { credentials: "same-origin" });
      const first = await readJsonResponse(firstResponse, "Unable to export your vault.");
      const allSnippets = [...(first.snippets || [])];
      const foldersToExport = first.folders || [];
      const totalPages = first.pagination?.pages || 1;
      for (let current = 2; current <= totalPages; current += 1) {
        const response = await fetch("/api/export?page=" + current + "&limit=" + EXPORT_PAGE_SIZE, { credentials: "same-origin" });
        const result = await readJsonResponse(response, "Export stopped while reading page " + current + ".");
        allSnippets.push(...(result.snippets || []));
      }
      const payload = {
        format: EXPORT_FORMAT,
        version: EXPORT_VERSION,
        exportedAt: first.exportedAt || new Date().toISOString(),
        folders: foldersToExport,
        snippets: allSnippets
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "paste-vault-backup-" + new Date().toISOString().slice(0, 10) + ".json";
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success("Exported " + allSnippets.length + " snippets.");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setExporting(false);
    }
  }

  async function importVault(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > 100 * 1024 * 1024) return toast.error("Import files must be 100 MB or smaller.");
    setImporting(true);
    setImportProgress("Reading backup…");
    let imported = 0;
    try {
      const backup = JSON.parse(await file.text());
      if (backup?.format !== EXPORT_FORMAT || Number(backup?.version) !== EXPORT_VERSION || !Array.isArray(backup.snippets)) {
        throw new Error("This is not a supported Paste Vault JSON backup.");
      }
      if (backup.snippets.length > 2000) throw new Error("A backup can contain up to 2,000 snippets.");
      const known = new Set(folders.map((folder) => folder.name.toLocaleLowerCase("en-US")));
      for (const folder of (backup.folders || [])) {
        const name = String(folder.name || "").trim();
        if (!name || known.has(name.toLocaleLowerCase("en-US"))) continue;
        const response = await fetch("/api/folders", {
          method: "POST", credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, color: folder.color || "blue" })
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok && !(response.status === 409 && /conflicting record/i.test(result.error || ""))) throw new Error(result.error || "Unable to restore collections.");
        known.add(name.toLocaleLowerCase("en-US"));
      }
      for (let offset = 0; offset < backup.snippets.length; offset += IMPORT_BATCH_SIZE) {
        const batch = backup.snippets.slice(offset, offset + IMPORT_BATCH_SIZE);
        setImportProgress("Importing " + Math.min(offset + batch.length, backup.snippets.length) + " of " + backup.snippets.length + "…");
        const response = await fetch("/api/import", {
          method: "POST", credentials: "same-origin",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ format: EXPORT_FORMAT, version: EXPORT_VERSION, snippets: batch })
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.error || "Import stopped after " + imported + " snippets.");
        imported += Number(result.imported || 0);
      }
      await refreshFolders();
      setRefreshVersion((value) => value + 1);
      toast.success("Imported " + imported + " snippets. All imported snippets were kept private.");
    } catch (error) {
      toast.error((imported ? "Imported " + imported + " snippets before stopping. " : "") + error.message);
      if (imported) setRefreshVersion((value) => value + 1);
    } finally {
      setImporting(false);
      setImportProgress("");
    }
  }

  const activeFolderName = folders.find((folder) => folder.id === folderId)?.name
    || (folderId === "unfiled" ? "Unfiled" : "All snippets");

  return (
    <>
      <PageTitle title="Snippet library" />
      <section className="library-heading library-heading-tools">
        <div><p className="eyebrow">YOUR PRIVATE KNOWLEDGE BASE</p><h1>Snippet library</h1><p>Search, organize and back up your code knowledge.</p></div>
        <div className="library-heading-actions">
          <button className="secondary-button" type="button" onClick={exportVault} disabled={exporting || importing}><Download size={15} /> {exporting ? "Exporting…" : "Export JSON"}</button>
          <button className="secondary-button" type="button" onClick={() => fileInputRef.current?.click()} disabled={importing || exporting}><Import size={15} /> {importing ? "Importing…" : "Import JSON"}</button>
          <input ref={fileInputRef} className="visually-hidden" type="file" accept=".json,application/json" onChange={importVault} />
          <Link className="primary-button" to="/?new=1"><Plus size={15} /> New snippet</Link>
        </div>
      </section>
      {(importing || exporting) && <div className="transfer-status" role="status">{importing ? importProgress : "Preparing your complete vault backup…"}</div>}
      <div className="library-workspace">
        <aside className="library-sidebar">
          <FolderManager folders={folders} activeFolderId={folderId} onSelect={changeFolder} onRefresh={refreshFolders} />
          <div className="backup-note"><FileJson2 size={16} /><p><strong>Portable backup</strong><span>Exports include code and learning notes. Share passwords and active share tokens are never exported.</span></p></div>
        </aside>
        <main className="library-main">
          <div className="library-context-row"><div><p className="eyebrow">CURRENT COLLECTION</p><h2>{activeFolderName}</h2></div><span>{pagination.total || 0} snippets</span></div>
          <section className="filter-panel">
            <div className="search-box"><Search size={17} /><input aria-label="Search snippets" value={query} onChange={(event) => { const value = event.target.value; setQuery(value); setPage(1); updateUrl({ search: value.trim(), page: "" }); }} placeholder="Search title, code, topic or tag…" /></div>
            <div className="filter-controls"><SlidersHorizontal size={16} /><select aria-label="Filter by language" value={language} onChange={(event) => { setLanguage(event.target.value); setPage(1); updateUrl({ language: event.target.value, page: "" }); }}><option value="">All languages</option>{["cpp","python","javascript","typescript","java","go","rust","sql","html","css","json","bash","text"].map((value) => <option key={value} value={value}>{value}</option>)}</select><select aria-label="Filter by category" value={category} onChange={(event) => { setCategory(event.target.value); setPage(1); updateUrl({ category: event.target.value, page: "" }); }}><option value="">All types</option><option value="solution">Solutions</option><option value="snippet">Snippets</option><option value="template">Templates</option><option value="notes">Notes</option></select><label className="check-filter"><input type="checkbox" checked={pinned} onChange={(event) => { setPinned(event.target.checked); setPage(1); updateUrl({ pinned: event.target.checked, page: "" }); }} /> Pinned only</label></div>
          </section>
          <div className="results-caption">{loading ? "Searching your vault…" : "Showing " + items.length + " of " + pagination.total + " snippets"}</div>
          {items.length ? <div className="paste-grid">{items.map((paste) => <PasteCard key={paste.id} paste={paste} />)}</div> : <div className="empty-panel">{loading ? "Loading your snippets…" : "No snippets match this collection and these filters. Try another collection or save a new snippet."}</div>}
          {pagination.pages > 1 && <div className="pagination-controls"><button type="button" className="secondary-button" disabled={page <= 1 || loading} onClick={() => { const next = page - 1; setPage(next); updateUrl({ page: next }); }}><ChevronLeft size={15} /> Previous</button><span>Page {pagination.page} of {pagination.pages}</span><button type="button" className="secondary-button" disabled={page >= pagination.pages || loading} onClick={() => { const next = page + 1; setPage(next); updateUrl({ page: next }); }}>Next <ChevronRight size={15} /></button></div>}
        </main>
      </div>
    </>
  );
}
