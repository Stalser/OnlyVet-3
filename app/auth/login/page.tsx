"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "../../../lib/supabaseClient";

export default function AuthLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!supabase) {
      setError(
        "Авторизация временно недоступна: Supabase не сконфигурирован на сервере."
      );
      return;
    }

    setPending(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;

      if (typeof window !== "undefined") {
        window.location.href = "/account";
      }
    } catch (err: any) {
      setError(err.message || "Не удалось войти. Проверьте данные.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-gray-800"
          >
            ← На главную
          </Link>
          <div className="text-sm font-semibold tracking-tight">OnlyVet</div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm px-6 py-7">
          <h1 className="text-xl font-semibold mb-1">
            Вход в личный кабинет
          </h1>
          <p className="text-xs text-gray-500 mb-5">
            Используйте email и пароль, указанные при регистрации. Если вы ещё
            не зарегистрированы — запросите доступ у администратора.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Пароль
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                placeholder="Введите пароль"
              />
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-xl bg-slate-900 text-white text-sm font-medium py-2.5 mt-1 disabled:opacity-50"
            >
              {pending ? "Входим..." : "Войти"}
            </button>
          </form>
        </div>

        <p className="mt-4 text-[11px] text-gray-500 text-center">
          Сервис не заменяет экстренную помощь. При угрозе жизни животного
          обращайтесь в ближайшую круглосуточную клинику.
        </p>
      </div>
    </main>
  );
}
