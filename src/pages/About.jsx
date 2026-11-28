import { Link } from "react-router-dom";
import { ArrowRight, Code2, FolderOpen, LockKeyhole, Sparkles } from "lucide-react";
import PageTitle from "../components/PageTitle";

export default function About() {
  return (
      <div className="public-content-page">
      <PageTitle title="About Paste Vault" description="Learn how Paste Vault helps developers preserve code, patterns and the reasoning behind their solutions." noindex={false} />
      <section className="public-page-hero"><div className="landing-pill"><Sparkles size={14} /> ABOUT PASTE VAULT</div><h1>A home for the code<br /><span>you want to remember.</span></h1><p>Paste Vault is a developer workspace for keeping solutions, reusable snippets and the reasoning behind them in one place.</p></section>
      <div className="about-card-grid">
        <article><span><Code2 size={20} /></span><h2>Made for learning through building</h2><p>Code is only part of a useful reference. Save the approach, complexity, edge cases and notes alongside your implementation.</p></article>
        <article><span><FolderOpen size={20} /></span><h2>Organized around your workflow</h2><p>Use collections, language filters, tags, pinned snippets and search to bring the right reference back quickly.</p></article>
        <article><span><LockKeyhole size={20} /></span><h2>Designed with privacy first</h2><p>Your snippets begin as private. Sharing is explicit, optional and configurable with expiry, password protection and view limits.</p></article>
      </div>
      <section className="public-callout"><div><p className="eyebrow">YOUR WORKSPACE, YOUR WAY</p><h2>Use Paste Vault independently or with LeetMetric.</h2><p>Sign up directly with email, or keep using the existing LeetMetric single sign-on experience.</p></div><Link className="public-cta" to="/signup">Get started <ArrowRight size={16} /></Link></section>
    </div>
  );
}
