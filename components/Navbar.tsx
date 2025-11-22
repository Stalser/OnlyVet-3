"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCurrentUser } from "@/lib/useCurrentUser";

type UserRole = "client" | "registrar" | "vet" | "admin";

export default function Navbar() {
  const { user, loading } = useCurrentUser();
  const pathname = usePathname();

  const isLoggedIn = !!user;
  const role = (user?.role ?? "client") as UserRole;

  // --- Определяем, куда вести сотрудника и как подписать кнопку ---
  let cabinetHref = "/account";
  let cabinetLabel = "Личный кабинет";

  if (role === "registrar") {
    cabinetHref = "/backoffice/registrar";
    cabinetLabel = "Кабинет регистратуры";
  } else if (role === "vet") {
    cabinetHref = "/staff";
    cabinetLabel = "Кабинет врача";
  } else if (role === "admin") {
    cabinetHref = "/backoffice/registrar";
    cabinetLabel = "Рабочий кабинет";
  }

  const isOnCabinetPage =
    pathname?.startsWith("/account") ||
    pathname?.startsWith("/backoffice") ||
    pathname?.startsWith("/staff");

  return (
    <header className="border-b bg-white/90 backdrop-blur">
      <nav className="container mx-auto flex h-14 items-center justify-between px-4">
        {/* ЛОГО / НАЗВАНИЕ */}
        <Link href="/" className="flex items-baseline gap-1">
          <span className="text-sm font-semibold">OnlyVet</span>
          <span className="text-[11px] text-gray-500">
            — онлайн-ветеринария
          </span>
        </Link>

        {/* Центр — простое меню */}
        <div className="hidden gap-6 text-sm text-gray-700 md:flex">
          <Link
            href="/services"
            className="hover:text-black"
          >
            Услуги
          </Link>
          <Link
            href="/doctors"
            className="hover:text-black"
          >
            Врачи
          </Link>
          <Link
            href="/docs"
            className="hover:text-black"
          >
            Документы
          </Link>
        </div>

        {/* Правый блок: auth / кабинеты */}
        <div className="flex items-center gap-3 text-sm">
          {/* Пока грузим пользователя — ничего не дёргаем */}
          {loading ? (
            <span className="text-[11px] text-gray-400">Загрузка…</span>
          ) : isLoggedIn ? (
            <>
              {/* Кнопка рабочего/личного кабинета */}
              <Link
                href={cabinetHref}
                className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                  isOnCabinetPage
                    ? "bg-black text-white"
                    : "border border-gray-300 text-gray-800 hover:bg-gray-50"
                }`}
              >
                {cabinetLabel}
              </Link>

              {/* Кнопка "Выйти" */}
              <Link
                href="/auth/login?logout=1"
                className="text-xs text-gray-600 hover:text-black"
              >
                Выйти
              </Link>

              {/* Для сотрудников всё равно оставим "Записаться" как общую кнопку
                  (позже можем скрыть для staff, если решим, что им она не нужна) */}
              <Link
                href="/booking"
                className="hidden rounded-full bg-black px-4 py-1.5 text-xs font-medium text-white hover:bg-gray-900 md:inline-flex"
              >
                Записаться
              </Link>
            </>
          ) : (
            <>
              {/* Неавторизованный пользователь */}
              <Link
                href="/auth/login"
                className="text-xs text-gray-600 hover:text-black"
              >
                Вход
              </Link>

              <Link
                href="/booking"
                className="rounded-full bg-black px-4 py-1.5 text-xs font-medium text-white hover:bg-gray-900"
              >
                Записаться
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
