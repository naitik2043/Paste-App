import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { ArrowUpRight, Code2, Menu, Moon, ShieldCheck, Sun, X } from "lucide-react";
import { useSession } from "../context/useSession";

export default function PublicSiteLayout({ children }) {
  const { user, loading } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("paste-theme");
    return saved || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.style.colorScheme = theme;
    localStorage.setItem("paste-theme", theme);
  }, [theme]);

  const links = [{ to: "/about", label: "About" }, { to: "/help", label: "Help" }];

  return (
    <div className="public-site">
      <header className="public-header">
        <div className="public-header-inner">
          <Link to="/" className="public-brand" aria-label="Paste Vault home">
            <span className="public-brand-icon"><Code2 size={20} /></span>
            <span>Paste<span>Vault</span><small>CODE WORKSPACE</small></span>
          </Link>
          <nav className={"public-nav" + (menuOpen ? " is-open" : "")} aria-label="Main navigation">
            {links.map((link) => <NavLink key={link.to} to={link.to} onClick={() => setMenuOpen(false)}>{link.label}</NavLink>)}
            <Link className="public-mobile-cta" to={user ? "/dashboard" : "/signup"} onClick={() => setMenuOpen(false)}>{user ? "Open workspace" : "Create account"} <ArrowUpRight size={15} /></Link>
          </nav>
          <div className="public-header-actions">
            <button className="public-theme-toggle" type="button" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}>
              {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            {!loading && !user && <Link className="public-signin" to="/login">Sign in</Link>}
            <Link className="public-cta" to={user ? "/dashboard" : "/signup"}>{user ? "Open workspace" : "Get started"} <ArrowUpRight size={15} /></Link>
            <button className="public-menu-toggle" type="button" onClick={() => setMenuOpen((value) => !value)} aria-expanded={menuOpen} aria-label={menuOpen ? "Close navigation" : "Open navigation"}>
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      <main className="public-main">{children}</main>

      <footer className="public-footer">
        <div className="public-footer-main">
          <div className="public-footer-brand">
            <Link to="/" className="public-brand"><span className="public-brand-icon"><Code2 size={19} /></span><span>Paste<span>Vault</span><small>CODE WORKSPACE</small></span></Link>
            <p>A calm, private place to keep the code and problem-solving notes worth coming back to.</p>
            <span className="public-footer-trust"><ShieldCheck size={15} /> Private by default</span>
          </div>
          <div className="public-footer-column"><strong>Product</strong><Link to="/about">About Paste Vault</Link>{user ? <Link to="/dashboard">Open workspace</Link> : <><Link to="/signup">Create an account</Link><Link to="/login">Sign in</Link></>}</div>
          <div className="public-footer-column"><strong>Resources</strong><Link to="/help">Help centre</Link><Link to="/privacy">Privacy</Link><Link to="/terms">Terms</Link></div>
          <div className="public-footer-column"><strong>Connect</strong><a href="https://github.com/naitik2043/Paste-App" target="_blank" rel="noreferrer">GitHub <ArrowUpRight size={13} /></a><a href="https://leetmetric-sooty.vercel.app/" target="_blank" rel="noreferrer">LeetMetric <ArrowUpRight size={13} /></a></div>
        </div>
        <div className="public-footer-bottom"><span>© {new Date().getFullYear()} Paste Vault. All rights reserved.</span><span>Built for developers who learn by solving.</span></div>
      </footer>
    </div>
  );
}
