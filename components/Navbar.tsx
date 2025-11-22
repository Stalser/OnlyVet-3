"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCurrentUser } from "@/lib/useCurrentUser";

type UserRole = "client" | "registrar" | "vet" | "admin";

export default function Navbar() {
  const pathname = usePathname();
  const { user, loading } = useCurrentUser();

  const isAuthed = !!user;
  const role = (user?.role ?? "client") as UserRole;

  const isStaff =
    role === "registrar" || role === "vet" || role === "admin";

  // Куда ведёт "кабинет"
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

  return (
    <nav className="border-b bg-white">
      <div className="container mx-auto flex.items-center justify-between px-4 py-3">
        {/* Логотип слева */}
        <Link href="/" className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center rounded-full bg-black px-3 py-1 text-xs font-semibold text-white">
            OV
          </span>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold text-gray-900">
              OnlyVet
            </span>
            <span className="text-[11px] text-gray-500">
              онлайн-ветеринария
            </span>
          </div>
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

        {/* Правая часть: вход / кабинет / запись */}
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
