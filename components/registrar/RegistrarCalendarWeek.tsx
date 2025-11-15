"use client";

import { useMemo, useState } from "react";
import type { RegistrarAppointmentRow } from "@/lib/registrar";

interface Props {
  appointments: RegistrarAppointmentRow[];
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0-вс, 1-пн...
  const diff = (day === 0 ? -6 : 1 - day); // понедельник
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function RegistrarCalendarWeek({ appointments }: Props) {
  const [weekOffset, setWeekOffset] = useState(0);

  const { weekStart, days, slots, apptsByDayHour } = useMemo(() => {
    const now = new Date();
    const baseStart = startOfWeek(now);
    const weekStart = addDays(baseStart, weekOffset * 7);

    // 7 дней: Пн-Вс
    const days = Array.from({ length: 7 }).map((_, i) => {
      const d = addDays(weekStart, i);
      return d;
    });

    // Часы, например 9–21
    const slots = Array.from({ length: 13 }).map((_, i) => 9 + i); // 9..21

    // Группируем приёмы по дню и часу
    const apptsByDayHour: Record<string, RegistrarAppointmentRow[]> = {};

    appointments.forEach((a) => {
      if (!a.startsAt) return;
      const d = new Date(a.startsAt);
      // Только те, что попадают в неделю
      const dayDiff = Math.floor(
        (d.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (dayDiff < 0 || dayDiff > 6) return;

      const hour = d.getHours();
      const key = `${dayDiff}-${hour}`;
      if (!apptsByDayHour[key]) apptsByDayHour[key] = [];
      apptsByDayHour[key].push(a);
    });

    return { weekStart, days, slots, apptsByDayHour };
  }, [appointments, weekOffset]);

  const formatDayHeader = (d: Date) =>
    d.toLocaleDateString("ru-RU", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
    });

  const formatHour = (h: number) =>
    `${h.toString().padStart(2, "0")}:00`;

  return (
    <section className="rounded-2xl border bg-white p-4 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold">
            Календарь записей (неделя)
          </h2>
          <p className="text-xs text-gray-500">
            Сетка по неделе. Можно листать недели назад/вперёд.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => setWeekOffset((o) => o - 1)}
            className="rounded-xl border px-2 py-1 hover:bg-gray-50"
          >
            ← Пред. неделя
          </button>
          <button
            type="button"
            onClick={() => setWeekOffset(0)}
            className="rounded-xl border px-2 py-1 hover:bg-gray-50"
          >
            Текущая неделя
          </button>
          <button
            type="button"
            onClick={() => setWeekOffset((o) => o + 1)}
            className="rounded-xl border px-2 py-1 hover:bg-gray-50"
          >
            След. неделя →
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-0 text-xs">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-white px-2 py-2 text-left text-[11px] uppercase text-gray-500">
                Время
              </th>
              {days.map((d, idx) => (
                <th
                  key={idx}
                  className="border-b px-2 py-2 text-center text-[11px] uppercase text-gray-500"
                >
                  {formatDayHeader(d)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slots.map((hour) => (
              <tr key={hour}>
                {/* Время слева */}
                <td className="sticky left-0 z-10 border-t bg-white px-2 py-1 text-[11px] text-gray-600">
                  {formatHour(hour)}
                </td>
                {/* Ячейки по дням */}
                {days.map((_, dayIdx) => {
                  const key = `${dayIdx}-${hour}`;
                  const cellAppts = apptsByDayHour[key] || [];
                  return (
                    <td
                      key={key}
                      className="border-t px-1 py-1 align-top"
                    >
                      {cellAppts.length > 0 && (
                        <div className="space-y-1">
                          {cellAppts.map((a) => (
                            <div
                              key={a.id}
                              className="rounded-lg bg-emerald-50 px-2 py-1 text-[10px] text-emerald-900 shadow-sm"
                            >
                              <div className="font-semibold">
                                {a.serviceName}
                              </div>
                              {a.petName && (
                                <div className="text-[10px] text-emerald-900">
                                  {a.petName}
                                </div>
                              )}
                              {a.doctorName && (
                                <div className="text-[9px] text-emerald-800">
                                  {a.doctorName}
                                </div>
                              )}
                            </div>
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
    </section>
  );
}
