import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight, Braces, FileCode2, LockKeyhole, Plus, Sparkles, Tag } from "lucide-react";
import toast from "react-hot-toast";
import PasteCard from "../components/PasteCard";
import PageTitle from "../components/PageTitle";

const emptyForm = {
  title: "", content: "", language: "cpp", category: "solution", problemTitle: "",
  problemUrl: "", difficulty: "Medium", topic: "", approach: "", timeComplexity: "",
  spaceComplexity: "", keyTakeaway: "", tags: "", visibility: "private"
};

export default function Home() {
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/stats", { credentials: "same-origin" }).then((r) => r.json()),
      fetch("/api/pastes?limit=4", { credentials: "same-origin" }).then((r) => r.json())
    ]).then(([summary, list]) => {
      setStats(summary.stats || null);
      setRecent(list.pastes || []);
    }).catch(() => toast.error("Unable to load your snippet workspace."));
  }, []);

  useEffect(() => {
    if (searchParams.get("new") === "1") document.getElementById("snippet-title")?.focus();
  }, [searchParams]);

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  async function savePaste(event) {
    event.preventDefault();
    if (!form.title.trim() || !form.content.trim()) return toast.error("Add a title and some code first.");
    setSaving(true);
    try {
      const payload = { ...form, tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean) };
      const response = await fetch("/api/pastes", {
        method: "POST", credentials: "same-origin",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Could not save this snippet.");
      toast.success("Snippet saved to your private vault.");
      setForm(emptyForm);
      setRecent((items) => [result.paste, ...items].slice(0, 4));
      const summary = await fetch("/api/stats", { credentials: "same-origin" }).then((r) => r.json());
      setStats(summary.stats || null);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageTitle title="Your code, organized" />
      <section className="welcome-row">
        <div><p className="eyebrow">PRIVATE DEVELOPER WORKSPACE</p><h1>Save the solution.<br /><span>Remember the thinking.</span></h1><p className="welcome-copy">Capture LeetCode solutions, reusable patterns and debugging notes. Find them when the next problem looks familiar.</p></div>
        <div className="welcome-badge"><Sparkles size={18} /><span>LeetMetric connected</span></div>
      </section>

      <section className="stats-grid" aria-label="Vault statistics">
        <article className="stat-card"><span>Total snippets</span><strong>{stats?.total ?? "—"}</strong><small>Saved to your account</small></article>
        <article className="stat-card"><span>Pinned snippets</span><strong>{stats?.pinned ?? "—"}</strong><small>Quick-access references</small></article>
        <article className="stat-card"><span>Shared links</span><strong>{stats?.unlisted ?? "—"}</strong><small>Unlisted snippets</small></article>
        <article className="stat-card"><span>Stored content</span><strong>{stats ? (stats.storedBytes / 1024).toFixed(1) + " KB" : "—"}</strong><small>Text and code only</small></article>
      </section>

      <section className="workspace-grid">
        <div className="editor-panel">
          <div className="panel-heading"><div><p className="eyebrow">QUICK CAPTURE</p><h2>New snippet</h2></div><span className="private-indicator"><LockKeyhole size={13} /> Private</span></div>
          <form className="snippet-form" onSubmit={savePaste}>
            <label htmlFor="snippet-title">TITLE</label>
            <input id="snippet-title" value={form.title} maxLength={100} onChange={(e) => update("title", e.target.value)} placeholder="e.g. Binary search on answer" required />
            <div className="form-row">
              <div><label htmlFor="snippet-language">LANGUAGE</label><select id="snippet-language" value={form.language} onChange={(e) => update("language", e.target.value)}>{["cpp","python","javascript","typescript","java","go","rust","sql","html","css","json","bash","text"].map((v) => <option key={v} value={v}>{v}</option>)}</select></div>
              <div><label htmlFor="snippet-category">TYPE</label><select id="snippet-category" value={form.category} onChange={(e) => update("category", e.target.value)}><option value="solution">LeetCode solution</option><option value="snippet">Code snippet</option><option value="template">Template</option><option value="notes">Notes</option></select></div>
            </div>
            <label htmlFor="snippet-content">CODE / NOTES <span className="label-muted">UP TO 1 MB</span></label>
            <textarea id="snippet-content" className="code-input" value={form.content} onChange={(e) => update("content", e.target.value)} placeholder={"// Your accepted or reusable implementation…"} rows={11} required />
            <label htmlFor="snippet-approach">APPROACH / INTUITION <span className="label-muted">UP TO 2,000 CHARACTERS</span></label>
            <textarea id="snippet-approach" value={form.approach} maxLength={2000} onChange={(e) => update("approach", e.target.value)} placeholder="Why does this approach work? Describe the key observation and algorithm." rows={4} />
            <div className="form-row">
              <div><label htmlFor="snippet-time">TIME COMPLEXITY</label><input id="snippet-time" value={form.timeComplexity} maxLength={80} onChange={(e) => update("timeComplexity", e.target.value)} placeholder="e.g. O(n log n)" /></div>
              <div><label htmlFor="snippet-space">SPACE COMPLEXITY</label><input id="snippet-space" value={form.spaceComplexity} maxLength={80} onChange={(e) => update("spaceComplexity", e.target.value)} placeholder="e.g. O(n)" /></div>
            </div>
            <label htmlFor="snippet-takeaway">KEY TAKEAWAY / EDGE CASES <span className="label-muted">UP TO 1,000 CHARACTERS</span></label>
            <textarea id="snippet-takeaway" value={form.keyTakeaway} maxLength={1000} onChange={(e) => update("keyTakeaway", e.target.value)} placeholder="What did you learn? Which edge case or mistake should you remember?" rows={3} />
            <div className="form-row">
              <div><label htmlFor="snippet-problem">LEETCODE PROBLEM</label><input id="snippet-problem" value={form.problemTitle} maxLength={120} onChange={(e) => update("problemTitle", e.target.value)} placeholder="e.g. Two Sum" /></div>
              <div><label htmlFor="snippet-difficulty">DIFFICULTY</label><select id="snippet-difficulty" value={form.difficulty} onChange={(e) => update("difficulty", e.target.value)}><option value="">Not set</option><option>Easy</option><option>Medium</option><option>Hard</option></select></div>
            </div>
            <label htmlFor="snippet-url">PROBLEM URL</label>
            <input id="snippet-url" type="url" value={form.problemUrl} onChange={(e) => update("problemUrl", e.target.value)} placeholder="https://leetcode.com/problems/two-sum/" />
            <div className="form-row">
              <div><label htmlFor="snippet-topic">TOPIC / PATTERN</label><input id="snippet-topic" value={form.topic} maxLength={60} onChange={(e) => update("topic", e.target.value)} placeholder="e.g. Hash Map" /></div>
              <div><label htmlFor="snippet-tags">TAGS <span className="label-muted">COMMA SEPARATED</span></label><input id="snippet-tags" value={form.tags} onChange={(e) => update("tags", e.target.value)} placeholder="arrays, patterns" /></div>
            </div>
            <div className="editor-actions"><span>Saved to your private workspace</span><button className="primary-button" type="submit" disabled={saving}><Plus size={16} /> {saving ? "Saving…" : "Save snippet"}</button></div>
          </form>
        </div>

        <aside className="insight-panel">
          <div className="panel-heading"><div><p className="eyebrow">YOUR LIBRARY</p><h2>Knowledge, reusable.</h2></div><Braces size={22} /></div>
          <p className="insight-copy">A solution is more valuable when you can retrieve the pattern behind it. Keep the code, link the problem and add the note you wish you had next time.</p>
          <div className="insight-list"><div><FileCode2 size={17} /><span><strong>Problem-linked code</strong><small>Connect a snippet to its LeetCode problem.</small></span></div><div><Tag size={17} /><span><strong>Searchable patterns</strong><small>Organize by topic, language and custom tags.</small></span></div><div><LockKeyhole size={17} /><span><strong>Private by default</strong><small>Sharing only happens when you choose Unlisted.</small></span></div></div>
          <Link className="secondary-link" to="/pastes">Browse all snippets <ArrowRight size={16} /></Link>
          <div className="language-breakdown"><p className="eyebrow">TOP LANGUAGES</p>{(stats?.topLanguages || []).length ? stats.topLanguages.map((row) => <div key={row.language}><span>{row.language}</span><b>{row.count}</b></div>) : <p className="muted-copy">Your language trends appear after you save snippets.</p>}</div>
        </aside>
      </section>

      <section className="recent-section">
        <div className="section-title-row"><div><p className="eyebrow">RECENTLY UPDATED</p><h2>Pick up where you left off</h2></div><Link to="/pastes">View library <ArrowRight size={15} /></Link></div>
        {recent.length ? <div className="paste-grid">{recent.map((paste) => <PasteCard key={paste.id} paste={paste} />)}</div> : <div className="empty-panel">Your vault is ready. Save your first snippet above and it will appear here.</div>}
      </section>
    </>
  );
}
