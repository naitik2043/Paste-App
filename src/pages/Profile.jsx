import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Braces, CalendarDays, Code2, ExternalLink, FileCode2, Github, Globe, Linkedin, LockKeyhole, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { useSession } from "../context/useSession";
import { LEETMETRIC_URL } from "../constants";
import PageTitle from "../components/PageTitle";
import toast from "react-hot-toast";

export default function Profile() {
  const { user } = useSession();
  const [stats, setStats] = useState(null);
  const displayName = user?.name || user?.email?.split("@")[0] || "Developer";
  const initials = displayName.split(/[\s._-]+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "DV";

  useEffect(() => {
    let active = true;
    fetch("/api/stats", { credentials: "same-origin", headers: { Accept: "application/json" } })
      .then(async (response) => {
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.error || "Unable to load workspace statistics.");
        if (active) setStats(result.stats || null);
      })
      .catch((error) => { if (active) toast.error(error.message); });
    return () => { active = false; };
  }, []);

  return (
    <>
      <PageTitle title="Your profile" />
      <section className="profile-hero">
        <div className="profile-cover"><div className="cover-grid"></div><span className="cover-label"><Sparkles size={14} /> DEVELOPER WORKSPACE</span></div>
        <div className="profile-identity">
          <div className="profile-avatar">{initials}</div>
          <div className="profile-name-block"><p className="eyebrow">ACCOUNT PROFILE</p><h1>{displayName}</h1><p>{user?.email || "Signed in with LeetMetric"}</p></div>
          <span className="account-status"><ShieldCheck size={14} /> Connected account</span>
        </div>
      </section>

      <section className="profile-grid">
        <article className="profile-panel profile-about">
          <div className="panel-heading"><div><p className="eyebrow">ABOUT YOUR WORKSPACE</p><h2>Personal developer vault</h2></div><UserRound size={21} /></div>
          <p className="profile-description">A focused space for your programming solutions, reusable code patterns, templates and debugging notes. Keep the implementation and the reasoning together, then find them when you need them again.</p>
          <div className="profile-facts">
            <div><LockKeyhole size={16} /><span><strong>Private by default</strong><small>Your saved snippets are visible only to your account unless you explicitly create an unlisted share link.</small></span></div>
            <div><Code2 size={16} /><span><strong>Problem-solving journal</strong><small>Save code with approach, complexity, edge cases, topics and tags.</small></span></div>
            <div><CalendarDays size={16} /><span><strong>Account identity</strong><small>Authentication and identity are managed by your connected LeetMetric account.</small></span></div>
          </div>
        </article>

        <aside className="profile-panel profile-stats">
          <div className="panel-heading"><div><p className="eyebrow">YOUR ACTIVITY</p><h2>Vault overview</h2></div><Braces size={21} /></div>
          <div className="profile-stat-list">
            <div><span>Total snippets</span><strong>{stats?.total ?? "—"}</strong></div>
            <div><span>Pinned references</span><strong>{stats?.pinned ?? "—"}</strong></div>
            <div><span>Active share links</span><strong>{stats?.unlisted ?? "—"}</strong></div>
            <div><span>Stored content</span><strong>{stats ? (stats.storedBytes / 1024).toFixed(1) + " KB" : "—"}</strong></div>
          </div>
          <Link className="secondary-link" to="/pastes">Explore your library <ArrowUpRight size={15} /></Link>
        </aside>

        <article className="profile-panel profile-connection">
          <div className="panel-heading"><div><p className="eyebrow">CONNECTED SERVICES</p><h2>Account & links</h2></div><Globe size={21} /></div>
          <div className="connection-row"><span className="connection-icon"><ShieldCheck size={17} /></span><span><strong>LeetMetric SSO</strong><small>Secure single sign-on provider</small></span><b>Connected</b></div>
          <a className="connection-row connection-link" href={LEETMETRIC_URL + "/dashboard.html"}><span className="connection-icon"><ExternalLink size={17} /></span><span><strong>LeetMetric dashboard</strong><small>Manage your linked coding profile</small></span><ArrowUpRight size={16} /></a>
          <a className="connection-row connection-link" href="https://github.com/naitik2043" target="_blank" rel="noreferrer"><span className="connection-icon"><Github size={17} /></span><span><strong>GitHub</strong><small>Project source and development</small></span><ArrowUpRight size={16} /></a>
          <a className="connection-row connection-link" href="https://www.linkedin.com/in/naitik2043/" target="_blank" rel="noreferrer"><span className="connection-icon"><Linkedin size={17} /></span><span><strong>LinkedIn</strong><small>Professional profile</small></span><ArrowUpRight size={16} /></a>
        </article>

        <article className="profile-panel profile-security">
          <div className="panel-heading"><div><p className="eyebrow">PRIVACY & SECURITY</p><h2>Your data, your control</h2></div><LockKeyhole size={21} /></div>
          <p>Paste Vault does not execute submitted code. Private API requests are scoped to your signed-in account. Unlisted links are accessible to anyone who has the link, so do not use them for credentials or sensitive data.</p>
          <div className="security-note"><ShieldCheck size={16} /><span>Sign-in is handled by LeetMetric. Paste Vault does not store a separate password for this account.</span></div>
        </article>
      </section>
    </>
  );
}
