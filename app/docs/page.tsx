"use client";

import { useMemo, useState } from "react";

type DocItem = {
  id: string;
  title: string;
  category: "пользовательские" | "конфиденциальность" | "юридические";
  description: string;
  slug: string;
};

const docs: DocItem[] = [
  {
    id: "d1",
    title: "Пользовательское соглашение",
    category: "пользовательские",
    description:
      "Основные условия использования сервиса OnlyVet для владельцев животных.",
    slug: "terms-of-use",
  },
  {
    id: "d2",
    title: "Политика конфиденциальности",
    category: "конфиденциальность",
    description:
      "Как мы обрабатываем и храним персональные данные владельцев и пациентов.",
    slug: "privacy-policy",
  },
  {
    id: "d3",
    title: "Согласие на обработку персональных данных",
    category: "конфиденциальность",
    description:
      "Пояснение, какие данные и с какой целью собираются и используются.",
    slug: "personal-data-consent",
  },
  {
    id: "d4",
    title: "Отказ от ответственности",
    category: "юридические",
    description:
      "Информация о том, в каких пределах онлайн-консультация может заменить очный приём.",
    slug: "liability-disclaimer",
  },
];

const CATEGORY_FILTERS = [
  { id: "all", label: "Все документы" },
  { id: "пользовательские", label: "Пользовательские" },
  { id: "конфиденциальность", label: "Конфиденциальность" },
  { id: "юридические", label: "Юридические" },
];

export default function DocsPage() {
  const [category, setCategory] = useState<string>("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    return docs.filter((d) => {
      if (category !== "all" && d.category !== category) return false;
      if (query.trim()) {
        const q = query.trim().toLowerCase();
        if (
          !d.title.toLowerCase().includes(q) &&
          !d.description.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [category, query]);

  return (
    <main className="bg-slate-50 py-12">
      <div className="container space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-semibold">
            Документы сервиса OnlyVet
          </h1>
          <p className="text-sm text-gray-600 max-w-2xl">
            Здесь собраны основные документы, описывающие правила работы
            сервиса, обработку персональных данных и юридические аспекты
            онлайн-консультаций.
          </p>
        </header>

        {/* Фильтры */}
        <div className="flex flex-wrap gap-2 text-xs items-center">
          {CATEGORY_FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setCategory(f.id)}
              className={[
                "badge",
                category === f.id ? "badge-active" : "",
              ].join(" ")}
            >
              {f.label}
            </button>
          ))}
          <input
            className="ml-auto rounded-xl border border-gray-200 px-3 py-1 text-xs outline-none bg-white"
            placeholder="Поиск по названию / описанию..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {/* Список документов */}
        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map((d) => (
            <article
              key={d.id}
              className="card p-4 flex flex-col gap-2 text-sm text-gray-800"
            >
              <h2 className="font-semibold text-base">{d.title}</h2>
              <div className="text-[11px] text-gray-500">
                Категория: {d.category}
              </div>
              <p className="text-xs text-gray-700">{d.description}</p>
              <button
                type="button"
                className="self-start mt-1 text-[11px] text-blue-600 underline underline-offset-2"
                onClick={() =>
                  alert(
                    "Здесь позже будет открываться полный текст документа или скачивание PDF."
                  )
                }
              >
                Открыть документ
              </button>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
