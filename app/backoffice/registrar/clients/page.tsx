
import Link from "next/link";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { RegistrarHeader } from "@/components/registrar/RegistrarHeader";
import { getOwnersSummary } from "@/lib/clients";

type OwnerSummary = any;

interface ClientsListPageProps {
  searchParams?: {
    q?: string;
    filter?: string; // all | withPets | withoutPets
  };
}

export default async function ClientsListPage({
  searchParams,
}: ClientsListPageProps) {
  const owners: OwnerSummary[] = await getOwnersSummary();

  const q = (searchParams?.q || "").trim().toLowerCase();
  const filter = (searchParams?.filter || "all") as
    | "all"
    | "withPets"
    | "withoutPets";

  const afterTextFilter = q
    ? owners.filter((owner: any) => {
        const name =
          owner.fullName ??
          owner.full_name ??
          owner.name ??
          "";
        const city = owner.city ?? "";
        const contactText =
          owner.contactSummary ??
          owner.contactText ??
          "";
        const haystack = `${name} ${city} ${contactText}`.toLowerCase();
        return haystack.includes(q);
      })
    : owners;

  const withPetsCount = (owner: any): number =>
    owner.petsCount ??
    owner.totalPets ??
    owner.petCount ??
    0;

  const filteredOwners = afterTextFilter.filter((owner: any) => {
    const pc = withPetsCount(owner);
    if (filter === "withPets") return pc > 0;
    if (filter === "withoutPets") return pc === 0;
    return true;
  });

  const total = filteredOwners.length;
  const withPetsNum = filteredOwners.filter((o: any) => withPetsCount(o) > 0)
    .length;
  const withoutPetsNum = total - withPetsNum;

  const buildLink = (newFilter: "all" | "withPets" | "withoutPets") => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (newFilter !== "all") params.set("filter", newFilter);
    const search = params.toString();
    return search
      ? `/backoffice/registrar/clients?${search}`
      : `/backoffice/registrar/clients`;
  };

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
              контактам и фильтр по наличию питомцев.
            </p>
          </div>
          <RegistrarHeader />
        </header>

        {/* Фильтр / поиск */}
        <section className="rounded-2xl border bg-white p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold">Поиск по картотеке</h2>
            <span className="text-[11px] text-gray-500">
              Найти клиента по ФИО, городу или контактам
            </span>
          </div>
          <form className="flex flex-wrap items-center gap-2" method="get">
            <input
              type="text"
              name="q"
              defaultValue={q}
              className="flex-1 min-w-[180px] rounded-xl border px-3 py-1.5 text-xs"
              placeholder="Например: Иванов, Москва, +7 900..."
            />
            {filter && filter !== "all" && (
              <input type="hidden" name="filter" value={filter} />
            )}
            <button
              type="submit"
              className="rounded-xl bg-emerald-600 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-emerald-700"
            >
              Искать
            </button>
            {q && (
              <Link
                href={
                  filter && filter !== "all"
                    ? `/backoffice/registrar/clients?filter=${filter}`
                    : "/backoffice/registrar/clients"
                }
                className="text-[11px] text-gray-500 hover:underline"
              >
                Сбросить строку поиска
              </Link>
            )}
          </form>
          {q && (
            <p className="text-[10px] text-gray-400">
              Результаты по запросу: <span className="font-mono">{q}</span>
            </p>
          )}
        </section>

        {/* Сводка + фильтр по питомцам */}
        <section className="rounded-2xl border bg-white p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="text-xs font-semibold text-gray-700">
                Сводка по картотеке (с учётом фильтра)
              </div>
              <div className="grid gap-2 md:grid-cols-3 text-xs">
                <div className="rounded-xl border bg-gray-50 px-3 py-2">
                  <div className="text-[11px] text-gray-500">
                    Клиентов
                  </div>
                  <div className="mt-1 text-xl font-semibold text-gray-900">
                    {total}
                  </div>
                </div>
                <div className="rounded-xl border bg-gray-50 px-3 py-2">
                  <div className="text-[11px] text-gray-500">
                    Клиентов с питомцами
                  </div>
                  <div className="mt-1 text-xl font-semibold text-gray-900">
                    {withPetsNum}
                  </div>
                </div>
                <div className="rounded-xl border bg-gray-50 px-3 py-2">
                  <div className="text-[11px] text-gray-500">
                    Клиентов без питомцев
                  </div>
                  <div className="mt-1 text-xl font-semibold text-gray-900">
                    {withoutPetsNum}
                  </div>
                </div>
              </div>
            </div>
            <Link
              href="/backoffice/registrar/clients/new"
              className="rounded-xl bg-emerald-600 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-emerald-700"
            >
              Добавить клиента
            </Link>
          </div>

          {/* Чипы-фильтры */}
          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <span className="text-gray-500">Показать:</span>
            <div className="inline-flex rounded-xl bg-gray-100 p-1">
              <Link
                href={buildLink("all")}
                className={
                  filter === "all"
                    ? "px-3 py-1.5 rounded-lg bg-white text-gray-900 shadow-sm"
                    : "px-3 py-1.5 rounded-lg text-gray-600 hover:text-gray-900"
                }
              >
                Все
              </Link>
              <Link
                href={buildLink("withPets")}
                className={
                  filter === "withPets"
                    ? "px-3 py-1.5 rounded-lg bg-white text-gray-900 shadow-sm"
                    : "px-3 py-1.5 rounded-lg text-gray-600 hover:text-gray-900"
                }
              >
                С питомцами
              </Link>
              <Link
                href={buildLink("withoutPets")}
                className={
                  filter === "withoutPets"
                    ? "px-3 py-1.5 rounded-lg bg-white text-gray-900 shadow-sm"
                    : "px-3 py-1.5 rounded-lg text-gray-600 hover:text-gray-900"
                }
              >
                Без питомцев
              </Link>
            </div>
          </div>
        </section>

        {/* Список клиентов */}
        <section className="rounded-2xl border bg-white p-4 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold">Клиенты</h2>
            <span className="text-[11px] text-gray-500">
              Нажмите &quot;Открыть&quot; для просмотра карточки клиента и
              его питомцев
            </span>
          </div>

          {filteredOwners.length === 0 && (
            <p className="text-xs text-gray-400">
              Клиентов по выбранному фильтру не найдено. Попробуйте изменить
              условия поиска или добавить нового клиента.
            </p>
          )}

          {filteredOwners.length > 0 && (
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
                  {filteredOwners.map((owner: any) => {
                    const id = owner.id ?? owner.user_id;
                    const name =
                      owner.fullName ??
                      owner.full_name ??
                      owner.name ??
                      "Без имени";
                    const city = owner.city ?? "—";
                    const petsCount = withPetsCount(owner);
                    const lastActivity =
                      owner.lastVisitLabel ??
                      owner.lastActivityLabel ??
                      owner.createdLabel ??
                      "—";

                    return (
                      <tr
                        key={id}
                        className="border-b last:border-0 hover:bg-gray-50"
                      >
                        <td className="px-2 py-2 align-top text-[11px] text-gray-800">
                          {name}
                        </td>
                        <td className="px-2 py-2 align-top text-[11px] text-gray-600">
                          {city || "—"}
                        </td>
                        <td className="px-2 py-2 align-top text-[11px] text-gray-600">
                          {petsCount > 0 ? (
                            <span className="inline-flex items-center rounded_full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-800 border border-emerald-100">
                              {petsCount}{" "}
                              {petsCount === 1
                                ? "питомец"
                                : petsCount < 5
                                ? "питомца"
                                : "питомцев"}
                            </span>
                          ) : (
                            <span className="text-[10px] text-gray-400">
                              нет питомцев
                            </span>
                          )}
                        </td>
                        <td className="px-2 py-2 align-top text-[11px] text-gray-600">
                          {lastActivity}
                        </td>
                        <td className="px-2 py-2 align-top text-right">
                          {id ? (
                            <Link
                              href={`/backoffice/registrar/clients/${id}`}
                              className="text-[11px] font-medium text-emerald-700 hover:underline"
                            >
                              Открыть →
                            </Link>
                          ) : (
                            <span className="text-[10px] text-gray-400">
                              Нет id
                            </span>
                          )}
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
