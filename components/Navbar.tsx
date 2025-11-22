"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCurrentUser } from "@/lib/useCurrentUser";
import type { UserRole } from "@/lib/types"; // если у тебя тип по-другому называется — см. комментарий ниже

// Если UserRole объявлен в другом файле / с другим именем:
// 1) удали импорт выше
// 2) раскомментируй строку ниже и подгони под свои значения
// type UserRole = "client" | "registrar" | "vet" | "admin";

type EffectiveRole = UserRole | "guest";

function getDashboardHref(role: EffectiveRole): string {
  switch (role) {
    case "registrar":
    case "admin":
      return "/backoffice/registrar";
    case "vet":
      return "/staff";
    case "client":
      return "/account";
    default:
      return "/auth/login";
  }
}

function getDashboardLabel(role: EffectiveRole): string {
  switch (role) {
    case "registrar":
    case "admin":
    case "vet":
      return "Рабочий кабинет";
    case "client":
      return "Личный кабинет";
    default:
      return "Вход";
  }
}

export default function Navbar() {
  const { user, loading } = useCurrentUser();
  const pathname = usePathname();

  // Пока грузится — считаем, что гость (так безопаснее)
  const role: EffectiveRole = user?.role ?? "guest";

  const dashboardHref = getDashboardHref(role);
  const dashboardLabel = getDashboardLabel(role);

  const isActive = (href: string) =>
    href !== "/"
      ? pathname?.startsWith(href)
      : pathname === "/";

  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:py-4">
        {/* Лого / бренд */}
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <span className="rounded-full bg-black px-2 py-1 text-[11px] font-semibold text-white">
              OV
            </span>
            <span className="text-sm font-semibold tracking-tight">
              OnlyVet
            </span>
          </Link>
          <span className="hidden text-[11px] text-gray-400 sm:inline">
            онлайн-ветеринария
          </span>
        </div>

        {/* Центр: ссылки сайта */}
        <nav className="hidden items-center gap-4 text-sm text-gray-700 md:flex">
          <Link
            href="/services"
            className={
              isActive("/services") ? "font-medium text-black" : "hover:text-black"
            }
          >
            Услуги
          </Link>
          <Link
            href="/doctors"
            className={
              isActive("/doctors") ? "font-medium text-black" : "hover:text-black"
            }
          >
            Врачи
          </Link>
          <Link
            href="/docs"
            className={
              isActive("/docs") ? "font-medium text-black" : "hover:text-black"
            }
          >
            Документы
          </Link>
        </nav>

        {/* Справа: кабинет / вход + CTA */}
        <div className="flex.items-center gap-3">
          {/* Кнопка кабинет / вход */}
          <Link
            href={dashboardHref}
            className="text-xs text-gray-700 underline underline-offset-2 hover:text-black"
          >
            {dashboardLabel}
          </Link>

          {/* CTA "Записаться" всегда ведёт на форму записи */}
          <Link
            href="/booking"
            className="inline-flex items-center rounded-full bg-black px-4 py-1.5 text-xs font-semibold text-white hover:bg-gray-900"
          >
            Записаться
          </Link>
        </div>
      </div>
    </header>
  );
}
