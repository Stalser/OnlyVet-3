import Link from "next/link";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { RegistrarHeader } from "@/components/registrar/RegistrarHeader";
import { getRegistrarAppointments } from "@/lib/registrar";
import { RegistrarCalendarWeek } from "@/components/registrar/RegistrarCalendarWeek";

export default async function StaffCalendarPage() {
  const appointments = await getRegistrarAppointments();

  return (
    <RoleGuard allowed={["vet", "admin"]}>
      <main className="mx-auto max-w-6xl px-4 py-6 space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <Link
              href="/staff"
              className="text-xs text-gray-500 hover:text-gray-700 hover:underline"
            >
              ← В кабинет врача
            </Link>
            <h1 className="mt-2 text-2xl font-bold tracking-tight">
              Календарь приёмов врача
            </h1>
            <p className="text-sm text-gray-500">
              Недельный календарь онлайн-консультаций. Можно фильтровать по
              врачу и листать недели.
            </p>
          </div>
          <RegistrarHeader />
        </header>

        {/* Важное отличие: linkBase="/staff/appointment" */}
        <RegistrarCalendarWeek
          appointments={appointments}
          linkBase="/staff/appointment"
        />
      </main>
    </RoleGuard>
  );
}
