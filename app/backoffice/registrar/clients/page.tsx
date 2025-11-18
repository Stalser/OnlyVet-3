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

  const petsFilter = searchParams?.pets ?? "all";
  const privFilter = searchParams?.priv ?? "all";
  const mode: "dashboard" | "all" =
    searchParams?.mode === "all" ? "all" : "dashboard";

  // ===== COUNTS =====
  const total = owners.length;
  const withPets = owners.filter((o) => o.petsCount > 0).length;
  const withoutPets = total - withPets;
  const withPrivate = owners.filter((o) => o.hasPrivateData).length;

  // ===== FILTERING =====
  let filtered = owners;

  if (petsFilter === "with") filtered = filtered.filter((o) => o.petsCount > 0);
  if (petsFilter === "without") filtered = filtered.filter((o) => o.petsCount === 0);
  if (privFilter === "with") filtered = filtered.filter((o) => o.hasPrivateData);
  if (privFilter === "without") filtered = filtered.filter((o) => !o.hasPrivateData);

  const visibleOwners = mode === "all" ? filtered : filtered.slice(0, 10);

  // URL builder
  const buildUrl = (
    pets: string,
    priv: string,
    modeValue: "dashboard" | "all" = mode
  ) => `/backoffice/registrar/clients?pets=${pets}&priv=${priv}&mode=${modeValue}`;

  return (
    <RoleGuard allowed={["registrar", "admin"]}>
      <main className="mx-auto max-w-6xl px-4 py-6 space-y-6">

        {/* HEADER */}
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
              Фильтрация по питомцам и персональным данным. Полная или краткая картотека.
            </p>
          </div>
          <RegistrarHeader />
        </header>

        {/* SUMMARY BLOCK */}
        <section className="rounded-2xl border bg-white p-4 space-y-4">
          <h2 className="text-sm font-semibold">Сводка</h2>

          <div className="grid gap-3 md:grid-cols-4">
            <div className="rounded-xl border bg-gray-50 px-3 py-2">
              <div className="text-[11px] text-gray-500">Клиентов</div>
              <div className="text-xl font-semibold">{total}</div>
            </div>

            <div className="rounded-xl border bg-gray-50 px-3 py-2">
              <div className="text-[11px] text-gray-500">С питомцами</div>
              <div className="text-xl font-semibold">{withPets}</div>
            </div>

            <div className="rounded-xl border bg-gray-50 px-3 py-2">
              <div className="text-[11px] text-gray-500">Без питомцев</div>
              <div className="text-xl font-semibold">{withoutPets}</div>
            </div>

            <div className="rounded-xl border bg-gray-50 px-3 py-2">
              <div className="text-[11px] text-gray-500">С персональными данными</div>
              <div className="text-xl font-semibold">{withPrivate}</div>
            </div>
          </div>

          {/* FILTERS */}
          <div className="grid gap-3 md:grid-cols-2">
            {/* PETS filter */}
            <div>
              <div className="mb-1 text-[11px] text-gray-500">Питомцы</div>
              <div className="inline-flex rounded-full border bg-gray-50 p-1 text-[11px]">
                <Link href={buildUrl("all", privFilter)} className={`rounded-full px-3 py-1 ${petsFilter === "all" ? "bg-emerald-600 text-white" : ""}`}>Все</Link>
                <Link href={buildUrl("with", privFilter)} className={`rounded-full px-3 py-1 ${petsFilter === "with" ? "bg-emerald-600 text-white" : ""}`}>С питомцами</Link>
                <Link href={buildUrl("without", privFilter)} className={`rounded-full px-3 py-1 ${petsFilter === "without" ? "bg-emerald-600 text-white" : ""}`}>Без питомцев</Link>
              </div>
            </div>

            {/* PRIVATE-DATA filter */}
            <div>
              <div className="mb-1 text-[11px] text-gray-500">Персональные данные</div>
              <div className="inline-flex rounded-full border bg-gray-50 p-1 text-[11px]">
                <Link href={buildUrl(petsFilter, "all")} className={`rounded-full px-3 py-1 ${privFilter === "all" ? "bg-emerald-600 text-white" : ""}`}>Все</Link>
                <Link href={buildUrl(petsFilter, "with")} className={`rounded-full px-3 py-1 ${privFilter === "with" ? "bg-emerald-600 text-white" : ""}`}>С данными</Link>
                <Link href={buildUrl(petsFilter, "without")} className={`rounded-full px-3 py-1 ${privFilter === "without" ? "bg-emerald-600 text-white" : ""}`}>Без данных</Link>
              </div>
            </div>
          </div>
        </section>

        {/* CLIENTS TABLE */}
        <section className="rounded-2xl border bg-white p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Клиенты</h2>

            <div className="flex gap-2">
              {mode === "dashboard" ? (
                <Link
                  href={buildUrl(petsFilter, privFilter, "all")}
                  className="rounded-xl border px-3 py-1.5 text-[11px] hover:bg-gray-50"
                >
                  Полная картотека →
                </Link>
              ) : (
                <Link
                  href={buildUrl(petsFilter, privFilter, "dashboard")}
                  className="rounded-xl border px-3 py-1.5 text-[11px] hover:bg-gray-50"
                >
                  Свернуть до 10 кли
                </Link>
              )}

              <Link
                href="/backoffice/registrar/clients/new"
                className="rounded-xl bg-emerald-600 px-3 py-1.5 text-[11px] text-white hover:bg-emerald-700"
              >
                Добавить клиента
              </Link>
            </div>
          </div>

          {/* TABLE */}
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
                  <tr key={o.ownerId} className="border-b hover:bg-gray-50">
                    <td className="px-2 py-2">
                      <div className="font-medium">{o.fullName}</div>
                      {o.email && <div className="text-[10px] text-gray-500">{o.email}</div>}
                      {o.phone && <div className="text-[10px] text-gray-500">{o.phone}</div>}
                    </td>

                    <td className="px-2 py-2">{o.city || "—"}</td>

                    <td className="px-2 py-2">
                      {o.petsCount > 0 ? (
                        <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] text-emerald-700">
                          {o.petsCount} питомц.
                        </span>
                      ) : (
                        <span className="text-[10px] text-gray-400">нет питомцев</span>
                      )}
                    </td>

                    <td className="px-2 py-2">
                      {o.hasPrivateData ? (
                        <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] text-emerald-700">
                          есть данные
                        </span>
                      ) : (
                        <span className="text-[10px] text-gray-400">нет данных</span>
                      )}
                    </td>

                    <td className="px-2 py-2 text-right">
                      <Link href={href} className="text-[11px] font-medium text-emerald-700 hover:underline">
                        Открыть →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      </main>
    </RoleGuard>
  );
}
