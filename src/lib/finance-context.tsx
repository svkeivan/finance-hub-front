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
import { filterByQueue, getNextStateForAction } from "@/lib/finance";
import type {
  FinanceActionLog,
  QueueKey,
  StudentRecord,
} from "@/types/finance";

type ToastMessage = { type: "success" | "error"; text: string };

type ApplyActionParams = {
  studentId: string;
  action: string;
  reason: string;
  reference?: string;
  receivedAmount?: number;
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
    ({ studentId, action, reason, reference, receivedAmount }: ApplyActionParams) => {
      const student = students.find((s) => s.id === studentId);
      if (!student) return false;

      const nextState = getNextStateForAction(action, student.state);
      const updatedAt = new Date().toISOString();

      setStudents((prev) =>
        prev.map((row) =>
          row.id === studentId
            ? {
                ...row,
                state: nextState,
                lastUpdated: updatedAt,
                totalPaid:
                  action === "Confirm Bank Deposit" && receivedAmount != null
                    ? receivedAmount
                    : row.totalPaid,
              }
            : row,
        ),
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
