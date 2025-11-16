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

  // Сегодняшний день (ключ YYYY-MM-DD)
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
              Список предстоящих онлайн-консультаций, сгруппированных по
              дням. Пока показываются все приёмы, позже добавим режим
              &quot;только мои&quot;.
            </p>
          </div>
          <RegistrarHeader />
        </header>

        <StaffNav />

        {/* Режим просмотра — чисто визуальный скелет */}
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
            Сейчас оба режима отображают одинаковый список. Когда появится
            привязка пользователя к конкретному врачу, здесь появится
            настоящая фильтрация.
          </p>
        </section>

        {/* Сегодня */}
        <section className="rounded-2xl border bg-white p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Сегодня</h2>
            <span className="text-[11px] text-gray-500">
              {todayAppointments.length > 0
                ? `Приёмов сегодня: ${todayAppointments.length}`
                : "Приёмов сегодня нет"}
            </span>
          </div>

          {todayAppointments.length === 0 && (
            <p className="text-xs text-gray-400">
              На сегодня нет ни одной онлайн-консультации.
            </p>
          )}

          {todayAppointments.length > 0 && (
            <div className="space-y-1">
              {todayAppointments
                .slice()
                .sort((a, b) => {
                  if (!a.startsAt || !b.startsAt) return 0;
                  return (
                    new Date(a.startsAt).getTime() -
                    new Date(b.startsAt).getTime()
                  );
                })
                .map((a) => (
                  <Link key={a.id} href={`/staff/appointment/${a.id}`}>
                    <div className="flex items-center justify-between rounded-xl border px-3 py-2 text-xs hover:bg-gray-50">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium text-gray-900">
                          {a.startsAt
                            ? new Date(a.startsAt).toLocaleTimeString(
                                "ru-RU",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )
                            : "—"}
                        </span>
                        <span className="text-[11px] text-gray-700">
                          {a.petName || "Без имени"}{" "}
                          {a.petSpecies ? `(${a.petSpecies})` : ""}
                        </span>
                        <span className="text-[10px] text-gray-500">
                          {a.serviceName}
                        </span>
                      </div>
                      <div className="text-right text-[10px] text-gray-500">
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
          )}
        </section>

        {/* Остальные дни */}
        <section className="rounded-2xl border bg-white p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Другие дни</h2>
            <span className="text-[11px] text-gray-500">
              {otherDays.length === 0
                ? "Ближайших приёмов нет"
                : `Дней с приёмами: ${otherDays.length}`}
            </span>
          </div>

          {otherDays.length === 0 && (
            <p className="text-xs text-gray-400">
              На ближайшие дни приёмов не запланировано.
            </p>
          )}

          {otherDays.map((dayKey) => {
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
                    Приёмов: {dayAppointments.length}
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
                            <span className="font-medium text-gray-900">
                              {a.startsAt
                                ? new Date(
                                    a.startsAt
                                  ).toLocaleTimeString("ru-RU", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : "—"}
                            </span>
                            <span className="text-[11px] text-gray-700">
                              {a.petName || "Без имени"}{" "}
                              {a.petSpecies
                                ? `(${a.petSpecies})`
                                : ""}
                            </span>
                            <span className="text-[10px] text-gray-500">
                              {a.serviceName}
                            </span>
                          </div>
                          <div className="text-right text-[10px] text-gray-500">
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
