"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { PriorStepSubmissionCallout } from "@/components/action-dialog";
import { useFinance } from "@/lib/finance-context";
import { formatGBP, STATE_BADGE_CLASS } from "@/lib/finance";

export default function StudentProfilePage() {
  const params = useParams();
  const { students } = useFinance();
  const id = params.id as string;
  const student = students.find((s) => s.id === id);

  if (!student) {
    return (
      <div className="space-y-6">
        <Link
          href="/admin/students"
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Work Items
        </Link>
        <p className="text-slate-500">Student not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href="/admin/students"
        className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Work Items
      </Link>

      <div>
        <h1 className="text-2xl font-semibold text-slate-900">{student.name}</h1>
        <p className="mt-1 text-sm text-slate-500">{student.id}</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="space-y-6">
          <div>
            <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
              Current State
            </p>
            <span
              className={`inline-block rounded-full px-3 py-1.5 text-xs font-semibold ${STATE_BADGE_CLASS[student.state]}`}
            >
              {student.state.replace(/_/g, " ")}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Email", value: student.email },
              { label: "Payment Method", value: student.method },
              { label: "Access Level", value: student.access.replace(/_/g, " ") },
              { label: "Modules Accessed", value: student.modulesAccessed.toString() },
              { label: "Enrolment Date", value: student.enrolmentDate },
              {
                label: "Last Updated",
                value: new Date(student.lastUpdated).toLocaleDateString("en-GB"),
              },
            ].map((item) => (
              <div key={item.label}>
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                  {item.label}
                </p>
                <p className="mt-0.5 text-sm text-slate-900">{item.value}</p>
              </div>
            ))}
          </div>

          {(student.state === "Refund_Pending" ||
            student.state === "Collection_Pending") &&
            (student.submissionNotes || student.cancellationReason) && (
              <div className="mb-4">
                <PriorStepSubmissionCallout
                  student={student}
                  tone={
                    student.state === "Collection_Pending" ? "red" : "violet"
                  }
                />
              </div>
            )}

          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Financial Summary
            </p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Total Paid</span>
                <span className="font-medium text-slate-900">
                  {formatGBP(student.totalPaid)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Total Due</span>
                <span className="font-medium text-slate-900">
                  {formatGBP(student.totalDue)}
                </span>
              </div>
              <div className="border-t border-slate-200 pt-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-slate-700">Outstanding</span>
                  <span
                    className={`font-semibold ${
                      student.totalDue - student.totalPaid > 0
                        ? "text-red-600"
                        : "text-emerald-600"
                    }`}
                  >
                    {formatGBP(
                      Math.max(0, student.totalDue - student.totalPaid)
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
