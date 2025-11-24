// lib/registrar.ts
// Централизованный слой доступа к данным по приёмам/заявкам для регистратуры и врачей.

import { supabase } from "./supabaseClient";
import { doctors } from "./data";
import { servicesPricing } from "./pricing";

/**
 * Основной тип строки приёма/заявки для регистратуры/врача.
 */
export type RegistrarAppointmentRow = {
  id: string;

  // Время
  startsAt: string | null;
  dateLabel: string;
  createdLabel: string | null;

  // Владелец
  ownerId: number | null;
  ownerFullName: string | null; // ФИО из owner_profiles
  ownerContactPhone?: string | null;
  ownerTelegram?: string | null;

  // Питомец (фактически записанный в приём)
  petId?: number | null;
  petName?: string | null;
  petSpecies?: string | null;

  // Питомец, выбранный клиентом при создании (на будущее)
  chosenPetName?: string | null;
  chosenPetSpecies?: string | null;

  // Услуга
  serviceCode?: string | null;
  serviceName: string | null;

  // Услуга, которую выбрал клиент (на будущее)
  chosenServiceCode?: string | null;
  chosenServiceName?: string | null;

  // Врач, у которого сейчас назначен приём
  doctorId?: string | null;
  doctorName?: string | null;

  // Врач, которого выбрал клиент (по doctor_id, если пришёл с формы)
  chosenDoctorId?: string | null;
  chosenDoctorName?: string | null;

  // Статус приёма
  statusLabel: string;

  // Наличие документов/оплаты
  hasDocuments: boolean;
  hasPayments: boolean;

  // Формат связи
  videoPlatform?: string | null;
  videoUrl?: string | null;

  // Жалоба/описание проблемы
  complaint?: string | null;
};

/**
 * Вспомогательная функция: формирует человеко-читаемую дату.
 */
