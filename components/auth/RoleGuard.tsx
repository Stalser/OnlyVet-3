"use client";

import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/lib/useCurrentUser";
import type { UserRole } from "@/lib/types";

export function RoleGuard({
  allowed,
  children,
}: {
  allowed: UserRole[];
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, loading } = useCurrentUser();

  if (loading) {
    return <div className="p-4 text-gray-500 text-sm">Загрузка…</div>;
  }

  if (!user || !allowed.includes(user.role)) {
    router.replace("/auth/login");
    return null;
  }

  return <>{children}</>;
}
