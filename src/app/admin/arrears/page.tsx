"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AlertTriangle, Clock } from "lucide-react";

import { useFinance } from "@/lib/finance-context";
import { ActionDialog } from "@/components/action-dialog";
import {
  filterByQueue,
  formatGBP,
  daysSince,
  STATE_BADGE_CLASS,
} from "@/lib/finance";
import type { StudentRecord } from "@/types/finance";

export default function ArrearsPage() {
  const { students } = useFinance();
  const [actionStudent, setActionStudent] = useState<StudentRecord | null>(null);
  const [activeAction, setActiveAction] = useState<string | null>(null);

  const queueStudents = useMemo(
    () =>
      filterByQueue(students, "arrears").sort((a, b) => {
        // Delinquent first, then by outstanding amount descending
        if (a.state === "Delinquent" && b.state !== "Delinquent") return -1;
        if (a.state !== "Delinquent" && b.state === "Delinquent") return 1;
        const aOut = a.totalDue - a.totalPaid;
        const bOut = b.totalDue - b.totalPaid;
        return bOut - aOut;
      }),
    [students],
  );

  const totalOutstanding = useMemo(
    () =>
      queueStudents.reduce(
        (sum, s) => sum + Math.max(0, s.totalDue - s.totalPaid),
        0,
      ),
    [queueStudents],
  );

  const delinquentCount = useMemo(
    () => queueStudents.filter((s) => s.state === "Delinquent").length,
    [queueStudents],
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-100">
          <AlertTriangle className="h-6 w-6 text-red-600" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Arrears</h1>
          <p className="mt-1 text-sm text-slate-500">
            Students with missed or overdue payments. Delinquent cases are shown first
            and require immediate attention.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-red-100 bg-red-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-red-600">
            Total Outstanding
          </p>
          <p className="mt-2 text-2xl font-bold text-red-700">
            {formatGBP(totalOutstanding)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Students in Arrears
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {queueStudents.length}
          </p>
        </div>
        <div className="rounded-xl border border-red-100 bg-red-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-red-600">
            Delinquent
          </p>
          <p className="mt-2 text-2xl font-bold text-red-700">
            {delinquentCount}
          </p>
        </div>
      </div>

      {/* Queue */}
      {queueStudents.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white py-16 text-center shadow-sm">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
            <Clock className="h-5 w-5 text-emerald-600" />
          </div>
          <p className="text-sm font-medium text-slate-700">No arrears</p>
          <p className="mt-1 text-xs text-slate-500">
            All students are up to date with payments.
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
                <th className="px-4 py-3 font-medium text-slate-600">Days Overdue</th>
                <th className="px-4 py-3 font-medium text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="popLayout">
                {queueStudents.map((student) => {
                  const outstanding = Math.max(0, student.totalDue - student.totalPaid);
                  const isDelinquent = student.state === "Delinquent";

                  return (
                    <motion.tr
                      key={student.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, x: -20 }}
                      className={`border-t align-top ${
                        isDelinquent
                          ? "border-red-100 bg-red-50/30"
                          : "border-slate-50"
                      }`}
                    >
                      <td className="px-4 py-3.5">
                        <p className="font-medium text-slate-900">
                          {student.name}
                          {isDelinquent && (
                            <span className="ml-2 inline-block rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-red-700">
                              Urgent
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
                          <button
                            type="button"
                            onClick={() => {
                              setActionStudent(student);
                              setActiveAction("Payment Received");
                            }}
                            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-emerald-700"
                          >
                            Payment Received
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setActionStudent(student);
                              setActiveAction("Escalate to Collections");
                            }}
                            className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                          >
                            Escalate
                          </button>
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
