import Link from "next/link";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { RegistrarHeader } from "@/components/registrar/RegistrarHeader";
import { getOwnersSummary } from "@/lib/clients";

type OwnerSummary = any;

interface ClientsListPageProps {
  searchParams?: {
    q?: string;
  };
}

export default async function ClientsListPage({ searchParams }: ClientsListPageProps) {
  const owners: OwnerSummary[] = await getOwnersSummary();
  const q = (searchParams?.q || "").trim().toLowerCase();

  const filteredOwners = q
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
              Список владельцев, зарегистрированных в системе. Фильтр по
              имени, городу или контактам.
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
            <button
              type="submit"
              className="rounded-xl bg-emerald-600 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-emerald-700"
            >
              Искать
            </button>
            {q && (
              <Link
                href="/backoffice/registrar/clients"
                className="text-[11px] text-gray-500 hover:underline"
              >
                Сбросить фильтр
              </Link>
            )}
          </form>
          {q && (
            <p className="text-[10px] text-gray-400">
              Результаты по запросу: <span className="font-mono">{q}</span>
            </p>
          )}
        </section>

        {/* Список клиентов */}
        <section className="rounded-2xl border bg-white p-4 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold">Клиенты</h2>
            {/* Теперь это живая кнопка */}
            <Link
              href="/backoffice/registrar/clients/new"
              className="rounded-xl bg-emerald-600 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-emerald-700"
            >
              Добавить клиента
            </Link>
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
                    <th className="px-2 py-2">Питомцев</th>
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
                    const petsCount =
                      owner.petsCount ??
                      owner.totalPets ??
                      owner.petCount ??
                      0;
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
                          {petsCount}
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
