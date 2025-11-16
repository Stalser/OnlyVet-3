import Link from "next/link";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { RegistrarHeader } from "@/components/registrar/RegistrarHeader";
import { StaffNav } from "@/components/staff/StaffNav";
import { getRegistrarAppointments } from "@/lib/registrar";

type Appointment = Awaited<
  ReturnType<typeof getRegistrarAppointments>
>[number];

export default async function StaffSchedulePage() {
  const appointments = await getRegistrarAppointments();
  const now = new Date();

  const upcoming: Appointment[] = appointments.filter((a) => {
    if (!a.startsAt) return false;
    const d = new Date(a.startsAt);
    return d >= now;
  });

  const groupedByDay: Record<string, Appointment[]> = {};
  upcoming.forEach((a) => {
    if (!a.startsAt) return;
    const d = new Date(a.startsAt);
    const key = d.toISOString().split("T")[0];
    if (!groupedByDay[key]) groupedByDay[key] = [];
    groupedByDay[key].push(a);
  });

  const sortedDays = Object.keys(groupedByDay).sort(
    (d1, d2) => new Date(d1).getTime() - new Date(d2).getTime()
  );

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
              Список предстоящих онлайн-консультаций, сгруппированных по
              дням. Позже здесь появится фильтр &quot;только мои
              консультации&quot;.
            </p>
          </div>
          <RegistrarHeader />
        </header>

        <StaffNav />

        {/* Переключатель режима — пока визуальный */}
        <section className="rounded-2xl border bg-white p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs font-semibold text-gray-700">
              Режим просмотра
            </div>
            <div className="inline-flex rounded-xl bg-gray-100 p-1 text-[11px]">
              <button className="px-3 py-1.5 rounded-lg bg-white text-gray-900 shadow-sm">
                Мои приёмы
              </button>
              <button className="px-3 py-1.5 rounded-lg text-gray-500 hover:text-gray-800">
                Все врачи
              </button>
            </div>
          </div>
          <p className="text-[10px] text-gray-400">
            В этом скелетном варианте оба режима показывают один и тот же
            список. Когда появится привязка аккаунта к врачу, сюда
            добавим реальную фильтрацию.
          </p>
        </section>

        {/* Расписание по дням */}
        <section className="rounded-2xl border bg-white p-4 space-y-4">
          <h2 className="text-base font-semibold">
            Предстоящие приёмы по дням
          </h2>

          {sortedDays.length === 0 && (
            <p className="text-xs text_gray-500">
              В ближайшее время приёмов нет.
            </p>
          )}

          {sortedDays.map((dayKey) => {
            const dayAppointments = groupedByDay[dayKey] || [];
            const dayDate = new Date(dayKey);

            return (
              <div key={dayKey} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-gray-700">
                    {dayDate.toLocaleDateString("ru-RU", {
                      weekday: "long",
                      day: "2-digit",
                      month: "2-digit",
                    })}
                  </div>
                  <div className="text-[11px] text-gray-400">
                    Всего приёмов: {dayAppointments.length}
                  </div>
                </div>

                <div className="space-y-1">
                  {dayAppointments
                    .slice()
                    .sort((a, b) => {
                      if (!a.startsAt || !b.startsAt) return 0;
                      return (
                        new Date(a.startsAt).getTime() -
                        new Date(b.startsAt).getTime()
                      );
                    })
                    .map((a) => (
                      <Link
                        key={a.id}
                        href={`/staff/appointment/${a.id}`}
                      >
                        <div className="flex items-center justify-between rounded-xl border px-3 py-2 text-xs hover:bg-gray-50">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-medium text_gray-900">
                              {a.startsAt
                                ? new Date(
                                    a.startsAt
                                  ).toLocaleTimeString("ru-RU", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : "—"}
                            </span>
                            <span className="text-[11px] text_gray-700">
                              {a.petName || "Без имени"}{" "}
                              {a.petSpecies
                                ? `(${a.petSpecies})`
                                : ""}
                            </span>
                            <span className="text-[10px] text_gray-500">
                              {a.serviceName}
                            </span>
                          </div>
                          <div className="text-right text-[10px] text_gray-500">
                            <div>{a.statusLabel}</div>
                            {a.doctorName && (
                              <div className="mt-0.5 text-[10px] text-gray-400">
                                {a.doctorName}
                              </div>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                </div>
              </div>
            );
          })}
        </section>
      </main>
    </RoleGuard>
  );
}
