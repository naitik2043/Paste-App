import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Eye, EyeOff, KeyRound, Mail } from "lucide-react";
import toast from "react-hot-toast";
import AuthLayout from "../components/AuthLayout";
import { useSession } from "../context/useSession";
import { LEETMETRIC_URL } from "../constants";
import PageTitle from "../components/PageTitle";

export default function Login() {
  const { refresh } = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [notice, setNotice] = useState("");

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setNotice("");
    setNeedsVerification(false);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(form)
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (result.code === "EMAIL_NOT_VERIFIED") {
          setNeedsVerification(true);
          setNotice(result.error || "Verify your email address before signing in.");
          return;
        }
        throw new Error(result.error || "Unable to sign in.");
      }
      await refresh();
      toast.success("Welcome back to your workspace.");
      navigate(location.state?.from || "/dashboard", { replace: true });
    } catch (error) {
      setNotice(error.message || "Unable to sign in. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function resendVerification() {
    setBusy(true);
    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ email: form.email })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Unable to resend the verification email.");
      setNotice(result.verificationUrl
        ? "Development verification link: " + result.verificationUrl
        : "If an unverified account exists, a new verification email has been sent.");
      toast.success("Verification request processed.");
    } catch (error) {
      setNotice(error.message || "Unable to resend the verification email.");
    } finally {
      setBusy(false);
    }
  }

  return (
      <AuthLayout eyebrow="WELCOME BACK">
      <PageTitle title="Sign in" />
      <h1 className="auth-title">Sign in to your vault.</h1>
      <p className="auth-description">Pick up where you left off. Your saved code and notes are right where you left them.</p>
      <form className="auth-form" onSubmit={submit}>
        <label className="auth-field"><span>Email address</span><span className="auth-input-wrap"><Mail size={17} /><input type="email" name="email" autoComplete="email" placeholder="you@example.com" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} maxLength={254} required /></span></label>
        <label className="auth-field"><span>Password</span><span className="auth-input-wrap"><KeyRound size={17} /><input type={showPassword ? "text" : "password"} name="password" autoComplete="current-password" placeholder="Your password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} maxLength={128} required /><button className="auth-input-action" type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></span></label>
        <div className="auth-form-meta"><Link to="/forgot-password">Forgot password?</Link></div>
        {notice && <div className={needsVerification ? "auth-message warning" : "auth-message"} role="status">{notice}</div>}
        {needsVerification && <button className="auth-text-button" type="button" onClick={resendVerification} disabled={busy}>Resend verification email</button>}
        <button className="public-cta auth-submit" type="submit" disabled={busy}>{busy ? "Signing in…" : "Sign in"} <ArrowRight size={16} /></button>
      </form>
      <p className="auth-switch">New to Paste Vault? <Link to="/signup">Create an account</Link></p>
      <div className="auth-divider"><span>OR CONTINUE WITH</span></div>
      <a className="auth-integration-link" href={LEETMETRIC_URL + "/dashboard.html"}><span><b>LM</b><span><strong>LeetMetric single sign-on</strong><small>Continue using your LeetMetric account</small></span></span><ArrowRight size={16} /></a>
      <p className="auth-footnote">Standalone email sign-in and LeetMetric SSO use the same Paste Vault workspace when linked to the same account.</p>
    </AuthLayout>
  );
}
