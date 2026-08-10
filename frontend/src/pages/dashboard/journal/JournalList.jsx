import React from "react";
import { FiCalendar, FiEdit2, FiTrash2, FiBookOpen } from "react-icons/fi";

const MOOD_STYLES = {
  HAPPY: "text-emerald-400",
  EXCITED: "text-pink-400",
  NEUTRAL: "text-zinc-400",
  TIRED: "text-blue-400",
  ANXIOUS: "text-orange-400",
  SAD: "text-rose-400",
};

const MOOD_DISPLAY = {
  HAPPY: "Happy",
  EXCITED: "Excited",
  NEUTRAL: "Neutral",
  TIRED: "Tired",
  ANXIOUS: "Anxious",
  SAD: "Sad",
};

export default function JournalList({
  journals,
  onEdit,
  onSoftDelete,
  searchQuery,
  setSearchQuery,
}) {
  const filtered = journals.filter((item) => {
    const matchesSearch =
      item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.body?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex justify-end border-b border-zinc-800/80 pb-3">
        <input
          type="text"
          placeholder="Search journals..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="rounded-xl border border-zinc-800 bg-zinc-900/80 px-3.5 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:border-zinc-700 focus:outline-none"
        />
      </div>

      {/* List Feed */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-800 py-12 text-center">
          <FiBookOpen className="mx-auto h-8 w-8 text-zinc-600" />
          <p className="mt-2 text-sm text-zinc-400">No journals found</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((item) => {
            const id = item.id || item._id;
            const moodColor = MOOD_STYLES[item.mood] || "text-zinc-400";
            const moodLabel = MOOD_DISPLAY[item.mood] || "Neutral";

            return (
              <div
                key={id}
                className="group relative flex flex-col justify-between rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5 transition-all hover:border-zinc-700 hover:bg-zinc-900/80"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-zinc-500 mb-2">
                    <span className="flex items-center gap-1">
                      <FiCalendar className="h-3 w-3" />
                      {new Date(
                        item.createdAt || Date.now(),
                      ).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="text-base font-semibold text-zinc-100 line-clamp-1">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-xs text-zinc-400 line-clamp-3 leading-relaxed">
                    {item.body}
                  </p>
                </div>

                {/* Actions */}
                <div className="mt-4 flex items-center justify-between border-t border-zinc-800/60 pt-3">
                  <span className={`text-xs font-medium ${moodColor}`}>
                    {moodLabel}
                  </span>

                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onEdit(item)}
                      className="p-1 text-zinc-400 hover:text-white transition-colors"
                      title="Edit"
                    >
                      <FiEdit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => onSoftDelete(id)}
                      className="p-1 text-zinc-400 hover:text-rose-400 transition-colors"
                      title="Move to trash"
                    >
                      <FiTrash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
