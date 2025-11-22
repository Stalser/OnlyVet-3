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

/** Владелец для мапы owner_id → данные */
type OwnerContact = {
  fullName: string;
  email?: string;
  phone?: string;
};

/**
 * Аккуратно достаём контакты из extra_contacts (jsonb).
 * Ожидаем формат вроде { "phone": "...", "email": "...", "telegram": "..." }.
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
 * Подтянуть владельцев для набора owner_id и вернуть мапу owner_id → { fullName, email, phone }.
 */
async function getOwnersMap(
  ownerIds: number[]
): Promise<Map<number, OwnerContact>> {
  const map = new Map<number, OwnerContact>();

  if (!supabase || ownerIds.length === 0) return map;

  const { data, error } = await supabase
    .from("owner_profiles")
    .select("user_id, full_name, extra_contacts")
    .in("user_id", ownerIds);

  if (error || !data) {
    console.error("getOwnersMap error:", error);
    return map;
  }

  for (const row of data) {
    const id = row.user_id as number;
    const fullName = (row.full_name as string) || "Без имени";
    const { email, phone } = extractContacts(row.extra_contacts);

    map.set(id, { fullName, email, phone });
  }

  return map;
}

/**
 * Получить одну консультацию по ID.
 * Важно: здесь тоже подставляем имя и контакт владельца, если owner_id задан.
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

  // владельца бесшумно подтягиваем
  let clientName = "Без имени";
  let clientContact = "";

  if (data.owner_id != null) {
    const ownersMap = await getOwnersMap([data.owner_id]);
    const owner = ownersMap.get(data.owner_id);
    if (owner) {
      clientName = owner.fullName;
      clientContact = owner.phone || owner.email || "";
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
 * Здесь мы одной пачкой:
 *  - читаем все appointments,
 *  - вытаскиваем owner_id
 *  - подтягиваем владельцев и контакты
 *  - подставляем clientName / clientContact.
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

  const ownerIds = Array.from(
    new Set(
      (data ?? [])
        .map((row: any) => row.owner_id)
        .filter((id: any) => id != null)
    )
  ) as number[];

  const ownersMap = await getOwnersMap(ownerIds);

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

    let clientName = "Без имени";
    let clientContact = "";

    if (row.owner_id != null) {
      const owner = ownersMap.get(row.owner_id);
      if (owner) {
        clientName = owner.fullName;
        clientContact = owner.phone || owner.email || "";
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
 * Используется на главной странице /backoffice/registrar.
 */
export async function getRecentRegistrarAppointments(
  limit: number = 50
): Promise<RegistrarAppointmentRow[]> {
  const all = await getRegistrarAppointments();
  return all.slice(0, limit);
}
