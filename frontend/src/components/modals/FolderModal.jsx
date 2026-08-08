import React, { useState, useEffect } from "react";
import { IoClose } from "react-icons/io5";
import { createFolder, updateFolder } from "../../api/axios";
import { useAuth } from "../../context/AuthProvider";
import {
  setFolderColor,
  getFolderColor,
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

export default function FolderModal({
  isOpen,
  onClose,
  onFolderCreated,
  onFolderUpdated,
  folder,
}) {
  const [shouldRender, setShouldRender] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const [folderName, setFolderName] = useState("");
  const [selectedColor, setSelectedColor] = useState(COLOR_PRESETS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { accessToken } = useAuth();

  const isEditing = Boolean(folder);

  // Handle open / close animation lifecycle
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      // Wait a frame for DOM to mount before starting transition
      const timer = setTimeout(() => setIsAnimating(true), 10);
      return () => clearTimeout(timer);
    } else {
      setIsAnimating(false);
      // Wait for exit transition duration (200ms) before unmounting
      const timer = setTimeout(() => setShouldRender(false), 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Sync form fields whenever the modal opens or the target folder changes
  useEffect(() => {
    if (isOpen) {
      setFolderName(folder?.name || "");
      setSelectedColor(
        folder?.id || folder?._id
          ? getFolderColor(folder.id || folder._id)
          : COLOR_PRESETS[0] || DEFAULT_ITEM_COLOR,
      );
      setError("");
    }
  }, [isOpen, folder]);

  // Close on Escape key press
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
    if (!folderName.trim()) return;

    try {
      setLoading(true);
      setError("");

      const payload = { name: folderName.trim() };

      if (isEditing) {
        const folderId = folder.id || folder._id;
        await updateFolder(folderId, payload, accessToken);
        setFolderColor(folderId, selectedColor);
        onFolderUpdated?.();
      } else {
        const res = await createFolder(payload, accessToken);
        const created = res?.result || res?.data?.result || res?.data;
        const id = created?.id || created?._id;
        if (id) setFolderColor(id, selectedColor);
        onFolderCreated?.(created);
      }

      setFolderName("");
      setSelectedColor(COLOR_PRESETS[0]);
      onClose();
    } catch (err) {
      console.error(
        isEditing ? "Error updating folder:" : "Error creating folder:",
        err,
      );
      setError(err.response?.data?.message || "Something went wrong");
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
            {isEditing ? "Edit Folder" : "New Folder"}
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
              Folder Name
            </label>
            <input
              type="text"
              placeholder="e.g. Personal Projects"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
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
                  : "Save Folder"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
