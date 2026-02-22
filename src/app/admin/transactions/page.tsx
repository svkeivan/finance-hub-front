"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Receipt,
  Search,
  XCircle,
} from "lucide-react";

import { MOCK_TRANSACTIONS } from "@/data/mockTransactions";
import { formatGBP } from "@/lib/finance";
import type { PaymentMethod, Transaction, TransactionType } from "@/types/finance";

const TYPE_LABELS: Record<TransactionType, string> = {
  deposit: "Deposit",
  instalment: "Instalment",
  full_payment: "Full Payment",
  credit_funding: "Credit Funding",
  refund: "Refund",
  collection_recovery: "Collection Recovery",
  cancellation_fee: "Cancellation Fee",
};

const TYPE_COLORS: Record<TransactionType, string> = {
  deposit: "bg-emerald-100 text-emerald-700",
  instalment: "bg-blue-100 text-blue-700",
  full_payment: "bg-indigo-100 text-indigo-700",
  credit_funding: "bg-purple-100 text-purple-700",
  refund: "bg-red-100 text-red-700",
  collection_recovery: "bg-amber-100 text-amber-700",
  cancellation_fee: "bg-orange-100 text-orange-700",
};

const STATUS_BADGE: Record<string, string> = {
  completed: "bg-emerald-50 text-emerald-600 border-emerald-200",
  pending: "bg-amber-50 text-amber-600 border-amber-200",
  failed: "bg-red-50 text-red-600 border-red-200",
};

const ALL_TYPES: TransactionType[] = [
  "deposit",
  "instalment",
  "full_payment",
  "credit_funding",
  "refund",
  "collection_recovery",
  "cancellation_fee",
];

const ALL_METHODS: PaymentMethod[] = [
  "Card Instalments",
  "DD Instalments",
  "DD Pay Full",
  "Bank Transfer",
  "Premium Credit",
];

const ALL_STATUSES = ["completed", "pending", "failed"] as const;

