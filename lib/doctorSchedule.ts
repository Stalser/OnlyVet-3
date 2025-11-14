// lib/doctorSchedule.ts

export type DoctorSlot = {
  doctorId: string;
  date: string;     // YYYY-MM-DD
  times: string[];  // ["10:00", "11:30"]
};

// временное расписание, позже заменим на Supabase
export const doctorSchedule: DoctorSlot[] = [
  {
    doctorId: "ivanova",
    date: "2025-11-15",
    times: ["10:00", "10:30", "11:00", "12:00"],
  },
  {
    doctorId: "petrov",
    date: "2025-11-15",
    times: ["13:00", "13:30", "14:00", "14:30"],
  },
];

export function getSchedule(doctorId: string, date: string) {
  return doctorSchedule.find(
    (slot) => slot.doctorId === doctorId && slot.date === date
  )?.times ?? [];
}
