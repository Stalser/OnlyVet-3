// lib/registrar.ts

import { doctors } from "./data";
import { servicesPricing } from "./pricing";
import { supabase } from "./supabaseClient";

export type RegistrarAppointmentRow = {
  id: string;
  dateLabel: string;
  createdLabel: string;
  startsAt?: string | null;
  clientName: string;
  clientContact?: string;
  petName?: string;
  petSpecies?: string;
  doctorId?: string;
  doctorName?: string;
  serviceName: string;
  serviceCode?: string;
  statusLabel: string;
  videoPlatform?: string | null;
  videoUrl?: string | null;
};

/**
 * Берём список приёмов из БД Supabase (public.appointments)
 * и приводим к формату, удобному для регистратуры/врача.
 */
async function getAppointmentsFromDb(
  limit?: number
): Promise<RegistrarAppointmentRow[]> {
  if (!supabase) return [];

  let query = supabase
    .from("appointments")
    .select(
      "id, starts_at, created_at, owner_id, status, pet_name, species, service_code, doctor_id, contact_info, video_platform, video_url"
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
    const startsAt: string | null = row.starts_at ?? null;

    // Дата/время красиво
    let dateLabel = "—";
    if (startsAt) {
      const d = new Date(startsAt);
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

    const doc = doctors.find((d: any) => d.id === row.doctor_id);
    const doctorName = doc?.name ?? "Не назначен";

    const service = servicesPricing.find(
      (s: any) => s.code === row.service_code
    );
    const serviceName = service?.name ?? "Услуга";

    const clientName = "Без имени";

    return {
      id: String(row.id ?? index),
      dateLabel,
      createdLabel,
      startsAt,
      clientName,
      clientContact: row.contact_info ?? "",
      petName: row.pet_name ?? "",
      petSpecies: row.species ?? "",
      doctorId: row.doctor_id ?? undefined,
      doctorName,
      serviceName,
      serviceCode: row.service_code ?? "",
      statusLabel: row.status ?? "неизвестно",
      videoPlatform: row.video_platform ?? null,
      videoUrl: row.video_url ?? null,
    };
  });
}

/** Все консультации (полная таблица). */
export async function getRegistrarAppointments(): Promise<
  RegistrarAppointmentRow[]
> {
  return getAppointmentsFromDb();
}

/** Последние N консультаций (дашборд). */
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
