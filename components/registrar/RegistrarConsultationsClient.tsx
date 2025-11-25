"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { RegistrarAppointmentRow } from "@/lib/registrar";

interface Props {
  appointments: RegistrarAppointmentRow[];
}

type StatusBadge = {
  label: string;
  className: string;
};

function statusBadgeClass(status: string): string {
  const s = (status || "").toLowerCase();

  if (s.includes("отмен")) return "bg-red-50 text-red-700";
  if (s.includes("запрош")) return "bg-amber-50 text-amber-700";
  if (s.includes("подтверж")) return "bg-blue-50 text-blue-700";
  if (s.includes("заверш")) return "bg-gray-100 text-gray-700";

  return "bg-emerald-50 text-emerald-700";
}

export function RegistrarConsultationsClient({ appointments }: Props) {
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
          a.requestedComplaint || "",
          a.cancellationReason || "",
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

  return (
    <section className="rounded-2xl border bg-white p-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">
            Все консультации и заявки
          </h2>
          <p className="text-xs text-gray-500">
            Всего записей: {appointments.length}. После фильтрации:{" "}
            {filtered.length}.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
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
            {filtered.map((a, index) => {
              const hasDocs = a.hasDocuments === true;
              const isPaid = a.hasPayments === true;

              const complaint = (a.complaint ?? "").trim();
              const requestedComplaint =
                (a.requestedComplaint ?? "").trim();

              // показываем исходный текст клиента, если он есть
              const showRequestedComplaint =
                requestedComplaint.length > 0;

              return (
                <tr
                  key={a.id}
                  className="border-b last:border-0 hover:bg-gray-50"
                >
                  <td className="px-2 py-2 align-top">{index + 1}</td>

                  {/* Дата / время */}
                  <td className="px-2 py-2 align-top text-[11px] text-gray-700">
                    <div>{a.dateLabel}</div>
                    {a.createdLabel && (
                      <div className="text-[10px] text-gray-400">
                        создано: {a.createdLabel}
                      </div>
                    )}
                  </td>

                  {/* Клиент */}
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

                  {/* Питомец: утверждённый регистратурой + выбор клиента */}
<td className="px-2 py-2 align-top">

  {/* Утверждённые поля */}
  <div className="text-[11px]">
    {a.petName || "—"}
  </div>
  {a.petSpecies && (
    <div className="text-[10px] text-gray-500">
      {a.petSpecies}
    </div>
  )}

  {/* Подсказка, что регистратор ещё не трогал */}
  {a.statusLabel.toLowerCase().includes("запрош") && !a.petName && (
    <div className="mt-0.5 text-[10px] text-gray-400">
      ещё не подтверждено регистратурой
    </div>
  )}

  {/* Исходный выбор клиента */}
  {(a.requestedPetName || a.requestedPetSpecies) && (
    <div className="mt-0.5 text-[10px] text-gray-400">
      выбрал клиент: {a.requestedPetName || a.requestedPetSpecies}
    </div>
  )}
</td>

                  {/* Врач: текущий + «выбрал клиент» */}
                  <td className="px-2 py-2 align-top">
                    <div className="text-[11px]">
                      {a.doctorName || "Не назначен"}
                    </div>
                    {a.requestedDoctorName && (
                      <div className="mt-0.5 text-[10px] text-gray-400">
                        выбрал клиент: {a.requestedDoctorName}
                      </div>
                    )}
                  </td>

                  {/* Услуга: текущая + «выбрал клиент» */}
<td className="px-2 py-2.align-top">
  <div className="text-[11px]">
    {a.serviceName || "—"}
  </div>
  {a.serviceCode && (
    <div className="text-[10px] text-gray-500">
      {a.serviceCode}
    </div>
  )}
  {a.requestedServiceName && (
    <div className="mt-0.5 text-[10px] text-gray-400">
      выбрал клиент: {a.requestedServiceName}
    </div>
  )}
</td>

                  {/* Жалоба */}
                  <td className="px-2 py-2 align-top max-w-[220px]">
                    <div className="text-[11px] text-gray-700 whitespace-pre-line line-clamp-2">
                      {complaint.length > 0 ? complaint : "—"}
                    </div>
                    {showRequestedComplaint && (
                      <div className="mt-0.5 text-[10px] text-gray-400 whitespace-pre-line line-clamp-2">
                        писал клиент: {requestedComplaint}
                      </div>
                    )}
                  </td>

                  {/* Документы */}
                  <td className="px-2 py-2 align-top">
                    <span
                      className={
                        "inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium " +
                        (hasDocs
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-gray-100 text-gray-600")
                      }
                    >
                      {hasDocs ? "да" : "нет"}
                    </span>
                  </td>

                  {/* Оплата */}
                  <td className="px-2 py-2 align-top">
                    <span
                      className={
                        "inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium " +
                        (isPaid
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-gray-100 text-gray-600")
                      }
                    >
                      {isPaid ? "да" : "нет"}
                    </span>
                  </td>

                  {/* Статус + причина отмены */}
                  <td className="px-2 py-2 align-top">
                    <span
                      className={
                        "inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium " +
                        statusBadgeClass(a.statusLabel || "")
                      }
                    >
                      {a.statusLabel}
                    </span>
                    {a.statusLabel
                      .toLowerCase()
                      .includes("отмен") &&
                      a.cancellationReason && (
                        <div className="mt-0.5 text-[10px] text-gray-400 max-w-[220px] whitespace-pre-line">
                          причина: {a.cancellationReason}
                        </div>
                      )}
                  </td>

                  {/* Действия */}
                  <td className="px-2 py-2 align-top text-right">
                    <Link
                      href={`/backoffice/registrar/consultations/${a.id}`}
                      className="text-[11px] font-medium text-emerald-700 hover:underline"
                    >
                      Открыть
                    </Link>
                  </td>
                </tr>
              );
            })}

            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={11}
                  className="px-2 py-8 text-center text-xs text-gray-400"
                >
                  Нет записей, удовлетворяющих фильтру.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
