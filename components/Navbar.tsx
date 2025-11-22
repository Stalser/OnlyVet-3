"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useCurrentUser } from "../lib/useCurrentUser";

export default function Navbar() {
  const router = useRouter();
  const { user, loading } = useCurrentUser();

  const [authLabel, setAuthLabel] = useState("Вход");
  const [authHref, setAuthHref] = useState("/auth/login");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Определяем, что показывать в правом углу, в зависимости от роли
  useEffect(() => {
    if (loading) return;

    if (!user) {
      setIsLoggedIn(false);
      setAuthLabel("Вход");
      setAuthHref("/auth/login");
      return;
    }

    setIsLoggedIn(true);

    switch (user.role) {
      case "registrar":
      case "admin":
        setAuthLabel("Кабинет регистратуры");
        setAuthHref("/backoffice/registrar");
        break;
      case "vet":
        setAuthLabel("Кабинет врача");
        setAuthHref("/staff");
        break;
      case "client":
      default:
        setAuthLabel("Личный кабинет");
        setAuthHref("/account");
        break;
    }
  }, [user, loading]);

  const handleLogout = async () => {
    if (!supabase) return;

    await supabase.auth.signOut();
    setIsLoggedIn(false);
    // После выхода всегда на главную
    router.push("/");
  };

  return (
    <header className="border-b border-gray-100 bg-white/90 backdrop-blur-sm">
      <div className="container flex h-14 items-center justify-between gap-4">
        {/* Лого */}
        <Link href="/" className="font-semibold text-sm tracking-tight">
          OnlyVet
        </Link>

        {/* Меню */}
        <nav className="hidden sm:flex items-center gap-4 text-xs text-gray-700">
          <Link href="/services" className="hover:text-black transition-colors">
            Услуги
          </Link>
          <Link href="/doctors" className="hover:text-black transition-colors">
            Врачи
          </Link>
          <Link href="/docs" className="hover:text-black transition-colors">
            Документы
          </Link>
        </nav>

        {/* Правый блок */}
        <div className="flex items-center gap-3">
          {/* Вход / ЛК / Кабинеты */}
          <Link
            href={authHref}
            className="text-xs text-gray-700 hover:text-black underline underline-offset-2"
          >
            {authLabel}
          </Link>

          {/* Выйти — только если залогинен */}
          {isLoggedIn && (
            <button
              type="button"
              onClick={handleLogout}
              className="text-xs px-3 py-1.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              Выйти
            </button>
          )}

          {/* Записаться */}
          <Link
            href="/booking"
            className="rounded-xl px-4 py-1.5 bg-black text-white text-xs font-medium hover:bg-gray-900"
          >
            Записаться
          </Link>
        </div>
      </div>
    </header>
  );
}
