// app/auth/login/page.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

type LoginFormState = {
  login: string;
  password: string;
};

export default function LoginPage() {
  const router = useRouter();

  const [form, setForm] = React.useState<LoginFormState>({
    login: "",
    password: "",
  });

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleChange =
    (field: keyof LoginFormState) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!form.login || !form.password) {
      setError("Введите логин и пароль.");
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const message =
          data?.error || "Ошибка авторизации. Проверьте логин и пароль.";
        setError(message);
        return;
      }

      // РОЛИ: бэк берёт их из user_roles и возвращает { role: "client" | "staff" | ... }
      const role = data?.role as string | undefined;

      if (role === "staff") {
        router.push("/staff");
      } else if (role === "client") {
        router.push("/account");
      } else {
        router.push("/account");
      }

      router.refresh();
    } catch (err) {
      console.error(err);
      setError("Что-то пошло не так. Попробуйте ещё раз.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900 text-slate-50">
      {/* Левая часть — бренд и описание */}
      <div className="relative flex-1 flex flex-col justify-between px-8 py-6 lg:px-16 lg:py-10 overflow-hidden">
        {/* Фоновые круги */}
        <div className="absolute inset-0 pointer-events-none opacity-40">
          <div className="absolute -left-32 -top-32 h-72 w-72 rounded-full bg-sky-600/30 blur-3xl" />
          <div className="absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl" />
        </div>

        <header className="relative z-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-500/20 border border-sky-400/40 text-sky-200 font-semibold text-lg">
            OV
          </div>
          <div>
            <div className="text-sm uppercase tracking-[0.2em] text-sky-300/80">
              OnlyVet
            </div>
            <div className="text-xs text-slate-400">
              Онлайн-клиника для ветеринарных врачей и владельцев
            </div>
          </div>
        </header>

        <main className="relative z-10 mt-16 lg:mt-24 max-w-xl">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight">
            Панель управления <span className="text-sky-300">OnlyVet</span>
          </h1>
          <p className="mt-4 text-sm sm:text-base text-slate-300/90 max-w-lg">
            Авторизуйтесь, чтобы управлять онлайн-приёмами, пациентами и
            клинической документацией. Создано для практикующих ветеринарных
            врачей и клиник.
          </p>

          <div className="mt-8 grid gap-4 text-xs text-slate-300/80">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <p>
                Онлайн-консультации, история пациентов и лабораторные данные в одном
                месте.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-sky-400" />
              <p>Адаптировано под российскую ветеринарную практику и телемедицину.</p>
            </div>
          </div>
        </main>

        <footer className="relative z-10 mt-10 text-[11px] text-slate-500">
          © {new Date().getFullYear()} OnlyVet. Ветеринарная онлайн-клиника.
        </footer>
      </div>

      {/* Правая часть — форма логина */}
      <div className="flex-1 flex items-center justify-center px-6 py-8 lg:px-10 bg-slate-950/60 backdrop-blur">
        <div className="w-full max-w-md border border-slate-800 bg-slate-950/80 shadow-2xl shadow-slate-950/40 rounded-2xl p-6">
          <div className="mb-4 space-y-1">
            <h2 className="text-xl font-semibold">Вход в систему</h2>
            <p className="text-xs text-slate-400">
              Введите свои учётные данные для доступа к панели управления OnlyVet.
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label
                htmlFor="login"
                className="block text-sm font-medium text-slate-200"
              >
                Email или телефон
              </label>
              <input
                id="login"
                type="text"
                autoComplete="username"
                placeholder="vet@clinic.ru или +7…"
                value={form.login}
                onChange={handleChange("login")}
                className="w-full px-3 py-2 rounded-md text-sm bg-slate-950/80 border border-slate-700 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-200"
              >
                Пароль
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="Ваш пароль"
                value={form.password}
                onChange={handleChange("password")}
                className="w-full px-3 py-2 rounded-md text-sm bg-slate-950/80 border border-slate-700 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              />
              <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
                <span>Не сообщайте пароль третьим лицам.</span>
                <button
                  type="button"
                  className="underline underline-offset-2 hover:text-sky-300 transition-colors"
                  onClick={() => router.push("/forgot-password")}
                >
                  Забыли пароль?
                </button>
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-400 bg-red-950/40 border border-red-900/60 rounded-md px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium bg-sky-600 hover:bg-sky-500 text-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting && (
                <span className="mr-2 h-4 w-4 border-2 border-slate-50/60 border-t-transparent rounded-full animate-spin" />
              )}
              Войти
            </button>

            <div className="pt-3 border-t border-slate-800 mt-4 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Нет учётной записи?</span>
              <button
                type="button"
                className="font-medium text-sky-300 hover:text-sky-200 underline underline-offset-2"
                onClick={() => router.push("/auth/register")}
              >
                Зарегистрироваться
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
