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

  // Куда ведёт ссылка на кабинет + подпись
  let dashboardHref = "/auth/login";
  let dashboardLabel = "Вход";

  if (isAuthed && isStaff) {
    // сотрудник
    dashboardHref = role === "vet" ? "/staff" : "/backoffice/registrar";
    dashboardLabel = "Рабочий кабинет";
  } else if (isAuthed && !isStaff) {
    // клиент
    dashboardHref = "/account";
    dashboardLabel = "Личный кабинет";
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
      window.location.href = "/auth/login";
    }
  };

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
              {/* Вход / Личный кабинет / Рабочий кабинет */}
              <Link
                href={dashboardHref}
                className="text-sm text-gray-700 hover:text-gray-900 underline underline-offset-4"
              >
                {dashboardLabel}
              </Link>

              {/* Для клиента: Выйти + Записаться (в таком порядке) */}
              {isAuthed && !isStaff && (
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
              )}

              {/* Для сотрудника: только Выйти, без кнопки «Записаться» */}
              {isAuthed && isStaff && (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-sm text-gray-600 hover:text-red-700"
                >
                  Выйти
                </button>
              )}

              {/* Для гостя: Вход + Записаться (Вход уже выше в dashboardHref) */}
              {!isAuthed && (
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
