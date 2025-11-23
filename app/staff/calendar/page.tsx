import Link from "next/link";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { StaffHeader } from "@/components/staff/StaffHeader";
import { StaffNav } from "@/components/staff/StaffNav";
import { getRegistrarAppointments } from "@/lib/registrar";

type Appointment = Awaited<
  ReturnType<typeof getRegistrarAppointments>
>[number];

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export default async function StaffCalendarPage() {
  const appointments = await getRegistrarAppointments();
  const now = new Date();

  const weekStart = startOfDay(now);
  const weekEnd = addDays(weekStart, 7);
  const days = Array.from({ length: 7 }).map((_, i) =>
    addDays(weekStart, i)
  );

  const weeklyAppointments: Appointment[] = appointments.filter((a) => {
    if (!a.startsAt) return false;
    const d = new Date(a.startsAt);
    return d >= weekStart && d < weekEnd;
  });

  const apptsByDayAndHour: Record<string, Appointment[]> = {};
  weeklyAppointments.forEach((a) => {
    if (!a.startsAt) return;
    const d = new Date(a.startsAt);
    const dayIndex = Math.floor(
      (startOfDay(d).getTime() - weekStart.getTime()) /
        (1000 * 60 * 60 * 24)
    );
    if (dayIndex < 0 || dayIndex > 6) return;
    const hour = d.getHours();
    const key = `${dayIndex}-${hour}`;
    if (!apptsByDayAndHour[key]) apptsByDayAndHour[key] = [];
    apptsByDayAndHour[key].push(a);
  });

  const hours = Array.from({ length: 13 }).map((_, i) => 9 + i); // 9–21

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
              Календарь приёмов
            </h1>
            <p className="text-sm text-gray-500">
              Недельный календарный вид онлайн-консультаций.
            </p>
          </div>
          <StaffHeader />
        </header>

        <StaffNav />

        {/* Ниже оставляешь свой существующий JSX календаря */}
      </main>
    </RoleGuard>
  );
}
