"use client";

import Link from "next/link";
import type { OwnerSummary } from "@/lib/clients";

interface Props {
  owners: OwnerSummary[];
}

export function RegistrarClientsMini({ owners }: Props) {
  const limited = owners.slice(0, 5); // показываем максимум 5 клиентов

  return (
    <section className="rounded-2xl border bg-white p-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">
            Краткая картотека клиентов
          </h2>
          <p className="text-xs text-gray-500">
            Показаны последние {limited.length} клиентов. Всего в базе:{" "}
            {owners.length}.
          </p>
        </div>
        <Link
          href="/backoffice/registrar/clients"
          className="text-xs font-medium text-emerald-700 hover:underline"
        >
          Открыть картотеку клиентов →
        </Link>
      </div>

      {owners.length === 0 && (
        <p className="text-xs text-gray-400">
          Клиентов пока нет. Профили владельцев появятся здесь, когда вы
          начнёте заполнять таблицу owner_profiles.
        </p>
      )}

      {owners.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-[11px] uppercase text-gray-500">
                <th className="px-2 py-2">Клиент</th>
                <th className="px-2 py-2">Город</th>
                <th className="px-2 py-2">Питомцев</th>
                <th className="px-2 py-2">Консультаций</th>
                <th className="px-2 py-2 text-right">Действия</th>
              </tr>
            </thead>
            <tbody>
              {limited.map((o) => (
                <tr
                  key={o.ownerId}
                  className="border-b last:border-0 hover:bg-gray-50"
                >
                  <td className="px-2 py-2 align-top">
                    <div className="text-[11px] font-medium">
                      {o.fullName}
                    </div>
                  </td>
                  <td className="px-2 py-2 align-top">
                    <div className="text-[11px] text-gray-700">
                      {o.city || "—"}
                    </div>
                  </td>
                  <td className="px-2 py-2 align-top">{o.petsCount}</td>
                  <td className="px-2 py-2 align-top">
                    {o.appointmentsCount}
                  </td>
                  <td className="px-2 py-2 align-top text-right">
                    <Link
                      href={`/backoffice/registrar/clients/${o.ownerId}`}
                      className="text-[11px] font-medium text-emerald-700 hover:underline"
                    >
                      Карточка
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
