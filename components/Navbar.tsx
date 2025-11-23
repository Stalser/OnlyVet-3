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
  const isStaff = role === "registrar" || role === "vet" || role === "admin";

  // Куда ведёт ссылка кабинета на десктопе
  let cabinetHref = "/auth/login";
  let cabinetLabel = "Вход";

  if (isAuthed && isStaff) {
    cabinetHref = role === "vet" ? "/staff" : "/backoffice/registrar";
    cabinetLabel = "Рабочий кабинет";
  } else if (isAuthed && !isStaff) {
    cabinetHref = "/account";
    cabinetLabel = "Личный кабинет";
  }

  const handleLogout = async () => {
    try {
      // supabase может быть null в типах — аккуратно через optional chaining
      await supabase?.auth.signOut();
    } finally {
      // В любом случае уводим на страницу логина
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
        {/* Логотип слева — как было */}
        <Link href="/" className="text-sm font-semibold text-gray-900">
          OnlyVet{" "}
          <span className="ml-1 text-xs font-normal text-gray-500">
            — онлайн-ветеринария
          </span>
        </Link>

        {/* Центральное меню (только десктоп) */}
        <div className="hidden md:flex.items-center gap-6">
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

        {/* Правая часть: десктопная версия */}
        <div className="hidden md:flex items-center gap-4">
          {loading ? (
            <span className="text-xs text-gray-500">Загрузка…</span>
          ) : (
            <>
              <Link
                href={cabinetHref}
                className="text-sm text-gray-700 hover:text-gray-900 underline underline-offset-4"
              >
                {cabinetLabel}
              </Link>

              {/* Записаться — только для клиентов и гостей */}
              {(!isAuthed || !isStaff) && (
                <Link
                  href="/booking"
                  className="rounded-full bg-black px-4 py-1.5 text-sm font-medium text-white hover:bg-gray-900"
                >
                  Записаться
                </Link>
              )}

              {/* Выйти — для всех авторизованных */}
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

        {/* Правая часть: мобильная версия (только клиентский сценарий) */}
        <div className="flex md:hidden items-center gap-3">
          {loading ? (
            <span className="text-xs text-gray-500">…</span>
          ) : (
            <>
              {!isAuthed ? (
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
              ) : (
                <>
                  {/* Для авторизованного клиента — ссылка в личный кабинет */}
                  {role === "client" && (
                    <Link
                      href="/account"
                      className="text-sm text-gray-700 hover:text-gray-900 underline underline-offset-4"
                    >
                      Личный кабинет
                    </Link>
                  )}
                  {/* Сотрудникам в мобильной версии ссылку в рабочий кабинет не показываем */}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="text-sm text-gray-600 hover:text-red-700"
                  >
                    Выйти
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
