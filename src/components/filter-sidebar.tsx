"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Search, X } from "lucide-react";

type FilterSidebarProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  activeCount: number;
  onClearAll: () => void;
  children: React.ReactNode;
};

export function FilterSidebar({
  open,
  onClose,
  title = "Advanced Filters",
  description = "Filter by multiple criteria.",
  activeCount,
  onClearAll,
  children,
}: FilterSidebarProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 260 }}
            onClick={(e) => e.stopPropagation()}
            className="absolute right-0 top-0 flex h-full w-full max-w-sm flex-col border-l border-slate-200 bg-white shadow-xl"
          >
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
                <p className="mt-0.5 text-sm text-slate-500">{description}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Filter sections */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="space-y-5">{children}</div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
              <p className="text-xs text-slate-500">
                {activeCount > 0
                  ? `${activeCount} filter${activeCount !== 1 ? "s" : ""} active`
                  : "No filters applied"}
              </p>
              <div className="flex gap-2">
                {activeCount > 0 && (
                  <button
                    type="button"
                    onClick={onClearAll}
                    className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
                  >
                    Clear all
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-slate-800"
                >
                  Apply
                </button>
              </div>
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

type FilterSectionProps = {
  label: string;
  children: React.ReactNode;
};

export function FilterSection({ label, children }: FilterSectionProps) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-slate-700">{label}</p>
      {children}
    </div>
  );
}

type DropdownFilterProps<T extends string> = {
  placeholder: string;
  searchPlaceholder?: string;
  options: { value: T; label: string; count?: number }[];
  selected: Set<T>;
  onChange: (value: T) => void;
};

export function DropdownFilter<T extends string>({
  placeholder,
  searchPlaceholder = "Search...",
  options,
  selected,
  onChange,
}: DropdownFilterProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = query
    ? options.filter((o) =>
        o.label.toLowerCase().includes(query.toLowerCase()),
      )
    : options;

  const triggerLabel =
    selected.size === 0
      ? placeholder
      : selected.size === 1
        ? options.find((o) => selected.has(o.value))?.label ?? placeholder
        : `${selected.size} selected`;

  return (
    <div className="relative" ref={containerRef}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen((p) => !p)}
        className={`flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-sm transition-colors ${
          selected.size > 0
            ? "border-indigo-300 bg-indigo-50/50 text-indigo-700"
            : "border-slate-200 text-slate-500 hover:border-slate-300"
        }`}
      >
        <span className="truncate">{triggerLabel}</span>
        <ChevronDown
          className={`ml-2 h-4 w-4 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div className="absolute left-0 z-10 mt-1.5 w-full rounded-lg border border-slate-200 bg-white shadow-lg">
          {/* Search */}
          <div className="border-b border-slate-100 p-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                autoFocus
                className="w-full rounded-md border-0 bg-slate-50 py-2 pl-8 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>

          {/* Options */}
          <div className="max-h-52 overflow-y-auto py-1">
            {filtered.map((opt) => (
              <label
                key={opt.value}
                className="flex cursor-pointer items-center gap-2.5 px-3 py-2 text-sm transition-colors hover:bg-slate-50"
              >
                <input
                  type="checkbox"
                  checked={selected.has(opt.value)}
                  onChange={() => onChange(opt.value)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-200"
                />
                <span className="flex-1 truncate text-slate-700">
                  {opt.label}
                </span>
                {opt.count != null && (
                  <span className="text-xs text-slate-400">{opt.count}</span>
                )}
              </label>
            ))}
            {filtered.length === 0 && (
              <p className="px-3 py-4 text-center text-xs text-slate-400">
                No matches found
              </p>
            )}
          </div>

          {/* Clear inside dropdown */}
          {selected.size > 0 && (
            <div className="border-t border-slate-100 px-3 py-2">
              <button
                type="button"
                onClick={() => {
                  for (const v of Array.from(selected)) onChange(v);
                }}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
              >
                Clear selection
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
