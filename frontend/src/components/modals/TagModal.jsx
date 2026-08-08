import React, { useState, useEffect } from "react";
import { IoClose } from "react-icons/io5";
import { createTag, updateTag } from "../../api/axios";
import { useAuth } from "../../context/AuthProvider";
import {
  setTagColor,
  getTagColor,
  DEFAULT_ITEM_COLOR,
} from "../../utils/localColors";

const COLOR_PRESETS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#f97316",
];

export default function TagModal({ isOpen, onClose, onTagChanged, tag }) {
  const [shouldRender, setShouldRender] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const [tagName, setTagName] = useState("");
  const [selectedColor, setSelectedColor] = useState(COLOR_PRESETS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { accessToken } = useAuth();

  const isEditing = Boolean(tag);
  const tagId = tag?.id || tag?._id;

  // Handle open / close transition lifecycle matching FolderModal
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      // Brief delay for DOM mount before triggering Tailwind CSS transitions
      const timer = setTimeout(() => setIsAnimating(true), 10);
      return () => clearTimeout(timer);
    } else {
      setIsAnimating(false);
      // Wait for exit transition duration (200ms) before unmounting DOM
      const timer = setTimeout(() => setShouldRender(false), 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Sync state whenever modal opens or active tag changes
  useEffect(() => {
    if (isOpen) {
      setTagName(tag?.tag || "");
      setSelectedColor(
        tagId ? getTagColor(tagId) : COLOR_PRESETS[0] || DEFAULT_ITEM_COLOR,
      );
      setError("");
    }
  }, [isOpen, tag, tagId]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!shouldRender) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!tagName.trim()) return;

    try {
      setLoading(true);
      setError("");

      if (isEditing) {
        await updateTag(tagId, { tag: tagName.trim() }, accessToken);
        setTagColor(tagId, selectedColor);
      } else {
        const res = await createTag({ tag: tagName.trim() }, accessToken);
        const created = res?.data || res?.result || res;
        const id = created?.id || created?._id;
        if (id) setTagColor(id, selectedColor);
      }

      setTagName("");
      setSelectedColor(COLOR_PRESETS[0]);
      onTagChanged?.();
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Something went wrong",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    /* Backdrop fade transition */
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-200 ease-out ${
        isAnimating ? "opacity-100" : "opacity-0"
      }`}
      onClick={onClose}
    >
      {/* Modal content box scale/fade transition */}
      <div
        className={`w-full max-w-md bg-zinc-900 text-zinc-100 rounded-xl border border-zinc-800 p-6 shadow-xl transform transition-all duration-200 ease-out ${
          isAnimating
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 translate-y-2"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <h2 className="text-base font-semibold">
            {isEditing ? "Edit Tag" : "New Tag"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <IoClose size={18} />
          </button>
        </div>

        {error && (
          <p className="mt-3 text-xs text-red-400 bg-red-500/10 p-2 rounded border border-red-500/20">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-5">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Tag Name
            </label>
            <input
              type="text"
              placeholder="e.g. Work"
              value={tagName}
              onChange={(e) => setTagName(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3.5 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
              autoFocus
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-2">
              Color Tag
            </label>
            <div className="flex items-center gap-2.5 flex-wrap">
              {COLOR_PRESETS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  style={{ backgroundColor: color }}
                  className={`w-7 h-7 rounded-full transition-all ${
                    selectedColor === color
                      ? "ring-2 ring-white ring-offset-2 ring-offset-zinc-900 scale-110"
                      : "opacity-80 hover:opacity-100"
                  }`}
                  disabled={loading}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm text-zinc-400 hover:text-white transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg text-sm bg-blue-600 hover:bg-blue-500 text-white transition-colors disabled:opacity-50"
            >
              {loading
                ? isEditing
                  ? "Saving..."
                  : "Creating..."
                : isEditing
                  ? "Save Changes"
                  : "Save Tag"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
