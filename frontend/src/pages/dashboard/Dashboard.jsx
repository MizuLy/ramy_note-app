import { Link } from "react-router-dom";
import { PiNotebookLight } from "react-icons/pi";
import { useAuth } from "../../context/AuthProvider";
import { useEffect } from "react";

export default function Dashboard() {
  const { user } = useAuth();

  useEffect(() => {
    document.title = "Ramy";
  });
  return (
    <div className="flex-1 h-screen flex flex-col items-center justify-center bg-zinc-950 text-white px-4">
      <PiNotebookLight size={48} className="text-zinc-500 mb-6" />

      <h1 className="text-2xl font-semibold mb-2">
        Welcome back, {user?.name || "there"}
      </h1>
      <p className="text-sm text-zinc-400 mb-8 text-center max-w-sm">
        Your notes, tags, and ideas all live here. Pick up where you left off,
        or start something new.
      </p>

      <Link
        to="/notes"
        className="px-6 py-2.5 rounded-md bg-zinc-100 text-zinc-900 font-medium hover:bg-zinc-300 transition-colors duration-200"
      >
        Go to My Notes
      </Link>
    </div>
  );
}
