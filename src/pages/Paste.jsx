import { useEffect, useState } from "react";
import { Search, SlidersHorizontal, Plus } from "lucide-react";
import toast from "react-hot-toast";
import PasteCard from "../components/PasteCard";
import PageTitle from "../components/PageTitle";
import { Link, useSearchParams } from "react-router-dom";

export default function Paste() {
  const [items, setItems] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("search") || searchParams.get("q") || "");
  const [language, setLanguage] = useState("");
  const [category, setCategory] = useState("");
  const [pinned, setPinned] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const nextQuery = searchParams.get("search") || searchParams.get("q") || "";
    setQuery((current) => current === nextQuery ? current : nextQuery);
  }, [searchParams]);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      const params = new URLSearchParams({ limit: "50" });
      if (query.trim()) params.set("q", query.trim());
      if (language) params.set("language", language);
      if (category) params.set("category", category);
      if (pinned) params.set("pinned", "true");
      try {
        const response = await fetch("/api/pastes?" + params.toString(), { credentials: "same-origin", signal: controller.signal });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.error || "Unable to search your snippets.");
        if (active) setItems(result.pastes || []);
      } catch (error) {
        if (active && error.name !== "AbortError") toast.error(error.message);
      } finally {
        if (active) setLoading(false);
      }
    }, 180);
    return () => { active = false; clearTimeout(timer); controller.abort(); };
  }, [query, language, category, pinned]);

  return (
    <>
      <PageTitle title="Snippet library" />
      <section className="library-heading"><div><p className="eyebrow">YOUR PRIVATE KNOWLEDGE BASE</p><h1>Snippet library</h1><p>Search by title, code, problem, tag or topic.</p></div><Link className="primary-button" to="/?new=1"><Plus size={15} /> New snippet</Link></section>
      <section className="filter-panel">
        <div className="search-box"><Search size={17} /><input aria-label="Search snippets" value={query} onChange={(e) => { setQuery(e.target.value); const next = new URLSearchParams(searchParams); if (e.target.value.trim()) next.set("search", e.target.value); else next.delete("search"); setSearchParams(next, { replace: true }); }} placeholder="Search title, code, topic or tag…" /></div>
        <div className="filter-controls"><SlidersHorizontal size={16} /><select aria-label="Filter by language" value={language} onChange={(e) => setLanguage(e.target.value)}><option value="">All languages</option>{["cpp","python","javascript","typescript","java","go","rust","sql","html","css","json","bash","text"].map((v) => <option key={v}>{v}</option>)}</select><select aria-label="Filter by category" value={category} onChange={(e) => setCategory(e.target.value)}><option value="">All types</option><option value="solution">Solutions</option><option value="snippet">Snippets</option><option value="template">Templates</option><option value="notes">Notes</option></select><label className="check-filter"><input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} /> Pinned only</label></div>
      </section>
      <div className="results-caption">{loading ? "Searching your vault…" : items.length + " snippets found"}</div>
      {items.length ? <div className="paste-grid">{items.map((paste) => <PasteCard key={paste.id} paste={paste} />)}</div> : <div className="empty-panel">{loading ? "Loading your snippets…" : "No snippets match these filters. Try a different search or save a new snippet."}</div>}
    </>
  );
}
