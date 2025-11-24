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

  // пациент (текущие значения)
  petName?: string;
  petSpecies?: string;

  // пациент — исходный выбор клиента
  requestedPetName?: string | null;
  requestedPetSpecies?: string | null;

  // врач (фактически назначенный)
  doctorId?: string;
  doctorName?: string;

  // врач, которого выбрал клиент при заявке
  requestedDoctorCode?: string | null;
  requestedDoctorName?: string | null;

  // услуга (текущее значение)
  serviceName: string;
  serviceCode?: string;

  // услуга — исходный выбор клиента
  requestedServiceCode?: string | null;
  requestedServiceName?: string | null;

  // статус
  statusLabel: string;

  // формат связи
  videoPlatform?: string | null;
  videoUrl?: string | null;

  // жалоба
  complaint?: string;

  // наличие документов / оплат (пока заглушки false, подготовлено для будущего)
  hasDocuments: boolean;
  hasPayments: boolean;
};

/**
 * Преобразование строки appointments в RegistrarAppointmentRow.
 */
function mapRowToRegistrar(row: any, index: number): RegistrarAppointmentRow {
  // --- Дата / время ---
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

  // --- Врач (фактический) ---
  const doc = doctors.find((d: any) => d.id === row.doctor_id);
  const doctorName = doc?.name ?? "Не назначен";

  // --- Врач, выбранный клиентом при записи ---
  const requestedDoctorCode: string | null =
    row.requested_doctor_code ?? null;
  let requestedDoctorName: string | null = null;
  if (requestedDoctorCode) {
    const reqDoc = doctors.find((d: any) => d.id === requestedDoctorCode);
    requestedDoctorName = reqDoc?.name ?? null;
  }

  // --- Услуга (текущая) ---
  const service = servicesPricing.find(
    (s: any) => s.code === row.service_code
  );
  const serviceName = service?.name ?? "Услуга";

  // --- Услуга, выбранная клиентом ---
  const requestedServiceCode: string | null =
    row.requested_service_code ?? null;
  let requestedServiceName: string | null = null;
  if (requestedServiceCode) {
    const reqService = servicesPricing.find(
      (s: any) => s.code === requestedServiceCode
    );
    requestedServiceName = reqService?.name ?? null;
  }

  // --- Питомец (текущий) ---
  const petName: string | undefined = row.pet_name ?? undefined;
  const petSpecies: string | undefined = row.species ?? undefined;

  // --- Питомец, выбранный клиентом ---
  const requestedPetName: string | null = row.requested_pet_name ?? null;
  const requestedPetSpecies: string | null =
    row.requested_pet_species ?? null;

  // ⚠ Клиентские данные пока не связаны явно с owner_profiles
  const clientName = "Без имени";
  const clientContact = "";

  return {
    id: String(row.id ?? index),

    dateLabel,
    createdLabel,
    startsAt: row.starts_at ?? null,

    clientName,
    clientContact,

    petName,
    petSpecies,

    requestedPetName,
    requestedPetSpecies,

    doctorId: row.doctor_id ?? undefined,
    doctorName,

    requestedDoctorCode,
    requestedDoctorName,

    serviceName,
    serviceCode: row.service_code ?? "",
    requestedServiceCode,
    requestedServiceName,

    statusLabel: row.status ?? "неизвестно",

    videoPlatform: row.video_platform ?? null,
    videoUrl: row.video_url ?? null,

    complaint: row.complaint ?? "",

    // заглушки до полноценной реализации документов/оплат
    hasDocuments: false,
    hasPayments: false,
  };
}

/**
 * Грузим все консультации для регистратуры.
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
      complaint,
      requested_doctor_code,
      requested_service_code,
      requested_pet_name,
      requested_pet_species
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
      complaint,
      requested_doctor_code,
      requested_service_code,
      requested_pet_name,
      requested_pet_species
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
 */
export async function getAppointmentsForDoctor(
  doctorId: string
): Promise<RegistrarAppointmentRow[]> {
  const all = await getRegistrarAppointments();
  return all.filter((a) => a.doctorId === doctorId);
}
