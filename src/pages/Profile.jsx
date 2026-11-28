import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Braces, Camera, Check, Code2, ExternalLink, Github, Globe, Linkedin, LockKeyhole, MapPin, Save, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import toast from "react-hot-toast";
import PageTitle from "../components/PageTitle";
import { useSession } from "../context/useSession";

const EMPTY_PROFILE = {
  name: "",
  bio: "",
  location: "",
  avatarUrl: "",
  website: "",
  github: "",
  linkedin: ""
};

function initialsFor(name) {
  return String(name || "Developer")
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "DV";
}

export default function Profile() {
  const { user, refresh } = useSession();
  const [stats, setStats] = useState(null);
  const [form, setForm] = useState(() => ({ ...EMPTY_PROFILE, ...(user || {}) }));
  const [saving, setSaving] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);

  useEffect(() => {
    setForm({ ...EMPTY_PROFILE, ...(user || {}) });
    setAvatarFailed(false);
  }, [user]);

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

  const displayName = form.name || user?.email?.split("@")[0] || "Developer";
  const initials = useMemo(() => initialsFor(displayName), [displayName]);
  const providers = user?.authProviders || [];

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
    if (key === "avatarUrl") setAvatarFailed(false);
  }

  async function saveProfile(event) {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await fetch("/api/auth/profile", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          name: form.name,
          bio: form.bio,
          location: form.location,
          avatarUrl: form.avatarUrl,
          website: form.website,
          github: form.github,
          linkedin: form.linkedin
        })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Unable to save profile changes.");
      await refresh();
      toast.success("Your profile has been updated.");
    } catch (error) {
      toast.error(error.message || "Unable to save profile changes.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageTitle title="Your profile" />
      <section className="profile-hero">
        <div className="profile-cover"><div className="cover-grid" /><span className="cover-label"><Sparkles size={14} /> DEVELOPER WORKSPACE</span></div>
        <div className="profile-identity">
          <div className="profile-avatar profile-avatar-preview">
            {form.avatarUrl && !avatarFailed
              ? <img src={form.avatarUrl} alt={displayName + " profile"} onError={() => setAvatarFailed(true)} />
              : initials}
          </div>
          <div className="profile-name-block">
            <p className="eyebrow">ACCOUNT PROFILE</p>
            <h1>{displayName}</h1>
            <p>{user?.email || "Your Paste Vault account"}</p>
            {form.location && <span className="profile-location"><MapPin size={13} /> {form.location}</span>}
          </div>
          <span className="account-status"><ShieldCheck size={14} /> {providers.includes("leetmetric") ? "LeetMetric linked" : "Standalone account"}</span>
        </div>
      </section>

      <section className="profile-grid profile-grid-editable">
        <article className="profile-panel profile-edit-panel">
          <div className="panel-heading"><div><p className="eyebrow">YOUR PUBLIC-FACING DETAILS</p><h2>Edit profile</h2></div><UserRound size={21} /></div>
          <p className="profile-description">Personalize your workspace identity. Your email address is managed by your sign-in provider and cannot be changed here.</p>
          <form className="profile-edit-form" onSubmit={saveProfile}>
            <div className="profile-avatar-editor">
              <div className="profile-avatar profile-avatar-preview">
                {form.avatarUrl && !avatarFailed ? <img src={form.avatarUrl} alt="Profile avatar preview" onError={() => setAvatarFailed(true)} /> : initials}
              </div>
              <div><strong>Profile image</strong><small>Use a public HTTPS image URL. For privacy, use an image host you trust.</small></div>
              <Camera size={17} />
            </div>
            <label className="profile-edit-field"><span>Display name</span><input value={form.name} maxLength={60} onChange={(event) => update("name", event.target.value)} placeholder="Your name" required /></label>
            <label className="profile-edit-field"><span>Short bio <small>{form.bio.length}/180</small></span><textarea value={form.bio} maxLength={180} rows={3} onChange={(event) => update("bio", event.target.value)} placeholder="What are you working on or learning?" /></label>
            <label className="profile-edit-field"><span>Avatar image URL</span><input type="url" value={form.avatarUrl} maxLength={500} onChange={(event) => update("avatarUrl", event.target.value)} placeholder="https://example.com/avatar.png" /></label>
            <label className="profile-edit-field"><span>Location</span><input value={form.location} maxLength={80} onChange={(event) => update("location", event.target.value)} placeholder="City, country (optional)" /></label>
            <div className="profile-edit-section-title"><span>Links</span><small>Use HTTPS URLs</small></div>
            <label className="profile-edit-field"><span><Globe size={14} /> Website</span><input type="url" value={form.website} maxLength={500} onChange={(event) => update("website", event.target.value)} placeholder="https://your-website.com" /></label>
            <label className="profile-edit-field"><span><Github size={14} /> GitHub</span><input type="url" value={form.github} maxLength={500} onChange={(event) => update("github", event.target.value)} placeholder="https://github.com/username" /></label>
            <label className="profile-edit-field"><span><Linkedin size={14} /> LinkedIn</span><input type="url" value={form.linkedin} maxLength={500} onChange={(event) => update("linkedin", event.target.value)} placeholder="https://linkedin.com/in/username" /></label>
            <div className="profile-edit-actions"><span><LockKeyhole size={13} /> Your account email stays private.</span><button className="primary-button" type="submit" disabled={saving}><Save size={15} /> {saving ? "Saving…" : "Save profile"}</button></div>
          </form>
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
          <div className="profile-settings-callout"><ShieldCheck size={16} /><span><strong>Account controls</strong><small>Manage password, theme and connected sign-in providers.</small><Link to="/settings">Open settings <ArrowUpRight size={13} /></Link></span></div>
        </aside>

        <article className="profile-panel profile-connection">
          <div className="panel-heading"><div><p className="eyebrow">CONNECTED SERVICES</p><h2>Sign-in methods</h2></div><Globe size={21} /></div>
          <div className="connection-row"><span className="connection-icon"><ShieldCheck size={17} /></span><span><strong>Paste Vault email</strong><small>{user?.emailVerified ? "Email address verified" : providers.includes("email") ? "Verification pending" : "Not linked"}</small></span><b className={providers.includes("email") && user?.emailVerified ? "" : "connection-muted"}>{providers.includes("email") ? "Enabled" : "Not linked"}</b></div>
          <div className="connection-row"><span className="connection-icon"><ExternalLink size={17} /></span><span><strong>LeetMetric SSO</strong><small>Single sign-on through your coding workspace</small></span><b className={providers.includes("leetmetric") ? "" : "connection-muted"}>{providers.includes("leetmetric") ? "Connected" : "Not linked"}</b></div>
          <p className="profile-connection-note">Both sign-in methods open the same vault when they are linked to the same user record. Account identities with different email addresses are not merged automatically.</p>
        </article>
      </section>
    </>
  );
}
