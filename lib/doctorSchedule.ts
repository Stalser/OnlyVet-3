// lib/doctorSchedule.ts

export type DoctorSlot = {
  id: string;
  doctorId: string;
  date: string; // "2025-11-14"
  time: string; // "10:00"
};

export const doctorSlots: DoctorSlot[] = [
  // Иванова
  { id: "s1", doctorId: "doc-ivanova", date: "2025-11-14", time: "10:00" },
  { id: "s2", doctorId: "doc-ivanova", date: "2025-11-14", time: "12:00" },
  { id: "s3", doctorId: "doc-ivanova", date: "2025-11-15", time: "09:30" },
  { id: "s4", doctorId: "doc-ivanova", date: "2025-11-15", time: "14:00" },

  // Петров
  { id: "s5", doctorId: "doc-petrov", date: "2025-11-14", time: "13:00" },
  { id: "s6", doctorId: "doc-petrov", date: "2025-11-15", time: "11:00" },

  // Сидорова
  { id: "s7", doctorId: "doc-sidorova", date: "2025-11-14", time: "16:00" },
];

export function getDoctorDates(doctorId: string): string[] {
  const set = new Set<string>();
  doctorSlots
    .filter((s) => s.doctorId === doctorId)
    .forEach((s) => set.add(s.date));
  return Array.from(set).sort();
}

export function getDoctorSlotsForDate(
  doctorId: string,
  date: string
): DoctorSlot[] {
  return doctorSlots
    .filter((s) => s.doctorId === doctorId && s.date === date)
    .sort((a, b) => (a.time < b.time ? -1 : 1));
}
