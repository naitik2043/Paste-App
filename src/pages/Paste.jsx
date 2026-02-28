import { Calendar, Copy, Eye, PencilLine, Trash2, Pin } from "lucide-react";
import toast from "react-hot-toast";
import { useSelector, useDispatch } from "react-redux";
import { useState, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";

import { removeFromPastes, togglePin } from "../redux/pasteSlice";
import { FormatDate } from "../utils/formatDate";
import PageTitle from "../components/PageTitle";

const Paste = () => {
  const pastes = useSelector((state) => state.paste.pastes);
  const dispatch = useDispatch();

  const [searchParams] = useSearchParams();
  const globalQuery = searchParams.get("search") || "";

  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("new");

  const query = (searchTerm || globalQuery).toLowerCase();

  const handleDelete = (id) => {
    dispatch(removeFromPastes(id));
    toast.success("Paste deleted 🗑️");
  };

  // ✅ MEMOIZED FILTER + SORT (performance)
  const filteredPastes = useMemo(() => {
    return pastes
      .filter(
        (paste) =>
          paste.title?.toLowerCase().includes(query) ||
          paste.content?.toLowerCase().includes(query),
      )
      .sort((a, b) => {
        // 📌 pinned first
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;

        // 👁 sort by views
        if (sortBy === "views") {
          return (b.viewCount || 0) - (a.viewCount || 0);
        }

        // 🕒 newest
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
  }, [pastes, query, sortBy]);

  return (
    <div className="w-full py-10 max-w-[1200px] mx-auto px-5 text-black dark:text-white">
      <PageTitle title="All Pastes" />

      <div className="bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-md p-5 shadow-sm">
        {/* 🔍 Search + Sort */}
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="search"
            placeholder="Search paste..."
            className="w-full border rounded-md px-4 py-2 bg-transparent dark:border-gray-700"
            value={searchTerm || globalQuery}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <select
            className="border rounded-md px-3 py-2 bg-transparent dark:border-gray-700"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="new">Newest</option>
            <option value="views">Most Viewed</option>
          </select>
        </div>

        {/* 📋 List */}
        <div className="flex flex-col gap-y-5 mt-6">
          {filteredPastes.length > 0 ? (
            filteredPastes.map((paste) => (
              <div
                key={paste._id}
                className="relative border dark:border-gray-700 rounded-md p-4 hover:border-blue-500 transition group"
              >
                {/* 📌 PIN BADGE */}
                {paste.isPinned && (
                  <span className="absolute top-2 right-2 text-xs bg-blue-600 text-white px-2 py-1 rounded">
                    Pinned
                  </span>
                )}

                <Link to={`/pastes/${paste._id}`} className="block">
                  <p className="text-2xl font-semibold">{paste.title}</p>

                  <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-3 mt-2">
                    {paste.content}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-gray-500 mt-3">
                    <span className="flex items-center gap-1">
                      <Eye size={14} />
                      {paste.viewCount || 0}
                    </span>

                    <span className="flex items-center gap-1">
                      <Calendar size={14} />
                      {FormatDate(paste.createdAt)}
                    </span>
                  </div>
                </Link>

                {/* ⚙️ Actions */}
                <div className="flex gap-2 flex-wrap mt-4">
                  <button
                    onClick={() => dispatch(togglePin(paste._id))}
                    className="p-2 border rounded-md hover:border-blue-500"
                  >
                    <Pin
                      size={18}
                      className={paste.isPinned ? "text-blue-500" : ""}
                    />
                  </button>

                  <Link
                    to={`/?pasteId=${paste._id}`}
                    className="p-2 border rounded-md hover:border-blue-500"
                  >
                    <PencilLine size={18} />
                  </Link>

                  <button
                    onClick={() => handleDelete(paste._id)}
                    className="p-2 border rounded-md hover:border-pink-500"
                  >
                    <Trash2 size={18} />
                  </button>

                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(paste.content);
                      toast.success("Copied ✨");
                    }}
                    className="p-2 border rounded-md hover:border-green-500"
                  >
                    <Copy size={18} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-14 text-gray-500">
              <p className="text-2xl">No pastes found</p>
              <p className="text-sm">Try creating one 🚀</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Paste;
