"use client";

import { useEffect, useState, FormEvent } from "react";
import Link from "next/link";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { RegistrarHeader } from "@/components/registrar/RegistrarHeader";
import { getOwnersSummary, type OwnerSummary } from "@/lib/clients";

type PetsFilter = "all" | "with" | "without";
type PrivateFilter = "all" | "with" | "without";

export default function RegistrarClientsPage() {
  const [owners, setOwners] = useState<OwnerSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // фильтры
  const [petsFilter, setPetsFilter] = useState<PetsFilter>("all");
  const [privateFilter, setPrivateFilter] =
    useState<PrivateFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");

  useEffect(() => {
    let ignore = false;

    async function load() {
      setLoading(true);
      setLoadError(null);
      try {
        const data = await getOwnersSummary();
        if (!ignore) {
          setOwners(data);
        }
      } catch (e) {
        console.error("load clients error", e);
        if (!ignore) {
          setLoadError("Ошибка загрузки картотеки клиентов.");
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    load();
    return () => {
      ignore = true;
    };
  }, []);

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput.trim());
  };

  // агрегаты
  const totalClients = owners.length;
  const withPetsCount = owners.filter((o) => o.petsCount > 0).length;
  const withoutPetsCount = totalClients - withPetsCount;
  const withPrivateCount = owners.filter((o) => o.hasPrivateData).length;
  const withoutPrivateCount = totalClients - withPrivateCount;

  // применение фильтров
  const normalizedSearch = searchQuery.toLowerCase();

  const filteredOwners = owners
    .filter((o) => {
      if (petsFilter === "with" && o.petsCount === 0) return false;
      if (petsFilter === "without" && o.petsCount > 0) return false;
      return true;
    })
    .filter((o) => {
      if (privateFilter === "with" && !o.hasPrivateData) return false;
      if (privateFilter === "without" && o.hasPrivateData) return false;
      return true;
    })
    .filter((o) => {
      if (!normalizedSearch) return true;
      const name = o.fullName.toLowerCase();
      const city = (o.city || "").toLowerCase();
      const email = (o.email || "").toLowerCase();
      const phone = (o.phone || "").toLowerCase();
      return (
        name.includes(normalizedSearch) ||
        city.includes(normalizedSearch) ||
        email.includes(normalizedSearch) ||
        phone.includes(normalizedSearch)
      );
    });

  const visibleOwners = filteredOwners.slice(0, 10);

  const pillClass = (active: boolean) =>
    active
      ? "rounded-full bg-emerald-600 text-white px-3 py-1 text-[11px]"
      : "rounded-full border border-gray-300 px-3 py-1 text-[11px] text-gray-600 hover:bg-gray-50";

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
              Список владельцев и их питомцев. Поиск по имени, городу или
              контактам и фильтр по наличию питомцев и персональных данных.
            </p>
          </div>
          <RegistrarHeader />
        </header>

        {/* Ошибка загрузки */}
        {loadError && (
          <section className="rounded-2xl border bg-white p-4">
            <p className="text-sm text-red-700">{loadError}</p>
          </section>
        )}

        {/* Поиск */}
        <section className="rounded-2xl border bg-white p-4">
          <form
            onSubmit={handleSearchSubmit}
            className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between"
          >
            <div className="flex-1">
              <label className="text-[11px] text-gray-500 mb-1 block">
                Поиск по картотеке
              </label>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Например: Иванов, Москва, +7 900…"
                className="w-full rounded-xl border px-3 py-2 text-xs"
              />
            </div>
            <div className="pt-4 md:pt-6 md:pl-4">
              <button
                type="submit"
                className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-700"
              >
                Искать
              </button>
            </div>
          </form>
        </section>

        {/* Сводка + фильтры */}
        <section className="rounded-2xl border bg-white p-4 space-y-4">
          <h2 className="text-base font-semibold">
            Сводка по картотеке (с учётом фильтра)
          </h2>

          {/* Карточки */}
          <div className="grid gap-3 md:grid-cols-4 text-xs">
            <div className="rounded-xl border px-3 py-2">
              <div className="text-gray-500">Клиентов</div>
              <div className="mt-1 text-lg font-semibold text-gray-900">
                {totalClients}
              </div>
            </div>
            <div className="rounded-xl border px-3 py-2">
              <div className="text-gray-500">Клиентов с питомцами</div>
              <div className="mt-1 text-lg font-semibold text-gray-900">
                {withPetsCount}
              </div>
            </div>
            <div className="rounded-xl border px-3 py-2">
              <div className="text-gray-500">Клиентов без питомцев</div>
              <div className="mt-1 text-lg font-semibold text-gray-900">
                {withoutPetsCount}
              </div>
            </div>
            <div className="rounded-xl border px-3 py-2">
              <div className="text-gray-500">
                С персональными данными
              </div>
              <div className="mt-1 text-lg font-semibold text-gray-900">
                {withPrivateCount}
              </div>
            </div>
          </div>

          {/* Фильтры */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <div className="text-[11px] text-gray-500">
                Питомцы
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className={pillClass(petsFilter === "all")}
                  onClick={() => setPetsFilter("all")}
                >
                  Все
                </button>
                <button
                  type="button"
                  className={pillClass(petsFilter === "with")}
                  onClick={() => setPetsFilter("with")}
                >
                  С питомцами
                </button>
                <button
                  type="button"
                  className={pillClass(petsFilter === "without")}
                  onClick={() => setPetsFilter("without")}
                >
                  Без питомцев
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-[11px] text-gray-500">
                Персональные данные
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className={pillClass(privateFilter === "all")}
                  onClick={() => setPrivateFilter("all")}
                >
                  Все
                </button>
                <button
                  type="button"
                  className={pillClass(privateFilter === "with")}
                  onClick={() => setPrivateFilter("with")}
                >
                  С данными
                </button>
                <button
                  type="button"
                  className={pillClass(privateFilter === "without")}
                  onClick={() => setPrivateFilter("without")}
                >
                  Без данных
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Блок “Клиенты” */}
        <section className="rounded-2xl border bg-white p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold">Клиенты</h2>
              <p className="text-[11px] text-gray-500">
                Показаны последние{" "}
                {visibleOwners.length} клиентов по текущему фильтру.
              </p>
            </div>
            <div className="flex gap-2">
              {/* тут позже можно добавить ссылку “Полная картотека →” */}
              <Link
                href="/backoffice/registrar/clients/new"
                className="rounded-xl bg-emerald-600 px-4 py-1.5 text-[11px] font-medium text-white hover:bg-emerald-700"
              >
                Добавить клиента
              </Link>
            </div>
          </div>

          {visibleOwners.length === 0 && (
            <p className="text-xs text-gray-400">
              По заданным условиям фильтра клиенты не найдены. Попробуйте
              изменить поиск или фильтр.
            </p>
          )}

          {visibleOwners.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="border-b bg-gray-50 text-left text-[11px] uppercase text-gray-500">
                    <th className="px-2 py-2">Клиент</th>
                    <th className="px-2 py-2">Город</th>
                    <th className="px-2 py-2">Питомцы</th>
                    <th className="px-2 py-2">Последняя активность</th>
                    <th className="px-2 py-2 text-right">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleOwners.map((o) => (
                    <tr
                      key={o.ownerId}
                      className="border-b last:border-0 hover:bg-gray-50"
                    >
                      <td className="px-2 py-2 align-top">
                        <div className="text-sm font-medium text-gray-900">
                          {o.fullName}
                        </div>
                        <div className="text-[11px] text-gray-500">
                          Персональные данные:{" "}
                          {o.hasPrivateData ? "есть" : "нет"}
                        </div>
                      </td>
                      <td className="px-2 py-2 align-top text-[11px] text-gray-700">
                        {o.city || "—"}
                      </td>
                      <td className="px-2 py-2 align-top text-[11px] text-gray-700">
                        {o.petsCount > 0 ? (
                          <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] text-emerald-700">
                            {o.petsCount} питом{" "}
                          </span>
                        ) : (
                          <span className="text-gray-400">
                            нет питомцев
                          </span>
                        )}
                      </td>
                      <td className="px-2 py-2 align-top text-[11px] text-gray-700">
                        {o.appointmentsCount > 0
                          ? "Есть консультации"
                          : "Консультаций нет"}
                      </td>
                      <td className="px-2 py-2 align-top text-right">
                        <Link
                          href={`/backoffice/registrar/clients/${o.ownerId}`}
                          className="text-[11px] font-medium text-emerald-700 hover:underline"
                        >
                          Открыть →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {loading && !loadError && owners.length === 0 && (
          <section className="rounded-2xl border bg-white p-4">
            <p className="text-xs text-gray-500">
              Загрузка картотеки…
            </p>
          </section>
        )}
      </main>
    </RoleGuard>
  );
}
