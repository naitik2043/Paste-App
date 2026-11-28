import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { ArrowUpRight, BarChart3, Code2, FileCode2, GitCompareArrows, HelpCircle, House, LogOut, Menu, Moon, Settings as SettingsIcon, ShieldCheck, Sun, UserRound, X } from "lucide-react";
import toast from "react-hot-toast";
import { useSession } from "../context/useSession";
import { LEETMETRIC_URL } from "../constants";

function initialsFor(name) {
  return String(name || "Developer")
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "DV";
}

export default function AppShell() {
  const { user, logout } = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("paste-theme");
    return saved || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  });
  const [avatarFailed, setAvatarFailed] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("paste-theme", theme);
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  useEffect(() => {
    const syncTheme = (event) => {
      const nextTheme = event.detail?.theme || localStorage.getItem("paste-theme");
      if (nextTheme === "dark" || nextTheme === "light") setTheme(nextTheme);
    };
    window.addEventListener("paste-theme-change", syncTheme);
    return () => window.removeEventListener("paste-theme-change", syncTheme);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setAvatarFailed(false);
  }, [location.pathname]);

  const displayName = user?.name || user?.email?.split("@")[0] || "Developer";
  const initials = initialsFor(displayName);

  async function signOut() {
    try {
      await logout();
      toast.success("You have been signed out.");
      navigate("/login", { replace: true });
    } catch (error) {
      toast.error(error.message || "Unable to sign out.");
    }
  }

  return (
    <div className="app-frame">
      <header className="topbar">
        <div className="topbar-inner">
          <Link className="brand" to="/dashboard" aria-label="Paste Vault dashboard">
            <span className="brand-icon"><Code2 size={19} /></span>
            <span>Paste<span className="brand-accent">Vault</span><small className="brand-caption">DEVELOPER WORKSPACE</small></span>
          </Link>

          <button className="mobile-nav-toggle" type="button" onClick={() => setMobileMenuOpen((open) => !open)} aria-label={mobileMenuOpen ? "Close navigation" : "Open navigation"} aria-expanded={mobileMenuOpen}>
            {mobileMenuOpen ? <X size={19} /> : <Menu size={19} />}
          </button>

          <nav className={"main-nav" + (mobileMenuOpen ? " is-open" : "")} aria-label="Workspace navigation">
            <NavLink to="/dashboard" end><House size={16} /> Overview</NavLink>
            <NavLink to="/pastes"><FileCode2 size={16} /> Snippets</NavLink>
            <NavLink to="/analytics"><BarChart3 size={16} /> Analytics</NavLink>
            <NavLink to="/compare"><GitCompareArrows size={16} /> Compare</NavLink>
            <NavLink to="/profile"><UserRound size={16} /> Profile</NavLink>
            <NavLink to="/settings"><SettingsIcon size={16} /> Settings</NavLink>
          </nav>

          <div className="topbar-actions">
            <a className="back-link" href={LEETMETRIC_URL + "/dashboard.html"} target="_blank" rel="noreferrer">LeetMetric <ArrowUpRight size={12} /></a>
            <button className="icon-button" type="button" onClick={() => setTheme((current) => current === "dark" ? "light" : "dark")} aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"} title="Toggle theme">
              {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <Link className="profile-shortcut" to="/profile" aria-label={"Open profile for " + displayName}>
              <span className="avatar-mini">{user?.avatarUrl && !avatarFailed ? <img src={user.avatarUrl} alt="" onError={() => setAvatarFailed(true)} /> : initials}</span>
              <span className="user-chip">{displayName}</span>
            </Link>
            <button className="icon-button logout-button" type="button" onClick={signOut} aria-label="Sign out" title="Sign out"><LogOut size={17} /></button>
          </div>
        </div>
        <div className="topbar-context">
          <span><ShieldCheck size={13} /> Private workspace</span>
          <span className="topbar-context-divider" />
          <span>{user?.authProviders?.includes("leetmetric") ? "LeetMetric connected" : "Standalone account"}</span>
        </div>
      </header>

      <main className="page-container"><Outlet /></main>

      <footer className="app-footer">
        <div className="app-footer-main">
          <div className="footer-brand-row"><span className="brand-icon"><Code2 size={16} /></span><strong>Paste<span className="brand-accent">Vault</span></strong><span className="footer-divider">|</span><span>Code worth keeping.</span></div>
          <div className="app-footer-links"><Link to="/about">About</Link><Link to="/help"><HelpCircle size={13} /> Help</Link><Link to="/privacy">Privacy</Link><Link to="/terms">Terms</Link><Link to="/settings">Account settings</Link></div>
        </div>
        <div className="footer-trust"><span><ShieldCheck size={13} /> Private by default</span><span>Built for focused problem-solving</span><span>© {new Date().getFullYear()} Paste Vault</span></div>
      </footer>
    </div>
  );
}
