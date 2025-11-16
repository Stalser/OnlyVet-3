import Link from "next/link";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { RegistrarHeader } from "@/components/registrar/RegistrarHeader";
import { getRegistrarAppointments } from "@/lib/registrar";

function getStatusBadge(status: string) {
  const s = status.toLowerCase();

  if (s.includes("запрош")) {
    return {
      label: status,
      className:
        "inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700",
    };
  }
  if (s.includes("подтверж")) {
    return {
      label: status,
      className:
        "inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700",
    };
  }
  if (s.includes("отмен")) {
    return {
      label: status,
      className:
        "inline-flex rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-700",
    };
  }
  if (s.includes("заверш")) {
    return {
      label: status,
      className:
        "inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600",
    };
  }

  return {
    label: status || "неизвестен",
    className:
      "inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700",
  };
}

export default async function StaffDashboardPage() {
  const appointments = await getRegistrarAppointments();
  const now = new Date();

  // Пока показываем все приёмы. Позже можем фильтровать по doctorId текущего врача.
  const upcoming = appointments.filter((a) => {
    if (!a.startsAt) return false;
    const d = new Date(a.startsAt);
    return d >= now && !a.statusLabel.toLowerCase().includes("отмен");
  });

  const todayCount = appointments.filter((a) => {
    if (!a.startsAt) return false;
    const d = new Date(a.startsAt);
    const sameDay =
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate();
    return sameDay;
  }).length;

  const completedCount = appointments.filter((a) =>
    a.statusLabel.toLowerCase().includes("заверш")
  ).length;

  const cancelledCount = appointments.filter((a) =>
    a.statusLabel.toLowerCase().includes("отмен")
  ).length;

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
          </div>
          <div className="flex flex-col items-end gap-2">
            <RegistrarHeader />
            <div className="flex flex-wrap items-center gap-3 text-[11px]">
              <Link
                href="/staff/schedule"
                className="font-medium text-emerald-700 hover:underline"
              >
                Расписание →
              </Link>
              <Link
                href="/staff/calendar"
                className="font-medium text-emerald-700 hover:underline"
              >
                Календарь приёмов →
              </Link>
            </div>
          </div>
        </header>

        {/* Мини-дашборд */}
        <section className="grid gap-3 md:grid-cols-4">
          <div className="rounded-2xl border bg-white p-3">
            <div className="text-[11px] text-gray-500">Приёмы сегодня</div>
            <div className="mt-1 text-2xl font-semibold text-gray-900">
              {todayCount}
            </div>
          </div>
          <div className="rounded-2xl border bg-white p-3">
            <div className="text-[11px] text-gray-500">Ближайшие записи</div>
            <div className="mt-1 text-2xl font-semibold text-gray-900">
              {upcoming.length}
            </div>
          </div>
          <div className="rounded-2xl border bg-white p-3">
            <div className="text-[11px] text-gray-500">Завершено</div>
            <div className="mt-1 text-2xl font-semibold text-gray-900">
              {completedCount}
            </div>
          </div>
          <div className="rounded-2xl border bg-white p-3">
            <div className="text-[11px] text-gray-500">Отменено</div>
            <div className="mt-1 text-2xl font-semibold text-gray-900">
              {cancelledCount}
            </div>
          </div>
        </section>

        {/* Предстоящие консультации (как “рабочий список”) */}
        <section className="rounded-2xl border bg-white p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">
              Предстоящие консультации
            </h2>
            <Link
              href="/backoffice/registrar/consultations"
              className="text-xs font-medium text-emerald-700 hover:underline"
            >
              Общий список всех приёмов →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead>
                <tr className="border-b bg-gray-50 text-left text-[11px] uppercase text-gray-500">
                  <th className="px-2 py-2">Дата / время</th>
                  <th className="px-2 py-2">Пациент</th>
                  <th className="px-2 py-2">Услуга</th>
                  <th className="px-2 py-2">Статус</th>
                  <th className="px-2 py-2 text-right">Действия</th>
                </tr>
              </thead>
              <tbody>
                {upcoming.map((a) => {
                  const badge = getStatusBadge(a.statusLabel);
                  return (
                    <tr
                      key={a.id}
                      className="border-b last:border-0 hover:bg-gray-50"
                    >
                      <td className="px-2 py-2 align-top text-[11px] text-gray-700">
                        <div>{a.dateLabel}</div>
                        {a.createdLabel && (
                          <div className="text-[10px] text-gray-400">
                            создано: {a.createdLabel}
                          </div>
                        )}
                      </td>
                      <td className="px-2 py-2 align-top">
                        <div className="text-[11px]">
                          {a.petName || "Без имени"}
                        </div>
                        {a.petSpecies && (
                          <div className="text-[10px] text-gray-500">
                            {a.petSpecies}
                          </div>
                        )}
                      </td>
                      <td className="px-2 py-2 align-top">
                        <div className="text-[11px]">{a.serviceName}</div>
                        {a.serviceCode && (
                          <div className="text-[10px] text-gray-500">
                            {a.serviceCode}
                          </div>
                        )}
                      </td>
                      <td className="px-2 py-2 align-top">
                        <span className={badge.className}>{badge.label}</span>
                      </td>
                      <td className="px-2 py-2 align-top text-right">
                        <Link
                          href={`/staff/appointment/${a.id}`}
                          className="text-[11px] font-medium text-emerald-700 hover:underline"
                        >
                          Открыть приём →
                        </Link>
                      </td>
                    </tr>
                  );
                })}

                {upcoming.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-2 py-8 text-center text-xs text-gray-400"
                    >
                      Предстоящих консультаций нет.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </RoleGuard>
  );
}
