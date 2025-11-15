"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

type AuthState = "unknown" | "guest" | "user";

export default function Navbar() {
  const [authState, setAuthState] = useState<AuthState>("unknown");

  useEffect(() => {
    if (!supabase) {
      setAuthState("guest");
      return;
    }

    // первичная проверка сессии
    supabase.auth.getSession().then(({ data }) => {
      setAuthState(data.session ? "user" : "guest");
    });

    // подписка на изменения auth-состояния
    const { data: sub } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setAuthState(session ? "user" : "guest");
      }
    );

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  const isUser = authState === "user";

  const authLinkHref = isUser ? "/account" : "/auth/login";
  const authLinkLabel = isUser ? "Личный кабинет" : "Вход";

  return (
    <header className="border-b border-gray-100 bg-white/90 backdrop-blur-sm">
      <div className="container flex h-14 items-center justify-between gap-4">
        {/* Лого */}
        <Link href="/" className="font-semibold text-sm tracking-tight">
          OnlyVet
        </Link>

        {/* Навигация */}
        <nav className="hidden sm:flex items-center gap-4 text-xs text-gray-700">
          <Link
            href="/services"
            className="hover:text-black transition-colors"
          >
            Услуги
          </Link>
          <Link
            href="/doctors"
            className="hover:text-black transition-colors"
          >
            Врачи
          </Link>
          <Link
            href="/docs"
            className="hover:text-black transition-colors"
          >
            Документы
          </Link>
        </nav>

        {/* Правый блок: Вход / Личный кабинет + Записаться */}
        <div className="flex items-center gap-3">
          {/* Вход / ЛК */}
          <Link
            href={authLinkHref}
            className="text-xs text-gray-700 hover:text-black underline underline-offset-2"
          >
            {authLinkLabel}
          </Link>

          {/* Кнопка "Записаться" */}
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
