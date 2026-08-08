import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
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

        toast.success("Tag updated!");
        onTagChanged?.();
      } else {
        const res = await createTag({ tag: tagName.trim() }, accessToken);
        const created = res?.data?.result || res?.result || res?.data || res;
        const id = created?.id || created?._id;

        if (id) setTagColor(id, selectedColor);

        toast.success("Tag created!");
        onTagChanged?.(created);
      }

      setTagName("");
      setSelectedColor(COLOR_PRESETS[0]);
      onClose();
    } catch (err) {
      const errorMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Something went wrong";

      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-200 ${
        isAnimating ? "bg-black/60 opacity-100" : "bg-black/0 opacity-0"
      }`}
      onClick={onClose}
    >
      <div
        className={`w-full max-w-md rounded-2xl bg-neutral-900 p-6 text-white shadow-2xl transition-all duration-200 border border-neutral-800 ${
          isAnimating ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            {isEditing ? "Edit Tag" : "Create Tag"}
          </h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-400 border border-red-500/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1">
              Tag Name
            </label>
            <input
              type="text"
              value={tagName}
              onChange={(e) => setTagName(e.target.value)}
              placeholder="e.g. Design, React..."
              className="w-full rounded-lg bg-neutral-800 border border-neutral-700 px-3 py-2 text-sm text-white placeholder-neutral-500 focus:border-white focus:outline-none"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-2">
              Color Accent
            </label>
            <div className="flex items-center gap-2">
              {COLOR_PRESETS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`h-6 w-6 rounded-full transition-transform ${
                    selectedColor === color
                      ? "ring-2 ring-white ring-offset-2 ring-offset-neutral-900 scale-110"
                      : "hover:scale-105 opacity-80"
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !tagName.trim()}
              className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black hover:bg-neutral-200 transition-colors disabled:opacity-50"
            >
              {loading ? "Saving..." : isEditing ? "Update Tag" : "Create Tag"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
