"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeftRight, Clock } from "lucide-react";

import { useFinance } from "@/lib/finance-context";
import { ActionDialog } from "@/components/action-dialog";
import {
  filterByQueue,
  formatGBP,
  daysSince,
  STATE_BADGE_CLASS,
} from "@/lib/finance";
import type { StudentRecord } from "@/types/finance";

export default function BankMatchPage() {
  const { students } = useFinance();
  const [actionStudent, setActionStudent] = useState<StudentRecord | null>(null);
  const [activeAction, setActiveAction] = useState<string | null>(null);

  const queueStudents = useMemo(
    () =>
      filterByQueue(students, "bank-match").sort(
        (a, b) =>
          new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime(),
      ),
    [students],
  );

  const totalExpected = useMemo(
    () => queueStudents.reduce((sum, s) => sum + s.totalDue, 0),
    [queueStudents],
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100">
          <ArrowLeftRight className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Bank Match</h1>
          <p className="mt-1 text-sm text-slate-500">
            Match incoming bank deposits to student accounts. Verify the received amount
            and confirm to complete the payment.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
            Pending Matches
          </p>
          <p className="mt-2 text-2xl font-bold text-blue-700">
            {queueStudents.length}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Total Expected
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {formatGBP(totalExpected)}
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

      {/* Queue table */}
      {queueStudents.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white py-16 text-center shadow-sm">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
            <Clock className="h-5 w-5 text-emerald-600" />
          </div>
          <p className="text-sm font-medium text-slate-700">Queue is clear</p>
          <p className="mt-1 text-xs text-slate-500">
            No bank deposits awaiting matching.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50">
              <tr>
                <th className="px-4 py-3 font-medium text-slate-600">Student</th>
                <th className="px-4 py-3 font-medium text-slate-600">State</th>
                <th className="px-4 py-3 font-medium text-slate-600">Expected Amount</th>
                <th className="px-4 py-3 font-medium text-slate-600">Paid So Far</th>
                <th className="px-4 py-3 font-medium text-slate-600">Waiting Since</th>
                <th className="px-4 py-3 font-medium text-slate-600">Action</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="popLayout">
                {queueStudents.map((student) => (
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
                      {formatGBP(student.totalDue)}
                    </td>
                    <td className="px-4 py-3.5 text-slate-700">
                      {formatGBP(student.totalPaid)}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500">
                      {daysSince(student.lastUpdated)} day
                      {daysSince(student.lastUpdated) !== 1 ? "s" : ""}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setActionStudent(student);
                            setActiveAction("Confirm Bank Deposit");
                          }}
                          className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700"
                        >
                          Match Deposit
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActionStudent(student);
                            setActiveAction("Cancel Account");
                          }}
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
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
