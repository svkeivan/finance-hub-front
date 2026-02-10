import type { FinanceState, QueueKey, StudentRecord } from "@/types/finance";

export const QUEUE_CONFIG: Record<
  QueueKey,
  { label: string; targetStates: FinanceState[] }
> = {
  all: {
    label: "All",
    targetStates: [],
  },
  "bank-match": {
    label: "Bank Match",
    targetStates: ["Balance_Pending"],
  },
  "finance-sync": {
    label: "Finance Sync",
    targetStates: ["Credit_Pending"],
  },
  arrears: {
    label: "Arrears",
    targetStates: ["Payment_Pending", "Delinquent"],
  },
  refunds: {
    label: "Refunds",
    targetStates: ["Refund_Pending"],
  },
};

export const STATE_BADGE_CLASS: Record<FinanceState, string> = {
  Lead: "bg-slate-100 text-slate-700",
  Pending_Details: "bg-slate-100 text-slate-700",
  Quote_Sent: "bg-slate-100 text-slate-700",
  Application_Started: "bg-slate-100 text-slate-700",
  Application_Review: "bg-slate-100 text-slate-700",
  Credit_Pending: "bg-amber-100 text-amber-800",
  Balance_Pending: "bg-zinc-200 text-zinc-800",
  Payment_Pending: "bg-amber-100 text-amber-800",
  Payment_Complete: "bg-emerald-100 text-emerald-800",
  Active: "bg-emerald-100 text-emerald-800",
  Refund_Pending: "bg-zinc-200 text-zinc-800",
  Delinquent: "bg-red-100 text-red-800",
  Collection_Pending: "bg-red-100 text-red-800",
  Cancelled: "bg-red-100 text-red-800",
};

const ACTION_MAP: Record<FinanceState, string[]> = {
  Lead: [],
  Pending_Details: [],
  Quote_Sent: [],
  Application_Started: [],
  Application_Review: [],
  Payment_Complete: [],
  Collection_Pending: ["Payment Received"],
  Cancelled: [],
  Active: ["Missed Payment", "Initiate Refund"],
  Balance_Pending: ["Confirm Bank Deposit", "Cancel Account"],
  Credit_Pending: ["Manual Funding Sync", "Credit Rejected"],
  Delinquent: ["Payment Received", "Escalate to Collections"],
  Payment_Pending: ["Payment Received", "Escalate to Collections"],
  Refund_Pending: ["Approve Refund", "Reject Refund"],
};

export const getAvailableActions = (state: FinanceState): string[] =>
  ACTION_MAP[state] ?? [];

export const getNextStateForAction = (
  action: string,
  current: FinanceState,
): FinanceState => {
  const map: Record<string, FinanceState> = {
    "Missed Payment": "Payment_Pending",
    "Initiate Refund": "Refund_Pending",
    "Confirm Bank Deposit": "Payment_Complete",
    "Manual Funding Sync": "Payment_Complete",
    "Credit Rejected": "Cancelled",
    "Payment Received": "Payment_Complete",
    "Escalate to Collections": "Collection_Pending",
    "Approve Refund": "Cancelled",
    "Reject Refund": current,
    "Cancel Account": "Cancelled",
  };

  return map[action] ?? current;
};

export const filterByQueue = (students: StudentRecord[], queue: QueueKey) => {
  const targetStates = QUEUE_CONFIG[queue].targetStates;
  if (queue === "all") return students;
  return students.filter((student) => targetStates.includes(student.state));
};

export const formatGBP = (value: number): string =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 2,
  }).format(value);

export const daysSince = (isoDate: string): number => {
  const then = new Date(isoDate).getTime();
  const now = Date.now();
  return Math.max(0, Math.floor((now - then) / (1000 * 60 * 60 * 24)));
};

export const calculateRefundRecommendation = (student: StudentRecord) => {
  const days = daysSince(student.enrolmentDate);
  const maxRefundable = student.totalPaid;

  if (days < 14) {
    return {
      scenario: "Cool-off",
      recommendedRefund: maxRefundable,
      note: "Within 14 days of enrolment.",
      maxRefundable,
    };
  }

  if (student.modulesAccessed === 0) {
    const digitalAssetFee = Math.min(maxRefundable, 99);
    const recommendedRefund = Math.max(0, maxRefundable - digitalAssetFee);
    return {
      scenario: "Digital Asset Fee",
      recommendedRefund,
      note: `No modules accessed. ${formatGBP(digitalAssetFee)} retained as digital asset fee.`,
      maxRefundable,
    };
  }

  const usedRatio = Math.min(1, student.modulesAccessed / 12);
  const retainedAmount = Math.round(maxRefundable * usedRatio);
  const recommendedRefund = Math.max(0, maxRefundable - retainedAmount);
  return {
    scenario: "Cost-We-Save",
    recommendedRefund,
    note: `Modules accessed: ${student.modulesAccessed}.`,
    maxRefundable,
  };
};
