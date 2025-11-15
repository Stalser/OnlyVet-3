import Link from "next/link";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { RegistrarHeader } from "@/components/registrar/RegistrarHeader";
import { RegistrarCreateAppointment } from "@/components/registrar/RegistrarCreateAppointment";
import {
  getRecentRegistrarAppointments,
} from "@/lib/registrar";
import { getOwnersSummary } from "@/lib/clients";
import { RegistrarClientsMini } from "@/components/registrar/RegistrarClientsMini";
import { RegistrarRecentConsultationsClient } from "@/components/registrar/RegistrarRecentConsultationsClient";

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
          <RegistrarHeader />
        </header>

        {/* Создание консультации */}
        <RegistrarCreateAppointment />

        {/* Мини-картотека клиентов */}
        <RegistrarClientsMini owners={owners} />

        {/* Последние консультации с мини-фильтрами */}
        <section className="rounded-2xl border bg-white p-4">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">
                Последние консультации и заявки
              </h2>
            </div>
            <Link
              href="/backoffice/registrar/consultations"
              className="text-xs font-medium text-emerald-700 hover:underline"
            >
              Все консультации и заявки
            </Link>
          </div>

          <RegistrarRecentConsultationsClient appointments={appointments} />
        </section>
      </main>
    </RoleGuard>
  );
}
