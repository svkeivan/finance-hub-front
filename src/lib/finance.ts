import type {
  AccessLevel,
  CancellationReasonCode,
  FinanceState,
  PaymentMethod,
  QueueKey,
  RefundCalculatorResult,
  StudentRecord,
} from "@/types/finance";

/* ───────────────────────────────────────────────
   Queue Config — maps queues to target states
   ─────────────────────────────────────────────── */

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
    label: "Credit Pipeline",
    targetStates: [
      "Credit_Application_Pending",
      "Credit_Pending",
      "Credit_Approved",
      "Credit_Rejected",
    ],
  },
  arrears: {
    label: "Arrears",
    targetStates: ["Payment_Pending", "Delinquent"],
  },
  refunds: {
    label: "Refunds",
    targetStates: ["Refund_Pending", "Refund_Processing"],
  },
  collections: {
    label: "Collections",
    targetStates: ["Collection_Pending", "Collection_Processing"],
  },
};

/* ───────────────────────────────────────────────
   Access level per state (from Notion doc v7.2)
   ─────────────────────────────────────────────── */

export const STATE_ACCESS_LEVEL: Record<FinanceState, AccessLevel> = {
  Active: "Full",
  Balance_Pending: "Full",
  Credit_Application_Pending: "Full",
  Credit_Pending: "Full",
  Credit_Approved: "Full",
  Credit_Rejected: "Full",
  Payment_Complete: "Full",
  Payment_Pending: "Partial_Back",
  Refund_Pending: "Partial_Back",
  Refund_Processing: "Partial_Back",
  Cancelled: "Partial",
  Delinquent: "Blocked",
  Collection_Pending: "Blocked",
  Collection_Processing: "Blocked",
};

/* ───────────────────────────────────────────────
   Badge styling per state
   ─────────────────────────────────────────────── */

export const STATE_BADGE_CLASS: Record<FinanceState, string> = {
  Active: "bg-blue-100 text-blue-800",
  Payment_Pending: "bg-amber-100 text-amber-800",
  Delinquent: "bg-red-100 text-red-800",
  Collection_Pending: "bg-red-100 text-red-800",
  Collection_Processing: "bg-red-100 text-red-800",
  Payment_Complete: "bg-emerald-100 text-emerald-800",
  Refund_Pending: "bg-violet-100 text-violet-800",
  Refund_Processing: "bg-violet-100 text-violet-800",
  Cancelled: "bg-slate-200 text-slate-700",
  Credit_Application_Pending: "bg-purple-50 text-purple-700",
  Credit_Pending: "bg-purple-100 text-purple-800",
  Credit_Approved: "bg-green-100 text-green-800",
  Credit_Rejected: "bg-orange-100 text-orange-800",
  Balance_Pending: "bg-indigo-100 text-indigo-800",
};

/* ───────────────────────────────────────────────
   FIN state IDs (for display)
   ─────────────────────────────────────────────── */

export const STATE_ID: Record<FinanceState, string> = {
  Active: "FIN-01",
  Payment_Pending: "FIN-02",
  Delinquent: "FIN-03",
  Collection_Pending: "FIN-04",
  Payment_Complete: "FIN-05",
  Refund_Pending: "FIN-06",
  Cancelled: "FIN-07",
  Credit_Rejected: "FIN-08",
  Refund_Processing: "FIN-09",
  Collection_Processing: "FIN-10",
  Balance_Pending: "FIN-12",
  Credit_Application_Pending: "FIN-11",
  Credit_Pending: "FIN-13",
  Credit_Approved: "FIN-14",
};

/* ───────────────────────────────────────────────
   Work item flag — states that need manual action
   (from Manual Finance Work Items doc)
   7 work items only
   ─────────────────────────────────────────────── */

export const IS_WORK_ITEM: Record<FinanceState, boolean> = {
  Active: false,
  Payment_Pending: true,
  Delinquent: true,
  Collection_Pending: true,
  Collection_Processing: true,
  Payment_Complete: false,
  Refund_Pending: true,
  Refund_Processing: true,
  Cancelled: false,
  Credit_Application_Pending: false,
  Credit_Pending: false,
  Credit_Approved: false,
  Credit_Rejected: false,
  Balance_Pending: true,
};

