// components/Navbar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { supabase } from "@/lib/supabaseClient";
import type { SupabaseClient } from "@supabase/supabase-js";

type UserRole = "client" | "registrar" | "vet" | "admin";
type EffectiveRole = UserRole | "guest";

export default function Navbar() {
  const pathname = usePathname();
  const { user, loading } = useCurrentUser();

  // ---- Fallback по URL (если хук ещё не успел отработать) ----
  const inClientCabinet = pathname.startsWith("/account");
  const inRegistrarCabinet = pathname.startsWith("/backoffice");
  const inVetCabinet = pathname.startsWith("/staff");

  let effectiveRole: EffectiveRole = "guest";

  if (user?.role) {
    effectiveRole = user.role as UserRole;
  } else if (inRegistrarCabinet) {
    effectiveRole = "registrar";
  } else if (inVetCabinet) {
    effectiveRole = "vet";
  } else if (inClientCabinet) {
    effectiveRole = "client";
  }

  const isAuthed = effectiveRole !== "guest";
  const isStaff =
    effectiveRole === "registrar" ||
    effectiveRole === "vet" ||
    effectiveRole === "admin";

  // ---- Куда ведёт ссылка кабинета и текст ----
  let cabinetHref = "/auth/login";
  let cabinetLabel = "Вход";

  if (isAuthed && isStaff) {
    cabinetHref = effectiveRole === "vet" ? "/staff" : "/backoffice/registrar";
    cabinetLabel = "Рабочий кабинет";
  } else if (isAuthed && !isStaff) {
    cabinetHref = "/account";
    cabinetLabel = "Личный кабинет";
  }

  // ---- Выход из аккаунта ----
  const handleLogout = async () => {
    const client = supabase as SupabaseClient | null;

    try {
      if (client) {
        await client.auth.signOut();
      }
    } finally {
      // В любом случае уводим на страницу входа
      window.location.href = "/auth/login";
    }
  };

  const linkClass = (href: string) =>
    pathname === href
      ? "text-sm font-semibold text-gray-900"
      : "text-sm text-gray-600 hover:text-gray-900";

  return (
    <nav className="border-b bg-white">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        {/* Логотип слева — как было изначально */}
        <Link href="/" className="text-sm font-semibold text-gray-900">
          OnlyVet{" "}
          <span className="ml-1 text-xs font-normal text-gray-500">
            — онлайн-ветеринария
          </span>
        </Link>

        {/* Центральное меню */}
        <div className="flex items-center gap-6">
          <Link href="/services" className={linkClass("/services")}>
            Услуги
          </Link>
          <Link href="/doctors" className={linkClass("/doctors")}>
            Врачи
          </Link>
          <Link href="/docs" className={linkClass("/docs")}>
            Документы
          </Link>
        </div>

        {/* Правая часть */}
        <div className="flex items-center gap-4">
          {loading ? (
            <span className="text-xs text-gray-500">Загрузка…</span>
          ) : (
            <>
              {/* Кабинет / Вход */}
              <Link
                href={cabinetHref}
                className="text-sm text-gray-700 hover:text-gray-900 underline underline-offset-4"
              >
                {cabinetLabel}
              </Link>

              {/* Разный набор кнопок для ролей */}
              {isAuthed ? (
                isStaff ? (
                  // ---- Сотрудник: только рабочий кабинет + выйти ----
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="text-sm text-gray-600 hover:text-red-700"
                  >
                    Выйти
                  </button>
                ) : (
                  // ---- Клиент: ЛК + Выйти + Записаться ----
                  <>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="text-sm text-gray-600 hover:text-red-700"
                    >
                      Выйти
                    </button>
                    <Link
                      href="/booking"
                      className="rounded-full bg-black px-4 py-1.5 text-sm font-medium text-white hover:bg-gray-900"
                    >
                      Записаться
                    </Link>
                  </>
                )
              ) : (
                // ---- Гость: Вход + Записаться ----
                <Link
                  href="/booking"
                  className="rounded-full bg-black px-4 py-1.5 text-sm font-medium text-white hover:bg-gray-900"
                >
                  Записаться
                </Link>
              )}
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
