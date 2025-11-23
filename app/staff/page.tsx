import Link from "next/link";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { RegistrarHeader } from "@/components/registrar/RegistrarHeader";
import { StaffNav } from "@/components/staff/StaffNav";
import { getRegistrarAppointments } from "@/lib/registrar";
import { StaffDashboardClient } from "@/components/staff/StaffDashboardClient";

export default async function StaffDashboardPage() {
  const appointments = await getRegistrarAppointments();

  return (
    <RoleGuard allowed={["vet", "admin"]}>
      <main className="mx-auto max-w-6xl px-4 py-6 space-y-6">
        {/* Шапка */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Кабинет врача
            </h1>
            <p className="text-sm text-gray-500">
              Ваши онлайн-консультации, пациенты и расписание приёмов.
            </p>
            <p className="mt-1 text-[11px] text-gray-400">
              Сейчас отображаются только приёмы, привязанные к этому врачу.
            </p>
          </div>
          <RegistrarHeader />
        </header>

        {/* Горизонтальное меню врача */}
        <StaffNav />

        {/* Клиентский дашборд, который фильтрует приёмы по doctor_id */}
        <StaffDashboardClient appointments={appointments} />
      </main>
    </RoleGuard>
  );
}
