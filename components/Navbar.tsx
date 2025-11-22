"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { supabase } from "@/lib/supabaseClient";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { UserRole } from "@/lib/types";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useCurrentUser();

  // Быстрая проверка: мы на странице логина/регистрации — можно упростить хедер,
  // но пока просто используем общий вариант.

  const handleLogout = async () => {
    if (!supabase) {
      router.push("/auth/login");
      return;
    }
    const client: SupabaseClient = supabase;
    try {
      await client.auth.signOut();
    } catch (e) {
      console.error("logout error", e);
    } finally {
      router.push("/");
    }
  };

  // Определяем, куда вести сотрудника
  const getStaffHome = (role: UserRole | null): string => {
    if (!role) return "/backoffice/registrar";
    if (role === "registrar" || role === "admin") return "/backoffice/registrar";
    if (role === "vet") return "/staff";
    return "/backoffice/registrar";
  };

  // --- Правый блок навигации (аккаунт) ---

  let accountNode: React.ReactNode = null;
  let logoutNode: React.ReactNode = null;

  if (!loading) {
    if (!user) {
      // Гость
      accountNode = (
        <Link
          href="/auth/login"
          className="text-xs text-gray-700 hover:text-black"
        >
          Вход
        </Link>
      );
    } else {
      // Авторизован
      if (user.role === "client") {
        accountNode = (
          <Link
            href="/account"
            className="text-xs text-gray-700 hover:text-black"
          >
            Личный кабинет
          </Link>
        );
      } else {
        // Сотрудник: registrar / vet / admin
        accountNode = (
          <Link
            href={getStaffHome(user.role)}
            className="text-xs text-gray-700 hover:text-black"
          >
            Рабочий кабинет
          </Link>
        );
      }

      logoutNode = (
        <button
          type="button"
          onClick={handleLogout}
          className="text-xs text-gray-500 hover:text-black"
        >
          Выйти
        </button>
      );
    }
  }

  // Кнопка "Записаться" всегда видна (для клиентов и гостей)
  const showBookingButton = true;

  return (
    <nav className="w-full border-b border-gray-100 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        {/* Логотип/бренд */}
        <div className="flex items-center gap-2">
          <Link href="/" className="text-sm font-semibold tracking-tight">
            OnlyVet — онлайн-ветеринария
          </Link>
        </div>

        {/* Центральное меню */}
        <div className="hidden gap-6 text-xs text-gray-700 md:flex">
          <Link
            href="/services"
            className={
              pathname.startsWith("/services")
                ? "font-medium text-black"
                : "hover:text-black"
            }
          >
            Услуги
          </Link>
          <Link
            href="/doctors"
            className={
              pathname.startsWith("/doctors")
                ? "font-medium text-black"
                : "hover:text-black"
            }
          >
            Врачи
          </Link>
          <Link
            href="/docs"
            className={
              pathname.startsWith("/docs")
                ? "font-medium text-black"
                : "hover:text-black"
            }
          >
            Документы
          </Link>
        </div>

        {/* Правый блок: аккаунт + кнопка записи */}
        <div className="flex items-center gap-3">
          {/* Аккаунт / Вход */}
          {accountNode}

          {/* Выйти (только если залогинен) */}
          {logoutNode && (
            <span className="h-3 w-px bg-gray-200" aria-hidden="true" />
          )}
          {logoutNode}

          {/* Кнопка "Записаться" */}
          {showBookingButton && (
            <Link
              href="/booking"
              className="inline-flex items-center rounded-full bg-black px-4 py-1.5 text-xs font-medium text-white hover:bg-gray-900"
            >
              Записаться
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
