"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { supabase } from "@/lib/supabaseClient";

type UserRole = "client" | "registrar" | "vet" | "admin";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useCurrentUser();

  const isAuthed = !!user;
  const role = (user?.role ?? "client") as UserRole;

  // Нахожусь ли я в рабочих разделах (для подсветки и небольших коррекций поведения)
  const isRegistrarArea = pathname.startsWith("/backoffice");
  const isVetArea = pathname.startsWith("/staff");

  // Куда ведёт ссылка "кабинет"
  let dashboardHref = "/auth/login";
  let dashboardLabel = "Вход";

  if (isAuthed) {
    if (role === "registrar" || role === "admin") {
      dashboardHref = "/backoffice/registrar";
      dashboardLabel = "Рабочий кабинет";
    } else if (role === "vet") {
      dashboardHref = "/staff";
      dashboardLabel = "Рабочий кабинет";
    } else {
      // обычный клиент
      dashboardHref = "/account";
      dashboardLabel = "Личный кабинет";
    }
  }

  const linkClass = (href: string) =>
    `text-sm ${
      pathname === href
        ? "font-semibold text-gray-900"
        : "text-gray-600 hover:text-gray-900"
    }`;

  const handleLogout = async () => {
    // на всякий случай защищаемся от null
    if (supabase) {
      await supabase.auth.signOut();
    }
    router.push("/auth/login");
    router.refresh();
  };

  return (
    <nav className="border-b bg-white">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        {/* Логотип слева — как в твоём исходном варианте */}
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
          {loading ? (
            <span className="text-xs text-gray-500">Загрузка…</span>
          ) : isAuthed ? (
            <>
              {/* Кабинет (личный или рабочий) */}
              <Link
                href={dashboardHref}
                className="text-sm text-gray-700 hover:text-gray-900 underline underline-offset-4"
              >
                {dashboardLabel}
              </Link>

              {/* Выйти */}
              <button
                type="button"
                onClick={handleLogout}
                className="text-sm text-gray-500 hover:text-gray-800"
              >
                Выйти
              </button>

              {/* Записаться */}
              <Link
                href="/booking"
                className="rounded-full bg-black px-4 py-1.5 text-sm font-medium text-white hover:bg-gray-900"
              >
                Записаться
              </Link>
            </>
          ) : (
            <>
              {/* Гость: Вход + Записаться */}
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
