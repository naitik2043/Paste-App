import { Link } from "react-router-dom";
import { CalendarDays, Code2, Eye, Pin, Tags } from "lucide-react";

export default function PasteCard({ paste }) {
  return (
    <article className="paste-card">
      <div className="paste-card-top">
        <span className="language-pill"><Code2 size={13} /> {paste.language}</span>
        {paste.isPinned && <span className="pin-pill"><Pin size={12} /> Pinned</span>}
      </div>
      <Link to={"/pastes/" + paste.id} className="paste-card-title">{paste.title}</Link>
      <p className="paste-preview">{paste.preview || "No preview available."}</p>
      <div className="tag-row">
        {(paste.tags || []).slice(0, 3).map((tag) => <span key={tag}><Tags size={11} /> {tag}</span>)}
        {paste.problemTitle && <span className="problem-tag">LeetCode · {paste.problemTitle}</span>}
      </div>
      <div className="paste-card-meta">
        <span><CalendarDays size={13} /> {new Date(paste.updatedAt || paste.createdAt).toLocaleDateString()}</span>
        <span><Eye size={13} /> {paste.viewCount || 0}</span>
        <span>{paste.historyCount || 0} versions</span>
      </div>
    </article>
  );
}
