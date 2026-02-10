"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";

import { useFinance } from "@/lib/finance-context";
import { calculateRefundRecommendation, formatGBP } from "@/lib/finance";
import type { StudentRecord } from "@/types/finance";

type ActionDialogProps = {
  student: StudentRecord;
  action: string;
  onClose: () => void;
};

const DESTRUCTIVE_ACTIONS = [
  "Cancel Account",
  "Escalate to Collections",
  "Credit Rejected",
];

export function ActionDialog({ student, action, onClose }: ActionDialogProps) {
  const { applyAction, notify } = useFinance();
  const [reason, setReason] = useState("");
  const [reference, setReference] = useState("");
  const [receivedAmount, setReceivedAmount] = useState("");
  const [confirmMismatch, setConfirmMismatch] = useState(false);
  const [refundStep, setRefundStep] = useState(1);

  const isDestructive = DESTRUCTIVE_ACTIONS.includes(action);
  const refundPreview = calculateRefundRecommendation(student);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const handleSubmit = useCallback(() => {
    if (!reason.trim()) {
      notify({ type: "error", text: "Reason is required for all state changes." });
      return;
    }

    if (action === "Confirm Bank Deposit") {
      if (!receivedAmount.trim()) {
        notify({ type: "error", text: "Received amount is required." });
        return;
      }
      const numeric = Number(receivedAmount);
      if (!Number.isFinite(numeric) || numeric <= 0) {
        notify({ type: "error", text: "Enter a valid positive amount." });
        return;
      }
      if (numeric !== student.totalDue && !confirmMismatch) {
        notify({
          type: "error",
          text: "Amount mismatch — tick the checkbox to confirm.",
        });
        return;
      }
    }

    if (action === "Manual Funding Sync" && !reference.trim()) {
      notify({
        type: "error",
        text: "External reference is mandatory for finance sync.",
      });
      return;
    }

    const success = applyAction({
      studentId: student.id,
      action,
      reason,
      reference: reference || undefined,
      receivedAmount:
        action === "Confirm Bank Deposit" ? Number(receivedAmount) : undefined,
    });

    if (success) {
      notify({
        type: "success",
        text: `${student.name} — "${action}" completed successfully.`,
      });
      onClose();
    }
  }, [
    action,
    student,
    reason,
    reference,
    receivedAmount,
    confirmMismatch,
    applyAction,
    notify,
    onClose,
  ]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        transition={{ type: "spring", duration: 0.3, bounce: 0.1 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{action}</h3>
            <p className="mt-0.5 text-sm text-slate-500">
              {student.name} &middot; {student.id}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 px-6 py-5">
          {/* Bank Deposit */}
          {action === "Confirm Bank Deposit" && (
            <div className="space-y-3 rounded-xl border border-blue-100 bg-blue-50/50 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Expected Amount</span>
                <span className="font-semibold text-slate-900">
                  {formatGBP(student.totalDue)}
                </span>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-600">
                  Amount Received
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                    £
                  </span>
                  <input
                    value={receivedAmount}
                    onChange={(e) => setReceivedAmount(e.target.value)}
                    placeholder="0.00"
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-7 pr-3 text-sm transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>
              {receivedAmount &&
                Number(receivedAmount) > 0 &&
                Number(receivedAmount) !== student.totalDue && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <p className="text-xs font-medium text-amber-800">
                      Amount mismatch — outstanding balance will be{" "}
                      {formatGBP(
                        Math.abs(student.totalDue - Number(receivedAmount)),
                      )}
                      .
                    </p>
                    <label className="mt-2 flex items-center gap-2 text-xs text-amber-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={confirmMismatch}
                        onChange={(e) => setConfirmMismatch(e.target.checked)}
                        className="rounded border-amber-300"
                      />
                      I confirm this mismatch is intentional
                    </label>
                  </div>
                )}
            </div>
          )}

          {/* Finance Sync */}
          {action === "Manual Funding Sync" && (
            <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-4">
              <label className="mb-1.5 block text-xs font-medium text-slate-600">
                External Reference Number{" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="PC-REF-..."
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm transition-colors focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
              />
              <p className="mt-1.5 text-[11px] text-slate-500">
                Enter the Premium Credit reference to complete funding sync.
              </p>
            </div>
          )}

          {/* Refund Wizard */}
          {action === "Initiate Refund" && refundPreview && (
            <div className="rounded-xl border border-violet-100 bg-violet-50/50 p-4">
              {/* Step indicators */}
              <div className="mb-4 flex items-center gap-1">
                {[
                  { step: 1, label: "Data" },
                  { step: 2, label: "Analysis" },
                  { step: 3, label: "Confirm" },
                ].map(({ step, label }) => (
                  <div key={step} className="flex items-center gap-1">
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                        refundStep >= step
                          ? "bg-violet-600 text-white"
                          : "bg-slate-200 text-slate-500"
                      }`}
                    >
                      {step}
                    </div>
                    <span
                      className={`mr-1 text-[11px] font-medium ${
                        refundStep >= step ? "text-violet-700" : "text-slate-400"
                      }`}
                    >
                      {label}
                    </span>
                    {step < 3 && (
                      <div
                        className={`h-0.5 w-5 rounded ${
                          refundStep > step ? "bg-violet-600" : "bg-slate-200"
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>

              <AnimatePresence mode="wait">
                {refundStep === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8 }}
                    className="space-y-2 text-sm"
                  >
                    <div className="flex justify-between">
                      <span className="text-slate-600">Total Paid</span>
                      <span className="font-medium">{formatGBP(student.totalPaid)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Enrolment Date</span>
                      <span className="font-medium">{student.enrolmentDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Modules Accessed</span>
                      <span className="font-medium">{student.modulesAccessed}</span>
                    </div>
                  </motion.div>
                )}

                {refundStep === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8 }}
                    className="space-y-2 text-sm"
                  >
                    <p className="font-medium text-violet-700">
                      Scenario: {refundPreview.scenario}
                    </p>
                    <p className="text-slate-600">{refundPreview.note}</p>
                  </motion.div>
                )}

                {refundStep === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8 }}
                    className="space-y-2 text-sm"
                  >
                    <div className="flex justify-between">
                      <span className="text-slate-600">Recommended Refund</span>
                      <span className="font-semibold text-violet-700">
                        {formatGBP(refundPreview.recommendedRefund)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Max Refundable</span>
                      <span className="font-medium">
                        {formatGBP(refundPreview.maxRefundable)}
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  disabled={refundStep === 1}
                  onClick={() => setRefundStep((s) => Math.max(1, s - 1))}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-white disabled:opacity-40"
                >
                  Back
                </button>
                {refundStep < 3 && (
                  <button
                    type="button"
                    onClick={() => setRefundStep((s) => Math.min(3, s + 1))}
                    className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-violet-700"
                  >
                    Next Step
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Destructive warning */}
          {isDestructive && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-xs font-medium text-red-800">
                This is a destructive action and cannot be easily undone.
              </p>
            </div>
          )}

          {/* Reason field */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-600">
              Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Describe why this action is being taken..."
              rows={3}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm transition-colors focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          {/* Reference (when not finance sync, which has its own) */}
          {action !== "Manual Funding Sync" && (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600">
                Reference{" "}
                <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="External reference number"
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm transition-colors focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={action === "Initiate Refund" && refundStep < 3}
            className={`rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-50 ${
              isDestructive
                ? "bg-red-600 hover:bg-red-700"
                : "bg-slate-900 hover:bg-slate-800"
            }`}
          >
            Confirm Action
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
