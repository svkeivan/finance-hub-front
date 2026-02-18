"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Search,
  X,
  ChevronDown,
  Eye,
  MoreVertical,
  Filter,
} from "lucide-react";

import { useFinance } from "@/lib/finance-context";
import { ActionDialog } from "@/components/action-dialog";
import { StudentInsightModal } from "@/components/student-insight-modal";
import {
  formatGBP,
  getAvailableActions,
  STATE_BADGE_CLASS,
} from "@/lib/finance";
import type {
  AccessLevel,
  FinanceState,
  PaymentMethod,
  StudentRecord,
} from "@/types/finance";

const ALL_PAYMENT_METHODS: PaymentMethod[] = [
  "Card Instalments",
  "DD Instalments",
  "DD Pay Full",
  "Bank Transfer",
  "Premium Credit",
];

const ALL_FINANCE_STATES: FinanceState[] = [
  "Active",
  "Payment_Pending",
  "Delinquent",
  "Balance_Pending",
  "Refund_Pending",
  "Refund_Processing",
  "Collection_Pending",
  "Collection_Processing",
  "Payment_Complete",
  "Cancelled",
  "Credit_Application_Pending",
  "Credit_Pending",
  "Credit_Approved",
  "Credit_Rejected",
];

const ACCESS_OPTIONS: AccessLevel[] = [
  "Full",
  "Partial_Back",
  "Partial",
  "Blocked",
];

