"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Receipt,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

import { MOCK_TRANSACTIONS } from "@/data/mockTransactions";
import { formatGBP } from "@/lib/finance";
import {
  FilterSidebar,
  FilterSection,
  DropdownFilter,
} from "@/components/filter-sidebar";
import type { PaymentMethod, TransactionType } from "@/types/finance";

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
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<Set<TransactionType>>(new Set());
  const [selectedMethods, setSelectedMethods] = useState<Set<PaymentMethod>>(new Set());
  const [selectedStatuses, setSelectedStatuses] = useState<Set<string>>(new Set());
  const [selectedDirections, setSelectedDirections] = useState<Set<string>>(new Set());

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
    if (selectedTypes.size > 0) result = result.filter((t) => selectedTypes.has(t.type));
    if (selectedMethods.size > 0) result = result.filter((t) => selectedMethods.has(t.method));
    if (selectedStatuses.size > 0) result = result.filter((t) => selectedStatuses.has(t.status));
    if (selectedDirections.size > 0) result = result.filter((t) => selectedDirections.has(t.direction));

    return result;
  }, [transactions, search, selectedTypes, selectedMethods, selectedStatuses, selectedDirections]);

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

  const toggleType = (t: TransactionType) => {
    setSelectedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  };

  const toggleMethod = (m: PaymentMethod) => {
    setSelectedMethods((prev) => {
      const next = new Set(prev);
      if (next.has(m)) next.delete(m);
      else next.add(m);
      return next;
    });
  };

  const toggleStatus = (s: string) => {
    setSelectedStatuses((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  };

  const toggleDirection = (d: string) => {
    setSelectedDirections((prev) => {
      const next = new Set(prev);
      if (next.has(d)) next.delete(d);
      else next.add(d);
      return next;
    });
  };

  const activeFilterCount =
    selectedTypes.size +
    selectedMethods.size +
    selectedStatuses.size +
    selectedDirections.size;

  const clearFilters = () => {
    setSelectedTypes(new Set());
    setSelectedMethods(new Set());
    setSelectedStatuses(new Set());
    setSelectedDirections(new Set());
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


      {/* Search bar + Filters button */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student, ID, reference, or note..."
            className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm transition-colors focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
        </div>
        <button
          type="button"
          onClick={() => setFiltersOpen(true)}
          className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
            activeFilterCount > 0
              ? "border-indigo-300 bg-indigo-50 text-indigo-700"
              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          }`}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-indigo-600 px-1.5 text-[10px] font-bold text-white">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Active filter chips */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500">
            {filtered.length} of {transactions.length} transaction
            {transactions.length !== 1 ? "s" : ""}
          </span>

          {Array.from(selectedTypes).map((t) => (
            <span
              key={t}
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${TYPE_COLORS[t]}`}
            >
              {TYPE_LABELS[t]}
              <button
                type="button"
                onClick={() => toggleType(t)}
                className="ml-0.5 rounded-full p-0.5 opacity-60 hover:opacity-100"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          ))}

          {Array.from(selectedMethods).map((m) => (
            <span
              key={m}
              className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-medium text-indigo-700"
            >
              {m}
              <button
                type="button"
                onClick={() => toggleMethod(m)}
                className="ml-0.5 rounded-full p-0.5 hover:bg-indigo-100"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          ))}

          {Array.from(selectedStatuses).map((s) => (
            <span
              key={s}
              className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600"
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
              <button
                type="button"
                onClick={() => toggleStatus(s)}
                className="ml-0.5 rounded-full p-0.5 hover:bg-slate-200"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          ))}

          {Array.from(selectedDirections).map((d) => (
            <span
              key={d}
              className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600"
            >
              Money {d === "in" ? "In" : "Out"}
              <button
                type="button"
                onClick={() => toggleDirection(d)}
                className="ml-0.5 rounded-full p-0.5 hover:bg-slate-200"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          ))}

          <button
            type="button"
            onClick={clearFilters}
            className="text-[11px] font-medium text-indigo-600 hover:text-indigo-700"
          >
            Clear all
          </button>
        </div>
      )}

      {activeFilterCount === 0 && (
        <p className="text-xs text-slate-500">
          {filtered.length} of {transactions.length} transaction
          {transactions.length !== 1 ? "s" : ""}
        </p>
      )}

      {/* Filter Sidebar */}
      <FilterSidebar
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Advanced Filters"
        description="Filter transactions by multiple criteria."
        activeCount={activeFilterCount}
        onClearAll={clearFilters}
      >
        <FilterSection label="Transaction Type">
          <DropdownFilter
            placeholder="Select types..."
            searchPlaceholder="Type..."
            options={ALL_TYPES.map((t) => ({
              value: t,
              label: TYPE_LABELS[t],
            }))}
            selected={selectedTypes}
            onChange={toggleType}
          />
        </FilterSection>

        <FilterSection label="Payment Method">
          <DropdownFilter
            placeholder="Select methods..."
            searchPlaceholder="Method..."
            options={ALL_METHODS.map((m) => ({
              value: m,
              label: m,
            }))}
            selected={selectedMethods}
            onChange={toggleMethod}
          />
        </FilterSection>

        <FilterSection label="Status">
          <DropdownFilter
            placeholder="Select statuses..."
            searchPlaceholder="Status..."
            options={ALL_STATUSES.map((s) => ({
              value: s,
              label: s.charAt(0).toUpperCase() + s.slice(1),
            }))}
            selected={selectedStatuses}
            onChange={toggleStatus}
          />
        </FilterSection>

        <FilterSection label="Direction">
          <DropdownFilter
            placeholder="Select direction..."
            searchPlaceholder="Direction..."
            options={[
              { value: "in", label: "Money In" },
              { value: "out", label: "Money Out" },
            ]}
            selected={selectedDirections}
            onChange={toggleDirection}
          />
        </FilterSection>
      </FilterSidebar>

      {/* Transaction table */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white py-16 text-center shadow-sm">
          <Receipt className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm font-medium text-slate-700">No transactions found</p>
          <p className="mt-1 text-xs text-slate-500">
            {(activeFilterCount > 0 || search)
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
