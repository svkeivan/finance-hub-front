export type PaymentMethod =
  | "Stripe Full"
  | "Stripe Instalments"
  | "Premium Credit"
  | "Bank Transfer";

export type FinanceState =
  | "Lead"
  | "Pending_Details"
  | "Quote_Sent"
  | "Application_Started"
  | "Application_Review"
  | "Credit_Pending"
  | "Balance_Pending"
  | "Payment_Pending"
  | "Payment_Complete"
  | "Active"
  | "Refund_Pending"
  | "Delinquent"
  | "Collection_Pending"
  | "Cancelled";

export type StudentRecord = {
  id: string;
  name: string;
  email: string;
  method: PaymentMethod;
  state: FinanceState;
  access: "Starter" | "Core" | "Full";
  totalPaid: number;
  totalDue: number;
  modulesAccessed: number;
  enrolmentDate: string;
  lastUpdated: string;
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

export type QueueKey = "bank-match" | "finance-sync" | "arrears" | "refunds" | "all";
