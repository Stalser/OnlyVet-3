import Link from "next/link";
import type { ReactNode } from "react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { RegistrarHeader } from "@/components/registrar/RegistrarHeader";
import { getOwnersSummary } from "@/lib/clients";

// Страница всегда рендерится динамически, чтобы searchParams применялись сразу
export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: {
    q?: string;
    pets?: "all" | "with" | "without";
    priv?: "all" | "with" | "without";
    page?: string;
    id?: string;
    city?: string;
  };
};

const PAGE_SIZE = 50;

export default async function RegistrarClientsPage({ searchParams }: PageProps) {
  const owners = await getOwnersSummary();

  // Глобальный поиск
  const qRaw = (searchParams?.q ?? "").trim();
  const q = qRaw === "" ? "" : qRaw;

  // Фильтры
  const petsFilter = (searchParams?.pets ?? "all") as "all" | "with" | "without";
  const privFilter = (searchParams?.priv ?? "all") as "all" | "with" | "without";

  // Фильтр по колонкам
  const idFilter = (searchParams?.id ?? "").trim();
  const cityRaw = (searchParams?.city ?? "").trim();
  const cityFilter = cityRaw.toLowerCase();

  let page = Number.parseInt(searchParams?.page ?? "1", 10);
  if (!Number.isFinite(page) || page < 1) page = 1;

  // --- Сводка ---
  const total = owners.length;
  const withPets = owners.filter((o) => o.petsCount > 0).length;
  const withoutPets = total - withPets;
  const withPrivate = owners.filter((o) => o.hasPrivateData).length;
  const withoutPrivate = total - withPrivate;

  // --- Фильтрация ---
  let filtered = owners;

  // Глобальный поиск по имени / городу / email / телефону
  if (q) {
    const qLower = q.toLowerCase();
    filtered = filtered.filter((o) => {
      const fields = [o.fullName ?? "", o.city ?? "", o.email ?? "", o.phone ?? ""];
      return fields.some((f) => f.toLowerCase().includes(qLower));
    });
  }

  // Фильтр по ID
  if (idFilter) {
    filtered = filtered.filter((o) =>
      String(o.ownerId ?? "").includes(idFilter),
    );
  }

  // Фильтр по городу
  if (cityFilter) {
    filtered = filtered.filter((o) =>
      (o.city ?? "").toLowerCase().includes(cityFilter),
    );
  }

  // Фильтр по питомцам
  if (petsFilter === "with") {
    filtered = filtered.filter((o) => o.petsCount > 0);
  } else if (petsFilter === "without") {
    filtered = filtered.filter((o) => o.petsCount === 0);
  }

  // Фильтр по персональным данным
  if (privFilter === "with") {
    filtered = filtered.filter((o) => o.hasPrivateData);
  } else if (privFilter === "without") {
    filtered = filtered.filter((o) => !o.hasPrivateData);
  }

  const totalFiltered = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE));
  if (page > totalPages) page = totalPages;

  const startIndex = (page - 1) * PAGE_SIZE;
  const endIndex = Math.min(startIndex + PAGE_SIZE, totalFiltered);
  const visibleOwners = filtered.slice(startIndex, endIndex);

  const basePath = "/backoffice/registrar/clients";

  // helper сборки query
  const buildQuery = (params: {
    q?: string;
    pets?: string;
    priv?: string;
    page?: number;
    id?: string;
    city?: string;
  }) => {
    const sp = new URLSearchParams();
    if (params.q && params.q.trim() !== "") sp.set("q", params.q.trim());
    if (params.pets && params.pets !== "all") sp.set("pets", params.pets);
    if (params.priv && params.priv !== "all") sp.set("priv", params.priv);
    if (params.id && params.id.trim() !== "") sp.set("id", params.id.trim());
    if (params.city && params.city.trim() !== "") sp.set("city", params.city.trim());
    if (params.page && params.page > 1) sp.set("page", String(params.page));
    const s = sp.toString();
    return s ? `?${s}` : "";
  };

  // полный reset — URL без query
  const resetUrl = basePath;

  const pageUrl = (pageNum: number) =>
    basePath +
    buildQuery({
      q,
      pets: petsFilter,
      priv: privFilter,
      page: pageNum,
      id: idFilter,
      city: cityRaw,
    });

  return (
    <RoleGuard allowed={["registrar", "admin"]}>
      <main className="mx-auto max-w-6xl px-4 py-6 space-y-6">
        {/* Шапка */}
        <header className="flex items-center justify-between">
          <div>
            <Link
              href="/backoffice/registrar"
              className="text-xs text-gray-500 hover:text-gray-700 hover:underline"
            >
              ← В кабинет регистратуры
            </Link>
            <h1 className="mt-2 text-2xl font-bold tracking-tight">
              Картотека клиентов
            </h1>
            <p className="text-sm text-gray-500">
              Полный список клиентов с фильтрацией по питомцам, персональным
              данным и поиском. Пагинация по 50 записей на страницу.
            </p>
          </div>
          <RegistrarHeader />
        </header>

        {/* Сводка + глобальные фильтры */}
        <section className="rounded-2xl border bg-white p-4 space-y-3">
          {/* Компактная сводка одной строкой */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-semibold">Сводка</h2>
            <div className="flex flex-wrap gap-2 text-xs text-gray-600">
              <SummaryChip label="Клиентов" value={total} />
              <SummaryChip label="С питомцами" value={withPets} />
              <SummaryChip label="Без питомцев" value={withoutPets} />
              <SummaryChip label="С персональными данными" value={withPrivate} />
              <SummaryChip
                label="Без персональных данных"
                value={withoutPrivate}
              />
            </div>
          </div>

          {/* Глобальные фильтры + поиск */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pt-1">
            {/* Фильтр по питомцам */}
            <div className="space-y-1">
              <div className="text-[11px] text-gray-500">Питомцы</div>
              <div className="flex gap-2 flex-wrap">
                <FilterLink
                  href={basePath + buildQuery({ q, pets: "all", priv: privFilter, page: 1, id: idFilter, city: cityRaw })}
                  active={petsFilter === "all"}
                >
                  Все
                </FilterLink>
                <FilterLink
                  href={basePath + buildQuery({ q, pets: "with", priv: privFilter, page: 1, id: idFilter, city: cityRaw })}
                  active={petsFilter === "with"}
                >
                  С питомцами
                </FilterLink>
                <FilterLink
                  href={basePath + buildQuery({ q, pets: "without", priv: privFilter, page: 1, id: idFilter, city: cityRaw })}
                  active={petsFilter === "without"}
                >
                  Без питомцев
                </FilterLink>
              </div>
            </div>

            {/* Фильтр по персональным данным */}
            <div className="space-y-1">
              <div className="text-[11px] text-gray-500">Персональные данные</div>
              <div className="flex gap-2 flex-wrap">
                <FilterLink
                  href={basePath + buildQuery({ q, pets: petsFilter, priv: "all", page: 1, id: idFilter, city: cityRaw })}
                  active={privFilter === "all"}
                >
                  Все
                </FilterLink>
                <FilterLink
                  href={basePath + buildQuery({ q, pets: petsFilter, priv: "with", page: 1, id: idFilter, city: cityRaw })}
                  active={privFilter === "with"}
                >
                  С данными
                </FilterLink>
                <FilterLink
                  href={basePath + buildQuery({ q, pets: petsFilter, priv: "without", page: 1, id: idFilter, city: cityRaw })}
                  active={privFilter === "without"}
                >
                  Без данных
                </FilterLink>
              </div>
            </div>

            {/* Глобальный поиск */}
            <div className="w-full md:max-w-xs space-y-1">
              <div className="text-[11px] text-gray-500">Поиск</div>
              <form action={basePath} method="GET" className="flex gap-2">
                <input
                  key={q}
                  type="text"
                  name="q"
                  defaultValue={q}
                  className="flex-1 rounded-xl border px-3 py-1.5 text-xs"
                  placeholder="Имя, город, телефон или email…"
                />
                {/* сохраняем остальные фильтры */}
                <input type="hidden" name="pets" value={petsFilter} />
                <input type="hidden" name="priv" value={privFilter} />
                <input type="hidden" name="id" value={idFilter} />
                <input type="hidden" name="city" value={cityRaw} />
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs text-white hover:bg-emerald-700"
                >
                  Найти
                </button>
              </form>
              {q && (
                <p className="text-[10px] text-gray-500">
                  Поиск по запросу: <b>{q}</b> ·{" "}
                  <Link href={resetUrl} className="text-emerald-700 hover:underline">
                    сбросить строку поиска
                  </Link>
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Блок с клиентами */}
        <section className="rounded-2xl border bg-white p-4 space-y-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">Клиенты</h2>
              <p className="text-[11px] text-gray-500">
                Показаны{" "}
                {totalFiltered === 0 ? 0 : startIndex + 1}
                –
                {endIndex} из {totalFiltered} клиентов. Страница {page} из{" "}
                {Math.max(totalPages, 1)}.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href={resetUrl}
                className="rounded-xl px-4 py-2 text-xs font-medium border border-emerald-600 text-emerald-700 hover:bg-emerald-50"
              >
                Сбросить фильтры
              </Link>

              <Link
                href="/backoffice/registrar/clients/new"
                className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-700"
              >
                Добавить клиента
              </Link>
            </div>
          </div>

          {/* Фильтр по колонкам в виде капсул */}
          <form
            action={basePath}
            method="GET"
            className="flex flex-wrap gap-2 items-end pt-2 text-[11px]"
          >
            <ColumnFilter>
              <label className="mb-1 block text-gray-500">ID</label>
              <input
                type="text"
                name="id"
                defaultValue={idFilter}
                className="w-20 rounded-full border-none bg-white px-3 py-1 text-xs outline-none"
                placeholder="5"
              />
            </ColumnFilter>

            <ColumnFilter className="min-w-[160px] flex-1">
              <label className="mb-1 block text-gray-500">Клиент</label>
              <input
                type="text"
                name="q"
                defaultValue={q}
                className="w-full rounded-full border-none bg-white px-3 py-1 text-xs outline-none"
                placeholder="ФИО / e-mail / телефон"
              />
            </ColumnFilter>

            <ColumnFilter>
              <label className="mb-1 block text-gray-500">Город</label>
              <input
                type="text"
                name="city"
                defaultValue={cityRaw}
                className="w-28 rounded-full border-none bg-white px-3 py-1 text-xs outline-none"
                placeholder="Москва"
              />
            </ColumnFilter>

            <ColumnFilter>
              <label className="mb-1 block text-gray-500">Питомцы</label>
              <select
                name="pets"
                defaultValue={petsFilter}
                className="w-32 rounded-full border-none bg-white px-3 py-1 text-xs outline-none"
              >
                <option value="all">Все</option>
                <option value="with">Есть</option>
                <option value="without">Нет</option>
              </select>
            </ColumnFilter>

            <ColumnFilter>
              <label className="mb-1 block text-gray-500">Перс. данные</label>
              <select
                name="priv"
                defaultValue={privFilter}
                className="w-32 rounded-full border-none bg-white px-3 py-1 text-xs outline-none"
              >
                <option value="all">Все</option>
                <option value="with">Есть</option>
                <option value="without">Нет</option>
              </select>
            </ColumnFilter>

            {/* При любом изменении фильтра → на первую страницу */}
            <input type="hidden" name="page" value="1" />
          </form>

          {/* Таблица клиентов */}
          {visibleOwners.length === 0 ? (
            <p className="text-xs text-gray-400 pt-2">
              Клиенты не найдены по выбранным условиям.
            </p>
          ) : (
            <div className="overflow-x-auto pt-2">
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="border-b bg-gray-50 text-left text-[11px] uppercase text-gray-500">
                    <th className="px-2 py-2">ID</th>
                    <th className="px-2 py-2">Клиент</th>
                    <th className="px-2 py-2">Город</th>
                    <th className="px-2 py-2">Питомцы</th>
                    <th className="px-2 py-2">Персональные данные</th>
                    <th className="px-2 py-2 text-right">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleOwners.map((o) => {
                    const href =
                      `/backoffice/registrar/clients/${o.ownerId}` +
                      buildQuery({
                        q,
                        pets: petsFilter,
                        priv: privFilter,
                        page,
                        id: idFilter,
                        city: cityRaw,
                      });

                    return (
                      <tr
                        key={o.ownerId}
                        className="border-b last:border-0 hover:bg-gray-50"
                      >
                        <td className="px-2 py-2 text-[11px] text-gray-500">
                          {o.ownerId}
                        </td>
                        <td className="px-2 py-2">
                          <div className="font-medium text-gray-800">
                            {o.fullName}
                          </div>
                          {o.email && (
                            <div className="text-[10px] text-gray-500">
                              {o.email}
                            </div>
                          )}
                          {o.phone && (
                            <div className="text-[10px] text-gray-500">
                              {o.phone}
                            </div>
                          )}
                        </td>
                        <td className="px-2 py-2 text-[11px] text-gray-700">
                          {o.city || "—"}
                        </td>
                        <td className="px-2 py-2 text-[11px] text-gray-700">
                          {o.petsCount > 0 ? (
                            <span className="text-emerald-700">
                              {o.petsCount} питомц{plural(o.petsCount)}
                            </span>
                          ) : (
                            <span className="text-gray-500">нет</span>
                          )}
                        </td>
                        <td className="px-2 py-2 text-[11px] text-gray-700">
                          {o.hasPrivateData ? (
                            <span className="text-emerald-700">есть данные</span>
                          ) : (
                            <span className="text-gray-500">нет</span>
                          )}
                        </td>
                        <td className="px-2 py-2 text-right">
                          <Link
                            href={href}
                            className="text-[11px] font-medium text-emerald-700 hover:underline"
                          >
                            Открыть →
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Пагинация */}
          <div className="flex justify-between items-center pt-3 text-xs text-gray-600">
            <div>
              Страница {page} из {Math.max(totalPages, 1)}
            </div>
            <div className="flex gap-2">
              {page > 1 ? (
                <Link
                  href={pageUrl(page - 1)}
                  className="rounded-full border px-3 py-1.5 hover:bg-gray-50"
                >
                  ← Назад
                </Link>
              ) : (
                <span className="rounded-full border px-3 py-1.5 text-gray-400 cursor-default">
                  ← Назад
                </span>
              )}
              {page < totalPages ? (
                <Link
                  href={pageUrl(page + 1)}
                  className="rounded-full border px-3 py-1.5 hover:bg-gray-50"
                >
                  Вперёд →
                </Link>
              ) : (
                <span className="rounded-full border px-3 py-1.5 text-gray-400 cursor-default">
                  Вперёд →
                </span>
              )}
            </div>
          </div>
        </section>
      </main>
    </RoleGuard>
  );
}

/** Чип для сводки */
function SummaryChip({ label, value }: { label: string; value: number }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1">
      <span className="text-[11px] text-gray-500">{label}</span>
      <span className="text-sm font-semibold text-gray-900">{value}</span>
    </div>
  );
}

/** Капсула-фильтр для колонок */
function ColumnFilter({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={
        "flex flex-col rounded-full border border-gray-200 bg-gray-50 px-3 py-1 " +
        className
      }
    >
      {children}
    </div>
  );
}

/** Склонение "питомец" → "питомцев/питомца" */
function plural(n: number) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return "а";
  return "ев";
}

type FilterLinkProps = {
  href: string;
  active: boolean;
  children: ReactNode;
};

function FilterLink({ href, active, children }: FilterLinkProps) {
  return (
    <Link
      href={href}
      className={`px-3 py-1.5 rounded-full text-xs border ${
        active
          ? "bg-emerald-600 text-white border-emerald-600"
          : "text-gray-700 border-gray-300 hover:bg-gray-50"
      }`}
    >
      {children}
    </Link>
  );
}
