"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import type { SupabaseClient } from "@supabase/supabase-js";

export default function Navbar() {
  const pathname = usePathname();

  // Определяем зону по URL
  const inRegistrarArea = pathname.startsWith("/backoffice");
  const inVetArea = pathname.startsWith("/staff");
  const inStaffArea = inRegistrarArea || inVetArea;
  const inClientArea = pathname.startsWith("/account");

  // -------- Ссылка "кабинет" справа --------
  let dashboardHref = "/auth/login";
  let dashboardLabel = "Вход";

  if (inStaffArea) {
    // сотрудник: регистратор/админ → backoffice, врач → staff
    dashboardHref = inVetArea ? "/staff" : "/backoffice/registrar";
    dashboardLabel = "Рабочий кабинет";
  } else if (inClientArea) {
    dashboardHref = "/account";
    dashboardLabel = "Личный кабинет";
  }

  // На каких страницах считаем, что человек уже внутри кабинета
  const inAnyCabinet = inStaffArea || inClientArea;

  const linkClass = (href: string) =>
    `text-sm ${
      pathname === href
        ? "font-semibold text-gray-900"
        : "text-gray-600 hover:text-gray-900"
    }`;

  // -------- Выход --------
  const handleLogout = async () => {
    try {
      if (supabase) {
        const client: SupabaseClient = supabase;
        await client.auth.signOut();
      }
    } catch (e) {
      console.error("Logout error:", e);
    } finally {
      // Всегда уводим на страницу логина
      window.location.href = "/auth/login";
    }
  };

  return (
    <nav className="border-b bg-white">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        {/* Логотип слева — как было в макете */}
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

        {/* Правая часть */}
        <div className="flex items-center gap-4">
          {/* Ссылка на кабинет / вход */}
          <Link
            href={dashboardHref}
            className="text-sm text-gray-700 hover:text-gray-900 underline underline-offset-4"
          >
            {dashboardLabel}
          </Link>

          {/* "Записаться" — всегда доступна */}
          <Link
            href="/booking"
            className="rounded-full bg-black px-4 py-1.5 text-sm font-medium text-white hover:bg-gray-900"
          >
            Записаться
          </Link>

          {/* Кнопка "Выйти" — показываем только если мы уже внутри любого кабинета */}
          {inAnyCabinet && (
            <button
              type="button"
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
