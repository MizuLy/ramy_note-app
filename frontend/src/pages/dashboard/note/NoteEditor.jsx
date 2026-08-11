import { useEffect, useState, useRef } from "react";
import { useAuth } from "../../../context/AuthProvider";
import {
  getNoteId,
  updateNote,
  createNote,
  getFolders,
  getTags,
  deleteNote,
  restoreNote,
  permanentDeleteNote,
  togglePin,
} from "../../../api/axios";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import toast from "react-hot-toast";
import ConfirmModal from "../../../components/modals/ConfirmModal";

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
  LuFolder,
  LuTag,
  LuX,
  LuUser,
  LuCalendar,
  LuTrash2,
  LuRotateCcw,
} from "react-icons/lu";

const getWordCount = (text) => {
  if (!text) return 0;
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).filter(Boolean).length;
};

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

const formatDateFormatted = (dateStr) => {
  if (!dateStr) return "N/A";
  const date = new Date(dateStr);
  return date.toLocaleString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

const getReadTime = (words) => Math.max(1, Math.round(words / 200));

export default function NoteEditor({
  noteId,
  onNoteUpdated,
  onSelectNote,
  onTrashed,
  defaultFolderId = "",
  isTrash = false,
}) {
  const { accessToken, user } = useAuth();
  const [title, setTitle] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [createdAtRaw, setCreatedAtRaw] = useState(null);
  const [updatedAtRaw, setUpdatedAtRaw] = useState(null);
  const [trashing, setTrashing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [folders, setFolders] = useState([]);
  const [folderId, setFolderId] = useState("");

  const [availableTags, setAvailableTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);

  const activeNoteIdRef = useRef(noteId);
  const titleRef = useRef(title);
  const isPinnedRef = useRef(isPinned);
  const selectedTagsRef = useRef(selectedTags);
  const saveTimeoutRef = useRef(null);
  const isLoadingRef = useRef(false);

  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(id);
  }, []);

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

  useEffect(() => {
    selectedTagsRef.current = selectedTags;
  }, [selectedTags]);

  // Load Folders & Tags list
  useEffect(() => {
    if (!accessToken) return;
    const fetchData = async () => {
      try {
        const [foldersRes, tagsRes] = await Promise.all([
          getFolders(accessToken),
          getTags(accessToken),
        ]);
        const fList =
          foldersRes?.data || foldersRes?.result || foldersRes || [];
        const tList = tagsRes?.data || tagsRes?.result || tagsRes || [];
        setFolders(Array.isArray(fList) ? fList : []);
        setAvailableTags(Array.isArray(tList) ? tList : []);
      } catch (err) {
        console.error("Failed to load options:", err);
      }
    };
    fetchData();
  }, [accessToken]);

  const performSave = async (
    targetId,
    newTitle,
    newBody,
    newPinned,
    tagsList,
    isManual = false,
  ) => {
    if (!targetId) return;

    setSaving(true);
    try {
      const tagNames = tagsList.map((t) =>
        typeof t === "string" ? t : t.tag || t.name || t.tagName,
      );
      await updateNote(
        targetId,
        { title: newTitle, body: newBody, isPinned: newPinned, tagNames },
        accessToken,
      );
      setLastSavedAt(new Date());
      onNoteUpdated?.();

      if (isManual) {
        toast.success("Note saved successfully!");
      }
    } catch (err) {
      console.error("Save failed:", err);
      toast.error(err?.response?.data?.error || "Failed to save note");
    } finally {
      setSaving(false);
    }
  };

  const debouncedSave = (newTitle, newBody, newPinned, tagsList) => {
    const targetId = activeNoteIdRef.current;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(() => {
      performSave(targetId, newTitle, newBody, newPinned, tagsList, false);
    }, 800);
  };

  const handleManualSave = () => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    performSave(
      activeNoteIdRef.current,
      title,
      editor?.getHTML() || "",
      isPinned,
      selectedTags,
      true,
    );
  };

  const handleFolderChange = async (e) => {
    const targetId = activeNoteIdRef.current;
    const newFolderId = e.target.value || null;
    setFolderId(e.target.value);
    if (!targetId) return;

    try {
      await updateNote(targetId, { folderId: newFolderId }, accessToken);
      setLastSavedAt(new Date());
      onNoteUpdated?.();
      toast.success("Moved to folder");
    } catch (err) {
      console.error("Failed to change folder:", err);
      toast.error("Failed to move note to folder");
    }
  };

  const handleAddTag = (e) => {
    const tagVal = e.target.value;
    if (!tagVal) return;

    const exists = selectedTags.some(
      (t) => (t.id || t._id || t.name || t.tag || t) === tagVal,
    );

    if (!exists) {
      const foundTag =
        availableTags.find(
          (t) => (t.id || t._id || t.name || t.tag) === tagVal,
        ) || tagVal;

      const updated = [...selectedTags, foundTag];
      setSelectedTags(updated);
      debouncedSave(title, editor?.getHTML() || "", isPinned, updated);
      toast.success("Tag added");
    }
    e.target.value = "";
  };

  const handleRemoveTag = (tagToRemove) => {
    const targetVal =
      tagToRemove.id ||
      tagToRemove._id ||
      tagToRemove.name ||
      tagToRemove.tag ||
      tagToRemove;
    const updated = selectedTags.filter((t) => {
      const val = t.id || t._id || t.name || t.tag || t;
      return val !== targetVal;
    });
    setSelectedTags(updated);
    debouncedSave(title, editor?.getHTML() || "", isPinned, updated);
    toast.success("Tag removed");
  };

  // Tiptap Setup
  const editor = useEditor({
    extensions: [StarterKit],
    content: "",
    editorProps: {
      attributes: {
        class:
          "focus:outline-none min-h-[300px] text-sm text-zinc-200 leading-relaxed",
      },
    },
    onUpdate: ({ editor }) => {
      setWordCount(getWordCount(editor.getText()));
      if (isLoadingRef.current) return;
      if (activeNoteIdRef.current) {
        debouncedSave(
          titleRef.current,
          editor.getHTML(),
          isPinnedRef.current,
          selectedTagsRef.current,
        );
      }
    },
  });

  // Load Note
  useEffect(() => {
    if (!noteId) {
      setTitle("");
      setIsPinned(false);
      setWordCount(0);
      setLastSavedAt(null);
      setFolderId("");
      setSelectedTags([]);
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
        const data = await getNoteId(noteId, accessToken, { trash: isTrash });
        const found = data?.data || data?.result || data;

        if (found && !cancelled && editor && !editor.isDestroyed) {
          isLoadingRef.current = true;

          setTitle(found.title || "");
          const pinnedValue =
            found.isPinned ?? found.pinned ?? found.is_pinned ?? false;
          setIsPinned(pinnedValue);
          setFolderId(found.folderId || "");

          const initialTags = found.tags || found.tagNames || [];
          setSelectedTags(Array.isArray(initialTags) ? initialTags : []);
          selectedTagsRef.current = Array.isArray(initialTags)
            ? initialTags
            : [];

          setCreatedAtRaw(found.createdAt);
          setUpdatedAtRaw(found.updatedAt);

          editor.commands.setContent(found.body || "", { emitUpdate: false });
          setWordCount(getWordCount(editor.getText()));

          const savedTimestamp = found.updatedAt || found.createdAt;
          setLastSavedAt(savedTimestamp ? new Date(savedTimestamp) : null);

          titleRef.current = found.title || "";
          isPinnedRef.current = pinnedValue;

          queueMicrotask(() => {
            isLoadingRef.current = false;
          });
        }
      } catch (err) {
        console.error("Failed to load note:", err);
        toast.error("Failed to load note details");
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
      const payload = { title: "", body: "", tagNames: [] };
      if (defaultFolderId) payload.folderId = defaultFolderId;
      const res = await createNote(payload, accessToken);

      const resData = res?.data || res;
      const newNote = resData?.data || resData?.result || resData;
      const newId = newNote?.id || newNote?._id;

      if (newId) {
        setTitle(newNote.title || "");
        setWordCount(0);
        setLastSavedAt(new Date());
        setFolderId(newNote.folderId || defaultFolderId || "");
        setSelectedTags([]);
        if (editor && !editor.isDestroyed) {
          isLoadingRef.current = true;
          editor.commands.setContent("", { emitUpdate: false });
          queueMicrotask(() => {
            isLoadingRef.current = false;
          });
        }
        await onNoteUpdated?.();
        onSelectNote?.(newId);
        toast.success("Created new note");
      }
    } catch (err) {
      console.error("Failed to create note:", err);
      toast.error("Failed to create new note");
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
      toast.success(nextPinnedState ? "Note pinned to top" : "Note unpinned");
    } catch (err) {
      console.error("Failed to toggle pin state:", err);
      setIsPinned(!nextPinnedState);
      toast.error("Failed to update pin state");
    }
  };

  const handleMoveToTrash = async () => {
    if (!noteId) return;
    setTrashing(true);
    try {
      await deleteNote(noteId, accessToken);
      toast.success("Note moved to trash");
      onTrashed?.();
    } catch (err) {
      console.error("Failed to move to trash:", err);
      toast.error(err?.response?.data?.error || "Failed to move to trash");
    } finally {
      setTrashing(false);
    }
  };

  const handleRestore = async () => {
    if (!noteId) return;
    setTrashing(true);
    try {
      await restoreNote(noteId, accessToken);
      toast.success("Note restored");
      onNoteUpdated?.();
    } catch (err) {
      console.error("Failed to restore note:", err);
      toast.error(err?.response?.data?.error || "Failed to restore note");
    } finally {
      setTrashing(false);
    }
  };

  const handleDeleteForeverRequest = () => {
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!noteId) return;
    setTrashing(true);
    try {
      await permanentDeleteNote(noteId, accessToken);
      toast.success("Note permanently deleted");
      onTrashed?.();
    } catch (err) {
      console.error("Failed to delete note permanently:", err);
      toast.error(err?.response?.data?.error || "Failed to delete note");
    } finally {
      setConfirmOpen(false);
      setTrashing(false);
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
    <div className="flex-1 h-screen flex flex-col bg-zinc-950 text-zinc-200 overflow-hidden">
      <div className="w-full max-w-2xl mx-auto flex flex-col h-full">
        {/* Top action bar */}
        <div className="px-4 pt-4 flex items-center justify-between gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border shrink-0 ${
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

          <div className="flex items-center gap-1.5 shrink-0">
            {!isTrash && (
              <>
                {/* Folder selection dropdown */}
                <div className="relative flex items-center">
                  <LuFolder
                    size={12}
                    className="absolute left-2 text-zinc-500 pointer-events-none"
                  />
                  <select
                    value={folderId}
                    onChange={handleFolderChange}
                    title="Move to folder"
                    className="appearance-none bg-transparent border border-zinc-800 hover:bg-zinc-800 text-zinc-300 text-xs rounded-md pl-6 pr-2 py-1.5 outline-none cursor-pointer max-w-[110px]"
                  >
                    <option value="" className="bg-zinc-900">
                      No folder
                    </option>
                    {folders.map((folder) => {
                      const id = folder.id || folder._id;
                      return (
                        <option key={id} value={id} className="bg-zinc-900">
                          {folder.name}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleTogglePin}
                  title={isPinned ? "Unpin note" : "Pin note"}
                  className={`p-1.5 rounded-md border transition-colors ${
                    isPinned
                      ? "bg-zinc-100 text-zinc-900 border-zinc-100"
                      : "text-zinc-400 border-zinc-800 hover:text-white hover:bg-zinc-800"
                  }`}
                >
                  <LuPin
                    size={13}
                    className={isPinned ? "rotate-45 transition-transform" : ""}
                  />
                </button>
              </>
            )}

            {!isTrash ? (
              <button
                type="button"
                onClick={handleMoveToTrash}
                disabled={trashing || saving}
                title="Move to trash"
                className="p-1.5 rounded-md border border-zinc-800 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition-colors disabled:opacity-50"
              >
                <LuTrash2 size={13} />
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleRestore}
                  disabled={trashing || saving}
                  title="Restore note"
                  className="p-1.5 rounded-md border border-zinc-800 text-zinc-400 hover:text-green-400 hover:bg-zinc-800 transition-colors disabled:opacity-50"
                >
                  <LuRotateCcw size={13} />
                </button>
                <button
                  type="button"
                  onClick={handleDeleteForeverRequest}
                  disabled={trashing || saving}
                  title="Delete permanently"
                  className="p-1.5 rounded-md border border-zinc-800 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition-colors disabled:opacity-50"
                >
                  <LuTrash2 size={13} />
                </button>
              </>
            )}

            <button
              type="button"
              onClick={handleManualSave}
              disabled={saving}
              title="Save note"
              className="flex items-center gap-1.5 px-2.5 py-1.5 border border-zinc-800 hover:bg-zinc-800 text-zinc-200 text-xs font-medium rounded-md transition-colors disabled:opacity-50"
            >
              <LuSave size={12} className={saving ? "animate-pulse" : ""} />
              <span>{saving ? "Saving..." : "Save"}</span>
            </button>

            {!isTrash && (
              <button
                type="button"
                onClick={handleCreateNew}
                disabled={creating}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-100 hover:bg-zinc-300 text-zinc-900 text-xs font-medium rounded-md transition-colors disabled:opacity-50"
              >
                <LuPlus size={12} />
                <span>{creating ? "Creating..." : "New Note"}</span>
              </button>
            )}
          </div>
        </div>

        {/* Title input */}
        <div className="px-4 pt-3">
          <input
            type="text"
            value={title}
            onChange={(e) => {
              const val = e.target.value;
              setTitle(val);
              debouncedSave(
                val,
                editor?.getHTML() || "",
                isPinned,
                selectedTags,
              );
            }}
            placeholder="Untitled"
            className="text-2xl font-extrabold bg-transparent text-white outline-none w-full placeholder-zinc-700 tracking-tight"
          />
          <p className="mt-1 text-xs text-zinc-500">
            {wordCount} {wordCount === 1 ? "word" : "words"} · {readTime}{" "}
            {readTime === 1 ? "min" : "min"} read
          </p>
        </div>

        {/* METADATA SECTION */}
        <div className="px-4 pt-4 pb-2 space-y-2.5 text-xs text-zinc-400">
          <div className="flex items-center gap-4">
            <span className="w-24 text-zinc-500 flex items-center gap-1.5 shrink-0">
              <LuUser size={13} /> Created by
            </span>
            <div className="flex items-center gap-2 text-zinc-300 font-medium">
              <span>{user?.name || user?.username || "You"}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="w-24 text-zinc-500 flex items-center gap-1.5 shrink-0">
              <LuCalendar size={13} /> Last Modified
            </span>
            <span className="text-zinc-300 font-medium">
              {formatDateFormatted(updatedAtRaw || createdAtRaw)}
            </span>
          </div>

          <div className="flex items-start gap-4">
            <span className="w-24 text-zinc-500 flex items-center gap-1.5 shrink-0 pt-1">
              <LuTag size={13} /> Tags
            </span>
            <div className="flex-1 flex flex-wrap items-center gap-1.5">
              {selectedTags.map((tagObj, idx) => {
                const label =
                  typeof tagObj === "string"
                    ? tagObj
                    : tagObj.tag || tagObj.name || tagObj.tagName || "Tag";
                const key = tagObj.id || tagObj._id || idx;

                return (
                  <span
                    key={key}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-800/80 border border-zinc-700/60 text-zinc-300 text-xs font-medium"
                  >
                    {label}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tagObj)}
                      className="text-zinc-400 hover:text-white transition-colors"
                    >
                      <LuX size={12} />
                    </button>
                  </span>
                );
              })}

              <div className="relative inline-flex items-center">
                <select
                  defaultValue=""
                  onChange={handleAddTag}
                  className="appearance-none bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 text-xs rounded px-2 py-1 outline-none cursor-pointer"
                >
                  <option value="" disabled>
                    + Add tag
                  </option>
                  {availableTags.map((t) => {
                    const tagId = t.id || t._id || t.name || t.tag;
                    const tagName = t.tag || t.name || t.tagName;
                    return (
                      <option key={tagId} value={tagId} className="bg-zinc-900">
                        {tagName}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        {editor && (
          <div className="mx-4 mt-2 border-y border-zinc-800/80 py-1.5 flex items-center gap-0.5 text-zinc-400 text-xs select-none overflow-x-auto">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 1 }).run()
              }
              className={`px-1.5 py-1 rounded font-bold hover:bg-zinc-800 hover:text-white ${
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
              className={`px-1.5 py-1 rounded font-bold hover:bg-zinc-800 hover:text-white ${
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
              className={`px-1.5 py-1 rounded font-bold hover:bg-zinc-800 hover:text-white ${
                editor.isActive("heading", { level: 3 })
                  ? "bg-zinc-800 text-white"
                  : ""
              }`}
            >
              H3
            </button>

            <div className="w-[1px] h-4 bg-zinc-800 mx-1 shrink-0" />

            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`p-1 rounded hover:bg-zinc-800 hover:text-white ${
                editor.isActive("bold") ? "bg-zinc-800 text-white" : ""
              }`}
            >
              <LuBold size={13} />
            </button>

            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`p-1 rounded hover:bg-zinc-800 hover:text-white ${
                editor.isActive("italic") ? "bg-zinc-800 text-white" : ""
              }`}
            >
              <LuItalic size={13} />
            </button>

            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              className={`p-1 rounded hover:bg-zinc-800 hover:text-white ${
                editor.isActive("underline") ? "bg-zinc-800 text-white" : ""
              }`}
            >
              <LuUnderline size={13} />
            </button>

            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => editor.chain().focus().toggleStrike().run()}
              className={`p-1 rounded hover:bg-zinc-800 hover:text-white ${
                editor.isActive("strike") ? "bg-zinc-800 text-white" : ""
              }`}
            >
              <LuStrikethrough size={13} />
            </button>

            <div className="w-[1px] h-4 bg-zinc-800 mx-1 shrink-0" />

            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={`p-1 rounded hover:bg-zinc-800 hover:text-white ${
                editor.isActive("bulletList") ? "bg-zinc-800 text-white" : ""
              }`}
            >
              <LuList size={13} />
            </button>

            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={`p-1 rounded hover:bg-zinc-800 hover:text-white ${
                editor.isActive("orderedList") ? "bg-zinc-800 text-white" : ""
              }`}
            >
              <LuListOrdered size={13} />
            </button>

            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              className={`p-1 rounded hover:bg-zinc-800 hover:text-white ${
                editor.isActive("codeBlock") ? "bg-zinc-800 text-white" : ""
              }`}
            >
              <LuCode size={13} />
            </button>

            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              className={`p-1 rounded hover:bg-zinc-800 hover:text-white ${
                editor.isActive("blockquote") ? "bg-zinc-800 text-white" : ""
              }`}
            >
              <LuQuote size={13} />
            </button>

            <div className="w-[1px] h-4 bg-zinc-800 mx-1 shrink-0" />

            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => editor.chain().focus().undo().run()}
              className="p-1 rounded hover:bg-zinc-800 hover:text-white"
            >
              <LuUndo size={13} />
            </button>

            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => editor.chain().focus().redo().run()}
              className="p-1 rounded hover:bg-zinc-800 hover:text-white"
            >
              <LuRedo size={13} />
            </button>
          </div>
        )}

        {/* Editor Canvas */}
        <div
          className="flex-1 px-4 py-4 overflow-y-auto cursor-text"
          onClick={() => editor?.chain().focus().run()}
        >
          <EditorContent editor={editor} />
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmOpen}
        title="Delete note permanently?"
        message="This will permanently delete the note. This action cannot be undone."
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
