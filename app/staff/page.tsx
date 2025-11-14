"use client";

import { useMemo } from "react";
import {
  appointments,
  currentDoctorId,
  type Appointment,
} from "../../lib/appointments";

export default function StaffPage() {
  const today = "2025-11-15"; // потом подставим реальную "сегодня"

  const myAppointments = useMemo(
    () => appointments.filter((a) => a.doctorId === currentDoctorId),
    []
  );

  const todayAppointments = useMemo(
    () => myAppointments.filter((a) => a.date === today),
    [myAppointments, today]
  );

  const upcoming = useMemo(
    () => myAppointments.filter((a) => a.date > today),
    [myAppointments, today]
  );

  return (
    <main className="bg-slate-50 min-h-screen py-12">
      <div className="container space-y-8">
        {/* Заголовок */}
        <header className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-semibold">
            Кабинет сотрудника
          </h1>
          <p className="text-sm text-gray-600 max-w-xl">
            Здесь вы видите свои записи, расписание и статусы консультаций.
          </p>
        </header>

        {/* Сегодня */}
        <section className="rounded-2xl border border-gray-200 bg-white p-4 space-y-3 text-sm">
          <h2 className="font-semibold text-base">Сегодня</h2>
          {todayAppointments.length === 0 && (
            <p className="text-xs text-gray-500">
              На сегодня записей нет.
            </p>
          )}
          {todayAppointments.length > 0 && (
            <div className="space-y-2 text-xs">
              {todayAppointments.map((a) => (
                <StaffAppointmentCard key={a.id} a={a} />
              ))}
            </div>
          )}
        </section>

        {/* Ближайшие дни */}
        <section className="rounded-2xl border border-gray-200 bg-white p-4 space-y-3 text-sm">
          <h2 className="font-semibold text-base">Ближайшие записи</h2>
          {upcoming.length === 0 && (
            <p className="text-xs text-gray-500">
              Ближайших записей пока нет.
            </p>
          )}
          {upcoming.length > 0 && (
            <div className="space-y-2 text-xs">
              {upcoming.map((a) => (
                <StaffAppointmentCard key={a.id} a={a} />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function StaffAppointmentCard({ a }: { a: Appointment }) {
  const dateLabel = new Date(`${a.date}T${a.time}`).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });

  return (
    <article className="border border-gray-100 rounded-xl px-3 py-2 flex flex-col gap-1 bg-gray-50">
      <div className="flex justify-between items-center">
        <div className="font-medium">
          {a.time} — {a.petName}{" "}
          <span className="text-gray-500 text-[11px]">({a.species})</span>
        </div>
        <div className="text-[11px] text-gray-500">{dateLabel}</div>
      </div>
      <div className="text-[11px] text-gray-600">
        Услуга: {a.serviceName}
      </div>
      <div className="text-[11px] text-gray-500">
        Клиент: (будет подставляться ФИО владельца)
      </div>
    </article>
  );
}
