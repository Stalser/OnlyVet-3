"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Tab = "client" | "staff";

export default function LoginPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("client");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [staffEmail, setStaffEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [staffLoading, setStaffLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [staffMessage, setStaffMessage] = useState<string | null>(null);

  // 🔐 Вход по паролю (клиент / регистратор / врач / админ — все через этот поток)
  const handleClientLogin = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!supabase) {
      setErrorMessage("Ошибка: Supabase недоступен на клиенте.");
      return;
    }

    if (!email || !password) {
      setErrorMessage("Введите e-mail и пароль.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMessage("Неверный e-mail или пароль.");
      setLoading(false);
      return;
    }

    // ⭐️ ВАЖНЫЙ МОМЕНТ:
    // после успешного логина идём не в /account, а в /auth/after-login,
    // где по роли решаем, куда отправить (регистратор, клиент, врач и т.д.)
    setLoading(false);
    router.replace("/auth/after-login");
  };

  // ✉️ Магическая ссылка для сотрудников (если захочешь этим пользоваться)
  const handleStaffMagicLink = async (e: FormEvent) => {
    e.preventDefault();
    setStaffMessage(null);
    setErrorMessage(null);

    if (!supabase) {
      setErrorMessage("Supabase недоступен на клиенте.");
      return;
    }

    if (!staffEmail) {
      setErrorMessage("Введите e-mail сотрудника.");
      return;
    }

    setStaffLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email: staffEmail,
      options: {
        emailRedirectTo:
          typeof window !== "undefined"
            ? `${window.location.origin}/auth/after-login`
            : undefined,
      },
    });

    if (error) {
      setErrorMessage(
        "Не удалось отправить ссылку для входа. Проверьте e-mail."
      );
      setStaffLoading(false);
      return;
    }

    setStaffMessage(
      "Письмо со ссылкой для входа отправлено. Проверьте почту."
    );
    setStaffLoading(false);
  };

  return (
    <main className="flex min-h-[70vh] items-center justify-center px-4 py-8">
      <div className="w-full max-w-md rounded-2xl border bg-white p-6 shadow-sm">
        <h1 className="mb-4 text-xl font-bold tracking-tight">
          Вход в OnlyVet
        </h1>
        <p className="mb-4 text-xs text-gray-500">
          Войдите как клиент или как сотрудник. Регистраторы и врачи
          тоже используют вход по паролю.
        </p>

        {/* Табы */}
        <div className="mb-4 inline-flex rounded-xl bg-gray-100 p-1 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("client")}
            className={`rounded-lg px-3 py-1.5 transition ${
              activeTab === "client"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            Пользователь
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("staff")}
            className={`rounded-lg px-3 py-1.5 transition ${
              activeTab === "staff"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            Сотрудник
          </button>
        </div>

        {errorMessage && (
          <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {errorMessage}
          </div>
        )}

        {/* Вкладка "Пользователь" — вход по паролю */}
        {activeTab === "client" && (
          <form onSubmit={handleClientLogin} className="space-y-3 text-xs">
            <div>
              <label className="mb-1 block text-[11px] text-gray-500">
                E-mail
              </label>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border px-3 py-2 text-xs"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] text-gray-500">
                Пароль
              </label>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border px-3 py-2 text-xs"
                placeholder="Ваш пароль"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-xl bg-emerald-600 px-3 py-2 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {loading ? "Входим…" : "Войти"}
            </button>

            <p className="mt-2 text-[11px] text-gray-400">
              Под этим входом могут заходить клиенты, регистраторы, врачи
              и администраторы — роль определяется по данным профиля.
            </p>
          </form>
        )}

        {/* Вкладка "Сотрудник" — вход по magic link (опционально) */}
        {activeTab === "staff" && (
          <form
            onSubmit={handleStaffMagicLink}
            className="space-y-3 text-xs"
          >
            <div>
              <label className="mb-1 block text-[11px] text-gray-500">
                E-mail сотрудника
              </label>
              <input
                type="email"
                value={staffEmail}
                onChange={(e) => setStaffEmail(e.target.value)}
                className="w-full rounded-xl border px-3 py-2 text-xs"
                placeholder="staff@example.com"
              />
            </div>

            <button
              type="submit"
              disabled={staffLoading}
              className="mt-2 w-full rounded-xl bg-emerald-600 px-3 py-2 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {staffLoading
                ? "Отправляем ссылку…"
                : "Отправить ссылку для входа"}
            </button>

            {staffMessage && (
              <div className="mt-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] text-emerald-800">
                {staffMessage}
              </div>
            )}

            <p className="mt-2 text-[11px] text-gray-400">
              После перехода по ссылке сотрудник также будет перенаправлен
              на страницу определения роли и попадёт в свой кабинет.
            </p>
          </form>
        )}
      </div>
    </main>
  );
}
