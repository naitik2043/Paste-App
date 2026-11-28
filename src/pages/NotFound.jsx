import { ArrowLeft, FileQuestion } from "lucide-react";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <main className="launch-screen">
      <section className="launch-card" aria-labelledby="not-found-title">
        <div className="launch-logo"><FileQuestion size={24} /></div>
        <p className="eyebrow">PASTE VAULT / 404</p>
        <h1 id="not-found-title">This page isn't<br /><span>in your vault.</span></h1>
        <p className="launch-copy">The address may be incorrect, or the page may have moved. Your saved snippets remain safely stored in your workspace.</p>
        <Link className="primary-button launch-button" to="/"><ArrowLeft size={17} /> Return to your vault</Link>
      </section>
    </main>
  );
}
