"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import type { SupabaseClient } from "@supabase/supabase-js";

type UserRole = "guest" | "client" | "registrar" | "vet" | "admin";

export default function Navbar() {
  const [role, setRole] = useState<UserRole>("guest");
  const [loading, setLoading] = useState(true);

  // Если supabase не сконфигурирован – считаем всех гостями
  if (!supabase) {
    return (
      <header className="border-b border-gray-100 bg-white/90 backdrop-blur-sm">
        <div className="container flex h-14 items-center justify-between gap-4">
          <Link href="/" className="font-semibold text-sm tracking-tight">
            OnlyVet
          </Link>

          <nav className="hidden sm:flex items-center gap-4 text-xs text-gray-700">
            <Link href="/services" className="hover:text-black transition-colors">
              Услуги
            </Link>
            <Link href="/doctors" className="hover:text-black transition-colors">
              Врачи
            </Link>
            <Link href="/docs" className="hover:text-black transition-colors">
              Документы
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/auth/login"
              className="text-xs text-gray-700 hover:text-black underline underline-offset-2"
            >
              Вход
            </Link>
            <Link
              href="/booking"
              className="rounded-xl px-4 py-1.5 bg-black text-white text-xs font-medium hover:bg-gray-900"
            >
              Записаться
            </Link>
          </div>
        </div>
      </header>
    );
  }

  const client: SupabaseClient = supabase;

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setLoading(true);

      // 1. Текущий пользователь
      const { data, error } = await client.auth.getUser();
      if (error || !data.user) {
        if (!isMounted) return;
        setRole("guest");
        setLoading(false);
        return;
      }

      const user = data.user;

      // 2. Читаем роли из user_roles
      const { data: rolesData, error: rolesErr } = await client
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      if (rolesErr || !rolesData || rolesData.length === 0) {
        // нет записи в user_roles → считаем обычным клиентом
        if (!isMounted) return;
        setRole("client");
        setLoading(false);
        return;
      }

      const roles = rolesData.map((r: any) => r.role as string);

      let nextRole: UserRole = "client";
      if (roles.includes("registrar")) nextRole = "registrar";
      else if (roles.includes("vet")) nextRole = "vet";
      else if (roles.includes("admin")) nextRole = "admin";
      else nextRole = "client";

      if (!isMounted) return;
      setRole(nextRole);
      setLoading(false);
    };

    load();

    // Подписка на изменение сессии, чтобы роли обновлялись без перезагрузки
    const { data: sub } = client.auth.onAuthStateChange(() => {
      load();
    });

    return () => {
      isMounted = false;
      sub.subscription.unsubscribe();
    };
  }, [client]);

  const handleLogout = async () => {
    if (!supabase) return;
    await client.auth.signOut();
    setRole("guest");
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  };

  // Подбираем текст и ссылку в зависимости от роли
  let authLabel = "Вход";
  let authHref = "/auth/login";

  if (role === "client") {
    authLabel = "Личный кабинет";
    authHref = "/account";
  } else if (role === "registrar" || role === "admin" || role === "vet") {
    authLabel = "Рабочий кабинет";
    // пока один общий вход: регистратор/админ → backoffice, врач → staff
    if (role === "vet") {
      authHref = "/staff";
    } else {
      authHref = "/backoffice/registrar";
    }
  }

  const isLoggedIn = role !== "guest";

  return (
    <header className="border-b border-gray-100 bg-white/90 backdrop-blur-sm">
      <div className="container flex h-14 items-center justify-between gap-4">
        {/* Лого */}
        <Link href="/" className="font-semibold text-sm tracking-tight">
          OnlyVet
        </Link>

        {/* Меню */}
        <nav className="hidden sm:flex items-center gap-4 text-xs text-gray-700">
          <Link href="/services" className="hover:text-black transition-colors">
            Услуги
          </Link>
          <Link href="/doctors" className="hover:text-black transition-colors">
            Врачи
          </Link>
          <Link href="/docs" className="hover:text-black transition-colors">
            Документы
          </Link>
        </nav>

        {/* Правый блок */}
        <div className="flex items-center gap-3">
          {/* ЛК / Рабочий кабинет / Вход */}
          <Link
            href={authHref}
            className="text-xs text-gray-700 hover:text-black underline underline-offset-2"
          >
            {authLabel}
          </Link>

          {/* Выйти */}
          {isLoggedIn && (
            <button
              type="button"
              onClick={handleLogout}
              className="text-xs px-3 py-1.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              Выйти
            </button>
          )}

          {/* Записаться */}
          <Link
            href="/booking"
            className="rounded-xl px-4 py-1.5 bg-black text-white text-xs font-medium hover:bg-gray-900"
          >
            Записаться
          </Link>
        </div>
      </div>
    </header>
  );
}
