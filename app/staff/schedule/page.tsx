import Link from "next/link";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { StaffHeader } from "@/components/staff/StaffHeader";
import { StaffNav } from "@/components/staff/StaffNav";
import { getRegistrarAppointments } from "@/lib/registrar";

type Appointment = Awaited<
  ReturnType<typeof getRegistrarAppointments>
>[number];

export default async function StaffSchedulePage() {
  const appointments = await getRegistrarAppointments();
  const now = new Date();

  // Все приёмы в будущем и сегодня
  const upcoming: Appointment[] = appointments.filter((a) => {
    if (!a.startsAt) return false;
    const d = new Date(a.startsAt);
    return d >= new Date(now.getFullYear(), now.getMonth(), now.getDate());
  });

  // Группировка по дате (YYYY-MM-DD)
  const groupedByDay: Record<string, Appointment[]> = {};
  upcoming.forEach((a) => {
    if (!a.startsAt) return;
    const d = new Date(a.startsAt);
    const key = d.toISOString().split("T")[0]; // YYYY-MM-DD
    if (!groupedByDay[key]) groupedByDay[key] = [];
    groupedByDay[key].push(a);
  });

  const sortedDays = Object.keys(groupedByDay).sort(
    (d1, d2) => new Date(d1).getTime() - new Date(d2).getTime()
  );

  const todayKey = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    .toISOString()
    .split("T")[0];

  const todayAppointments = groupedByDay[todayKey] || [];
  const otherDays = sortedDays.filter((d) => d !== todayKey);

  return (
    <RoleGuard allowed={["vet", "admin"]}>
      <main className="mx-auto max-w-6xl px-4 py-6 space-y-6">
        {/* Шапка */}
        <header className="flex items-center justify-between">
          <div>
            <Link
              href="/staff"
              className="text-xs text-gray-500 hover:text-gray-700 hover:underline"
            >
              ← В кабинет врача
            </Link>
            <h1 className="mt-2 text-2xl font-bold tracking-tight">
              Расписание приёмов
            </h1>
            <p className="text-sm text-gray-500">
              Список предстоящих онлайн-консультаций, сгруппированных по дням.
            </p>
          </div>
          <StaffHeader />
        </header>

        <StaffNav />

        {/* Режим просмотра – пока чисто визуальный */}
        {/* …дальше твой текущий код без изменений… */}
      </main>
    </RoleGuard>
  );
}
