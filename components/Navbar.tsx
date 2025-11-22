// components/Navbar.tsx
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

  const isStaff =
    role === "registrar" || role === "vet" || role === "admin";

  // Куда ведёт кабинет
  let dashboardHref = "/account";
  if (role === "registrar" || role === "admin") {
    dashboardHref = "/backoffice/registrar";
  } else if (role === "vet") {
    dashboardHref = "/staff";
  }

  const dashboardLabel = isStaff ? "Рабочий кабинет" : "Личный кабинет";

  const linkClass = (href: string) =>
    `text-sm ${
      pathname === href
        ? "font-semibold text-gray-900"
        : "text-gray-600 hover:text-gray-900"
    }`;

  const handleLogout = async () => {
    try {
      if (supabase) {
        await supabase.auth.signOut();
      }
    } finally {
      // Принудительно сбрасываем состояние и попадаем на главную
      window.location.href = "/";
    }
  };

  return (
    <nav className="border-b bg-white">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        {/* Логотип/название слева — БЕЗ OV-пилюли, как было раньше */}
        <Link href="/" className="text-sm font-semibold text-gray-900">
          OnlyVet — онлайн-ветеринария
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

        {/* Правая часть: вход / кабинет / запись / выход */}
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

              {/* Клиентам оставляем кнопку записи, сотрудникам — нет */}
              {!isStaff && (
                <Link
                  href="/booking"
                  className="rounded-full bg-black px-4 py-1.5 text-sm font-medium text-white hover:bg-gray-900"
                >
                  Записаться
                </Link>
              )}

              <button
                type="button"
                onClick={handleLogout}
                className="text-sm text-gray-700 hover:text-gray-900"
              >
                Выйти
              </button>
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
