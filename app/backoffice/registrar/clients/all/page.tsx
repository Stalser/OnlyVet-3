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

export default async function RegistrarClientsAllPage({ searchParams }: PageProps) {
  const owners = await getOwnersSummary();

  const petsFilter = searchParams?.pets ?? "all";
  const privFilter = searchParams?.priv ?? "all";

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

  const buildUrl = (pets: string, priv: string) =>
    `/backoffice/registrar/clients/all?pets=${pets}&priv=${priv}`;

  return (
    <RoleGuard allowed={["registrar", "admin"]}>
      <main className="mx-auto max-w-6xl px-4 py-6 space-y-6">
        {/* Шапка */}
        <header className="flex items-center justify-between">
          <div>
            <Link
              href="/backoffice/registrar/clients"
              className="text-xs text-gray-500 hover:text-gray-700 hover:underline"
            >
              ← Назад к сводке картотеки
            </Link>
            <h1 className="mt-2 text-2xl font-bold tracking-tight">
              Полная картотека клиентов
            </h1>
            <p className="text-sm text-gray-500">
              Все клиенты OnlyVet с возможностью фильтрации по питомцам и персональным данным.
            </p>
          </div>
          <RegistrarHeader />
        </header>

        {/* Фильтры */}
        <section className="rounded-2xl border bg-white p-4 space-y-4">
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

        {/* Таблица всех клиентов */}
        <section className="rounded-2xl border bg-white p-4 space-y-3">
          <h2 className="text-sm font-semibold">Все клиенты</h2>
          {filtered.length === 0 ? (
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
                  {filtered.map((o) => (
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
