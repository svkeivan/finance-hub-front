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
  getCalculatorScenarioLabel,
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

  const pendingStudents = useMemo(
    () => queueStudents.filter((s) => s.state === "Refund_Pending"),
    [queueStudents],
  );

  const processingStudents = useMemo(
    () => queueStudents.filter((s) => s.state === "Refund_Processing"),
    [queueStudents],
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
            Two-step refund pipeline: hand off pending refunds to interim/bank,
            then confirm completion. Once in the refund path, it leads only to Cancelled.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-violet-100 bg-violet-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-violet-600">
            Total in Queue
          </p>
          <p className="mt-2 text-2xl font-bold text-violet-700">
            {queueStudents.length}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Awaiting Handoff
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {pendingStudents.length}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Processing
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {processingStudents.length}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Total Paid (Refundable)
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {formatGBP(totalRefundable)}
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
        <div className="space-y-6">
          {/* Refund Pending — awaiting handoff */}
          {pendingStudents.length > 0 && (
            <div>
              <h2 className="mb-3 text-sm font-semibold text-slate-700">
                Awaiting Handoff to Interim / Bank
              </h2>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <AnimatePresence mode="popLayout">
                  {pendingStudents.map((student) => {
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

                        <div className="px-5 py-4">
                          <div className="grid grid-cols-3 gap-3 text-sm">
                            <div>
                              <p className="text-[11px] uppercase tracking-wide text-slate-400">Total Paid</p>
                              <p className="mt-0.5 font-semibold text-slate-900">{formatGBP(student.totalPaid)}</p>
                            </div>
                            <div>
                              <p className="text-[11px] uppercase tracking-wide text-slate-400">Modules</p>
                              <p className="mt-0.5 font-medium text-slate-700">{student.modulesAccessed}</p>
                            </div>
                            <div>
                              <p className="text-[11px] uppercase tracking-wide text-slate-400">Enrolled</p>
                              <p className="mt-0.5 font-medium text-slate-700">{student.enrolmentDate}</p>
                            </div>
                          </div>

                          <div className="mt-4 rounded-lg border border-violet-100 bg-violet-50/50 p-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-violet-600">
                                  Recommended Refund
                                </p>
                                <p className="mt-1 text-lg font-bold text-violet-700">
                                  {formatGBP(recommendation.refundableAmount)}
                                </p>
                              </div>
                              <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-700">
                                {getCalculatorScenarioLabel(recommendation.scenario)}
                              </span>
                            </div>
                            <p className="mt-1.5 text-xs text-violet-600/70">
                              {recommendation.note}
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2 border-t border-slate-100 px-5 py-3">
                          <button
                            type="button"
                            onClick={() => {
                              setActionStudent(student);
                              setActiveAction("Proceed to Processing");
                            }}
                            className="flex-1 rounded-lg bg-violet-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-violet-700"
                          >
                            Proceed to Processing
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Refund Processing — awaiting completion */}
          {processingStudents.length > 0 && (
            <div>
              <h2 className="mb-3 text-sm font-semibold text-slate-700">
                Processing — Awaiting Completion
              </h2>
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-100 bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 font-medium text-slate-600">Student</th>
                      <th className="px-4 py-3 font-medium text-slate-600">State</th>
                      <th className="px-4 py-3 font-medium text-slate-600">Total Paid</th>
                      <th className="px-4 py-3 font-medium text-slate-600">Processing Since</th>
                      <th className="px-4 py-3 font-medium text-slate-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence mode="popLayout">
                      {processingStudents.map((student) => (
                        <motion.tr
                          key={student.id}
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="border-t border-slate-50 align-top"
                        >
                          <td className="px-4 py-3.5">
                            <p className="font-medium text-slate-900">{student.name}</p>
                            <p className="mt-0.5 text-xs text-slate-500">{student.email}</p>
                          </td>
                          <td className="px-4 py-3.5">
                            <span
                              className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${STATE_BADGE_CLASS[student.state]}`}
                            >
                              {student.state.replace(/_/g, " ")}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 font-semibold text-slate-900">
                            {formatGBP(student.totalPaid)}
                          </td>
                          <td className="px-4 py-3.5 text-slate-500">
                            {daysSince(student.lastUpdated)} day{daysSince(student.lastUpdated) !== 1 ? "s" : ""}
                          </td>
                          <td className="px-4 py-3.5">
                            <button
                              type="button"
                              onClick={() => {
                                setActionStudent(student);
                                setActiveAction("Complete Refund");
                              }}
                              className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-violet-700"
                            >
                              Complete Refund
                            </button>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </div>
          )}
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
