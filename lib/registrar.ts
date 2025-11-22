// lib/registrar.ts

import { supabase } from "./supabaseClient";
import { doctors } from "./data";
import { servicesPricing } from "./pricing";

/**
 * Основной тип консультации для регистратуры.
 * Включает жалобу (complaint) и базовые поля для пациента/услуги/врача.
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
 * Вспомогательная функция для вытаскивания email/phone
 * из jsonb-поля extra_contacts.
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
 * Получить карту владельцев по owner_id → { fullName, contact }.
 * Используется, чтобы красиво отрисовать клиента в списке консультаций.
 */
async function getOwnersMap(
  ownerIds: number[]
): Promise<Map<number, { fullName: string; contact?: string }>> {
  const map = new Map<number, { fullName: string; contact?: string }>();

  if (!supabase || ownerIds.length === 0) {
    return map;
  }

  const uniqueIds = Array.from(new Set(ownerIds));

  const { data, error } = await supabase
    .from("owner_profiles")
    .select("user_id, full_name, extra_contacts")
    .in("user_id", uniqueIds);

  if (error || !data) {
    console.error("getOwnersMap error:", error);
    return map;
  }

  for (const row of data) {
    const userId = row.user_id as number;
    const fullName = (row.full_name as string | null) || "Без имени";
    const { email, phone } = extractContacts(row.extra_contacts);

    let contact: string | undefined;
    if (phone && email) {
      contact = `${phone} · ${email}`;
    } else if (phone) {
      contact = phone;
    } else if (email) {
      contact = email;
    }

    map.set(userId, { fullName, contact });
  }

  return map;
}

/**
 * Получить одну консультацию по ID.
 * Здесь мы сразу подтягиваем ФИО и контакт клиента.
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

  // Клиент по owner_id
  let clientName = "Без имени";
  let clientContact: string | undefined;

  if (typeof data.owner_id === "number") {
    const ownersMap = await getOwnersMap([data.owner_id]);
    const info = ownersMap.get(data.owner_id);
    if (info) {
      clientName = info.fullName;
      clientContact = info.contact;
    }
  }

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
 * Здесь мы сразу заполняем clientName и clientContact по owner_id.
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

  // Собираем owner_id для выборки клиентов
  const ownerIds = (data as any[])
    .map((row) => row.owner_id as number | null)
    .filter((v): v is number => typeof v === "number");

  const ownersMap = await getOwnersMap(ownerIds);

  return (data as any[]).map((row: any, index: number) => {
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

    let clientName = "Без имени";
    let clientContact: string | undefined;

    if (typeof row.owner_id === "number") {
      const info = ownersMap.get(row.owner_id);
      if (info) {
        clientName = info.fullName;
        clientContact = info.contact;
      }
    }

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
 */
export async function getRecentRegistrarAppointments(
  limit: number = 50
): Promise<RegistrarAppointmentRow[]> {
  const all = await getRegistrarAppointments();
  return all.slice(0, limit);
}
