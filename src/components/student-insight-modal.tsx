"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect } from "react";
import {
  X,
  ExternalLink,
  GraduationCap,
  CreditCard,
  TrendingUp,
} from "lucide-react";

import { formatGBP, STATE_BADGE_CLASS, daysSince } from "@/lib/finance";
import type { StudentRecord } from "@/types/finance";

type StudentInsightModalProps = {
  student: StudentRecord | null;
  onClose: () => void;
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getPaymentHealth(student: StudentRecord) {
  const paidRatio = student.totalDue > 0 ? student.totalPaid / student.totalDue : 0;
  if (paidRatio >= 1) return { label: "Fully Paid", color: "text-emerald-600", bg: "bg-emerald-50" };
  if (paidRatio >= 0.5) return { label: "On Track", color: "text-blue-600", bg: "bg-blue-50" };
  if (paidRatio > 0) return { label: "Partial", color: "text-amber-600", bg: "bg-amber-50" };
  return { label: "No Payment", color: "text-red-600", bg: "bg-red-50" };
}

export function StudentInsightModal({ student, onClose }: StudentInsightModalProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  if (!student) return null;

  const outstanding = Math.max(0, student.totalDue - student.totalPaid);
  const paidPercent = student.totalDue > 0
    ? Math.round((student.totalPaid / student.totalDue) * 100)
    : 0;
  const health = getPaymentHealth(student);
  const enrolledDays = daysSince(student.enrolmentDate);

  return (
    <AnimatePresence>
      {student && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 8 }}
            transition={{ type: "spring", duration: 0.35, bounce: 0.1 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-5 pt-5 pb-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
                {getInitials(student.name)}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-semibold text-slate-900">
                  {student.name}
                </h3>
                <p className="truncate text-xs text-slate-500">{student.email}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* State + Health */}
            <div className="flex items-center gap-2 px-5 pb-4">
              <span
                className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATE_BADGE_CLASS[student.state]}`}
              >
                {student.state.replace(/_/g, " ")}
              </span>
              <span
                className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${health.bg} ${health.color}`}
              >
                {health.label}
              </span>
            </div>

            {/* Summary Cards */}
            <div className="space-y-px border-t border-slate-100">
              {/* Financial */}
              <div className="px-5 py-3">
                <div className="mb-2 flex items-center gap-1.5">
                  <CreditCard className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Financials
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-[11px] text-slate-500">Paid</p>
                    <p className="text-sm font-semibold text-slate-900">
                      {formatGBP(student.totalPaid)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-500">Due</p>
                    <p className="text-sm font-semibold text-slate-900">
                      {formatGBP(student.totalDue)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-500">Outstanding</p>
                    <p
                      className={`text-sm font-semibold ${
                        outstanding > 0 ? "text-red-600" : "text-emerald-600"
                      }`}
                    >
                      {formatGBP(outstanding)}
                    </p>
                  </div>
                </div>
                {/* Mini progress */}
                <div className="mt-2">
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <motion.div
                      className="h-full rounded-full bg-indigo-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, paidPercent)}%` }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                    />
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
                    <span>{paidPercent}% collected</span>
                    <span>{student.method}</span>
                  </div>
                </div>
              </div>

              {/* Academic */}
              <div className="border-t border-slate-50 px-5 py-3">
                <div className="mb-2 flex items-center gap-1.5">
                  <GraduationCap className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Academic
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-[11px] text-slate-500">Modules</p>
                    <p className="text-sm font-semibold text-slate-900">
                      {student.modulesAccessed}
                      <span className="font-normal text-slate-400">/12</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-500">Access</p>
                    <p className="text-sm font-semibold text-slate-900">
                      {student.access.replace(/_/g, " ")}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-500">Enrolled</p>
                    <p className="text-sm font-semibold text-slate-900">
                      {enrolledDays}
                      <span className="font-normal text-slate-400">d</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Metrics */}
              <div className="border-t border-slate-50 px-5 py-3">
                <div className="mb-2 flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Key Metrics
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-slate-50 px-3 py-2">
                    <p className="text-[11px] text-slate-500">ID Verification</p>
                    <p className="text-xs font-medium text-slate-700">Verified</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 px-3 py-2">
                    <p className="text-[11px] text-slate-500">Enrolment Agreement</p>
                    <p className="text-xs font-medium text-slate-700">Signed</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-slate-100 px-5 py-3">
              <a
                href={`/student/${student.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:border-slate-300"
              >
                View Full Profile
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
