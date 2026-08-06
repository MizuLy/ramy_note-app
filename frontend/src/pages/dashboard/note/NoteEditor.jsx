import { useEffect, useState, useRef } from "react";
import { useAuth } from "../../../context/AuthProvider";
import {
  getNoteId,
  updateNote,
  createNote,
  togglePin,
} from "../../../api/axios";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";

import {
  LuPin,
  LuBold,
  LuItalic,
  LuUnderline,
  LuStrikethrough,
  LuList,
  LuListOrdered,
  LuCode,
  LuQuote,
  LuPlus,
  LuUndo,
  LuRedo,
  LuSave,
} from "react-icons/lu";

// Counts words in plain text (whitespace-separated, ignoring empties)
const getWordCount = (text) => {
  if (!text) return 0;
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).filter(Boolean).length;
};

// Formats a Date as a short relative string: "just now", "5m ago", etc.
const formatRelativeTime = (date) => {
  if (!date) return null;
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

// ~200 wpm average reading speed, minimum of 1 minute
const getReadTime = (words) => Math.max(1, Math.round(words / 200));

export default function NoteEditor({ noteId, onNoteUpdated, onSelectNote }) {
  const { accessToken } = useAuth();
  const [title, setTitle] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [lastSavedAt, setLastSavedAt] = useState(null);

  const activeNoteIdRef = useRef(noteId);
  const titleRef = useRef(title);
  const isPinnedRef = useRef(isPinned);
  const saveTimeoutRef = useRef(null);
  // Guards onUpdate from firing debounced saves while we're
  // programmatically loading a note's content into the editor.
  const isLoadingRef = useRef(false);

  // Forces a re-render every 30s so the relative "Saved Xm ago" label
  // keeps advancing even without new saves happening.
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(id);
  }, []);

  // Keep activeNoteIdRef in sync + cancel any save still pending for the
  // previously active note so it can never land on the newly active one.
  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    activeNoteIdRef.current = noteId;
  }, [noteId]);

  useEffect(() => {
    titleRef.current = title;
  }, [title]);

  useEffect(() => {
    isPinnedRef.current = isPinned;
  }, [isPinned]);

  // targetId is bound at schedule time (in debouncedSave), not resolved
  // again when the timeout fires — this is what prevents a stale save
  // from a previous note landing on whatever note is active later.
  const performSave = async (targetId, newTitle, newBody, newPinned) => {
    if (!targetId) return;

    setSaving(true);
    try {
      await updateNote(
        targetId,
        { title: newTitle, body: newBody, isPinned: newPinned },
        accessToken,
      );
      setLastSavedAt(new Date());
      onNoteUpdated?.();
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setSaving(false);
    }
  };

  const debouncedSave = (newTitle, newBody, newPinned) => {
    const targetId = activeNoteIdRef.current; // capture now, while correct
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(() => {
      performSave(targetId, newTitle, newBody, newPinned);
    }, 800);
  };

  const handleManualSave = () => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    performSave(
      activeNoteIdRef.current,
      title,
      editor?.getHTML() || "",
      isPinned,
    );
  };

  // Tiptap Setup
  const editor = useEditor({
    extensions: [StarterKit, Underline],
    content: "",
    editorProps: {
      attributes: {
        class:
          "focus:outline-none min-h-[300px] text-sm text-zinc-200 leading-relaxed",
      },
    },
    onUpdate: ({ editor }) => {
      setWordCount(getWordCount(editor.getText()));
      if (isLoadingRef.current) return; // ignore programmatic updates
      if (activeNoteIdRef.current) {
        debouncedSave(titleRef.current, editor.getHTML(), isPinnedRef.current);
      }
    },
    onSelectionUpdate: () => {},
  });

  // Fetch note with SAFE editor + destroyed checks
  useEffect(() => {
    if (!noteId) {
      setTitle("");
      setIsPinned(false);
      setWordCount(0);
      setLastSavedAt(null);
      if (editor && !editor.isDestroyed) {
        isLoadingRef.current = true;
        editor.commands.setContent("", { emitUpdate: false });
        queueMicrotask(() => {
          isLoadingRef.current = false;
        });
      }
      return;
    }

    let cancelled = false;

    const fetchNote = async () => {
      try {
        const data = await getNoteId(noteId, accessToken);
        const found = data?.data || data?.result || data;

        if (found && !cancelled && editor && !editor.isDestroyed) {
          isLoadingRef.current = true; // block onUpdate before touching state

          setTitle(found.title || "");

          const pinnedValue =
            found.isPinned ?? found.pinned ?? found.is_pinned ?? false;
          setIsPinned(pinnedValue);

          editor.commands.setContent(found.body || "", { emitUpdate: false });
          setWordCount(getWordCount(editor.getText()));

          const savedTimestamp = found.updatedAt || found.createdAt;
          setLastSavedAt(savedTimestamp ? new Date(savedTimestamp) : null);

          // Also sync the refs immediately — don't wait for the sync
          // effects to run on next render, in case anything reads them
          // before then (e.g. a save scheduled in the same tick).
          titleRef.current = found.title || "";
          isPinnedRef.current = pinnedValue;

          queueMicrotask(() => {
            isLoadingRef.current = false;
          });
        }
      } catch (err) {
        console.error("Failed to load note:", err);
      }
    };

    fetchNote();

    return () => {
      cancelled = true;
    };
  }, [noteId, accessToken, editor]);

  const handleCreateNew = async () => {
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
        setTitle(newNote.title || "");
        setWordCount(0);
        setLastSavedAt(new Date());
        if (editor && !editor.isDestroyed) {
          isLoadingRef.current = true;
          editor.commands.setContent("", { emitUpdate: false });
          queueMicrotask(() => {
            isLoadingRef.current = false;
          });
        }
        await onNoteUpdated?.();
        onSelectNote?.(newId);
      }
    } catch (err) {
      console.error("Failed to create note:", err);
    } finally {
      setCreating(false);
    }
  };

  const handleTogglePin = async () => {
    if (!noteId) return;

    const nextPinnedState = !isPinned;
    setIsPinned(nextPinnedState);

    try {
      await togglePin(noteId, nextPinnedState, accessToken);
      onNoteUpdated?.();
    } catch (err) {
      console.error("Failed to toggle pin state:", err);
      setIsPinned(!nextPinnedState);
    }
  };

  if (!noteId) {
    return (
      <div className="flex-1 h-screen flex flex-col items-center justify-center bg-zinc-950 text-zinc-500 select-none">
        <p className="text-sm font-medium mb-3 text-zinc-400">
          No note selected
        </p>
        <button
          type="button"
          onClick={handleCreateNew}
          disabled={creating}
          className="px-4 py-2 bg-zinc-100 text-zinc-900 text-xs font-medium rounded-md hover:bg-zinc-300 transition-colors"
        >
          {creating ? "Creating..." : "+ Create a new note"}
        </button>
      </div>
    );
  }

  const savedLabel = saving
    ? "Saving..."
    : lastSavedAt
      ? `Saved ${formatRelativeTime(lastSavedAt)}`
      : "Draft";
  const readTime = getReadTime(wordCount);

  return (
    <div className="flex-1 h-screen flex flex-col bg-zinc-950  text-zinc-200 overflow-hidden">
      {/* Top action bar */}
      <div className="px-8 pt-5 flex items-center justify-between">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${
            saving
              ? "text-zinc-300 border-zinc-700 bg-zinc-900"
              : "text-zinc-500 border-zinc-800 bg-zinc-900/60"
          }`}
        >
          {saving && (
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-pulse" />
          )}
          {savedLabel}
        </span>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleTogglePin}
            title={isPinned ? "Unpin note" : "Pin note"}
            className={`p-2 rounded-md border transition-colors ${
              isPinned
                ? "bg-zinc-100 text-zinc-900 border-zinc-100"
                : "text-zinc-400 border-zinc-800 hover:text-white hover:bg-zinc-800"
            }`}
          >
            <LuPin
              size={14}
              className={isPinned ? "rotate-45 transition-transform" : ""}
            />
          </button>

          <button
            type="button"
            onClick={handleManualSave}
            disabled={saving}
            title="Save note"
            className="flex items-center gap-1.5 px-3 py-1.5 border border-zinc-800 hover:bg-zinc-800 text-zinc-200 text-xs font-medium rounded-md transition-colors disabled:opacity-50"
          >
            <LuSave size={13} className={saving ? "animate-pulse" : ""} />
            <span>{saving ? "Saving..." : "Save"}</span>
          </button>

          <button
            type="button"
            onClick={handleCreateNew}
            disabled={creating}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-300 text-zinc-900 text-xs font-medium rounded-md transition-colors disabled:opacity-50"
          >
            <LuPlus size={13} />
            <span>{creating ? "Creating..." : "New Note"}</span>
          </button>
        </div>
      </div>

      {/* Title + metadata */}
      <div className="px-8 pt-4">
        <input
          type="text"
          value={title}
          onChange={(e) => {
            const val = e.target.value;
            setTitle(val);
            debouncedSave(val, editor?.getHTML() || "", isPinnedRef.current);
          }}
          placeholder="Untitled"
          className="text-4xl font-extrabold bg-transparent text-white outline-none w-full placeholder-zinc-700 tracking-tight"
        />
        <p className="mt-1.5 text-xs text-zinc-500">
          {wordCount} {wordCount === 1 ? "word" : "words"} · {readTime}{" "}
          {readTime === 1 ? "min" : "min"} read
        </p>
      </div>

      {/* Toolbar */}
      {editor && (
        <div className="mx-8 mt-4 border-y border-zinc-800/80 py-2 flex items-center gap-1 text-zinc-400 text-xs select-none">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
            className={`px-2 py-1 rounded font-bold hover:bg-zinc-800 hover:text-white ${
              editor.isActive("heading", { level: 1 })
                ? "bg-zinc-800 text-white"
                : ""
            }`}
          >
            H1
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            className={`px-2 py-1 rounded font-bold hover:bg-zinc-800 hover:text-white ${
              editor.isActive("heading", { level: 2 })
                ? "bg-zinc-800 text-white"
                : ""
            }`}
          >
            H2
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
            className={`px-2 py-1 rounded font-bold hover:bg-zinc-800 hover:text-white ${
              editor.isActive("heading", { level: 3 })
                ? "bg-zinc-800 text-white"
                : ""
            }`}
          >
            H3
          </button>

          <div className="w-[1px] h-4 bg-zinc-800 mx-1" />

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-1.5 rounded hover:bg-zinc-800 hover:text-white ${
              editor.isActive("bold") ? "bg-zinc-800 text-white" : ""
            }`}
          >
            <LuBold size={14} />
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-1.5 rounded hover:bg-zinc-800 hover:text-white ${
              editor.isActive("italic") ? "bg-zinc-800 text-white" : ""
            }`}
          >
            <LuItalic size={14} />
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-1.5 rounded hover:bg-zinc-800 hover:text-white ${
              editor.isActive("underline") ? "bg-zinc-800 text-white" : ""
            }`}
          >
            <LuUnderline size={14} />
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`p-1.5 rounded hover:bg-zinc-800 hover:text-white ${
              editor.isActive("strike") ? "bg-zinc-800 text-white" : ""
            }`}
          >
            <LuStrikethrough size={14} />
          </button>

          <div className="w-[1px] h-4 bg-zinc-800 mx-1" />

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-1.5 rounded hover:bg-zinc-800 hover:text-white ${
              editor.isActive("bulletList") ? "bg-zinc-800 text-white" : ""
            }`}
          >
            <LuList size={14} />
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-1.5 rounded hover:bg-zinc-800 hover:text-white ${
              editor.isActive("orderedList") ? "bg-zinc-800 text-white" : ""
            }`}
          >
            <LuListOrdered size={14} />
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={`p-1.5 rounded hover:bg-zinc-800 hover:text-white ${
              editor.isActive("codeBlock") ? "bg-zinc-800 text-white" : ""
            }`}
          >
            <LuCode size={14} />
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`p-1.5 rounded hover:bg-zinc-800 hover:text-white ${
              editor.isActive("blockquote") ? "bg-zinc-800 text-white" : ""
            }`}
          >
            <LuQuote size={14} />
          </button>

          <div className="w-[1px] h-4 bg-zinc-800 mx-1" />

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().undo().run()}
            className="p-1.5 rounded hover:bg-zinc-800 hover:text-white"
          >
            <LuUndo size={14} />
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().redo().run()}
            className="p-1.5 rounded hover:bg-zinc-800 hover:text-white"
          >
            <LuRedo size={14} />
          </button>
        </div>
      )}

      {/* Editor Canvas */}
      <div
        className="flex-1 px-8 py-6 overflow-y-auto cursor-text"
        onClick={() => editor?.chain().focus().run()}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
