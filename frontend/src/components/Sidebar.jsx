import { SlOptions } from "react-icons/sl";
import { IoSearch } from "react-icons/io5";
import { Link } from "react-router-dom";
import Logout from "../pages/auth/Logout";
import { currentUser } from "../api/axios";
import { useAuth } from "../context/AuthProvider";

export default function Sidebar() {
  const { user } = useAuth();
  return (
    <nav className="bg-zinc-800 w-[260px] h-screen text-white flex flex-col">
      {/* Sidebar Header */}
      <div className="border-b border-zinc-700 px-4 py-4">
        <h1 className="text-xl font-semibold">Welcome back, {user.name}</h1>
        <p className="text-xs">Ready to get starting?</p>
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
        <Link
          to="/notes"
          className="flex text-sm font-medium items-center justify-between hover:bg-zinc-900 px-3 py-2 rounded-md transition-colors duration-200 cursor-pointer"
        >
          My Notes
          <SlOptions className="text-zinc-400 hover:text-white" />
        </Link>
        <Link
          to="/admin"
          className="flex text-sm font-medium items-center justify-between hover:bg-zinc-900 px-3 py-2 rounded-md transition-colors duration-200 cursor-pointer"
        >
          Admin
          <SlOptions className="text-zinc-400 hover:text-white" />
        </Link>
        <Link
          to="/admin"
          className="flex text-sm font-medium items-center justify-between hover:bg-zinc-900 hover:text-white text-zinc-500 px-3 py-2 rounded-md transition-colors duration-200 cursor-pointer"
        >
          <Logout />
          <SlOptions className="text-zinc-400 hover:text-white" />
        </Link>
      </div>
    </nav>
  );
}
