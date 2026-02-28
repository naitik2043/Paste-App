import { Copy, PlusCircle, Eye, Pin } from "lucide-react";
import { useEffect, useState, useRef, useMemo } from "react";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { addToPastes, updatePastes } from "../redux/pasteSlice";
import { useSearchParams, Link } from "react-router-dom";
import PageTitle from "../components/PageTitle";

const Home = () => {
  const [value, setValue] = useState("");
  const [title, setTitle] = useState("");
  const titleRef = useRef(null);

  const [searchParams, setSearchParams] = useSearchParams();
  const pasteId = searchParams.get("pasteId");

  const pastes = useSelector((state) => state.paste.pastes);
  const dispatch = useDispatch();

  // ✏️ LOAD PASTE FOR EDIT
  useEffect(() => {
    if (pasteId) {
      const paste = pastes.find((p) => p._id === pasteId);
      if (paste) {
        setTitle(paste.title);
        setValue(paste.content);
        titleRef.current?.focus();
      }
    }
  }, [pasteId, pastes]);

  // ➕ CREATE / UPDATE
  const createPaste = () => {
    if (!title.trim() || !value.trim()) {
      return toast.error("Title and content required");
    }

    const existingPaste = pastes.find((p) => p._id === pasteId);

    const paste = {
      title,
      content: value,
      _id:
        pasteId ||
        Date.now().toString(36) + Math.random().toString(36).substring(2),
      createdAt: existingPaste?.createdAt || new Date().toISOString(),
      viewCount: existingPaste?.viewCount || 0,
      isPinned: existingPaste?.isPinned || false,
    };

    pasteId ? dispatch(updatePastes(paste)) : dispatch(addToPastes(paste));

    toast.success(pasteId ? "Paste updated ✅" : "Paste created 🚀");
    resetPaste();
  };

  const resetPaste = () => {
    setTitle("");
    setValue("");
    setSearchParams({});
  };

  // 📊 MEMOIZED DASHBOARD DATA
  const { pinnedPastes, recentPastes, mostViewed } = useMemo(() => {
    const pinned = pastes.filter((p) => p.isPinned);

    const recent = [...pastes]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 3);

    const viewed = [...pastes]
      .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
      .slice(0, 3);

    return {
      pinnedPastes: pinned,
      recentPastes: recent,
      mostViewed: viewed,
    };
  }, [pastes]);

  return (
    <div className="w-full py-10 max-w-[1200px] mx-auto px-5 flex flex-col gap-8 text-black dark:text-white">
      <PageTitle title="Home" />

      {pastes.length === 0 && (
        <div className="text-center text-gray-500">
          <h2 className="text-2xl font-semibold">No pastes yet</h2>
          <p>Create your first paste 🚀</p>
        </div>
      )}

      {/* 📊 STATS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Stat title="Total Pastes" value={pastes.length} />
        <Stat title="Pinned" value={pinnedPastes.length} />
        <Stat title="Recently Created" value={recentPastes.length} />
        <Stat title="Most Viewed" value={mostViewed.length} />
      </div>

      {/* ✍️ EDITOR */}
      <Editor
        titleRef={titleRef}
        title={title}
        setTitle={setTitle}
        value={value}
        setValue={setValue}
        createPaste={createPaste}
        pasteId={pasteId}
        resetPaste={resetPaste}
      />

      {/* 📌 PINNED */}
      {pinnedPastes.length > 0 && (
        <Section title="📌 Pinned" data={pinnedPastes} />
      )}

      {/* 🕒 RECENT */}
      <Section title="🕒 Recently Created" data={recentPastes} />

      {/* 👁 MOST VIEWED */}
      <Section title="👁 Most Viewed" data={mostViewed} />
    </div>
  );
};

const Editor = ({
  titleRef,
  title,
  setTitle,
  value,
  setValue,
  createPaste,
  pasteId,
  resetPaste,
}) => (
  <div className="bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-md p-5 shadow-sm">
    <div className="flex flex-col gap-y-5">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <input
          ref={titleRef}
          type="text"
          placeholder="Enter title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border rounded-md p-2 bg-transparent dark:border-gray-700"
        />

        <button
          onClick={createPaste}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-md"
        >
          {pasteId ? "Update" : "Create"}
        </button>

        {pasteId && (
          <button
            onClick={resetPaste}
            className="bg-gray-600 hover:bg-gray-700 text-white p-2 rounded-md"
          >
            <PlusCircle size={20} />
          </button>
        )}
      </div>

      <div className="border rounded-md overflow-hidden dark:border-gray-700">
        <div className="flex justify-between items-center px-4 py-2 border-b dark:border-gray-700">
          <div className="flex gap-2">
            <span className="w-3 h-3 bg-red-500 rounded-full" />
            <span className="w-3 h-3 bg-yellow-500 rounded-full" />
            <span className="w-3 h-3 bg-green-500 rounded-full" />
          </div>

          <button
            onClick={() => {
              navigator.clipboard.writeText(value);
              toast.success("Copied ✨");
            }}
          >
            <Copy size={18} />
          </button>
        </div>

        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Write your paste here..."
          rows={18}
          className="w-full p-4 bg-transparent focus:outline-none resize-none"
        />
      </div>
    </div>
  </div>
);

const Stat = ({ title, value }) => (
  <div className="bg-white dark:bg-gray-900 p-4 rounded-md border dark:border-gray-700">
    <p className="text-sm text-gray-500">{title}</p>
    <h2 className="text-2xl font-bold">{value}</h2>
  </div>
);

const Section = ({ title, data }) => (
  <div>
    <div className="flex justify-between items-center mb-3">
      <h2 className="text-xl font-semibold">{title}</h2>

      <Link to="/pastes" className="text-sm text-blue-500 hover:underline">
        View all
      </Link>
    </div>

    {data.length === 0 ? (
      <p className="text-gray-500">No data</p>
    ) : (
      <div className="grid gap-3">
        {data.map((item) => (
          <Link
            to={`/pastes/${item._id}`}
            key={item._id}
            className="bg-white dark:bg-gray-900 p-3 rounded-md border dark:border-gray-700 hover:border-blue-500 transition flex justify-between items-center"
          >
            <span>{item.title}</span>

            <div className="flex items-center gap-3 text-sm text-gray-500">
              {item.isPinned && <Pin size={14} />}
              <div className="flex items-center gap-1">
                <Eye size={14} />
                {item.viewCount || 0}
              </div>
            </div>
          </Link>
        ))}
      </div>
    )}
  </div>
);

export default Home;
