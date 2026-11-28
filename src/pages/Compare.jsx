import { useEffect, useMemo, useState } from "react";
import { ArrowRightLeft, Code2, GitCompareArrows, Info, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import CodeBlock from "../components/CodeBlock";
import PageTitle from "../components/PageTitle";
import { getLanguageLabel } from "../data/languages.js";

async function readJson(response, fallback) {
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || fallback);
  return result;
}

function SolutionPanel({ side, language, onLanguageChange, languages, candidates, selectedId, onSnippetChange, detail, loading }) {
  const title = side === "left" ? "Implementation A" : "Implementation B";
  const lineCount = detail?.content ? detail.content.split("\n").length : 0;
  return (
    <section className="compare-panel">
      <div className="compare-panel-heading">
        <div><p className="eyebrow">{title}</p><h2>{language ? getLanguageLabel(language) : "Select a language"}</h2></div>
        <span className="compare-language-mark"><Code2 size={17} /></span>
      </div>
      <label className="compare-field">
        <span>PROGRAMMING LANGUAGE</span>
        <select value={language} onChange={(event) => onLanguageChange(event.target.value)} disabled={!languages.length}>
          {languages.map((value) => <option key={value} value={value}>{getLanguageLabel(value)}</option>)}
        </select>
      </label>
      <label className="compare-field">
        <span>SAVED SOLUTION</span>
        <select value={selectedId} onChange={(event) => onSnippetChange(event.target.value)} disabled={!candidates.length}>
          {candidates.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
        </select>
      </label>
      {loading ? <div className="compare-code-loading" role="status"><RefreshCw size={16} /> Loading implementation…</div> : detail ? (
        <>
          <div className="compare-code-meta">
            <span>{lineCount} lines</span>
            <span>{detail.content.length.toLocaleString()} characters</span>
          </div>
          <CodeBlock code={detail.content} language={detail.language} />
          <div className="compare-complexity">
            <div><span>Time complexity</span><strong>{detail.timeComplexity || "Not recorded"}</strong></div>
            <div><span>Space complexity</span><strong>{detail.spaceComplexity || "Not recorded"}</strong></div>
          </div>
        </>
      ) : <div className="compare-empty-code">Choose a saved solution in this language.</div>}
    </section>
  );
}

export default function Compare() {
  const [snippets, setSnippets] = useState([]);
  const [problemTitle, setProblemTitle] = useState("");
  const [leftLanguage, setLeftLanguage] = useState("");
  const [rightLanguage, setRightLanguage] = useState("");
  const [leftSnippetId, setLeftSnippetId] = useState("");
  const [rightSnippetId, setRightSnippetId] = useState("");
  const [leftDetail, setLeftDetail] = useState(null);
  const [rightDetail, setRightDetail] = useState(null);
  const [loadingLibrary, setLoadingLibrary] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [libraryLimited, setLibraryLimited] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadSolutions() {
      setLoadingLibrary(true);
      try {
        const first = await readJson(
          await fetch("/api/pastes?limit=50&page=1", { credentials: "same-origin" }),
          "Unable to load saved solutions."
        );
        const totalPages = first.pagination?.pages || 1;
        const pagesToLoad = Math.min(totalPages, 10);
        const remaining = await Promise.all(
          Array.from({ length: Math.max(0, pagesToLoad - 1) }, (_, index) =>
            fetch("/api/pastes?limit=50&page=" + (index + 2), { credentials: "same-origin" })
              .then((response) => readJson(response, "Unable to load saved solutions."))
          )
        );
        const all = [first, ...remaining].flatMap((page) => page.pastes || []);
        if (!active) return;
        const withProblems = all.filter((item) => item.problemTitle && item.category === "solution");
        setSnippets(withProblems);
        setLibraryLimited(totalPages > pagesToLoad);
        setProblemTitle((current) => current || withProblems[0]?.problemTitle.trim() || "");
      } catch (error) {
        if (active) toast.error(error.message);
      } finally {
        if (active) setLoadingLibrary(false);
      }
    }
    loadSolutions();
    return () => { active = false; };
  }, []);

  const problems = useMemo(
    () => [...new Set(snippets.map((item) => item.problemTitle.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [snippets]
  );
  const problemSolutions = useMemo(
    () => snippets.filter((item) => item.problemTitle.trim() === problemTitle),
    [snippets, problemTitle]
  );
  const availableLanguages = useMemo(
    () => [...new Set(problemSolutions.map((item) => item.language))].sort((a, b) => getLanguageLabel(a).localeCompare(getLanguageLabel(b))),
    [problemSolutions]
  );
  const leftCandidates = useMemo(() => problemSolutions.filter((item) => item.language === leftLanguage), [problemSolutions, leftLanguage]);
  const rightCandidates = useMemo(() => problemSolutions.filter((item) => item.language === rightLanguage), [problemSolutions, rightLanguage]);

  useEffect(() => {
    if (!availableLanguages.length) {
      setLeftLanguage("");
      setRightLanguage("");
      return;
    }
    if (!availableLanguages.includes(leftLanguage)) setLeftLanguage(availableLanguages[0]);
    if (!availableLanguages.includes(rightLanguage) || (availableLanguages.length > 1 && rightLanguage === leftLanguage)) {
      setRightLanguage(availableLanguages.find((language) => language !== leftLanguage) || availableLanguages[0]);
    }
  }, [availableLanguages, leftLanguage, rightLanguage]);

  useEffect(() => {
    if (!leftCandidates.some((item) => item.id === leftSnippetId)) setLeftSnippetId(leftCandidates[0]?.id || "");
  }, [leftCandidates, leftSnippetId]);

  useEffect(() => {
    if (!rightCandidates.some((item) => item.id === rightSnippetId)) setRightSnippetId(rightCandidates[0]?.id || "");
  }, [rightCandidates, rightSnippetId]);

  useEffect(() => {
    let active = true;
    if (!leftSnippetId || !rightSnippetId) {
      setLeftDetail(null);
      setRightDetail(null);
      setLoadingDetails(false);
      return undefined;
    }
    setLoadingDetails(true);
    setLeftDetail(null);
    setRightDetail(null);
    Promise.all([
      fetch("/api/pastes/" + encodeURIComponent(leftSnippetId), { credentials: "same-origin" })
        .then((response) => readJson(response, "Unable to load implementation A.")),
      fetch("/api/pastes/" + encodeURIComponent(rightSnippetId), { credentials: "same-origin" })
        .then((response) => readJson(response, "Unable to load implementation B."))
    ]).then(([left, right]) => {
      if (!active) return;
      setLeftDetail(left.paste);
      setRightDetail(right.paste);
    }).catch((error) => {
      if (active) toast.error(error.message);
    }).finally(() => {
      if (active) setLoadingDetails(false);
    });
    return () => { active = false; };
  }, [leftSnippetId, rightSnippetId]);

  function swapLanguages() {
    setLeftLanguage(rightLanguage);
    setRightLanguage(leftLanguage);
    setLeftSnippetId(rightSnippetId);
    setRightSnippetId(leftSnippetId);
  }

  return (
    <>
      <PageTitle title="Compare solutions across languages" />
      <section className="compare-intro">
        <div>
          <p className="eyebrow">CROSS-LANGUAGE LEARNING</p>
          <h1>Compare the same problem<br /><span>in different languages.</span></h1>
          <p>Review your saved implementations side by side. Compare syntax, structure and the time/space complexity notes you recorded.</p>
        </div>
        <div className="compare-intro-icon"><GitCompareArrows size={29} /></div>
      </section>

      <section className="compare-controls">
        <label className="compare-field compare-problem-field">
          <span>PROBLEM / SOLUTION GROUP</span>
          <select value={problemTitle} onChange={(event) => setProblemTitle(event.target.value)} disabled={loadingLibrary || !problems.length}>
            {problems.map((problem) => <option key={problem} value={problem}>{problem}</option>)}
          </select>
        </label>
        <div className="compare-control-note"><Info size={15} /> Save the same problem in two or more languages to compare implementations here.</div>
      </section>

      {loadingLibrary ? <div className="empty-panel">Loading your saved solutions…</div> : !problems.length ? (
        <div className="empty-panel compare-empty-state">
          <GitCompareArrows size={27} />
          <h2>No comparable solutions yet</h2>
          <p>Save at least one LeetCode solution with a problem title. Add another implementation in a different language to unlock side-by-side comparison.</p>
          <Link className="primary-button" to="/dashboard">Create a solution</Link>
        </div>
      ) : (
        <>
          {availableLanguages.length < 2 && <div className="compare-notice">This problem currently has a saved solution in only one language. Save another implementation in a different language to make a cross-language comparison.</div>}
          <div className="compare-toolbar">
            <span><strong>{problemSolutions.length}</strong> saved implementation{problemSolutions.length === 1 ? "" : "s"} for this problem</span>
            <button type="button" className="secondary-button" onClick={swapLanguages} disabled={availableLanguages.length < 2}><ArrowRightLeft size={15} /> Swap languages</button>
          </div>
          <div className="compare-grid">
            <SolutionPanel side="left" language={leftLanguage} onLanguageChange={setLeftLanguage} languages={availableLanguages} candidates={leftCandidates} selectedId={leftSnippetId} onSnippetChange={setLeftSnippetId} detail={leftDetail} loading={loadingDetails} />
            <SolutionPanel side="right" language={rightLanguage} onLanguageChange={setRightLanguage} languages={availableLanguages} candidates={rightCandidates} selectedId={rightSnippetId} onSnippetChange={setRightSnippetId} detail={rightDetail} loading={loadingDetails} />
          </div>
          {libraryLimited && <p className="compare-footnote">Showing solutions from the 500 most recently updated snippets. Update a solution to bring it into this comparison list.</p>}
          <p className="compare-footnote">Complexity values are your saved notes, not measured runtime benchmarks. Execution speed depends on the environment, input and implementation.</p>
        </>
      )}
    </>
  );
}
