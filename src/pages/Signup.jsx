import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, Eye, EyeOff, KeyRound, Mail, UserRound } from "lucide-react";
import AuthLayout from "../components/AuthLayout";
import PageTitle from "../components/PageTitle";

export default function Signup() {
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
    setError("");
  }

  async function submit(event) {
    event.preventDefault();
    if (form.password.length < 12) return setError("Use a password with at least 12 characters.");
    if (form.password.length > 128) return setError("Your password must be 128 characters or fewer.");
    if (form.password !== form.confirmPassword) return setError("The passwords do not match.");

    setBusy(true);
    setError("");
    setResult(null);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (payload.pendingVerification) {
          setResult({ message: "Your account has been created, but email delivery is not configured yet. Your account is pending verification. Please contact the site owner before trying again.", verificationUrl: "" });
          return;
        }
        throw new Error(payload.error || "Unable to create your account.");
      }
      setResult({
        message: payload.message || "Your account is ready. Check your inbox to verify your email.",
        verificationUrl: payload.verificationUrl || ""
      });
      setForm((current) => ({ ...current, password: "", confirmPassword: "" }));
    } catch (requestError) {
      setError(requestError.message || "Unable to create your account. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (result) {
    return (
      <PageTitle title="Create your account" />
      <AuthLayout eyebrow="ONE MORE STEP">
        <div className="auth-success-icon"><CheckCircle2 size={25} /></div>
        <h1 className="auth-title">Check your inbox.</h1>
        <p className="auth-description">{result.message}</p>
        {result.verificationUrl && <a className="auth-dev-link" href={result.verificationUrl}>Open development verification link <ArrowRight size={15} /></a>}
        <div className="auth-message" role="status">Your account will be ready to use once your email address has been verified.</div>
        <p className="auth-switch"><Link to="/login">Return to sign in</Link></p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout eyebrow="CREATE YOUR WORKSPACE">
      <h1 className="auth-title">Make space for better thinking.</h1>
      <p className="auth-description">Create your independent Paste Vault account. You can connect the same identity to LeetMetric later.</p>
      <form className="auth-form" onSubmit={submit}>
        <label className="auth-field"><span>Display name</span><span className="auth-input-wrap"><UserRound size={17} /><input type="text" name="name" autoComplete="name" placeholder="How should we call you?" value={form.name} onChange={(event) => update("name", event.target.value)} maxLength={60} required /></span></label>
        <label className="auth-field"><span>Email address</span><span className="auth-input-wrap"><Mail size={17} /><input type="email" name="email" autoComplete="email" placeholder="you@example.com" value={form.email} onChange={(event) => update("email", event.target.value)} maxLength={254} required /></span></label>
        <label className="auth-field"><span>Password</span><span className="auth-input-wrap"><KeyRound size={17} /><input type={showPassword ? "text" : "password"} name="new-password" autoComplete="new-password" placeholder="At least 12 characters" value={form.password} onChange={(event) => update("password", event.target.value)} minLength={12} maxLength={128} required /><button className="auth-input-action" type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></span></label>
        <label className="auth-field"><span>Confirm password</span><span className="auth-input-wrap"><KeyRound size={17} /><input type="password" name="confirm-password" autoComplete="new-password" placeholder="Enter the same password again" value={form.confirmPassword} onChange={(event) => update("confirmPassword", event.target.value)} minLength={12} maxLength={128} required /></span></label>
        <p className="auth-field-hint">Use at least 12 characters. Email verification is required before sign-in.</p>
        {error && <div className="auth-message error" role="alert">{error}</div>}
        <button className="public-cta auth-submit" type="submit" disabled={busy}>{busy ? "Creating account…" : "Create account"} <ArrowRight size={16} /></button>
      </form>
      <p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p>
    </AuthLayout>
  );
}
