import Link from "next/link";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { RegistrarHeader } from "@/components/registrar/RegistrarHeader";
import { getPetDetails } from "@/lib/pets";
import { PetDocumentsSection } from "@/components/registrar/PetDocumentsSection";

interface PageProps {
  params: {
    id: string; // pets.id
  };
}

export default async function RegistrarPetDetailsPage({ params }: PageProps) {
  const { pet, owner, appointments } = await getPetDetails(params.id);

  return (
    <RoleGuard allowed={["registrar", "admin"]}>
      <main className="mx-auto max-w-5xl px-4 py-6 space-y-6">
        {/* Шапка */}
        <header className="flex items-center justify-between">
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

        {/* Если питомец не найден */}
        {!pet && (
          <section className="rounded-2xl border bg-white p-4">
            <p className="text-sm text-gray-500">
              Питомец с идентификатором{" "}
              <span className="font-mono">{params.id}</span> не найден.
            </p>
          </section>
        )}

        {/* Если питомец найден */}
        {pet && (
          <>
            {/* Питомец + владелец */}
            <section className="rounded-2xl border bg-white p-4 space-y-4">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Фото (заглушка) */}
                <div className="flex-shrink-0">
                  <div className="h-32 w-32 rounded-xl bg-gray-200 flex items-center justify-center text-[11px] text-gray-600">
                    Фото
                  </div>
                </div>

                {/* Основные данные питомца */}
                <div className="flex-1 space-y-2 text-sm">
                  <div>
                    <div className="text-[11px] text-gray-500 mb-1">Имя</div>
                    <div className="rounded-xl border bg-gray-50 px-3 py-2 text-sm font-medium text-gray-900">
                      {pet.name || "Без имени"}
                    </div>
                  </div>

                  <div className="grid gap-2 md:grid-cols-2">
                    <div>
                      <div className="text-[11px] text-gray-500 mb-1">
                        Вид / порода
                      </div>
                      <div className="rounded-xl border bg-gray-50 px-3 py-2 text-sm text-gray-800">
                        {pet.species || "Не указан"}
                        {pet.breed && (
                          <span className="text-[11px] text-gray-500">
                            {" "}
                            ({pet.breed})
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-gray-500 mb-1">
                        Пол
                      </div>
                      <div className="rounded-xl border bg-gray-50 px-3 py-2 text-sm text-gray-800">
                        {pet.sex || "Не указан"}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-2 md:grid-cols-3">
                    <div>
                      <div className="text-[11px] text-gray-500 mb-1">
                        Дата рождения
                      </div>
                      <div className="rounded-xl border bg-gray-50 px-3 py-2 text-sm text-gray-800">
                        {pet.birth_date
                          ? new Date(pet.birth_date).toLocaleDateString("ru-RU")
                          : "Не указана"}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-gray-500 mb-1">
                        Вес
                      </div>
                      <div className="rounded-xl border bg-gray-50 px-3 py-2 text-sm text-gray-800">
                        {pet.weight_kg != null
                          ? `${pet.weight_kg} кг`
                          : "Не указан"}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-gray-500 mb-1">
                        Номер чипа
                      </div>
                      <div className="rounded-xl border bg-gray-50 px-3 py-2 text-sm text-gray-800">
                        {pet.microchip_number || "Нет"}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] text-gray-500 mb-1">
                      Заметки
                    </div>
                    <div className="rounded-xl border bg-gray-50 px-3 py-2 text-sm text-gray-800 whitespace-pre-line">
                      {pet.notes || "нет"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Блок владельца */}
              <div className="mt-4 pt-4 border-t">
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

            {/* История консультаций по этому питомцу */}
            <section className="rounded-2xl border bg-white p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold">
                  История консультаций
                </h2>
                <Link
                  href={`/backoffice/registrar?ownerId=${pet.owner_id}&petId=${pet.id}`}
                  className="rounded-xl border border-emerald-600 px-3 py-1 text-[11px] text-emerald-700 hover:bg-emerald-50"
                >
                  Создать консультацию
                </Link>
              </div>

              {appointments.length === 0 && (
                <p className="text-xs text-gray-400">
                  Пока нет консультаций, привязанных к этому питомцу. Возможно,
                  консультации создавались до появления явного поля pet_id.
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
                        <th className="px-2 py-2 text-right">Действия</th>
                      </tr>
                    </thead>
                    <tbody>
                      {appointments.map((a: any) => (
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
                          <td className="px-2 py-2 align-top text-[11px] text-gray-700">
                            {a.doctorName || "Не назначен"}
                          </td>
                          <td className="px-2 py-2 align-top">
                            <div className="text-[11px] text-gray-800">
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

            {/* Документы питомца */}
<PetDocumentsSection petId={pet.id} canManage />
            <section className="rounded-2xl border bg-white p-4 space-y-3">
              <h2 className="text-base font-semibold">Документы питомца</h2>
              <p className="text-xs text-gray-400">
                В будущем здесь будут: выписки, заключения, анализа, файлы и другие
                документы, связанные с этим животным.
              </p>
            </section>
          </>
        )}
      </main>
    </RoleGuard>
  );
}
