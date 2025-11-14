"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "../../../lib/supabaseClient";

type Tab = "user" | "staff";

export default function AuthLoginPage() {
  const [tab, setTab] = useState<Tab>("user");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleUserLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!supabase) {
      setError("Авторизация временно недоступна. Supabase не сконфигурирован.");
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

  async function handleStaffLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!supabase) {
      setError("Авторизация временно недоступна. Supabase не сконфигурирован.");
      return;
    }

    setPending(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo:
            typeof window !== "undefined"
              ? `${window.location.origin}/staff`
              : undefined,
        },
      });
      if (error) throw error;

      setMessage(
        "Мы отправили письмо со ссылкой для входа. Проверьте вашу почту."
      );
    } catch (err: any) {
      setError(err.message || "Не удалось отправить код. Попробуйте ещё раз.");
    } finally {
      setPending(false);
    }
  }

  const onSubmit = tab === "user" ? handleUserLogin : handleStaffLogin;

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        {/* Верхняя панель */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <Link href="/" className="hover:text-gray-800">
            ← На главную
          </Link>
          <div className="font-semibold text-gray-800">OnlyVet</div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm px-6 py-7 space-y-5">
          {/* ТАБЫ */}
          <div className="flex text-xs bg-slate-100 rounded-xl p-1">
            <button
              type="button"
              onClick={() => {
                setTab("user");
                setError(null);
                setMessage(null);
              }}
              className={`flex-1 py-2 rounded-lg ${
                tab === "user"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500"
              }`}
            >
              Пользователь
            </button>
            <button
              type="button"
              onClick={() => {
                setTab("staff");
                setError(null);
                setMessage(null);
              }}
              className={`flex-1 py-2 rounded-lg ${
                tab === "staff"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500"
              }`}
            >
              Сотрудник
            </button>
          </div>

          {/* ТЕКСТ ПОД ЗАГОЛОВКОМ */}
          {tab === "user" ? (
            <>
              <h1 className="text-lg font-semibold mb-1">
                Вход для пользователей
              </h1>
              <p className="text-xs text-gray-500 mb-4">
                Используйте email и пароль, указанные при регистрации.
                Если вы ещё не зарегистрированы — создайте аккаунт.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-lg.font-semibold.mb-1">
                Вход для сотрудников
              </h1>
              <p className="text-xs text-gray-500 mb-4">
                Введите рабочий email. На него будет отправлена ссылка для входа
                в кабинет сотрудника.
              </p>
            </>
          )}

          {/* ФОРМА */}
          <form onSubmit={onSubmit} className="space-y-3 text-xs">
            <div>
              <label className="block mb-1 font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                placeholder="you@example.com"
              />
            </div>

            {tab === "user" && (
              <div>
                <label className="block mb-1 font-medium text-gray-700">
                  Пароль
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.py-2 outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                  placeholder="Введите пароль"
                />
              </div>
            )}

            {error && (
              <div className="rounded-xl bg-red-50 px-3.py-2 text-[11px] text-red-700">
                {error}
              </div>
            )}
            {message && (
              <div className="rounded-xl bg-emerald-50 px-3.py-2 text-[11px] text-emerald-700">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-xl bg-slate-900 text-white text-sm font-medium py-2.5 mt-1 disabled:opacity-50"
            >
              {tab === "user"
                ? pending
                  ? "Входим..."
                  : "Войти"
                : pending
                ? "Отправляем ссылку..."
                : "Отправить код на почту"}
            </button>
          </form>

          {tab === "user" && (
            <div className="text-[11px] text-gray-500 mt-2 flex justify-between">
              <Link
                href="/auth/register"
                className="underline underline-offset-2 hover:text-gray-800"
              >
                Зарегистрироваться
              </Link>
              <span className="text-gray-400">
                Доступ для сотрудников выдаёт администратор.
              </span>
            </div>
          )}
        </div>

        <p className="text-[11px] text-gray-500 text-center">
          Сервис не заменяет экстренную помощь. При угрозе жизни животного
          обращайтесь в ближайшую круглосуточную клинику.
        </p>
      </div>
    </main>
  );
}
