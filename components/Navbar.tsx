"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function Navbar() {
  const [role, setRole] = useState<"user" | "staff" | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      const r = data.user?.user_metadata?.role || null;
      setRole(r);
    };
    getUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/"; // обновить страницу и выбросить в корень
  };

  return (
    <nav className="flex items-center justify-between py-4 container">
      <Link href="/" className="font-semibold text-xl">
        OnlyVet
      </Link>

      <div className="flex items-center gap-6">

        <Link href="/services">Услуги</Link>
        <Link href="/doctors">Врачи</Link>
        <Link href="/docs">Документы</Link>

        {/* Авторизованный пользователь */}
        {role && (
          <>
            {role === "user" && (
              <Link
                href="/account"
                className="px-4 py-2 rounded-xl bg-black text-white text-sm"
              >
                Личный кабинет
              </Link>
            )}

            {role === "staff" && (
              <Link
                href="/staff"
                className="px-4 py-2 rounded-xl bg-black text-white text-sm"
              >
                Кабинет сотрудника
              </Link>
            )}

            {/* КНОПКА ВЫЙТИ */}
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-xl border border-gray-300 text-sm hover:bg-gray-100"
            >
              Выйти
            </button>
          </>
        )}

        {/* Если пользователь НЕ авторизован */}
        {!role && (
          <Link
            href="/auth/login"
            className="px-4 py-2 rounded-xl bg-black text-white text-sm"
          >
            Вход
          </Link>
        )}
      </div>
    </nav>
  );
}
