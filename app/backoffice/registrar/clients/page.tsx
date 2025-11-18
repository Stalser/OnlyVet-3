import Link from "next/link";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { RegistrarHeader } from "@/components/registrar/RegistrarHeader";
import { getOwnersSummary } from "@/lib/clients";

type PageProps = {
  searchParams?: {
    pets?: "all" | "with" | "without";
    priv?: "all" | "with" | "without";
    mode?: "dashboard" | "all";
  };
};

export default async function RegistrarClientsPage({ searchParams }: PageProps) {
  const owners = await getOwnersSummary();

  const petsFilter = (searchParams?.pets ?? "all") as "all" | "with" | "without";
  const privFilter = (searchParams?.priv ?? "all") as "all" | "with" | "without";
  const mode = (searchParams?.mode === "all" ? "all" : "dashboard") as
    | "all"
    | "dashboard";

  // --- агрегаты ---

  const total = owners.length;
  const withPets = owners.filter((o) => o.petsCount > 0).length;
  const withoutPets = total - withPets;
  const withPrivate = owners.filter((o) => o.hasPrivateData).length;

  // --- фильтрация ---

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

  const visibleOwners =
    mode === "all" ? filtered : filtered.slice(0, 10);

  // ссылки с сохранением фильтров
  const fullUrl = `/backoffice/registrar/clients?pets=${petsFilter}&priv=${privFilter}&mode=all`;
  const dashboardUrl = `/backoffice/registrar/clients?pets=${petsFilter}&priv=${privFilter}&mode=dashboard`;
  const showCollapseButton = filtered.length > 10 && mode === "all";

  return (
    <RoleGuard allowed={["registrar", "admin"]}>
      <main className="mx-auto max-w-6xl px-4 py-6 space-y-6">
        {/* ШАПКА */}
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

        {/* СВОДКА */}
        <section className="rounded-2xl border bg-white p-4 space-y-4">
          <h2 className="text-base font-semibold">Сводка</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="rounded-xl border bg-gray-50 p-3">
              <div className="text-[11px] uppercase text-gray-500">
                Клиентов
              </div>
              <div className="mt-1 text-xl font-semibold">{total}</div>
            </div>

            <div className="rounded-xl border bg-gray-50 p-3">
              <div className="text-[11px] uppercase text-gray-500">
                С питомцами
              </div>
              <div className="mt-1 text-xl font-semibold">{withPets}</div>
            </div>

            <div className="rounded-xl border bg-gray-50 p-3">
              <div className="text-[11px] uppercase text-gray-500">
                Без питомцев
              </div>
              <div className="mt-1 text-xl font-semibold">{withoutPets}</div>
            </div>

            <div className="rounded-xl border bg-gray-50 p-3">
              <div className="text-[11px] uppercase text-gray-500">
                С персональными данными
              </div>
              <div className="mt-1 text-xl font-semibold">{withPrivate}</div>
            </div>
          </div>

          {/* ФИЛЬТРЫ */}
          <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
            {/* Фильтр по питомцам */}
            <div className="space-y-1">
              <div className="text-[11px] text-gray-500">Питомцы</div>
              <div className="flex gap-2">
                <FilterLink
                  active={petsFilter === "all"}
                  href={`/backoffice/registrar/clients?pets=all&priv=${privFilter}&mode=${mode}`}
                >
                  Все
                </FilterLink>
                <FilterLink
                  active={petsFilter === "with"}
                  href={`/backoffice/registrar/clients?pets=with&priv=${privFilter}&mode=${mode}`}
                >
                  С питомцами
                </FilterLink>
                <FilterLink
                  active={petsFilter === "without"}
                  href={`/backoffice/registrar/clients?pets=without&priv=${privFilter}&mode=${mode}`}
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
                  active={privFilter === "all"}
                  href={`/backoffice/registrar/clients?pets=${petsFilter}&priv=all&mode=${mode}`}
                >
                  Все
                </FilterLink>
                <FilterLink
                  active={privFilter === "with"}
                  href={`/backoffice/registrar/clients?pets=${petsFilter}&priv=with&mode=${mode}`}
                >
                  С данными
                </FilterLink>
                <FilterLink
                  active={privFilter === "without"}
                  href={`/backoffice/registrar/clients?pets=${petsFilter}&priv=without&mode=${mode}`}
                >
                  Без данных
                </FilterLink>
              </div>
            </div>
          </div>

          {/* Кнопки */}
          <div className="flex justify-end gap-3 pt-2">
            {/* Полная картотека — всегда */}
            <Link
              href={fullUrl}
              className="rounded-xl px-4 py-2 text-xs font-medium border border-emerald-600 text-emerald-700 hover:bg-emerald-50"
            >
              Полная картотека
            </Link>

            {/* Свернуть — только если есть смысл (фильтр > 10 и мы в режиме all) */}
            {showCollapseButton && (
              <Link
                href={dashboardUrl}
                className="rounded-xl px-4 py-2 text-xs font-medium border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Свернуть до 10 клиентов
              </Link>
            )}

            <Link
              href="/backoffice/registrar/clients/new"
              className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-700"
            >
              Добавить клиента
            </Link>
          </div>
        </section>

        {/* ТАБЛИЦА КЛИЕНТОВ */}
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
                  {visibleOwners.map((o) => {
                    const href = `/backoffice/registrar/clients/${o.ownerId}?from=${mode}&pets=${petsFilter}&priv=${privFilter}&mode=${mode}`;
                    return (
                      <tr
                        key={o.ownerId}
                        className="border-b last:border-0 hover:bg-gray-50"
                      >
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
        </section>
      </main>
    </RoleGuard>
  );
}

// маленький помощник для склонения "питомец"
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
  children: React.ReactNode;
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
