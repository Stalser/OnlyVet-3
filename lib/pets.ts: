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

  // сам питомец
  const { data: pet } = await supabase
    .from("pets")
    .select("*")
    .eq("id", petId)
    .maybeSingle();

  let owner: any | null = null;
  if (pet && pet.owner_id != null) {
    const { data: ownerData } = await supabase
      .from("owner_profiles")
      .select("*")
      .eq("user_id", pet.owner_id)
      .maybeSingle();
    owner = ownerData ?? null;
  }

  // консультации по этому питомцу (appointments.pet_id)
  const { data: appts } = await supabase
    .from("appointments")
    .select(
      "id, starts_at, created_at, status, pet_name, species, service_code, doctor_id"
    )
    .eq("pet_id", petId)
    .order("starts_at", { ascending: false });

  const appointments: RegistrarAppointmentRow[] = (appts ?? []).map(
    (row: any, index: number) => {
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

      return {
        id: String(row.id ?? index),
        dateLabel,
        createdLabel,
        clientName: owner?.full_name || "Без имени",
        clientContact: "",
        petName: row.pet_name ?? "",
        petSpecies: row.species ?? "",
        doctorId: row.doctor_id ?? undefined,
        doctorName,
        serviceName,
        serviceCode: row.service_code ?? "",
        statusLabel: row.status ?? "неизвестно",
      };
    }
  );

  return { pet: pet ?? null, owner, appointments };
}
