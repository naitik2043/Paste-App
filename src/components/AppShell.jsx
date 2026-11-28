import { Link, NavLink, Outlet } from "react-router-dom";
import { Code2, FileCode2, House, LogOut, Moon, Sun, UserRound, ExternalLink, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { useSession } from "../context/useSession";
import { LEETMETRIC_URL } from "../constants";

export default function AppShell() {
  const { user, logout } = useSession();
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("paste-theme");
    return saved || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("paste-theme", theme);
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  const displayName = user?.name || user?.email?.split("@")[0] || "Developer";
  const initials = displayName.split(/[\s._-]+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "DV";

  return (
    <div className="app-frame">
      <header className="topbar">
        <Link className="brand" to="/" aria-label="Paste Vault home">
          <span className="brand-icon"><Code2 size={19} /></span>
          <span>Paste<span className="brand-accent">Vault</span><small className="brand-caption">DEVELOPER WORKSPACE</small></span>
        </Link>
        <nav className="main-nav" aria-label="Main navigation">
          <NavLink to="/" end><House size={16} /> Overview</NavLink>
          <NavLink to="/pastes"><FileCode2 size={16} /> Snippets</NavLink>
          <NavLink to="/profile"><UserRound size={16} /> Profile</NavLink>
        </nav>
        <div className="topbar-actions">
          <a className="back-link" href={LEETMETRIC_URL + "/dashboard.html"}>LeetMetric <ExternalLink size={12} /></a>
          <button className="icon-button" type="button" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"} title="Toggle theme">
            {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <Link className="profile-shortcut" to="/profile" aria-label="Open your profile"><span className="avatar-mini">{initials}</span><span className="user-chip">{displayName}</span></Link>
          <button className="icon-button logout-button" type="button" onClick={() => logout()} aria-label="Log out" title="Log out"><LogOut size={17} /></button>
        </div>
      </header>
      <main className="page-container"><Outlet /></main>
      <footer className="app-footer">
        <div className="footer-brand-row"><span className="brand-icon"><Code2 size={16} /></span><strong>Paste<span className="brand-accent">Vault</span></strong><span className="footer-divider">|</span><span>Code worth keeping.</span></div>
        <div className="footer-trust"><span><ShieldCheck size={13} /> Private by default</span><span>Built for focused problem-solving</span><span>© {new Date().getFullYear()} Paste Vault</span></div>
      </footer>
    </div>
  );
}
