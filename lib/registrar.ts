export async function getRegistrarAppointments(
  doctorId?: string
): Promise<RegistrarAppointmentRow[]> {
  if (!supabase) return [];

  let query = supabase
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

  // 🔹 Если передан doctorId — фильтруем по врачу
  if (doctorId) {
    query = query.eq("doctor_id", doctorId);
  }

  const { data, error } = await query;

  if (error || !data) {
    console.error("getRegistrarAppointments error:", error);
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

    const clientName = "Без имени";
    const clientContact = "";

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
