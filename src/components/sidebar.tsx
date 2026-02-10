"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ArrowLeftRight,
  RefreshCw,
  AlertTriangle,
  RotateCcw,
  ScrollText,
  Landmark,
} from "lucide-react";

import { useFinance } from "@/lib/finance-context";
import type { QueueKey } from "@/types/finance";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  countKey?: QueueKey;
  badgeColor?: string;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

const NAV_SECTIONS: NavSection[] = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
      { label: "Students", href: "/admin/students", icon: Users },
    ],
  },
  {
    title: "Action Queues",
    items: [
      {
        label: "Bank Match",
        href: "/admin/bank-match",
        icon: ArrowLeftRight,
        countKey: "bank-match",
        badgeColor: "bg-blue-500/20 text-blue-300",
      },
      {
        label: "Finance Sync",
        href: "/admin/finance-sync",
        icon: RefreshCw,
        countKey: "finance-sync",
        badgeColor: "bg-amber-500/20 text-amber-300",
      },
      {
        label: "Arrears",
        href: "/admin/arrears",
        icon: AlertTriangle,
        countKey: "arrears",
        badgeColor: "bg-red-500/20 text-red-300",
      },
      {
        label: "Refunds",
        href: "/admin/refunds",
        icon: RotateCcw,
        countKey: "refunds",
        badgeColor: "bg-violet-500/20 text-violet-300",
      },
    ],
  },
  {
    title: "System",
    items: [
      { label: "Audit Log", href: "/admin/audit-log", icon: ScrollText },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { queueCounts } = useFinance();

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
        {NAV_SECTIONS.map((section) => (
          <div key={section.title} className="mb-6">
            <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-widest text-slate-500">
              {section.title}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                const count = item.countKey
                  ? queueCounts[item.countKey]
                  : undefined;
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
                      {count != null && count > 0 && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                            isActive
                              ? "bg-indigo-600/30 text-indigo-300"
                              : item.badgeColor ?? "bg-slate-700 text-slate-300"
                          }`}
                        >
                          {count}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
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
      </div>
    </aside>
  );
}
