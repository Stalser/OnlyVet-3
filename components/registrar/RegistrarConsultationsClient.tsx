"use client";

import Link from "next/link";
import type { RegistrarAppointmentRow } from "@/lib/registrar";

type Props = {
  appointments: RegistrarAppointmentRow[];
};

function getDoctorLabel(a: RegistrarAppointmentRow): string {
  // 1. Назначенный врач (из doctor_id)
  if (a.doctorName && a.doctorName !== "Не назначен") {
    return a.doctorName;
  }

  // 2. Запрошенный врач при записи (requestedDoctorName)
  if (a.requestedDoctorName) {
    return a.requestedDoctorName;
  }

  // 3. Никто не выбран → любой врач
  return "Любой врач";
}

export function RegistrarRecentConsultationsClient({ appointments }: Props) {
  // Берём несколько последних записей (например, 6)
  const recent = appointments.slice(0, 6);

  return (
    <section className="rounded-2xl border bg-white p-4 space-y-3">
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
              <th className="px-2 py-2">№</th>
              <th className="px-2 py-2">Дата / время</th>
              <th className="px-2 py-2">Клиент</th>
              <th className="px-2 py-2">Питомец</th>
              <th className="px-2 py-2">Врач</th>
              <th className="px-2 py-2">Услуга</th>
              <th className="px-2 py-2">Жалоба</th>
              <th className="px-2 py-2">Статус</th>
              <th className="px-2 py-2 text-right">Действия</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((a, index) => (
              <tr
                key={a.id}
                className="border-b last:border-0 hover:bg-gray-50"
              >
                <td className="px-2 py-2 align-top">
                  {index + 1}
                </td>
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
                    {a.clientName}
                  </div>
                  {a.clientContact && (
                    <div className="text-[10px] text-gray-500">
                      {a.clientContact}
                    </div>
                  )}
                </td>
                <td className="px-2 py-2 align-top">
                  <div className="text-[11px]">
                    {a.petName || "—"}
                  </div>
                  {a.petSpecies && (
                    <div className="text-[10px] text-gray-500">
                      {a.petSpecies}
                    </div>
                  )}
                </td>
                <td className="px-2 py-2 align-top">
                  <div className="text-[11px] text-gray-800">
                    {getDoctorLabel(a)}
                  </div>
                </td>
                <td className="px-2 py-2 align-top">
                  <div className="text-[11px]">{a.serviceName}</div>
                  {a.serviceCode && (
                    <div className="text-[10px] text-gray-500">
                      {a.serviceCode}
                    </div>
                  )}
                </td>
                <td className="px-2 py-2 align-top max-w-xs">
                  {a.complaint ? (
                    <div className="text-[11px] text-gray-800 line-clamp-2">
                      {a.complaint}
                    </div>
                  ) : (
                    <span className="text-[10px] text-gray-400">—</span>
                  )}
                </td>
                <td className="px-2 py-2 align-top">
                  <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                    {a.statusLabel}
                  </span>
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
            ))}

            {recent.length === 0 && (
              <tr>
                <td
                  colSpan={9}
                  className="px-2 py-8 text-center text-xs text-gray-400"
                >
                  Пока нет консультаций для отображения.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
