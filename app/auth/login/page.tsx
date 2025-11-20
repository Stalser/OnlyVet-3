// app/auth/login/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Role = "user" | "staff";

export default function LoginPage() {
  const router = useRouter();

  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("user");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!login || !password) {
      setError("Введите логин и пароль");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        // ВАЖНО: роль уходит на бэкенд
        body: JSON.stringify({ login, password, role }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error || "Неверный логин или пароль");
        return;
      }

      // Редирект в зависимости от роли
      if (role === "user") {
        router.push("/"); // кабинет пользователя / главная
      } else {
        router.push("/staff"); // панель сотрудника
      }
      router.refresh();
    } catch (err) {
      setError("Ошибка соединения. Попробуйте ещё раз.");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (nextRole: Role) => {
    setRole(nextRole);
    setError(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-white px-4">
      <div className="w-full max-w-sm border border-neutral-800 rounded-xl p-6 bg-neutral-900">
        <h1 className="text-xl font-semibold mb-6">Вход в систему</h1>

        {/* Переключатель роли */}
        <div className="mb-6 flex text-sm rounded-lg border border-neutral-700 bg-neutral-800 overflow-hidden">
          <button
            type="button"
            onClick={() => handleRoleChange("user")}
            className={`flex-1 px-3 py-2 text-center transition-colors ${
              role === "user"
                ? "bg-sky-600 text-white"
                : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
            }`}
          >
            Пользователь
          </button>
          <button
            type="button"
            onClick={() => handleRoleChange("staff")}
            className={`flex-1 px-3 py-2 text-center transition-colors ${
              role === "staff"
                ? "bg-sky-600 text-white"
                : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
            }`}
          >
            Сотрудник
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block mb-1 text-sm" htmlFor="login">
              Логин
            </label>
            <input
              id="login"
              type="text"
              className="w-full px-3 py-2 rounded bg-neutral-800 border border-neutral-700 focus:border-sky-500 outline-none text-sm"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              placeholder={
                role === "user"
                  ? "Email или телефон пользователя"
                  : "Email или телефон сотрудника"
              }
            />
          </div>

          <div>
            <label className="block mb-1 text-sm" htmlFor="password">
              Пароль
            </label>
            <input
              id="password"
              type="password"
              className="w-full px-3 py-2 rounded bg-neutral-800 border border-neutral-700 focus:border-sky-500 outline-none text-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ваш пароль"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-950 border border-red-900 p-2 rounded">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded bg-sky-600 hover:bg-sky-500 transition-colors disabled:opacity-50 text-sm"
          >
            {loading ? "Входим..." : "Войти"}
          </button>
        </form>
      </div>
    </div>
  );
}
