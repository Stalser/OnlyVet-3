// app/auth/after-login/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";
import type { SupabaseClient } from "@supabase/supabase-js";

type UserRole = "client" | "vet" | "registrar" | "admin";

export default function AfterLoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  if (!supabase) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-sm text-gray-600">
          Supabase не сконфигурирован. Проверьте переменные окружения.
        </p>
      </main>
    );
  }

  const client: SupabaseClient = supabase;

  useEffect(() => {
    const run = async () => {
      setError(null);

      // 1. Берём текущего пользователя
      const { data: userData, error: userErr } = await client.auth.getUser();
      if (userErr) {
        console.error("AFTER LOGIN: getUser error", userErr);
        setError("Не удалось получить пользователя. Попробуйте войти заново.");
        router.replace("/auth/login");
        return;
      }

      const user = userData.user;
      if (!user) {
        router.replace("/auth/login");
        return;
      }

      // 2. Читаем роли из user_roles
      const { data: rolesData, error: rolesErr } = await client
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      if (rolesErr) {
        console.error("AFTER LOGIN: roles error", rolesErr);
        // Если не смогли прочитать роли — считаем клиентом
        router.replace("/account");
        return;
      }

      const roles = (rolesData ?? []) as { role: UserRole }[];

      const hasVet = roles.some((r) => r.role === "vet");
      const hasRegistrar = roles.some((r) => r.role === "registrar");
      const hasAdmin = roles.some((r) => r.role === "admin");
      const hasClient = roles.some((r) => r.role === "client");

      // 3. Маршрутизация по ролям
      if (hasRegistrar) {
        // Панель регистратора
        router.replace("/backoffice/registrar");
      } else if (hasVet) {
        // Интерфейс врача
        router.replace("/staff");
      } else if (hasAdmin) {
        // Временно – в backoffice (потом сделаем /admin)
        router.replace("/backoffice/registrar");
      } else if (hasClient || roles.length === 0) {
        // Обычный клиент (или ролей нет)
        router.replace("/account");
      } else {
        // На всякий случай – в личный кабинет
        router.replace("/account");
      }
    };

    run();
  }, [client, router]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center space-y-2">
        <p className="text-sm text-gray-600">Определяем ваш профиль…</p>
        {error && (
          <p className="text-xs text-red-600 max-w-xs mx-auto">{error}</p>
        )}
      </div>
    </main>
  );
}
