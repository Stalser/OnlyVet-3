// components/registrar/RegistrarRecentConsultationsClient.tsx
"use client";

import Link from "next/link";
import type { RegistrarAppointmentRow } from "@/lib/registrar";

/**
 * Мини-таблица «Последние консультации и заявки» на /backoffice/registrar
 * Берёт список приёмов (RegistrarAppointmentRow[]) и показывает последние N штук.
 */

type Props = {
  appointments: RegistrarAppointmentRow[];
};

const MAX_ROWS = 7;

function getStatusBadge(status: string) {
  const s = status.toLowerCase();

  if (s.includes("запрош")) {
    return {
      label: status,
      className:
        "inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700",
    };
  }
  if (s.includes("подтверж")) {
    return {
      label: status,
      className:
        "inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700",
    };
  }
  if (s.includes("отмен")) {
    return {
      label: status,
      className:
        "inline-flex rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700",
    };
  }
  if (s.includes("заверш")) {
    return {
      label: status,
      className:
        "inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-700",
    };
  }

  return {
    label: status || "неизвестен",
    className:
      "inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700",
  };
}

function PaymentBadge({ hasPayment }: { hasPayment: boolean }) {
  return (
    <span
      className={
        hasPayment
          ? "inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700"
          : "inline-flex rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700"
      }
    >
      {hasPayment ? "да" : "нет"}
    </span>
  );
}

export function RegistrarRecentConsultationsClient({ appointments }: Props) {
  // Берём последние MAX_ROWS по дате начала приёма
  const rows = [...appointments]
    .sort((a, b) => {
      const da = a.startsAt ? new Date(a.startsAt).getTime() : 0;
      const db = b.startsAt ? new Date(b.startsAt).getTime() : 0;
      return db - da;
    })
    .slice(0, MAX_ROWS);

  return (
    <section className="rounded-2xl border bg-white p-4 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">
            Последние консультации и заявки
          </h2>
          <p className="text-[11px] text-gray-500">
            Показаны последние {rows.length} записей. Полный список — в разделе{" "}
            «Консультации и заявки».
          </p>
        </div>
        <Link
          href="/backoffice/registrar/consultations"
          className="text-xs font-medium text-emerald-700 hover:underline"
        >
          Все консультации и заявки →
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="text-xs text-gray-400">
          Пока нет ни одной консультации. Как только появятся новые заявки — они
          отобразятся здесь.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-[11px] uppercase text-gray-500">
                <th className="px-2 py-2">Дата / время</th>
                <th className="px-2 py-2">Клиент</th>
                <th className="px-2 py-2">Питомец</th>
                <th className="px-2 py-2">Врач</th>
                <th className="px-2 py-2">Услуга</th>
                <th className="px-2 py-2 text-center">Оплата</th>
                <th className="px-2 py-2 text-right">Статус</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => {
                const badge = getStatusBadge(a.statusLabel);

                return (
                  <tr
                    key={a.id}
                    className="border-b last:border-0 hover:bg-gray-50"
                  >
                    {/* Дата / время + подпись «создано» */}
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

                    {/* Питомец */}
                    <td className="px-2 py-2 align-top">
                      <div className="text-[11px]">
                        {a.petName || "Не указан"}
                      </div>
                      {a.petSpecies && (
                        <div className="text-[10px] text-gray-500">
                          {a.petSpecies}
                        </div>
                      )}
                    </td>

                    {/* Врач + «выбрал клиент» */}
                    <td className="px-2 py-2 align-top">
                      <div className="text-[11px] text-gray-800">
                        {a.doctorName || "Не назначен"}
                      </div>
                      {a.requestedDoctorName && (
                        <div className="text-[10px] text-gray-500">
                          выбрал клиент: {a.requestedDoctorName}
                        </div>
                      )}
                    </td>

                    {/* Услуга */}
                    <td className="px-2 py-2 align-top">
                      <div className="text-[11px]">{a.serviceName}</div>
                      {a.serviceCode && (
                        <div className="text-[10px] text-gray-500">
                          {a.serviceCode}
                        </div>
                      )}
                    </td>

                    {/* Оплата */}
                    <td className="px-2 py-2 align-top text-center">
                      <PaymentBadge hasPayment={!!a.hasPayments} />
                    </td>

                    {/* Статус */}
                    <td className="px-2 py-2 align-top text-right">
                      <span className={badge.className}>{badge.label}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
