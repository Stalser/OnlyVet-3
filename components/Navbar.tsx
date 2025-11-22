"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { supabase } from "@/lib/supabaseClient";

export default function Navbar() {
  const pathname = usePathname();
  const { user, loading } = useCurrentUser();

  const isAuthed = !!user;
  const role = user?.role ?? "client";
  const isStaff = role === "admin" || role === "registrar" || role === "vet";

  // ======= ЛОГИКА КНОПКИ КАБИНЕТА =======
  let cabinetHref = "/auth/login";
  let cabinetLabel = "Вход";

  if (isAuthed) {
    if (isStaff) {
      cabinetHref = role === "vet" ? "/staff" : "/backoffice/registrar";
      cabinetLabel = "Рабочий кабинет";
    } else {
      cabinetHref = "/account";
      cabinetLabel = "Личный кабинет";
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/auth/login";
  };

  const linkClass = (href: string) =>
    pathname === href
      ? "text-sm font-semibold text-gray-900"
      : "text-sm text-gray-600 hover:text-gray-900";

  return (
    <nav className="border-b bg-white">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">

        {/* ЛОГОТИП */}
        <Link href="/" className="text-sm font-semibold text-gray-900">
          OnlyVet{" "}
          <span className="ml-1 text-xs font-normal text-gray-500">
            — онлайн-ветеринария
          </span>
        </Link>

        {/* ЦЕНТРАЛЬНОЕ МЕНЮ */}
        <div className="flex items-center gap-6">
          <Link href="/services" className={linkClass("/services")}>Услуги</Link>
          <Link href="/doctors" className={linkClass("/doctors")}>Врачи</Link>
          <Link href="/docs" className={linkClass("/docs")}>Документы</Link>
        </div>

        {/* ПРАВАЯ ЧАСТЬ */}
        <div className="flex items-center gap-4">

          {/* КНОПКА: Кабинет / Вход */}
          <Link
            href={cabinetHref}
            className="text-sm text-gray-700 hover:text-gray-900 underline underline-offset-4"
          >
            {cabinetLabel}
          </Link>

          {/* КНОПКА: Записаться — ТОЛЬКО КЛИЕНТУ */}
          {!loading && isAuthed && !isStaff && (
            <Link
              href="/booking"
              className="rounded-full bg-black px-4 py-1.5 text-sm font-medium text-white hover:bg-gray-900"
            >
              Записаться
            </Link>
          )}

          {/* КНОПКА: Записаться — НЕавторизованному пользователю */}
          {!loading && !isAuthed && (
            <Link
              href="/booking"
              className="rounded-full bg-black px-4 py-1.5 text-sm font-medium text-white hover:bg-gray-900"
            >
              Записаться
            </Link>
          )}

          {/* КНОПКА: Выйти — ТОЛЬКО КОГДА ПОЛЬЗОВАТЕЛЬ В СИСТЕМЕ */}
          {isAuthed && (
            <button
              onClick={handleLogout}
              className="text-sm text-gray-600 hover:text-red-700"
            >
              Выйти
            </button>
          )}

        </div>
      </div>
    </nav>
  );
}
