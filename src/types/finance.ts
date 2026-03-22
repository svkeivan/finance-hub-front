export type PaymentMethod =
  | "Card Instalments"
  | "DD Instalments"
  | "DD Pay Full"
  | "Bank Transfer"
  | "Premium Credit";

export type FinanceState =
  | "Active"
  | "Payment_Pending"
  | "Delinquent"
  | "Collection_Pending"
  | "Payment_Complete"
  | "Refund_Pending"
  | "Cancelled"
  | "Credit_Rejected"
  | "Refund_Processing"
  | "Collection_Processing"
  | "Balance_Pending"
  | "Credit_Pending"
  | "Credit_Approved"
  | "Credit_Application_Pending";

export type AccessLevel = "Full" | "Partial_Back" | "Partial" | "Blocked";

/** Cancellation reason codes (CR01-CR06). "Other" requires free-text note. */
export type CancellationReasonCode =
  | "CR01"
  | "CR02"
  | "CR03"
  | "CR04"
  | "CR05"
  | "CR06";

/** Module progress entry for Cost We Save calculations */
export type ModuleProgress = {
  name: string;
  /** Whether the student has entered this module (even without completing it) */
  entered: boolean;
  /** Cost We Save value for this module (set during course package setup) */
  costWeSave: number;
};

/** Refund calculator output */
export type RefundCalculatorResult = {
  scenario: "cool-off" | "digital-asset" | "cost-we-save" | "no-refund";
  eligibleRefund: number;
  refundableAmount: number;
  cancellationFee: number;
  cancellationFeeApplies: boolean;
  note: string;
};

export type StudentRecord = {
  id: string;
  name: string;
  email: string;
  method: PaymentMethod;
  state: FinanceState;
  access: AccessLevel;
  totalPaid: number;
  totalDue: number;
  modulesAccessed: number;
  enrolmentDate: string;
  lastUpdated: string;

  /* ── Course package fields ── */
  /** Total course package price */
  coursePackagePrice: number;
  /** Digital Asset percentage (0-1) per course package */
  digitalAssetPct: number;
  /** Cool-off period in days (configurable per course package) */
  coolOffDays: number;
  /** Module progress with per-module Cost We Save */
  modules: ModuleProgress[];
  /** Course package / trade name */
  coursePackage: string;

  /* ── Payment schedule fields ── */
  /** Total number of instalments (undefined for single-payment methods) */
  totalInstalments?: number;
  /** Number of instalments already paid */
  paidInstalments?: number;
  /** Amount per instalment */
  instalmentAmount?: number;
  /** Deposit amount (paid upfront, separate from instalments) */
  depositAmount?: number;

  /* ── Cancellation tracking ── */
  /** Tracks the state the student was in before entering Refund_Pending or Collection_Pending via cancellation request */
  cancellationSourceState?: FinanceState;
  /** Cancellation reason code (CR01-CR06) */
  cancellationReasonCode?: CancellationReasonCode;
  /** Free-text cancellation note (required if reason is "Other" / CR06) */
  cancellationReason?: string;
  /** CS notes from the step that submitted the case to Refund_Pending / Collection_Pending */
  submissionNotes?: string;
  /** Default cancellation fee, adjustable by CS with reason */
  cancellationFeeDefault?: number;
  /** Adjusted cancellation fee (if CS adjusted) */
  cancellationFeeAdjusted?: number;
  /** Reason for fee adjustment */
  cancellationFeeAdjustReason?: string;

  /* ── Processing tracking ── */
  /** Reference code set during processing states */
  referenceCode?: string;
  /** Stripe payment link (optional, set in Collection_Pending) */
  stripePaymentLink?: string;
  /** Refund amount set on entry to Refund_Processing */
  refundAmount?: number;
  /** Collection amount set on entry to Collection_Processing */
  collectionAmount?: number;
  /** Settlement amount (amount actually recovered in collection) */
  settlementAmount?: number;
};

export type FinanceActionLog = {
  at: string;
  studentId: string;
  fromState: FinanceState;
  toState: FinanceState;
  action: string;
  reason: string;
  reference?: string;
};

export type TransactionType =
  | "deposit"
  | "instalment"
  | "full_payment"
  | "credit_funding"
  | "refund"
  | "collection_recovery"
  | "cancellation_fee";

export type Transaction = {
  id: string;
  at: string;
  studentId: string;
  studentName: string;
  type: TransactionType;
  amount: number;
  /** "in" = money coming to AT, "out" = money going to student */
  direction: "in" | "out";
  method: PaymentMethod;
  reference?: string;
  status: "completed" | "pending" | "failed";
  note?: string;
};

export type QueueKey =
  | "bank-match"
  | "finance-sync"
  | "arrears"
  | "refunds"
  | "collections"
  | "all";
