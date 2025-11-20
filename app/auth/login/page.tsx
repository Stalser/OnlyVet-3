// app/auth/login/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type LoginMode = "user" | "staff";

export default function LoginPage() {
  const router = useRouter();

  const [mode, setMode] = useState<LoginMode>("user");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ВАЖНО:
  // - Для пользователей: password-login, роли и права подтягиваются на бэке из user_roles.
  // - Для сотрудников: используется отдельный поток /auth/staff/login (другая страница/флоу).
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode !== "user") return; // На всякий случай: форма используется только для пользователей.

    if (!email || !password) {
      setError("Введите e-mail и пароль");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Тут НЕ передаём роль — бэк сам определяет профиль и роли из user_roles.
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error || "Ошибка входа");
        return;
      }

      // После успешного логина бэк, опираясь на user_roles, решает куда пускать.
      // На фронте делаем общий редирект в пользовательскую зону.
      router.push("/");
      router.refresh();
    } catch {
      setError("Ошибка соединения. Попробуйте ещё раз.");
    } finally {
      setLoading(false);
    }
  };

  const handleModeChange = (nextMode: LoginMode) => {
    setMode(nextMode);
    setError(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f6f7] px-4">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-semibold text-center mb-2">
          Вход в OnlyVet
        </h1>

        <p className="text-center text-gray-500 text-sm mb-6">
          Войдите как клиент или как сотрудник.
          Для клиентов используется вход по паролю, для сотрудников — отдельный поток.
        </p>

        {/* Переключатель режимов: Пользователь / Сотрудник */}
        <div className="grid grid-cols-2 mb-6 rounded-lg overflow-hidden border border-gray-300">
          <button
            type="button"
            onClick={() => handleModeChange("user")}
            className={`py-2 text-sm font-medium transition ${
              mode === "user"
                ? "bg-black text-white"
                : "bg-white text-gray-700"
            }`}
          >
            Пользователь
          </button>
          <button
            type="button"
            onClick={() => handleModeChange("staff")}
            className={`py-2 text-sm font-medium transition ${
              mode === "staff"
                ? "bg-black text-white"
                : "bg-white text-gray-700"
            }`}
          >
            Сотрудник
          </button>
        </div>

        {/* Блок входа для ПОЛЬЗОВАТЕЛЯ (парольный вход) */}
        {mode === "user" && (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block mb-1 text-sm text-gray-700" htmlFor="email">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm placeholder:text-gray-400 focus:border-black outline-none"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block mb-1 text-sm text-gray-700" htmlFor="password">
                Пароль
              </label>
              <input
                id="password"
                type="password"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm placeholder:text-gray-400 focus:border-black outline-none"
                placeholder="Ваш пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm text-center">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
            >
              {loading ? "Входим..." : "Войти"}
            </button>
          </form>
        )}

        {/* Блок для СОТРУДНИКА: отдельный поток авторизации */}
        {mode === "staff" && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Для входа сотрудника используется отдельный поток авторизации.
              Роли и доступы подгружаются из&nbsp;
              <span className="font-mono text-xs bg-gray-100 px-1 py-0.5 rounded">
                user_roles
              </span>
              &nbsp;на стороне сервера.
            </p>

            <button
              type="button"
              onClick={() => router.push("/auth/staff/login")}
              className="w-full py-2 bg-black hover:bg-gray-900 text-white rounded-lg text-sm font-medium transition"
            >
              Перейти к входу сотрудника
            </button>
          </div>
        )}

        <p className="text-center text-gray-500 text-xs mt-4">
          После входа права доступа определяются автоматически по данным профиля и ролям в системе.
        </p>

        <p className="text-center text-sm mt-3">
          Нет аккаунта?{" "}
          <a
            href="/auth/register"
            className="text-blue-600 hover:underline"
          >
            Зарегистрироваться
          </a>
        </p>
      </div>
    </div>
  );
}
