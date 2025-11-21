// lib/registrar.ts

import { supabase } from "./supabaseClient";
import { doctors } from "./data";
import { servicesPricing } from "./pricing";

/**
 * Основной тип консультации для регистратуры.
 * Включает жалобу (complaint).
 */
export type RegistrarAppointmentRow = {
  id: string;
  dateLabel: string;
  createdLabel?: string;
  startsAt: string | null;

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

  complaint?: string;
};

/**
 * Получить одну консультацию по ID.
 */
export async function getRegistrarAppointmentById(
  id: string
): Promise<RegistrarAppointmentRow | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("appointments")
    .select(
      `
      id,
      starts_at,
      created_at,
      status,
      pet_name,
      species,
      service_code,
      doctor_id,
      owner_id,
      video_platform,
      video_url,
      complaint
    `
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    console.error("getRegistrarAppointmentById error:", error);
    return null;
  }

  let dateLabel = "—";
  if (data.starts_at) {
    const d = new Date(data.starts_at);
    dateLabel = d.toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const createdLabel = data.created_at
    ? new Date(data.created_at).toLocaleString("ru-RU")
    : "";

  const doc = doctors.find((d: any) => d.id === data.doctor_id);
  const doctorName = doc?.name ?? "Не назначен";

  const service = servicesPricing.find(
    (s: any) => s.code === data.service_code
  );
  const serviceName = service?.name ?? "Услуга";

  // Пока заглушка — позже подставим реальные данные клиента
  const clientName = "Без имени";
  const clientContact = "";

  return {
    id: String(data.id),
    dateLabel,
    createdLabel,
    startsAt: data.starts_at ?? null,

    clientName,
    clientContact,

    petName: data.pet_name ?? "",
    petSpecies: data.species ?? "",

    doctorId: data.doctor_id ?? undefined,
    doctorName,

    serviceName,
    serviceCode: data.service_code ?? "",

    statusLabel: data.status ?? "неизвестно",

    videoPlatform: data.video_platform ?? null,
    videoUrl: data.video_url ?? null,

    complaint: data.complaint ?? "",
  };
}

/**
 * Получить все консультации для регистратуры.
 */
export async function getRegistrarAppointments(): Promise<
  RegistrarAppointmentRow[]
> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("appointments")
    .select(
      `
      id,
      starts_at,
      created_at,
      status,
      pet_name,
      species,
      service_code,
      doctor_id,
      owner_id,
      video_platform,
      video_url,
      complaint
    `
    )
    .order("starts_at", { ascending: false });

  if (error || !data) {
    console.error("getRegistrarAppointments error:", error);
    return [];
  }

  return data.map((row: any, index: number) => {
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

    const doc = doctors.find((d: any) => d.id === row.doctor_id);
    const doctorName = doc?.name ?? "Не назначен";

    const service = servicesPricing.find(
      (s: any) => s.code === row.service_code
    );
    const serviceName = service?.name ?? "Услуга";

    const clientName = "Без имени";
    const clientContact = "";

    return {
      id: String(row.id ?? index),
      dateLabel,
      createdLabel,
      startsAt: row.starts_at ?? null,

      clientName,
      clientContact,

      petName: row.pet_name ?? "",
      petSpecies: row.species ?? "",

      doctorId: row.doctor_id ?? undefined,
      doctorName,

      serviceName,
      serviceCode: row.service_code ?? "",

      statusLabel: row.status ?? "неизвестно",

      videoPlatform: row.video_platform ?? null,
      videoUrl: row.video_url ?? null,

      complaint: row.complaint ?? "",
    };
  });
}

/**
 * Получить последние N консультаций для дашборда регистратуры.
 * Используется на главной странице /backoffice/registrar.
 */
export async function getRecentRegistrarAppointments(
  limit: number = 50
): Promise<RegistrarAppointmentRow[]> {
  const all = await getRegistrarAppointments();
  return all.slice(0, limit);
}
