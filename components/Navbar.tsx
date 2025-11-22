"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCurrentUser } from "@/lib/useCurrentUser";

type StaffRole = "registrar" | "vet" | "admin" | "client";

export default function Navbar() {
  const pathname = usePathname();
  const { user, loading } = useCurrentUser();

  const role: StaffRole = (user?.role as StaffRole) ?? "client";
  const isStaff = role === "registrar" || role === "vet" || role === "admin";

  // --- Куда ведёт кнопка "кабинета" ---
  let cabinetLabel = "Личный кабинет";
  let cabinetHref = "/account";

  if (user && isStaff) {
    cabinetLabel = "Рабочий кабинет";
    if (role === "vet") {
      cabinetHref = "/staff";
    } else {
      // registrar и admin — в кабинет регистратуры
      cabinetHref = "/backoffice/registrar";
    }
  }

  // --- Правый блок авторизации ---
  const isLoggedIn = !!user;

  const isActive = (href: string) =>
    pathname === href ? "text-gray-900 font-semibold" : "text-gray-600";

  return (
    <header className="border-b border-gray-100 bg-white/80 backdrop-blur">
      <div className="container mx-auto flex items-center justify-between px-4 py-3 md:py-4">
        {/* Логотип / бренд */}
        <Link href="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold">
            OV
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold text-gray-900">
              OnlyVet
            </span>
            <span className="text-[11px] text-gray-500">
              онлайн-ветеринария
            </span>
          </div>
        </Link>

        {/* Навигация по сайту */}
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <Link href="/services" className={isActive("/services")}>
            Услуги
          </Link>
          <Link href="/doctors" className={isActive("/doctors")}>
            Врачи
          </Link>
          <Link href="/docs" className={isActive("/docs")}>
            Документы
          </Link>
        </nav>

        {/* Правый блок: кабинет / вход / запись */}
        <div className="flex items-center gap-3">
          {/* Пока грузится user — просто серый текст-заглушка, чтобы не мигало */}
          {loading ? (
            <span className="text-xs text-gray-400">Загружаем…</span>
          ) : (
            <>
              {/* Кнопка кабинета или входа */}
              {isLoggedIn ? (
                <>
                  <Link
                    href={cabinetHref}
                    className="text-xs md:text-sm text-gray-700 hover:text-black underline underline-offset-2"
                  >
                    {cabinetLabel}
                  </Link>
                  <Link
                    href="/auth/logout"
                    className="text-xs md:text-sm text-gray-500 hover:text-black"
                  >
                    Выйти
                  </Link>
                </>
              ) : (
                <Link
                  href="/auth/login"
                  className="text-xs md:text-sm text-gray-700 hover:text-black underline underline-offset-2"
                >
                  Вход
                </Link>
              )}

              {/* Кнопка "Записаться" всегда доступна */}
              <Link
                href="/booking"
                className="rounded-full bg-black px-4 py-1.5 text-xs md:text-sm font-medium text-white hover:bg-gray-900"
              >
                Записаться
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
