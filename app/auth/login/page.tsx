// app/auth/login/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Введите e-mail и пароль");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error || "Ошибка входа");
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Ошибка сети. Попробуйте ещё раз.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f6f7] px-4">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-semibold text-center mb-2">
          Вход в OnlyVet
        </h1>

        <p className="text-center text-gray-500 text-sm mb-6">
          Введите свои учётные данные для входа в систему.
        </p>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label
              className="block mb-1 text-sm text-gray-700"
              htmlFor="email"
            >
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
            <label
              className="block mb-1 text-sm text-gray-700"
              htmlFor="password"
            >
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

        <p className="text-center text-gray-500 text-xs mt-4">
          Под этим входом могут авторизоваться все пользователи системы.
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
