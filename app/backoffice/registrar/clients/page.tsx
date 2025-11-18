"use client";

import Link from "next/link";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { RegistrarHeader } from "@/components/registrar/RegistrarHeader";
import { getOwnersSummary } from "@/lib/clients";
import { useSearchParams } from "next/navigation";

export default async function RegistrarClientsPage() {
  const owners = await getOwnersSummary();

  return <ClientsDashboard owners={owners} />;
}

//
// CLIENT-SIDE COMPONENT
//

import { useState, useMemo } from "react";

function ClientsDashboard({ owners }: { owners: any[] }) {
  const searchParams = useSearchParams();

  // фильтры
  const initialPets = searchParams.get("pets") ?? "all";
  const initialPriv = searchParams.get("priv") ?? "all";
  const initialMode = searchParams.get("mode") ?? "dashboard";

  const [petsFilter, setPetsFilter] = useState(initialPets);
  const [privFilter, setPrivFilter] = useState(initialPriv);
  const [mode, setMode] = useState<"dashboard" | "all">(initialMode as any);

  const filtered = useMemo(() => {
    let f = [...owners];

    // petsFilter
    if (petsFilter === "with") {
      f = f.filter((o) => o.petsCount > 0);
    } else if (petsFilter === "without") {
      f = f.filter((o) => o.petsCount === 0);
    }

    // privFilter
    if (privFilter === "with") {
      f = f.filter((o) => o.hasPrivateData);
    } else if (privFilter === "without") {
      f = f.filter((o) => !o.hasPrivateData);
    }

    return f;
  }, [owners, petsFilter, privFilter]);

  const visibleOwners =
    mode === "all"
      ? filtered
      : filtered.slice(0, 10); // свернутая версия

  // формируем ссылку для сохранения фильтров
  const buildUrl = ({
    pets,
    priv,
    modeValue,
  }: {
    pets: string;
    priv: string;
    modeValue: "dashboard" | "all";
  }) =>
    `/backoffice/registrar/clients?pets=${pets}&priv=${priv}&mode=${modeValue}`;

  const fullUrl = buildUrl({
    pets: petsFilter,
    priv: privFilter,
    modeValue: "all",
  });

  const dashboardUrl = buildUrl({
    pets: petsFilter,
    priv: privFilter,
    modeValue: "dashboard",
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
              Фильтрация по питомцам и персональным данным. Полная или
              краткая картотека.
            </p>
          </div>

          <RegistrarHeader />
        </header>

        {/* --- Сводка --- */}
        <section className="rounded-2xl border bg-white p-4 space-y-4">
          <h2 className="text-base font-semibold">Сводка</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="rounded-xl border bg-gray-50 p-3">
              <div className="text-[11px] uppercase text-gray-500">Клиентов</div>
              <div className="mt-1 text-xl font-semibold">{owners.length}</div>
            </div>

            <div className="rounded-xl border bg-gray-50 p-3">
              <div className="text-[11px] uppercase text-gray-500">
                С питомцами
              </div>
              <div className="mt-1 text-xl font-semibold">
                {owners.filter((o) => o.petsCount > 0).length}
              </div>
            </div>

            <div className="rounded-xl border bg-gray-50 p-3">
              <div className="text-[11px] uppercase text-gray-500">
                Без питомцев
              </div>
              <div className="mt-1 text-xl font-semibold">
                {owners.filter((o) => o.petsCount === 0).length}
              </div>
            </div>

            <div className="rounded-xl border bg-gray-50 p-3">
              <div className="text-[11px] uppercase text-gray-500">
                С персональными данными
              </div>
              <div className="mt-1 text-xl font-semibold">
                {owners.filter((o) => o.hasPrivateData).length}
              </div>
            </div>
          </div>

          {/* Фильтры */}
          <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
            {/* Фильтр по питомцам */}
            <div className="space-y-1">
              <div className="text-[11px] text-gray-500">Питомцы</div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPetsFilter("all")}
                  className={`px-3 py-1.5 rounded-xl text-xs border ${
                    petsFilter === "all"
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "text-gray-700 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  Все
                </button>
                <button
                  onClick={() => setPetsFilter("with")}
                  className={`px-3 py-1.5 rounded-xl text-xs border ${
                    petsFilter === "with"
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "text-gray-700 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  С питомцами
                </button>
                <button
                  onClick={() => setPetsFilter("without")}
                  className={`px-3 py-1.5 rounded-xl text-xs border ${
                    petsFilter === "without"
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "text-gray-700 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  Без питомцев
                </button>
              </div>
            </div>

            {/* Фильтр по приватным данным */}
            <div className="space-y-1">
              <div className="text-[11px] text-gray-500">Персональные данные</div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPrivFilter("all")}
                  className={`px-3 py-1.5 rounded-xl text-xs border ${
                    privFilter === "all"
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "text-gray-700 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  Все
                </button>
                <button
                  onClick={() => setPrivFilter("with")}
                  className={`px-3 py-1.5 rounded-xl text-xs border ${
                    privFilter === "with"
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "text-gray-700 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  С данными
                </button>
                <button
                  onClick={() => setPrivFilter("without")}
                  className={`px-3 py-1.5 rounded-xl text-xs border ${
                    privFilter === "without"
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "text-gray-700 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  Без данных
                </button>
              </div>
            </div>
          </div>

          {/* Кнопки */}
          <div className="flex justify-end gap-3">
            {/* Новая кнопка – Полная картотека */}
            <Link
              href={fullUrl}
              className="rounded-xl px-4 py-2 text-xs font-medium border border-emerald-600 text-emerald-700 hover:bg-emerald-50"
            >
              Полная картотека
            </Link>

            {/* Вторая кнопка — свернуть */}
            <Link
              href={dashboardUrl}
              className="rounded-xl px-4 py-2 text-xs font-medium border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Свернуть до 10 клиентов
            </Link>

            <Link
              href="/backoffice/registrar/clients/new"
              className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-700"
            >
              Добавить клиента
            </Link>
          </div>
        </section>

        {/* Клиенты */}
        <section className="rounded-2xl border bg-white p-4 space-y-3">
          <h2 className="text-base font-semibold">Клиенты</h2>

          {visibleOwners.length === 0 && (
            <p className="text-xs text-gray-400">
              Клиенты не найдены по выбранным фильтрам.
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
                    <th className="px-2 py-2">Персональные данные</th>
                    <th className="px-2 py-2 text-right">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleOwners.map((o) => (
                    <tr
                      key={o.ownerId}
                      className="border-b last:border-0 hover:bg-gray-50"
                    >
                      <td className="px-2 py-2">
                        <div className="font-medium text-gray-800">
                          {o.fullName}
                        </div>
                        {o.email && (
                          <div className="text-[10px] text-gray-500">{o.email}</div>
                        )}
                        {o.phone && (
                          <div className="text-[10px] text-gray-500">{o.phone}</div>
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
      </main>
    </RoleGuard>
  );
}

function plural(n: number) {
  if (n % 10 === 1 && n % 100 !== 11) return "а";
  if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) return "а";
  return "ев";
}
