// components/registrar/RegistrarConsultationsClient.tsx
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

function getStatusBadge(status: string): StatusBadge {
  const s = (status || "").toLowerCase();

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

  // всё остальное считаем «нормальным» зелёным статусом
  return {
    label: status || "неизвестен",
    className:
      "inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700",
  };
}

/**
 * Полная таблица «Все консультации и заявки» для /backoffice/registrar/consultations.
 * Показывает: клиент, питомец, врач (и кого выбрал клиент), услуга (и исходный выбор),
 * жалобу, наличие документов, оплату и статус.
 */
export function RegistrarConsultationsClient({ appointments }: Props) {
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "closed">(
    "all"
  );
  const [doctorFilter, setDoctorFilter] = useState<string>("all");
  const [search, setSearch] = useState<string>("");

  const statusOptions: { key: "all" | "open" | "closed"; label: string }[] = [
    { key: "all", label: "Все статусы" },
    { key: "open", label: "Запрошена / в работе" },
    { key: "closed", label: "Завершена / отменена" },
  ];

  const doctorOptions = useMemo(
    () => [
      { key: "all", label: "Все врачи" },
      ...Array.from(
        new Map(
          appointments
            .map((a) => a.doctorName || "")
            .filter((name) => name.trim().length > 0)
            .map((name) => [name, name])
        ).entries()
      ).map(([value, label]) => ({ key: value, label })),
    ],
    [appointments]
  );

  const filtered = useMemo(() => {
    return appointments.filter((a) => {
      const s = a.statusLabel.toLowerCase();

      // фильтр по статусу (открытые / закрытые)
      if (statusFilter === "open") {
        if (s.includes("отмен") || s.includes("заверш")) return false;
      } else if (statusFilter === "closed") {
        if (!s.includes("отмен") && !s.includes("заверш")) return false;
      }

      // фильтр по врачу
      if (doctorFilter !== "all") {
        if (!a.doctorName || a.doctorName !== doctorFilter) return false;
      }

      // поисковая строка
      if (search.trim().length > 0) {
        const q = search.trim().toLowerCase();
        const haystack = [
          a.clientName,
          a.clientContact,
          a.petName,
          a.petSpecies,
          a.requestedPetName,
          a.requestedPetSpecies,
          a.doctorName,
          a.requestedDoctorName,
          a.serviceName,
          a.requestedServiceName,
          a.serviceCode,
          a.requestedServiceCode,
          a.complaint,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (!haystack.includes(q)) return false;
      }

      return true;
    });
  }, [appointments, statusFilter, doctorFilter, search]);

  return (
    <section className="rounded-2xl border bg-white p-4 space-y-4">
      {/* Заголовок + фильтры */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-base font-semibold">
            Все консультации и заявки
          </h2>
          <p className="text-[11px] text-gray-500">
            Всего записей: {appointments.length}. После фильтрации:{" "}
            {filtered.length}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по клиенту, питомцу, врачу, услуге, жалобе…"
            className="h-8 w-64 rounded-full border border-gray-300 bg-gray-50 px-3 text-[11px]"
          />

          <select
            className="h-8 rounded-full border border-gray-300 bg-gray-50 px-3 text-[11px]"
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as "all" | "open" | "closed")
            }
          >
            {statusOptions.map((opt) => (
              <option key={opt.key} value={opt.key}>
                {opt.label}
              </option>
            ))}
          </select>

          <select
            className="h-8 rounded-full border border-gray-300 bg-gray-50 px-3 text-[11px]"
            value={doctorFilter}
            onChange={(e) => setDoctorFilter(e.target.value)}
          >
            {doctorOptions.map((opt) => (
              <option key={opt.key} value={opt.key}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Таблица */}
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
              <th className="px-2 py-2 text-center">Документы</th>
              <th className="px-2 py-2 text-center">Оплата</th>
              <th className="px-2 py-2">Статус</th>
              <th className="px-2 py-2 text-right">Действия</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((a, index) => {
              const status = getStatusBadge(a.statusLabel);
              const hasDocs = a.hasDocuments === true;
              const isPaid = a.hasPayments === true;

              const petChanged =
                a.requestedPetName &&
                (a.requestedPetName !== a.petName ||
                  a.requestedPetSpecies !== a.petSpecies);

              const serviceChanged =
                a.requestedServiceName &&
                a.requestedServiceName !== a.serviceName;

              return (
                <tr
                  key={a.id}
                  className="border-b last:border-0 hover:bg-gray-50"
                >
                  {/* № */}
                  <td className="px-2 py-2 align-top text-[11px] text-gray-500">
                    {index + 1}
                  </td>

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

                  {/* Питомец + «выбрал клиент» */}
                  <td className="px-2 py-2 align-top">
                    <div className="text-[11px]">
                      {a.petName || "Без имени"}
                      {a.petSpecies ? ` (${a.petSpecies})` : ""}
                    </div>
                    {petChanged && (
                      <div className="mt-0.5 text-[10px] text-gray-500">
                        выбрал клиент: {a.requestedPetName}
                        {a.requestedPetSpecies
                          ? ` (${a.requestedPetSpecies})`
                          : ""}
                      </div>
                    )}
                  </td>

                  {/* Врач + «выбрал клиент» */}
                  <td className="px-2 py-2.align-top">
                    <div className="text-[11px] font-medium">
                      {a.doctorName || "Врач не назначен"}
                    </div>
                    {a.requestedDoctorName && (
                      <div className="mt-0.5 text-[10px] text-gray-500">
                        выбрал клиент: {a.requestedDoctorName}
                      </div>
                    )}
                  </td>

                  {/* Услуга + «выбрано клиентом» */}
                  <td className="px-2 py-2.align-top">
                    <div className="text-[11px]">{a.serviceName}</div>
                    {a.serviceCode && (
                      <div className="text-[10px] text-gray-500">
                        код: {a.serviceCode}
                      </div>
                    )}
                    {serviceChanged && (
                      <div className="mt-0.5 text-[10px] text-gray-500">
                        выбрано клиентом: {a.requestedServiceName}
                        {a.requestedServiceCode &&
                          ` (${a.requestedServiceCode})`}
                      </div>
                    )}
                  </td>

                  {/* Жалоба */}
                  <td className="px-2 py-2 align-top max-w-[220px]">
                    <div className="text-[11px] text-gray-700 whitespace-pre-line line-clamp-2">
                      {a.complaint && a.complaint.trim().length > 0
                        ? a.complaint
                        : "—"}
                    </div>
                  </td>

                  {/* Документы */}
                  <td className="px-2 py-2 align-top text-center">
                    <span
                      className={
                        "inline-flex rounded-full px-2 py-0.5 text-[10px] " +
                        (hasDocs
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-gray-100 text-gray-500")
                      }
                    >
                      {hasDocs ? "есть" : "нет"}
                    </span>
                  </td>

                  {/* Оплата */}
                  <td className="px-2 py-2 align-top text-center">
                    <span
                      className={
                        "inline-flex rounded-full px-2 py-0.5 text-[10px] " +
                        (isPaid
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-red-50 text-red-700")
                      }
                    >
                      {isPaid ? "оплачено" : "нет"}
                    </span>
                  </td>

                  {/* Статус */}
                  <td className="px-2 py-2 align-top">
                    <span className={status.className}>{status.label}</span>
                  </td>

                  {/* Действия */}
                  <td className="px-2 py-2.align-top text-right">
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

            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={11}
                  className="px-2 py-8 text-center text-xs text-gray-400"
                >
                  Нет записей, удовлетворяющих выбранным фильтрам.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
