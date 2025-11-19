"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "../../../lib/supabaseClient";
import type { SupabaseClient } from "@supabase/supabase-js";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!supabase) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p>Supabase не сконфигурирован</p>
      </main>
    );
  }

  const client: SupabaseClient = supabase;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // 1. Создаём auth-пользователя
      const { data: signUpData, error: signUpErr } = await client.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: "user", // важно
          },
        },
      });

      if (signUpErr) {
        setError(signUpErr.message);
        setLoading(false);
        return;
      }

      const user = signUpData.user;
      if (!user) {
        setError("Регистрация не завершена. Попробуйте позже.");
        setLoading(false);
        return;
      }

      // 2. Проверяем owner_profiles (вдруг был создан ранее оператором)
      const { data: existingOwner } = await client
        .from("owner_profiles")
        .select("id, auth_id")
        .eq("auth_id", user.id)
        .maybeSingle();

      if (!existingOwner) {
        // 3. Создаём карточку owner_profiles
        await client.from("owner_profiles").insert({
          full_name: fullName,
          phone,
          auth_id: user.id,
        });
      } else {
        // 3b. Если есть — обновляем поля, чтобы подтянуть данные
        await client
          .from("owner_profiles")
          .update({ full_name: fullName, phone })
          .eq("auth_id", user.id);
      }

      // 4. Вход после регистрации
      await client.auth.signInWithPassword({ email, password });

      // 5. Редирект
      window.location.href = "/account";
    } catch (err: any) {
    setError("Ошибка регистрации. " + err.message);
    } finally {
    setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center py-10">
      <div className="w-full max-w-md bg-white border rounded-2xl p-6 space-y-6">

        <h1 className="text-xl font-semibold text-center">Регистрация в OnlyVet</h1>
        <p className="text-center text-xs text-gray-600">
          Создайте личный кабинет владельца
        </p>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          {/* ФИО */}
          <div className="space-y-1">
            <label className="text-xs text-gray-600">ФИО</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
              placeholder="Например: Иванова Анна Сергеевна"
            />
          </div>

          {/* Телефон */}
          <div className="space-y-1">
            <label className="text-xs text-gray-600">Телефон / Telegram</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
              placeholder="+7 900 000-00-00 или @username"
            />
          </div>

          {/* Email */}
          <div className="space-y-1">
            <label className="text-xs text-gray-600">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-xl.border border-gray-200 text-sm"
              placeholder="you@example.com"
            />
          </div>

          {/* Пароль */}
          <div className="space-y-1">
            <label className="text-xs text-gray-600">Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
              placeholder="Минимум 6 символов"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl px-4 py-2 bg-black text-white text-sm font-medium hover:bg-gray-900 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Создание..." : "Зарегистрироваться"}
          </button>
        </form>

        <p className="text-center text-xs text-gray-600">
          Уже есть аккаунт?{" "}
          <Link
            href="/auth/login"
            className="underline underline-offset-2 text-blue-600"
          >
            Войти
          </Link>
        </p>
      </div>
    </main>
  );
}
