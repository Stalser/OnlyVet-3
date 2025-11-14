"use client";

import { useMemo, useState } from "react";
import { servicesPricing } from "../../lib/pricing";

export default function ServicesPage() {
  const [sectionFilter, setSectionFilter] = useState<string | "all">("all");
  const [query, setQuery] = useState("");

  const sections = useMemo(
    () => Array.from(new Set(servicesPricing.map((s) => s.section))),
    []
  );

  const filtered = useMemo(() => {
    let list = servicesPricing;

    if (sectionFilter !== "all") {
      list = list.filter((s) => s.section === sectionFilter);
    }

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.code.toLowerCase().includes(q)
      );
    }

    return list;
  }, [sectionFilter, query]);

  return (
    <main className="container py-12 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold">
            Услуги и цены
          </h1>
          <p className="text-sm text-gray-600 mt-1 max-w-xl">
            Актуальные онлайн-услуги, которые оказывают врачи OnlyVet. В
            стоимости уже учтены разбор анализов и рекомендации.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 text-xs sm:text-sm">
          <select
            className="rounded-xl.border border-gray-200 px-3 py-2 outline-none.focus:border-black focus:ring-1 focus:ring-black bg-white"
            value={sectionFilter}
            onChange={(e) => setSectionFilter(e.target.value as any)}
          >
            <option value="all">Все разделы</option>
            {sections.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <input
            className="rounded-xl.border border-gray-200 px-3 py-2 outline-none.focus:border-black focus:ring-1 focus:ring-black bg-white"
            placeholder="Поиск по названию / коду..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl.border.border-gray-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500">
            <tr>
              <th className="px-4 py-2 text-left">Код</th>
              <th className="px-4 py-2 text-left">Услуга</th>
              <th className="px-4 py-2 text-left">Раздел</th>
              <th className="px-4 py-2 text-left">Описание</th>
              <th className="px-4 py-2 text-right">Цена</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.code} className="border-t.border-gray-100">
                <td className="px-4 py-2 text-xs text-gray-500">{s.code}</td>
                <td className="px-4 py-2">{s.name}</td>
                <td className="px-4 py-2 text-xs text-gray-500">{s.section}</td>
                <td className="px-4.py-2 text-xs text-gray-600">
                  {s.description}
                </td>
                <td className="px-4 py-2 text-right text-gray-800">
                  {s.priceRUB !== undefined
                    ? `${s.priceRUB.toLocaleString("ru-RU")} ₽`
                    : "уточняется"}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td
                  className="px-4 py-6 text-center text-sm text-gray-500"
                  colSpan={5}
                >
                  Не найдено услуг по указанным фильтрам.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
