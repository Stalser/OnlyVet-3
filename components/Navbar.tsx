"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { supabase } from "@/lib/supabaseClient";
import type { SupabaseClient } from "@supabase/supabase-js";

type UserRole = "client" | "registrar" | "vet" | "admin";

export default function Navbar() {
  const pathname = usePathname();
  const { user, loading } = useCurrentUser();

  const isAuthed = !!user;
  const role = (user?.role ?? "client") as UserRole;
  const isStaff = role === "registrar" || role === "vet" || role === "admin";

  // Также ориентируемся на URL — на случай, если хук ещё не успел загрузить пользователя
  const isRegistrarArea = pathname.startsWith("/backoffice");
  const isVetArea = pathname.startsWith("/staff");
  const isClientArea = pathname.startsWith("/account");

  // Куда ведёт ссылка "кабинет" и как она подписана
  let dashboardHref = "/auth/login";
  let dashboardLabel = "Вход";

  if (isAuthed && isStaff) {
    // сотрудник: регистратор / врач / админ
    dashboardHref = role === "vet" ? "/staff" : "/backoffice/registrar";
    dashboardLabel = "Рабочий кабинет";
  } else if (isAuthed && !isStaff) {
    // обычный клиент
    dashboardHref = "/account";
    dashboardLabel = "Личный кабинет";
  } else {
    // гость, но уже внутри какого-то кабинета → подстраиваем подпись
    if (isRegistrarArea || isVetArea) {
      dashboardHref = isVetArea ? "/staff" : "/backoffice/registrar";
      dashboardLabel = "Рабочий кабинет";
    } else if (isClientArea) {
      dashboardHref = "/account";
      dashboardLabel = "Личный кабинет";
    }
  }

  const linkClass = (href: string) =>
    `text-sm ${
      pathname === href
        ? "font-semibold text-gray-900"
        : "text-gray-600 hover:text-gray-900"
    }`;

  const handleLogout = async () => {
    try {
      if (supabase) {
        const client: SupabaseClient = supabase;
        await client.auth.signOut();
      }
    } finally {
      // В любом случае отправляем на страницу входа
      window.location.href = "/auth/login";
    }
  };

  return (
    <nav className="border-b bg-white">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        {/* Логотип слева — как в исходном дизайне */}
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
              {/* Личный / Рабочий кабинет / Вход */}
              <Link
                href={dashboardHref}
                className="text-sm text-gray-700 hover:text-gray-900 underline underline-offset-4"
              >
                {dashboardLabel}
              </Link>

              {/* Кнопка "Записаться" — всегда доступна */}
              <Link
                href="/booking"
                className="rounded-full bg-black px-4 py-1.5 text-sm font-medium text-white hover:bg-gray-900"
              >
                Записаться
              </Link>

              {/* Кнопка "Выйти" только для авторизованных */}
              {isAuthed && (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-sm text-gray-600 hover:text-red-700"
                >
                  Выйти
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
