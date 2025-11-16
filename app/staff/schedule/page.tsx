"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { RegistrarHeader } from "@/components/registrar/RegistrarHeader";
import { supabase } from "@/lib/supabaseClient";
import { doctors } from "@/lib/data";
import { servicesPricing } from "@/lib/pricing";

type SlotRow = {
  id: string;
  doctor_id: string;
  date: string;
  time_start: string;
  time_end: string;
  status: string;
  appointment_id: string | null;
  serviceCode?: string | null;
};

export default function StaffSchedulePage() {
  const [doctorId, setDoctorId] = useState(doctors[0].id);
  const [statusFilter, setStatusFilter] = useState("all");
  const [periodFilter, setPeriodFilter] = useState("7");
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");

  const [specializationFilter, setSpecializationFilter] = useState("all");
  const [serviceFilter, setServiceFilter] = useState("all");

  const [slots, setSlots] = useState<SlotRow[]>([]);
  const [loading, setLoading] = useState(true);

  // --- специализации из doctors ---
  const specializations = useMemo(
    () =>
      Array.from(
        new Set(
          doctors.map(
            (d: any) => d.specialization ?? "Общая практика"
          )
        )
      ),
    []
  );

  // врачи с учётом специализации
  const filteredDoctors = useMemo(() => {
    if (specializationFilter === "all") return doctors;
    return doctors.filter(
      (d: any) =>
        (d.specialization ?? "Общая практика") === specializationFilter
    );
  }, [specializationFilter]);

  // если текущий doctorId не подходит под фильтр спец. — подставляем первого доступного
  useEffect(() => {
    if (!filteredDoctors.find((d) => d.id === doctorId)) {
      if (filteredDoctors.length > 0) {
        setDoctorId(filteredDoctors[0].id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredDoctors]);

  async function loadSlots() {
    setLoading(true);

    const client = supabase;
    if (!client) {
      setSlots([]);
      setLoading(false);
      return;
    }

    // 1. слоты врача
    const { data, error } = await client
      .from("doctor_slots")
      .select("*")
      .eq("doctor_id", doctorId)
      .order("date", { ascending: true })
      .order("time_start", { ascending: true });

    if (error || !data) {
      setSlots([]);
      setLoading(false);
      return;
    }

    // 2. подтягиваем услуги для занятых слотов
    const apptIds = data
      .map((s: any) => s.appointment_id)
      .filter((id: any) => id !== null);

    let apptMap: Record<string, string | null> = {};
    if (apptIds.length > 0) {
      const { data: appts, error: apptsError } = await client
        .from("appointments")
        .select("id, service_code")
        .in("id", apptIds);

      if (!apptsError && appts) {
        appts.forEach((a: any) => {
          apptMap[String(a.id)] = a.service_code ?? null;
        });
      }
    }

    setSlots(
      data.map((s: any) => ({
        id: String(s.id),
        doctor_id: s.doctor_id,
        date: s.date,
        time_start: s.time_start,
        time_end: s.time_end,
        status: s.status,
        appointment_id: s.appointment_id,
        serviceCode:
          s.appointment_id != null
            ? apptMap[String(s.appointment_id)] ?? null
            : null,
      }))
    );

    setLoading(false);
  }

  useEffect(() => {
    loadSlots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctorId]);

  // === фильтр по статусу ===
  const filteredByStatus = useMemo(() => {
    if (statusFilter === "all") return slots;
    return slots.filter((s) => s.status === statusFilter);
  }, [slots, statusFilter]);

  // === фильтр по услуге ===
  const filteredByService = useMemo(() => {
    if (serviceFilter === "all") return filteredByStatus;

    // логика: показываем только ЗАНЯТЫЕ слоты с выбранной услугой
    return filteredByStatus.filter(
      (s) => s.status === "busy" && s.serviceCode === serviceFilter
    );
  }, [filteredByStatus, serviceFilter]);

  // === фильтр по периоду ===
  const filteredByPeriod = useMemo(() => {
    if (periodFilter === "all") return filteredByService;

    const now = new Date();
    const start = new Date(now);
    const end = new Date(now);

    if (periodFilter === "0") {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (periodFilter === "7") {
      end.setDate(now.getDate() + 7);
    } else if (periodFilter === "30") {
      end.setDate(now.getDate() + 30);
    }

    return filteredByService.filter((s) => {
      const d = new Date(s.date);
      d.setHours(0, 0, 0, 0);
      return d >= start && d <= end;
    });
  }, [filteredByService, periodFilter]);

  // === группировка по дате ===
  const grouped = useMemo(() => {
    const map = new Map<string, SlotRow[]>();
    filteredByPeriod.forEach((s) => {
      if (!map.has(s.date)) map.set(s.date, []);
      map.get(s.date)!.push(s);
    });

    return Array.from(map.entries()).sort(
      ([d1], [d2]) => new Date(d1).getTime() - new Date(d2).getTime()
    );
  }, [filteredByPeriod]);

  return (
    <RoleGuard allowed={["vet", "admin"]}>
      <main className="mx-auto max-w-6xl px-4 py-6 space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <Link
              href="/staff"
              className="text-xs text-gray-500 hover:underline hover:text-gray-700"
            >
              ← Назад в кабинет врача
            </Link>
            <h1 className="mt-2 text-2xl font-bold tracking-tight">
              Расписание приёмов
            </h1>
            <p className="text-sm text-gray-500">
              Просмотр слотов расписания. Редактирование выполняется
              регистратурой.
            </p>
          </div>
          <RegistrarHeader />
        </header>

        {/* Фильтры + вид */}
        <section className="rounded-2xl border bg-white p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 w-full md:w-auto md:flex-1">
              {/* Специализация */}
              <div>
                <label className="mb-1 block text-[11px] text-gray-500">
                  Специализация
                </label>
                <select
                  value={specializationFilter}
                  onChange={(e) => setSpecializationFilter(e.target.value)}
                  className="w-full rounded-xl border px-2 py-1.5 text-xs"
                >
                  <option value="all">Все специализации</option>
                  {specializations.map((sp) => (
                    <option key={sp} value={sp}>
                      {sp}
                    </option>
                  ))}
                </select>
              </div>

              {/* Врач */}
              <div>
                <label className="mb-1 block text-[11px] text-gray-500">
                  Врач
                </label>
                <select
                  value={doctorId}
                  onChange={(e) => setDoctorId(e.target.value)}
                  className="w-full rounded-xl border px-2 py-1.5 text-xs"
                >
                  {filteredDoctors.map((d: any) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Услуга */}
              <div>
                <label className="mb-1 block text-[11px] text-gray-500">
                  Услуга
                </label>
                <select
                  value={serviceFilter}
                  onChange={(e) => setServiceFilter(e.target.value)}
                  className="w-full rounded-xl border px-2 py-1.5 text-xs"
                >
                  <option value="all">Все услуги</option>
                  {servicesPricing.map((s: any) => (
                    <option key={s.code} value={s.code}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Период */}
              <div>
                <label className="mb-1 block text-[11px] text-gray-500">
                  Период
                </label>
                <select
                  value={periodFilter}
                  onChange={(e) => setPeriodFilter(e.target.value)}
                  className="w-full rounded-xl border px-2 py-1.5 text-xs"
                >
                  <option value="all">Все даты</option>
                  <option value="0">Только сегодня</option>
                  <option value="7">Ближайшие 7 дней</option>
                  <option value="30">Ближайшие 30 дней</option>
                </select>
              </div>
            </div>

            {/* Статус + вид */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Статус */}
              <div>
                <label className="mb-1 block text-[11px] text-gray-500">
                  Статус
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full rounded-xl border px-2 py-1.5 text-xs"
                >
                  <option value="all">Все</option>
                  <option value="available">Свободные</option>
                  <option value="busy">Занятые</option>
                  <option value="unavailable">Недоступные</option>
                </select>
              </div>

              {/* Переключатель вида */}
              <div className="inline-flex rounded-xl bg-gray-100 p-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`px-3 py-1.5 rounded-lg ${
                    viewMode === "list"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  Список
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("calendar")}
                  className={`px-3 py-1.5 rounded-lg ${
                    viewMode === "calendar"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  Календарь
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Режим: список */}
        {viewMode === "list" ? (
          <section className="rounded-2xl border bg-white p-4 space-y-4">
            <h2 className="text-base font-semibold">Слоты врача (список)</h2>

            {loading && (
              <p className="text-xs text-gray-500">Загрузка...</p>
            )}

            {!loading && grouped.length === 0 && (
              <p className="text-xs text_gray-500">
                Слотов не найдено. Расписание ещё не настроено в кабинете
                регистратуры или фильтры слишком узкие.
              </p>
            )}

            {!loading &&
              grouped.map(([day, daySlots]) => (
                <div key={day} className="space-y-2">
                  <div className="text-xs font-semibold text-gray-700 border-b pb-1">
                    {new Date(day).toLocaleDateString("ru-RU", {
                      weekday: "long",
                      day: "2-digit",
                      month: "2-digit",
                    })}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {daySlots.map((s) => {
                      const color =
                        s.status === "available"
                          ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                          : s.status === "busy"
                          ? "bg-gray-100 text-gray-700 border-gray-300"
                          : "bg-red-50 text-red-700 border-red-300";

                      const serviceName =
                        s.serviceCode &&
                        servicesPricing.find(
                          (sp: any) => sp.code === s.serviceCode
                        )?.name;

                      return (
                        <div
                          key={s.id}
                          className={`rounded-xl border px-3 py-2 text-xs flex flex-col ${color}`}
                        >
                          <div className="font-medium">
                            {s.time_start}–{s.time_end}
                          </div>
                          <div className="text-[10px] text-gray-500">
                            {s.status === "available" && "Свободно"}
                            {s.status === "busy" && "Занято"}
                            {s.status === "unavailable" && "Недоступно"}
                          </div>
                          {s.status === "busy" && s.serviceCode && (
                            <div className="text-[10px] text-gray-600 mt-0.5">
                              Услуга: {serviceName || s.serviceCode}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
          </section>
        ) : (
          /* Режим: календарь */
          <section className="rounded-2xl border bg-white p-4 space-y-4">
            <h2 className="text-base font-semibold">
              Слоты врача (календарь)
            </h2>

            {loading && (
              <p className="text-xs text-gray-500">Загрузка...</p>
            )}

            {!loading && grouped.length === 0 && (
              <p className="text-xs text-gray-500">
                Слотов не найдено. Расписание ещё не настроено в кабинете
                регистратуры или фильтры слишком узкие.
              </p>
            )}

            {!loading && grouped.length > 0 && (
              <div className="overflow-x-auto">
                <div className="flex gap-3 min-w-full">
                  {grouped.map(([day, daySlots]) => (
                    <div
                      key={day}
                      className="min-w-[140px] rounded-2xl border bg-gray-50 p-2 flex-1"
                    >
                      <div className="mb-2 border-b pb-1 text-center text-[11px] font-semibold text-gray-700">
                        {new Date(day).toLocaleDateString("ru-RU", {
                          weekday: "short",
                          day: "2-digit",
                          month: "2-digit",
                        })}
                      </div>
                      <div className="space-y-1">
                        {daySlots.map((s) => {
                          const color =
                            s.status === "available"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                              : s.status === "busy"
                              ? "bg-gray-100 text-gray-700 border-gray-300"
                              : "bg-red-50 text-red-700 border-red-300";

                          const serviceName =
                            s.serviceCode &&
                            servicesPricing.find(
                              (sp: any) => sp.code === s.serviceCode
                            )?.name;

                          return (
                            <div
                              key={s.id}
                              className={`rounded-xl border px-2 py-1 text-[11px] ${color}`}
                            >
                              <div className="font-medium">
                                {s.time_start}–{s.time_end}
                              </div>
                              <div className="text-[10px] text-gray-500">
                                {s.status === "available" && "Свободно"}
                                {s.status === "busy" && "Занято"}
                                {s.status === "unavailable" && "Недоступно"}
                              </div>
                              {s.status === "busy" && s.serviceCode && (
                                <div className="text-[10px] text-gray-600 mt-0.5">
                                  {serviceName || s.serviceCode}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}
      </main>
    </RoleGuard>
  );
}
