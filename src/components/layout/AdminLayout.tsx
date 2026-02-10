"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { clearAuthentication } from "@/lib/auth";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const handleLogout = () => {
    clearAuthentication();
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar onLogout={handleLogout} />
      <div className="ml-[220px]">
        <Header />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
