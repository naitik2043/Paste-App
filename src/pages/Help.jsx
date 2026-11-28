import { Link } from "react-router-dom";
import { ArrowUpRight, CircleHelp, LockKeyhole, Mail, ShieldCheck } from "lucide-react";

const questions = [
  ["Do I need a LeetMetric account?", "No. You can create and use a Paste Vault account directly with your email address. LeetMetric single sign-on remains available for existing integrated users."],
  ["Are my snippets public?", "No. New snippets are private by default and are visible only to the signed-in account that owns them. A snippet becomes accessible to others only when you explicitly enable an unlisted share link."],
  ["What does an unlisted link mean?", "Anyone who has the link may be able to open it. You can add a password, an expiry time and a maximum successful-view count. Avoid sharing credentials or confidential information."],
  ["Can I move my snippets elsewhere?", "Yes. Use the JSON export and import controls in your snippet library. Imported snippets are private by default."],
  ["How do I reset my password?", "Choose Forgot password on the sign-in screen. A reset link is sent to the account email when a verified standalone account exists."],
  ["Can I use my LeetMetric and Paste Vault accounts together?", "Yes. When both services refer to the same existing LeetMetric user and verified email, the standalone email sign-in is linked to that user record. Do not create accounts with different email addresses expecting them to merge automatically."],
  ["Does Paste Vault execute my code?", "No. Paste Vault stores and displays text and code snippets. It does not run submitted code."]
];

export default function Help() {
  return (
    <div className="public-content-page">
      <section className="public-page-hero compact"><div className="landing-pill"><CircleHelp size={14} /> HELP CENTRE</div><h1>Questions, <span>answered.</span></h1><p>Quick guidance for setting up your account, protecting your snippets and getting the most from your workspace.</p></section>
      <div className="help-layout">
        <div className="help-faq-list">{questions.map(([question, answer], index) => <article className="help-faq" key={question}><span>0{index + 1}</span><div><h2>{question}</h2><p>{answer}</p></div></article>)}</div>
        <aside className="help-sidebar"><span className="help-side-icon"><ShieldCheck size={21} /></span><h2>Keep your workspace secure</h2><p>Use a strong unique password, keep your account email current and share snippets only with people you trust.</p><Link to="/privacy">Read the privacy overview <ArrowUpRight size={14} /></Link><Link to="/signup">Create an account <ArrowUpRight size={14} /></Link></aside>
      </div>
      <p className="help-feedback">Need more guidance? Review the <Link to="/terms">Terms</Link> and <Link to="/privacy">Privacy page</Link> before using the service.</p>
    </div>
  );
}
