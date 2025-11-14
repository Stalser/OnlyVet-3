// lib/appointments.ts

// Тип записи (общий для пользователя и врача)
export type AppointmentStatus = "запрошена" | "подтверждена" | "завершена" | "отменена";

export type Appointment = {
  id: string;
  userId: string;      // кто записался (потом будет совпадать с профилем)
  doctorId: string;    // врач
  doctorName: string;
  serviceCode: string;
  serviceName: string;
  date: string;        // YYYY-MM-DD
  time: string;        // HH:MM
  petName: string;
  species: string;
  status: AppointmentStatus;
};

// Временно: считаем, что текущий пользователь = user-1, а текущий врач = doc-ivanova
export const currentUserId = "user-1";
export const currentDoctorId = "doc-ivanova";

export const appointments: Appointment[] = [
  {
    id: "a1",
    userId: "user-1",
    doctorId: "doc-ivanova",
    doctorName: "Д-р Иванова Алина Сергеевна",
    serviceCode: "OC1",
    serviceName: "Первичная онлайн-консультация",
    date: "2025-11-15",
    time: "10:00",
    petName: "Мурзик",
    species: "кошка",
    status: "подтверждена",
  },
  {
    id: "a2",
    userId: "user-1",
    doctorId: "doc-petrov",
    doctorName: "Д-р Петров Сергей Владимирович",
    serviceCode: "SM1",
    serviceName: "Второе мнение по диагнозу",
    date: "2025-11-16",
    time: "13:30",
    petName: "Рич",
    species: "собака",
    status: "запрошена",
  },
  {
    id: "a3",
    userId: "user-2",
    doctorId: "doc-ivanova",
    doctorName: "Д-р Иванова Алина Сергеевна",
    serviceCode: "OC2",
    serviceName: "Повторная консультация",
    date: "2025-11-14",
    time: "18:00",
    petName: "Барсик",
    species: "кошка",
    status: "завершена",
  },
];
