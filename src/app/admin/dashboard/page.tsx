"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  TrendingDown,
  ArrowLeftRight,
  RefreshCw,
  RotateCcw,
  AlertTriangle,
  ShieldAlert,
  ArrowRight,
  Clock,
  PoundSterling,
} from "lucide-react";

import { useFinance } from "@/lib/finance-context";
import { filterByQueue, formatGBP, daysSince } from "@/lib/finance";

const KPI_CONFIG = [
  {
    label: "Total Arrears",
    icon: TrendingDown,
    color: "text-red-600",
    bgColor: "bg-red-50",
    borderColor: "border-red-100",
    iconBg: "bg-red-100",
  },
  {
    label: "Pending Bank Matches",
    icon: ArrowLeftRight,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-100",
    iconBg: "bg-blue-100",
  },
  {
    label: "Credit Applications",
    icon: RefreshCw,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-100",
    iconBg: "bg-purple-100",
  },
  {
    label: "Refunds Pipeline",
    icon: RotateCcw,
    color: "text-violet-600",
    bgColor: "bg-violet-50",
    borderColor: "border-violet-100",
    iconBg: "bg-violet-100",
  },
  {
    label: "In Collections",
    icon: ShieldAlert,
    color: "text-red-600",
    bgColor: "bg-red-50",
    borderColor: "border-red-100",
    iconBg: "bg-red-100",
  },
];

const DONUT_COLORS = ["#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#10b981", "#06b6d4"];

