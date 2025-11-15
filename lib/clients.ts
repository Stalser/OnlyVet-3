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
 */
export async function getOwnersSummary(): Promise<OwnerSummary[]> {
  if (!supabase) return [];

  const { data: owners, error: ownersError } = await supabase
    .from("owner_profiles")
    .select("*");

  if (ownersError || !owners) {
    return [];
  }

  const { data: pets } = await supabase
    .from("pets")
    .select("id, owner_id");

  const { data: appts } = await supabase
    .from("appointments")
    .select("id, owner_id");

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
    const key = String(o.user_id); // это основной идентификатор клиента
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

  if (error || !data) {
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

    const clientName = "Без имени"; // можно будет подтянуть из owner_profiles при отображении

    return {
      id: String(row.id ?? index),
      dateLabel,
      createdLabel,
      clientName,
      clientContact: "",
      petName: row.pet_name ?? "",
      petSpecies: row.species ?? "",
      doctorId: row.doctor_id ?? undefined,
      doctorName,
      serviceName,
      serviceCode: row.service_code ?? "",
      statusLabel: row.status ?? "неизвестно",
    };
  });
}

/**
 * Детали конкретного клиента + его питомцы + его консультации.
 */
export async function getOwnerWithPets(
  ownerId: string
): Promise<OwnerDetails> {
  if (!supabase) {
    return { owner: null, pets: [], appointments: [] };
  }

  const ownerKey = parseInt(ownerId, 10);

  const { data: owner } = await supabase
    .from("owner_profiles")
    .select("*")
    .eq("user_id", ownerKey)
    .maybeSingle();

  const { data: pets } = await supabase
    .from("pets")
    .select("*")
    .eq("owner_id", ownerKey);

  const appointments = await getOwnerAppointments(ownerId);

  return {
    owner: owner ?? null,
    pets: pets ?? [],
    appointments,
  };
}
