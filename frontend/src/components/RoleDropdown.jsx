import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { LuChevronDown } from "react-icons/lu";

const ROLES = ["USER", "ADMIN"];

export default function RoleDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  const toggleDropdown = () => {
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      // Align dropdown to the right edge of the button
      const dropdownWidth = 112; // w-28 = 7rem = 112px
      setCoords({
        top: rect.bottom + window.scrollY + 4,
        left: rect.right + window.scrollX - dropdownWidth,
      });
    }
    setOpen((prev) => !prev);
  };

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e) => {
      if (
        buttonRef.current &&
        !buttonRef.current.contains(e.target) &&
        menuRef.current &&
        !menuRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };

    const handleScrollOrResize = () => setOpen(false);

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [open]);

  const handleSelect = (role) => {
    onChange(role);
    setOpen(false);
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggleDropdown}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
          value === "ADMIN"
            ? "bg-zinc-100 text-zinc-900 border-zinc-100"
            : "bg-zinc-800 text-zinc-300 border-zinc-700 hover:border-zinc-600"
        }`}
      >
        {value}
        <LuChevronDown
          size={12}
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            style={{ top: coords.top, left: coords.left }}
            className="fixed z-[9999] w-28 rounded-md bg-zinc-800 border border-zinc-700 shadow-xl overflow-hidden"
          >
            {ROLES.map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => handleSelect(role)}
                className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                  role === value
                    ? "bg-zinc-700 text-white font-medium"
                    : "text-zinc-300 hover:bg-zinc-700/60"
                }`}
              >
                {role}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </>
  );
}
