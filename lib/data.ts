// lib/data.ts
// Врачи OnlyVet — адаптировано из старой версии под новый тип Doctor.

export type Doctor = {
  id: string;
  name: string;
  speciality: string;
  bio?: string;
  rating?: number;
  avatar?: string;      // аватар врача
  experience?: string;  // стаж (строкой, например "6 лет")
  email?: string;
};

type LegacyDoctor = {
  id: string;
  name: string;
  email?: string;
  specialty?: string;
  experience?: number;
  photo?: string;
  bio?: string;
};

// Вставьте сюда реальных докторов позже при необходимости.
// Сейчас — адаптированный список из старого сайта.
const legacyDoctors: LegacyDoctor[] = [
  {
    id: "doc-ivanova",
    name: "Д-р Иванова Алина Сергеевна",
    email: "ivanova@example.com",
    specialty: "Терапевт",
    experience: 6,
    photo: "/images/doctors/ivanova.jpg",
    bio: "Ветеринарный врач-терапевт. Опыт работы более 6 лет.",
  },
  {
    id: "doc-kuznetsov",
    name: "Д-р Кузнецов Дмитрий Олегович",
    email: "kuznetsov@example.com",
    specialty: "Терапевт",
    experience: 8,
    photo: "/images/doctors/kuznetsov.jpg",
    bio: "Специализируется на сложных внутренних болезнях и длительном ведении пациентов.",
  },
  {
    id: "doc-petrov",
    name: "Д-р Петров Сергей Владимирович",
    email: "petrov@example.com",
    specialty: "Кардиолог",
    experience: 7,
    photo: "/images/doctors/petrov.jpg",
    bio: "Ветеринарный кардиолог. Консультирует по ЭХО-КГ и сложным сердечным случаям.",
  },
  {
    id: "doc-sidorova",
    name: "Д-р Сидорова Мария Николаевна",
    email: "sidorova@example.com",
    specialty: "Дерматолог",
    experience: 5,
    photo: "/images/doctors/sidorova.jpg",
    bio: "Врач-дерматолог. Работает с хроническими кожными болезнями и отитами.",
  },
];

export const doctors: Doctor[] = legacyDoctors.map((d) => ({
  id: d.id,
  name: d.name,
  email: d.email,
  speciality: d.specialty || "",
  bio: d.bio,
  rating: 4.9,
  avatar: d.photo || "/avatar.png",
  experience: d.experience ? `${d.experience} лет` : undefined,
}));

export function getDoctorById(id: string): Doctor | undefined {
  return doctors.find((d) => d.id === id);
}
