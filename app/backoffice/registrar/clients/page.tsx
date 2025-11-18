import Link from "next/link";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { RegistrarHeader } from "@/components/registrar/RegistrarHeader";
import { getOwnersSummary } from "@/lib/clients";

type PageProps = {
  searchParams?: {
    pets?: "all" | "with" | "without";
    priv?: "all" | "with" | "without";
  };
};

export default async function RegistrarClientsPage({ searchParams }: PageProps) {
  const owners = await getOwnersSummary();

  const petsFilter = searchParams?.pets ?? "all";
  const privFilter = searchParams?.priv ?? "all";

  const total = owners.length;
  const withPets = owners.filter((o) => o.petsCount > 0).length;
  const withoutPets = total - withPets;
  const withPrivate = owners.filter((o) => o.hasPrivateData).length;

  let filtered = owners;

  if (petsFilter === "with") {
    filtered = filtered.filter((o) => o.petsCount > 0);
  } else if (petsFilter === "without") {
    filtered = filtered.filter((o) => o.petsCount === 0);
  }

  if (privFilter === "with") {
    filtered = filtered.filter((o) => o.hasPrivateData);
  } else if (privFilter === "without") {
    filtered = filtered.filter((o) => !o.hasPrivateData);
  }

  const visibleOwners = filtered.slice(0, 10);

  const buildUrl = (pets: string, priv: string) =>
    `/backoffice/registrar/clients?pets=${pets}&priv=${priv}`;

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
              Список владельцев и их питомцев. Поиск по имени, городу или контактам, фильтр по наличию питомцев и персональных данных.
            </p>
          </div>
          <RegistrarHeader />
        </header>

        {/* Поиск (пока визуальный, без реального запроса) */}
        <section className="rounded-2xl border bg-white p-4 space-y-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex-1">
              <label className="mb-1 block text-[11px] text-gray-500">
                Поиск по картотеке
              </label>
              <input
                type="text"
                className="w-full rounded-xl border px-3 py-1.5 text-xs"
                placeholder="Например: Иванов, Москва, +7 900..."
                disabled
              />
              <p className="mt-1 text-[10px] text-gray-400">
                Поиск по картотеке появится позже. Сейчас фильтрация работает по питомцам и персональным данным.
              </p>
            </div>
            <div className="md:w-40">
              <button
                type="button"
                className="mt-4 w-full rounded-xl bg-gray-100 px-4 py-1.5 text-xs text-gray-500 md:mt-6"
                disabled
              >
                Искать
              </button>
            </div>
          </div>
        </section>

        {/* Сводка + фильтры */}
        <section className="rounded-2xl border bg-white p-4 space-y-4">
          <h2 className="text-sm font-semibold">
            Сводка по картотеке (с учётом фильтра)
          </h2>

          <div className="grid gap-3 md:grid-cols-4">
            <div className="rounded-xl border bg-gray-50 px-3 py-2">
              <div className="text-[11px] text-gray-500">Клиентов</div>
              <div className="text-xl font-semibold text-gray-900">
                {total}
              </div>
            </div>
            <div className="rounded-xl border bg-gray-50 px-3 py-2">
              <div className="text-[11px] text-gray-500">
                Клиентов с питомцами
              </div>
              <div className="text-xl font-semibold text-gray-900">
                {withPets}
              </div>
            </div>
            <div className="rounded-xl border bg-gray-50 px-3 py-2">
              <div className="text-[11px] text-gray-500">
                Клиентов без питомцев
              </div>
              <div className="text-xl font-semibold text-gray-900">
                {withoutPets}
              </div>
            </div>
            <div className="rounded-xl border bg-gray-50 px-3 py-2">
              <div className="text-[11px] text-gray-500">
                С персональными данными
              </div>
              <div className="text-xl font-semibold text-gray-900">
                {withPrivate}
              </div>
            </div>
          </div>

          {/* Фильтры */}
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <div className="mb-1 text-[11px] text-gray-500">Питомцы</div>
              <div className="inline-flex rounded-full border bg-gray-50 p-1 text-[11px]">
                <Link
                  href={buildUrl("all", privFilter)}
                  className={`rounded-full px-3 py-1 ${
                    petsFilter === "all"
                      ? "bg-emerald-600 text-white"
                      : "text-gray-700 hover:bg-white"
                  }`}
                >
                  Все
                </Link>
                <Link
                  href={buildUrl("with", privFilter)}
                  className={`rounded-full px-3 py-1 ${
                    petsFilter === "with"
                      ? "bg-emerald-600 text-white"
                      : "text-gray-700 hover:bg-white"
                  }`}
                >
                  С питомцами
                </Link>
                <Link
                  href={buildUrl("without", privFilter)}
                  className={`rounded-full px-3 py-1 ${
                    petsFilter === "without"
                      ? "bg-emerald-600 text-white"
                      : "text-gray-700 hover:bg-white"
                  }`}
                >
                  Без питомцев
                </Link>
              </div>
            </div>
            <div>
              <div className="mb-1 text-[11px] text-gray-500">
                Персональные данные
              </div>
              <div className="inline-flex rounded-full border bg-gray-50 p-1 text-[11px]">
                <Link
                  href={buildUrl(petsFilter, "all")}
                  className={`rounded-full px-3 py-1 ${
                    privFilter === "all"
                      ? "bg-emerald-600 text-white"
                      : "text-gray-700 hover:bg-white"
                  }`}
                >
                  Все
                </Link>
                <Link
                  href={buildUrl(petsFilter, "with")}
                  className={`rounded-full px-3 py-1 ${
                    privFilter === "with"
                      ? "bg-emerald-600 text-white"
                      : "text-gray-700 hover:bg-white"
                  }`}
                >
                  С данными
                </Link>
                <Link
                  href={buildUrl(petsFilter, "without")}
                  className={`rounded-full px-3 py-1 ${
                    privFilter === "without"
                      ? "bg-emerald-600 text-white"
                      : "text-gray-700 hover:bg-white"
                  }`}
                >
                  Без данных
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Клиенты (10 по фильтру) */}
        <section className="rounded-2xl border bg-white p-4 space-y-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-sm font-semibold">Клиенты</h2>
              <p className="text-[11px] text-gray-500">
                Показаны последние {visibleOwners.length} клиентов по текущему фильтру.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/backoffice/registrar/clients/all"
                className="rounded-xl border px-3 py-1.5 text-[11px] text-gray-700 hover:bg-gray-50"
              >
                Полная картотека →
              </Link>
              <Link
                href="/backoffice/registrar/clients/new"
                className="rounded-xl bg-emerald-600 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-emerald-700"
              >
                Добавить клиента
              </Link>
            </div>
          </div>

          {visibleOwners.length === 0 ? (
            <p className="text-xs text-gray-400">
              По текущему фильтру клиенты не найдены.
            </p>
          ) : (
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
                      <td className="px-2 py-2 align-top text-[11px] text-gray-800">
                        <div className="font-medium">
                          {o.fullName || "Без имени"}
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
                      <td className="px-2 py-2 align-top text-[11px] text-gray-700">
                        {o.city || "—"}
                      </td>
                      <td className="px-2 py-2 align-top text-[11px] text-gray-700">
                        {o.petsCount > 0 ? (
                          <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] text-emerald-700">
                            {o.petsCount} питомц.
                          </span>
                        ) : (
                          <span className="text-[10px] text-gray-400">
                            нет питомцев
                          </span>
                        )}
                      </td>
                      <td className="px-2 py-2 align-top text-[11px] text-gray-700">
                        {o.hasPrivateData ? (
                          <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] text-emerald-700">
                            есть данные
                          </span>
                        ) : (
                          <span className="text-[10px] text-gray-400">
                            нет данных
                          </span>
                        )}
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
      </main>
    </RoleGuard>
  );
}
