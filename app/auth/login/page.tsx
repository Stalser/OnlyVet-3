"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";
import type { SupabaseClient } from "@supabase/supabase-js";

export default function LoginPage() {
  const router = useRouter();

  const [tab, setTab] = useState<"user" | "staff">("user");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!supabase) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <h1 className="text-xl font-semibold">Ошибка конфигурации</h1>
          <p className="text-sm text-gray-600">
            Supabase не сконфигурирован. Проверьте переменные окружения.
          </p>
        </div>
      </main>
    );
  }

  const client: SupabaseClient = supabase;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data, error: signInErr } = await client.auth.signInWithPassword({
        email,
        password,
      });

      if (signInErr) {
        console.error("SIGN IN ERROR", signInErr);
        setError("Неверный e-mail или пароль.");
        setLoading(false);
        return;
      }

      const user = data.user;
      if (!user) {
        setError("Не удалось выполнить вход. Попробуйте позже.");
        setLoading(false);
        return;
      }

      // 👇 ВРЕМЕННАЯ ЛОГИКА:
      // вкладка решает, куда отправить после успешного входа
      if (tab === "staff") {
        router.push("/staff");
      } else {
        router.push("/account");
      }
    } catch (err: any) {
      console.error("LOGIN UNKNOWN ERROR", err);
      setError("Ошибка при входе: " + (err?.message ?? "неизвестная ошибка"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center py-10">
      <div className="w-full max-w-md bg-white border rounded-2xl p-6 space-y-6">
        <h1 className="text-xl font-semibold text-center">Вход в OnlyVet</h1>

        <p className="text-center text-xs text-gray-600">
          Войдите как клиент или как сотрудник. Для разработки доступ к
          интерфейсу сотрудника определяется выбранной вкладкой.
        </p>

        {/* Табы Пользователь / Сотрудник */}
        <div className="flex border rounded-xl overflow-hidden text-xs">
          <button
            type="button"
            onClick={() => setTab("user")}
            className={`flex-1 py-2 ${
              tab === "user"
                ? "bg-black text-white"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            Пользователь
          </button>
          <button
            type="button"
            onClick={() => setTab("staff")}
            className={`flex-1 py-2 ${
              tab === "staff"
                ? "bg-black text-white"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            Сотрудник
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs text-gray-600">E-mail</label>
            <input
              type="email"
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-black"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-gray-600">Пароль</label>
            <input
              type="password"
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-black"
              placeholder="Ваш пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl px-4 py-2 bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading
              ? "Выполняем вход..."
              : tab === "staff"
              ? "Войти как сотрудник"
              : "Войти"}
          </button>
        </form>

        <p className="text-center text-[11px] text-gray-500">
          После входа вы будете перенаправлены либо в личный кабинет, либо в
          интерфейс сотрудника в зависимости от выбранной вкладки. Это
          временное поведение для разработки.
        </p>

        <p className="text-center text-xs text-gray-600 mt-3">
          Нет аккаунта?{" "}
          <Link
            href="/auth/register"
            className="underline underline-offset-2 text-blue-600"
          >
            Зарегистрироваться
          </Link>
        </p>
      </div>
    </main>
  );
}
