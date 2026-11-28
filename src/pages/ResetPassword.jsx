import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, CheckCircle2, Eye, EyeOff, KeyRound } from "lucide-react";
import AuthLayout from "../components/AuthLayout";
import PageTitle from "../components/PageTitle";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const navigate = useNavigate();
  const tokenStarted = useRef(false);
  const [tokenReady, setTokenReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (tokenStarted.current) return;
    tokenStarted.current = true;
    window.history.replaceState(null, "", window.location.pathname);
    setTokenReady(/^[A-Za-z0-9_-]{43}$/.test(token));
    if (!/^[A-Za-z0-9_-]{43}$/.test(token)) setError("This password reset link is invalid or has expired.");
  }, [token]);

  async function submit(event) {
    event.preventDefault();
    if (!tokenReady) return setError("This password reset link is invalid or has expired.");
    if (password.length < 12) return setError("Use a password with at least 12 characters.");
    if (password.length > 128) return setError("Your password must be 128 characters or fewer.");
    if (password !== confirmPassword) return setError("The passwords do not match.");

    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ token, password })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Unable to reset your password.");
      setSuccess(true);
      window.setTimeout(() => navigate("/login", { replace: true }), 1200);
    } catch (requestError) {
      setError(requestError.message || "Unable to reset your password.");
    } finally {
      setBusy(false);
    }
  }

  return (
      <AuthLayout eyebrow="SET A NEW PASSWORD">
      <PageTitle title="Reset password" />
      {success ? (
        <>
          <div className="auth-success-icon"><CheckCircle2 size={25} /></div>
          <h1 className="auth-title">Password updated.</h1>
          <p className="auth-description">Your password has been changed. Sign in again with your new password.</p>
          <Link className="public-cta auth-submit" to="/login">Continue to sign in <ArrowRight size={16} /></Link>
        </>
      ) : (
        <>
          <h1 className="auth-title">Choose a new password.</h1>
          <p className="auth-description">Use a strong password you don&apos;t use on another service.</p>
          <form className="auth-form" onSubmit={submit}>
            <label className="auth-field"><span>New password</span><span className="auth-input-wrap"><KeyRound size={17} /><input type={showPassword ? "text" : "password"} name="new-password" autoComplete="new-password" placeholder="At least 12 characters" value={password} onChange={(event) => setPassword(event.target.value)} minLength={12} maxLength={128} required /><button className="auth-input-action" type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></span></label>
            <label className="auth-field"><span>Confirm new password</span><span className="auth-input-wrap"><KeyRound size={17} /><input type="password" name="confirm-password" autoComplete="new-password" placeholder="Enter it again" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength={12} maxLength={128} required /></span></label>
            {error && <div className="auth-message error" role="alert">{error}</div>}
            <button className="public-cta auth-submit" type="submit" disabled={busy || !tokenReady}>{busy ? "Updating…" : "Update password"} <ArrowRight size={16} /></button>
          </form>
          <p className="auth-switch"><Link to="/login">Back to sign in</Link></p>
        </>
      )}
    </AuthLayout>
  );
}
