import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import AuthGuard from "@/components/AuthGuard";

export const metadata: Metadata = {
  title: "Aram Warehouse",
  description: "Electronics & Mobile Parts Shop - Admin Inventory Management",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AuthGuard>
            {children}
          </AuthGuard>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
