import Link from "next/link";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { RegistrarHeader } from "@/components/registrar/RegistrarHeader";
import { getPetDetails } from "@/lib/pets";

interface PageProps {
  params: {
    id: string; // pets.id (uuid)
  };
}

export default async function RegistrarPetDetailsPage({
  params,
}: PageProps) {
  const { pet, owner, appointments } = await getPetDetails(params.id);

  return (
    <RoleGuard allowed={["registrar", "admin"]}>
      <main className="mx-auto max-w-5xl px-4 py-6 space-y-6">
        <header className="flex items-center justify_between">
          <div>
            <Link
              href="/backoffice/registrar/clients"
              className="text-xs text-gray-500 hover:text-gray-700 hover:underline"
            >
              ← К картотеке клиентов
            </Link>
            <h1 className="mt-2 text-2xl font-bold tracking-tight">
              Карточка питомца
            </h1>
            <p className="text-sm text-gray-500">
              Информация о животном, его владельце и история онлайн-консультаций.
            </p>
          </div>
          <RegistrarHeader />
        </header>

        {!pet && (
          <section className="rounded-2xl border bg-white p-4">
            <p className="text-sm text-gray-500">
              Питомец с идентификатором{" "}
              <span className="font-mono">{params.id}</span> не найден.
            </p>
          </section>
        )}

        {pet && (
          <>
            {/* Блок: питомец + владелец */}
            <section className="rounded-2xl border bg-white p-4 space-y-2">
              <h2 className="text-base font-semibold">Питомец</h2>
              <div className="text-sm space-y-1">
                <div className="font-medium">
                  {pet.name || "Без имени"}
                </div>
                {pet.species && (
                  <div className="text-xs text-gray-700">
                    Вид: {pet.species}
                  </div>
                )}
                {pet.breed && (
                  <div className="text-xs text-gray-700">
                    Порода: {pet.breed}
                  </div>
                )}
                {pet.sex && (
                  <div className="text-xs text-gray-700">
                    Пол: {pet.sex}
                  </div>
                )}
                {pet.birth_date && (
                  <div className="text-xs text-gray-700">
                    Дата рождения: {pet.birth_date}
                  </div>
                )}
                {pet.notes && (
                  <div className="text-xs text-gray-600">
                    Примечания: {pet.notes}
                  </div>
                )}
              </div>

              <div className="mt-4">
                <h3 className="text-xs font-semibold uppercase text-gray-500">
                  Владелец
                </h3>
                {owner ? (
                  <div className="mt-1 text-sm">
                    <div className="font-medium">
                      {owner.full_name || "Без имени"}
                    </div>
                    {owner.city && (
                      <div className="text-xs text-gray-700">
                        Город: {owner.city}
                      </div>
                    )}
                    <Link
                      href={`/backoffice/registrar/clients/${owner.user_id}`}
                      className="mt-1 inline-block text-[11px] font-medium text-emerald-700 hover:underline"
                    >
                      Открыть карточку клиента →
                    </Link>
                  </div>
                ) : (
                  <div className="mt-1 text-xs text-gray-400">
                    Владелец не найден (owner_id отсутствует или не совпадает).
                  </div>
                )}
              </div>
            </section>

            {/* История консультаций по питомцу */}
            <section className="rounded-2xl border bg-white p-4 space-y-3">
              <h2 className="text-base font-semibold">
                История консультаций
              </h2>

              {appointments.length === 0 && (
                <p className="text-xs text-gray-400">
                  Пока нет консультаций, привязанных к этому питомцу. Это
                  возможно, если консультации создавались до появления поля{" "}
                  <code className="rounded bg-gray-50 px-1">pet_id</code> в
                  таблице appointments.
                </p>
              )}

              {appointments.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs">
                    <thead>
                      <tr className="border-b bg-gray-50 text-left text-[11px] uppercase text-gray-500">
                        <th className="px-2 py-2">Дата / время</th>
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
