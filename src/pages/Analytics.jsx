import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, BookOpenCheck, Braces, BarChart3, Code2, GitCompareArrows, Layers3, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import PageTitle from "../components/PageTitle";
import { getLanguageLabel } from "../data/languages.js";

function BarRow({ label, value, maximum }) {
  const width = maximum > 0 ? Math.max(3, (value / maximum) * 100) : 0;
  return (
    <div className="analytics-bar-row">
      <div><span>{label}</span><strong>{value}</strong></div>
      <div className="analytics-track"><span style={{ width: width + "%" }} /></div>
    </div>
  );
}

export default function Analytics() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/stats", { credentials: "same-origin" });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Unable to load workspace analytics.");
      setStats(result.stats || null);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const totalDifficulty = useMemo(
    () => (stats?.difficultyBreakdown || []).reduce((sum, row) => sum + row.count, 0),
    [stats]
  );
  const maxDifficulty = Math.max(1, ...(stats?.difficultyBreakdown || []).map((row) => row.count));
  const maxTopic = Math.max(1, ...(stats?.topicBreakdown || []).map((row) => row.count));
  const maxLanguage = Math.max(1, ...(stats?.topLanguages || []).map((row) => row.count));
  const maxActivity = Math.max(1, ...(stats?.monthlyActivity || []).map((row) => row.count));

  return (
    <>
      <PageTitle title="Developer workspace analytics" />
      <section className="analytics-intro">
        <div><p className="eyebrow">YOUR LEARNING SIGNALS</p><h1>Progress you can <span>learn from.</span></h1><p>Understand what you save, which problem areas you revisit and how your code library grows.</p></div>
        <button className="secondary-button" type="button" onClick={load} disabled={loading}><RefreshCw size={14} className={loading ? "analytics-spinning" : ""} /> Refresh</button>
      </section>

      {loading && !stats ? <div className="empty-panel">Preparing your analytics…</div> : stats ? (
        <>
          <section className="analytics-stat-grid">
            <article><span><Braces size={15} /> Saved snippets</span><strong>{stats.total}</strong><small>All code and learning notes</small></article>
            <article><span><BookOpenCheck size={15} /> DSA solutions</span><strong>{stats.solutionCount || 0}</strong><small>Saved problem-solving entries</small></article>
            <article><span><Layers3 size={15} /> Topics tracked</span><strong>{stats.topicCount || 0}</strong><small>Distinct topics recorded</small></article>
            <article><span><Code2 size={15} /> Languages used</span><strong>{stats.languageCount || 0}</strong><small>Distinct languages in your vault</small></article>
          </section>

          <div className="analytics-grid">
            <section className="analytics-card">
              <div className="analytics-card-heading"><div><p className="eyebrow">PROBLEM DIFFICULTY</p><h2>Difficulty distribution</h2></div><Activity size={18} /></div>
              <p className="analytics-supporting-copy">{totalDifficulty} solutions have an Easy, Medium or Hard label.</p>
              {(stats.difficultyBreakdown || []).length ? stats.difficultyBreakdown.map((row) => <BarRow key={row.difficulty} label={row.difficulty} value={row.count} maximum={maxDifficulty} />) : <p className="muted-copy">Difficulty data will appear as you save problem solutions.</p>}
            </section>

            <section className="analytics-card">
              <div className="analytics-card-heading"><div><p className="eyebrow">LANGUAGE MIX</p><h2>Languages in your vault</h2></div><Code2 size={18} /></div>
              {(stats.topLanguages || []).length ? stats.topLanguages.map((row) => <BarRow key={row.language} label={getLanguageLabel(row.language)} value={row.count} maximum={maxLanguage} />) : <p className="muted-copy">Save snippets in multiple languages to see your language mix.</p>}
            </section>

            <section className="analytics-card">
              <div className="analytics-card-heading"><div><p className="eyebrow">TOPIC COVERAGE</p><h2>Patterns you practice</h2></div><Layers3 size={18} /></div>
              {(stats.topicBreakdown || []).length ? stats.topicBreakdown.map((row) => <BarRow key={row.topic} label={row.topic} value={row.count} maximum={maxTopic} />) : <p className="muted-copy">Add a topic or pattern to your saved solutions to build this view.</p>}
            </section>

            <section className="analytics-card">
              <div className="analytics-card-heading"><div><p className="eyebrow">SIX-MONTH ACTIVITY</p><h2>Library growth</h2></div><BarChart3 size={18} /></div>
              <div className="analytics-months">
                {(stats.monthlyActivity || []).map((row) => (
                  <div className="analytics-month" key={row.month}>
                    <strong>{row.count}</strong>
                    <div className="analytics-month-track"><span style={{ height: Math.max(4, (row.count / maxActivity) * 100) + "%" }} /></div>
                    <small>{row.label}</small>
                  </div>
                ))}
              </div>
              <p className="analytics-supporting-copy">New snippets created in each month, based on their original save date.</p>
            </section>
          </div>

          <section className="analytics-next-step">
            <div><p className="eyebrow">TURN INSIGHT INTO PRACTICE</p><h2>Compare how you solve the same problem.</h2><p>Review syntax and your recorded complexity notes across programming languages.</p></div>
            <Link className="primary-button" to="/compare"><GitCompareArrows size={15} /> Compare solutions</Link>
          </section>
        </>
      ) : <div className="empty-panel">Analytics are temporarily unavailable. Try refreshing the page.</div>}
    </>
  );
}
