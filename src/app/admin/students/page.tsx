"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Search, X, ChevronDown } from "lucide-react";

import { useFinance } from "@/lib/finance-context";
import { ActionDialog } from "@/components/action-dialog";
import {
  formatGBP,
  getAvailableActions,
  STATE_BADGE_CLASS,
} from "@/lib/finance";
import type {
  FinanceState,
  PaymentMethod,
  StudentRecord,
} from "@/types/finance";

const PAYMENT_METHODS: PaymentMethod[] = [
  "Stripe Full",
  "Stripe Instalments",
  "Premium Credit",
  "Bank Transfer",
];

const ACCESS_OPTIONS: StudentRecord["access"][] = ["Starter", "Core", "Full"];

export default function StudentsPage() {
  const { students } = useFinance();

  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState<PaymentMethod | "All">("All");
  const [stateFilter, setStateFilter] = useState<FinanceState | "All">("All");
  const [accessFilter, setAccessFilter] = useState<StudentRecord["access"] | "All">("All");
  const [sortDesc, setSortDesc] = useState(true);

  const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(null);
  const [actionStudent, setActionStudent] = useState<StudentRecord | null>(null);
  const [activeAction, setActiveAction] = useState<string | null>(null);

  const allStates = useMemo(
    () => Array.from(new Set(students.map((s) => s.state))).sort(),
    [students],
  );

  const filtered = useMemo(() => {
    let result = [...students];
    const q = search.trim().toLowerCase();

    if (q) {
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          s.id.toLowerCase().includes(q),
      );
    }
    if (methodFilter !== "All") {
      result = result.filter((s) => s.method === methodFilter);
    }
    if (stateFilter !== "All") {
      result = result.filter((s) => s.state === stateFilter);
    }
    if (accessFilter !== "All") {
      result = result.filter((s) => s.access === accessFilter);
    }

    return result.sort((a, b) => {
      const aDate = new Date(a.lastUpdated).getTime();
      const bDate = new Date(b.lastUpdated).getTime();
      return sortDesc ? bDate - aDate : aDate - bDate;
    });
  }, [students, search, methodFilter, stateFilter, accessFilter, sortDesc]);

  const openAction = (student: StudentRecord, action: string) => {
    setActionStudent(student);
    setActiveAction(action);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Student Directory</h1>
        <p className="mt-1 text-sm text-slate-500">
          Search and manage all students. Click a row to view details or use quick actions.
        </p>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-5">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, or ID..."
              className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-3 text-sm transition-colors focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value as PaymentMethod | "All")}
            className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 transition-colors focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          >
            <option value="All">All methods</option>
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value as FinanceState | "All")}
            className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 transition-colors focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          >
            <option value="All">All states</option>
            {allStates.map((s) => (
              <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
            ))}
          </select>
          <select
            value={accessFilter}
            onChange={(e) => setAccessFilter(e.target.value as StudentRecord["access"] | "All")}
            className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 transition-colors focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          >
            <option value="All">All packages</option>
            {ACCESS_OPTIONS.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </div>
        <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
          <span>{filtered.length} student{filtered.length !== 1 ? "s" : ""} found</span>
          {(search || methodFilter !== "All" || stateFilter !== "All" || accessFilter !== "All") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setMethodFilter("All");
                setStateFilter("All");
                setAccessFilter("All");
              }}
              className="font-medium text-indigo-600 hover:text-indigo-700"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50">
            <tr>
              <th className="px-4 py-3 font-medium text-slate-600">Student</th>
              <th className="px-4 py-3 font-medium text-slate-600">Method</th>
              <th className="px-4 py-3 font-medium text-slate-600">State</th>
              <th className="px-4 py-3 font-medium text-slate-600">Package</th>
              <th className="px-4 py-3 font-medium text-slate-600">Paid / Due</th>
              <th className="px-4 py-3 font-medium text-slate-600">
                <button
                  type="button"
                  className="flex items-center gap-1 font-medium hover:text-slate-900"
                  onClick={() => setSortDesc((p) => !p)}
                >
                  Last Updated
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform ${!sortDesc ? "rotate-180" : ""}`}
                  />
                </button>
              </th>
              <th className="px-4 py-3 font-medium text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence mode="popLayout">
              {filtered.map((student) => {
                const actions = getAvailableActions(student.state);
                return (
                  <motion.tr
                    key={student.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="border-t border-slate-50 align-top transition-colors hover:bg-slate-50/50 cursor-pointer"
                    onClick={() => setSelectedStudent(student)}
                  >
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-slate-900">{student.name}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{student.email}</p>
                      <p className="text-[11px] text-slate-400">{student.id}</p>
                    </td>
                    <td className="px-4 py-3.5 text-slate-700">{student.method}</td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${STATE_BADGE_CLASS[student.state]}`}
                      >
                        {student.state.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-700">{student.access}</td>
                    <td className="px-4 py-3.5 text-slate-700">
                      {formatGBP(student.totalPaid)}{" "}
                      <span className="text-slate-400">/</span>{" "}
                      {formatGBP(student.totalDue)}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500">
                      {new Date(student.lastUpdated).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                      <div className="flex flex-wrap gap-1.5">
                        {actions.length > 0 ? (
                          <button
                            type="button"
                            className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-slate-800"
                            onClick={() => openAction(student, actions[0])}
                          >
                            {actions[0]}
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">No actions</span>
                        )}
                        {actions.length > 1 && (
                          <button
                            type="button"
                            className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
                            onClick={() => openAction(student, actions[1])}
                          >
                            {actions[1]}
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-sm text-slate-500">
            No students match the current filters.
          </div>
        )}
      </div>

      {/* Student Detail Slide-over */}
      <AnimatePresence>
        {selectedStudent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm"
            onClick={() => setSelectedStudent(null)}
          >
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 top-0 h-full w-full max-w-md border-l border-slate-200 bg-white shadow-xl"
            >
              <div className="flex h-full flex-col">
                {/* Panel header */}
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      {selectedStudent.name}
                    </h3>
                    <p className="text-sm text-slate-500">{selectedStudent.id}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedStudent(null)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Panel body */}
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="space-y-5">
                    {/* State badge */}
                    <div>
                      <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
                        Current State
                      </p>
                      <span
                        className={`inline-block rounded-full px-3 py-1.5 text-xs font-semibold ${STATE_BADGE_CLASS[selectedStudent.state]}`}
                      >
                        {selectedStudent.state.replace(/_/g, " ")}
                      </span>
                    </div>

                    {/* Details grid */}
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { label: "Email", value: selectedStudent.email },
                        { label: "Payment Method", value: selectedStudent.method },
                        { label: "Package", value: selectedStudent.access },
                        { label: "Modules Accessed", value: selectedStudent.modulesAccessed.toString() },
                        { label: "Enrolment Date", value: selectedStudent.enrolmentDate },
                        {
                          label: "Last Updated",
                          value: new Date(selectedStudent.lastUpdated).toLocaleDateString("en-GB"),
                        },
                      ].map((item) => (
                        <div key={item.label}>
                          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                            {item.label}
                          </p>
                          <p className="mt-0.5 text-sm text-slate-900">{item.value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Financial summary */}
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Financial Summary
                      </p>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Total Paid</span>
                          <span className="font-medium text-slate-900">
                            {formatGBP(selectedStudent.totalPaid)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Total Due</span>
                          <span className="font-medium text-slate-900">
                            {formatGBP(selectedStudent.totalDue)}
                          </span>
                        </div>
                        <div className="border-t border-slate-200 pt-2">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium text-slate-700">Outstanding</span>
                            <span
                              className={`font-semibold ${
                                selectedStudent.totalDue - selectedStudent.totalPaid > 0
                                  ? "text-red-600"
                                  : "text-emerald-600"
                              }`}
                            >
                              {formatGBP(
                                Math.max(0, selectedStudent.totalDue - selectedStudent.totalPaid),
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                      {/* Progress bar */}
                      <div className="mt-3">
                        <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                          <div
                            className="h-full rounded-full bg-indigo-500 transition-all"
                            style={{
                              width: `${Math.min(100, (selectedStudent.totalPaid / selectedStudent.totalDue) * 100)}%`,
                            }}
                          />
                        </div>
                        <p className="mt-1 text-[11px] text-slate-400">
                          {Math.round((selectedStudent.totalPaid / selectedStudent.totalDue) * 100)}% collected
                        </p>
                      </div>
                    </div>

                    {/* Available Actions */}
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Available Actions
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {getAvailableActions(selectedStudent.state).length === 0 ? (
                          <p className="text-xs text-slate-400">
                            No actions available for current state.
                          </p>
                        ) : (
                          getAvailableActions(selectedStudent.state).map((action) => (
                            <button
                              key={action}
                              type="button"
                              onClick={() => {
                                setSelectedStudent(null);
                                openAction(selectedStudent, action);
                              }}
                              className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:border-slate-300"
                            >
                              {action}
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Dialog */}
      <AnimatePresence>
        {activeAction && actionStudent && (
          <ActionDialog
            student={actionStudent}
            action={activeAction}
            onClose={() => {
              setActiveAction(null);
              setActionStudent(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
