// lib/registrar.ts
import { supabase } from "./supabaseClient";
import { doctors } from "./data";
import { servicesPricing } from "./pricing";

export type RegistrarAppointmentRow = {
  id: string;
  dateLabel: string;
  createdLabel?: string;
  startsAt: string | null;

  // клиент / питомец
  clientName: string;
  clientContact?: string;
  petName?: string;
  petSpecies?: string;

  // врач и услуга
  doctorId?: string;
  doctorName?: string;
  requestedDoctorName?: string;
  serviceName: string;
  serviceCode?: string;

  // статусы / связь
  statusLabel: string;
  videoPlatform?: string | null;
  videoUrl?: string | null;
  complaint?: string;

  // новые поля
  hasDocuments: boolean;
  hasPayments: boolean;
};

/**
 * Вспомогательная функция форматирования даты.
 */
function formatDateTime(
  iso: string | null
): { dateLabel: string; createdLabel: string } {
  let dateLabel = "—";
  let createdLabel = "";

  if (iso) {
    const d = new Date(iso);
    dateLabel = d.toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    createdLabel = d.toLocaleString("ru-RU");
  }

  return { dateLabel, createdLabel };
}

/**
 * Грузим все консультации для регистратуры + считаем наличие документов и оплат.
 */
export async function getRegistrarAppointments(): Promise<RegistrarAppointment> {
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
      requested_doctor_id
    `
    )
    .order("starts_at", { ascending: false });

  if (error || !data) {
    console.error("getRegistrarAppointments error", error);
    return [];
  }

  const rows = data as any[];

  // Собираем список id приёмов
  const appointmentIds = rows
    .map((r) => r.id as string | null)
    .filter((id): id is string => !!id);

  // ---- Документы по приёмам ----
  const docsByAppointment = new Map<string, number>();
  if (appointmentIds.length && supabase) {
    const { data: docs, error: docsError } = await supabase
      .from("appointment_documents")
      .select("appointment_id")
      .in("appointment_id", appointmentIds);

    if (docsError) {
      console.error("getRegistrarAppointments appointment_documents error", docsError);
    } else if (docs) {
      for (const row of docs as any[]) {
        const key = String(row.appointment_id);
        if (!key) continue;
        docsByAppointment.set(
          key,
          (docsByAppointment.get(key) ?? 0) + 1
        );
      }
    }
  }

  // ---- Оплаты по приёмам ----
  const paymentsByAppointment = new Map<string, boolean>();
  if (appointmentIds.length && supabase) {
    const { data: pays, error: payError } = await supabase
      .from("payments")
      .select("appointment_id")
      .in("appointment_id", appointmentIds);

    if (payError) {
      console.error("getRegistrarAppointments payments error", payError);
    } else if (pays) {
      for (const row of pays as any[]) {
        const key = String(row.appointment_id);
        if (!key) continue;
        // Любая запись = есть оплата (можем потом усложнить до "частично"/"полностью")
        paymentsByAppointment.set(key, true);
      }
    }
  }

  return rows.map((row, index): RegistrarAppointmentRow => {
    const { dateLabel, createdLabel } = formatDateTime(row.starts_at);

    const doctor = doctors.find((d) => d.id === row.doctor_id);
    const requestedDoctorId = row.requested_doctor_id as string | null;
    const requestedDoctor = requestedDoctorId
      ? doctors.find((d) => d.id === requestedDoctorId)
      : undefined;

    const service = servicesPricing.find(
      (s: any) => s.code === row.service_code
    );

    const key = String(row.id);
    const hasDocuments = (docsByAppointment.get(key) ?? 0) > 0;
    const hasPayments = !!paymentsByAppointment.get(key);

    return {
      id: String(row.id ?? index),
      dateLabel,
      createdLabel,
      startsAt: row.starts_at ?? null,

      // пока без реальной привязки к owner_profiles
      clientName: "Без имени",
      clientContact: "",

      petName: row.pet_name ?? "",
      petSpecies: row.species ?? "",

      doctorId: row.doctor_id ?? undefined,
      doctorName: doctor?.name ?? "Не назначен",
      requestedDoctorName: requestedDoctor?.name,

      serviceName: service?.name ?? "Услуга",
      serviceCode: row.service_code ?? "",

      statusLabel: row.status ?? "неизвестно",
      videoPlatform: row.video_platform ?? null,
      videoUrl: row.video_url ?? null,
      complaint: row.complaint ?? "",

      hasDocuments: hasDocuments,
      hasPayments: hasPayments,
    };
  });
}

/**
 * Одна консультация по id (включая флаги документов и оплат).
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
      requested_doctor_id
    `
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    console.error("getRegistrarAppointmentById error:", error);
    return null;
  }

  const row: any = data;
  const { dateLabel, createdLabel } = formatDateTime(row.starts_at);

  const doctor = doctors.find((d) => d.id === row.doctor_id);
  const requestedDoctorId = row.requested_doctor_id as string | null;
  const requestedDoctor = requestedDoctorId
    ? doctors.find((d) => d.id === requestedDoctorId)
    : undefined;

  const service = servicesPricing.find((s: any) => s.code === row.service_code);

  // Документы и оплаты по одному приёму
  let hasDocuments = false;
  let hasPayments = false;

  try {
    const { data: docs } = await supabase
      .from("appointment_documents")
      .select("id")
      .eq("appointment_id", row.id);
    if (docs && docs.length > 0) {
      hasDocuments = true;
    }
  } catch (e) {
    console.error("getRegistrarAppointmentById docs error", e);
  }

  try {
    const { data: pays } = await supabase
      .from("payments")
      .select("id")
      .eq("appointment_id", row.id);
    if (pays && pays.length > 0) {
      hasPayments = true;
    }
  } catch (e) {
    console.error("getRegistrarAppointmentById payments error", e);
  }

  return {
    id: String(row.id),
    dateLabel,
    createdLabel,
    startsAt: row.starts_at ?? null,

    clientName: "Без имени",
    clientContact: "",

    petName: row.pet_name ?? "",
    petSpecies: row.species ?? "",

    doctorId: row.doctor_id ?? undefined,
    doctorName: doctor?.name ?? "Не назначен",
    requestedDoctorName: requestedDoctor?.name,

    serviceName: service?.name ?? "Услуга",
    serviceCode: row.service_code ?? "",

    statusLabel: row.status ?? "неизвестно",
    videoPlatform: row.video_platform ?? null,
    videoUrl: row.video_url ?? null,
    complaint: row.complaint ?? "",

    hasDocuments: hasDocuments,
    hasPayments: hasPayments,
  };
}

/**
 * Последние N консультаций (используется на дашборде регистратуры).
 */
export async function getRecentRegistrarAppointments(
  limit: number = 50
): Promise<RegistrarAppointmentRow[]> {
  const all = await getRegistrarAppointments();
  return all.slice(0, limit);
}