/* ───────────────────────────────────────────────
   Available MANUAL actions per state
   Based on Manual Finance Work Items doc
   ─────────────────────────────────────────────── */

const ACTION_MAP: Record<FinanceState, string[]> = {
  Payment_Pending: [
    "Payment Received",
    "Final Payment",
    "Assess & Resolve",
    "Cancel Account",
  ],
  Delinquent: ["Assess & Resolve"],
  Balance_Pending: ["Mark as Paid", "Mark as Overdue"],
  Refund_Pending: ["Proceed to Processing"],
  Refund_Processing: ["Complete Refund"],
  Collection_Pending: ["Proceed to Processing"],
  Collection_Processing: ["Mark Settled"],

  Active: [],
  Payment_Complete: [],
  Cancelled: [],
  Credit_Application_Pending: [],
  Credit_Pending: [],
  Credit_Approved: [],
  Credit_Rejected: [],
};

/* ───────────────────────────────────────────────
   Method-restricted actions
   
   Card/DD instalments and DD Pay Full auto-detect
   payments via Stripe webhooks / DD system.
   
   Bank Transfer always needs manual confirmation.
   Premium Credit (PCL) needs manual confirmation
   in Balance_Pending — the credit company sends a
   lump sum to AT's bank account after approval.
   ─────────────────────────────────────────────── */

const ACTION_ALLOWED_METHODS: Record<string, PaymentMethod[]> = {
  "Payment Received": ["Bank Transfer"],
  "Final Payment": ["Bank Transfer"],
  "Mark as Paid": ["Bank Transfer", "Premium Credit"],
};

export const getAvailableActions = (
  state: FinanceState,
  method?: PaymentMethod,
): string[] => {
  const actions = ACTION_MAP[state] ?? [];
  if (!method) return actions;
  return actions.filter((action) => {
    const allowedMethods = ACTION_ALLOWED_METHODS[action];
    if (allowedMethods) return allowedMethods.includes(method);
    return true;
  });
};

/* ───────────────────────────────────────────────
   Cancellation page actions — for states that
   can initiate Refund/Collection via cancellation
   request (separate page)
   ─────────────────────────────────────────────── */

const CANCELLATION_ELIGIBLE: FinanceState[] = [
  "Active",
  "Balance_Pending",
  "Payment_Complete",
  "Credit_Pending",
  "Credit_Approved",
  "Credit_Rejected",
];

const CREDIT_SELF_PAY_STATES: FinanceState[] = ["Credit_Pending"];

export const getCancellationActions = (state: FinanceState): string[] => {
  const actions: string[] = [];
  if (CANCELLATION_ELIGIBLE.includes(state)) {
    actions.push("Initiate Refund", "Initiate Collection");
  }
  if (CREDIT_SELF_PAY_STATES.includes(state)) {
    actions.push("Move to Self-Pay");
  }
  return actions;
};

export const isCancellationEligible = (state: FinanceState): boolean =>
  CANCELLATION_ELIGIBLE.includes(state);

/* ───────────────────────────────────────────────
   Cancellation Reason Codes (CR01-CR06)
   Dropdown + "Other" requires free-text note
   ─────────────────────────────────────────────── */

export const CANCELLATION_REASON_OPTIONS: {
  code: CancellationReasonCode;
  label: string;
}[] = [
  { code: "CR01", label: "CR01 — Student requested (cool-off)" },
  { code: "CR02", label: "CR02 — Student requested (post cool-off)" },
  { code: "CR03", label: "CR03 — Non-payment / debt" },
  { code: "CR04", label: "CR04 — Compassionate / medical" },
  { code: "CR05", label: "CR05 — Course transfer / swap" },
  { code: "CR06", label: "CR06 — Other (free text required)" },
];

/* ───────────────────────────────────────────────
   Destructive & reversal classification
   ─────────────────────────────────────────────── */

