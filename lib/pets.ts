// lib/pets.ts

import { supabase } from "./supabaseClient";
import { doctors } from "./data";
import { servicesPricing } from "./pricing";
import type { RegistrarAppointmentRow } from "./registrar";

export type PetDetails = {
  pet: any | null;
  owner: any | null;
  appointments: RegistrarAppointmentRow[];
};

export async function getPetDetails(petId: string): Promise<PetDetails> {
  if (!supabase) {
    return { pet: null, owner: null, appointments: [] };
  }

  // 1. Сам питомец
  const { data: pet, error: petError } = await supabase
    .from("pets")
    .select("*")
    .eq("id", petId)
    .maybeSingle();

  if (petError) {
    console.error("getPetDetails petError", petError);
  }

  // 2. Владелец (по owner_id у питомца)
  let owner: any | null = null;
  if (pet && pet.owner_id != null) {
    const { data: ownerData, error: ownerError } = await supabase
      .from("owner_profiles")
      .select("*")
      .eq("user_id", pet.owner_id)
      .maybeSingle();

    if (ownerError) {
      console.error("getPetDetails ownerError", ownerError);
    }

    owner = ownerData ?? null;
  }

  // 3. Консультации по этому питомцу (appointments.pet_id = petId)
  const { data: appts, error: apptsError } = await supabase
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
      video_platform,
      video_url,
      complaint
    `
    )
    .eq("pet_id", petId)
    .order("starts_at", { ascending: false });

  if (apptsError) {
    console.error("getPetDetails apptsError", apptsError);
  }

  const appointments: RegistrarAppointmentRow[] = (appts ?? []).map(
    (row: any, index: number) => {
      // Форматирование даты приёма
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

      // Форматирование даты создания
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

      // Клиент
      const clientName = owner?.full_name || "Без имени";
      const clientContact = ""; // позже можно подставить телефон/телеграм из owner_private_data/extra_contacts

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
  );

  return { pet: pet ?? null, owner, appointments };
}
