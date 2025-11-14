"use client";

import React from "react";

type AppointmentActionsProps = {
  appointmentId: string;
};

/**
 * Заглушка панели действий для приёма.
 * Сейчас просто показывает пару кнопок без сложной логики.
 */
export default function AppointmentActions({ appointmentId }: AppointmentActionsProps) {
  return (
    <div style={{ marginTop: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
      <button
        type="button"
        style={{
          padding: "6px 12px",
          borderRadius: 999,
          border: "1px solid #e5e7eb",
          background: "white",
          fontSize: 12,
          cursor: "pointer",
        }}
      >
        Открыть чат (#{appointmentId})
      </button>
      <button
        type="button"
        style={{
          padding: "6px 12px",
          borderRadius: 999,
          border: "1px solid #e5e7eb",
          background: "white",
          fontSize: 12,
          cursor: "pointer",
        }}
      >
        Завершить приём
      </button>
    </div>
  );
}
