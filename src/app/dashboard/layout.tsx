"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Package, FileText, Clock, Settings, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "Orders", href: "/dashboard/orders", icon: Package },
  { name: "Invoices", href: "/dashboard/invoices", icon: FileText },
  { name: "History", href: "/dashboard/history", icon: Clock },
  { name: "Account", href: "/dashboard/account", icon: Settings },
];

function LiveClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!now) return null;

  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const timeStr = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  return (
    <div className="mx-3 mt-4 rounded-xl bg-gradient-to-br from-green-600 to-green-800 p-4 shadow-lg">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-green-200 mb-1">
        Current Date &amp; Time
      </p>
      <p
        className="text-xl font-bold text-white tabular-nums leading-none"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {timeStr}
      </p>
      <p className="mt-1 text-xs text-green-200">{dateStr}</p>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  return (
    <div className="flex min-h-screen bg-[#f4f6f9]">
      {/* ── Sidebar ─────────────────────────────────────── */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-white shadow-xl border-r border-gray-100",
          "transform transition-transform duration-300 ease-in-out",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0 lg:static lg:flex-shrink-0"
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <Link href="/dashboard" className="flex items-center">
            <Image
              src="/logo.png"
              alt="eMALL Logo"
              width={140}
              height={80}
              className="transition-transform hover:scale-105"
              priority
            />
          </Link>
          <button
            className="p-1.5 rounded-lg hover:bg-gray-100 lg:hidden"
            onClick={toggleSidebar}
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Live clock widget */}
        <LiveClock />

        {/* Section label */}
        <p className="mt-6 mb-1 px-5 text-[10px] font-bold uppercase tracking-widest text-gray-400">
          Navigation
        </p>

        {/* Nav links */}
        <nav className="flex-1 space-y-0.5 px-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-150",
                  isActive
                    ? "bg-green-50 text-green-700 border-l-4 border-green-600 pl-3"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-800 border-l-4 border-transparent pl-3"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon
                  className={cn(
                    "h-4.5 w-4.5 flex-shrink-0 transition-colors",
                    isActive ? "text-green-600" : "text-gray-400 group-hover:text-gray-600"
                  )}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer tag */}
        <div className="px-5 py-4 border-t border-gray-100">
          <p className="text-[11px] text-gray-400 text-center">
            eMALL Packager Portal &copy; {new Date().getFullYear()}
          </p>
        </div>
      </aside>

      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}

      {/* ── Main content ────────────────────────────────── */}
      <div className="flex flex-1 min-w-0 flex-col">
        {/* Mobile header */}
        <header className="flex items-center gap-3 bg-white border-b border-gray-100 px-4 py-3 shadow-sm lg:hidden">
          <button
            className="p-2 rounded-lg hover:bg-gray-100"
            onClick={toggleSidebar}
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5 text-gray-600" />
          </button>
          <Image src="/logo.png" alt="eMALL Logo" width={100} height={56} priority />
        </header>

        {/* Desktop top bar */}
        <div className="hidden lg:flex items-center justify-between bg-white border-b border-gray-100 px-8 py-3 shadow-sm">
          <div>
            <h1 className="text-sm font-semibold text-gray-800">Packager Dashboard</h1>
            <p className="text-xs text-gray-400">Manage your orders, invoices, and history</p>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-green-50 border border-green-100 px-4 py-1.5">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-medium text-green-700">Active Session</span>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}