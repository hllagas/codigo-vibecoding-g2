"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

export default function RootPage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/suppliers");
    } else {
      router.replace("/login");
    }
  }, [isAuthenticated, router]);

  // Minimal loading state while redirect happens
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="size-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
    </div>
  );
}
