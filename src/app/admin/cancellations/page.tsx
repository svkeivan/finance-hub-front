"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Ban,
  BookOpen,
  Calculator,
  ChevronDown,
  ChevronUp,
  Search,
  User,
  Wallet,
} from "lucide-react";

import { useFinance } from "@/lib/finance-context";
import { ActionDialog } from "@/components/action-dialog";
import {
  calculateRefundRecommendation,
  daysSince,
  formatGBP,
  getCalculatorScenarioLabel,
  getCancellationActions,
  isCancellationEligible,
  STATE_BADGE_CLASS,
  STATE_ID,
} from "@/lib/finance";
import type { StudentRecord } from "@/types/finance";

export default function CancellationsPage() {
  const { students } = useFinance();
  const [search, setSearch] = useState("");
  const [actionStudent, setActionStudent] = useState<StudentRecord | null>(
    null,
  );
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const eligibleStudents = useMemo(
    () =>
      students
        .filter((s) => isCancellationEligible(s.state))
        .filter(
          (s) =>
            !search.trim() ||
            s.name.toLowerCase().includes(search.toLowerCase()) ||
            s.id.toLowerCase().includes(search.toLowerCase()) ||
            s.email.toLowerCase().includes(search.toLowerCase()),
        )
        .sort(
          (a, b) =>
            new Date(b.lastUpdated).getTime() -
            new Date(a.lastUpdated).getTime(),
        ),
    [students, search],
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-rose-100">
          <Ban className="h-6 w-6 text-rose-600" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Cancellation Requests
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Initiate refund or collection requests for eligible students.
            Expand a student to see full context, module progress, and refund
            calculator before submitting to Finance.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, ID, or email..."
          className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm transition-colors focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-rose-100 bg-rose-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-rose-600">
            Eligible
          </p>
          <p className="mt-2 text-2xl font-bold text-rose-700">
            {eligibleStudents.length}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Active
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {eligibleStudents.filter((s) => s.state === "Active").length}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Payment Complete
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {
              eligibleStudents.filter((s) => s.state === "Payment_Complete")
                .length
            }
          </p>
        </div>
        <div className="rounded-xl border border-purple-100 bg-purple-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-purple-600">
            Credit States
          </p>
          <p className="mt-2 text-2xl font-bold text-purple-700">
            {
              eligibleStudents.filter((s) => s.state.startsWith("Credit_"))
                .length
            }
          </p>
        </div>
      </div>

      {/* Student list */}
      {eligibleStudents.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white py-16 text-center shadow-sm">
          <p className="text-sm font-medium text-slate-700">
            {search.trim()
              ? "No matching students found."
              : "No eligible students for cancellation requests."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {eligibleStudents.map((student) => {
              const actions = getCancellationActions(student.state);
              const isExpanded = expandedId === student.id;

              return (
                <motion.div
                  key={student.id}
                  layout
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
                >
                  {/* Collapsed summary row */}
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedId(isExpanded ? null : student.id)
                    }
                    className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-slate-50"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3">
                        <p className="truncate font-semibold text-slate-900">
                          {student.name}
                        </p>
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATE_BADGE_CLASS[student.state]}`}
                        >
                          {student.state.replace(/_/g, " ")}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {student.email} &middot; {student.id} &middot;{" "}
                        {STATE_ID[student.state]} &middot; {student.coursePackage}
                      </p>
                    </div>
                    <div className="ml-4 flex items-center gap-3">
                      <span className="text-sm font-semibold text-slate-900">
                        {formatGBP(student.totalPaid)}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-slate-400" />
                      )}
                    </div>
                  </button>

                  {/* Expanded detail view */}
                  <AnimatePresence>
                    {isExpanded && (
                      <StudentCancellationDetail
                        student={student}
                        actions={actions}
                        onAction={(actionName) => {
                          setActionStudent(student);
                          setActiveAction(actionName);
                        }}
                      />
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

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

/* ────────────────────────────────────────────────────
   Detailed Cancellation View (Section 4 of doc)
   ──────────────────────────────────────────────────── */

function StudentCancellationDetail({
  student,
  actions,
  onAction,
}: {
  student: StudentRecord;
  actions: string[];
  onAction: (action: string) => void;
}) {
  const outstanding = Math.max(0, student.totalDue - student.totalPaid);
  const refundCalc = useMemo(
    () => calculateRefundRecommendation(student),
    [student],
  );
  const enteredCount = student.modules.filter((m) => m.entered).length;
  const lastEnteredIdx = student.modules.reduce(
    (max, m, i) => (m.entered ? i : max),
    -1,
  );

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      className="overflow-hidden"
    >
      <div className="space-y-4 border-t border-slate-100 px-5 pb-5 pt-4">
        {/* ─── Section 4.1: Student Context & Progress ─── */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Identity & Status */}
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <User className="h-3.5 w-3.5" />
              Student Context
            </div>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Name</span>
                <span className="font-medium text-slate-900">
                  {student.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Course Package</span>
                <span className="font-medium text-slate-900">
                  {student.coursePackage}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Enrolment</span>
                <span className="font-medium text-slate-900">
                  {student.enrolmentDate} ({daysSince(student.enrolmentDate)}d
                  ago)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Cool-off Period</span>
                <span className="font-medium">
                  {student.coolOffDays}d
                  {daysSince(student.enrolmentDate) <= student.coolOffDays ? (
                    <span className="ml-1 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                      ACTIVE
                    </span>
                  ) : (
                    <span className="ml-1 rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
                      EXPIRED
                    </span>
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Current State</span>
                <span className="font-medium text-slate-900">
                  {student.state.replace(/_/g, " ")}
                </span>
              </div>
            </div>
          </div>

          {/* Section 4.2: Financial Snapshot */}
          <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-blue-600">
              <Wallet className="h-3.5 w-3.5" />
              Financial Snapshot
            </div>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Package Price</span>
                <span className="font-medium text-slate-900">
                  {formatGBP(student.coursePackagePrice)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Received</span>
                <span className="font-semibold text-slate-900">
                  {formatGBP(student.totalPaid)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Method</span>
                <span className="font-medium text-slate-900">
                  {student.method}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Outstanding</span>
                <span
                  className={`font-semibold ${outstanding > 0 ? "text-red-600" : "text-emerald-600"}`}
                >
                  {formatGBP(outstanding)}
                </span>
              </div>
              {student.state.startsWith("Credit_") && (
                <div className="mt-1 rounded bg-amber-50 px-2 py-1 text-[11px] text-amber-700">
                  Credit state — only direct student payments count for refund
                  calculations.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─── Module Progress ─── */}
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <BookOpen className="h-3.5 w-3.5" />
              Module Progress
            </div>
            <span className="text-xs text-slate-500">
              {enteredCount} / {student.modules.length} entered
              {lastEnteredIdx >= 0 && (
                <span className="ml-1 text-slate-400">
                  (last: Module {lastEnteredIdx + 1})
                </span>
              )}
            </span>
          </div>

          {/* Module progress bar */}
          <div className="mb-3 flex gap-0.5">
            {student.modules.map((mod, i) => (
              <div
                key={mod.name}
                className={`h-2 flex-1 rounded-sm ${
                  mod.entered ? "bg-violet-500" : "bg-slate-200"
                }`}
                title={`${mod.name} — ${mod.entered ? "Entered" : "Not entered"} — CWS: ${formatGBP(mod.costWeSave)}`}
              />
            ))}
          </div>

          {/* Module list (compact) */}
          <div className="grid grid-cols-2 gap-1 sm:grid-cols-3 lg:grid-cols-4">
            {student.modules.map((mod) => (
              <div
                key={mod.name}
                className={`flex items-center gap-1.5 rounded px-2 py-1 text-[11px] ${
                  mod.entered
                    ? "bg-violet-100 text-violet-800"
                    : "text-slate-500"
                }`}
              >
                <span
                  className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${mod.entered ? "bg-violet-500" : "bg-slate-300"}`}
                />
                <span className="truncate">{mod.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Section 4.3: Refund Calculator Preview ─── */}
        <div className="rounded-xl border border-violet-100 bg-violet-50/50 p-4">
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-violet-600">
            <Calculator className="h-3.5 w-3.5" />
            Refund Calculator Preview
          </div>

          <div
            className={`mb-3 rounded-lg px-3 py-2 text-xs font-semibold ${
              refundCalc.cancellationFeeApplies
                ? "bg-red-100 text-red-700"
                : refundCalc.refundableAmount > 0
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-slate-200 text-slate-600"
            }`}
          >
            {getCalculatorScenarioLabel(refundCalc.scenario)}
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <div>
              <p className="text-[11px] text-slate-500">Eligible</p>
              <p className="font-semibold text-slate-900">
                {formatGBP(refundCalc.eligibleRefund)}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-slate-500">Refundable</p>
              <p className="font-semibold text-violet-700">
                {formatGBP(refundCalc.refundableAmount)}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-slate-500">Received Cap</p>
              <p className="font-semibold text-slate-900">
                {formatGBP(student.totalPaid)}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-slate-500">Fee</p>
              <p
                className={`font-semibold ${refundCalc.cancellationFeeApplies ? "text-red-700" : "text-slate-400"}`}
              >
                {refundCalc.cancellationFeeApplies
                  ? formatGBP(refundCalc.cancellationFee)
                  : "N/A"}
              </p>
            </div>
          </div>

          <p className="mt-2 text-[11px] text-slate-500">{refundCalc.note}</p>

          {refundCalc.cancellationFeeApplies && (
            <div className="mt-2 rounded border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700">
              Eligible refund exceeds total received. No refund will be issued
              — this results in a cancellation fee collection. Fee can be
              adjusted by CS with reason during submission.
            </div>
          )}
        </div>

        {/* ─── Section 4.4: Agent Actions ─── */}
        <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
          {actions.map((actionName) => (
            <button
              key={actionName}
              type="button"
              onClick={() => onAction(actionName)}
              className={`rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                actionName === "Initiate Refund"
                  ? "bg-violet-600 text-white hover:bg-violet-700"
                  : actionName === "Initiate Collection"
                    ? "bg-red-600 text-white hover:bg-red-700"
                    : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {actionName}
            </button>
          ))}
          <p className="flex items-center text-[11px] text-slate-400">
            Actions submit to Finance for review. CS cannot execute refunds or
            collections.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
