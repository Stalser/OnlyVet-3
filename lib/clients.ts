// lib/clients.ts

import { supabase } from "./supabaseClient";
import { doctors } from "./data";
import { servicesPricing } from "./pricing";
import type { RegistrarAppointmentRow } from "./registrar";

export type OwnerSummary = {
  ownerId: string;        // user_id в owner_profiles (bigint → string)
  fullName: string;
  city?: string;
  email?: string;
  phone?: string;
  petsCount: number;
  appointmentsCount: number;
};

export type OwnerDetails = {
  owner: any | null;
  pets: any[];
  appointments: RegistrarAppointmentRow[];
};

/**
 * Достаём аккуратно контакты из extra_contacts (jsonb):
 * ждём что-то вроде { "phone": "...", "email": "...", "telegram": "..." }
 */
function extractContacts(extra: any): { email?: string; phone?: string } {
  if (!extra || typeof extra !== "object") return {};
  const email =
    extra.email ||
    extra.mail ||
    undefined;
  const phone =
    extra.phone ||
    extra.phone_main ||
    extra.whatsapp ||
    extra.telegram_phone ||
    undefined;

  return { email, phone };
}

/**
 * Суммарная информация по клиентам.
 * Учитывает soft-delete для owner_profiles и pets.
 */
export async function getOwnersSummary(): Promise<OwnerSummary[]> {
  if (!supabase) return [];

  // Берём только не удалённых клиентов
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

  // Если клиентов нет — выходим
  if (ownerIds.length === 0) {
    return [];
  }

  // Считаем количество не удалённых питомцев на каждого владельца
  const { data: pets, error: petsError } = await supabase
    .from("pets")
    .select("id, owner_id")
    .in("owner_id", ownerIds)
    .is("deleted_at", null);

  if (petsError) {
    console.error("getOwnersSummary petsError", petsError);
  }

  const { data: appts, error: apptsError } = await supabase
    .from("appointments")
    .select("id, owner_id")
    .in("owner_id", ownerIds);
    // soft-delete для appointments добавим позже, когда внедрим deleted_at туда

  if (apptsError) {
    console.error("getOwnersSummary apptsError", apptsError);
  }

  const petsCountMap = new Map<string, number>();
  (pets ?? []).forEach((p: any) => {
    if (p.owner_id == null) return;
    const key = String(p.owner_id);
    petsCountMap.set(key, (petsCountMap.get(key) ?? 0) + 1);
  });

  const apptCountMap = new Map<string, number>();
  (appts ?? []).forEach((a: any) => {
    if (a.owner_id == null) return;
    const key = String(a.owner_id);
    apptCountMap.set(key, (apptCountMap.get(key) ?? 0) + 1);
  });

  return owners.map((o: any) => {
    const key = String(o.user_id); // основной идентификатор клиента
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
    };
  });
}

/**
 * История консультаций конкретного клиента по owner_id.
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
    // когда добавим deleted_at в appointments, сюда тоже можно будет добавить .is("deleted_at", null)

  if (error || !data) {
    console.error("getOwnerAppointments error", error);
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

    const clientName = "Без имени"; // при желании можно подтянуть из owner_profiles

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
    };
  });
}

/**
 * Детали конкретного клиента + его питомцы + его консультации.
 * Тоже учитывает soft-delete для владельца и питомцев.
 */
export async function getOwnerWithPets(
  ownerId: string
): Promise<OwnerDetails> {
  if (!supabase) {
    return { owner: null, pets: [], appointments: [] };
  }

  const ownerKey = parseInt(ownerId, 10);
  if (Number.isNaN(ownerKey)) {
    return { owner: null, pets: [], appointments: [] };
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
    .is("deleted_at", null)
    .order("name", { ascending: true });

  if (petsError) {
    console.error("getOwnerWithPets petsError", petsError);
  }

  const appointments = await getOwnerAppointments(ownerId);

  return {
    owner: owner ?? null,
    pets: pets ?? [],
    appointments,
  };
}
