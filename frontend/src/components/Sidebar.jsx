import { useState } from "react";
import { NavLink, Link } from "react-router-dom"; // 1. Swap Link for NavLink
import { SlOptions } from "react-icons/sl";
import { IoSearch } from "react-icons/io5";
import { PiNotebookLight } from "react-icons/pi";
import { RiShieldUserLine } from "react-icons/ri";
import { LuPanelLeftClose, LuPanelLeftOpen, LuSettings } from "react-icons/lu";
import { useAuth } from "../context/AuthProvider";
import Logout from "../pages/auth/Logout";

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem("sidebarCollapsed") === "true";
  });

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("sidebarCollapsed", next);
      return next;
    });
  };

  const { user } = useAuth();

  // Helper class function to apply active/inactive styles cleanly
  const getLinkClass = ({ isActive }) =>
    `flex items-center gap-3 py-2 rounded-md transition-colors duration-200 cursor-pointer ${
      collapsed ? "justify-center px-0" : "px-3"
    } ${
      isActive
        ? "bg-zinc-900 text-white font-semibold border-l-2 border-blue-500" // Active styles
        : "text-zinc-400 hover:bg-zinc-900/50 hover:text-white" // Inactive styles
    }`;

  return (
    <nav
      className={`bg-zinc-800 h-screen shrink-0 text-white flex flex-col transition-all duration-300 select-none ${
        collapsed ? "w-[64px]" : "w-[260px]"
      }`}
    >
      {/* Header */}
      <div
        className={`border-b border-zinc-700 p-4 flex items-center ${
          collapsed ? "justify-center" : "justify-between"
        }`}
      >
        {!collapsed && (
          <div className="overflow-hidden pr-2">
            <h1 className="text-sm font-semibold truncate">
              Welcome, {user?.name || "User"}
            </h1>
            <p className="text-xs text-zinc-400 truncate">
              Ready to get started?
            </p>
          </div>
        )}
        <button
          type="button"
          onClick={toggleCollapsed}
          className="text-zinc-400 hover:text-white shrink-0 p-1 rounded-md hover:bg-zinc-700 transition-colors"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <LuPanelLeftOpen size={20} />
          ) : (
            <LuPanelLeftClose size={20} />
          )}
        </button>
      </div>

      {/* Search Button */}
      <div className="px-3 mt-4 mb-2">
        <button
          type="button"
          onClick={() => document.getElementById("searchModal")?.showModal()}
          title="Search notes"
          className={`relative flex items-center rounded-md outline-none bg-zinc-700 hover:bg-zinc-900 text-sm text-zinc-400 transition-colors duration-200 ${
            collapsed
              ? "w-10 h-10 justify-center mx-auto"
              : "w-full pl-9 pr-4 py-2 text-left"
          }`}
        >
          <IoSearch
            className={`text-zinc-400 text-lg shrink-0 ${
              collapsed ? "" : "absolute left-3"
            }`}
          />
          {!collapsed && <span>Search notes...</span>}
        </button>
      </div>

      {/* Nav Items */}
      <div className="px-3 py-2 flex-1 space-y-1">
        {/* My Notes Link */}
        <NavLink to="/notes" className={getLinkClass} title="My Notes">
          <PiNotebookLight size={20} className="shrink-0" />
          {!collapsed && (
            <>
              <span className="text-sm flex-1 truncate">My Notes</span>
              <SlOptions className="text-zinc-400 hover:text-white text-xs shrink-0" />
            </>
          )}
        </NavLink>
        {/* Admin Link */}
        {user?.role === "ADMIN" && (
          <NavLink to="/admin" className={getLinkClass} title="Admin">
            <RiShieldUserLine size={20} className="shrink-0" />
            {!collapsed && (
              <span className="text-sm flex-1 truncate">Admin</span>
            )}
          </NavLink>
        )}
      </div>

      <div className="p-3 border-t border-zinc-700">
        <Link
          to="/settings"
          className={`flex items-center gap-3 rounded-md hover:bg-zinc-800/60 transition-colors text-zinc-200 ${
            collapsed ? "justify-center p-2" : "p-2"
          }`}
          title="Settings"
        >
          {/* Avatar Circle */}
          <div className="w-8 h-8 rounded-full bg-zinc-400 text-zinc-900 flex items-center justify-center text-xs font-semibold shrink-0">
            {user?.name?.[0]?.toUpperCase() || "U"}
          </div>

          {/* Expanded Mode: Show Name, Email & Settings Gear */}
          {!collapsed && (
            <>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-zinc-200 truncate">
                  {user?.name || "User"}
                </p>
                <p className="text-xs text-zinc-500 truncate">
                  {user?.email || ""}
                </p>
              </div>
              <LuSettings
                size={18}
                className="text-zinc-400 hover:animate-spin shrink-0"
              />
            </>
          )}
        </Link>
      </div>
    </nav>
  );
}
