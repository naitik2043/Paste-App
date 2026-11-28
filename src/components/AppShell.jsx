import { Link, NavLink, Outlet } from "react-router-dom";
import { Code2, FileCode2, House, LogOut, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { useSession } from "../context/useSession";
import { LEETMETRIC_URL } from "../constants";

export default function AppShell() {
  const { user, logout } = useSession();
  const [theme, setTheme] = useState(() => localStorage.getItem("paste-theme") || "dark");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("paste-theme", theme);
  }, [theme]);

  return (
    <div className="app-frame">
      <header className="topbar">
        <Link className="brand" to="/"><span className="brand-icon"><Code2 size={19} /></span><span>Paste<span className="brand-accent">Vault</span></span></Link>
        <nav className="main-nav" aria-label="Main navigation">
          <NavLink to="/" end><House size={16} /> Overview</NavLink>
          <NavLink to="/pastes"><FileCode2 size={16} /> Snippets</NavLink>
        </nav>
        <div className="topbar-actions">
          <a className="back-link" href={LEETMETRIC_URL + "/dashboard.html"}>← LeetMetric</a>
          <button className="icon-button" type="button" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label="Toggle theme">
            {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <span className="user-chip" title={user?.email || ""}>{user?.name || user?.email || "Developer"}</span>
          <button className="icon-button" type="button" onClick={() => logout()} aria-label="Log out"><LogOut size={17} /></button>
        </div>
      </header>
      <main className="page-container"><Outlet /></main>
      <footer className="app-footer">
        <span>Paste Vault · A private code workspace for LeetMetric</span>
        <span>Private by default · Synced to your account</span>
      </footer>
    </div>
  );
}
