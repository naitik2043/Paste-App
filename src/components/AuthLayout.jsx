import { Link } from "react-router-dom";
import { ArrowLeft, Code2, ShieldCheck } from "lucide-react";

export default function AuthLayout({ children, eyebrow = "YOUR PRIVATE CODE WORKSPACE" }) {
  return (
    <main className="auth-page">
      <div className="auth-topbar">
        <Link to="/" className="public-brand"><span className="public-brand-icon"><Code2 size={19} /></span><span>Paste<span>Vault</span><small>CODE WORKSPACE</small></span></Link>
        <Link to="/" className="auth-back-link"><ArrowLeft size={15} /> Back to home</Link>
      </div>
      <div className="auth-content">
        <section className="auth-card">
          <div className="auth-card-mark"><Code2 size={21} /></div>
          <p className="eyebrow">{eyebrow}</p>
          {children}
          <div className="auth-assurance"><ShieldCheck size={14} /> Your private snippets stay tied to your account.</div>
        </section>
      </div>
      <p className="auth-copyright">© {new Date().getFullYear()} Paste Vault</p>
    </main>
  );
}
