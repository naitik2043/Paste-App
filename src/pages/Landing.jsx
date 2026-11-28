import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Braces, Check, Clock3, Code2, Database, FolderOpen, GitBranch, LockKeyhole, ShieldCheck, Sparkles, TerminalSquare } from "lucide-react";
import PageTitle from "../components/PageTitle";

const features = [
  { icon: Code2, title: "Code that stays organized", copy: "Keep solutions, reusable snippets, templates and technical notes in one searchable workspace." },
  { icon: FolderOpen, title: "Collections that make sense", copy: "Group snippets by topic, language, project or the way you naturally think." },
  { icon: GitBranch, title: "A history of your thinking", copy: "Revisit earlier versions and restore a previous implementation when an experiment goes sideways." },
  { icon: LockKeyhole, title: "Private until you share", copy: "Snippets start private. Create unlisted links with optional password, expiry and view limits." },
  { icon: Database, title: "Your work stays portable", copy: "Export your vault as JSON and import it into another Paste Vault account when needed." },
  { icon: Clock3, title: "Less searching, more building", copy: "Find what you saved with filters for language, type, tags, folders and pinned references." }
];

export default function Landing() {
  return (
      <PageTitle title="A focused code workspace for developers" description="Save programming solutions, reusable patterns and technical notes in a private, searchable developer workspace." noindex={false} />
    <div className="landing-page">
      <section className="landing-hero">
        <div className="landing-hero-copy">
          <div className="landing-pill"><Sparkles size={14} /> A focused workspace for developers</div>
          <h1>Keep the code.<br /><span>Remember the thinking.</span></h1>
          <p className="landing-lead">Paste Vault helps you save programming solutions, reusable patterns and debugging notes—so the work you have already done is easy to find again.</p>
          <div className="landing-actions">
            <Link className="public-cta landing-primary" to="/signup">Create your free workspace <ArrowRight size={17} /></Link>
            <Link className="landing-secondary" to="/login">I already have an account <ArrowUpRight size={15} /></Link>
          </div>
          <div className="landing-trust-row"><span><ShieldCheck size={15} /> Private by default</span><span><Code2 size={15} /> Built for code</span><span><Database size={15} /> Exportable data</span></div>
        </div>
        <div className="landing-product-visual" aria-label="Preview of a code snippet workspace">
          <div className="visual-window">
            <div className="visual-window-bar"><div className="visual-dots"><i /><i /><i /></div><span>paste-vault / workspace</span><span className="visual-status"><span /> Saved</span></div>
            <div className="visual-app">
              <aside className="visual-sidebar">
                <div className="visual-side-brand"><span><Code2 size={14} /></span> PasteVault</div>
                <small>WORKSPACE</small>
                <div className="visual-side-active"><Braces size={13} /> All snippets <b>24</b></div>
                <div><FolderOpen size={13} /> Dynamic programming</div>
                <div><FolderOpen size={13} /> Graph patterns</div>
                <div><FolderOpen size={13} /> Templates</div>
                <small>QUICK FILTERS</small>
                <div><Sparkles size={13} /> Pinned references</div>
              </aside>
              <div className="visual-editor">
                <div className="visual-editor-head"><span>SNIPPET / LEETCODE SOLUTION</span><span className="visual-private"><LockKeyhole size={11} /> PRIVATE</span></div>
                <h3>Binary search on answer</h3>
                <p>Find the smallest feasible value with a monotonic check.</p>
                <div className="visual-code">
                  <div><em>01</em><span><b>int</b> low = 1, high = maxValue;</span></div>
                  <div><em>02</em><span><b>while</b> (low &lt; high) {'{'}</span></div>
                  <div><em>03</em><span>  <b>int</b> mid = low + (high - low) / 2;</span></div>
                  <div><em>04</em><span>  <b>if</b> (isPossible(mid)) high = mid;</span></div>
                  <div><em>05</em><span>  <b>else</b> low = mid + 1;</span></div>
                  <div><em>06</em><span>{'}'}</span></div>
                  <div><em>07</em><span><b>return</b> low;</span></div>
                </div>
                <div className="visual-note"><Sparkles size={13} /><span><b>Key takeaway</b> — Define a monotonic feasibility check before binary searching.</span></div>
                <div className="visual-tags"><span>C++</span><span>Binary Search</span><span>Medium</span></div>
              </div>
            </div>
          </div>
          <div className="visual-float-card"><span><Check size={14} /></span><div><b>Saved to your vault</b><small>Available whenever you need it</small></div></div>
          <div className="visual-glow" />
        </div>
      </section>

      <section className="landing-integration">
        <div className="integration-icon"><TerminalSquare size={20} /></div>
        <div><strong>Works on its own. Fits your LeetMetric workflow.</strong><p>Create a Paste Vault account directly, or continue using the existing LeetMetric single sign-on integration.</p></div>
        <a href="https://leetmetric-sooty.vercel.app/" target="_blank" rel="noreferrer">Explore LeetMetric <ArrowUpRight size={14} /></a>
      </section>

      <section className="landing-features" id="features">
        <div className="landing-section-heading"><p className="eyebrow">A BETTER HOME FOR YOUR CODE</p><h2>Everything useful.<br /><span>Nothing in the way.</span></h2><p>Keep the implementation and the reasoning together, then get back to solving the next problem.</p></div>
        <div className="landing-feature-grid">
          {features.map(({ icon: Icon, title, copy }, index) => (
            <article className="landing-feature-card" key={title}><span className="feature-number">0{index + 1}</span><div className="landing-feature-icon"><Icon size={20} /></div><h3>{title}</h3><p>{copy}</p></article>
          ))}
        </div>
      </section>

      <section className="landing-how">
        <div><p className="eyebrow">SIMPLE BY DESIGN</p><h2>From solved to <span>saved.</span></h2><p>Build a personal knowledge base without changing how you work.</p></div>
        <div className="landing-steps">
          <article><b>01</b><div><strong>Create your account</strong><p>Sign up with your email, verify it and open your private workspace.</p></div></article>
          <article><b>02</b><div><strong>Capture the important bits</strong><p>Save code, approach, complexity, tags and the problem it belongs to.</p></div></article>
          <article><b>03</b><div><strong>Find and reuse later</strong><p>Search, filter, pin, organize or securely share a snippet when you choose.</p></div></article>
        </div>
      </section>

      <section className="landing-bottom-cta"><div><p className="eyebrow">YOUR NEXT SOLUTION STARTS HERE</p><h2>Build a library of what<br /><span>you have learned.</span></h2><p>Start with one snippet. Keep the ideas that make you a better developer.</p></div><Link className="public-cta landing-primary" to="/signup">Create your workspace <ArrowRight size={17} /></Link></section>
    </div>
  );
}
