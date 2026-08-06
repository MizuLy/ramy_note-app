import { useNavigate } from "react-router-dom";
import { logout } from "../../api/axios";
import { HiLogout } from "react-icons/hi";
import { useAuth } from "../../context/AuthProvider";

export default function Logout({ collapsed }) {
  const { setAccessToken, setUser, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      console.log(`Bye Bye, @${user?.name}`);
    } catch (err) {
      console.error("Logout failed:", err.message);
    } finally {
      setAccessToken(null);
      setUser(null);
      document.getElementById("logoutModal")?.close();
      navigate("/login");
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => document.getElementById("logoutModal")?.showModal()}
        title="Logout"
        className={`text-sm flex items-center gap-2 text-zinc-400 hover:text-white transition-colors ${
          collapsed ? "justify-center w-full" : ""
        }`}
      >
        <HiLogout size={20} className="shrink-0" />
        {!collapsed && <span>Logout</span>}
      </button>

      <dialog id="logoutModal" className="modal">
        <div className="modal-box bg-zinc-800 text-white max-w-sm">
          <h3 className="font-bold text-lg mb-2">Log out?</h3>
          <p className="text-sm text-zinc-400 mb-6">
            You'll need to log back in to access your notes.
          </p>

          <div className="modal-action">
            <form method="dialog" className="flex gap-2">
              <button
                type="button"
                onClick={() => document.getElementById("logoutModal")?.close()}
                className="btn btn-sm btn-ghost"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="btn btn-sm bg-red-600 hover:bg-red-700 text-white border-none"
              >
                Log out
              </button>
            </form>
          </div>
        </div>

        <form method="dialog" className="modal-backdrop bg-black/60">
          <button>close</button>
        </form>
      </dialog>
    </>
  );
}