function formatDateTime(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Загрузка сырых данных по приёмам + связанных сущностей
 * (owner_profiles, appointment_documents, payments).
 */
async function loadRawAppointments() {
  if (!supabase) {
    return {
      appointments: [] as any[],
      ownersById: new Map<number, any>(),
      docsByAppointmentId: new Map<string, number>(),
      paymentsByAppointmentId: new Map<string, number>(),
    };
  }

  // 1) Основные данные по приёмам
  const { data: appointments, error: apptErr } = await supabase
    .from("appointments")
    .select(
      `
      id,
      starts_at,
      created_at,
      status,
      owner_id,
      pet_id,
      pet_name,
      species,
      service_code,
      doctor_id,
      video_platform,
      video_url,
      complaint,
      requested_doctor_code,
      requested_service_code
    `
    )
    .order("starts_at", { ascending: false });

  if (apptErr) {
    console.error("getRegistrarAppointments: error loading appointments", apptErr);
    return {
      appointments: [] as any[],
      ownersById: new Map<number, any>(),
      docsByAppointmentId: new Map<string, number>(),
      paymentsByAppointmentId: new Map<string, number>(),
    };
  }

  const ownerIds = Array.from(
    new Set(
      (appointments ?? [])
        .map((a) => a.owner_id as number | null)
        .filter((v) => v != null)
    )
  ) as number[];

  const apptIds = Array.from(
    new Set((appointments ?? []).map((a) => a.id as string))
  );

  // 2) Профили владельцев
  const ownersById = new Map<number, any>();
  if (ownerIds.length > 0) {
    const { data: owners, error: ownersErr } = await supabase
      .from("owner_profiles")
      .select("user_id, full_name, extra_contacts")
      .in("user_id", ownerIds);

    if (ownersErr) {
      console.error("getRegistrarAppointments: error loading owner_profiles", ownersErr);
    } else {
      for (const row of owners ?? []) {
        ownersById.set(row.user_id as number, row);
      }
    }
  }

  // 3) Документы по приёмам
  const docsByAppointmentId = new Map<string, number>();
  if (apptIds.length > 0) {
    const { data: docs, error: docsErr } = await supabase
      .from("appointment_documents")
      .select("appointment_id, id")
      .in("appointment_id", apptIds);

    if (docsErr) {
      console.error("getRegistrarAppointments: error loading appointment_documents", docsErr);
    } else {
      for (const d of docs ?? []) {
        const key = d.appointment_id as string;
        const prev = docsByAppointmentId.get(key) ?? 0;
        docsByAppointmentId.set(key, prev + 1);
      }
    }
  }

  // 4) Платежи по приёмам
  const paymentsByAppointmentId = new Map<string, number>();
  if (apptIds.length > 0) {
    const { data: pays, error: paysErr } = await supabase
      .from("payments")
      .select("appointment_id, id")
      .in("appointment_id", apptIds);

    if (paysErr) {
      console.error("getRegistrarAppointments: error loading payments", paysErr);
    } else {
      for (const p of pays ?? []) {
        const key = p.appointment_id as string;
        const prev = paymentsByAppointmentId.get(key) ?? 0;
        paymentsByAppointmentId.set(key, prev + 1);
      }
    }
  }

  return {
    appointments: appointments ?? [],
    ownersById,
    docsByAppointmentId,
    paymentsByAppointmentId,
  };
}

/**
 * Формирование итоговой строки приёма.
 */
function mapToRegistrarRow(
  row: any,
  ownersById: Map<number, any>,
  docsByAppointmentId: Map<string, number>,
  paymentsByAppointmentId: Map<string, number>
): RegistrarAppointmentRow {
  const id = String(row.id);
  const startsAt = row.starts_at ?? null;
  const createdAt = row.created_at ?? null;

  // Владелец
  const ownerId = (row.owner_id ?? null) as number | null;
  const owner = ownerId ? ownersById.get(ownerId) : null;
  const ownerFullName = owner?.full_name ?? null;

  let ownerPhone: string | null = null;
  let ownerTg: string | null = null;

  if (owner?.extra_contacts) {
    try {
      const extra =
        typeof owner.extra_contacts === "string"
          ? JSON.parse(owner.extra_contacts)
          : owner.extra_contacts;
      ownerPhone =
        extra?.phone ??
        extra?.phone_main ??
        extra?.whatsapp ??
        extra?.telegram_phone ??
        null;
      ownerTg = extra?.telegram ?? extra?.tg ?? extra?.telegram_username ?? null;
    } catch {
      // игнорируем ошибки парсинга
    }
  }

  // Услуга
  const serviceCode = (row.service_code ?? null) as string | null;
  const service = servicesInterop(serviceCode);
  const serviceName = service?.name ?? null;

  // Врач
  const doctorId = (row.doctor_id ?? null) as string | null;
  const doctorName = doctorId
    ? doctors.find((d) => d.id === doctorId)?.name ?? null
    : null;

  // Врач, выбранный клиентом (requested_doctor_code)
  const chosenDoctorId = (row.requested_doctor_code ?? null) as string | null;
  const chosenDoctorName = chosenDoctorId
    ? doctors.find((d) => d.id === chosenDoctorId)?.name ?? null
    : null;

  // Услуга, выбранная клиентом (requested_service_code) — на будущее
  const chosenServiceCode = (row.requested_service_code ?? null) as
    | string
    | null;
  const chosenService =
    chosenServiceCode != null ? servicesInterop(chosenServiceCode) : null;

  const hasDocs = (docsByAppointmentId.get(id) ?? 0) > 0;
  const hasPays = (paymentsByAppointmentId.get(id) ?? 0) > 0;

  return {
    id,
    startsAt,
    dateLabel: formatDateTime(startsAt),
    createdLabel: createdAt ? formatDateTime(createdAt) : null,

    ownerId,
    ownerFullName,
    ownerContactPhone: ownerPhone,
    ownerTelegram: ownerTg,

    petId: (row.pet_id ?? null) as number | null,
    petName: row.pet_name ?? null,
    petSpecies: row.species ?? null,

    chosenPetName: null, // будет заполняться после доработки логики
    chosenPetSpecies: null,

    serviceCode,
    serviceName,
    chosenServiceCode: chosenService?.code ?? null,
    chosenServiceName: chosenService?.name ?? null,

    doctorId,
    doctorName,
    chosenDoctorId,
    chosenDoctorName,

    statusLabel: row.status ?? "неизвестно",

    hasDocuments: hasDocs,
    hasPayments: hasPays,

    videoPlatform: row.video_platform ?? null,
    videoUrl: row.video_url ?? null,

    complaint: row.complaint ?? null,
  };
}

/**
 * Утилита для поиска услуги по коду.
 */
function servicesInterop(code: string | null): { code: string; name: string } | null {
  if (!code) return null;
  const s = servicesPricing.find((x) => x.code === code);
  if (!s) return null;
  return { code: s.code, name: s.name ?? s.code };
}

/**
 * Публичный метод: получить все приёмы для регистратуры.
 */
export async function getRegistrarAppointments(): Promise<RegistrarAppointmentRow[]> {
  const { appointments, ownersById, docsByAppointmentId, paymentsByAppointmentId } =
    await loadRawAppointments();

  return appointments.map((row) =>
    mapToRegistrarRow(row, ownersById, docsByAppointmentId, paymentsByAppointmentId)
  );
}

/**
 * Публичный метод: один приём по id.
 */
export async function getRegistrarAppointmentById(
  id: string
): Promise<RegistrarAppointmentRow | null> {
  if (!supabase) return null;

  const { appointments, ownersById, docsByAppointmentId, paymentsByAppointmentId } =
    await loadRawAppointments();

  const row = appointments.find((a) => String(a.id) === String(id));
  if (!row) return null;

  return mapToRegistrarRow(row, ownersById, docsByAppointmentId, paymentsByAppointmentId);
}

/**
 * Публичный метод: последние N приёмов (для дашборда регистратуры).
 */
export async function getRecentRegistrarAppointments(
  limit: number = 50
): Promise<RegistrarAppointmentRow[]> {
  const all = await getRegistrarAppointments();
  return all.slice(0, limit);
}

/**
 * Публичный метод: приёмы конкретного врача по doctor_id
 * (для кабинета врача).
 */
export async function getRegistrarAppointmentsForDoctor(
  doctorId: string
): Promise<RegistrarAppointmentRow[]> {
  const all = await getRegistrarAppointments();
  return all.filter((a) => a.doctorId === doctorId);
}
