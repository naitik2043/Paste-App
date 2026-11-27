import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Clipboard, ExternalLink } from "lucide-react";
import toast from "react-hot-toast";
import CodeBlock from "../components/CodeBlock";
import PageTitle from "../components/PageTitle";

export default function SharedPaste() {
  const { shareId } = useParams();
  const [paste, setPaste] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    fetch("/api/share/" + encodeURIComponent(shareId))
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || "This shared snippet is unavailable.");
        setPaste(data.paste);
      })
      .catch((reason) => setError(reason.message));
  }, [shareId]);
  if (error) return <div className="empty-panel">{error}<p><Link to="/">Open Paste Vault</Link></p></div>;
  if (!paste) return <div className="empty-panel">Loading shared snippet…</div>;
  return (
    <>
      <PageTitle title={paste.title} />
      <div className="detail-back"><Link to="/"><ArrowLeft size={15} /> Open Paste Vault</Link></div>
      <section className="detail-header"><div><p className="eyebrow">SHARED SNIPPET · {paste.language.toUpperCase()}</p><h1>{paste.title}</h1><div className="detail-meta"><span>Shared by a LeetMetric user</span><span>{paste.viewCount} views</span></div></div><button type="button" onClick={() => navigator.clipboard.writeText(paste.content).then(() => toast.success("Copied."))}><Clipboard size={15} /> Copy code</button></section>
      <section className="detail-main"><div className="code-toolbar"><span><i></i><i></i><i></i> <b>{paste.language}</b></span></div><CodeBlock code={paste.content} language={paste.language} />{paste.problemTitle && <div className="problem-context"><strong>{paste.problemTitle}</strong>{paste.problemUrl && <a href={paste.problemUrl} target="_blank" rel="noreferrer">Open problem <ExternalLink size={13} /></a>}</div>}</section>
    </>
  );
}
