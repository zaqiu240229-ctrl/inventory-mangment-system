"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { ChevronDown, Bell, Cpu } from "lucide-react";
import { ModeToggle } from "@/components/theme-toggle";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/products": "Products",
  "/products/recovery": "Product Recovery",
  "/stock": "Stock Management",
  "/categories": "Categories",
  "/transactions": "Transactions & Reports",

  "/alerts": "Alerts",
  "/logs": "Activity Logs",
};

export default function Header() {
  const pathname = usePathname();
  const title = pageTitles[pathname] || "Dashboard";

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6 sticky top-0 z-30">
      {/* Left - Page Title & Breadcrumb */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-blue-400" />
          <h1 className="text-lg font-semibold text-foreground">{title}</h1>
        </div>
      </div>

      {/* Right - Actions */}
      <div className="flex items-center gap-3">
        {/* Theme Toggle */}
        <ModeToggle />

        {/* Admin */}
        <div className="flex items-center gap-2 ml-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
            A
          </div>
          <span className="text-sm font-medium text-foreground">Admin</span>
          <ChevronDown className="w-4 h-4 text-slate-500" />
        </div>
      </div>
    </header>
  );
}
