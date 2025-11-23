// lib/clients.ts

import { supabase } from "./supabaseClient";
import { doctors } from "./data";
import { servicesPricing } from "./pricing";
import type { RegistrarAppointmentRow } from "./registrar";

export type OwnerSummary = {
  ownerId: string; // user_id в owner_profiles (bigint → string)
  fullName: string;
  city?: string;
  email?: string;
  phone?: string;
  petsCount: number;
  appointmentsCount: number;
  hasPrivateData: boolean; // есть ли запись в owner_private_data
};

export type OwnerDetails = {
  owner: any | null;
  pets: any[];
  appointments: RegistrarAppointmentRow[];
  privateData: {
    passport_series?: string | null;
    passport_number?: string | null;
    passport_issued_by?: string | null;
    passport_issued_at?: string | null;
    registration_address?: string | null;
    actual_address?: string | null;
    legal_notes?: string | null;
  } | null;
};

/**
 * Достаём аккуратно контакты из extra_contacts (jsonb):
 * ожидаем что-то вроде { "phone": "...", "email": "...", "telegram": "..." }
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
 * Суммарная информация по клиентам.
 * Учитывает soft-delete для owner_profiles.
 * petsCount считается по таблице pets по owner_id.
 */
export async function getOwnersSummary(): Promise<OwnerSummary[]> {
  if (!supabase) return [];

  // 1. Не удалённые клиенты
  const { data: owners, error: ownersError } = await supabase
    .from("owner_profiles")
    .select("*")
    .is("deleted_at", null)
    .order("full_name", { ascending: true });

  if (ownersError || !owners) {
    console.error("getOwnersSummary ownersError", ownersError);
    return [];
  }

  const ownerIds = owners.map((o: any) => o.user_id) as number[];
  if (ownerIds.length === 0) {
    return [];
  }

  // 2. Питомцы: считаем количество по owner_id
  // стараемся не падать, даже если у pets нет deleted_at
  let petsCountMap = new Map<string, number>();
  try {
    const { data: pets, error: petsError } = await supabase
      .from("pets")
      .select("owner_id, deleted_at")
      .in("owner_id", ownerIds);

    if (petsError) {
      console.error("getOwnersSummary petsError", petsError);
    } else {
      (pets ?? []).forEach((p: any) => {
        if (p.owner_id == null) return;
        // если есть deleted_at — считаем только записи без deleted_at
        if ("deleted_at" in p && p.deleted_at) return;
        const key = String(p.owner_id);
        petsCountMap.set(key, (petsCountMap.get(key) ?? 0) + 1);
      });
    }
  } catch (e) {
    console.error("getOwnersSummary pets block error", e);
    petsCountMap = new Map<string, number>();
  }

  // 3. Консультации по owner_id (appointmentsCount)
  let apptCountMap = new Map<string, number>();
  try {
    const { data: appts, error: apptsError } = await supabase
      .from("appointments")
      .select("id, owner_id")
      .in("owner_id", ownerIds);

    if (apptsError) {
      console.error("getOwnersSummary apptsError", apptsError);
    } else {
      (appts ?? []).forEach((a: any) => {
        if (a.owner_id == null) return;
        const key = String(a.owner_id);
        apptCountMap.set(key, (apptCountMap.get(key) ?? 0) + 1);
      });
    }
  } catch (e) {
    console.error("getOwnersSummary appts block error", e);
    apptCountMap = new Map<string, number>();
  }

  // 4. Персональные данные (owner_private_data)
  let privateSet = new Set<string>();
  try {
    const { data: priv, error: privError } = await supabase
      .from("owner_private_data")
      .select("owner_id")
      .in("owner_id", ownerIds);

    if (privError) {
      console.error("getOwnersSummary privError", privError);
    } else {
      (priv ?? []).forEach((r: any) => {
        if (r.owner_id == null) return;
        privateSet.add(String(r.owner_id));
      });
    }
  } catch (e) {
    console.error("getOwnersSummary priv block error", e);
    privateSet = new Set<string>();
  }

  // 5. Собираем итог
  return owners.map((o: any) => {
    const key = String(o.user_id);
    const fullName = o.full_name || "Без имени";
    const city = o.city || undefined;
    const { email, phone } = extractContacts(o.extra_contacts);

    return {
      ownerId: key,
      fullName,
      city,
      email,
      phone,
      petsCount: petsCountMap.get(key) ?? 0,
      appointmentsCount: apptCountMap.get(key) ?? 0,
      hasPrivateData: privateSet.has(key),
    };
  });
}

/**
 * История консультаций конкретного клиента по owner_id.
 * Используется в карточке клиента.
 */
async function getOwnerAppointments(
  ownerId: string
): Promise<RegistrarAppointmentRow[]> {
  if (!supabase) return [];

  const ownerKey = parseInt(ownerId, 10);
  if (Number.isNaN(ownerKey)) {
    return [];
  }

  const { data, error } = await supabase
    .from("appointments")
    .select(
      "id, starts_at, created_at, status, pet_name, species, service_code, doctor_id, owner_id"
    )
    .eq("owner_id", ownerKey)
    .order("starts_at", { ascending: false });

  if (error || !data) {
    console.error("getOwnerAppointments error", error);
    return [];
  }

  return (data as any[]).map((row: any, index: number): RegistrarAppointmentRow => {
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

    return {
      id: String(row.id ?? index),
      dateLabel,
      createdLabel,
      startsAt: row.starts_at ?? null,

      clientName,
      clientContact: "",

      petName: row.pet_name ?? "",
      petSpecies: row.species ?? "",

      doctorId: row.doctor_id ?? undefined,
      doctorName,

      serviceName,
      serviceCode: row.service_code ?? "",

      statusLabel: row.status ?? "неизвестно",

      videoPlatform: null,
      videoUrl: null,

      // новые поля, чтобы совпасть с RegistrarAppointmentRow
      complaint: "",
      requestedDoctorName: undefined,
      hasDocuments: false,
      hasPayments: false,
    };
  });
}

/**
 * Детали конкретного клиента + его питомцы + его консультации + персональные данные.
 */
export async function getOwnerWithPets(
  ownerId: string
): Promise<OwnerDetails> {
  if (!supabase) {
    return { owner: null, pets: [], appointments: [], privateData: null };
  }

  const ownerKey = parseInt(ownerId, 10);
  if (Number.isNaN(ownerKey)) {
    return { owner: null, pets: [], appointments: [], privateData: null };
  }

  const { data: owner, error: ownerError } = await supabase
    .from("owner_profiles")
    .select("*")
    .eq("user_id", ownerKey)
    .is("deleted_at", null)
    .maybeSingle();

  if (ownerError) {
    console.error("getOwnerWithPets ownerError", ownerError);
  }

  const { data: pets, error: petsError } = await supabase
    .from("pets")
    .select("*")
    .eq("owner_id", ownerKey)
    .order("name", { ascending: true });

  if (petsError) {
    console.error("getOwnerWithPets petsError", petsError);
  }

  const { data: privateData, error: privError } = await supabase
    .from("owner_private_data")
    .select(
      "passport_series, passport_number, passport_issued_by, passport_issued_at, registration_address, actual_address, legal_notes"
    )
    .eq("owner_id", ownerKey)
    .maybeSingle();

  if (privError) {
    console.error("getOwnerWithPets privateError", privError);
  }

  const appointments = await getOwnerAppointments(ownerId);

  return {
    owner: owner ?? null,
    pets: pets ?? [],
    appointments,
    privateData: (privateData as any) ?? null,
  };
}
