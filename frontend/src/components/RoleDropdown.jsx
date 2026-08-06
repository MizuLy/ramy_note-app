import { useState, useRef, useEffect } from "react";
import { LuChevronDown } from "react-icons/lu";

const ROLES = ["USER", "ADMIN"];

export default function RoleDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (role) => {
    onChange(role);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
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

      {open && (
        <div className="absolute z-10 mt-1 w-28 rounded-md bg-zinc-800 border border-zinc-700 shadow-lg overflow-hidden">
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
        </div>
      )}
    </div>
  );
}
