import { useState } from "react";
import { IoClose } from "react-icons/io5";
import { useAuth } from "../../context/AuthProvider";
import { getTags } from "../../api/axios";

export default function SearchModal() {
  const [tags, setTags] = useState([]);

  const { accessToken } = useAuth();

  const fetchTags = async () => {
    try {
      const data = await getTags(accessToken);
      setTags(data);
    } catch (err) {
      console.error("Failed to fetch tags:", err.message);
    }
  };

  return (
    <dialog id="searchModal" className="modal">
      <div className="modal-box bg-zinc-800 text-white">
        <h3 className="font-bold text-lg">Search Notes</h3>

        {/* Search Input inside Modal */}
        <input
          type="search"
          placeholder="Type to search..."
          className="w-full mt-4 px-4 py-2 rounded-md bg-zinc-700 text-white outline-none focus:ring-2 focus:ring-zinc-500"
          autoFocus
        />

        <div className="modal-action">
          <form method="dialog">
            {/* Native dialog close button */}
            <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
              <IoClose size={24} />
            </button>

            {/* Tag field */}
            <div>
              <button></button>
            </div>
          </form>
        </div>
      </div>

      {/* Backdrop to close modal when clicking outside */}
      <form method="dialog" className="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  );
}
