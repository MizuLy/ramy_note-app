import { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthProvider";
import {
  getNotes,
  createNote,
  restoreNote,
  permanentDeleteNote,
} from "../../../api/axios";
import { IoSearch } from "react-icons/io5";
import {
  LuPin,
  LuChevronDown,
  LuFilter,
  LuRotateCcw,
  LuTrash2,
  LuPlus,
} from "react-icons/lu";
import toast from "react-hot-toast";
import ConfirmModal from "../../../components/modals/ConfirmModal";

// Helper function to convert raw HTML body into plain text preview
const stripHtml = (html) => {
  if (!html) return "";
  try {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const text = doc.body.textContent || doc.body.innerText || "";
    return text.trim();
  } catch {
    return "";
  }
};

// Counts words in plain text (whitespace-separated, ignoring empties)
const getWordCount = (text) => {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
};

// Formats a Date as a short relative string: "just now", "5m ago", etc.
const formatRelativeTime = (dateInput) => {
  if (!dateInput) return null;
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return null;

  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
};

// Time-range filter options
const TIME_FILTERS = {
  all: { label: "All time", matches: () => true },
  today: {
    label: "Today",
    matches: (date) => {
      const now = new Date();
      return (
        date.getFullYear() === now.getFullYear() &&
        date.getMonth() === now.getMonth() &&
        date.getDate() === now.getDate()
      );
    },
  },
  week: {
    label: "This week",
    matches: (date) => {
      const now = new Date();
      const weekAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 7);
      return date >= weekAgo && date <= now;
    },
  },
  month: {
    label: "This month",
    matches: (date) => {
      const now = new Date();
      return (
        date.getFullYear() === now.getFullYear() &&
        date.getMonth() === now.getMonth()
      );
    },
  },
  year: {
    label: "This year",
    matches: (date) => {
      const now = new Date();
      return date.getFullYear() === now.getFullYear();
    },
  },
};

function NoteSkeleton() {
  return (
    <div className="p-3.5 animate-pulse border-b border-zinc-800/50">
      <div className="flex items-center justify-between mb-2">
        <div className="h-3.5 bg-zinc-800 rounded w-1/2" />
      </div>
      <div className="h-3 bg-zinc-800 rounded w-full mb-1.5" />
      <div className="h-2.5 bg-zinc-800 rounded w-1/3" />
    </div>
  );
}

