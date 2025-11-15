import { RoleGuard } from "@/components/auth/RoleGuard";
import { RegistrarHeader } from "@/components/registrar/RegistrarHeader";
import { getRegistrarAppointments } from "@/lib/registrar";
import { RegistrarCalendarWeek } from "@/components/registrar/RegistrarCalendarWeek";
import Link from "next/link";

export default async function RegistrarCalendarPage() {
  const appointments = await getRegistrarAppointments();

  return (
    <RoleGuard allowed={["registrar", "admin"]}>
      <main className="mx-auto max-w-6xl px-4 py-6 space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <Link
              href="/backoffice/registrar"
              className="text-xs text-gray-500 hover:text-gray-700 hover:underline"
            >
              ← В кабинет регистратуры
            </Link>
            <h1 className="mt-2 text-2xl font-bold tracking-tight">
              Календарь записей
            </h1>
            <p className="text-sm text-gray-500">
              Недельный календарь всех консультаций по данным таблицы
              appointments.
            </p>
          </div>
          <RegistrarHeader />
        </header>

        <RegistrarCalendarWeek appointments={appointments} />
      </main>
    </RoleGuard>
  );
}
