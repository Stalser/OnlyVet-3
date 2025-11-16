"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function StaffNav() {
  const path = usePathname();

  const navItems = [
    { href: "/staff", label: "Кабинет врача" },
    { href: "/staff/schedule", label: "Расписание" },
    { href: "/staff/calendar", label: "Календарь" },
    // Профиль теперь доступен
    { href: "/staff/profile", label: "Профиль" },
  ];

  return (
    <nav className="flex gap-6 border-b pb-3 mb-6 text-sm">
      {navItems.map((item) => {
        const isActive = path === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={
              isActive
                ? "font-semibold text-emerald-700 border-b-2 border-emerald-600 pb-1"
                : "text-gray-600 hover:text-emerald-700"
            }
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
