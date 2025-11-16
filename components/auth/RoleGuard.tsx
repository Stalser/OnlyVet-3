"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/lib/useCurrentUser";

interface RoleGuardProps {
  children: ReactNode;
  allowed: ("client" | "registrar" | "vet" | "admin")[];
}

export function RoleGuard({ children, allowed }: RoleGuardProps) {
  const { user, loading } = useCurrentUser();
  const router = useRouter();

  // Если пользователь не залогинен — отправляем на логин
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth/login");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10 text-xs text-gray-500">
        Загрузка…
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Базовая роль из useCurrentUser
  let effectiveRole = (user.role ?? "client") as
    | "client"
    | "registrar"
    | "vet"
    | "admin";

  const email = (user.email ?? "").toLowerCase();

  // 💡 Временный хак: аккаунт doctor@onlyvet.com считаем врачом (vet)
  if (email === "doctor@onlyvet.com") {
    effectiveRole = "vet";
  }

  // Если роль не разрешена — отправляем в личный кабинет
  if (!allowed.includes(effectiveRole)) {
    router.replace("/account");
    return null;
  }

  return <>{children}</>;
}
