import { RoleGuard } from "@/components/auth/RoleGuard";
import { getRegistrarAppointments } from "@/lib/registrar";
import { RegistrarHeader } from "@/components/registrar/RegistrarHeader";

export default async function RegistrarDashboardPage() {
  const appointments = await getRegistrarAppointments();

  return (
    <RoleGuard allowed={["registrar", "admin"]}>
      <main className="mx-auto max-w-6xl px-4 py-6 space-y-6">
        <header className="flex items-center justify-between">
  <div>
    <h1 className="text-2xl font-bold tracking-tight">
      Кабинет регистратуры
    </h1>
    <p className="text-sm text-gray-500">
      Управление заявками, консультациями и расписанием врачей.
    </p>
  </div>
  <RegistrarHeader />
</header>

        <section className="rounded-2xl border bg-white p-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">
                Все консультации и заявки
              </h2>
              <p className="text-xs text-gray-500">
                Список всех записей по клиентам и врачам (пока на
                мок-данных).
              </p>
            </div>
            {/* фильтры по дате/врачу/статусу добавим позже */}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead>
                <tr className="border-b bg-gray-50 text-left text-[11px] uppercase text-gray-500">
                  <th className="px-2 py-2">№</th>
                  <th className="px-2 py-2">Дата / время</th>
                  <th className="px-2 py-2">Клиент</th>
                  <th className="px-2 py-2">Питомец</th>
                  <th className="px-2 py-2">Врач</th>
                  <th className="px-2 py-2">Услуга</th>
                  <th className="px-2 py-2">Статус</th>
                  <th className="px-2 py-2 text-right">Действия</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((a, index) => (
                  <tr
                    key={a.id}
                    className="border-b last:border-0 hover:bg-gray-50"
                  >
                    <td className="px-2 py-2 align-top">
                      {index + 1}
                    </td>
                    <td className="px-2 py-2 align-top text-[11px] text-gray-700">
                      <div>{a.dateLabel}</div>
                      {a.createdLabel && (
                        <div className="text-[10px] text-gray-400">
                          создано: {a.createdLabel}
                        </div>
                      )}
                    </td>
                    <td className="px-2 py-2 align-top">
                      <div className="text-[11px] font-medium">
                        {a.clientName}
                      </div>
                      {a.clientContact && (
                        <div className="text-[10px] text-gray-500">
                          {a.clientContact}
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
                      <div className="text-[11px]">{a.serviceName}</div>
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
                      {/* Позже сделаем настоящую карточку консультации */}
                      <button
                        type="button"
                        className="text-[11px] font-medium text-emerald-700 hover:underline"
                      >
                        Открыть
                      </button>
                    </td>
                  </tr>
                ))}

                {appointments.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-2 py-8 text-center text-xs text-gray-400"
                    >
                      Пока нет ни одной консультации.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </RoleGuard>
  );
}
