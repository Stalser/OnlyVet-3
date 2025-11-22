// components/staff/StaffAppointmentsList.tsx
"use client";

import Link from "next/link";
import type { RegistrarAppointmentRow } from "@/lib/registrar";

type Props = {
  appointments: RegistrarAppointmentRow[];
  title?: string;
  showCreatedLabel?: boolean;
};

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

export function StaffAppointmentsList({
  appointments,
  title = "Предстоящие консультации",
  showCreatedLabel = true,
}: Props) {
  if (appointments.length === 0) {
    return (
      <section className="rounded-2xl border bg-white p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold">{title}</h2>
        </div>
        <p className="text-xs text-gray-400">
          Предстоящих консультаций нет.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border bg-white p-4 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold">{title}</h2>
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
            {appointments.map((a) => {
              const badge = getStatusBadge(a.statusLabel);

              return (
                <tr
                  key={a.id}
                  className="border-b last:border-0 hover:bg-gray-50"
                >
                  <td className="px-2 py-2 align-top text-[11px] text-gray-700">
                    <div>{a.dateLabel}</div>
                    {showCreatedLabel && a.createdLabel && (
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

                  <td className="px-2 py-2.align-top">
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
          </tbody>
        </table>
      </div>
    </section>
  );
}
