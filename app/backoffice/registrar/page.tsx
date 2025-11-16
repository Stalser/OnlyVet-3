import Link from "next/link";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { RegistrarHeader } from "@/components/registrar/RegistrarHeader";
import { RegistrarCreateAppointment } from "@/components/registrar/RegistrarCreateAppointment";
import { getRecentRegistrarAppointments } from "@/lib/registrar";
import { getOwnersSummary } from "@/lib/clients";
import { RegistrarClientsMini } from "@/components/registrar/RegistrarClientsMini";

export default async function RegistrarDashboardPage() {
  // Загружаем последние консультации и краткую сводку по клиентам
  const [appointments, owners] = await Promise.all([
    getRecentRegistrarAppointments(50), // берём побольше, чтобы посчитать "запрошенные"
    getOwnersSummary(),
  ]);

  // Новые заявки: статус содержит "запрош"
  const newRequests = appointments.filter((a) =>
    a.statusLabel.toLowerCase().includes("запрош")
  );
  const newRequestsCount = newRequests.length;

  // Для основной таблицы последних консультаций берём первые 10
  const lastAppointments = appointments.slice(0, 10);

  return (
    <RoleGuard allowed={["registrar", "admin"]}>
      <main className="mx-auto max-w-6xl px-4 py-6 space-y-6">
        {/* Шапка */}
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

        {/* 🟢 Виджет: Новые заявки */}
        <section className="rounded-2xl border bg-white p-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold">Новые заявки</h2>
            {newRequestsCount > 0 ? (
              <p className="text-xs text-gray-500">
                Количество консультаций в статусе &quot;запрошена&quot;, которые
                ждут обработки.
              </p>
            ) : (
              <p className="text-xs text-gray-500">
                Сейчас нет заявок в статусе &quot;запрошена&quot;.
              </p>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-[11px] uppercase text-gray-500">
                Новых заявок
              </div>
              <div className="text-2xl font-semibold text-gray-900">
                {newRequestsCount}
              </div>
            </div>
            <Link
              href="/backoffice/registrar/consultations"
              className="rounded-xl border border-emerald-600 px-3 py-1.5 text-[11px] font-medium text-emerald-700 hover:bg-emerald-50"
            >
              К списку заявок
            </Link>
          </div>
        </section>

        {/* Создать новую консультацию */}
        <RegistrarCreateAppointment />

        {/* Краткая картотека клиентов */}
        <RegistrarClientsMini owners={owners} />

        {/* Последние консультации и заявки */}
        <section className="rounded-2xl border bg-white p-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-semibold">
              Последние консультации и заявки
            </h2>
            <Link
              href="/backoffice/registrar/consultations"
              className="text-xs font-medium text-emerald-700 hover:underline"
            >
              Все консультации и заявки →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead>
                <tr className="border-b bg-gray-50 text-left text-[11px] uppercase text-gray-500">
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
                {lastAppointments.map((a, index) => (
                  <tr
                    key={a.id}
                    className="border-b last:border-0 hover:bg-gray-50"
                  >
                    {/* Дата / время */}
                    <td className="px-2 py-2 align-top text-[11px] text-gray-700">
                      <div>{a.dateLabel}</div>
                      {a.createdLabel && (
                        <div className="text-[10px] text-gray-400">
                          создано: {a.createdLabel}
                        </div>
                      )}
                    </td>

                    {/* Клиент */}
                    <td className="px-2 py-2 align-top">
                      <div className="text-[11px] font-medium">
                        {a.clientName || "Без имени"}
                      </div>
                      {a.clientContact && (
                        <div className="text-[10px] text-gray-500">
                          {a.clientContact}
                        </div>
                      )}
                    </td>

                    {/* Питомец */}
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

                    {/* Врач */}
                    <td className="px-2 py-2 align-top text-[11px]">
                      {a.doctorName || "Не назначен"}
                    </td>

                    {/* Услуга */}
                    <td className="px-2 py-2 align-top text-[11px]">
                      {a.serviceName}
                      {a.serviceCode && (
                        <div className="text-[10px] text-gray-500">
                          {a.serviceCode}
                        </div>
                      )}
                    </td>

                    {/* Статус */}
                    <td className="px-2 py-2 align-top">
                      <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-700">
                        {a.statusLabel}
                      </span>
                    </td>

                    {/* Действия */}
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

                {lastAppointments.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-2 py-8 text-center text-xs text-gray-400"
                    >
                      Консультаций и заявок ещё нет.
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
