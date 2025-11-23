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
  const [search, setSearch] = useState<string>("");

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

      if (search.trim().length > 0) {
        const q = search.trim().toLowerCase();
        const haystack = [
          a.clientName,
          a.clientContact || "",
          a.petName || "",
          a.petSpecies || "",
          a.doctorName || "",
          a.requestedDoctorName || "",
          a.serviceName || "",
          a.serviceCode || "",
          a.complaint || "",
        ]
          .join(" ")
          .toLowerCase();

        if (!haystack.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [appointments, statusFilter, doctorFilter, search]);

  // Показать только последние 10 записей после фильтрации
  const recent = useMemo(() => filtered.slice(0, 10), [filtered]);

  const docBadge = (hasDocuments?: boolean) =>
    hasDocuments
      ? "inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700"
      : "inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500";

  const payBadge = (hasPayments?: boolean) =>
    hasPayments
      ? "inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700"
      : "inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500";

  return (
    <>
      {/* Панель фильтров над таблицей */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="text-[11px] text-gray-500">
          Показаны последние {recent.length} записей (из {filtered.length} по
          фильтру, всего в системе: {appointments.length}).
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по клиенту, питомцу, врачу, услуге, жалобе…"
            className="w-60 rounded-xl border px-2 py-1.5 text-xs"
          />
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
              <th className="px-2 py-2 max-w-[220px]">Жалоба</th>
              <th className="px-2 py-2">Документы</th>
              <th className="px-2 py-2">Оплата</th>
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
                <td className="px-2 py-2 align-top">{index + 1}</td>

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

                {/* Врач: фактический + выбранный клиентом */}
                <td className="px-2 py-2 align-top">
                  <div className="text-[11px]">
                    {a.doctorName || "Не назначен"}
                  </div>
                  {a.requestedDoctorName && (
                    <div className="text-[10px] text-gray-500">
                      выбрал клиент: {a.requestedDoctorName}
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

                {/* Жалоба — только первые строки, остальное видно в карточке */}
                <td className="px-2 py-2 align-top max-w-[220px]">
                  <div className="text-[11px] text-gray-700 whitespace-pre-line line-clamp-2">
                    {a.complaint && a.complaint.trim().length > 0
                      ? a.complaint
                      : "—"}
                  </div>
                </td>

                {/* Документы */}
                <td className="px-2 py-2 align-top">
                  <span className={docBadge(a.hasDocuments)}>
                    {a.hasDocuments ? "есть" : "нет"}
                  </span>
                </td>

                {/* Оплата */}
                <td className="px-2 py-2 align-top">
                  <span className={payBadge(a.hasPayments)}>
                    {a.hasPayments ? "оплачено" : "не оплачено"}
                  </span>
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

            {recent.length === 0 && (
              <tr>
                <td
                  colSpan={11}
                  className="px-2 py-8 text-center text-xs text-gray-400"
                >
                  Консультаций и заявок ещё нет.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
