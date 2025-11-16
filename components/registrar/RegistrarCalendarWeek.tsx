"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { RegistrarAppointmentRow } from "@/lib/registrar";

interface Props {
  appointments: RegistrarAppointmentRow[];
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0-вс, 1-пн...
  const diff = day === 0 ? -6 : 1 - day; // перенос к понедельнику
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
  const [doctorFilter, setDoctorFilter] = useState<string>("all");

  // Список врачей для фильтра
  const doctors = useMemo(
    () =>
      Array.from(
        new Set(
          appointments
            .map((a) => a.doctorName || "")
            .filter((d) => d.trim().length > 0 && d !== "Не назначен")
        )
      ),
    [appointments]
  );

  const {
    weekStart,
    days,
    slots,
    apptsByDayHour,
  } = useMemo(() => {
    const now = new Date();
    const baseStart = startOfWeek(now);
    const weekStart = addDays(baseStart, weekOffset * 7);

    // фильтруем по врачу и наличию времени
    const source = appointments.filter((a) => {
      if (!a.startsAt) return false;
      if (
        doctorFilter !== "all" &&
        (a.doctorName || "").toLowerCase() !== doctorFilter.toLowerCase()
      ) {
        return false;
      }
      return true;
    });

    const days = Array.from({ length: 7 }).map((_, i) =>
      addDays(weekStart, i)
    );

    const slots = Array.from({ length: 13 }).map((_, i) => 9 + i); // 9..21

    const apptsByDayHour: Record<string, RegistrarAppointmentRow[]> = {};

    source.forEach((a) => {
      if (!a.startsAt) return;
      const d = new Date(a.startsAt);
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
  }, [appointments, weekOffset, doctorFilter]);

  const formatDayHeader = (d: Date) =>
    d.toLocaleDateString("ru-RU", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
    });

  const formatHour = (h: number) =>
    `${h.toString().padStart(2, "0")}:00`;

  const weekRangeLabel = (() => {
    const end = addDays(weekStart, 6);
    const startStr = weekStart.toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
    });
    const endStr = end.toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    return `${startStr} — ${endStr}`;
  })();

  return (
    <section className="rounded-2xl border bg-white p-4 space-y-4">
      {/* Заголовок + фильтры */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">
            Календарь записей (неделя)
          </h2>
          <p className="text-xs text-gray-500">
            Период: {weekRangeLabel}. Показаны консультации с заполненным
            временем начала (starts_at).
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            value={doctorFilter}
            onChange={(e) => setDoctorFilter(e.target.value)}
            className="rounded-xl border px-2 py-1.5 text-xs"
          >
            <option value="all">Все врачи</option>
            {doctors.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

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
            Текущая
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

      {/* Таблица календаря */}
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
                      className="border-t px-1 py-1 align-top min-w-[80px]"
                    >
                      {cellAppts.length > 0 && (
                        <div className="space-y-1">
                          {cellAppts.map((a) => (
                            <Link
                              key={a.id}
                              href={`/backoffice/registrar/consultations/${a.id}`}
                            >
                              <div className="rounded-lg bg-emerald-50 px-2 py-1 text-[10px] text-emerald-900 shadow-sm hover:bg-emerald-100">
                                <div className="font-semibold line-clamp-1">
                                  {a.serviceName}
                                </div>
                                {a.petName && (
                                  <div className="text-[10px] text-emerald-900 line-clamp-1">
                                    {a.petName}
                                  </div>
                                )}
                                {a.doctorName && (
                                  <div className="text-[9px] text-emerald-800 line-clamp-1">
                                    {a.doctorName}
                                  </div>
                                )}
                                {/* Бейдж Телемоста */}
                                <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-white/80 px-2 py-0.5 text-[9px] font-medium text-emerald-700">
                                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-600" />
                                  Телемост
                                </div>
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
    </section>
  );
}
