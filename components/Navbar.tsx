"use client";

import Link from "next/link";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/80 backdrop-blur">
      <div className="container flex items-center justify-between h-14">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-base font-semibold tracking-tight">OnlyVet</span>
        </Link>

        <nav className="flex items-center gap-4 text-sm text-gray-700">
          <Link href="/services" className="btn-ghost">
            Услуги
          </Link>
          <Link href="/doctors" className="btn-ghost">
            Врачи
          </Link>
          <Link href="/docs" className="btn-ghost">
            Документы
          </Link>
          <Link href="/auth/login" className="btn-ghost">
            Вход
          </Link>
          <Link href="/booking" className="btn btn-primary">
            Записаться
          </Link>
        </nav>
      </div>
    </header>
  );
}
