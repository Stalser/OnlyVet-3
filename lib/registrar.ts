// lib/registrar.ts

import { supabase } from "./supabaseClient";
import { doctors } from "./data";
import { servicesPricing } from "./pricing";

/**
 * Основной тип консультации для регистратуры.
 * Включает жалобу (complaint) и данные клиента.
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

/** Вспомогательная функция — вытаскиваем контакты из extra_contacts (jsonb) */
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
 * Получить одну консультацию по ID.
 * Здесь мы дополнительно подтягиваем owner_profiles, чтобы показать нормальные ФИО и контакты.
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

  // --- основные поля приёма ---

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

  // --- подгружаем клиента по owner_id ---

  let clientName = "Без имени";
  let clientContact = "";

  if (data.owner_id != null) {
    const { data: ownerRow, error: ownerErr } = await supabase
      .from("owner_profiles")
      .select("full_name, extra_contacts")
      .eq("user_id", data.owner_id)
      .maybeSingle();

    if (ownerErr) {
      console.error("getRegistrarAppointmentById owner error:", ownerErr);
    } else if (ownerRow) {
      clientName = ownerRow.full_name || "Без имени";
      const { email, phone } = extractContacts(ownerRow.extra_contacts);
      // приоритет — телефон, затем email
      clientContact = phone || email || "";
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
 * Здесь сразу подтягиваем клиентов оптом и маппим по owner_id.
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

  // --- подтягиваем owner_profiles разом по всем owner_id ---

  const ownerIds = Array.from(
    new Set(
      (data ?? [])
        .map((row: any) => row.owner_id)
        .filter((id: any) => id != null)
    )
  ) as number[];

  const ownersMap = new Map<
    number,
    { full_name: string | null; extra_contacts: any }
  >();

  if (ownerIds.length > 0) {
    const { data: owners, error: ownersErr } = await supabase
      .from("owner_profiles")
      .select("user_id, full_name, extra_contacts")
      .in("user_id", ownerIds);

    if (ownersErr) {
      console.error("getRegistrarAppointments owners error:", ownersErr);
    } else {
      (owners ?? []).forEach((o: any) => {
        ownersMap.set(o.user_id, {
          full_name: o.full_name ?? null,
          extra_contacts: o.extra_contacts ?? null,
        });
      });
    }
  }

  return data.map((row: any, index: number) => {
    // дата/время
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

    // врач
    const doc = doctors.find((d: any) => d.id === row.doctor_id);
    const doctorName = doc?.name ?? "Не назначен";

    // услуга
    const service = servicesPricing.find(
      (s: any) => s.code === row.service_code
    );
    const serviceName = service?.name ?? "Услуга";

    // клиент
    let clientName = "Без имени";
    let clientContact = "";

    if (row.owner_id != null) {
      const owner = ownersMap.get(row.owner_id);
      if (owner) {
        clientName = owner.full_name || "Без имени";
        const { email, phone } = extractContacts(owner.extra_contacts);
        clientContact = phone || email || "";
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
