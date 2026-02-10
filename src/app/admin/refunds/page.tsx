"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { RotateCcw, Clock } from "lucide-react";

import { useFinance } from "@/lib/finance-context";
import { ActionDialog } from "@/components/action-dialog";
import {
  filterByQueue,
  formatGBP,
  calculateRefundRecommendation,
  daysSince,
  STATE_BADGE_CLASS,
} from "@/lib/finance";
import type { StudentRecord } from "@/types/finance";

export default function RefundsPage() {
  const { students } = useFinance();
  const [actionStudent, setActionStudent] = useState<StudentRecord | null>(null);
  const [activeAction, setActiveAction] = useState<string | null>(null);

  const queueStudents = useMemo(
    () =>
      filterByQueue(students, "refunds").sort(
        (a, b) =>
          new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime(),
      ),
    [students],
  );

  const totalRefundable = useMemo(
    () => queueStudents.reduce((sum, s) => sum + s.totalPaid, 0),
    [queueStudents],
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-100">
          <RotateCcw className="h-6 w-6 text-violet-600" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Refunds</h1>
          <p className="mt-1 text-sm text-slate-500">
            Review and approve pending refund requests. Each card shows the calculated
            refund recommendation based on policy rules.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-violet-100 bg-violet-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-violet-600">
            Pending Refunds
          </p>
          <p className="mt-2 text-2xl font-bold text-violet-700">
            {queueStudents.length}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Total Paid (Refundable Pool)
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {formatGBP(totalRefundable)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Oldest Request
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
          <p className="text-sm font-medium text-slate-700">No pending refunds</p>
          <p className="mt-1 text-xs text-slate-500">
            All refund requests have been processed.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <AnimatePresence mode="popLayout">
            {queueStudents.map((student) => {
              const recommendation = calculateRefundRecommendation(student);
              return (
                <motion.div
                  key={student.id}
                  layout
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  className="rounded-xl border border-slate-200 bg-white shadow-sm"
                >
                  {/* Card header */}
                  <div className="border-b border-slate-100 px-5 py-4">
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
                  </div>

                  {/* Card body */}
                  <div className="px-5 py-4">
                    {/* Student details */}
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div>
                        <p className="text-[11px] uppercase tracking-wide text-slate-400">
                          Total Paid
                        </p>
                        <p className="mt-0.5 font-semibold text-slate-900">
                          {formatGBP(student.totalPaid)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] uppercase tracking-wide text-slate-400">
                          Modules
                        </p>
                        <p className="mt-0.5 font-medium text-slate-700">
                          {student.modulesAccessed}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] uppercase tracking-wide text-slate-400">
                          Enrolled
                        </p>
                        <p className="mt-0.5 font-medium text-slate-700">
                          {student.enrolmentDate}
                        </p>
                      </div>
                    </div>

                    {/* Recommendation */}
                    <div className="mt-4 rounded-lg border border-violet-100 bg-violet-50/50 p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-violet-600">
                            Recommended Refund
                          </p>
                          <p className="mt-1 text-lg font-bold text-violet-700">
                            {formatGBP(recommendation.recommendedRefund)}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-700">
                            {recommendation.scenario}
                          </span>
                        </div>
                      </div>
                      <p className="mt-1.5 text-xs text-violet-600/70">
                        {recommendation.note}
                      </p>
                    </div>
                  </div>

                  {/* Card footer */}
                  <div className="flex gap-2 border-t border-slate-100 px-5 py-3">
                    <button
                      type="button"
                      onClick={() => {
                        setActionStudent(student);
                        setActiveAction("Approve Refund");
                      }}
                      className="flex-1 rounded-lg bg-violet-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-violet-700"
                    >
                      Approve Refund
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActionStudent(student);
                        setActiveAction("Reject Refund");
                      }}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
                    >
                      Reject
                    </button>
                  </div>
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
