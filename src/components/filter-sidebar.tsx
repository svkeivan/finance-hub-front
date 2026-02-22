"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect } from "react";
import { X } from "lucide-react";

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
              <div className="space-y-6">{children}</div>
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
      <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      {children}
    </div>
  );
}

type CheckboxFilterProps<T extends string> = {
  options: { value: T; label: string; count?: number }[];
  selected: Set<T>;
  onChange: (value: T) => void;
  searchable?: boolean;
  searchPlaceholder?: string;
};

export function CheckboxFilter<T extends string>({
  options,
  selected,
  onChange,
  searchable = false,
  searchPlaceholder = "Search...",
}: CheckboxFilterProps<T>) {
  const [query, setQuery] = useFilterSearch();
  const filtered = searchable && query
    ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  return (
    <div className="space-y-1">
      {searchable && (
        <div className="relative mb-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm transition-colors placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100"
          />
        </div>
      )}
      <div className="max-h-52 space-y-0.5 overflow-y-auto">
        {filtered.map((opt) => (
          <label
            key={opt.value}
            className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors hover:bg-slate-50"
          >
            <input
              type="checkbox"
              checked={selected.has(opt.value)}
              onChange={() => onChange(opt.value)}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-200"
            />
            <span className="flex-1 text-slate-700">{opt.label}</span>
            {opt.count != null && (
              <span className="text-xs text-slate-400">{opt.count}</span>
            )}
          </label>
        ))}
        {filtered.length === 0 && (
          <p className="px-2.5 py-3 text-xs text-slate-400">No matches</p>
        )}
      </div>
    </div>
  );
}

type RadioFilterProps<T extends string> = {
  options: { value: T; label: string }[];
  selected: T;
  onChange: (value: T) => void;
};

export function RadioFilter<T extends string>({
  options,
  selected,
  onChange,
}: RadioFilterProps<T>) {
  return (
    <div className="space-y-0.5">
      {options.map((opt) => (
        <label
          key={opt.value}
          className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors hover:bg-slate-50"
        >
          <input
            type="radio"
            name={opt.value}
            checked={selected === opt.value}
            onChange={() => onChange(opt.value)}
            className="border-slate-300 text-indigo-600 focus:ring-indigo-200"
          />
          <span className="text-slate-700">{opt.label}</span>
        </label>
      ))}
    </div>
  );
}

import { useState } from "react";

function useFilterSearch(): [string, (v: string) => void] {
  const [q, setQ] = useState("");
  return [q, setQ];
}
