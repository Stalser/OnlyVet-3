"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  // Мы в зоне сотрудников?
  const isRegistrarArea = pathname.startsWith("/backoffice");
  const isVetArea = pathname.startsWith("/staff");
  const isStaffArea = isRegistrarArea || isVetArea;

  // Мы в личном кабинете клиента?
  const isClientArea = pathname.startsWith("/account");

  // Ссылка на кабинет и подпись
  let dashboardHref = "/auth/login";
  let dashboardLabel = "Вход";

  if (isStaffArea) {
    // если страница врача — ведём в /staff
    // если страница регистратора/админа — ведём в /backoffice/registrar
    dashboardHref = isVetArea ? "/staff" : "/backoffice/registrar";
    dashboardLabel = "Рабочий кабинет";
  } else if (isClientArea) {
    dashboardHref = "/account";
    dashboardLabel = "Личный кабинет";
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
        {/* Логотип слева (как было изначально) */}
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
          <Link
            href={dashboardHref}
            className="text-sm text-gray-700 hover:text-gray-900 underline underline-offset-4"
          >
            {dashboardLabel}
          </Link>

          <Link
            href="/booking"
            className="rounded-full bg-black px-4 py-1.5 text-sm font-medium text-white hover:bg-gray-900"
          >
            Записаться
          </Link>
        </div>
      </div>
    </nav>
  );
}
