"use client";

import React from "react";

type BadgeVariant = "green" | "red" | "yellow" | "blue" | "purple" | "gray";

interface BadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
  size?: "sm" | "md";
}

const variantStyles: Record<BadgeVariant, string> = {
  green: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  red: "bg-red-500/20 text-red-400 border-red-500/30",
  yellow: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  blue: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  purple: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  gray: "bg-slate-500/20 text-slate-400 border-slate-500/30",
};

export default function Badge({ variant, children, size = "sm" }: BadgeProps) {
  const sizeClass = size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm";

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${variantStyles[variant]} ${sizeClass}`}
    >
      {children}
    </span>
  );
}
