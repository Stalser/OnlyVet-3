// lib/pricing.ts
// Единый источник данных по услугам и ценам OnlyVet.

export type PriceItem = {
  id: string;        // внутренний ID (совпадает с кодом услуги)
  code: string;      // код услуги
  section: string;   // раздел (категория)
  name: string;      // название услуги
  description: string;
  priceRUB?: number; // цена в рублях
  duration?: string;
  note?: string;
};

export const servicesPricing: PriceItem[] = [
  {
    id: "OC1",
    code: "OC1",
    section: "Онлайн-консультации",
    name: "Первичная онлайн-консультация",
    description: "Разбор ситуации, сбор анамнеза, первичный план действий.",
    priceRUB: 1500,
    duration: "30 мин",
  },
  {
    id: "OC2",
    code: "OC2",
    section: "Онлайн-консультации",
    name: "Повторная консультация",
    description: "С тем же врачом по текущему случаю.",
    priceRUB: 1200,
    duration: "20 мин",
  },
  {
    id: "OC3",
    code: "OC3",
    section: "Онлайн-консультации",
    name: "Разбор анализов",
    description: "Интерпретация загруженных результатов анализов.",
    priceRUB: 1000,
    duration: "20–30 мин",
  },
  {
    id: "SM1",
    code: "SM1",
    section: "Второе мнение",
    name: "Второе мнение по диагнозу",
    description: "Анализ истории и заключений других специалистов.",
    priceRUB: 2000,
    duration: "30–40 мин",
  },
];

// Привязка услуг к конкретным врачам по id (см. lib/data.ts).
export const doctorServicesMap: Record<string, string[]> = {
  "doc-ivanova": ["OC1", "OC2", "OC3"],
  "doc-kuznetsov": ["OC1", "OC2"],
  "doc-пetrov": ["SM1"],
  "doc-sidorova": ["OC1", "OC3"],
};

export function getDoctorPricing(doctorId: string): PriceItem[] {
  const codes = doctorServicesMap[doctorId];
  if (!codes) return servicesPricing;
  return servicesPricing.filter((s) => codes.includes(s.code));
}
