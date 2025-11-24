// components/registrar/Staff/StaffRecentConsultationsClient.tsx
"use client";

import { useMemo } from "react";
import Link from "next/link";
import type { RegistrarAppointmentRow } from "@/lib/registrar";

type Props = {
  appointments: RegistrarAppointmentRow[];
};

type StatusBadge = {
  label: string;
  className: string;
};

function getStatusBadge(status: string): Status Badge {
  const s = status.toLowerCase();
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
        "inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-700",
    };
  }
  if (s.includes("запрош")) {
    return {
      label: status,
      className:
        "inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700",
    };
  }
  return {
    label: status || "неизвестен",
    className:
      "inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700",
  };
}

export function StaffDashboardClient({ appointments }: Props) {
  const now = useMemo(() => new Date(), []);

  const upcoming = useMemo(
    () =>
      appointments.filter((a) => {
        if (!a.startsAt) return false;
        const d = new Date(a.startsAt);
        return d >= now && !a.statusLabel.toLowerCase().includes("отмен");
      }),
    [appointments, now]
  );

  const todayCount = useMemo(
    () =>
      appointments.filter((a) => {
        if (!a.startsAt) return false;
        const d = new Date(a.startsAt);
        return (
          d.getFullYear() === now.getFullYear() &&
          d.getMonth() === now.getMonth() &&
          d.getDate() === now.getDate()
        );
      }).length,
    [appointments, now]
  );

  const completedCount = useMemo(
    () =>
      appointments.filter((a) =>
        a.statusLabel.toLowerCase().includes("заверш")
      ).length,
    [appointments]
  );

  const cancelledCount = useMemo(
    () =>
      appointments.filter((a) =>
        a.statusLabel.toLowerCase().includes("отмен")
      ).length,
    [appointments]
  );

  return (
    <>
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

      {/* Список последних консультаций */}
      <section className="rounded-2xl border bg-white p-4 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold">
            Последние консультации и заявки
          </h2>
          <Link
            href="/backoffice/registrar/consultations"
            className="text-xs font-medium text-emerald-700 hover:underline"
          >
            Все консультации и заявки →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-[11px] uppercase text-gray-500">
                <th className="px-2 py-2">Дата / время</th>
                <th className="px-2 py-2">Клиент</th>
                <th className="px-2 py-2">Питомец</th>
                <th className="px-2 py-2">Врач</th>
                <th className="px-2 py-2">Жалоба</th>
                <th className="px-2 py-2 text-center">Документы</th>
                <th className="px-2 py-2 text-center">Оплата</th>
                <th className="px-2 py-2">Статус</th>
                <th className="px-2 py-2 text-right">Действия</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((a) => {
                const status = getStatusBadge(a.statusLabel);
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
                      <div className="text-[11px] font-medium">
                        {a.clientName || "Без имени"}
                      </div>
                      {a.clientContact && (
                        <div className="text-[10px] text-gray-500">
                          {a.clientContact}
                        </div>
                      )}
                    </td>
                    <td className="px-2 py-2.align-top">
                      <div className="text-[11px]">
                        {a.petName || "Без имени"}
                        {a.petSpecies ? ` (${a.petSpecies})` : ""}
                      </div>
                    </td>
                    <td className="px-2 py-2.align-top">
                      <div className="text-[11px] font-medium">
                        {a.doctorName || "Врач"}
                      </div>
                      {a.requestedDoctorName && (
                        <div className="text-[10px] text-gray-500">
                          выбрал клиент: {a.requestedDoctorName}
                        </div>
                      )}
                    </td>
                    <td className="px-2 py-2.align-top text-[11px] text-gray-700">
                      {a.complaint || "—"}
                    </td>
                    <td className="px-2 py-2 text-center">
                      <span
                        className={
                          "inline-flex rounded-full px-2 py-0.5 text-[10px] " +
                          (a.hasDocuments
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-gray-100 text-gray-500")
                        }
                      >
                        {a.hasDocuments ? "есть" : "нет"}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-center">
                      <span
                        className={
                          "inline-flex rounded-full px-2 py-0.5 text-[10px] " +
                          (a.hasPayments
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-red-50 text-red-700")
                        }
                      >
                        {a.hasPayments ? "оплачено" : "нет"}
                      </span>
                    </td>
                    <td className="px-2 py-2 align-top">
                      <span className={status.className}>{status.label}</span>
                    </td>
                    <td className="px-2 py-2 align-top text-right">
                      <Link
                        href={`/backoffice/registrar/consultations/${a.id}`}
                        className="text-[11px] font-medium text-emerald-700 hover:underline"
                      >
                        Открыть →
                      </Link>
                    </td>
                  </tr>
                );
              })}

              {appointments.length === 0 && (
                <tr>
                  <td
                    col-span={9}
                    className="px-2 py-8 text-center text-xs text-gray-400"
                  >
                    Пока нет ни одной консультации.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
