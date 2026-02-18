"use client";

import { useMemo } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Eye, Clock } from "lucide-react";

import { useFinance } from "@/lib/finance-context";
import {
  filterByQueue,
  formatGBP,
  daysSince,
  STATE_BADGE_CLASS,
  STATE_ID,
} from "@/lib/finance";

export default function FinanceSyncPage() {
  const { students } = useFinance();

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

  const stateCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of queueStudents) {
      counts[s.state] = (counts[s.state] || 0) + 1;
    }
    return counts;
  }, [queueStudents]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-100">
          <Eye className="h-6 w-6 text-purple-600" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Credit Pipeline
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Read-only monitoring view for Premium Credit applications. All
            transitions are managed by the 3rd party API — no manual actions
            available here.
          </p>
        </div>
      </div>

      {/* Read-only banner */}
      <div className="rounded-lg border border-purple-200 bg-purple-50 px-4 py-3">
        <p className="text-xs font-medium text-purple-800">
          This is a monitoring view. Credit state transitions are automated via
          3rd party API callbacks, Stripe webhooks, and system timeouts.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <div className="rounded-xl border border-purple-100 bg-purple-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-purple-600">
            Total
          </p>
          <p className="mt-2 text-2xl font-bold text-purple-700">
            {queueStudents.length}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            App Pending
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {stateCounts["Credit_Application_Pending"] || 0}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Awaiting Decision
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {stateCounts["Credit_Pending"] || 0}
          </p>
        </div>
        <div className="rounded-xl border border-green-100 bg-green-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-green-600">
            Approved
          </p>
          <p className="mt-2 text-2xl font-bold text-green-700">
            {stateCounts["Credit_Approved"] || 0}
          </p>
        </div>
        <div className="rounded-xl border border-orange-100 bg-orange-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-orange-600">
            Rejected
          </p>
          <p className="mt-2 text-2xl font-bold text-orange-700">
            {stateCounts["Credit_Rejected"] || 0}
          </p>
        </div>
      </div>

      {/* Pipeline value */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Pipeline Value
        </p>
        <p className="mt-1 text-2xl font-bold text-slate-900">
          {formatGBP(totalDue)}
        </p>
      </div>

      {/* Student cards — read only */}
      {queueStudents.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white py-16 text-center shadow-sm">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
            <Clock className="h-5 w-5 text-emerald-600" />
          </div>
          <p className="text-sm font-medium text-slate-700">
            No credit applications in pipeline
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {queueStudents.map((student) => (
              <motion.div
                key={student.id}
                layout
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {student.name}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {student.email} &middot; {student.id} &middot;{" "}
                      {STATE_ID[student.state]}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATE_BADGE_CLASS[student.state]}`}
                  >
                    {student.state.replace(/_/g, " ")}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-4 gap-3 text-sm">
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
                      Deposit Paid
                    </p>
                    <p className="mt-0.5 font-medium text-slate-700">
                      {formatGBP(student.totalPaid)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-slate-400">
                      Method
                    </p>
                    <p className="mt-0.5 font-medium text-slate-700">
                      {student.method}
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
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
