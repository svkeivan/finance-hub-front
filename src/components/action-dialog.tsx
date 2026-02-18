"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";

import { useFinance } from "@/lib/finance-context";
import {
  calculateRefundRecommendation,
  CANCELLATION_REASON_OPTIONS,
  daysSince,
  DESTRUCTIVE_ACTIONS,
  formatGBP,
  getCalculatorScenarioLabel,
  getPendingPayment,
  NEEDS_CANCELLATION_REASON,
  REVERSAL_ACTIONS,
  SETTLEMENT_OPTIONS,
} from "@/lib/finance";
import type { CancellationReasonCode, StudentRecord } from "@/types/finance";

type ActionDialogProps = {
  student: StudentRecord;
  action: string;
  onClose: () => void;
};

export function ActionDialog({ student, action, onClose }: ActionDialogProps) {
  const { applyAction, notify } = useFinance();
  const [reason, setReason] = useState("");
  const [reference, setReference] = useState(student.referenceCode ?? "");

  /* Cancellation reason: dropdown code + free text for "Other" */
  const [cancellationReasonCode, setCancellationReasonCode] = useState<
    CancellationReasonCode | ""
  >("");
  const [cancellationReasonText, setCancellationReasonText] = useState("");

  /* Settlement */
  const [settlementStatus, setSettlementStatus] = useState("");
  const [settlementAmount, setSettlementAmount] = useState("");

  /* Processing fields */
  const [stripePaymentLink, setStripePaymentLink] = useState("");
  const [amount, setAmount] = useState("");

  /* Cancellation fee adjustment */
  const [feeOverride, setFeeOverride] = useState("");
  const [feeAdjustReason, setFeeAdjustReason] = useState("");

  /* Refund wizard step */
  const [refundStep, setRefundStep] = useState(1);

  const isDestructive = DESTRUCTIVE_ACTIONS.includes(action);
  const isReversal = REVERSAL_ACTIONS.includes(action);
  const needsCancellationReason = NEEDS_CANCELLATION_REASON.includes(action);
  const outstanding = Math.max(0, student.totalDue - student.totalPaid);

  const isRefundInit = action === "Initiate Refund";
  const isPaymentAction =
    action === "Payment Received" || action === "Final Payment";
  const paymentNeedsAmount = action === "Final Payment";
  const refundCalc = useMemo(
    () => (isRefundInit ? calculateRefundRecommendation(student) : null),
    [isRefundInit, student],
  );
  const pendingPayment = useMemo(
    () => (isPaymentAction ? getPendingPayment(student) : null),
    [isPaymentAction, student],
  );

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  /* Pre-populate amounts */
  useEffect(() => {
    if (paymentNeedsAmount && pendingPayment) {
      setAmount(String(pendingPayment.expectedAmount));
    } else if (
      action === "Proceed to Processing" &&
      student.state === "Refund_Pending"
    ) {
      const calc = calculateRefundRecommendation(student);
      setAmount(String(calc.refundableAmount));
    } else if (
      action === "Proceed to Processing" &&
      student.state === "Collection_Pending"
    ) {
      setAmount(String(outstanding));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = useCallback(() => {
    if (!reason.trim()) {
      notify({
        type: "error",
        text: "Notes / reason is required for all state changes.",
      });
      return;
    }

    /* Cancellation reason dropdown required */
    if (needsCancellationReason && !cancellationReasonCode) {
      notify({
        type: "error",
        text: "Cancellation reason code is required.",
      });
      return;
    }
    if (cancellationReasonCode === "CR06" && !cancellationReasonText.trim()) {
      notify({
        type: "error",
        text: 'Free-text reason is mandatory when "Other" is selected.',
      });
      return;
    }

    /* Final Payment: amount required */
    if (paymentNeedsAmount) {
      const numAmt = Number(amount);
      if (!amount.trim() || !Number.isFinite(numAmt) || numAmt <= 0) {
        notify({ type: "error", text: "Valid payment amount is required." });
        return;
      }
    }

    /* Balance_Pending → Payment_Complete: ref code required */
    if (action === "Mark as Paid") {
      if (!reference.trim()) {
        notify({ type: "error", text: "Reference code is required." });
        return;
      }
    }

    /* Proceed to Processing from Refund_Pending: ref code + amount */
    if (
      action === "Proceed to Processing" &&
      student.state === "Refund_Pending"
    ) {
      if (!reference.trim()) {
        notify({ type: "error", text: "Reference code is required." });
        return;
      }
      const numAmt = Number(amount);
      if (!amount.trim() || !Number.isFinite(numAmt) || numAmt < 0) {
        notify({ type: "error", text: "Valid refund amount is required." });
        return;
      }
    }

    /* Proceed to Processing from Collection_Pending: ref code required */
    if (
      action === "Proceed to Processing" &&
      student.state === "Collection_Pending"
    ) {
      if (!reference.trim()) {
        notify({ type: "error", text: "Reference code is required." });
        return;
      }
    }

    /* Mark Settled: settlement status required */
    if (action === "Mark Settled" && !settlementStatus) {
      notify({ type: "error", text: "Settlement status is required." });
      return;
    }

    /* Complete Refund: carry-forward confirmation */
    if (action === "Complete Refund" && !reference.trim()) {
      if (!student.referenceCode) {
        notify({ type: "error", text: "Reference code is required." });
        return;
      }
    }

    /* Fee adjustment reason required when overriding */
    if (feeOverride && !feeAdjustReason.trim()) {
      notify({
        type: "error",
        text: "A reason is required when adjusting the cancellation fee.",
      });
      return;
    }

    const cancellationReasonFull =
      cancellationReasonCode === "CR06"
        ? cancellationReasonText
        : CANCELLATION_REASON_OPTIONS.find(
            (o) => o.code === cancellationReasonCode,
          )?.label || cancellationReasonText;

    const success = applyAction({
      studentId: student.id,
      action,
      reason,
      reference: reference || student.referenceCode || undefined,
      cancellationReasonCode: cancellationReasonCode || undefined,
      cancellationReason: cancellationReasonFull || undefined,
      cancellationFeeAdjusted: feeOverride ? Number(feeOverride) : undefined,
      cancellationFeeAdjustReason: feeAdjustReason || undefined,
      settlementStatus:
        (settlementStatus as "settled" | "unsettled" | "n/a") || undefined,
      settlementAmount: settlementAmount ? Number(settlementAmount) : undefined,
      stripePaymentLink: stripePaymentLink || undefined,
      refundAmount: amount ? Number(amount) : undefined,
      collectionAmount: amount ? Number(amount) : undefined,
      receivedAmount:
        action === "Mark as Paid"
          ? outstanding
          : action === "Payment Received" && pendingPayment
            ? pendingPayment.expectedAmount
            : paymentNeedsAmount && amount
              ? Number(amount)
              : undefined,
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
    amount,
    cancellationReasonCode,
    cancellationReasonText,
    settlementStatus,
    settlementAmount,
    stripePaymentLink,
    feeOverride,
    feeAdjustReason,
    outstanding,
    needsCancellationReason,
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
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-100 bg-white px-6 py-4">
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
          {/* ─── Payment Received / Final Payment: instalment context + amount ─── */}
          {isPaymentAction && pendingPayment && (
            <div className="space-y-3">
              {/* Pending payment banner */}
              <div
                className={`rounded-xl border p-4 ${
                  pendingPayment.isFinal
                    ? "border-emerald-200 bg-emerald-50/50"
                    : "border-amber-200 bg-amber-50/50"
                }`}
              >
                <p
                  className={`text-[11px] font-semibold uppercase tracking-wide ${
                    pendingPayment.isFinal
                      ? "text-emerald-600"
                      : "text-amber-600"
                  }`}
                >
                  {pendingPayment.isFinal
                    ? "Final Payment"
                    : "Pending Payment"}
                </p>
                <p className="mt-1 text-lg font-bold text-slate-900">
                  {pendingPayment.label}
                </p>
                <p className="mt-0.5 text-sm text-slate-600">
                  Expected: {formatGBP(pendingPayment.expectedAmount)}
                </p>
              </div>

              {/* Instalment progress (if instalment-based) */}
              {pendingPayment.isInstalment &&
                student.totalInstalments != null && (
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
                      <span>Instalment Progress</span>
                      <span>
                        {student.paidInstalments ?? 0} of{" "}
                        {student.totalInstalments} paid
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div className="mb-3 flex gap-0.5">
                      {Array.from({ length: student.totalInstalments }).map(
                        (_, i) => (
                          <div
                            key={i}
                            className={`h-2.5 flex-1 rounded-sm ${
                              i < (student.paidInstalments ?? 0)
                                ? "bg-emerald-500"
                                : i === (student.paidInstalments ?? 0)
                                  ? "animate-pulse bg-amber-400"
                                  : "bg-slate-200"
                            }`}
                            title={
                              i < (student.paidInstalments ?? 0)
                                ? `Instalment ${i + 1}: Paid`
                                : i === (student.paidInstalments ?? 0)
                                  ? `Instalment ${i + 1}: Pending`
                                  : `Instalment ${i + 1}: Upcoming`
                            }
                          />
                        ),
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div>
                        <p className="text-[11px] text-slate-500">
                          Per Instalment
                        </p>
                        <p className="font-semibold text-slate-900">
                          {formatGBP(student.instalmentAmount ?? 0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] text-slate-500">
                          Deposit Paid
                        </p>
                        <p className="font-semibold text-slate-900">
                          {formatGBP(student.depositAmount ?? 0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] text-slate-500">
                          Remaining
                        </p>
                        <p className="font-semibold text-red-600">
                          {student.totalInstalments -
                            (student.paidInstalments ?? 0)}{" "}
                          instalments
                        </p>
                      </div>
                    </div>
                  </div>
                )}

              {/* Financial summary */}
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-[11px] text-slate-500">Total Paid</p>
                    <p className="font-semibold text-slate-900">
                      {formatGBP(student.totalPaid)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-500">Total Due</p>
                    <p className="font-semibold text-slate-900">
                      {formatGBP(student.totalDue)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-500">Outstanding</p>
                    <p
                      className={`font-semibold ${outstanding > 0 ? "text-red-600" : "text-emerald-600"}`}
                    >
                      {formatGBP(outstanding)}
                    </p>
                  </div>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  {student.method} &middot; In state for{" "}
                  {daysSince(student.lastUpdated)}d
                </p>
              </div>

              {/* Amount input — only for Final Payment */}
              {paymentNeedsAmount && (
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">
                    Amount Received <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                      £
                    </span>
                    <input
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder={String(pendingPayment.expectedAmount)}
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-7 pr-3 text-sm transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Pre-filled with expected amount. Adjust if the payment
                    differs.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ─── Financial context for other Payment_Pending & Delinquent actions ─── */}
          {[
            "Resume Payments",
            "Escalate to Collections",
            "Cancel Account",
          ].includes(action) && (
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-[11px] text-slate-500">Paid</p>
                  <p className="font-semibold text-slate-900">
                    {formatGBP(student.totalPaid)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-500">Due</p>
                  <p className="font-semibold text-slate-900">
                    {formatGBP(student.totalDue)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-500">Outstanding</p>
                  <p
                    className={`font-semibold ${outstanding > 0 ? "text-red-600" : "text-emerald-600"}`}
                  >
                    {formatGBP(outstanding)}
                  </p>
                </div>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                In state for {daysSince(student.lastUpdated)}d &middot;{" "}
                {student.method}
              </p>
            </div>
          )}

          {/* ─── Balance_Pending: Mark as Paid ─── */}
          {action === "Mark as Paid" && (
            <div className="space-y-3 rounded-xl border border-blue-100 bg-blue-50/50 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Balance Due</span>
                <span className="font-semibold text-slate-900">
                  {formatGBP(outstanding)}
                </span>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-600">
                  Reference Code <span className="text-red-500">*</span>
                </label>
                <input
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="Auto-populated from customer ref..."
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  Bank transfer reference from the customer. Can be manually
                  updated.
                </p>
              </div>
            </div>
          )}

          {/* ─── Refund_Pending → Refund_Processing: Ref Code + Amount ─── */}
          {action === "Proceed to Processing" &&
            student.state === "Refund_Pending" && (
              <div className="space-y-3 rounded-xl border border-violet-100 bg-violet-50/50 p-4">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-violet-500">
                  Refund Handoff
                </p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Total Paid</span>
                  <span className="font-semibold text-slate-900">
                    {formatGBP(student.totalPaid)}
                  </span>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">
                    Reference Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="Stripe ref or manual ref..."
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm transition-colors focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">
                    Refund Amount <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                      £
                    </span>
                    <input
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="Auto-calculated..."
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-7 pr-3 text-sm transition-colors focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Auto-calculated. Override if needed.
                  </p>
                </div>
              </div>
            )}

          {/* ─── Collection_Pending → Collection_Processing: Ref + Stripe Link + Amount ─── */}
          {action === "Proceed to Processing" &&
            student.state === "Collection_Pending" && (
              <div className="space-y-3 rounded-xl border border-red-100 bg-red-50/50 p-4">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-red-500">
                  Collection Handoff
                </p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Outstanding Debt</span>
                  <span className="font-semibold text-red-700">
                    {formatGBP(outstanding)}
                  </span>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">
                    Reference Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="COL-REF-..."
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm transition-colors focus:border-red-400 focus:ring-2 focus:ring-red-100"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">
                    Stripe Payment Link{" "}
                    <span className="font-normal text-slate-400">
                      (optional)
                    </span>
                  </label>
                  <input
                    value={stripePaymentLink}
                    onChange={(e) => setStripePaymentLink(e.target.value)}
                    placeholder="https://pay.stripe.com/..."
                    type="url"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm transition-colors focus:border-red-400 focus:ring-2 focus:ring-red-100"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">
                    Collection Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                      £
                    </span>
                    <input
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="Auto-calculated..."
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-7 pr-3 text-sm transition-colors focus:border-red-400 focus:ring-2 focus:ring-red-100"
                    />
                  </div>
                </div>
              </div>
            )}

          {/* ─── Mark Settled: Settlement Status (3 values) + Settlement Amount ─── */}
          {action === "Mark Settled" && (
            <div className="space-y-3 rounded-xl border border-red-100 bg-red-50/50 p-4">
              {student.referenceCode && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Reference</span>
                  <span className="font-mono text-xs text-slate-700">
                    {student.referenceCode}
                  </span>
                </div>
              )}
              {student.collectionAmount != null && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Collection Amount</span>
                  <span className="font-semibold text-slate-900">
                    {formatGBP(student.collectionAmount)}
                  </span>
                </div>
              )}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-600">
                  Settlement Status <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-3">
                  {SETTLEMENT_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      className="flex cursor-pointer items-center gap-2 text-xs text-slate-700"
                    >
                      <input
                        type="radio"
                        name="settlementStatus"
                        value={opt.value}
                        checked={settlementStatus === opt.value}
                        onChange={(e) => setSettlementStatus(e.target.value)}
                        className="text-red-600 focus:ring-red-200"
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>
              {settlementStatus === "settled" && (
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">
                    Settlement Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                      £
                    </span>
                    <input
                      value={settlementAmount}
                      onChange={(e) => setSettlementAmount(e.target.value)}
                      placeholder="Amount recovered..."
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-7 pr-3 text-sm transition-colors focus:border-red-400 focus:ring-2 focus:ring-red-100"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── Complete Refund: carry-forward display ─── */}
          {action === "Complete Refund" && (
            <div className="space-y-2 rounded-xl border border-violet-100 bg-violet-50/50 p-4 text-sm">
              {student.referenceCode && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Reference</span>
                  <span className="font-mono text-xs text-slate-700">
                    {student.referenceCode}
                  </span>
                </div>
              )}
              {student.refundAmount != null && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Refund Amount</span>
                  <span className="font-semibold text-violet-700">
                    {formatGBP(student.refundAmount)}
                  </span>
                </div>
              )}
              <p className="text-[11px] text-slate-500">
                Reference and amount carry forward from handoff stage.
              </p>
            </div>
          )}

          {/* ─── Refund Calculator Wizard (Initiate Refund — 4 steps matching doc) ─── */}
          {isRefundInit && refundCalc && (
            <div className="rounded-xl border border-violet-100 bg-violet-50/50 p-4">
              {/* Step indicators */}
              <div className="mb-4 flex items-center gap-1">
                {[
                  { step: 1, label: "Context" },
                  { step: 2, label: "Modules" },
                  { step: 3, label: "Calculator" },
                  { step: 4, label: "Confirm" },
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
                        refundStep >= step
                          ? "text-violet-700"
                          : "text-slate-400"
                      }`}
                    >
                      {label}
                    </span>
                    {step < 4 && (
                      <div
                        className={`h-0.5 w-4 rounded ${
                          refundStep > step ? "bg-violet-600" : "bg-slate-200"
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>

              <AnimatePresence mode="wait">
                {/* Step 1: Student Context + Financial Snapshot */}
                {refundStep === 1 && (
                  <motion.div
                    key="s1"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8 }}
                    className="space-y-3"
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-violet-500">
                      Student Context & Financial Snapshot
                    </p>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Student</span>
                        <span className="font-medium">{student.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Course Package</span>
                        <span className="font-medium">
                          {student.coursePackage}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Package Price</span>
                        <span className="font-medium">
                          {formatGBP(student.coursePackagePrice)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Total Received</span>
                        <span className="font-medium">
                          {formatGBP(student.totalPaid)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Payment Method</span>
                        <span className="font-medium">{student.method}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Outstanding</span>
                        <span
                          className={`font-medium ${outstanding > 0 ? "text-red-600" : "text-emerald-600"}`}
                        >
                          {formatGBP(outstanding)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Enrolment</span>
                        <span className="font-medium">
                          {student.enrolmentDate} (
                          {daysSince(student.enrolmentDate)}d ago)
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Cool-off Period</span>
                        <span className="font-medium">
                          {student.coolOffDays} days
                          {daysSince(student.enrolmentDate) <=
                          student.coolOffDays ? (
                            <span className="ml-1 text-emerald-600">
                              (active)
                            </span>
                          ) : (
                            <span className="ml-1 text-slate-400">
                              (expired)
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Step 2: Module Progress */}
                {refundStep === 2 && (
                  <motion.div
                    key="s2"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8 }}
                    className="space-y-3"
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-violet-500">
                      Module Progress
                    </p>
                    <div className="max-h-48 space-y-1 overflow-y-auto">
                      {student.modules.map((mod, i) => (
                        <div
                          key={mod.name}
                          className={`flex items-center justify-between rounded-lg px-3 py-1.5 text-xs ${
                            mod.entered
                              ? "bg-violet-100 text-violet-800"
                              : "bg-slate-50 text-slate-500"
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span
                              className={`inline-block h-2 w-2 rounded-full ${mod.entered ? "bg-violet-500" : "bg-slate-300"}`}
                            />
                            {mod.name}
                          </span>
                          <span className="font-mono text-[10px]">
                            CWS: {formatGBP(mod.costWeSave)}
                            {!mod.entered && i > 0 && (
                              <span className="ml-1 text-emerald-600">
                                (saveable)
                              </span>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between text-xs text-slate-600">
                      <span>
                        Entered: {student.modules.filter((m) => m.entered).length}{" "}
                        / {student.modules.length}
                      </span>
                      <span>
                        Digital Asset:{" "}
                        {(student.digitalAssetPct * 100).toFixed(0)}%
                      </span>
                    </div>
                  </motion.div>
                )}

                {/* Step 3: Calculator Output */}
                {refundStep === 3 && (
                  <motion.div
                    key="s3"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8 }}
                    className="space-y-3"
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-violet-500">
                      Refund Calculator Result
                    </p>
                    <div
                      className={`rounded-lg px-3 py-2 text-xs font-semibold ${
                        refundCalc.cancellationFeeApplies
                          ? "bg-red-100 text-red-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      Scenario:{" "}
                      {getCalculatorScenarioLabel(refundCalc.scenario)}
                    </div>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Eligible Refund</span>
                        <span className="font-medium">
                          {formatGBP(refundCalc.eligibleRefund)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">
                          Refundable Amount
                        </span>
                        <span className="font-semibold text-violet-700">
                          {formatGBP(refundCalc.refundableAmount)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">
                          Total Received Cap
                        </span>
                        <span className="font-medium">
                          {formatGBP(student.totalPaid)}
                        </span>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {refundCalc.note}
                    </p>

                    {/* Cancellation Fee section */}
                    {refundCalc.cancellationFeeApplies && (
                      <div className="mt-2 space-y-2 border-t border-red-100 pt-3">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium text-red-700">
                            Cancellation Fee
                          </span>
                          <span className="font-semibold text-red-700">
                            {formatGBP(refundCalc.cancellationFee)}
                          </span>
                        </div>
                        <p className="text-[11px] text-red-600">
                          Eligible refund exceeds total received. No refund
                          issued — cancellation fee collection required.
                        </p>
                        <div>
                          <label className="mb-1 block text-[11px] font-medium text-slate-600">
                            Adjust Fee (optional)
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                              £
                            </span>
                            <input
                              value={feeOverride}
                              onChange={(e) => setFeeOverride(e.target.value)}
                              placeholder={String(refundCalc.cancellationFee)}
                              type="number"
                              min="0"
                              step="0.01"
                              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-7 pr-3 text-sm transition-colors focus:border-red-400 focus:ring-2 focus:ring-red-100"
                            />
                          </div>
                        </div>
                        {feeOverride && (
                          <div>
                            <label className="mb-1 block text-[11px] font-medium text-slate-600">
                              Reason for Adjustment{" "}
                              <span className="text-red-500">*</span>
                            </label>
                            <input
                              value={feeAdjustReason}
                              onChange={(e) =>
                                setFeeAdjustReason(e.target.value)
                              }
                              placeholder="Reason for changing the fee..."
                              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm transition-colors focus:border-red-400 focus:ring-2 focus:ring-red-100"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Step 4: Confirmation */}
                {refundStep === 4 && (
                  <motion.div
                    key="s4"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8 }}
                    className="space-y-2"
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-violet-500">
                      Submission Summary
                    </p>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Scenario</span>
                        <span className="font-medium">
                          {getCalculatorScenarioLabel(refundCalc.scenario)}
                        </span>
                      </div>
                      {!refundCalc.cancellationFeeApplies && (
                        <div className="flex justify-between">
                          <span className="text-slate-600">
                            Refund Recommendation
                          </span>
                          <span className="font-semibold text-violet-700">
                            {formatGBP(refundCalc.refundableAmount)}
                          </span>
                        </div>
                      )}
                      {refundCalc.cancellationFeeApplies && (
                        <div className="flex justify-between">
                          <span className="text-slate-600">
                            Cancellation Fee
                          </span>
                          <span className="font-semibold text-red-700">
                            {formatGBP(
                              feeOverride
                                ? Number(feeOverride)
                                : refundCalc.cancellationFee,
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      This will be submitted to Finance for review. CS cannot
                      execute refunds.
                    </p>
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
                {refundStep < 4 && (
                  <button
                    type="button"
                    onClick={() => setRefundStep((s) => Math.min(4, s + 1))}
                    className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-violet-700"
                  >
                    Next Step
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ─── Cancellation Reason: Dropdown + Other free text ─── */}
          {needsCancellationReason && (
            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-600">
                  Cancellation Reason <span className="text-red-500">*</span>
                </label>
                <select
                  value={cancellationReasonCode}
                  onChange={(e) =>
                    setCancellationReasonCode(
                      e.target.value as CancellationReasonCode | "",
                    )
                  }
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm transition-colors focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="">Select a reason...</option>
                  {CANCELLATION_REASON_OPTIONS.map((opt) => (
                    <option key={opt.code} value={opt.code}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              {cancellationReasonCode === "CR06" && (
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">
                    Specify Reason <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={cancellationReasonText}
                    onChange={(e) => setCancellationReasonText(e.target.value)}
                    placeholder="Enter the specific cancellation reason..."
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm transition-colors focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              )}
            </div>
          )}

          {/* ─── Destructive warning ─── */}
          {isDestructive && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-xs font-medium text-red-800">
                This is a destructive action and cannot be easily undone.
              </p>
            </div>
          )}

          {/* ─── Reversal info ─── */}
          {isReversal && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-xs font-medium text-amber-800">
                {action === "Reverse Refund" || action === "Reverse Collection"
                  ? `This will reverse the student back to ${student.cancellationSourceState ? student.cancellationSourceState.replace(/_/g, " ") : "Payment Pending"}.`
                  : "This will reverse the student back to Payment Pending."}{" "}
                Ensure the reason is documented for the audit trail.
              </p>
            </div>
          )}

          {/* ─── Notes / Reason (always) ─── */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-600">
              Notes <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Context, communication log, or reason for this action..."
              rows={3}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm transition-colors focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex justify-end gap-3 border-t border-slate-100 bg-white px-6 py-4">
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
            disabled={isRefundInit && refundStep < 4}
            className={`rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-50 ${
              isDestructive
                ? "bg-red-600 hover:bg-red-700"
                : "bg-slate-900 hover:bg-slate-800"
            }`}
          >
            {isRefundInit ? "Submit to Finance" : "Confirm Action"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
