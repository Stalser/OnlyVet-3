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

  // 1. Если пользователь не залогинен — отправляем на логин
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth/login");
    }
  }, [loading, user, router]);

  // 2. Если пользователь залогинен, но роль не подходит — отправляем в клиентский кабинет
  useEffect(() => {
    if (loading || !user) return;

    const effectiveRole = (user.role ?? "client") as
      | "client"
      | "registrar"
      | "vet"
      | "admin";

    if (!allowed.includes(effectiveRole)) {
      router.replace("/account");
    }
  }, [loading, user, allowed, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10 text-xs text-gray-500">
        Загрузка…
      </div>
    );
  }

  if (!user) {
    // редирект уже запущен выше
    return null;
  }

  const effectiveRole = (user.role ?? "client") as
    | "client"
    | "registrar"
    | "vet"
    | "admin";

  if (!allowed.includes(effectiveRole)) {
    // редирект уже запущен выше, здесь просто ничего не рендерим
    return null;
  }

  return <>{children}</>;
}
