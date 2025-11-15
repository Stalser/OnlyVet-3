// lib/registrar.ts

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
  doctorId?: string;
  doctorName?: string;
  serviceName: string;
  serviceCode?: string;
  statusLabel: string;
};

/**
 * Берём список приёмов из БД Supabase (public.appointments)
 * и приводим к формату, удобному для регистратуры.
 */
async function getAppointmentsFromDb(
  limit?: number
): Promise<RegistrarAppointmentRow[]> {
  if (!supabase) return [];

  let query = supabase
    .from("appointments")
    .select(
      "id, starts_at, created_at, owner_id, status, pet_name, species, service_code, doctor_id, contact_info"
    )
    .order("starts_at", { ascending: false });

  if (typeof limit === "number") {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error || !data) {
    return [];
  }

  return data.map((row: any, index: number) => {
    // Дата/время
    let dateLabel = "—";
    if (row.starts_at) {
      const d = new Date(row.starts_at);
      dateLabel = d.toLocaleString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    const createdLabel = row.created_at
      ? new Date(row.created_at).toLocaleString("ru-RU")
      : "";

    // Врач
    const doc = doctors.find((d: any) => d.id === row.doctor_id);
    const doctorName = doc?.name ?? "Не назначен";

    // Услуга
    const service = servicesPricing.find(
      (s: any) => s.code === row.service_code
    );
    const serviceName = service?.name ?? "Услуга";

    // Клиента пока не тащим из owner_profiles — позже добавим,
    // сейчас хотя бы есть контакт
    const clientName = "Без имени";

    return {
      id: String(row.id ?? index),
      dateLabel,
      createdLabel,
      clientName,
      clientContact: row.contact_info ?? "",
      petName: row.pet_name ?? "",
      petSpecies: row.species ?? "",
      doctorId: row.doctor_id ?? undefined,
      doctorName,
      serviceName,
      serviceCode: row.service_code ?? "",
      statusLabel: row.status ?? "неизвестно",
    };
  });
}

/** Все консультации (для страницы "Все консультации и заявки"). */
export async function getRegistrarAppointments(): Promise<
  RegistrarAppointmentRow[]
> {
  return getAppointmentsFromDb();
}

/** Последние N консультаций (для дашборда регистратуры). */
export async function getRecentRegistrarAppointments(
  limit = 10
): Promise<RegistrarAppointmentRow[]> {
  return getAppointmentsFromDb(limit);
}

/** Одна консультация по id. */
export async function getRegistrarAppointmentById(
  id: string
): Promise<RegistrarAppointmentRow | null> {
  const all = await getRegistrarAppointments();
  const found = all.find((a) => a.id === id);
  return found ?? null;
}
