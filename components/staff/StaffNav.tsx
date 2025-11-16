"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function StaffNav() {
  const pathname = usePathname();

  const items = [
    { href: "/staff", label: "Кабинет врача", disabled: false },
    { href: "/staff/schedule", label: "Расписание", disabled: false },
    { href: "/staff/calendar", label: "Календарь", disabled: false },
    { href: "/staff/profile", label: "Профиль (скоро)", disabled: true },
  ];

  return (
    <nav className="mt-4 border-b border-gray-100 pb-2">
      <ul className="flex flex-wrap gap-4 text-sm">
        {items.map((item) => {
          const isActive = pathname === item.href;

          if (item.disabled) {
            return (
              <li key={item.href}>
                <span className="text-gray-400 cursor-not-allowed">
                  {item.label}
                </span>
              </li>
            );
          }

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={
                  isActive
                    ? "font-medium text-emerald-700 border-b-2 border-emerald-600 pb-1"
                    : "text-gray-700 hover:text-emerald-700"
                }
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
