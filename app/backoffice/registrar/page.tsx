// app/backoffice/registrar/page.tsx
import Link from "next/link";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { RegistrarHeader } from "@/components/registrar/RegistrarHeader";
import { RegistrarCreateAppointment } from "@/components/registrar/RegistrarCreateAppointment";
import { getRecentRegistrarAppointments } from "@/lib/registrar";
import { getOwnersSummary } from "@/lib/clients";
import { RegistrarClientsMini } from "@/components/registrar/RegistrarClientsMini";
import { RegistrarRecentConsultationsClient } from "@/components/registrar/RegistrarRecentConsultationsClient";

export const dynamic = "force-dynamic";

export default async function RegistrarDashboardPage() {
  const [appointments, owners] = await Promise.all([
    getRecentRegistrarAppointments(50),
    getOwnersSummary(),
  ]);

  const newRequests = appointments.filter((a) =>
    a.statusLabel.toLowerCase().includes("запрош")
  );
  const newRequestsCount = newRequests.length;

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

        {/* Верхние виджеты */}
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
                href="/backoffice/registrar/consultations"
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
                Открыть расписание врачей или календарь записей:
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
                  Календарь / список приёмов
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Документы / финансы */}
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

        {/* Мини-картотека клиентов */}
        <RegistrarClientsMini owners={owners} />

        {/* Последние консультации и заявки — теперь через компонент */}
        <section className="rounded-2xl border bg-white p-4">
          <RegistrarRecentConsultationsClient appointments={appointments} />
        </section>
      </main>
    </RoleGuard>
  );
}