export const DESTRUCTIVE_ACTIONS = [
  "Cancel Account",
  "Assess & Resolve",
  "Initiate Collection",
  "Mark Settled",
  "Complete Refund",
];

export const REVERSAL_ACTIONS: string[] = [];

export const NEEDS_CANCELLATION_REASON = [
  "Assess & Resolve",
  "Cancel Account",
  "Initiate Collection",
];

/* ───────────────────────────────────────────────
   Settlement Status options (3 values per doc)
   ─────────────────────────────────────────────── */

export type SettlementStatusValue = "settled" | "unsettled" | "n/a";

export const SETTLEMENT_OPTIONS: {
  value: SettlementStatusValue;
  label: string;
}[] = [
  { value: "settled", label: "Settled (debt recovered)" },
  { value: "unsettled", label: "Unsettled (debt written off)" },
  { value: "n/a", label: "N/A" },
];

/* ───────────────────────────────────────────────
   State transitions — given an action and current
   state, return the next state
   ─────────────────────────────────────────────── */

export const getNextStateForAction = (
  action: string,
  current: FinanceState,
  cancellationSourceState?: FinanceState,
): FinanceState => {
  const transitions: Record<string, FinanceState> = {
    "Payment Received": "Active",
    "Final Payment": "Payment_Complete",
    "Resume Payments": "Payment_Pending",
    "Mark as Paid": "Payment_Complete",
    "Mark as Overdue": "Payment_Pending",
    "Proceed to Processing":
      current === "Refund_Pending"
        ? "Refund_Processing"
        : "Collection_Processing",
    "Complete Refund": "Cancelled",
    "Mark Settled": "Cancelled",
    "Initiate Refund": "Refund_Pending",
    "Initiate Collection": "Collection_Pending",
    "Escalate to Collections": "Collection_Pending",
    "Cancel Account": "Cancelled",
    "Move to Self-Pay": "Payment_Pending",
  };

  return transitions[action] ?? current;
};

/* ───────────────────────────────────────────────
   Filtering helpers
   ─────────────────────────────────────────────── */

export const filterByQueue = (students: StudentRecord[], queue: QueueKey) => {
  const targetStates = QUEUE_CONFIG[queue].targetStates;
  if (queue === "all") return students;
  return students.filter((student) => targetStates.includes(student.state));
};

/* ───────────────────────────────────────────────
   Formatting helpers
   ─────────────────────────────────────────────── */

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

/* ───────────────────────────────────────────────
   Pending Payment helpers — describes what
   payment is expected next for a student
   ─────────────────────────────────────────────── */

export type PendingPaymentInfo = {
  label: string;
  expectedAmount: number;
  isInstalment: boolean;
  instalmentNumber?: number;
  totalInstalments?: number;
  isFinal: boolean;
};

export const getPendingPayment = (
  student: StudentRecord,
): PendingPaymentInfo => {
  const outstanding = Math.max(0, student.totalDue - student.totalPaid);
  const hasInstalments =
    student.totalInstalments != null && student.totalInstalments > 0;

  if (!hasInstalments) {
    return {
      label:
        student.method === "Bank Transfer"
          ? "Bank Transfer Payment"
          : "Full Payment",
      expectedAmount: outstanding,
      isInstalment: false,
      isFinal: true,
    };
  }

  const paid = student.paidInstalments ?? 0;
  const total = student.totalInstalments!;
  const perInstalment = student.instalmentAmount ?? 0;
  const nextInstalment = paid + 1;
  const isFinal = nextInstalment >= total;

  return {
    label: isFinal
      ? `Final Instalment (${nextInstalment} of ${total})`
      : `Instalment ${nextInstalment} of ${total}`,
    expectedAmount: isFinal ? outstanding : perInstalment,
    isInstalment: true,
    instalmentNumber: nextInstalment,
    totalInstalments: total,
    isFinal,
  };
};

/* ───────────────────────────────────────────────
   Refund Calculator (matches doc Section 3)
   
   Policy-driven, deterministic:
   1. Cool-off → full refund (capped by total received)
   2. No module activity → Digital Asset % of package price
   3. Module activity → Sum of Cost We Save for unreached modules
   4. Cancellation Fee exception: applies ONLY when
      eligible > total received (default £250, adjustable)
   ─────────────────────────────────────────────── */