export default function NoteList({
  selectedNoteId,
  onSelectNote,
  refreshKey,
  folderId,
  folderName,
  tagId,
  tagLabel,
  isTrash = false,
  onRefresh,
}) {
  const { accessToken } = useAuth();
  const [notes, setNotes] = useState([]);
  const [search, setSearch] = useState("");
  const [timeFilter, setTimeFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(id);
  }, []);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const data = await getNotes(accessToken, { trash: isTrash });
      const list = data?.result || data?.data || data || [];
      setNotes(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Failed to fetch notes:", err);
      toast.error("Failed to load notes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) fetchNotes();
  }, [accessToken, refreshKey, isTrash]);

  // Create new note & AUTO-OPEN
  const handleCreateNote = async () => {
    setCreating(true);
    try {
      const payload = { title: "", body: "", tagNames: [] };
      if (folderId) payload.folderId = folderId;
      if (tagLabel) payload.tagNames = [tagLabel];
      const res = await createNote(payload, accessToken);
      const resData = res?.data || res;
      const newNote = resData?.data || resData?.result || resData;
      const newId = newNote?.id || newNote?._id;

      if (newId) {
        const noteWithFolder = {
          ...newNote,
          id: newId,
          folderId: newNote.folderId ?? (folderId || null),
        };
        setNotes((prev) => [noteWithFolder, ...prev]);
        onSelectNote(newId);
        toast.success("New note created!");
      }
    } catch (err) {
      console.error("Failed to create note:", err);
      toast.error("Failed to create note");
    } finally {
      setCreating(false);
    }
  };

  const listTitle = isTrash
    ? "Trash"
    : folderId
      ? folderName || "Folder"
      : tagId
        ? tagLabel || "Tag"
        : "My Notes";

  const displayedNotes = notes
    .filter((n) => {
      if (!folderId) return true;
      return (n.folderId || "") === folderId;
    })
    .filter((n) => {
      if (!tagId) return true;
      return (n.tags || []).some((t) => (t.id || t._id) === tagId);
    })
    .filter((n) =>
      (n.title || "Untitled Note").toLowerCase().includes(search.toLowerCase()),
    )
    .filter((n) => {
      if (timeFilter === "all") return true;
      const created = n.createdAt ? new Date(n.createdAt) : null;
      if (!created || isNaN(created.getTime())) return false;
      return TIME_FILTERS[timeFilter].matches(created);
    })
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;

      const dateA = new Date(a.updatedAt || a.createdAt || 0);
      const dateB = new Date(b.updatedAt || b.createdAt || 0);
      return dateB - dateA;
    });

  const isFilterActive = timeFilter !== "all";

  const handleRestore = async (e, noteId) => {
    e.stopPropagation();
    try {
      await restoreNote(noteId, accessToken);
      toast.success("Note restored successfully");
      onRefresh?.();
      fetchNotes();
    } catch (err) {
      console.error("Failed to restore note:", err);
      toast.error("Failed to restore note");
    }
  };

  const handleDeleteForeverRequest = (e, noteId) => {
    e.stopPropagation();
    setPendingDeleteId(noteId);
    setConfirmOpen(true);
  };

  const handleConfirmDeleteForever = async () => {
    const noteId = pendingDeleteId;
    if (!noteId) return;
    try {
      await permanentDeleteNote(noteId, accessToken);
      toast.success("Note permanently deleted");
      onRefresh?.();
      fetchNotes();
    } catch (err) {
      console.error("Failed to delete note:", err);
      toast.error("Failed to delete note");
    } finally {
      setConfirmOpen(false);
      setPendingDeleteId(null);
    }
  };

  return (
    <div className="w-80 h-screen border-r border-zinc-800 bg-zinc-950 flex flex-col select-none shrink-0">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800/80 space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-base font-bold text-white tracking-tight">
            {listTitle}
          </h1>
          {!isTrash && (
            <button
              onClick={handleCreateNote}
              disabled={creating}
              className="p-1.5 rounded-md bg-zinc-100 text-zinc-900 hover:bg-zinc-300 transition-colors disabled:opacity-50"
              title="Create note"
            >
              <LuPlus size={14} />
            </button>
          )}
        </div>

        {/* Search & Filter bar */}
        <div className="flex items-center gap-1.5">
          <div className="relative flex-1">
            <IoSearch
              size={14}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500"
            />
            <input
              type="text"
              placeholder="Search notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-zinc-900 border border-zinc-800 rounded-md text-zinc-200 placeholder-zinc-500 outline-none focus:border-zinc-700"
            />
          </div>

          <div className="relative">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-1.5 rounded-md border text-xs flex items-center gap-1 transition-colors ${
                isFilterActive
                  ? "bg-zinc-800 text-white border-zinc-700"
                  : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white"
              }`}
            >
              <LuFilter size={13} />
            </button>

            {showFilters && (
              <div className="absolute right-0 mt-2 w-36 bg-zinc-900 border border-zinc-800 rounded-md shadow-xl py-1 z-20">
                {Object.entries(TIME_FILTERS).map(([key, { label }]) => (
                  <button
                    key={key}
                    onClick={() => {
                      setTimeFilter(key);
                      setShowFilters(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                      timeFilter === key
                        ? "text-white bg-zinc-800 font-medium"
                        : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Note Items List */}
      <div className="flex-1 overflow-y-auto divide-y divide-zinc-800/40">
        {loading ? (
          <>
            <NoteSkeleton />
            <NoteSkeleton />
            <NoteSkeleton />
          </>
        ) : displayedNotes.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 text-xs">
            No notes found.
          </div>
        ) : (
          displayedNotes.map((note) => {
            const id = note.id || note._id;
            const isSelected = selectedNoteId === id;
            const plainText = stripHtml(note.body);
            const words = getWordCount(plainText);
            const formattedDate = formatRelativeTime(
              note.updatedAt || note.createdAt,
            );

            return (
              <div
                key={id}
                onClick={() => onSelectNote(id)}
                className={`p-3.5 cursor-pointer transition-colors relative group ${
                  isSelected
                    ? "bg-zinc-800/70 border-l-2 border-white"
                    : "hover:bg-zinc-900/60"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="text-xs font-semibold text-zinc-200 truncate flex-1">
                    {note.title || "Untitled Note"}
                  </h3>
                  {note.isPinned && (
                    <LuPin
                      size={12}
                      className="text-zinc-400 rotate-45 shrink-0"
                    />
                  )}
                </div>

                <p className="text-[11px] text-zinc-400 line-clamp-2 mb-2 leading-relaxed">
                  {plainText || "Empty note..."}
                </p>

                <div className="flex items-center justify-between text-[10px] text-zinc-500">
                  <span>
                    {formattedDate} · {words} {words === 1 ? "word" : "words"}
                  </span>

                  {isTrash && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => handleRestore(e, id)}
                        className="p-1 hover:text-green-400 transition-colors"
                        title="Restore"
                      >
                        <LuRotateCcw size={12} />
                      </button>
                      <button
                        onClick={(e) => handleDeleteForeverRequest(e, id)}
                        className="p-1 hover:text-red-400 transition-colors"
                        title="Delete permanently"
                      >
                        <LuTrash2 size={12} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <ConfirmModal
        isOpen={confirmOpen}
        title="Delete note permanently?"
        message="This will permanently delete the note. This action cannot be undone."
        onClose={() => {
          setConfirmOpen(false);
          setPendingDeleteId(null);
        }}
        onConfirm={handleConfirmDeleteForever}
      />
    </div>
  );
}