export default function DashboardPage() {
  const { students, logs, queueCounts } = useFinance();

  const kpiValues = useMemo(() => {
    const arrearsAmount = students
      .filter((s) => ["Payment_Pending", "Delinquent"].includes(s.state))
      .reduce((sum, s) => sum + Math.max(0, s.totalDue - s.totalPaid), 0);

    const refundsAmount = students
      .filter((s) => ["Refund_Pending", "Refund_Processing"].includes(s.state))
      .reduce((sum, s) => sum + s.totalPaid, 0);

    return [
      formatGBP(arrearsAmount),
      queueCounts["bank-match"].toString(),
      queueCounts["finance-sync"].toString(),
      formatGBP(refundsAmount),
      queueCounts["collections"].toString(),
    ];
  }, [students, queueCounts]);

  const actionItems = useMemo(() => {
    const items: {
      priority: "high" | "medium" | "low";
      label: string;
      description: string;
      href: string;
      icon: React.ComponentType<{ className?: string }>;
      color: string;
    }[] = [];

    const arrearsStudents = filterByQueue(students, "arrears");
    if (arrearsStudents.length > 0) {
      const arrearsTotal = arrearsStudents.reduce(
        (sum, s) => sum + Math.max(0, s.totalDue - s.totalPaid),
        0,
      );
      items.push({
        priority: "high",
        label: `${arrearsStudents.length} student${arrearsStudents.length > 1 ? "s" : ""} in arrears`,
        description: `${formatGBP(arrearsTotal)} outstanding — includes ${arrearsStudents.filter((s) => s.state === "Delinquent").length} delinquent`,
        href: "/admin/arrears",
        icon: AlertTriangle,
        color: "text-red-600 bg-red-50 border-red-100",
      });
    }

    const bankMatchStudents = filterByQueue(students, "bank-match");
    if (bankMatchStudents.length > 0) {
      items.push({
        priority: "medium",
        label: `${bankMatchStudents.length} bank deposit${bankMatchStudents.length > 1 ? "s" : ""} awaiting match`,
        description: bankMatchStudents.map((s) => s.name).join(", "),
        href: "/admin/bank-match",
        icon: ArrowLeftRight,
        color: "text-blue-600 bg-blue-50 border-blue-100",
      });
    }

    const syncStudents = filterByQueue(students, "finance-sync");
    if (syncStudents.length > 0) {
      const oldestDays = Math.max(
        ...syncStudents.map((s) => daysSince(s.lastUpdated)),
      );
      items.push({
        priority: "medium",
        label: `${syncStudents.length} Premium Credit app${syncStudents.length > 1 ? "s" : ""} pending sync`,
        description: `Oldest waiting ${oldestDays} day${oldestDays !== 1 ? "s" : ""}`,
        href: "/admin/finance-sync",
        icon: RefreshCw,
        color: "text-amber-600 bg-amber-50 border-amber-100",
      });
    }

    const refundStudents = filterByQueue(students, "refunds");
    if (refundStudents.length > 0) {
      const refundTotal = refundStudents.reduce((sum, s) => sum + s.totalPaid, 0);
      items.push({
        priority: "low",
        label: `${refundStudents.length} refund${refundStudents.length > 1 ? "s" : ""} in pipeline`,
        description: `Total paid: ${formatGBP(refundTotal)}`,
        href: "/admin/refunds",
        icon: RotateCcw,
        color: "text-violet-600 bg-violet-50 border-violet-100",
      });
    }

    const collectionStudents = filterByQueue(students, "collections");
    if (collectionStudents.length > 0) {
      const collTotal = collectionStudents.reduce(
        (sum, s) => sum + Math.max(0, s.totalDue - s.totalPaid),
        0,
      );
      items.push({
        priority: "high",
        label: `${collectionStudents.length} student${collectionStudents.length > 1 ? "s" : ""} in collections`,
        description: `${formatGBP(collTotal)} outstanding — includes ${collectionStudents.filter((s) => s.state === "Collection_Processing").length} with agency`,
        href: "/admin/collections",
        icon: ShieldAlert,
        color: "text-red-600 bg-red-50 border-red-100",
      });
    }

    return items;
  }, [students]);

  const stateDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of students) {
      counts[s.state] = (counts[s.state] || 0) + 1;
    }
    return Object.entries(counts)
      .map(([name, value]) => ({ name: name.replace(/_/g, " "), value }))
      .sort((a, b) => b.value - a.value);
  }, [students]);

  const outstandingByMethod = useMemo(() => {
    const byMethod: Record<string, number> = {};
    for (const s of students) {
      const outstanding = Math.max(0, s.totalDue - s.totalPaid);
      byMethod[s.method] = (byMethod[s.method] || 0) + outstanding;
    }
    return Object.entries(byMethod)
      .map(([name, amount]) => ({ name, amount }))
      .filter((d) => d.amount > 0)
      .sort((a, b) => b.amount - a.amount);
  }, [students]);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">
          Overview of finance operations. Prioritized tasks and live metrics.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {KPI_CONFIG.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`rounded-xl border ${kpi.borderColor} ${kpi.bgColor} p-5`}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {kpi.label}
                </p>
                <div className={`rounded-lg ${kpi.iconBg} p-2`}>
                  <Icon className={`h-4 w-4 ${kpi.color}`} />
                </div>
              </div>
              <p className={`mt-3 text-2xl font-bold ${kpi.color}`}>
                {kpiValues[i]}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* Action Items */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-xl border border-slate-200 bg-white shadow-sm"
      >
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-sm font-semibold text-slate-900">
            Action Items
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Tasks requiring your attention, sorted by priority
          </p>
        </div>
        <div className="divide-y divide-slate-100">
          {actionItems.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
                <Clock className="h-5 w-5 text-emerald-600" />
              </div>
              <p className="text-sm font-medium text-slate-700">
                All caught up!
              </p>
              <p className="mt-1 text-xs text-slate-500">
                No pending actions right now.
              </p>
            </div>
          ) : (
            actionItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex items-center gap-4 px-6 py-4 transition-colors hover:bg-slate-50"
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${item.color}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900">
                      {item.label}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {item.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                        item.priority === "high"
                          ? "bg-red-100 text-red-700"
                          : item.priority === "medium"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {item.priority}
                    </span>
                    <ArrowRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </motion.div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* State Distribution Donut */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h3 className="text-sm font-semibold text-slate-900">
            Student State Distribution
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Current breakdown across all states
          </p>
          <div className="mt-4 flex items-center gap-6">
            <div className="h-48 w-48 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stateDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={72}
                    dataKey="value"
                    paddingAngle={2}
                    strokeWidth={0}
                  >
                    {stateDistribution.map((_, idx) => (
                      <Cell
                        key={idx}
                        fill={DONUT_COLORS[idx % DONUT_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col gap-2">
              {stateDistribution.map((entry, idx) => (
                <div key={entry.name} className="flex items-center gap-2 text-xs">
                  <div
                    className="h-2.5 w-2.5 rounded-full"
                    style={{
                      backgroundColor:
                        DONUT_COLORS[idx % DONUT_COLORS.length],
                    }}
                  />
                  <span className="text-slate-600">{entry.name}</span>
                  <span className="font-semibold text-slate-900">
                    {entry.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Outstanding by Payment Method */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h3 className="text-sm font-semibold text-slate-900">
            Outstanding by Payment Method
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Amounts not yet collected
          </p>
          {outstandingByMethod.length === 0 ? (
            <div className="mt-8 flex flex-col items-center py-6 text-center">
              <PoundSterling className="h-8 w-8 text-emerald-300" />
              <p className="mt-2 text-sm text-slate-500">
                All payments collected
              </p>
            </div>
          ) : (
            <div className="mt-4 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={outstandingByMethod}
                  margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f1f5f9"
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: number) => `£${(v / 1000).toFixed(1)}k`}
                  />
                  <Tooltip
                    formatter={(value) => [formatGBP(Number(value)), "Outstanding"]}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                      fontSize: "12px",
                    }}
                  />
                  <Bar
                    dataKey="amount"
                    fill="#6366f1"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={48}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-xl border border-slate-200 bg-white shadow-sm"
      >
        <div className="border-b border-slate-100 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Recent Activity
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">
                Latest state changes across all students
              </p>
            </div>
            {logs.length > 0 && (
              <Link
                href="/admin/audit-log"
                className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
              >
                View all
              </Link>
            )}
          </div>
        </div>
        <div className="divide-y divide-slate-100">
          {logs.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <Clock className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-2 text-sm text-slate-500">
                No state changes recorded yet. Actions will appear here.
              </p>
            </div>
          ) : (
            logs.slice(0, 5).map((log) => (
              <div
                key={`${log.studentId}-${log.at}`}
                className="flex items-start gap-3 px-6 py-3"
              >
                <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-indigo-400" />
                <div className="min-w-0 flex-1 text-xs text-slate-600">
                  <span className="font-medium text-slate-900">
                    {log.studentId}
                  </span>{" "}
                  &middot; {log.action} &middot;{" "}
                  <span className="text-slate-400">
                    {log.fromState} &rarr; {log.toState}
                  </span>
                  {log.reason && (
                    <p className="mt-0.5 truncate text-slate-500">
                      {log.reason}
                    </p>
                  )}
                </div>
                <span className="shrink-0 text-[11px] text-slate-400">
                  {new Date(log.at).toLocaleTimeString("en-GB", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}