export default function TransactionsPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TransactionType | "all">("all");
  const [methodFilter, setMethodFilter] = useState<PaymentMethod | "all">("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [directionFilter, setDirectionFilter] = useState<"all" | "in" | "out">("all");

  const transactions = MOCK_TRANSACTIONS;

  const filtered = useMemo(() => {
    let result = [...transactions];
    const q = search.trim().toLowerCase();

    if (q) {
      result = result.filter(
        (t) =>
          t.studentName.toLowerCase().includes(q) ||
          t.studentId.toLowerCase().includes(q) ||
          t.id.toLowerCase().includes(q) ||
          (t.reference && t.reference.toLowerCase().includes(q)) ||
          (t.note && t.note.toLowerCase().includes(q)),
      );
    }
    if (typeFilter !== "all") result = result.filter((t) => t.type === typeFilter);
    if (methodFilter !== "all") result = result.filter((t) => t.method === methodFilter);
    if (statusFilter !== "all") result = result.filter((t) => t.status === statusFilter);
    if (directionFilter !== "all") result = result.filter((t) => t.direction === directionFilter);

    return result;
  }, [transactions, search, typeFilter, methodFilter, statusFilter, directionFilter]);

  const stats = useMemo(() => {
    const totalIn = transactions
      .filter((t) => t.direction === "in" && t.status === "completed")
      .reduce((s, t) => s + t.amount, 0);
    const totalOut = transactions
      .filter((t) => t.direction === "out" && t.status === "completed")
      .reduce((s, t) => s + t.amount, 0);
    const pendingIn = transactions
      .filter((t) => t.direction === "in" && t.status === "pending")
      .reduce((s, t) => s + t.amount, 0);
    const pendingOut = transactions
      .filter((t) => t.direction === "out" && t.status === "pending")
      .reduce((s, t) => s + t.amount, 0);
    const failedCount = transactions.filter((t) => t.status === "failed").length;
    return { totalIn, totalOut, pendingIn, pendingOut, failedCount, net: totalIn - totalOut };
  }, [transactions]);

  const hasFilters =
    search || typeFilter !== "all" || methodFilter !== "all" || statusFilter !== "all" || directionFilter !== "all";

  const clearFilters = () => {
    setSearch("");
    setTypeFilter("all");
    setMethodFilter("all");
    setStatusFilter("all");
    setDirectionFilter("all");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-100">
          <Receipt className="h-6 w-6 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Transactions</h1>
          <p className="mt-1 text-sm text-slate-500">
            Complete ledger of all financial transactions across all students — deposits,
            payments, refunds, collections, and fees.
          </p>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-600">
            Total In
          </p>
          <p className="mt-1.5 text-xl font-bold text-emerald-700">
            {formatGBP(stats.totalIn)}
          </p>
        </div>
        <div className="rounded-xl border border-red-100 bg-red-50 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-red-600">
            Total Out
          </p>
          <p className="mt-1.5 text-xl font-bold text-red-700">
            {formatGBP(stats.totalOut)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Net
          </p>
          <p className={`mt-1.5 text-xl font-bold ${stats.net >= 0 ? "text-emerald-700" : "text-red-700"}`}>
            {formatGBP(stats.net)}
          </p>
        </div>
        <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-600">
            Pending In
          </p>
          <p className="mt-1.5 text-xl font-bold text-amber-700">
            {formatGBP(stats.pendingIn)}
          </p>
        </div>
        <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-600">
            Pending Out
          </p>
          <p className="mt-1.5 text-xl font-bold text-amber-700">
            {formatGBP(stats.pendingOut)}
          </p>
        </div>
        <div className="rounded-xl border border-red-100 bg-red-50 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-red-600">
            Failed
          </p>
          <p className="mt-1.5 text-xl font-bold text-red-700">{stats.failedCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[240px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student, ID, reference, or note..."
            className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm transition-colors focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as TransactionType | "all")}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700"
        >
          <option value="all">All types</option>
          {ALL_TYPES.map((t) => (
            <option key={t} value={t}>
              {TYPE_LABELS[t]}
            </option>
          ))}
        </select>

        <select
          value={methodFilter}
          onChange={(e) => setMethodFilter(e.target.value as PaymentMethod | "all")}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700"
        >
          <option value="all">All methods</option>
          {ALL_METHODS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700"
        >
          <option value="all">All statuses</option>
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>

        <select
          value={directionFilter}
          onChange={(e) => setDirectionFilter(e.target.value as "all" | "in" | "out")}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700"
        >
          <option value="all">All directions</option>
          <option value="in">Money In</option>
          <option value="out">Money Out</option>
        </select>

        {hasFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2.5 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-50"
          >
            <XCircle className="h-3.5 w-3.5" />
            Clear
          </button>
        )}
      </div>

      {/* Result count */}
      <p className="text-xs text-slate-500">
        {filtered.length} of {transactions.length} transaction
        {transactions.length !== 1 ? "s" : ""}
      </p>

      {/* Transaction table */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white py-16 text-center shadow-sm">
          <Receipt className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm font-medium text-slate-700">No transactions found</p>
          <p className="mt-1 text-xs text-slate-500">
            {hasFilters
              ? "Try adjusting your filters."
              : "Transactions will appear here as financial events are recorded."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50">
                <tr>
                  <th className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">
                    Date
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">
                    ID
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">
                    Student
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">
                    Type
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">
                    Method
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">
                    Amount
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">
                    Status
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">
                    Reference
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">
                    Note
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((txn, idx) => (
                  <motion.tr
                    key={txn.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: Math.min(idx * 0.015, 0.3) }}
                    className="border-t border-slate-50 align-top transition-colors hover:bg-slate-50/60"
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                      <p className="text-xs font-medium text-slate-700">
                        {new Date(txn.at).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {new Date(txn.at).toLocaleTimeString("en-GB", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className="font-mono text-xs text-slate-500">{txn.id}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{txn.studentName}</p>
                      <p className="text-[11px] text-slate-400">{txn.studentId}</p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${TYPE_COLORS[txn.type]}`}
                      >
                        {txn.direction === "in" ? (
                          <ArrowDownLeft className="h-3 w-3" />
                        ) : (
                          <ArrowUpRight className="h-3 w-3" />
                        )}
                        {TYPE_LABELS[txn.type]}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-600">
                      {txn.method}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span
                        className={`font-semibold ${
                          txn.status === "failed"
                            ? "text-slate-400 line-through"
                            : txn.direction === "in"
                              ? "text-emerald-700"
                              : "text-red-700"
                        }`}
                      >
                        {txn.direction === "out" ? "−" : "+"}
                        {formatGBP(txn.amount)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span
                        className={`inline-block rounded-full border px-2 py-0.5 text-[11px] font-semibold ${STATUS_BADGE[txn.status]}`}
                      >
                        {txn.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {txn.reference ? (
                        <span className="font-mono text-xs text-slate-500">
                          {txn.reference}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-300">—</span>
                      )}
                    </td>
                    <td className="max-w-[200px] truncate px-4 py-3 text-xs text-slate-500">
                      {txn.note ?? "—"}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
