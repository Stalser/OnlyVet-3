"use client";

import React from "react";
import type { Appointment } from "@/lib/doctor";

type WeeklyGridProps = {
  appointments?: Appointment[];
};

/**
 * Простейшая сетка расписания врача.
 */
export default function WeeklyGrid({ appointments = [] }: WeeklyGridProps) {
  if (!appointments.length) {
    return <p>Пока нет запланированных приёмов.</p>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {appointments.map((a) => (
        <div
          key={a.id}
          style={{
            padding: 8,
            borderRadius: 8,
            border: "1px solid #e5e7eb",
            background: "white",
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 500 }}>Приём #{a.id}</div>
          <div style={{ fontSize: 12, color: "#6b7280" }}>
            {a.comment || "Без комментария"}
          </div>
          <div style={{ fontSize: 12, color: "#6b7280" }}>
            {a.startsAt} — {a.endsAt}
          </div>
        </div>
      ))}
    </div>
  );
}
