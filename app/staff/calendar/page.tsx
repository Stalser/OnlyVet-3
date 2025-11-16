import Link from "next/link";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { RegistrarHeader } from "@/components/registrar/RegistrarHeader";
import { StaffNav } from "@/components/staff/StaffNav";
import { getRegistrarAppointments } from "@/lib/registrar";

type Appointment = Awaited<
  ReturnType<typeof getRegistrarAppointments>
>[number];

// вспомогательные функции
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

  // начнём неделю с сегодняшнего дня
  const weekStart = startOfDay(now);
  const days = Array.from({ length: 7 }).map((_, i) =>
    addDays(weekStart, i)
  );

  // показываем приёмы только на этой неделе (скелет, без жёсткой логики)
  const weeklyAppointments: Appointment[] = appointments.filter((a) => {
    if (!a.startsAt) return false;
    const d = new Date(a.startsAt);
    const dayStart = weekStart.getTime();
    const dayEnd = addDays(weekStart, 7).getTime();
    return d.getTime() >= dayStart && d.getTime() < dayEnd;
  });

  // индексируем приёмы по ключу "dayIndex-hour"
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

  // часы с 9 до 21 (скелет)
  const hours = Array.from({ length: 13 }).map((_, i) => 9 + i);

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
              Недельный календарный вид онлайн-консультаций. Позже здесь
              можно будет включать фильтр &quot;только мои приёмы&quot;.
            </p>
          </div>
          <RegistrarHeader />
        </header>

        <StaffNav />

        {/* Скелет календаря на неделю */}
        <section className="rounded-2xl border bg-white p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-gray-700">
              Неделя
            </div>
            <div className="text-[11px] text-gray-500">
              {weekStart.toLocaleDateString("ru-RU", {
                day: "2-digit",
                month: "2-digit",
              })}{" "}
              —{" "}
              {addDays(weekStart, 6).toLocaleDateString("ru-RU", {
                day: "2-digit",
                month: "2-digit",
              })}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0 text-xs">
              <thead>
                <tr>
                  {/* левая колонка с часами */}
                  <th className="sticky left-0 z-10 bg-white px-2 py-2 text-left text-[11px] uppercase text-gray-500 border-b">
                    Время
                  </th>
                  {days.map((day, idx) => (
                    <th
                      key={idx}
                      className="px-2 py-2 text-center text-[11px] uppercase text-gray-500 border-b"
                    >
                      {day.toLocaleDateString("ru-RU", {
                        weekday: "short",
                        day: "2-digit",
                        month: "2-digit",
                      })}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {hours.map((hour) => (
                  <tr key={hour}>
                    {/* Время слева */}
                    <td className="sticky left-0 z-10 bg-white px-2 py-1 text-[11px] text-gray-600 border-t">
                      {hour.toString().padStart(2, "0")}:00
                    </td>
                    {/* Ячейки по дням */}
                    {days.map((_, dayIdx) => {
                      const key = `${dayIdx}-${hour}`;
                      const cellAppts = apptsByDayAndHour[key] || [];
                      return (
                        <td
                          key={key}
                          className="border-t px-1 py-1 align-top min-w-[110px]"
                        >
                          {cellAppts.length > 0 && (
                            <div className="space-y-1">
                              {cellAppts.map((a) => (
                                <Link
                                  key={a.id}
                                  href={`/staff/appointment/${a.id}`}
                                >
                                  <div className="rounded-lg bg-emerald-50 px-2 py-1 text-[10px] text-emerald-900 shadow-sm hover:bg-emerald-100">
                                    <div className="font-semibold line-clamp-1">
                                      {a.serviceName}
                                    </div>
                                    {a.petName && (
                                      <div className="text-[10px] text-emerald-900 line-clamp-1">
                                        {a.petName}
                                        {a.petSpecies
                                          ? ` (${a.petSpecies})`
                                          : ""}
                                      </div>
                                    )}
                                    {a.statusLabel && (
                                      <div className="text-[9px] text-emerald-800 line-clamp-1">
                                        {a.statusLabel}
                                      </div>
                                    )}
                                  </div>
                                </Link>
                              ))}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {weeklyAppointments.length === 0 && (
            <p className="text-xs text-gray-400">
              На этой неделе приёмов пока нет. Позже здесь будут отображаться
              только приёмы текущего врача.
            </p>
          )}
        </section>
      </main>
    </RoleGuard>
  );
}
