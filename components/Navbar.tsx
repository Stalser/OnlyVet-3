"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import type { SupabaseClient } from "@supabase/supabase-js";

type AuthRole = "guest" | "user" | "staff";

export default function Navbar() {
  const [role, setRole] = useState<AuthRole>("guest");

  // Приводим supabase к клиенту с типом, чтобы TS не ругался
  const client: SupabaseClient | null = supabase;

  useEffect(() => {
    // Если Supabase не сконфигурирован – просто считаем всех гостями
    if (!client) {
      setRole("guest");
      return;
    }

    const getUser = async () => {
      const { data } = await client.auth.getUser();
      const metaRole =
        (data.user?.user_metadata?.role as AuthRole | undefined) ?? "user";
      setRole(metaRole === "staff" ? "staff" : "user");
    };

    void getUser();

    const { data: sub } = client.auth.onAuthStateChange(
      (_event, session) => {
        if (!session) {
          setRole("guest");
        } else {
          const metaRole =
            (session.user.user_metadata?.role as AuthRole | undefined) ??
            "user";
          setRole(metaRole === "staff" ? "staff" : "user");
        }
      }
    );

    return () => {
      sub.subscription.unsubscribe();
    };
  }, [client]);

  const handleLogout = async () => {
    if (!client) return;
    await client.auth.signOut();
    setRole("guest");
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  };

  // Настраиваем текст и ссылку для правой кнопки в зависимости от роли
  let authLabel = "Вход";
  let authHref = "/auth/login";

  if (role === "user") {
    authLabel = "Личный кабинет";
    authHref = "/account";
  } else if (role === "staff") {
    authLabel = "Рабочий кабинет";
    authHref = "/backoffice";
  }

  const isLoggedIn = role === "user" || role === "staff";

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
          {/* Вход / ЛК / Рабочий кабинет */}
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
