"use client";

import { useMemo, useState } from "react";
import type { RegistrarAppointmentRow } from "@/lib/registrar";
import Link from "next/link";

interface Props {
  appointments: RegistrarAppointmentRow[];
}

export function RegistrarRecentConsultationsClient({ appointments }: Props) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [doctorFilter, setDoctorFilter] = useState<string>("all");

  const statuses = useMemo(
    () =>
      Array.from(
        new Set(
          appointments
            .map((a) => a.statusLabel || "")
            .filter((s) => s.trim().length > 0)
        )
      ),
    [appointments]
  );

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

  const filtered = useMemo(() => {
    return appointments.filter((a) => {
      if (
        statusFilter !== "all" &&
        a.statusLabel.toLowerCase() !== statusFilter.toLowerCase()
      ) {
        return false;
      }

      if (
        doctorFilter !== "all" &&
        (a.doctorName || "").toLowerCase() !== doctorFilter.toLowerCase()
      ) {
        return false;
      }

      return true;
    });
  }, [appointments, statusFilter, doctorFilter]);

  return (
    <>
      {/* Маленькая панель фильтров справа над таблицей */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="text-[11px] text-gray-500">
          Показаны последние {appointments.length} записей. После фильтрации:{" "}
          {filtered.length}.
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border px-2 py-1.5 text-xs"
          >
            <option value="all">Все статусы</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

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
        </div>
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
              <th className="px-2 py-2">Статус</th>
              <th className="px-2 py-2 text-right">Действия</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((a, index) => (
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
                  <div className="text-[11px]">
                    {a.doctorName || "Не назначен"}
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
                    Открыть
                  </Link>
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="px-2 py-8 text-center text-xs text-gray-400"
                >
                  Нет записей по текущему фильтру.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
