// Данные документов пользователя

export type MedicalDocument = {
  id: string;
  appointmentId: string;
  petName: string;
  title: string;
  type: "analysis" | "conclusion" | "contract" | "other";
  createdAt: string;
};

export const mockMedicalDocs: MedicalDocument[] = [
  {
    id: "doc1",
    appointmentId: "a1",
    petName: "Мурзик",
    title: "Заключение врача",
    type: "conclusion",
    createdAt: "2025-11-15T10:20:00"
  },
  {
    id: "doc2",
    appointmentId: "a1",
    petName: "Мурзик",
    title: "Общий анализ крови",
    type: "analysis",
    createdAt: "2025-11-15T10:40:00"
  }
];
