// lib/medicalDocs.ts
export const medicalDocuments = mockMedicalDocs;
export type MedicalDocument = {
  id: string;
  appointmentId: string;
  petName: string;
  title: string;
  type: "analysis" | "conclusion" | "prescription" | "other";
  createdAt: string;
  url: string;
};

//
// ❗️ Временная фейковая база, чтобы сборка проходила.
// Позже заменим на Supabase.
//
export const mockMedicalDocs: MedicalDocument[] = [
  {
    id: "doc1",
    appointmentId: "a1",
    petName: "Мурзик",
    title: "Заключение врача",
    type: "conclusion",
    createdAt: "2025-11-14T10:20:00",
    url: "/docs/example.pdf",
  },
  {
    id: "doc2",
    appointmentId: "a1",
    petName: "Мурзик",
    title: "Анализы крови",
    type: "analysis",
    createdAt: "2025-11-14T10:40:00",
    url: "/docs/example.pdf",
  },
];

export function getDocsByAppointment(appointmentId: string) {
  return mockMedicalDocs.filter((d) => d.appointmentId === appointmentId);
}

export function getDocsByPet(petName: string) {
  return mockMedicalDocs.filter((d) => d.petName === petName);
}

export function getAllDocs() {
  return mockMedicalDocs;
}
