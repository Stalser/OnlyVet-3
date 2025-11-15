// lib/registrar.ts

import { appointments } from "./appointments";
import { doctors } from "./data";
import { servicesPricing } from "./pricing";

export type RegistrarAppointmentRow = {
  id: string;
  dateLabel: string;
  createdLabel: string;
  clientName: string;
  clientContact?: string;
  petName?: string;
  petSpecies?: string;
  doctorName?: string;
  serviceName: string;
  serviceCode?: string;
  statusLabel: string;
};

/**
 * Временная функция: берём мок-данные из lib/appointments.ts
 * и приводим их к формату, удобному для регистратуры.
 * Позже здесь будет запрос в реальную БД.
 */
export async function getRegistrarAppointments(): Promise<
  RegistrarAppointmentRow[]
> {
  // appointments сейчас — моковый массив. Не заморачиваем TS-типами.
  return (appointments as any[]).map((a, index) => {
    const doctor =
      doctors.find((d: any) => d.id === a.doctorId) ?? null;

    const service =
      servicesPricing.find((s: any) => s.code === a.serviceCode) ?? null;

    // Пытаемся собрать удобный вид даты/времени
    const dateLabel =
      a.dateLabel ||
      (a.date && a.time
        ? `${a.date} ${a.time}`
        : a.date || a.time || "—");

    const createdLabel =
      a.createdLabel || a.createdAt || a.created_at || "";

    return {
      id: String(a.id ?? index),
      dateLabel,
      createdLabel,
      clientName: a.clientName ?? "Без имени",
      clientContact: a.clientContact ?? "",
      petName: a.petName ?? "",
      petSpecies: a.petSpecies ?? "",
      doctorName: doctor?.name ?? a.doctorName ?? "Не назначен",
      serviceName: service?.name ?? a.serviceName ?? "Услуга",
      serviceCode: service?.code ?? a.serviceCode ?? "",
      statusLabel: a.statusLabel ?? a.status ?? "неизвестно",
    };
  });
}

/**
 * Получить одну консультацию по id для карточки регистратуры.
 * Пока ищем среди мок-данных.
 */
export async function getRegistrarAppointmentById(
  id: string
): Promise<RegistrarAppointmentRow | null> {
  const all = await getRegistrarAppointments();
  const found = all.find((a) => a.id === id);
  return found ?? null;
}
