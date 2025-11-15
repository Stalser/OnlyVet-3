import Link from "next/link";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { RegistrarHeader } from "@/components/registrar/RegistrarHeader";
import { RegistrarCreateAppointment } from "@/components/registrar/RegistrarCreateAppointment";
import { getRecentRegistrarAppointments } from "@/lib/registrar";
import { getOwnersSummary } from "@/lib/clients";
import { RegistrarClientsMini } from "@/components/registrar/RegistrarClientsMini";

export default async function RegistrarDashboardPage() {
  const [appointments, owners] = await Promise.all([
    getRecentRegistrarAppointments(10),
    getOwnersSummary(),
  ]);

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
          <div className="flex flex-col items-end gap-2">
            <RegistrarHeader />
            {/* ССЫЛКА НА КАЛЕНДАРЬ В ШАПКЕ */}
            <Link
              href="/backoffice/registrar/calendar"
              className="text-[11px] font-medium text-emerald-700 hover:underline"
            >
              Календарь записей →
            </Link>
          </div>
        </header>

        {/* Создать новую консультацию */}
        <RegistrarCreateAppointment />

        {/* БЛОК КАЛЕНДАРЯ В ТЕЛЕ СТРАНИЦЫ — ЕГО СЛОЖНО НЕ ЗАМЕТИТЬ */}
        <section className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/40 p-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-emerald-900">
              Календарь записей
            </h2>
            <p className="text-xs text-emerald-800 max-w-md">
              Недельный календарный вид всех консультаций. Удобно, чтобы
              видеть занятость врачей и свободные окна. Нажмите кнопку
              справа, чтобы открыть.
            </p>
          </div>
          <Link
            href="/backoffice/registrar/calendar"
            className="rounded-2xl bg-emerald-600 px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-emerald-700"
          >
            Открыть календарь
          </Link>
        </section>

        {/* Мини-картотека клиентов */}
        <RegistrarClientsMini owners={owners} />

        {/* Последние консультации (без фильтров) */}
        <section className="rounded-2xl border bg-white p-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-semibold">
              Последние консультации и заявки
            </h2>
            <Link
              href="/backoffice/registrar/consultations"
              className="text-xs font-medium text-emerald-700 hover:underline"
            >
              Все консультации и заявки
            </Link>
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
                    <td className="px-2 py-2 align-top">{index + 1}</td>

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

                    <td className="px-2 py-2 align-top text-[11px]">
                      {a.doctorName || "Не назначен"}
                    </td>

                    <td className="px-2 py-2 align-top text-[11px]">
                      {a.serviceName}
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
