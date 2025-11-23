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

/**
 * Маппинг строки из БД в тип RegistrarAppointmentRow.
 */
function mapRowToRegistrar(row: any, index: number): RegistrarAppointmentRow {
  // Дата и время приёма
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

  // Врач: ищем по doctor_id в справочнике doctors (lib/data.ts)
  let doctorName = "Не назначен";
  if (row.doctor_id) {
    const doc = doctors.find((d: any) => d.id === row.doctor_id);
    if (doc) {
      doctorName = doc.name;
    }
  }

  // Услуга: находим в servicesPricing по коду
  let serviceName = "Услуга";
  if (row.service_code) {
    const service = servicesPricing.find((s: any) => s.code === row.service_code);
    if (service) {
      serviceName = service.name;
    }
  }

  // Клиент — пока без явной связи с owner_profiles
  const clientName = "Без имени";
  const clientContact = "";

  return {
    id: String(row.id ?? index),

    // время/дата
    dateLabel,
    createdLabel,
    startsAt: row.starts_at ?? null,

    // клиент
    clientName,
    clientContact,

    // пациент
    petName: row.pet_name ?? "",
    petSpecies: row.species ?? "",

    // врач
    doctorId: row.doctor_id ?? undefined,
    doctorName,

    // услуга
    serviceName,
    serviceCode: row.service_code ?? "",

    // статус
    statusLabel: row.status ?? "неизвестно",

    // формат связи
    videoPlatform: row.video_platform ?? null,
    videoUrl: row.video_url ?? null,

    // жалоба
    complaint: row.complaint ?? "",
  };
}

/**
 * Все консультации для регистратуры.
 */
export async function getRegistrarAppointments(): Promise<RegistrarAppointmentRow[]> {
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
      requested_doctor_code,
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

  return (data as any[]).map((row, idx) => mapRowToRegistrar(row, idx));
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
      requested_doctor_code,
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
 * Приёмы для конкретного врача по doctor_id (для кабинета врача).
 * Сейчас просто фильтрует уже загруженные приёмы.
 */
export async function getAppointmentsForDoctor(
  doctorId: string
): Promise<RegistrarAppointmentRow[]> {
  const all = await getRegistrarAppointments();
  return all.filter((a) => a.doctorId === doctorId);
}
