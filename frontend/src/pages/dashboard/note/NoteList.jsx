import { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthProvider";
import { getNotes, createNote, restoreNote, permanentDeleteNote } from "../../../api/axios";
import { IoSearch } from "react-icons/io5";
import { LuPin, LuChevronDown, LuFilter, LuRotateCcw, LuTrash2 } from "react-icons/lu";

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

// Time-range filter options, keyed by value, each returning whether a
// given createdAt date falls within range.
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
    <div className="p-3.5 animate-pulse">
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

  // Forces a re-render every 30s so relative "Xm ago" labels keep
  // advancing even without a fresh fetch.
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
      }
    } catch (err) {
      console.error("Failed to create note:", err);
    } finally {
      setCreating(false);
    }
  };

  // Filter notes by search term + created-at time range, AND sort
  // pinned notes to the top
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
      // 1. Sort by Pinned status first
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;

      // 2. Fallback to newest updated/created date
      const dateA = new Date(a.updatedAt || a.createdAt || 0);
      const dateB = new Date(b.updatedAt || b.createdAt || 0);
      return dateB - dateA;
    });

  const isFilterActive = timeFilter !== "all";

  const handleRestore = async (e, noteId) => {
    e.stopPropagation();
    try {
      await restoreNote(noteId, accessToken);
      onRefresh?.();
      fetchNotes();
    } catch (err) {
      console.error("Failed to restore note:", err);
    }
  };

  const handleDeleteForever = async (e, noteId) => {
    e.stopPropagation();
    if (!window.confirm("Delete this note permanently? This cannot be undone.")) {
      return;
    }
    try {
      await permanentDeleteNote(noteId, accessToken);
      onRefresh?.();
      fetchNotes();
    } catch (err) {
      console.error("Failed to delete note:", err);
    }
  };

  return (
    <div className="w-[300px] h-screen bg-zinc-900 border-r border-zinc-800 flex flex-col select-none">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800 space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white truncate">
            {listTitle}
          </h2>
          {!isTrash && (
            <button
              type="button"
              onClick={handleCreateNote}
              disabled={creating}
              className="px-3 py-1 bg-zinc-100 text-zinc-900 text-xs font-semibold rounded hover:bg-zinc-300 disabled:opacity-50 transition-colors"
            >
              {creating ? "Creating..." : "+ New"}
            </button>
          )}
        </div>

        {/* Search + filter toggle */}
        <div className="flex items-center gap-2">
          <div className="relative flex items-center flex-1">
            <IoSearch className="absolute left-3 text-zinc-400 text-sm pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notes..."
              className="w-full bg-zinc-800 border border-zinc-700 text-xs text-white pl-9 pr-3 py-1.5 rounded-md outline-none focus:border-zinc-500"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            title="Filter by date"
            className={`relative shrink-0 p-1.5 rounded-md border transition-colors ${
              showFilters || isFilterActive
                ? "bg-zinc-100 text-zinc-900 border-zinc-100"
                : "text-zinc-400 border-zinc-700 hover:text-white hover:bg-zinc-800"
            }`}
          >
            <LuFilter size={14} />
            {isFilterActive && !showFilters && (
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-zinc-100 ring-2 ring-zinc-900" />
            )}
          </button>
        </div>

        {/* Collapsible time filter */}
        <div
          className={`grid transition-all duration-200 ease-in-out ${
            showFilters
              ? "grid-rows-[1fr] opacity-100"
              : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="overflow-hidden">
            <div className="relative flex items-center pt-1">
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                className="w-full appearance-none bg-zinc-800 border border-zinc-700 text-xs text-zinc-300 pl-3 pr-8 py-1.5 rounded-md outline-none focus:border-zinc-500 cursor-pointer"
              >
                {Object.entries(TIME_FILTERS).map(([value, { label }]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <LuChevronDown
                size={13}
                className="absolute right-2.5 text-zinc-500 pointer-events-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Note Items List */}
      <div className="flex-1 overflow-y-auto divide-y divide-zinc-800/50">
        {loading ? (
          <>
            <NoteSkeleton />
            <NoteSkeleton />
            <NoteSkeleton />
            <NoteSkeleton />
          </>
        ) : displayedNotes.length === 0 ? (
          <p className="text-xs text-zinc-500 p-4 text-center">
            No notes found
          </p>
        ) : (
          displayedNotes.map((note) => {
            const id = note.id || note._id;
            const isSelected = selectedNoteId === id;
            const plainText = stripHtml(note.body);
            const wordCount = getWordCount(plainText);
            const relativeTime = formatRelativeTime(
              isTrash
                ? note.deletedAt || note.updatedAt || note.createdAt
                : note.updatedAt || note.createdAt,
            );

            return (
              <button
                key={id}
                type="button"
                onClick={() => onSelectNote(id)}
                className={`w-full text-left p-3.5 transition-colors relative group ${
                  isSelected ? "bg-zinc-800" : "hover:bg-zinc-800/40"
                }`}
              >
                <div className="flex items-center justify-between mb-1 gap-2">
                  <h3 className="text-sm font-medium text-zinc-100 truncate">
                    {note.title || "Untitled Note"}
                  </h3>

                  <div className="flex items-center gap-1 shrink-0">
                    {isTrash && (
                      <>
                        <button
                          type="button"
                          title="Restore"
                          onClick={(e) => handleRestore(e, id)}
                          className="p-1 rounded text-zinc-400 hover:text-emerald-400 hover:bg-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <LuRotateCcw size={13} />
                        </button>
                        <button
                          type="button"
                          title="Delete forever"
                          onClick={(e) => handleDeleteForever(e, id)}
                          className="p-1 rounded text-zinc-400 hover:text-red-400 hover:bg-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <LuTrash2 size={13} />
                        </button>
                      </>
                    )}
                    {note.isPinned && !isTrash && (
                      <LuPin
                        size={13}
                        className="text-zinc-400 rotate-45 shrink-0"
                      />
                    )}
                  </div>
                </div>

                <p className="text-xs text-zinc-500 truncate mb-1">
                  {plainText || "No content"}
                </p>

                <p className="text-[11px] text-zinc-600 truncate">
                  {wordCount} {wordCount === 1 ? "word" : "words"}
                  {relativeTime ? ` · ${relativeTime}` : ""}
                </p>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
