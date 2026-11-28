import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, LoaderCircle, XCircle } from "lucide-react";
import AuthLayout from "../components/AuthLayout";
import { useSession } from "../context/useSession";
import PageTitle from "../components/PageTitle";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const { refresh } = useSession();
  const navigate = useNavigate();
  const started = useRef(false);
  const [status, setStatus] = useState("checking");
  const [message, setMessage] = useState("Verifying your email address…");

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    window.history.replaceState(null, "", window.location.pathname);

    async function verify() {
      if (!/^[A-Za-z0-9_-]{43}$/.test(token)) {
        setStatus("error");
        setMessage("This verification link is invalid or has expired.");
        return;
      }
      try {
        const response = await fetch("/api/auth/verify", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ token })
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.error || "Unable to verify this email address.");
        await refresh();
        setStatus("success");
        setMessage("Your email is verified. Your private workspace is ready.");
        window.setTimeout(() => navigate("/dashboard", { replace: true }), 900);
      } catch (error) {
        setStatus("error");
        setMessage(error.message || "Unable to verify this email address.");
      }
    }
    verify();
  }, [navigate, refresh, token]);

  return (
      <AuthLayout eyebrow="EMAIL VERIFICATION">
      <PageTitle title="Verify your email" />
      {status === "checking" && <div className="auth-status-icon"><LoaderCircle className="auth-spinner" size={26} /></div>}
      {status === "success" && <div className="auth-success-icon"><CheckCircle2 size={25} /></div>}
      {status === "error" && <div className="auth-error-icon"><XCircle size={25} /></div>}
      <h1 className="auth-title">{status === "checking" ? "Verifying your email." : status === "success" ? "You're verified." : "Verification failed."}</h1>
      <p className="auth-description" role="status">{message}</p>
      {status === "error" && <Link className="public-cta auth-submit" to="/login">Go to sign in</Link>}
      {status === "success" && <Link className="auth-text-button auth-centered-link" to="/dashboard">Open your workspace</Link>}
    </AuthLayout>
  );
}
