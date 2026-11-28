import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowUpRight, CheckCircle2, KeyRound, LockKeyhole, LogOut, Moon, ShieldCheck, Sun, UserRound } from "lucide-react";
import toast from "react-hot-toast";
import PageTitle from "../components/PageTitle";
import { useSession } from "../context/useSession";
import { LEETMETRIC_URL } from "../constants";

export default function Settings() {
  const { user, logout } = useSession();
  const navigate = useNavigate();
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [savingPassword, setSavingPassword] = useState(false);
  const [linkForm, setLinkForm] = useState({ password: "", confirmPassword: "" });
  const [linking, setLinking] = useState(false);
  const [linkResult, setLinkResult] = useState(null);
  const [theme, setTheme] = useState(() => localStorage.getItem("paste-theme") || (document.documentElement.classList.contains("dark") ? "dark" : "light"));
  const hasEmailSignIn = (user?.authProviders || []).includes("email");
  const hasLeetMetric = (user?.authProviders || []).includes("leetmetric");

  function changeTheme(nextTheme) {
    setTheme(nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
    document.documentElement.style.colorScheme = nextTheme;
    localStorage.setItem("paste-theme", nextTheme);
    window.dispatchEvent(new CustomEvent("paste-theme-change", { detail: { theme: nextTheme } }));
  }

  function updatePasswordField(key, value) {
    setPasswordForm((current) => ({ ...current, [key]: value }));
  }

  async function updatePassword(event) {
    event.preventDefault();
    if (passwordForm.newPassword.length < 12) return toast.error("Use a password with at least 12 characters.");
    if (passwordForm.newPassword.length > 128) return toast.error("Your password must be 128 characters or fewer.");
    if (passwordForm.newPassword !== passwordForm.confirmPassword) return toast.error("The new passwords do not match.");

    setSavingPassword(true);
    try {
      const response = await fetch("/api/auth/password", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Unable to update your password.");
      await logout();
      toast.success(result.message || "Password updated. Sign in again.");
      navigate("/login", { replace: true });
    } catch (error) {
      toast.error(error.message || "Unable to update your password.");
    } finally {
      setSavingPassword(false);
    }
  }

  async function linkStandaloneSignIn(event) {
    event.preventDefault();
    if (linkForm.password.length < 12) return toast.error("Use a password with at least 12 characters.");
    if (linkForm.password.length > 128) return toast.error("Your password must be 128 characters or fewer.");
    if (linkForm.password !== linkForm.confirmPassword) return toast.error("The passwords do not match.");

    setLinking(true);
    setLinkResult(null);
    try {
      const response = await fetch("/api/auth/link-email", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ password: linkForm.password })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok && !result.pendingVerification) throw new Error(result.error || "Unable to link standalone sign-in.");
      setLinkResult({
        message: result.message || result.error || "Standalone sign-in is waiting for email verification.",
        verificationUrl: result.verificationUrl || "",
        pending: true
      });
      setLinkForm({ password: "", confirmPassword: "" });
      toast.success("Standalone sign-in setup started.");
    } catch (error) {
      setLinkResult({ message: error.message || "Unable to link standalone sign-in.", pending: /already pending/i.test(error.message || "") });
      toast.error(error.message || "Unable to link standalone sign-in.");
    } finally {
      setLinking(false);
    }
  }

  async function resendLinkVerification() {
    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ email: user?.email })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Unable to resend verification email.");
      setLinkResult({
        message: result.message || "If an unverified account exists, a new verification email will be sent.",
        verificationUrl: result.verificationUrl || "",
        pending: true
      });
      toast.success("Verification request processed.");
    } catch (error) {
      setLinkResult({ message: error.message || "Unable to resend verification email.", pending: true });
      toast.error(error.message || "Unable to resend verification email.");
    }
  }

  async function signOut() {
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (error) {
      toast.error(error.message || "Unable to sign out.");
    }
  }

  return (
    <>
      <PageTitle title="Settings" />
      <section className="settings-intro">
        <div><p className="eyebrow">WORKSPACE PREFERENCES</p><h1>Settings</h1><p>Manage how you access Paste Vault and how your workspace looks.</p></div>
        <span className="settings-account-badge"><ShieldCheck size={15} /> Account protected</span>
      </section>

      <div className="settings-layout">
        <section className="settings-card">
          <div className="settings-card-heading"><span className="settings-card-icon"><UserRound size={18} /></span><div><h2>Account overview</h2><p>Your identity and connected sign-in methods.</p></div></div>
          <div className="settings-account-row"><span>Display name</span><strong>{user?.name || "Developer"}</strong></div>
          <div className="settings-account-row"><span>Email address</span><strong>{user?.email || "Not available"}</strong></div>
          <div className="settings-account-row"><span>Email verification</span><strong className={user?.emailVerified ? "settings-status-good" : "settings-status-muted"}>{user?.emailVerified ? "Verified" : "Not verified / managed by provider"}</strong></div>
          <div className="settings-provider-list">
            <div><span className="settings-provider-mark">PV</span><span><strong>Paste Vault email sign-in</strong><small>{hasEmailSignIn ? "Standalone authentication is enabled." : "Not linked to this account."}</small></span><b className={hasEmailSignIn ? "settings-status-good" : "settings-status-muted"}>{hasEmailSignIn ? "Enabled" : "Not linked"}</b></div>
            <div><span className="settings-provider-mark leetmetric-mark">LM</span><span><strong>LeetMetric single sign-on</strong><small>{hasLeetMetric ? "Your LeetMetric identity is connected." : "Connect by signing in to LeetMetric with the same account email."}</small></span><b className={hasLeetMetric ? "settings-status-good" : "settings-status-muted"}>{hasLeetMetric ? "Connected" : "Available"}</b></div>
          </div>
          <div className="settings-card-footer"><Link to="/profile">Edit profile details <ArrowUpRight size={14} /></Link></div>
        </section>

        <section className="settings-card">
          <div className="settings-card-heading"><span className="settings-card-icon"><Moon size={18} /></span><div><h2>Appearance</h2><p>Choose the theme for your workspace.</p></div></div>
          <div className="theme-choice-row">
            <button type="button" className={"theme-choice" + (theme === "light" ? " active" : "")} onClick={() => changeTheme("light")} aria-pressed={theme === "light"}><span className="theme-preview light-preview"><Sun size={20} /></span><strong>Light</strong><small>Clean and bright</small></button>
            <button type="button" className={"theme-choice" + (theme === "dark" ? " active" : "")} onClick={() => changeTheme("dark")} aria-pressed={theme === "dark"}><span className="theme-preview dark-preview"><Moon size={20} /></span><strong>Dark</strong><small>Easy on the eyes</small></button>
          </div>
          <div className="settings-card-footer"><span>Your choice is saved on this device.</span></div>
        </section>

        <section className="settings-card settings-security-card">
          <div className="settings-card-heading"><span className="settings-card-icon"><KeyRound size={18} /></span><div><h2>Password & security</h2><p>Keep your account protected with a strong password.</p></div></div>
          {hasEmailSignIn ? (
            <form className="settings-password-form" onSubmit={updatePassword}>
              <label><span>Current password</span><input type="password" autoComplete="current-password" value={passwordForm.currentPassword} onChange={(event) => updatePasswordField("currentPassword", event.target.value)} required /></label>
              <label><span>New password</span><input type="password" autoComplete="new-password" minLength={12} maxLength={128} value={passwordForm.newPassword} onChange={(event) => updatePasswordField("newPassword", event.target.value)} required /></label>
              <label><span>Confirm new password</span><input type="password" autoComplete="new-password" minLength={12} maxLength={128} value={passwordForm.confirmPassword} onChange={(event) => updatePasswordField("confirmPassword", event.target.value)} required /></label>
              <p className="settings-field-hint">Passwords must be 12–128 characters. Changing your password signs out active sessions.</p>
              <button className="primary-button" type="submit" disabled={savingPassword}>{savingPassword ? "Updating…" : "Update password"} <ArrowUpRight size={14} /></button>
            </form>
          ) : (
            <>
              <div className="settings-provider-help"><LockKeyhole size={19} /><div><strong>Add a standalone sign-in method</strong><p>We'll use your current LeetMetric account email ({user?.email || "no email available"}). Set a password and verify that email address. This adds another sign-in method to this same account; it does not create a second workspace.</p></div></div>
              <form className="settings-password-form settings-link-form" onSubmit={linkStandaloneSignIn}>
                <label><span>New standalone password</span><input type="password" autoComplete="new-password" minLength={12} maxLength={128} value={linkForm.password} onChange={(event) => setLinkForm((current) => ({ ...current, password: event.target.value }))} required /></label>
                <label><span>Confirm password</span><input type="password" autoComplete="new-password" minLength={12} maxLength={128} value={linkForm.confirmPassword} onChange={(event) => setLinkForm((current) => ({ ...current, confirmPassword: event.target.value }))} required /></label>
                <p className="settings-field-hint">After setup, a verification email is sent to your current account email. Passwords must be 12–128 characters.</p>
                <button className="primary-button" type="submit" disabled={linking}>{linking ? "Sending verification…" : "Link standalone sign-in"} <ArrowUpRight size={14} /></button>
                {linkResult && <div className="auth-message settings-link-result" role="status">{linkResult.message}{linkResult.verificationUrl && <a className="auth-dev-link" href={linkResult.verificationUrl}>Open development verification link <ArrowUpRight size={13} /></a>}</div>}
                <button className="auth-text-button" type="button" onClick={resendLinkVerification}>Resend verification email</button>
              </form>
              {!hasLeetMetric && <a className="settings-connect-link" href={LEETMETRIC_URL + "/dashboard.html"} target="_blank" rel="noreferrer">Open LeetMetric <ArrowUpRight size={14} /></a>}
            </>
          )}
        </section>

        <section className="settings-card">
          <div className="settings-card-heading"><span className="settings-card-icon"><ShieldCheck size={18} /></span><div><h2>Privacy & data</h2><p>Understand how your snippets and account data are handled.</p></div></div>
          <div className="settings-info-line"><CheckCircle2 size={16} /><span><strong>Private by default</strong><small>Saved snippets are visible only to your account unless you explicitly share them.</small></span></div>
          <div className="settings-info-line"><CheckCircle2 size={16} /><span><strong>Portable workspace</strong><small>Export your snippets and collections from the Snippets page.</small></span></div>
          <div className="settings-info-line"><CheckCircle2 size={16} /><span><strong>Session protection</strong><small>Sign-out and password changes invalidate your active session.</small></span></div>
          <div className="settings-card-footer"><Link to="/privacy">Privacy overview <ArrowUpRight size={14} /></Link><Link to="/terms">Terms of use <ArrowUpRight size={14} /></Link></div>
        </section>

        <section className="settings-card settings-signout-card">
          <div className="settings-card-heading"><span className="settings-card-icon"><LogOut size={18} /></span><div><h2>Sign out</h2><p>End your current Paste Vault session on this device.</p></div></div>
          <button type="button" className="settings-signout-button" onClick={signOut}><LogOut size={15} /> Sign out of Paste Vault</button>
        </section>
      </div>
    </>
  );
}
