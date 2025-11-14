export type Appointment = {
  id: string;
  userId: string;
  doctorId: string;
  doctorName: string;
  serviceName: string;
  petName: string;
  species: string;
  date: string;
  time: string;
  status: "запрошена" | "подтверждена" | "завершена";
};

export const currentUserId = "user-1";

// временные данные
export const appointments: Appointment[] = [
  {
    id: "a1",
    userId: "user-1",
    doctorId: "ivanova",
    doctorName: "Иванова Е. А.",
    serviceName: "Первичная консультация",
    petName: "Мурзик",
    species: "кошка",
    date: "2025-11-15",
    time: "10:00",
    status: "завершена",
  },
  {
    id: "a2",
    userId: "user-1",
    doctorId: "petrov",
    doctorName: "Петров Д. С.",
    serviceName: "Вторичное обращение",
    petName: "Рич",
    species: "собака",
    date: "2025-11-14",
    time: "14:00",
    status: "подтверждена",
  },
];
