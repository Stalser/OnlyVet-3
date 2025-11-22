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

  // Для logout аккуратно сузим тип, чтобы TS не ругался
  const client = supabase as SupabaseClient | null;

  const handleLogout = async () => {
    if (!client) return;
    try {
      await client.auth.signOut();
      // после выхода просто на главную
      window.location.href = "/";
    } catch (e) {
      console.error("Logout error", e);
    }
  };

  // Куда ведёт ссылка на кабинет
  let dashboardHref = "/auth/login";
  let dashboardLabel = "Вход";

  if (isAuthed) {
    if (role === "registrar" || role === "admin") {
      dashboardHref = "/backoffice/registrar";
      dashboardLabel = "Рабочий кабинет";
    } else if (role === "vet") {
      dashboardHref = "/staff";
      dashboardLabel = "Рабочий кабинет";
    } else {
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

  return (
    <nav className="border-b bg-white">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        {/* Логотип слева — как в исходной версии */}
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

        {/* Правая часть: кабинет / вход + запись */}
        <div className="flex items-center gap-4">
          {loading ? (
            <span className="text-xs text-gray-500">Загрузка…</span>
          ) : (
            <>
              <Link
                href={dashboardHref}
                className="text-sm text-gray-700 hover:text-gray-900 underline underline-offset-4"
              >
                {dashboardLabel}
              </Link>

              {isAuthed && (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-sm text-gray-700 hover:text-gray-900"
                >
                  Выйти
                </button>
              )}

              <Link
                href="/booking"
                className="rounded-full bg-black px-4 py-1.5 text-sm font-medium text-white hover:bg-gray-900"
              >
                Записаться
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
