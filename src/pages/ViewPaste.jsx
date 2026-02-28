import { Copy, Calendar, Eye, Pin, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import { useSelector, useDispatch } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";

import { FormatDate } from "../utils/formatDate";
import { incrementViewCount, togglePin } from "../redux/pasteSlice";
import PageTitle from "../components/PageTitle";

const ViewPaste = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [copied, setCopied] = useState(false);
  const hasIncremented = useRef(false);
  const copyTimer = useRef(null);

  const pastes = useSelector((state) => state.paste.pastes);
  const paste = pastes.find((p) => p._id === id);

  // 👁 increment view only once
  useEffect(() => {
    if (id && paste && !hasIncremented.current) {
      dispatch(incrementViewCount(id));
      hasIncremented.current = true;
    }
  }, [id, paste, dispatch]);

  // ⌨️ CTRL/CMD + C shortcut
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "c") {
        e.preventDefault();
        handleCopy();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(paste.content);
      toast.success("Copied ✨");
      setCopied(true);

      clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Copy failed ❌");
    }
  };

  if (!paste) {
    return (
      <div className="w-full py-16 max-w-[1200px] mx-auto px-5 text-center text-2xl text-gray-500">
        Paste not found 🚫
      </div>
    );
  }

  return (
    <div className="w-full py-10 max-w-[1200px] mx-auto px-5 text-black dark:text-white">
      <PageTitle title={paste.title} />

      {/* 🔙 BACK */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 mb-6 text-sm text-blue-600 hover:underline"
      >
        <ArrowLeft size={16} />
        Back
      </button>

      <div className="bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-md p-5 shadow-sm">
        <div className="flex flex-col gap-y-6">
          {/* 📝 TITLE + PIN */}
          <div className="flex justify-between items-center gap-4">
            <input
              type="text"
              value={paste.title}
              disabled
              className="w-full border dark:border-gray-700 rounded-md p-2 bg-transparent"
            />

            <button
              onClick={() => dispatch(togglePin(paste._id))}
              className="p-2 border rounded-md hover:border-blue-500 transition"
              title="Toggle Pin"
              aria-label="Toggle Pin"
            >
              <Pin
                size={18}
                className={paste.isPinned ? "text-blue-500" : ""}
              />
            </button>
          </div>

          {paste.isPinned && (
            <span className="text-xs bg-blue-600 text-white px-2 py-1 w-fit rounded">
              Pinned
            </span>
          )}

          {/* 📊 META */}
          <div className="flex flex-col sm:flex-row sm:justify-between gap-3 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <Calendar size={16} />
              {FormatDate(paste.createdAt)}
            </div>

            <div className="flex items-center gap-2">
              <Eye size={16} />
              {paste.viewCount || 0} views
            </div>
          </div>

          {/* 📦 EDITOR */}
          <div className="w-full border dark:border-gray-700 rounded-md overflow-hidden">
            <div className="flex justify-between items-center px-4 py-2 border-b dark:border-gray-700">
              <div className="flex gap-2">
                <span className="w-3 h-3 bg-red-500 rounded-full" />
                <span className="w-3 h-3 bg-yellow-500 rounded-full" />
                <span className="w-3 h-3 bg-green-500 rounded-full" />
              </div>

              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-sm"
              >
                <Copy size={18} />
                {copied && <span className="text-green-500">Copied</span>}
              </button>
            </div>

            <textarea
              value={paste.content}
              disabled
              rows={20}
              className="w-full p-4 bg-transparent focus:outline-none resize-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewPaste;
