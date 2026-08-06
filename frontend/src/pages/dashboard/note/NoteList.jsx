import { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthProvider";
import { getNotes, createNote } from "../../../api/axios";
import { IoSearch } from "react-icons/io5";
import { LuPin } from "react-icons/lu";

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

export default function NoteList({ selectedNoteId, onSelectNote, refreshKey }) {
  const { accessToken } = useAuth();
  const [notes, setNotes] = useState([]);
  const [search, setSearch] = useState("");
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
      const data = await getNotes(accessToken);
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
  }, [accessToken, refreshKey]);

  // Create new note & AUTO-OPEN
  const handleCreateNote = async () => {
    setCreating(true);
    try {
      const res = await createNote(
        { title: "", body: "", tagNames: [] },
        accessToken,
      );
      const resData = res?.data || res;
      const newNote = resData?.data || resData?.result || resData;
      const newId = newNote?.id || newNote?._id;

      if (newId) {
        setNotes((prev) => [newNote, ...prev]);
        onSelectNote(newId); // Auto-opens immediately
      }
    } catch (err) {
      console.error("Failed to create note:", err);
    } finally {
      setCreating(false);
    }
  };

  // Filter notes by search term AND sort pinned notes to the top
  const displayedNotes = notes
    .filter((n) =>
      (n.title || "Untitled Note").toLowerCase().includes(search.toLowerCase()),
    )
    .sort((a, b) => {
      // 1. Sort by Pinned status first
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;

      // 2. Fallback to newest updated/created date
      const dateA = new Date(a.updatedAt || a.createdAt || 0);
      const dateB = new Date(b.updatedAt || b.createdAt || 0);
      return dateB - dateA;
    });

  return (
    <div className="w-[300px] h-screen bg-zinc-900 border-r border-zinc-800 flex flex-col select-none">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">My Notes</h2>
          <button
            type="button"
            onClick={handleCreateNote}
            disabled={creating}
            className="px-3 py-1 bg-zinc-100 text-zinc-900 text-xs font-semibold rounded hover:bg-zinc-300 disabled:opacity-50 transition-colors"
          >
            {creating ? "Creating..." : "+ New"}
          </button>
        </div>

        {/* Search */}
        <div className="relative flex items-center">
          <IoSearch className="absolute left-3 text-zinc-400 text-sm pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notes..."
            className="w-full bg-zinc-800 border border-zinc-700 text-xs text-white pl-9 pr-3 py-1.5 rounded-md outline-none focus:border-zinc-500"
          />
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
              note.updatedAt || note.createdAt,
            );

            return (
              <button
                key={id}
                type="button"
                onClick={() => onSelectNote(id)}
                className={`w-full text-left p-3.5 transition-colors relative ${
                  isSelected ? "bg-zinc-800" : "hover:bg-zinc-800/40"
                }`}
              >
                <div className="flex items-center justify-between mb-1 gap-2">
                  <h3 className="text-sm font-medium text-zinc-100 truncate">
                    {note.title || "Untitled Note"}
                  </h3>

                  {/* Pin Indicator Icon */}
                  {note.isPinned && (
                    <LuPin
                      size={13}
                      className="text-zinc-400 rotate-45 shrink-0"
                    />
                  )}
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
