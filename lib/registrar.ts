// lib/registrar.ts

import { supabase } from "./supabaseClient";
import { doctors } from "./data";
import { servicesPricing } from "./pricing";

/**
 * Основной тип консультации для регистратуры и врача.
 */
export type RegistrarAppointmentRow = {
  id: string;

  // дата/время
  dateLabel: string;
  createdLabel?: string;
  startsAt: string | null;

  // клиент
  clientName: string;
  clientContact?: string;

  // пациент
  petName?: string;
  petSpecies?: string;

  // врач
  doctorId?: string;
  doctorName?: string;

  // услуга
  serviceName: string;
  serviceCode?: string;

  // статус
  statusLabel: string;

  // формат связи
  videoPlatform?: string | null;
  videoUrl?: string | null;

  // жалоба
  complaint?: string;
};

function mapRowToRegistrar(row: any, index: number): RegistrarAppointmentRow {
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

  // пока клиентские данные не связаны явно с owner_profiles
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
}

/**
 * Все консультации для регистратуры.
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

  return (data as any[]).map(mapRowToRegistrar);
}

/**
 * Одна консультация по ID (для регистратуры и врача).
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

  return mapRowToRegistrar(data, 0);
}

/**
 * Последние N консультаций (для дашборда регистратуры).
 */
export async function getRecentRegistrarAppointments(
  limit: number = 50
): Promise<RegistrarAppointmentRow[]> {
  const all = await getRegistrarAppointments();
  return all.slice(0, limit);
}

/**
 * Приёмы для конкретного врача по doctor_id (скелет для кабинета врача).
 * Сейчас просто фильтрует по doctor_id.
 */
export async function getAppointmentsForDoctor(
  doctorId: string
): Promise<RegistrarAppointmentRow[]> {
  const all = await getRegistrarAppointments();
  return all.filter((a) => a.doctorId === doctorId);
}
