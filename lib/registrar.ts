// lib/registrar.ts

import { appointments } from "./appointments";
import { doctors } from "./data";
import { servicesPricing } from "./pricing";
import { supabase } from "./supabaseClient";

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
 * Попытаться получить список приёмов из БД Supabase.
 * Если что-то не так — вернём null, и выше пойдём по мок-данным.
 */
async function getAppointmentsFromDb(): Promise<
  RegistrarAppointmentRow[] | null
> {
  try {
    if (!supabase) return null;

    const { data, error } = await supabase
      .from("appointments")
      .select(
        "id, date, time, client_name, client_contact, pet_name, pet_species, doctor_name, service_code, service_name, status, created_at"
      )
      .order("date", { ascending: true })
      .order("time", { ascending: true });

    if (error || !data || data.length === 0) {
      return null;
    }

    return data.map((row: any, index: number) => {
      const dateLabel =
        (row.date && row.time
          ? `${row.date} ${row.time}`
          : row.date || row.time) || "—";

      const createdLabel = row.created_at
        ? new Date(row.created_at).toLocaleString("ru-RU")
        : "";

      return {
        id: String(row.id ?? index),
        dateLabel,
        createdLabel,
        clientName: row.client_name ?? "Без имени",
        clientContact: row.client_contact ?? "",
        petName: row.pet_name ?? "",
        petSpecies: row.pet_species ?? "",
        doctorName: row.doctor_name ?? "Не назначен",
        serviceName: row.service_name ?? "Услуга",
        serviceCode: row.service_code ?? "",
        statusLabel: row.status ?? "неизвестно",
      };
    });
  } catch {
    return null;
  }
}

/**
 * Старый способ: собрать данные из моков lib/appointments.ts.
 * Останется как резерв на случай пустой БД.
 */
async function getAppointmentsFromMocks(): Promise<
  RegistrarAppointmentRow[]
> {
  return (appointments as any[]).map((a, index) => {
    const doctor =
      doctors.find((d: any) => d.id === a.doctorId) ?? null;

    const service =
      servicesPricing.find((s: any) => s.code === a.serviceCode) ?? null;

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
 * Публичная функция для кабинета регистратуры:
 * сначала пытаемся прочитать из БД, если там пусто — из моков.
 */
export async function getRegistrarAppointments(): Promise<
  RegistrarAppointmentRow[]
> {
  const fromDb = await getAppointmentsFromDb();
  if (fromDb && fromDb.length > 0) {
    return fromDb;
  }
  return getAppointmentsFromMocks();
}

/**
 * Получить одну консультацию по id (БД или моки — в зависимости от того,
 * что сейчас используется).
 */
export async function getRegistrarAppointmentById(
  id: string
): Promise<RegistrarAppointmentRow | null> {
  const all = await getRegistrarAppointments();
  const found = all.find((a) => a.id === id);
  return found ?? null;
}
