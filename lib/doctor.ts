// lib/doctor.ts
// Простейший мок для приёмов, чтобы страницы /doctor/appointment работали.

export type Patient = {
  id: string;
  name: string;
  species: string;
  age: string;
};

export type Appointment = {
  id: string;
  patientId: string;
  startsAt: string;
  endsAt: string;
  comment?: string;
};

export const patients: Patient[] = [
  { id: "p1", name: "Мурзик", species: "кошка", age: "3 года" },
  { id: "p2", name: "Бобик", species: "собака", age: "5 лет" },
];

export const appointments: Appointment[] = [
  {
    id: "a1",
    patientId: "p1",
    startsAt: new Date().toISOString(),
    endsAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    comment: "Тестовая запись для OnlyVet",
  },
  {
    id: "a2",
    patientId: "p2",
    startsAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    endsAt: new Date(Date.now() + 90 * 60 * 1000).toISOString(),
    comment: "Вторая тестовая запись",
  },
];

export async function getDoctorAppointments(_doctorId: string): Promise<Appointment[]> {
  return appointments;
}

export async function getDoctorAppointmentById(id: string): Promise<Appointment | null> {
  return appointments.find((a) => a.id === id) ?? null;
}
