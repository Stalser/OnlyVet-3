"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  appointments,
  type Appointment,
  currentDoctorId,
} from "../../lib/appointments";
import { doctors } from "../../lib/data";

type Doctor = (typeof doctors)[number] | any;
type StatusFilter = "all" | Appointment["status"];

export default function StaffPage() {
  const doctorId = currentDoctorId ?? "ivanova";
  const doctor = (doctors as Doctor[]).find((d) => d.id === doctorId);

  const myAppointments = useMemo(
    () => appointments.filter((a) => a.doctorId === doctorId),
    [doctorId]
  );

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  const filterByStatus = (list: Appointment[]) =>
    list.filter((a) => statusFilter === "all" || a.status === statusFilter);

  const todayAppointments = useMemo(
    () => filterByStatus(myAppointments.filter((a) => a.date === todayStr)),
    [myAppointments, todayStr, statusFilter]
  );

  const upcomingAppointments = useMemo(
    () => filterByStatus(myAppointments.filter((a) => a.date > todayStr)),
    [myAppointments, todayStr, statusFilter]
  );

  const pastAppointments = useMemo(
    () => filterByStatus(myAppointments.filter((a) => a.date < todayStr)),
    [myAppointments, todayStr, statusFilter]
  );

  const notCompleted = useMemo(
    () => myAppointments.filter((a) => a.status !== "завершена"),
    [myAppointments]
  );

  const stats = useMemo(() => {
    const total = myAppointments.length;
    const todayCount = myAppointments.filter((a) => a.date === todayStr).length;
    const confirmed = myAppointments.filter(
      (a) => a.status === "подтверждена"
    ).length;
    const requested = myAppointments.filter(
      (a) => a.status === "запрошена"
    ).length;
    const unfinished = myAppointments.filter(
      (a) => a.status !== "завершена"
    ).length;
    return { total, todayCount, confirmed, requested, unfinished };
  }, [myAppointments, todayStr]);

  return (
    <main className="bg-slate-50 min-h-screen py-12">
      <div className="container space-y-8">
        {/* Шапка */}
        <header className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-semibold">
            Кабинет сотрудника
          </h1>
          {doctor && (
            <p className="text-sm text-gray-700">
              {doctor.name} — {doctor.speciality}
            </p>
          )}
          <p className="text-xs text-gray-500 max-w-xl">
            Здесь отображаются ваши приёмы, расписание и документы по пациентам.
          </p>
        </header>

        {/* Мини-дашборд */}
        <section className="grid sm:grid-cols-5 gap-3 text-xs">
          <StatCard label="Всего записей" value={stats.total} hint="За всё время" />
          <StatCard label="Сегодня" value={stats.todayCount} hint="Приёмов на сегодня" />
          <StatCard label="Подтверждено" value={stats.confirmed} hint="Подтверждённые записи" />
          <StatCard label="Запросы" value={stats.requested} hint="Записи в статусе «запрошена»" />
          <StatCard label="Неотработано" value={stats.unfinished} hint="Статус ≠ «завершена»" />
        </section>

        {/* Фильтр по статусу */}
        <section className="rounded-2xl border bg-white p-4 text-xs flex flex-wrap gap-3 items-center justify-between">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-gray-500">Фильтр по статусу:</span>
            <select
              className="rounded-xl border border-gray-200 px-3 py-1 bg-white outline-none"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            >
              <option value="all">Все</option>
              <option value="запрошена">Запрошены</option>
              <option value="подтверждена">Подтверждены</option>
              <option value="завершена">Завершены</option>
            </select>
          </div>
          <div className="text-[11px] text-gray-500">
            Актуальных записей: {todayAppointments.length + upcomingAppointments.length}
          </div>
        </section>

        {/* Сегодня */}
        <SectionBlock title="Сегодня" emptyText="На сегодня записей нет.">
          {todayAppointments.map((a) => (
            <StaffAppointmentCard key={a.id} a={a} />
          ))}
        </SectionBlock>

        {/* Ближайшие записи */}
        <SectionBlock
          title="Ближайшие записи"
          emptyText="Ближайших записей пока нет."
        >
          {upcomingAppointments.map((a) => (
            <StaffAppointmentCard key={a.id} a={a} />
          ))}
        </SectionBlock>

        {/* Прошедшие приёмы */}
        <SectionBlock
          title="Прошедшие приёмы"
          emptyText="Прошедших приёмов пока нет."
        >
          {pastAppointments.map((a) => (
            <StaffAppointmentCard key={a.id} a={a} />
          ))}
        </SectionBlock>

        {/* Неотработанные */}
        <SectionBlock
          title="Неотработанные записи"
          emptyText="Все записи закрыты."
        >
          {notCompleted.map((a) => (
            <StaffAppointmentCard key={a.id} a={a} highlightUnfinished />
          ))}
        </SectionBlock>
      </div>
    </main>
  );
}

/* ---------- мини-карточка статистики ---------- */

function StatCard(props: { label: string; value: number; hint?: string }) {
  return (
    <div className="rounded-2xl border bg-white p-3 flex flex-col gap-1">
      <div className="text-[11px] text-gray-500">{props.label}</div>
      <div className="text-lg font-semibold">{props.value}</div>
      {props.hint && (
        <div className="text-[11px] text-gray-400">{props.hint}</div>
      )}
    </div>
  );
}

/* ---------- блок секции ---------- */

function SectionBlock(props: {
  title: string;
  emptyText: string;
  children: React.ReactNode;
}) {
  const isEmpty =
    !props.children ||
    (Array.isArray(props.children) && props.children.length === 0);

  return (
    <section className="rounded-2xl border bg-white p-4 space-y-3 text-sm">
      <h2 className="font-semibold text-base">{props.title}</h2>
      {isEmpty ? (
        <p className="text-xs text-gray-500">{props.emptyText}</p>
      ) : (
        <div className="space-y-2 text-xs">{props.children}</div>
      )}
    </section>
  );
}

/* ---------- карточка приёма для врача ---------- */

function StaffAppointmentCard({
  a,
  highlightUnfinished,
}: {
  a: Appointment;
  highlightUnfinished?: boolean;
}) {
  const dateLabel = new Date(`${a.date}T${a.time}`).toLocaleDateString(
    "ru-RU",
    {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    }
  );

  const statusColor =
    a.status === "подтверждена"
      ? "text-emerald-700 bg-emerald-50"
      : a.status === "запрошена"
      ? "text-amber-700 bg-amber-50"
      : a.status === "завершена"
      ? "text-gray-700 bg-gray-50"
      : "text-red-700 bg-red-50";

  const borderClasses = highlightUnfinished
    ? "border-amber-300 bg-amber-50"
    : "border-gray-100 bg-gray-50";

  return (
    <article
      className={`border rounded-xl px-3 py-2 flex flex-col gap-1 ${borderClasses}`}
    >
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
      <div className="flex justify-between items-center text-[11px] mt-1">
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 ${statusColor}`}
        >
          {a.status}
        </span>
        <Link
          href={`/staff/appointment/${a.id}`}
          className="text-blue-600 underline underline-offset-2"
        >
          Открыть рабочее место
        </Link>
      </div>
    </article>
  );
}
