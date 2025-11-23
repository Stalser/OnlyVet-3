"use client";

import Link from "next/link";
import type { RegistrarAppointmentRow } from "@/lib/registrar";

interface Props {
  appointments: RegistrarAppointmentRow[];
}

export function RegistrarRecentConsultationsClient({ appointments }: Props) {
  const limited = appointments.slice(0, 7); // последние 7 записей

  return (
    <section className="rounded-2xl border bg-white p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">
            Последние консультации и заявки
          </h2>
          <p className="text-[11px] text-gray-500">
            Показаны последние {limited.length} записей. Полный список доступен
            в разделе &laquo;Все консультации и заявки&raquo;.
          </p>
        </div>
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
            {limited.map((a, index) => (
              <tr
                key={a.id}
                className="border-b last:border-0 hover:bg-gray-50"
              >
                <td className="px-2 py-2 align-top text-[11px] text-gray-500">
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
                  <div className="text-[11px]">{a.clientName}</div>
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
                <td className="px-2 py-2 align-top text-[11px] text-gray-700">
                  {a.doctorName || "Не назначен"}
                </td>
                <td className="px-2 py-2 align-top">
                  <div className="text-[11px]">{a.serviceName}</div>
                  {a.serviceCode && (
                    <div className="text-[10px] text-gray-500">
                      {a.serviceCode}
                    </div>
                  )}
                </td>
                <td className="px-2 py-2 align-top max-w-[180px]">
                  <div className="text-[11px] text-gray-700 truncate">
                    {a.complaint && a.complaint.trim().length > 0
                      ? a.complaint
                      : "—"}
                  </div>
                </td>
                <td className="px-2 py-2 align-top text-[11px] text-emerald-700">
                  {a.statusLabel}
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

            {limited.length === 0 && (
              <tr>
                <td
                  colSpan={9}
                  className="px-2 py-8 text-center text-xs text-gray-400"
                >
                  Пока нет ни одной онлайн-заявки.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
