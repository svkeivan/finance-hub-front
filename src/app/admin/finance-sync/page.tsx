"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { RefreshCw, Clock } from "lucide-react";

import { useFinance } from "@/lib/finance-context";
import { ActionDialog } from "@/components/action-dialog";
import {
  filterByQueue,
  formatGBP,
  daysSince,
  STATE_BADGE_CLASS,
} from "@/lib/finance";
import type { StudentRecord } from "@/types/finance";

export default function FinanceSyncPage() {
  const { students } = useFinance();
  const [actionStudent, setActionStudent] = useState<StudentRecord | null>(null);
  const [activeAction, setActiveAction] = useState<string | null>(null);

  const queueStudents = useMemo(
    () =>
      filterByQueue(students, "finance-sync").sort(
        (a, b) =>
          new Date(a.lastUpdated).getTime() - new Date(b.lastUpdated).getTime(),
      ),
    [students],
  );

  const totalDue = useMemo(
    () => queueStudents.reduce((sum, s) => sum + s.totalDue, 0),
    [queueStudents],
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-100">
          <RefreshCw className="h-6 w-6 text-amber-600" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Finance Sync</h1>
          <p className="mt-1 text-sm text-slate-500">
            Resolve Premium Credit applications that are waiting for funding confirmation.
            Each sync requires an external reference number from Premium Credit.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">
            Pending Sync
          </p>
          <p className="mt-2 text-2xl font-bold text-amber-700">
            {queueStudents.length}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Total Value
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {formatGBP(totalDue)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Oldest Pending
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {queueStudents.length > 0
              ? `${Math.max(...queueStudents.map((s) => daysSince(s.lastUpdated)))} days`
              : "—"}
          </p>
        </div>
      </div>

      {/* Queue */}
      {queueStudents.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white py-16 text-center shadow-sm">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
            <Clock className="h-5 w-5 text-emerald-600" />
          </div>
          <p className="text-sm font-medium text-slate-700">All synced</p>
          <p className="mt-1 text-xs text-slate-500">
            No Premium Credit applications need attention.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <AnimatePresence mode="popLayout">
            {queueStudents.map((student) => (
              <motion.div
                key={student.id}
                layout
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">{student.name}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {student.email} &middot; {student.id}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATE_BADGE_CLASS[student.state]}`}
                  >
                    {student.state.replace(/_/g, " ")}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-slate-400">
                      Due
                    </p>
                    <p className="mt-0.5 font-semibold text-slate-900">
                      {formatGBP(student.totalDue)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-slate-400">
                      Paid
                    </p>
                    <p className="mt-0.5 font-medium text-slate-700">
                      {formatGBP(student.totalPaid)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-slate-400">
                      Waiting
                    </p>
                    <p className="mt-0.5 font-medium text-slate-700">
                      {daysSince(student.lastUpdated)}d
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActionStudent(student);
                      setActiveAction("Manual Funding Sync");
                    }}
                    className="flex-1 rounded-lg bg-amber-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-amber-700"
                  >
                    Sync Funding
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActionStudent(student);
                      setActiveAction("Credit Rejected");
                    }}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
                  >
                    Reject
                  </button>
                </div>
              </motion.div>
            ))}
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
