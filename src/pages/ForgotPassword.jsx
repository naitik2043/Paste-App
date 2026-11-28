import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, Mail } from "lucide-react";
import AuthLayout from "../components/AuthLayout";
import PageTitle from "../components/PageTitle";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ email })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Unable to request a password reset.");
      setResult({
        message: payload.message || "If an account exists for that address, a reset link will be sent.",
        resetUrl: payload.resetUrl || ""
      });
    } catch (requestError) {
      setError(requestError.message || "Unable to request a password reset.");
    } finally {
      setBusy(false);
    }
  }

  return (
      <PageTitle title="Forgot password" />
    <AuthLayout eyebrow="ACCOUNT RECOVERY">
      {result ? (
        <>
          <div className="auth-success-icon"><CheckCircle2 size={25} /></div>
          <h1 className="auth-title">Check your inbox.</h1>
          <p className="auth-description">{result.message}</p>
          {result.resetUrl && <a className="auth-dev-link" href={result.resetUrl}>Open development reset link <ArrowRight size={15} /></a>}
          <p className="auth-switch"><Link to="/login">Return to sign in</Link></p>
        </>
      ) : (
        <>
          <h1 className="auth-title">Reset your password.</h1>
          <p className="auth-description">Enter the email address associated with your Paste Vault account. We'll send a reset link when an eligible account exists.</p>
          <form className="auth-form" onSubmit={submit}>
            <label className="auth-field"><span>Email address</span><span className="auth-input-wrap"><Mail size={17} /><input type="email" name="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} maxLength={254} required /></span></label>
            {error && <div className="auth-message error" role="alert">{error}</div>}
            <button className="public-cta auth-submit" type="submit" disabled={busy}>{busy ? "Sending…" : "Send reset link"} <ArrowRight size={16} /></button>
          </form>
          <p className="auth-switch"><Link to="/login">Back to sign in</Link></p>
        </>
      )}
    </AuthLayout>
  );
}
