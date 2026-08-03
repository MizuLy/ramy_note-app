import { SlOptions } from "react-icons/sl";
import { IoSearch } from "react-icons/io5";

export default function Sidebar() {
  return (
    <nav className="bg-zinc-800 w-[260px] h-screen text-white flex flex-col">
      {/* Sidebar Header */}
      <div className="border-b border-zinc-700 px-4 py-4">
        <h1 className="text-xl font-semibold">Sidebar</h1>
      </div>

      {/* Search Bar Container */}
      <div className="px-4 mt-4 mb-2">
        <div className="relative flex items-center">
          <IoSearch className="absolute left-3 text-zinc-400 text-lg pointer-events-none z-10" />
          <button
            type="button"
            onClick={() => document.getElementById("searchModal")?.showModal()}
            className="w-full pl-9 pr-4 py-2 rounded-md outline-none bg-zinc-700 hover:bg-zinc-900 focus:bg-zinc-900 text-sm text-zinc-400 text-left transition-colors duration-200"
          >
            Search notes...
          </button>
        </div>
      </div>

      {/* Navigation Items */}
      <div className="px-4 py-2">
        <div className="flex items-center justify-between hover:bg-zinc-900 px-3 py-2 rounded-md transition-colors duration-200 cursor-pointer">
          <p className="text-sm font-medium">My Notes</p>
          <SlOptions className="text-zinc-400 hover:text-white" />
        </div>
      </div>
    </nav>
  );
}