export default function StudentsPage() {
  const { students } = useFinance();

  const [search, setSearch] = useState("");
  const [selectedMethods, setSelectedMethods] = useState<Set<PaymentMethod>>(
    new Set(),
  );
  const [selectedStates, setSelectedStates] = useState<Set<FinanceState>>(
    new Set(),
  );
  const [accessFilter, setAccessFilter] = useState<AccessLevel | "All">("All");
  const [sortDesc, setSortDesc] = useState(true);

  const [showMethodFilter, setShowMethodFilter] = useState(false);
  const [showStateFilter, setShowStateFilter] = useState(false);
  const methodFilterRef = useRef<HTMLDivElement>(null);
  const stateFilterRef = useRef<HTMLDivElement>(null);

  const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(
    null,
  );
  const [insightStudent, setInsightStudent] = useState<StudentRecord | null>(
    null,
  );
  const [actionStudent, setActionStudent] = useState<StudentRecord | null>(
    null,
  );
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpenDropdownId(null);
      }
      if (
        methodFilterRef.current &&
        !methodFilterRef.current.contains(e.target as Node)
      ) {
        setShowMethodFilter(false);
      }
      if (
        stateFilterRef.current &&
        !stateFilterRef.current.contains(e.target as Node)
      ) {
        setShowStateFilter(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleMethod = (m: PaymentMethod) => {
    setSelectedMethods((prev) => {
      const next = new Set(prev);
      if (next.has(m)) next.delete(m);
      else next.add(m);
      return next;
    });
  };

  const toggleState = (s: FinanceState) => {
    setSelectedStates((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  };

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
    if (selectedMethods.size > 0) {
      result = result.filter((s) => selectedMethods.has(s.method));
    }
    if (selectedStates.size > 0) {
      result = result.filter((s) => selectedStates.has(s.state));
    }
    if (accessFilter !== "All") {
      result = result.filter((s) => s.access === accessFilter);
    }

    return result.sort((a, b) => {
      const aDate = new Date(a.lastUpdated).getTime();
      const bDate = new Date(b.lastUpdated).getTime();
      return sortDesc ? bDate - aDate : aDate - bDate;
    });
  }, [students, search, selectedMethods, selectedStates, accessFilter, sortDesc]);

  const hasFilters =
    search ||
    selectedMethods.size > 0 ||
    selectedStates.size > 0 ||
    accessFilter !== "All";

  const openAction = (student: StudentRecord, action: string) => {
    setActionStudent(student);
    setActiveAction(action);
  };

  /* Count students per state for badge display */
  const stateCountMap = useMemo(() => {
    const map = new Map<FinanceState, number>();
    for (const s of students) {
      map.set(s.state, (map.get(s.state) ?? 0) + 1);
    }
    return map;
  }, [students]);

  const methodCountMap = useMemo(() => {
    const map = new Map<PaymentMethod, number>();
    for (const s of students) {
      map.set(s.method, (map.get(s.method) ?? 0) + 1);
    }
    return map;
  }, [students]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Work Items</h1>
        <p className="mt-1 text-sm text-slate-500">
          Search and manage all work items. Click a row to view details or use
          the actions menu.
        </p>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
          {/* Search */}
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, or ID..."
              className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-3 text-sm transition-colors focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          {/* Payment Method multi-select */}
          <div className="relative" ref={methodFilterRef}>
            <button
              type="button"
              onClick={() => {
                setShowMethodFilter((p) => !p);
                setShowStateFilter(false);
              }}
              className={`flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-sm transition-colors ${
                selectedMethods.size > 0
                  ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                  : "border-slate-200 text-slate-700"
              }`}
            >
              <span className="flex items-center gap-2">
                <Filter className="h-3.5 w-3.5" />
                {selectedMethods.size > 0
                  ? `${selectedMethods.size} method${selectedMethods.size > 1 ? "s" : ""}`
                  : "All methods"}
              </span>
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform ${showMethodFilter ? "rotate-180" : ""}`}
              />
            </button>
            {showMethodFilter && (
              <div className="absolute left-0 z-30 mt-1 w-full min-w-[220px] rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                {ALL_PAYMENT_METHODS.map((m) => {
                  const count = methodCountMap.get(m) ?? 0;
                  return (
                    <label
                      key={m}
                      className="flex cursor-pointer items-center gap-2.5 px-3 py-2 text-xs transition-colors hover:bg-slate-50"
                    >
                      <input
                        type="checkbox"
                        checked={selectedMethods.has(m)}
                        onChange={() => toggleMethod(m)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-200"
                      />
                      <span className="flex-1 text-slate-700">{m}</span>
                      <span className="text-[10px] text-slate-400">
                        {count}
                      </span>
                    </label>
                  );
                })}
                {selectedMethods.size > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedMethods(new Set())}
                    className="mt-1 w-full border-t border-slate-100 px-3 py-2 text-left text-[11px] font-medium text-indigo-600 hover:bg-slate-50"
                  >
                    Clear selection
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Access level */}
          <select
            value={accessFilter}
            onChange={(e) =>
              setAccessFilter(e.target.value as AccessLevel | "All")
            }
            className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 transition-colors focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          >
            <option value="All">All access levels</option>
            {ACCESS_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>

        {/* Finance State multi-select (full width row) */}
        <div className="relative mt-3" ref={stateFilterRef}>
          <button
            type="button"
            onClick={() => {
              setShowStateFilter((p) => !p);
              setShowMethodFilter(false);
            }}
            className={`flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-sm transition-colors ${
              selectedStates.size > 0
                ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                : "border-slate-200 text-slate-700"
            }`}
          >
            <span className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5" />
              {selectedStates.size > 0
                ? `${selectedStates.size} state${selectedStates.size > 1 ? "s" : ""} selected`
                : "All states"}
            </span>
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform ${showStateFilter ? "rotate-180" : ""}`}
            />
          </button>
          {showStateFilter && (
            <div className="absolute left-0 z-30 mt-1 w-full rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
              <div className="grid grid-cols-2 gap-0.5 sm:grid-cols-3 lg:grid-cols-4">
                {ALL_FINANCE_STATES.map((s) => {
                  const count = stateCountMap.get(s) ?? 0;
                  return (
                    <label
                      key={s}
                      className="flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-xs transition-colors hover:bg-slate-50"
                    >
                      <input
                        type="checkbox"
                        checked={selectedStates.has(s)}
                        onChange={() => toggleState(s)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-200"
                      />
                      <span
                        className={`inline-block h-2 w-2 shrink-0 rounded-full ${STATE_BADGE_CLASS[s].split(" ")[0]}`}
                      />
                      <span className="flex-1 truncate text-slate-700">
                        {s.replace(/_/g, " ")}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {count}
                      </span>
                    </label>
                  );
                })}
              </div>
              {selectedStates.size > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedStates(new Set())}
                  className="mt-1 w-full border-t border-slate-100 px-3 py-2 text-left text-[11px] font-medium text-indigo-600 hover:bg-slate-50"
                >
                  Clear selection
                </button>
              )}
            </div>
          )}
        </div>

        {/* Active filter chips */}
        {hasFilters && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-500">
              {filtered.length} student{filtered.length !== 1 ? "s" : ""} found
            </span>

            {Array.from(selectedMethods).map((m) => (
              <span
                key={m}
                className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-medium text-indigo-700"
              >
                {m}
                <button
                  type="button"
                  onClick={() => toggleMethod(m)}
                  className="ml-0.5 rounded-full p-0.5 hover:bg-indigo-100"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            ))}

            {Array.from(selectedStates).map((s) => (
              <span
                key={s}
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATE_BADGE_CLASS[s]}`}
              >
                {s.replace(/_/g, " ")}
                <button
                  type="button"
                  onClick={() => toggleState(s)}
                  className="ml-0.5 rounded-full p-0.5 opacity-60 hover:opacity-100"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            ))}

            {accessFilter !== "All" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                {accessFilter.replace(/_/g, " ")}
                <button
                  type="button"
                  onClick={() => setAccessFilter("All")}
                  className="ml-0.5 rounded-full p-0.5 hover:bg-slate-200"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            )}

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setSelectedMethods(new Set());
                setSelectedStates(new Set());
                setAccessFilter("All");
              }}
              className="text-[11px] font-medium text-indigo-600 hover:text-indigo-700"
            >
              Clear all
            </button>
          </div>
        )}

        {!hasFilters && (
          <div className="mt-3 text-xs text-slate-500">
            {filtered.length} student{filtered.length !== 1 ? "s" : ""} found
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50">
            <tr>
              <th className="px-4 py-3 font-medium text-slate-600">Student</th>
              <th className="px-4 py-3 font-medium text-slate-600">Method</th>
              <th className="px-4 py-3 font-medium text-slate-600">State</th>
              <th className="px-4 py-3 font-medium text-slate-600">Access</th>
              <th className="px-4 py-3 font-medium text-slate-600">
                Paid / Due
              </th>
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
                const actions = getAvailableActions(student.state, student.method);
                return (
                  <motion.tr
                    key={student.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="cursor-pointer border-t border-slate-50 align-top transition-colors hover:bg-slate-50/50"
                    onClick={() => setSelectedStudent(student)}
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex items-start gap-1.5">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-slate-900">
                            {student.name}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {student.email}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {student.id}
                          </p>
                        </div>
                        <button
                          type="button"
                          title="Quick insight"
                          onClick={(e) => {
                            e.stopPropagation();
                            setInsightStudent(student);
                          }}
                          className="mt-0.5 shrink-0 rounded-md p-1 text-slate-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-700">
                      {student.method}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${STATE_BADGE_CLASS[student.state]}`}
                      >
                        {student.state.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-700">
                      {student.access.replace(/_/g, " ")}
                    </td>
                    <td className="px-4 py-3.5 text-slate-700">
                      {formatGBP(student.totalPaid)}{" "}
                      <span className="text-slate-400">/</span>{" "}
                      {formatGBP(student.totalDue)}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500">
                      {new Date(student.lastUpdated).toLocaleDateString(
                        "en-GB",
                        {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        },
                      )}
                    </td>
                    <td
                      className="px-4 py-3.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {actions.length > 0 ? (
                        <div
                          className="relative"
                          ref={
                            openDropdownId === student.id
                              ? dropdownRef
                              : undefined
                          }
                        >
                          <button
                            type="button"
                            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                            onClick={() =>
                              setOpenDropdownId((prev) =>
                                prev === student.id ? null : student.id,
                              )
                            }
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                          {openDropdownId === student.id && (
                            <div className="absolute right-0 z-20 mt-1 min-w-[180px] rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                              {actions.map((action) => (
                                <button
                                  key={action}
                                  type="button"
                                  className="flex w-full items-center px-3 py-2 text-left text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
                                  onClick={() => {
                                    setOpenDropdownId(null);
                                    openAction(student, action);
                                  }}
                                >
                                  {action}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">&mdash;</span>
                      )}
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
                    <p className="text-sm text-slate-500">
                      {selectedStudent.id}
                    </p>
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
                        {
                          label: "Payment Method",
                          value: selectedStudent.method,
                        },
                        {
                          label: "Access Level",
                          value: selectedStudent.access.replace(/_/g, " "),
                        },
                        {
                          label: "Modules Accessed",
                          value:
                            selectedStudent.modulesAccessed.toString(),
                        },
                        {
                          label: "Enrolment Date",
                          value: selectedStudent.enrolmentDate,
                        },
                        {
                          label: "Last Updated",
                          value: new Date(
                            selectedStudent.lastUpdated,
                          ).toLocaleDateString("en-GB"),
                        },
                      ].map((item) => (
                        <div key={item.label}>
                          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                            {item.label}
                          </p>
                          <p className="mt-0.5 text-sm text-slate-900">
                            {item.value}
                          </p>
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
                            <span className="font-medium text-slate-700">
                              Outstanding
                            </span>
                            <span
                              className={`font-semibold ${
                                selectedStudent.totalDue -
                                  selectedStudent.totalPaid >
                                0
                                  ? "text-red-600"
                                  : "text-emerald-600"
                              }`}
                            >
                              {formatGBP(
                                Math.max(
                                  0,
                                  selectedStudent.totalDue -
                                    selectedStudent.totalPaid,
                                ),
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
                          {Math.round(
                            (selectedStudent.totalPaid /
                              selectedStudent.totalDue) *
                              100,
                          )}
                          % collected
                        </p>
                      </div>
                    </div>

                    {/* Available Actions */}
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Available Actions
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {getAvailableActions(selectedStudent.state, selectedStudent.method).length ===
                        0 ? (
                          <p className="text-xs text-slate-400">
                            No actions available for current state.
                          </p>
                        ) : (
                          getAvailableActions(selectedStudent.state, selectedStudent.method).map(
                            (action) => (
                              <button
                                key={action}
                                type="button"
                                onClick={() => {
                                  setSelectedStudent(null);
                                  openAction(selectedStudent, action);
                                }}
                                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
                              >
                                {action}
                              </button>
                            ),
                          )
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

      {/* Student Insight Modal */}
      <StudentInsightModal
        student={insightStudent}
        onClose={() => setInsightStudent(null)}
      />

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
