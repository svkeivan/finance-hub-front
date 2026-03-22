"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "motion/react";

import { MOCK_STUDENTS } from "@/data/mockStudents";
import {
  filterByQueue,
  getNextStateForAction,
  NEEDS_CANCELLATION_REASON,
  STATE_ACCESS_LEVEL,
} from "@/lib/finance";
import type {
  CancellationReasonCode,
  FinanceActionLog,
  FinanceState,
  QueueKey,
  StudentRecord,
} from "@/types/finance";
import type { SettlementStatusValue } from "@/lib/finance";

type ToastMessage = { type: "success" | "error"; text: string };

type ApplyActionParams = {
  studentId: string;
  action: string;
  reason: string;
  reference?: string;
  receivedAmount?: number;
  cancellationReasonCode?: CancellationReasonCode;
  cancellationReason?: string;
  cancellationFeeAdjusted?: number;
  cancellationFeeAdjustReason?: string;
  settlementStatus?: SettlementStatusValue;
  settlementAmount?: number;
  stripePaymentLink?: string;
  refundAmount?: number;
  collectionAmount?: number;
};

type FinanceContextValue = {
  students: StudentRecord[];
  logs: FinanceActionLog[];
  queueCounts: Record<QueueKey, number>;
  toast: ToastMessage | null;
  notify: (msg: ToastMessage) => void;
  applyAction: (params: ApplyActionParams) => boolean;
};

const FinanceContext = createContext<FinanceContextValue | null>(null);

const QUEUE_KEYS: QueueKey[] = [
  "all",
  "bank-match",
  "finance-sync",
  "arrears",
  "refunds",
  "collections",
];

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [students, setStudents] = useState<StudentRecord[]>(MOCK_STUDENTS);
  const [logs, setLogs] = useState<FinanceActionLog[]>([]);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const notify = useCallback((msg: ToastMessage) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }, []);

  const queueCounts = useMemo(() => {
    const counts = {} as Record<QueueKey, number>;
    for (const key of QUEUE_KEYS) {
      counts[key] = filterByQueue(students, key).length;
    }
    return counts;
  }, [students]);

  const applyAction = useCallback(
    (params: ApplyActionParams) => {
      const {
        studentId,
        action,
        reason,
        reference,
        receivedAmount,
        cancellationReasonCode,
        cancellationReason,
        cancellationFeeAdjusted,
        cancellationFeeAdjustReason,
        settlementStatus,
        settlementAmount,
        stripePaymentLink,
        refundAmount,
        collectionAmount,
      } = params;

      const student = students.find((s) => s.id === studentId);
      if (!student) return false;

      const nextState = getNextStateForAction(
        action,
        student.state,
        student.cancellationSourceState,
      );
      const updatedAt = new Date().toISOString();

      const isCancellationEntry = NEEDS_CANCELLATION_REASON.includes(action);

      setStudents((prev) =>
        prev.map((row) => {
          if (row.id !== studentId) return row;

          const updated: StudentRecord = {
            ...row,
            state: nextState,
            access: STATE_ACCESS_LEVEL[nextState],
            lastUpdated: updatedAt,
          };

          /* Track source state + cancellation reason for cancellation requests */
          if (isCancellationEntry) {
            updated.cancellationSourceState = row.state;
            updated.cancellationReasonCode = cancellationReasonCode;
            updated.cancellationReason =
              cancellationReason?.trim() || undefined;
          }

          /* CS notes from Assess & Resolve / Initiate Refund / Initiate Collection */
          if (
            nextState === "Refund_Pending" ||
            nextState === "Collection_Pending"
          ) {
            const n = reason.trim();
            updated.submissionNotes = n || undefined;
          }

          /* Store fee adjustments */
          if (cancellationFeeAdjusted != null) {
            updated.cancellationFeeAdjusted = cancellationFeeAdjusted;
            updated.cancellationFeeAdjustReason =
              cancellationFeeAdjustReason || undefined;
          }

          /* Update totalPaid when receiving payments */
          if (
            (action === "Mark as Paid" ||
              action === "Payment Received" ||
              action === "Final Payment") &&
            receivedAmount != null
          ) {
            updated.totalPaid = row.totalPaid + receivedAmount;
          }

          /* Increment paidInstalments for instalment-based payment actions */
          if (
            (action === "Payment Received" || action === "Final Payment") &&
            row.totalInstalments != null &&
            row.paidInstalments != null
          ) {
            updated.paidInstalments = row.paidInstalments + 1;
          }

          /* Store reference code */
          if (reference) {
            updated.referenceCode = reference;
          }

          /* Store Stripe payment link for Collection_Pending */
          if (stripePaymentLink) {
            updated.stripePaymentLink = stripePaymentLink;
          }

          /* Store refund amount on entry to Refund_Processing */
          if (
            action === "Proceed to Processing" &&
            row.state === "Refund_Pending" &&
            refundAmount != null
          ) {
            updated.refundAmount = refundAmount;
          }

          /* Store collection amount on entry to Collection_Processing */
          if (
            action === "Proceed to Processing" &&
            row.state === "Collection_Pending" &&
            collectionAmount != null
          ) {
            updated.collectionAmount = collectionAmount;
          }

          /* Settlement status + amount for Mark Settled */
          if (action === "Mark Settled") {
            if (settlementStatus) {
              (updated as Record<string, unknown>).settlementStatus =
                settlementStatus;
            }
            if (settlementAmount != null) {
              updated.settlementAmount = settlementAmount;
            }
          }

          return updated;
        }),
      );

      setLogs((prev) => [
        {
          at: updatedAt,
          studentId,
          fromState: student.state,
          toState: nextState,
          action,
          reason,
          reference: reference || undefined,
        },
        ...prev,
      ]);

      return true;
    },
    [students],
  );

  const value = useMemo(
    () => ({ students, logs, queueCounts, toast, notify, applyAction }),
    [students, logs, queueCounts, toast, notify, applyAction],
  );

  return (
    <FinanceContext.Provider value={value}>
      {children}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 16, opacity: 0 }}
            className={`fixed bottom-5 right-5 z-100 max-w-sm rounded-xl px-5 py-3.5 text-sm font-medium text-white shadow-lg ${
              toast.type === "success" ? "bg-emerald-600" : "bg-red-600"
            }`}
          >
            {toast.text}
          </motion.div>
        )}
      </AnimatePresence>
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error("useFinance must be used within FinanceProvider");
  return ctx;
}
