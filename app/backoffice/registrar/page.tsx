// app/backoffice/registrar/page.tsx
import Link from "next/link";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { RegistrarHeader } from "@/components/registrar/RegistrarHeader";
import { RegistrarCreateAppointment } from "@/components/registrar/RegistrarCreateAppointment";
import { getRecentRegistrarAppointments } from "@/lib/registrar";
import { getOwnersSummary } from "@/lib/clients";
import { RegistrarClientsMini } from "@/components/registrar/RegistrarClientsMini";

// ВАЖНО: всегда брать свежие данные
export const dynamic = "force-dynamic";

export default async function RegistrarDashboardPage() {
  const [appointments, owners] = await Promise.all([
    getRecentRegistrarAppointments(50),
    getOwnersSummary(),
  ]);

  // новые заявки: статус содержит "запрош"
  const newRequests = appointments.filter((a) =>
    a.statusLabel.toLowerCase().includes("запрош")
  );
  const newRequestsCount = newRequests.length;

  // для таблицы внизу показываем только первые 10
  const lastAppointments = appointments.slice(0, 10);

  // подпись количества заявок
  const newRequestsLabel = (() => {
    if (newRequestsCount === 0) return "новых заявок";
    if (newRequestsCount === 1) return "новая заявка";
    if (newRequestsCount >= 2 && newRequestsCount <= 4) return "новые заявки";
    return "новых заявок";
  })();

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

        {/* Верхняя строка виджетов: Новые заявки + Расписание */}
        <section className="grid gap-4 md:grid-cols-2">
          {/* Новые заявки */}
          <div className="rounded-2xl border bg-white p-4 flex flex-col justify-between">
            <div className="space-y-2">
              <h2 className="text-sm font-semibold">Новые заявки</h2>
              <p className="text-xs text-gray-500">
                Заявки в статусе «запрошено», ожидающие обработки
                регистратором.
              </p>
            </div>
            <div className="mt-4 flex items-end justify-between">
              <div>
                <div className="text-3xl font-bold">{newRequestsCount}</div>
                <div className="text-[11px] text-gray-500">
                  {newRequestsCount === 0
                    ? "нет новых заявок"
                    : `${newRequestsCount} ${newRequestsLabel}`}
                </div>
              </div>
              <Link
                href="/backoffice/registrar/queue"
                className="rounded-xl border border-emerald-600 px-3 py-1.5 text-[11px] font-medium text-emerald-700 hover:bg-emerald-50"
              >
                Открыть заявки
              </Link>
            </div>
          </div>

          {/* Расписание и записи */}
          <div className="rounded-2xl border bg-white p-4 flex flex-col justify-between">
            <div className="space-y-2">
              <h2 className="text-sm font-semibold">Расписание и записи</h2>
              <p className="text-xs text-gray-500">
                Быстрый доступ к расписанию врачей и списку приёмов. Используйте
                эти разделы для планирования и контроля нагрузки.
              </p>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <div className="text-[11px] text-gray-500">
                Открыть расписание врачей или список приёмов:
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/backoffice/registrar/schedule"
                  className="rounded-xl border border-gray-300 px-3 py-1.5 text-[11px] text-gray-700 hover:bg-gray-50"
                >
                  Расписание врачей
                </Link>
                <Link
                  href="/backoffice/registrar/consultations"
                  className="rounded-xl border border-gray-300 px-3 py-1.5 text-[11px] text-gray-700 hover:bg-gray-50"
                >
                  Все консультации и заявки
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Документы и финансы */}
        <section className="grid gap-4 md:grid-cols-3">
          <Link
            href="/backoffice/registrar/documents"
            className="rounded-2xl border bg-white p-4 hover:border-emerald-500 transition-colors block"
          >
            <h2 className="text-sm font-semibold">Документы</h2>
            <p className="mt-1 text-xs text-gray-500">
              Все договоры, согласия, анализы, заключения и другие документы
              клиентов и питомцев в одном месте.
            </p>
          </Link>

          <Link
            href="/backoffice/registrar/finance"
            className="rounded-2xl border bg-white p-4 hover:border-emerald-500 transition-colors block"
          >
            <h2 className="text-sm font-semibold">Финансы</h2>
            <p className="mt-1 text-xs text-gray-500">
              Счета, оплаты и статусы по консультациям и услугам клиентов.
              Центр финансовой работы регистратуры.
            </p>
          </Link>
        </section>

        {/* Создать новую консультацию */}
        <RegistrarCreateAppointment />

        {/* Краткая картотека клиентов */}
        <RegistrarClientsMini owners={owners} />

        {/* Последние консультации и заявки — мини-таблица */}
        <section className="rounded-2xl border bg-white p-4">
          <div className="mb-4 flex flex-wrap.items-center justify-between gap-3">
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
                  <th className="px-2 py-2 max-w-[220px]">Жалоба</th>
                  <th className="px-2 py-2">Документы</th>
                  <th className="px-2 py-2">Оплата</th>
                  <th className="px-2 py-2">Статус</th>
                  <th className="px-2 py-2 text-right">Действия</th>
                </tr>
              </thead>
              <tbody>
                {lastAppointments.map((a) => (
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

                    {/* Врач: фактический + выбранный клиентом */}
                    <td className="px-2 py-2 align-top">
                      <div className="text-[11px]">
                        {a.doctorName || "Не назначен"}
                      </div>
                      {a.requestedDoctorName && (
                        <div className="text-[10px] text-gray-500">
                          выбрал клиент: {a.requestedDoctorName}
                        </div>
                      )}
                    </td>

                    {/* Услуга + код */}
                    <td className="px-2 py-2 align-top">
                      <div className="text-[11px]">{a.serviceName}</div>
                      {a.serviceCode && (
                        <div className="text-[10px] text-gray-500">
                          {a.serviceCode}
                        </div>
                      )}
                    </td>

                    {/* Жалоба (обрезанная) */}
                    <td className="px-2 py-2 align-top max-w-[220px]">
                      <div className="text-[11px] text-gray-700 whitespace-pre-line line-clamp-2">
                        {a.complaint && a.complaint.trim().length > 0
                          ? a.complaint
                          : "—"}
                      </div>
                    </td>

                    {/* Документы: есть / нет */}
                    <td className="px-2 py-2 align-top">
                      <span
                        className={
                          a.hasDocuments
                            ? "inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700"
                            : "inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600"
                        }
                      >
                        {a.hasDocuments ? "есть" : "нет"}
                      </span>
                    </td>

                    {/* Оплата: оплачено / не оплачено */}
                    <td className="px-2 py-2 align-top">
                      <span
                        className={
                          a.hasPayments
                            ? "inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700"
                            : "inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600"
                        }
                      >
                        {a.hasPayments ? "оплачено" : "не оплачено"}
                      </span>
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
                      colSpan={10}
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
