"use client";

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Skip authentication checks in demo mode
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      return;
    }

    // Only redirect unauthenticated users from protected pages
    if (pathname !== '/login' && pathname !== '/' && !isAuthenticated()) {
      router.replace('/login');
    }
  }, [pathname, router]);

  // Always render children - no loading states
  return <>{children}</>;
}