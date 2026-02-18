"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ShieldAlert, Clock } from "lucide-react";

import { useFinance } from "@/lib/finance-context";
import { ActionDialog } from "@/components/action-dialog";
import {
  filterByQueue,
  formatGBP,
  daysSince,
  STATE_BADGE_CLASS,
} from "@/lib/finance";
import type { StudentRecord } from "@/types/finance";

export default function CollectionsPage() {
  const { students } = useFinance();
  const [actionStudent, setActionStudent] = useState<StudentRecord | null>(null);
  const [activeAction, setActiveAction] = useState<string | null>(null);

  const queueStudents = useMemo(
    () =>
      filterByQueue(students, "collections").sort((a, b) => {
        if (a.state === "Collection_Pending" && b.state !== "Collection_Pending") return -1;
        if (a.state !== "Collection_Pending" && b.state === "Collection_Pending") return 1;
        return new Date(a.lastUpdated).getTime() - new Date(b.lastUpdated).getTime();
      }),
    [students],
  );

  const pendingStudents = useMemo(
    () => queueStudents.filter((s) => s.state === "Collection_Pending"),
    [queueStudents],
  );

  const processingStudents = useMemo(
    () => queueStudents.filter((s) => s.state === "Collection_Processing"),
    [queueStudents],
  );

  const totalOutstanding = useMemo(
    () =>
      queueStudents.reduce(
        (sum, s) => sum + Math.max(0, s.totalDue - s.totalPaid),
        0,
      ),
    [queueStudents],
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-100">
          <ShieldAlert className="h-6 w-6 text-red-600" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Collections</h1>
          <p className="mt-1 text-sm text-slate-500">
            Two-step collections pipeline: hand off pending cases to agency/interim,
            then mark as settled. Reversals route back to Payment Pending.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-red-100 bg-red-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-red-600">
            Total in Queue
          </p>
          <p className="mt-2 text-2xl font-bold text-red-700">
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
            With Agency
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {processingStudents.length}
          </p>
        </div>
        <div className="rounded-xl border border-red-100 bg-red-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-red-600">
            Total Outstanding
          </p>
          <p className="mt-2 text-2xl font-bold text-red-700">
            {formatGBP(totalOutstanding)}
          </p>
        </div>
      </div>

      {/* Queue */}
      {queueStudents.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white py-16 text-center shadow-sm">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
            <Clock className="h-5 w-5 text-emerald-600" />
          </div>
          <p className="text-sm font-medium text-slate-700">No active collections</p>
          <p className="mt-1 text-xs text-slate-500">
            No students are currently in the collections pipeline.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50">
              <tr>
                <th className="px-4 py-3 font-medium text-slate-600">Student</th>
                <th className="px-4 py-3 font-medium text-slate-600">State</th>
                <th className="px-4 py-3 font-medium text-slate-600">Method</th>
                <th className="px-4 py-3 font-medium text-slate-600">Outstanding</th>
                <th className="px-4 py-3 font-medium text-slate-600">Days in Queue</th>
                <th className="px-4 py-3 font-medium text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="popLayout">
                {queueStudents.map((student) => {
                  const outstanding = Math.max(0, student.totalDue - student.totalPaid);
                  const isPending = student.state === "Collection_Pending";

                  return (
                    <motion.tr
                      key={student.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, x: -20 }}
                      className={`border-t align-top ${
                        isPending
                          ? "border-red-100 bg-red-50/30"
                          : "border-slate-50"
                      }`}
                    >
                      <td className="px-4 py-3.5">
                        <p className="font-medium text-slate-900">
                          {student.name}
                          {isPending && (
                            <span className="ml-2 inline-block rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-red-700">
                              Pending
                            </span>
                          )}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">{student.email}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${STATE_BADGE_CLASS[student.state]}`}
                        >
                          {student.state.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-700">{student.method}</td>
                      <td className="px-4 py-3.5">
                        <span className="font-semibold text-red-600">
                          {formatGBP(outstanding)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-500">
                        {daysSince(student.lastUpdated)}d
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex gap-2">
                          {isPending ? (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setActionStudent(student);
                                  setActiveAction("Proceed to Processing");
                                }}
                                className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-700"
                              >
                                Proceed to Processing
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setActionStudent(student);
                                  setActiveAction("Reverse Collection");
                                }}
                                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
                              >
                                Reverse
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setActionStudent(student);
                                  setActiveAction("Mark Settled");
                                }}
                                className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-700"
                              >
                                Mark Settled
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setActionStudent(student);
                                  setActiveAction("Reverse to Payment Pending");
                                }}
                                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
                              >
                                Reverse
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
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