const DEFAULT_CANCELLATION_FEE = 250;

const CREDIT_STATES: FinanceState[] = [
  "Credit_Application_Pending",
  "Credit_Pending",
  "Credit_Approved",
  "Credit_Rejected",
];

export const calculateRefundRecommendation = (
  student: StudentRecord,
): RefundCalculatorResult => {
  const days = daysSince(student.enrolmentDate);
  const coolOffDays = student.coolOffDays ?? 14;

  const isCredit = CREDIT_STATES.includes(student.state);
  const totalReceived = isCredit
    ? Math.min(student.totalPaid, student.totalPaid)
    : student.totalPaid;

  const cancellationFee =
    student.cancellationFeeAdjusted ??
    student.cancellationFeeDefault ??
    DEFAULT_CANCELLATION_FEE;

  /* ── Step 1: Cool-off ── */
  if (days <= coolOffDays) {
    const eligible = student.coursePackagePrice;
    const refundable = Math.min(eligible, totalReceived);
    return {
      scenario: "cool-off",
      eligibleRefund: eligible,
      refundableAmount: refundable,
      cancellationFee: 0,
      cancellationFeeApplies: false,
      note: `Within ${coolOffDays}-day cool-off period. Full refund of course package price, capped by total received.`,
    };
  }

  /* ── Step 2: No module activity → Digital Asset ── */
  const enteredModules = student.modules.filter((m) => m.entered);
  if (enteredModules.length === 0) {
    const eligible = student.coursePackagePrice * student.digitalAssetPct;
    if (eligible <= totalReceived) {
      return {
        scenario: "digital-asset",
        eligibleRefund: eligible,
        refundableAmount: eligible,
        cancellationFee: 0,
        cancellationFeeApplies: false,
        note: `No module activity. Digital asset entitlement = ${(student.digitalAssetPct * 100).toFixed(0)}% of package price.`,
      };
    }
    return {
      scenario: "digital-asset",
      eligibleRefund: eligible,
      refundableAmount: totalReceived,
      cancellationFee,
      cancellationFeeApplies: true,
      note: `No module activity. Eligible refund (${formatGBP(eligible)}) exceeds total received (${formatGBP(totalReceived)}). Cancellation fee applies.`,
    };
  }

  /* ── Step 3: Module activity → Cost We Save ── */
  const lastEnteredIdx = student.modules.reduce(
    (max, m, i) => (m.entered ? i : max),
    -1,
  );
  const unreachedModules = student.modules.filter(
    (_, i) => i > lastEnteredIdx,
  );
  const eligible = unreachedModules.reduce((sum, m) => sum + m.costWeSave, 0);

  if (eligible <= totalReceived) {
    return {
      scenario: "cost-we-save",
      eligibleRefund: eligible,
      refundableAmount: eligible,
      cancellationFee: 0,
      cancellationFeeApplies: false,
      note: `Module activity present. Last module reached: Module ${lastEnteredIdx + 1}. Eligible = sum of Cost We Save for ${unreachedModules.length} undelivered modules.`,
    };
  }

  return {
    scenario: "cost-we-save",
    eligibleRefund: eligible,
    refundableAmount: totalReceived,
    cancellationFee,
    cancellationFeeApplies: true,
    note: `Module activity present. Eligible refund (${formatGBP(eligible)}) exceeds total received (${formatGBP(totalReceived)}). Cancellation fee applies.`,
  };
};

/**
 * Scenario-only calculation (no refund), used when eligible = 0
 */
export const getCalculatorScenarioLabel = (
  scenario: RefundCalculatorResult["scenario"],
): string => {
  switch (scenario) {
    case "cool-off":
      return "Cool-off Period (Full Refund)";
    case "digital-asset":
      return "Digital Asset Entitlement";
    case "cost-we-save":
      return "Cost We Save (Module-based)";
    case "no-refund":
      return "No Refund Eligible";
  }
};
