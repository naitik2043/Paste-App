import { ArrowUpRight, Code2, LockKeyhole, ShieldCheck } from "lucide-react";
import { LEETMETRIC_URL } from "../constants";

export default function LaunchGate() {
  return (
    <main className="launch-screen">
      <div className="launch-card">
        <div className="launch-logo"><Code2 size={24} /></div>
        <p className="eyebrow">YOUR DEVELOPER WORKSPACE</p>
        <h1>Keep every useful solution<br /><span>within reach.</span></h1>
        <p className="launch-copy">Paste Vault is connected to your LeetMetric account. Sign in to LeetMetric first, then open Code Vault from your dashboard to securely continue with single sign-on.</p>
        <a className="primary-button launch-button" href={LEETMETRIC_URL + "/login.html"}>Sign in to LeetMetric <ArrowUpRight size={17} /></a>
        <div className="trust-row"><span><LockKeyhole size={15} /> Private by default</span><span><ShieldCheck size={15} /> One-time sign-in ticket</span></div>
      </div>
    </main>
  );
}
