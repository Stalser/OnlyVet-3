// app/backoffice/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/lib/useCurrentUser";

/**
 * Единая точка входа в рабочий кабинет сотрудников.
 *
 * В зависимости от роли пользователя перенаправляет:
 * - registrar, admin → /backoffice/registrar
 * - vet              → /staff
 * - client / остальные → /account
 * - гость            → /auth/login
 */
export default function BackofficeEntryPage() {
  const router = useRouter();
  const { user, loading } = useCurrentUser();

  useEffect(() => {
    if (loading) return;

    // не авторизован → на логин
    if (!user) {
      router.replace("/auth/login");
      return;
    }

    // роутинг по ролям
    switch (user.role) {
      case "registrar":
      case "admin": {
        router.replace("/backoffice/registrar");
        break;
      }
      case "vet": {
        router.replace("/staff");
        break;
      }
      case "client":
      default: {
        router.replace("/account");
        break;
      }
    }
  }, [loading, user, router]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center space-y-2">
        <p className="text-sm text-gray-600">
          Перенаправляем в рабочий кабинет…
        </p>
        <p className="text-[11px] text-gray-400">
          Если страница долго не открывается, обновите её или войдите заново.
        </p>
      </div>
    </main>
  );
}
