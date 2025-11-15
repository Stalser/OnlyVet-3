"use client";

import { useMemo, useState } from "react";
import type { OwnerSummary } from "@/lib/clients";
import Link from "next/link";

interface Props {
  owners: OwnerSummary[];
}

export function RegistrarClientsClient({ owners }: Props) {
  const [search, setSearch] = useState("");
  const [onlyWithPets, setOnlyWithPets] = useState(false);
  const [onlyWithAppointments, setOnlyWithAppointments] = useState(false);

  const filtered = useMemo(() => {
    return owners.filter((o) => {
      if (onlyWithPets && o.petsCount === 0) return false;
      if (onlyWithAppointments && o.appointmentsCount === 0) return false;

      if (search.trim().length > 0) {
        const q = search.trim().toLowerCase();
        const haystack = [
          o.fullName,
          o.email ?? "",
          o.phone ?? "",
          o.city ?? "",
        ]
          .join(" ")
          .toLowerCase();

        if (!haystack.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [owners, search, onlyWithPets, onlyWithAppointments]);

  return (
    <section className="rounded-2xl border bg-white p-4 space-y-4">
      <div className="flex flex_wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Клиенты</h2>
          <p className="text-xs text-gray-500">
            Всего клиентов: {owners.length}. После фильтрации:{" "}
            {filtered.length}.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по ФИО, городу, e-mail, телефону…"
            className="w-60 rounded-xl border px-2 py-1.5 text-xs"
          />
          <label className="inline-flex items-center gap-1 text-[11px] text-gray-600">
            <input
              type="checkbox"
              checked={onlyWithPets}
              onChange={(e) => setOnlyWithPets(e.target.checked)}
              className="h-3 w-3 rounded border-gray-300"
            />
            Только с питомцами
          </label>
          <label className="inline-flex items-center gap-1 text-[11px] text-gray-600">
            <input
              type="checkbox"
              checked={onlyWithAppointments}
              onChange={(e) =>
                setOnlyWithAppointments(e.target.checked)
              }
              className="h-3 w-3 rounded border-gray-300"
            />
            Только с консультациями
          </label>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead>
            <tr className="border-b bg-gray-50 text-left text-[11px] uppercase text-gray-500">
              <th className="px-2 py-2">№</th>
              <th className="px-2 py-2">Клиент</th>
              <th className="px-2 py-2">Город</th>
              <th className="px-2 py-2">Контакты</th>
              <th className="px-2 py-2">Питомцев</th>
              <th className="px-2 py-2">Консультаций</th>
              <th className="px-2 py-2 text-right">Действия</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((o, index) => (
              <tr
                key={o.ownerId}
                className="border-b last:border-0 hover:bg-gray-50"
              >
                <td className="px-2 py-2 align-top">{index + 1}</td>
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
                <td className="px-2 py-2 align-top">
                  {o.email && (
                    <div className="text-[11px] text-gray-700">
                      {o.email}
                    </div>
                  )}
                  {o.phone && (
                    <div className="text-[11px] text-gray-500">
                      {o.phone}
                    </div>
                  )}
                  {!o.email && !o.phone && (
                    <div className="text-[11px] text-gray-400">
                      Контакты не указаны
                    </div>
                  )}
                </td>
                <td className="px-2 py-2 align-top">
                  {o.petsCount}
                </td>
                <td className="px-2 py-2 align-top">
                  {o.appointmentsCount}
                </td>
                <td className="px-2 py-2 align-top text-right">
                  <Link
                    href={`/backoffice/registrar/clients/${o.ownerId}`}
                    className="text-[11px] font-medium text-emerald-700 hover:underline"
                  >
                    Открыть карточку
                  </Link>
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-2 py-8 text-center text-xs text-gray-400"
                >
                  Нет клиентов, удовлетворяющих фильтру.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
