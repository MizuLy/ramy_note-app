import { useEffect, useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { IoSearch } from "react-icons/io5";
import { PiNotebookLight } from "react-icons/pi";
import { RiShieldUserLine } from "react-icons/ri";
import {
  LuPanelLeftClose,
  LuPanelLeftOpen,
  LuSettings,
  LuPencil,
  LuTrash2,
  LuListTodo,
  LuPencilLine,
  LuTag,
  LuFolder,
  LuX,
} from "react-icons/lu";
import { GoPlus, GoChevronDown } from "react-icons/go";
import { useAuth } from "../context/AuthProvider";
import { getFolderColor, getTagColor } from "../utils/localColors";

// Modals
import FolderModal from "../components/modals/FolderModal";
import DeleteFolderModal from "../components/modals/DeleteFolderModal";
import TagModal from "../components/modals/TagModal";

// API
import { getFolders, deleteFolder, getTags, deleteTag } from "../api/axios";

// Tracks whether the viewport is below Tailwind's `md` breakpoint (768px),
// updating on resize/orientation change instead of reading window.innerWidth
// once at render time.
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth < 768,
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return isMobile;
}

export default function Sidebar({ onCloseMobile }) {
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem("sidebarCollapsed") === "true";
  });

  const isMobile = useIsMobile();
  // On mobile the sidebar always renders expanded (it's a full drawer),
  // so labels should show whenever we're not collapsed OR we're on mobile.
  const showLabels = !collapsed || isMobile;

  // Folder States
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState(null);
  const [deletingFolder, setDeletingFolder] = useState(null);
  const [folders, setFolders] = useState([]);
  const [isFoldersOpen, setIsFoldersOpen] = useState(() => {
    const saved = localStorage.getItem("isFoldersOpen");
    return saved !== null ? saved === "true" : true;
  });

  // Tag States
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState(null);
  const [tags, setTags] = useState([]);
  const [isTagsOpen, setIsTagsOpen] = useState(() => {
    const saved = localStorage.getItem("isTagsOpen");
    return saved !== null ? saved === "true" : true;
  });

  // Context Menu State
  const [contextMenu, setContextMenu] = useState(null);

  const { user, accessToken } = useAuth();

  // Helper to handle link navigation & auto-close mobile drawer
  const handleNavClick = () => {
    if (onCloseMobile) onCloseMobile();
  };

  // Toggles
  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("sidebarCollapsed", String(next));
      return next;
    });
  };

  const toggleFoldersOpen = () => {
    setIsFoldersOpen((prev) => {
      const next = !prev;
      localStorage.setItem("isFoldersOpen", String(next));
      return next;
    });
  };

  const toggleTagsOpen = () => {
    setIsTagsOpen((prev) => {
      const next = !prev;
      localStorage.setItem("isTagsOpen", String(next));
      return next;
    });
  };

  // Fetch Operations
  const fetchFolders = async () => {
    if (!accessToken) return;
    try {
      const res = await getFolders(accessToken);
      const list = res?.data || res?.result || res || [];
      setFolders(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error("Error fetching folders:", error);
    }
  };

  const fetchTagsList = async () => {
    if (!accessToken) return;
    try {
      const res = await getTags(accessToken);
      const list = res?.data || res?.result || res || [];
      setTags(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error("Error fetching tags:", error);
    }
  };

  useEffect(() => {
    fetchFolders();
    fetchTagsList();
  }, [accessToken]);

  useEffect(() => {
    if (!contextMenu) return;
    const closeMenu = () => setContextMenu(null);
    window.addEventListener("click", closeMenu);
    window.addEventListener("scroll", closeMenu, true);
    window.addEventListener("resize", closeMenu);
    return () => {
      window.removeEventListener("click", closeMenu);
      window.removeEventListener("scroll", closeMenu, true);
      window.removeEventListener("resize", closeMenu);
    };
  }, [contextMenu]);

  // Handlers
  const handleOpenCreateFolderModal = () => {
    setEditingFolder(null);
    setIsFolderModalOpen(true);
  };

  const handleOpenEditFolderModal = (folder) => {
    setEditingFolder(folder);
    setIsFolderModalOpen(true);
  };

  const handleConfirmFolderDelete = async (mode) => {
    if (!deletingFolder) return;
    const id = deletingFolder.id || deletingFolder._id;
    try {
      await deleteFolder(id, mode, accessToken);
      await fetchFolders();
    } catch (error) {
      console.error("Error deleting folder:", error);
    } finally {
      setDeletingFolder(null);
    }
  };

  const handleOpenCreateTagModal = () => {
    setEditingTag(null);
    setIsTagModalOpen(true);
  };

  const handleOpenEditTagModal = (tag) => {
    setEditingTag(tag);
    setIsTagModalOpen(true);
  };

  const handleTagDelete = async (tag) => {
    const id = tag.id || tag._id;
    try {
      await deleteTag(id, accessToken);
      await fetchTagsList();
    } catch (error) {
      console.error("Error deleting tag:", error);
    }
  };

  const handleContextMenu = (e, item, type) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, item, type });
  };

  const handleContextEdit = () => {
    if (contextMenu?.type === "folder") {
      handleOpenEditFolderModal(contextMenu.item);
    } else if (contextMenu?.type === "tag") {
      handleOpenEditTagModal(contextMenu.item);
    }
    setContextMenu(null);
  };

  const handleContextDelete = () => {
    if (contextMenu?.type === "folder") {
      setDeletingFolder(contextMenu.item);
    } else if (contextMenu?.type === "tag") {
      handleTagDelete(contextMenu.item);
    }
    setContextMenu(null);
  };

  const getLinkClass = ({ isActive }) =>
    `flex items-center gap-3 py-2 rounded-md transition-colors duration-200 cursor-pointer ${
      collapsed ? "md:justify-center md:px-0 px-3" : "px-3"
    } ${
      isActive
        ? "bg-zinc-900 text-white font-semibold border-l-2 border-blue-500"
        : "text-zinc-400 hover:bg-zinc-900/50 hover:text-white"
    }`;

  const getItemLinkClass = ({ isActive }) =>
    `flex items-center gap-2 py-1.5 rounded-md text-sm cursor-pointer transition-colors w-full ${
      collapsed ? "md:justify-center md:px-0 px-2" : "px-2"
    } ${
      isActive
        ? "bg-zinc-900 text-white font-medium"
        : "hover:bg-zinc-900/60 text-zinc-300"
    }`;

  return (
    <>
      <nav
        className={`bg-zinc-800 h-screen shrink-0 text-white flex flex-col transition-all duration-300 select-none ${
          collapsed ? "w-[280px] md:w-[64px]" : "w-[280px] md:w-[260px]"
        }`}
      >
        {/* Header */}
        <div
          className={`border-b border-zinc-700 p-4 flex items-center justify-between`}
        >
          {showLabels && (
            <div className="overflow-hidden pr-2">
              <h1 className="text-sm font-semibold truncate">
                Welcome, {user?.name || "User"}
              </h1>
              <p className="text-xs text-zinc-400 truncate">
                Ready to get started?
              </p>
            </div>
          )}

          {/* Desktop Collapse Toggle */}
          <button
            type="button"
            onClick={toggleCollapsed}
            className="hidden md:block text-zinc-400 hover:text-white shrink-0 p-1 rounded-md hover:bg-zinc-700 transition-colors"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <LuPanelLeftOpen size={20} />
            ) : (
              <LuPanelLeftClose size={20} />
            )}
          </button>

          {/* Mobile Close Button */}
          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="md:hidden text-zinc-400 hover:text-white shrink-0 p-1 rounded-md hover:bg-zinc-700 transition-colors"
              aria-label="Close sidebar"
            >
              <LuX size={20} />
            </button>
          )}
        </div>

        {/* Search Trigger */}
        <div className="px-3 mt-4 mb-2">
          <button
            type="button"
            onClick={() => {
              document.getElementById("searchModal")?.showModal();
              handleNavClick();
            }}
            className={`relative flex items-center rounded-md bg-zinc-700 hover:bg-zinc-900 text-sm text-zinc-400 transition-colors duration-200 w-full pl-9 pr-4 py-2 text-left ${
              collapsed
                ? "md:w-10 md:h-10 md:justify-center md:mx-auto md:p-0"
                : ""
            }`}
          >
            <IoSearch
              className={`text-zinc-400 text-lg shrink-0 ${
                collapsed ? "absolute left-3 md:static" : "absolute left-3"
              }`}
            />
            {showLabels && <span>Search notes...</span>}
          </button>
        </div>

        {/* Main Nav Items */}
        <div className="px-3 py-2 flex-1 space-y-1 overflow-y-auto">
          <NavLink
            to="/notes"
            onClick={handleNavClick}
            className={getLinkClass}
            title="My Notes"
          >
            <PiNotebookLight size={20} className="shrink-0" />
            {showLabels && (
              <span className="text-sm flex-1 truncate">My Notes</span>
            )}
          </NavLink>

          <NavLink
            to="/todos"
            onClick={handleNavClick}
            className={getLinkClass}
            title="My To-do"
          >
            <LuListTodo size={20} className="shrink-0" />
            {showLabels && (
              <span className="text-sm flex-1 truncate">My To-do</span>
            )}
          </NavLink>

          <NavLink
            to="/journals"
            onClick={handleNavClick}
            className={getLinkClass}
            title="My Journals"
          >
            <LuPencilLine size={20} className="shrink-0" />
            {showLabels && (
              <span className="text-sm flex-1 truncate">My Journals</span>
            )}
          </NavLink>

          <NavLink
            to="/trash"
            onClick={handleNavClick}
            className={getLinkClass}
            title="Trash"
          >
            <LuTrash2 size={20} className="shrink-0" />
            {showLabels && (
              <span className="text-sm flex-1 truncate">Trash</span>
            )}
          </NavLink>

          {/* FOLDERS SECTION */}
          <div className="px-3 py-2">
            {showLabels && (
              <div className="flex items-center justify-between text-zinc-400 font-medium text-xs">
                <button
                  type="button"
                  onClick={toggleFoldersOpen}
                  className="flex items-center gap-1.5 hover:text-white transition-colors py-1"
                >
                  <GoChevronDown
                    size={14}
                    className={`transition-transform duration-200 ${
                      isFoldersOpen ? "rotate-0" : "-rotate-90"
                    }`}
                  />
                  <span>FOLDERS</span>
                </button>
                <button
                  type="button"
                  onClick={handleOpenCreateFolderModal}
                  className="p-1 rounded hover:bg-zinc-900/50 hover:text-white transition-colors"
                  title="New folder"
                >
                  <GoPlus size={14} />
                </button>
              </div>
            )}

            <div
              className={`grid transition-[grid-template-rows] duration-200 ease-in-out ${
                isFoldersOpen || collapsed
                  ? "grid-rows-[1fr] opacity-100"
                  : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <ul className="mt-2 space-y-1">
                  {folders.map((folder) => {
                    const id = folder.id || folder._id;
                    return (
                      <li
                        key={id}
                        onContextMenu={(e) =>
                          handleContextMenu(e, folder, "folder")
                        }
                      >
                        <NavLink
                          to={`/folders/${id}`}
                          onClick={handleNavClick}
                          className={getItemLinkClass}
                          title={folder.name}
                        >
                          <LuFolder
                            size={15}
                            className="shrink-0"
                            style={{
                              color:
                                getFolderColor(folder.id || folder._id) ||
                                folder.color ||
                                folder.folderColor ||
                                "#3b82f6",
                            }}
                          />
                          {showLabels && (
                            <span className="truncate flex-1 text-zinc-400 text-xs">
                              {folder.name}
                            </span>
                          )}
                        </NavLink>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </div>

          {/* TAGS SECTION */}
          <div className="px-3 py-2">
            {showLabels && (
              <div className="flex items-center justify-between text-zinc-400 font-medium text-xs">
                <button
                  type="button"
                  onClick={toggleTagsOpen}
                  className="flex items-center gap-1.5 hover:text-white transition-colors py-1"
                >
                  <GoChevronDown
                    size={14}
                    className={`transition-transform duration-200 ${
                      isTagsOpen ? "rotate-0" : "-rotate-90"
                    }`}
                  />
                  <span>TAGS</span>
                </button>
                <button
                  type="button"
                  onClick={handleOpenCreateTagModal}
                  className="p-1 rounded hover:bg-zinc-900/50 hover:text-white transition-colors"
                  title="New tag"
                >
                  <GoPlus size={14} />
                </button>
              </div>
            )}

            <div
              className={`grid transition-[grid-template-rows] duration-200 ease-in-out ${
                isTagsOpen || collapsed
                  ? "grid-rows-[1fr] opacity-100"
                  : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <ul className="mt-2 space-y-1">
                  {tags.map((t) => {
                    const id = t.id || t._id;
                    const label =
                      t.tag || t.tagName || t.name || "Untitled Tag";

                    return (
                      <li
                        key={id}
                        onContextMenu={(e) => handleContextMenu(e, t, "tag")}
                      >
                        <NavLink
                          to={`/tags/${id}`}
                          onClick={handleNavClick}
                          className={getItemLinkClass}
                          title={label}
                        >
                          <LuTag
                            size={13}
                            className="shrink-0"
                            style={{
                              color: getTagColor(id) || t.color || "#3b82f6",
                            }}
                          />
                          {showLabels && (
                            <span className="truncate flex-1 text-zinc-400 text-xs">
                              {label}
                            </span>
                          )}
                        </NavLink>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </div>

          {/* Admin Link */}
          {user?.role === "ADMIN" && (
            <NavLink
              to="/admin"
              onClick={handleNavClick}
              className={getLinkClass}
              title="Admin"
            >
              <RiShieldUserLine size={20} className="shrink-0" />
              {showLabels && (
                <span className="text-sm flex-1 truncate">Admin</span>
              )}
            </NavLink>
          )}
        </div>

        {/* User Footer with Dynamic Avatar */}
        <div className="p-3 border-t border-zinc-700">
          <Link
            to="/settings"
            onClick={handleNavClick}
            className={`flex items-center gap-3 rounded-md hover:bg-zinc-800/60 transition-colors text-zinc-200 ${
              collapsed ? "md:justify-center md:p-2 p-2" : "p-2"
            }`}
            title="Settings"
          >
            <div className="w-8 h-8 rounded-full bg-zinc-700 border border-zinc-600 text-zinc-200 flex items-center justify-center text-xs font-semibold shrink-0 overflow-hidden">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user?.name || "User Avatar"}
                  className="w-full h-full object-cover"
                />
              ) : (
                user?.name?.[0]?.toUpperCase() || "U"
              )}
            </div>

            {showLabels && (
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
                  className={`text-zinc-400 shrink-0 hover:rotate-90 duration-200 hover:text-white`}
                />
              </>
            )}
          </Link>
        </div>
      </nav>

      {/* Shared Context Menu */}
      {contextMenu && (
        <div
          className="fixed z-50 w-40 bg-zinc-800 border border-zinc-700 rounded-md shadow-lg py-1 text-sm"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={handleContextEdit}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-zinc-200 hover:bg-zinc-700 text-left"
          >
            <LuPencil size={13} /> Edit
          </button>
          <button
            type="button"
            onClick={handleContextDelete}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-red-400 hover:bg-zinc-700 text-left"
          >
            <LuTrash2 size={13} /> Delete
          </button>
        </div>
      )}

      {/* Folder Modals */}
      <FolderModal
        isOpen={isFolderModalOpen}
        onClose={() => setIsFolderModalOpen(false)}
        onFolderCreated={fetchFolders}
        onFolderUpdated={fetchFolders}
        folder={editingFolder}
      />

      <DeleteFolderModal
        isOpen={Boolean(deletingFolder)}
        folder={deletingFolder}
        onClose={() => setDeletingFolder(null)}
        onConfirm={handleConfirmFolderDelete}
      />

      {/* Tag Modal */}
      <TagModal
        isOpen={isTagModalOpen}
        onClose={() => setIsTagModalOpen(false)}
        onTagChanged={fetchTagsList}
        tag={editingTag}
      />
    </>
  );
}
