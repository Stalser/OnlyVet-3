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
 * Акуратный парсер extra_contacts из owner_profiles.
 * Ожидаем что-то вроде { "phone": "...", "email": "...", "telegram": "..." }
 */
function extractContacts(extra: any): { email?: string; phone?: string } {
  if (!extra) return {};
  let parsed: any = null;

  if (typeof extra === "object" && !Array.isArray(extra)) {
    parsed = extra;
  } else if (typeof extra === "string") {
    try {
      parsed = JSON.parse(extra);
    } catch {
      parsed = null;
    }
  }

  if (!parsed || typeof parsed !== "object") {
    return {};
  }

  const email = parsed.email ?? parsed.mail ?? undefined;
  const phone =
    parsed.phone ??
    parsed.phone_main ??
    parsed.whatsapp ??
    parsed.telegram_phone ??
    undefined;

  return { email, phone };
}

/**
 * Общий маппер строки appointments(+owner_profiles) → RegistrarAppointmentRow.
 * Используется и в списке, и в деталке.
 */
function mapAppointmentRow(row: any, index: number = 0): RegistrarAppointmentRow {
  // Дата / время
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

  // Клиент: owner_profiles может прийти как объект или массив
  const ownerProfile =
    Array.isArray(row.owner_profiles) && row.owner_profiles.length > 0
      ? row.owner_profiles[0]
      : row.owner_profiles ?? null;

  const fullName =
    ownerProfile?.full_name && String(ownerProfile.full_name).trim().length > 0
      ? String(ownerProfile.full_name)
      : "Без имени";

  const { email, phone } = extractContacts(ownerProfile?.extra_contacts);
  const clientContact =
    phone?.toString().trim() || email?.toString().trim() || "";

  return {
    id: String(row.id ?? index),
    dateLabel,
    createdLabel,
    startsAt: row.starts_at ?? null,

    clientName: fullName,
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
      complaint,
      owner_profiles!inner (
        user_id,
        full_name,
        extra_contacts
      )
    `
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    console.error("getRegistrarAppointmentById error:", error);
    return null;
  }

  return mapAppointmentRow(data, 0);
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
      complaint,
      owner_profiles (
        user_id,
        full_name,
        extra_contacts
      )
    `
    )
    .order("starts_at", { ascending: false });

  if (error || !data) {
    console.error("getRegistrarAppointments error:", error);
    return [];
  }

  return data.map((row: any, index: number) => mapAppointmentRow(row, index));
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
