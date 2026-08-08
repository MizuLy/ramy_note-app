import { useEffect, useState } from "react";
import { IoClose, IoSearch } from "react-icons/io5";
import { useAuth } from "../../context/AuthProvider";
import { getTags } from "../../api/axios";

export default function SearchModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [tags, setTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const { accessToken } = useAuth();

  // Helper to trigger open with animation
  const handleOpen = () => {
    setIsOpen(true);
    // Slight delay so DOM mounts before transition starts
    setTimeout(() => setIsAnimating(true), 10);
  };

  // Helper to trigger close with exit animation duration
  const handleClose = () => {
    setIsAnimating(false);
    // Wait for the transition duration (200ms) before unmounting from DOM
    setTimeout(() => setIsOpen(false), 200);
  };

  // Bind methods to the ID container so existing Sidebar triggers work
  useEffect(() => {
    const el = document.getElementById("searchModal");
    if (el) {
      el.showModal = handleOpen;
      el.close = handleClose;
    }
  }, []);

  // Fetch tags
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const data = await getTags(accessToken);
        setTags(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to fetch tags:", err.message);
      }
    };

    if (accessToken) fetchTags();
  }, [accessToken]);

  // Handle closing with Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleToggleTag = (tagId) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId],
    );
  };

  return (
    <div id="searchModal">
      {isOpen && (
        /* Modal Backdrop Fade */
        <div
          className={`fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/60 backdrop-blur-sm transition-opacity duration-200 ease-out ${
            isAnimating ? "opacity-100" : "opacity-0"
          }`}
          onClick={handleClose}
        >
          {/* Modal Content Scale + Fade */}
          <div
            className={`relative w-full max-w-lg bg-zinc-800 text-white rounded-xl border border-zinc-700 p-6 shadow-2xl mx-4 overflow-hidden transform transition-all duration-200 ease-out ${
              isAnimating
                ? "opacity-100 scale-100 translate-y-0"
                : "opacity-0 scale-95 -translate-y-2"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3">
              <h3 className="font-semibold text-base text-zinc-100">
                Looking for something, MAGICAL?!
              </h3>
              <button
                type="button"
                onClick={handleClose}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-700/60 transition-colors"
                title="Close"
              >
                <IoClose size={20} />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative mt-2">
              <IoSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 text-lg" />
              <input
                type="search"
                placeholder="Type to search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-zinc-900/80 text-sm text-white placeholder-zinc-500 border border-zinc-700/80 outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-all"
                autoFocus
              />
            </div>

            {/* Tags */}
            {tags.length > 0 && (
              <div className="mt-4 pt-3 border-t border-zinc-700/50">
                <p className="text-xs font-medium text-zinc-400 mb-2">
                  Filter by tags:
                </p>
                <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pr-1">
                  {tags.map((t) => {
                    const tagId = t.id || t._id;
                    const isSelected = selectedTags.includes(tagId);

                    return (
                      <button
                        key={tagId}
                        type="button"
                        onClick={() => handleToggleTag(tagId)}
                        className={`px-3 py-1 text-xs rounded-full border transition-all ${
                          isSelected
                            ? "bg-blue-600 border-blue-500 text-white font-medium"
                            : "border-zinc-600 text-zinc-300 hover:bg-zinc-700 hover:border-zinc-500"
                        }`}
                      >
                        {t.tag}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
