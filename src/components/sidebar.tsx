"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardList,
  LayoutDashboard,
  Landmark,
  ArrowLeftRight,
  AlertTriangle,
  RotateCcw,
  ShieldAlert,
  Ban,
  Receipt,
  ExternalLink,
} from "lucide-react";

import { useFinance } from "@/lib/finance-context";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
};

export function Sidebar() {
  const pathname = usePathname();
  const { queueCounts } = useFinance();

  const NAV_ITEMS: NavItem[] = [
    // { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Work Items", href: "/admin/students", icon: ClipboardList },
    { label: "Transactions", href: "/admin/transactions", icon: Receipt },
    // { label: "Bank Match", href: "/admin/bank-match", icon: ArrowLeftRight, badge: queueCounts["bank-match"] },
    // { label: "Arrears", href: "/admin/arrears", icon: AlertTriangle, badge: queueCounts["arrears"] },
    // { label: "Refunds", href: "/admin/refunds", icon: RotateCcw, badge: queueCounts["refunds"] },
    // { label: "Collections", href: "/admin/collections", icon: ShieldAlert, badge: queueCounts["collections"] },
    // { label: "Cancellations", href: "/admin/cancellations", icon: Ban },
    // { label: "Credit Pipeline", href: "/admin/finance-sync", icon: Eye, badge: queueCounts["finance-sync"] },
  ];

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-slate-800 bg-slate-900">
      {/* Brand */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-800 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
          <Landmark className="h-4 w-4 text-white" />
        </div>
        <span className="text-[15px] font-semibold text-white tracking-tight">
          Finance Hub
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-5">
        <ul className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all duration-150 ${
                    isActive
                      ? "bg-slate-800 text-white shadow-sm"
                      : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                  }`}
                >
                  <Icon
                    className={`h-[18px] w-[18px] shrink-0 ${
                      isActive ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-400"
                    }`}
                  />
                  <span className="flex-1">{item.label}</span>
                  {item.badge != null && item.badge > 0 && (
                    <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-slate-700 px-1.5 text-[10px] font-semibold text-slate-300">
                      {item.badge}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer — user avatar */}
      <div className="border-t border-slate-800 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600/20 text-xs font-bold text-indigo-400">
            A
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-200">
              Admin User
            </p>
            <p className="truncate text-[11px] text-slate-500">
              Finance Operations
            </p>
          </div>
        </div>
        <Link
          href="/admin/profile"
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-300 transition-colors hover:border-slate-600 hover:bg-slate-800/60 hover:text-slate-200"
        >
          View full profile
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>
    </aside>
  );
}
