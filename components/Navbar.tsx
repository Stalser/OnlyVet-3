"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { supabase } from "@/lib/supabaseClient";

type UserRole = "client" | "registrar" | "vet" | "admin";

export default function Navbar() {
  const pathname = usePathname();
  const { user, loading } = useCurrentUser();

  const isAuthed = !!user;
  const role = (user?.role ?? "client") as UserRole;

  // Определяем зону по URL
  const isRegistrarArea = pathname.startsWith("/backoffice");
  const isVetArea = pathname.startsWith("/staff");
  const isStaffArea = isRegistrarArea || isVetArea;
  const isClientArea = pathname.startsWith("/account");

  // Куда ведёт ссылка "кабинет" и как она называется
  let dashboardHref = "/auth/login";
  let dashboardLabel = "Вход";

  if (isStaffArea) {
    dashboardHref = isVetArea ? "/staff" : "/backoffice/registrar";
    dashboardLabel = "Рабочий кабинет";
  } else if (isClientArea || role === "client") {
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
    if (!supabase) return;
    try {
      await supabase.auth.signOut();
      // После выхода просто кидаем на главную
      window.location.href = "/";
    } catch (e) {
      console.error("Logout error", e);
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

        {/* Правая часть: кабинет / вход + запись + выход */}
        <div className="flex items-center gap-4">
          {loading ? (
            <span className="text-xs text-gray-500">Загрузка…</span>
          ) : isAuthed ? (
            <>
              <Link
                href={dashboardHref}
                className="text-sm text-gray-700 hover:text-gray-900 underline underline-offset-4"
              >
                {dashboardLabel}
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="text-sm text-gray-700 hover:text-gray-900"
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
          ) : (
            <>
              <Link
                href="/auth/login"
                className="text-sm text-gray-700 hover:text-gray-900 underline underline-offset-4"
              >
                Вход
              </Link>
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
