import Link from "next/link";
import type { ReactNode } from "react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { RegistrarHeader } from "@/components/registrar/RegistrarHeader";
import { getOwnersSummary } from "@/lib/clients";

// чтобы не кэшировался результат и страница всегда учитывала query-параметры
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

  const qRaw = (searchParams?.q ?? "").trim();
  const q = qRaw === "" ? "" : qRaw;

  const petsFilter = (searchParams?.pets ?? "all") as "all" | "with" | "without";
  const privFilter = (searchParams?.priv ?? "all") as "all" | "with" | "without";

  const idFilter = (searchParams?.id ?? "").trim();
  const cityFilter = (searchParams?.city ?? "").trim().toLowerCase();

  let page = Number.parseInt(searchParams?.page ?? "1", 10);
  if (!Number.isFinite(page) || page < 1) page = 1;

  // --- сводка ---
  const total = owners.length;
  const withPets = owners.filter((o) => o.petsCount > 0).length;
  const withoutPets = total - withPets;
  const withPrivate = owners.filter((o) => o.hasPrivateData).length;

  // --- фильтрация ---
  let filtered = owners;

  // глобальный поиск
  if (q) {
    const qLower = q.toLowerCase();
    filtered = filtered.filter((o) => {
      const fields = [o.fullName ?? "", o.city ?? "", o.email ?? "", o.phone ?? ""];
      return fields.some((f) => f.toLowerCase().includes(qLower));
    });
  }

  // фильтр по ID
  if (idFilter) {
    filtered = filtered.filter((o) =>
      String(o.ownerId ?? "").includes(idFilter)
    );
  }

  // фильтр по городу
  if (cityFilter) {
    filtered = filtered.filter((o) =>
      (o.city ?? "").toLowerCase().includes(cityFilter)
    );
  }

  // фильтр по питомцам
  if (petsFilter === "with") {
    filtered = filtered.filter((o) => o.petsCount > 0);
  } else if (petsFilter === "without") {
    filtered = filtered.filter((o) => o.petsCount === 0);
  }

  // фильтр по персональным данным
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
    if (params.q && params.q.trim() !== "") sp.еt("q", params.q.trim());
    if (params.pets && params.pets !== "all") sp.еt("pets", params.pets);
    if (params.priv && params.priv !== "all") sp.еt("priv", params.priv);
    if (params.id && params.id.trim() !== "") sp.еt("id", params.id.trim());
    if (params.city && params.city.trim() !== "") sp.еt("city", params.city.trim());
    if (params.page && params.page > 1) sp.еt("page", String(params.page));
    const s = sp.toString();
    return s ? `?${s}` : "";
  };

  // полный сброс всего: /backoffice/registrar/clients без query
  const resetUrl = basePath;

  const pageUrl = (pageNum: number) =>
    basePath +
    buildQuery({
      q,
      pets: petsFilter,
      priv: privFilter,
      page: pageNum,
      id: idFilter,
      city: cityFilter,
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

        {/* Сводка */}
        <section className="rounded-2xl border bg-white p-4 space-y-4">
          <h2 className="text-base font-semibold">Сводка</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <SummaryCard label="Клиентов" value={total} />
            <SummaryCard label="С питомцами" value={withPets} />
            <SummaryCard label="Без питомцев" value={withoutPets} />
            <SummaryCard label="С персональными данными" value={withPrivate} />
          </div>

          {/* Глобальные фильтры + поиск */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Фильтр по питомцам */}
            <div className="space-y-1">
              <div className="text-[11px] text-gray-500">Питомцы</div>
              <div className="flex gap-2">
                <FilterLink
                  href={basePath + buildQuery({ q, pets: "all", priv: privFilter, page: 1, id: idFilter, city: cityFilter })}
                  active={petsFilter === "all"}
                >
                  Все
                </FilterLink>
                <FilterLink
                  href={basePath + buildQuery({ q, pets: "with", priv: privFilter, page: 1, id: idFilter, city: cityFilter })}
                  active={petsFilter === "with"}
                >
                  С питомцами
                </FilterLink>
                <FilterLink
                  href={basePath + buildQuery({ q, pets: "without", priv: privFilter, page: 1, id: idFilter, city: cityFilter })}
                  active={petsFilter === "without"}
                >
                  Без питомцев
                </FilterLink>
              </div>
            </div>

            {/* Фильтр по персональным данным */}
            <div className="space-y-1">
              <div className="text-[11px] text-gray-500">
                Персональные данные
              </div>
              <div className="flex gap-2">
                <FilterLink
                  href={basePath + buildQuery({ q, pets: petsFilter, priv: "all", page: 1, id: idFilter, city: cityFilter })}
                  active={privFilter === "all"}
                >
                  Все
                </FilterLink>
                <FilterLink
                  href={basePath + buildQuery({ q, pets: petsFilter, priv: "with", page: 1, id: idFilter, city: cityFilter })}
                  active={privFilter === "with"}
                >
                  С данными
                </FilterLink>
                <FilterLink
                  href={basePath + buildQuery({ q, pets: petsFilter, priv: "without", page: 1, id: idFilter, city: cityFilter })}
                  active={privFilter === "without"}
                >
                  Без данных
                </FilterLink>
              </div>
            </div>

            {/* Поиск */}
            <div className="w-full md:max-w-xs space-y-1">
              <div className="text-[11px] text-gray-500">Поиск</div>
              <form action={basePath} method="GET" className="flex gap-2">
                <input
                  key={q} // важно для визуального сброса
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
                <input type="hidden" name="city" value={cityFilter} />
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs text-white hover:bg-emerald-700"
                >
                  Найти
                </button>
              </form>
              {q && (
                <p className="text-[10px] text-gray-500">
                  Поиск по запросу: <b>{q}</b>
                  {" · "}
                  <Link href={resetUrl} className="text-emerald-700 hover:underline">
                    сбросить строку поиска
                  </Link>
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Таблица клиентов */}
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

          {/* Фильтры по колонкам */}
          <form
            action={basePath}
            method="GET"
            className="grid grid-cols-5 gap-2 items-end pt-2 text-[11px]"
          >
            {/* ID */}
            <div>
              <label className="block text-gray-500 mb-1">ID</label>
              <input
                type="text"
                name="id"
                defaultValue={idFilter}
                className="w-full rounded-xl border px-2 py-1"
                placeholder="например, 5"
              />
            </div>

            {/* Клиент — можно использовать тулбар сверху (поэтому здесь ничего) */}
            <div>
              <label className="block text-gray-500 mb-1">Клиент</label>
              <input
                type="text"
                name="q"
                defaultValue={q}
                className="w-full rounded-xl border px-2 py-1"
                placeholder="ФИО / e-mail / телефон"
              />
            </div>

            {/* Город */}
            <div>
              <label className="block text-gray-500 mb-1">Город</label>
              <input
                type="text"
                name="city"
                defaultValue={cityFilter}
                className="w-full rounded-xl border px-2 py-1"
                placeholder="Москва"
              />
            </div>

            {/* Питомцы */}
            <div>
              <label className="block text-gray-500 mb-1">Питомцы</label>
              <select
                name="pets"
                defaultValue={petsFilter}
                className="w-full rounded-xl border px-2 py-1"
              >
                <option value="all">Все</option>
                <option value="with">Есть</option>
                <option value="without">Нет</option>
              </select>
            </div>

            {/* Персональные данные */}
            <div>
              <label className="block text-gray-500 mb-1">Данные</label>
              <select
                name="priv"
                defaultValue={privFilter}
                className="w-full rounded-xl border px-2 py-1"
              >
                <option value="all">Все</option>
                <option value="with">Есть</option>
                <option value="without">Нет</option>
              </select>
            </div>

            {/* скрытые поля для сброса на первую страницу */}
            <input type="hidden" name="page" value="1" />
          </form>

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
                        city: cityFilter,
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
                  className="rounded-xl border px-3 py-1.5 hover:bg-gray-50"
                >
                  ← Назад
                </Link>
              ) : (
                <span className="rounded-xl border px-3 py-1.5 text-gray-400 cursor-default">
                  ← Назад
                </span>
              )}
              {page < totalPages ? (
                <Link
                  href={pageUrl(page + 1)}
                  className="rounded-xl border px-3 py-1.5 hover:bg-gray-50"
                >
                  Вперёд →
                </Link>
              ) : (
                <span className="rounded-xl border px-3 py-1.5 text-gray-400 cursor-default">
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

/** карточка сводки */
function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border bg-gray-50 p-3">
      <div className="text-[11px] uppercase text-gray-500">{label}</div>
      <div className="mt-1 text-xl font-semibold">{value}</div>
    </div>
  );
}

/** склонение "питомец" → "питомцев/питомца" */
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
      className={`px-3 py-1.5 rounded-xl text-xs border ${
        active
          ? "bg-emerald-600 text-white border-emerald-600"
          : "text-gray-700 border-gray-300 hover:bg-gray-50"
      }`}
    >
      {children}
    </Link>
  );
}
