import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export default function ActionDropdown({ onEdit, onView, onDelete }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open || !btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const menuWidth = 144;
    const menuHeight = 132;
    const top =
      window.innerHeight - rect.bottom < menuHeight
        ? rect.top - menuHeight - 6
        : rect.bottom + 6;
    setPos({
      top: Math.max(8, top),
      left: Math.min(window.innerWidth - menuWidth - 8, rect.right - menuWidth),
    });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (!btnRef.current?.contains(e.target) && !menuRef.current?.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const actions = [
    {
      label: "View",
      icon: (
        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      ),
      onClick: onView,
      color: "text-blue-600 hover:bg-blue-50",
    },
    {
      label: "Edit",
      icon: (
        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      ),
      onClick: onEdit,
      color: "text-yellow-600 hover:bg-yellow-50",
    },
    {
      label: "Delete",
      icon: (
        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14H6L5 6" />
          <path d="M10 11v6M14 11v6" />
          <path d="M9 6V4h6v2" />
        </svg>
      ),
      onClick: onDelete,
      color: "text-red-600 hover:bg-red-50",
    },
  ];

  const run = (callback) => {
    callback?.();
    setOpen(false);
  };

  return (
    <>
      <button
        ref={btnRef}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((p) => !p);
        }}
        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
      >
        <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="5" r="1.5" />
          <circle cx="12" cy="12" r="1.5" />
          <circle cx="12" cy="19" r="1.5" />
        </svg>
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            style={{ position: "fixed", top: pos.top, left: pos.left, zIndex: 9999 }}
            className="w-36 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden py-1"
          >
            {actions.map((action) => (
              <button
                key={action.label}
                onClick={() => run(action.onClick)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors ${action.color}`}
              >
                {action.icon}
                {action.label}
              </button>
            ))}
          </div>,
          document.body
        )}
    </>
  );
}
