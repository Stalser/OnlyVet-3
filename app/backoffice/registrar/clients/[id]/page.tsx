import Link from "next/link";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { RegistrarHeader } from "@/components/registrar/RegistrarHeader";
import { getOwnerWithPets } from "@/lib/clients";

interface PageProps {
  params: {
    id: string; // ownerId = user_id из owner_profiles (в строке)
  };
}

export default async function RegistrarClientDetailsPage({
  params,
}: PageProps) {
  const { owner, pets, appointments } = await getOwnerWithPets(params.id);

  return (
    <RoleGuard allowed={["registrar", "admin"]}>
      <main className="mx-auto max-w-5xl px-4 py-6 space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <Link
              href="/backoffice/registrar/clients"
              className="text-xs text-gray-500 hover:text-gray-700 hover:underline"
            >
              ← К картотеке клиентов
            </Link>
            <h1 className="mt-2 text-2xl font-bold tracking-tight">
              Карточка клиента
            </h1>
            <p className="text-sm text-gray-500">
              Общая информация о владельце, его питомцах и истории
              онлайн-консультаций.
            </p>
          </div>
          <RegistrarHeader />
        </header>

        {!owner && (
          <section className="rounded-2xl border bg-white p-4">
            <p className="text-sm text-gray-500">
              Клиент с идентификатором{" "}
              <span className="font-mono">{params.id}</span> не найден.
            </p>
          </section>
        )}

        {owner && (
          <>
            {/* Данные клиента */}
            <section className="rounded-2xl border bg-white p-4 space-y-2">
              <h2 className="text-base font-semibold">Данные клиента</h2>
              <div className="text-sm space-y-1">
                <div className="font-medium">
                  {owner.full_name || "Без имени"}
                </div>

                {owner.city && (
                  <div className="text-xs text-gray-700">
                    Город: {owner.city}
                  </div>
                )}

                {/* extra_contacts мы пока не распарсиваем детально, просто фиксируем факт */}
                {owner.extra_contacts && (
                  <div className="text-[11px] text-gray-500">
                    Дополнительные контакты хранятся в поле{" "}
                    <code className="rounded bg-gray-50 px-1">
                      extra_contacts
                    </code>{" "}
                    (json). При необходимости можно будет развернуть их по
                    отдельным полям (телефон, e-mail, Telegram и т.д.).
                  </div>
                )}

                <div className="mt-2 text-[11px] text-gray-400">
                  Структура owner_profiles:{" "}
                  <code className="rounded bg-gray-50 px-1">full_name</code>,{" "}
                  <code className="rounded bg-gray-50 px-1">city</code>,{" "}
                  <code className="rounded bg-gray-50 px-1">
                    extra_contacts
                  </code>
                  . Здесь мы используем full_name и city как основные поля
                  карточки клиента.
                </div>
              </div>
            </section>

            {/* Питомцы клиента */}
            <section className="rounded-2xl border bg-white p-4 space-y-3">
              <h2 className="text-base font-semibold">
                Питомцы клиента ({pets.length})
              </h2>

              {pets.length === 0 && (
                <p className="text-xs text-gray-400">
                  У этого клиента пока не добавлено ни одного питомца.
                </p>
              )}

              {pets.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs">
                    <thead>
                      <tr className="border-b bg-gray-50 text-left text-[11px] uppercase text-gray-500">
                        <th className="px-2 py-2">Имя</th>
                        <th className="px-2 py-2">Вид</th>
                        <th className="px-2 py-2">Порода</th>
                        <th className="px-2 py-2">Примечания</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pets.map((p: any) => (
                        <tr
                          key={p.id}
                          className="border-b last:border-0 hover:bg-gray-50"
                        >
                          <td className="px-2 py-2 align-top">
                            {p.name}
                          </td>
                          <td className="px-2 py-2 align-top">
                            {p.species || "—"}
                          </td>
                          <td className="px-2 py-2 align-top">
                            {p.breed || "—"}
                          </td>
                          <td className="px-2 py-2 align-top">
                            {p.notes || ""}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* История консультаций */}
            <section className="rounded-2xl border bg-white p-4 space-y-3">
              <h2 className="text-base font-semibold">
                История консультаций
              </h2>

              {appointments.length === 0 && (
                <p className="text-xs text-gray-400">
                  Пока нет консультаций, привязанных к этому клиенту. Это
                  значит, что поле{" "}
                  <code className="rounded bg-gray-50 px-1">owner_id</code> в
                  таблице{" "}
                  <code className="rounded bg-gray-50 px-1">
                    appointments
                  </code>{" "}
                  ещё не заполняется при создании записей. В новых
                  консультациях, созданных через регистратуру с выбором
                  клиента, это поле будет заполняться автоматически.
                </p>
              )}

              {appointments.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs">
                    <thead>
                      <tr className="border-b bg-gray-50 text-left text-[11px] uppercase text-gray-500">
                        <th className="px-2 py-2">Дата / время</th>
                        <th className="px-2 py-2">Питомец</th>
                        <th className="px-2 py-2">Врач</th>
                        <th className="px-2 py-2">Услуга</th>
                        <th className="px-2 py-2">Статус</th>
                        <th className="px-2 py-2 text-right">
                          Действия
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {appointments.map((a) => (
                        <tr
                          key={a.id}
                          className="border-b last:border-0 hover:bg-gray-50"
                        >
                          <td className="px-2 py-2 align-top text-[11px] text-gray-700">
                            <div>{a.dateLabel}</div>
                            {a.createdLabel && (
                              <div className="text-[10px] text-gray-400">
                                создано: {a.createdLabel}
                              </div>
                            )}
                          </td>
                          <td className="px-2 py-2 align-top">
                            <div className="text-[11px]">
                              {a.petName || "—"}
                            </div>
                            {a.petSpecies && (
                              <div className="text-[10px] text-gray-500">
                                {a.petSpecies}
                              </div>
                            )}
                          </td>
                          <td className="px-2 py-2 align-top">
                            <div className="text-[11px]">
                              {a.doctorName || "Не назначен"}
                            </div>
                          </td>
                          <td className="px-2 py-2 align-top">
                            <div className="text-[11px]">
                              {a.serviceName}
                            </div>
                            {a.serviceCode && (
                              <div className="text-[10px] text-gray-500">
                                {a.serviceCode}
                              </div>
                            )}
                          </td>
                          <td className="px-2 py-2 align-top">
                            <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                              {a.statusLabel}
                            </span>
                          </td>
                          <td className="px-2 py-2 align-top text-right">
                            <Link
                              href={`/backoffice/registrar/consultations/${a.id}`}
                              className="text-[11px] font-medium text-emerald-700 hover:underline"
                            >
                              Открыть
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </RoleGuard>
  );
}
