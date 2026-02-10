"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { ScrollText, Search, ArrowRight } from "lucide-react";

import { useFinance } from "@/lib/finance-context";
import { STATE_BADGE_CLASS } from "@/lib/finance";
import type { FinanceState } from "@/types/finance";

export default function AuditLogPage() {
  const { logs, students } = useFinance();
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("All");

  const uniqueActions = useMemo(
    () => Array.from(new Set(logs.map((l) => l.action))).sort(),
    [logs],
  );

  const filtered = useMemo(() => {
    let result = [...logs];
    const q = search.trim().toLowerCase();

    if (q) {
      result = result.filter((log) => {
        const student = students.find((s) => s.id === log.studentId);
        return (
          log.studentId.toLowerCase().includes(q) ||
          log.action.toLowerCase().includes(q) ||
          log.reason.toLowerCase().includes(q) ||
          (student && student.name.toLowerCase().includes(q))
        );
      });
    }

    if (actionFilter !== "All") {
      result = result.filter((log) => log.action === actionFilter);
    }

    return result;
  }, [logs, search, actionFilter, students]);

  const getStudentName = (id: string) => {
    const student = students.find((s) => s.id === id);
    return student?.name ?? id;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100">
          <ScrollText className="h-6 w-6 text-slate-600" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Audit Log</h1>
          <p className="mt-1 text-sm text-slate-500">
            Complete record of every state change. Every action includes the operator&apos;s
            reason and optional reference number.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student name, ID, action, or reason..."
            className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm transition-colors focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
        </div>
        {uniqueActions.length > 0 && (
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 transition-colors focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          >
            <option value="All">All actions</option>
            {uniqueActions.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Log entries */}
      {logs.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white py-16 text-center shadow-sm">
          <ScrollText className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm font-medium text-slate-700">No audit records yet</p>
          <p className="mt-1 text-xs text-slate-500">
            Actions performed on student records will appear here as a complete audit
            trail.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white py-16 text-center shadow-sm">
          <p className="text-sm text-slate-500">
            No entries match your search criteria.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-slate-500">
            {filtered.length} entr{filtered.length === 1 ? "y" : "ies"} found
          </p>
          {filtered.map((log, idx) => (
            <motion.div
              key={`${log.studentId}-${log.at}-${log.action}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(idx * 0.03, 0.3) }}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  {/* Action + Student */}
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-semibold text-slate-900">
                      {log.action}
                    </span>
                    <span className="text-slate-400">&middot;</span>
                    <span className="font-medium text-slate-700">
                      {getStudentName(log.studentId)}
                    </span>
                    <span className="text-xs text-slate-400">({log.studentId})</span>
                  </div>

                  {/* State transition */}
                  <div className="mt-2 flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATE_BADGE_CLASS[log.fromState as FinanceState] ?? "bg-slate-100 text-slate-600"}`}
                    >
                      {log.fromState.replace(/_/g, " ")}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATE_BADGE_CLASS[log.toState as FinanceState] ?? "bg-slate-100 text-slate-600"}`}
                    >
                      {log.toState.replace(/_/g, " ")}
                    </span>
                  </div>

                  {/* Reason */}
                  <p className="mt-2 text-xs text-slate-600">
                    <span className="font-medium text-slate-500">Reason:</span>{" "}
                    {log.reason}
                  </p>

                  {/* Reference */}
                  {log.reference && (
                    <p className="mt-1 text-xs text-slate-500">
                      <span className="font-medium">Ref:</span> {log.reference}
                    </p>
                  )}
                </div>

                {/* Timestamp */}
                <div className="shrink-0 text-right">
                  <p className="text-xs font-medium text-slate-700">
                    {new Date(log.at).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                    })}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-400">
                    {new Date(log.at).toLocaleTimeString("en-GB", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
