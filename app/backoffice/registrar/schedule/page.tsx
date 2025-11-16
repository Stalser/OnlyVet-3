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
  service_code: string | null;
};

export default function RegistrarSchedulePage() {
  const [specializationFilter, setSpecializationFilter] = useState("all");
  const [doctorId, setDoctorId] = useState(doctors[0].id);
  const [statusFilter, setStatusFilter] = useState("all");
  const [periodFilter, setPeriodFilter] = useState("7");
  const [viewMode, setViewMode] = useState<"list" | "calendar">("calendar");

  const [slots, setSlots] = useState<SlotRow[]>([]);
  const [loading, setLoading] = useState(true);

  // ---- СПЕЦИАЛИЗАЦИИ ----
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

  // ---- ВРАЧИ С УЧЁТОМ СПЕЦ ----
  const filteredDoctors = useMemo(() => {
    if (specializationFilter === "all") return doctors;
    return doctors.filter(
      (d: any) =>
        (d.specialization ?? "Общая практика") === specializationFilter
    );
  }, [specializationFilter]);

  // если выбранный врач не попадает под текущую спец – переключаемся на первого
  useEffect(() => {
    if (!filteredDoctors.find((d) => d.id === doctorId)) {
      if (filteredDoctors.length > 0) {
        setDoctorId(filteredDoctors[0].id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredDoctors]);

  // ---- ЗАГРУЗКА СЛОТОВ ----
  async function loadSlots() {
    setLoading(true);

    const client = supabase;
    if (!client) {
      setSlots([]);
      setLoading(false);
      return;
    }

    const { data, error } = await client
      .from("doctor_slots")
      .select("*")
      .eq("doctor_id", doctorId)
      .order("date", { ascending: true })
      .order("time_start", { ascending: true });

    if (!error && data) {
      setSlots(
        data.map((s: any) => ({
          id: String(s.id),
          doctor_id: s.doctor_id,
          date: s.date,
          time_start: s.time_start,
          time_end: s.time_end,
          status: s.status,
          appointment_id: s.appointment_id,
          service_code: s.service_code ?? null,
        }))
      );
    } else {
      setSlots([]);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadSlots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctorId]);

  // ---- ФИЛЬТРЫ ----
  const filteredByStatus = useMemo(() => {
    if (statusFilter === "all") return slots;
    return slots.filter((s) => s.status === statusFilter);
  }, [slots, statusFilter]);

  const filteredByPeriod = useMemo(() => {
    if (periodFilter === "all") return filteredByStatus;

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

    return filteredByStatus.filter((s) => {
      const d = new Date(s.date);
      d.setHours(0, 0, 0, 0);
      return d >= start && d <= end;
    });
  }, [filteredByStatus, periodFilter]);

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

  // ---- УСЛУГИ: цвета и названия ----
  const SERVICE_COLORS = [
    "bg-sky-50 text-sky-800 border-sky-300",
    "bg-pink-50 text-pink-800 border-pink-300",
    "bg-amber-50 text-amber-800 border-amber-300",
    "bg-lime-50 text-lime-800 border-lime-300",
    "bg-indigo-50 text-indigo-800 border-indigo-300",
  ];

  function getServiceName(code: string | null): string | null {
    if (!code) return null;
    const s = servicesPricing.find((sp: any) => sp.code === code);
    return s ? s.name : code;
  }

  function getServiceClasses(code: string | null): string {
    if (!code) return "bg-gray-100 text-gray-700 border-gray-300";
    const idx = servicesPricing.findIndex((s: any) => s.code === code);
    if (idx === -1) return "bg-gray-100 text-gray-700 border-gray-300";
    return SERVICE_COLORS[idx % SERVICE_COLORS.length];
  }

  // ---- РЕНДЕР ОДНОГО СЛОТА ----
  function renderSlotTile(s: SlotRow) {
    const isAvailable = s.status === "available";
    const isBusy = s.status === "busy";
    const hasService = !!s.service_code;
    const serviceName = getServiceName(s.service_code);

    // свободный слот
    if (isAvailable) {
      const params = new URLSearchParams({
        doctorId,
        date: s.date,
        time: s.time_start,
        ...(s.service_code ? { serviceCode: s.service_code } : {}),
      }).toString();

      const baseClasses =
        "rounded-xl border px-3 py-2 text-xs flex flex-col cursor-pointer";
      const color = hasService
        ? getServiceClasses(s.service_code)
        : "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100";

      return (
        <Link
          key={s.id}
          href={`/backoffice/registrar?${params}`}
        >
          <div className={`${baseClasses} ${color}`}>
            <div className="font-medium">
              {s.time_start}–{s.time_end}
            </div>
            <div className="text-[10px]">
              Свободно
              {serviceName ? ` · ${serviceName}` : ""}
            </div>
          </div>
        </Link>
      );
    }

    // занятый слот
    if (isBusy) {
      const baseClasses =
        "rounded-xl border px-3 py-2 text-xs flex flex-col";
      const color = hasService
        ? getServiceClasses(s.service_code)
        : "bg-gray-100 text-gray-700 border-gray-300";

      return (
        <div key={s.id} className={`${baseClasses} ${color}`}>
          <div className="font-medium">
            {s.time_start}–{s.time_end}
          </div>
          <div className="text-[10px]">
            Занято
            {serviceName ? ` · ${serviceName}` : ""}
          </div>
        </div>
      );
    }

    // недоступный слот
    return (
      <div
        key={s.id}
        className="rounded-xl border px-3 py-2 text-xs flex flex-col bg-red-50 text-red-700 border-red-300"
      >
        <div className="font-medium">
          {s.time_start}–{s.time_end}
        </div>
        <div className="text-[10px]">Недоступно</div>
      </div>
    );
  }

  return (
    <RoleGuard allowed={["registrar", "admin"]}>
      <main className="mx-auto max-w-6xl px-4 py-6 space-y-6">
        {/* Шапка */}
        <header className="flex items-center justify-between">
          <div>
            <Link
              href="/backoffice/registrar"
              className="text-xs text-gray-500 hover:underline hover:text-gray-700"
            >
              ← Назад к кабинету
            </Link>
            <h1 className="mt-2 text-2xl font-bold tracking-tight">
              Расписание врачей
            </h1>
            <p className="text-sm text-gray-500">
              Просмотр рабочих слотов врачей. Свободные слоты можно
              использовать для записи клиентов.
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <RegistrarHeader />
            <Link
              href="/backoffice/registrar/schedule/edit"
              className="text-[11px] font-medium text-emerald-700 hover:underline"
            >
              Редактировать расписание →
            </Link>
          </div>
        </header>

        {/* Фильтры + вид */}
        <section className="rounded-2xl border bg-white p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Левая часть — фильтры */}
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

              {/* Статус */}
              <div>
                <label className="mb-1 block text-[11px] text-gray-500">
                  Статус слотов
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

            {/* Правая часть — переключатель вида */}
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
        </section>

        {/* Режим: список */}
        {viewMode === "list" ? (
          <section className="rounded-2xl border bg-white p-4 space-y-4">
            <h2 className="text-base font-semibold">Слоты врача (список)</h2>

            {loading && (
              <p className="text-xs text-gray-500">Загрузка...</p>
            )}

            {!loading && grouped.length === 0 && (
              <p className="text-xs text-gray-500">
                Слотов не найдено. Возможно, расписание ещё не настроено.
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
                    {daySlots.map((s) => renderSlotTile(s))}
                  </div>
                </div>
              ))}
          </section>
        ) : (
          // Режим: календарь
          <section className="rounded-2xl border bg-white p-4 space-y-4">
            <h2 className="text-base font-semibold">
              Слоты врача (календарь)
            </h2>

            {loading && (
              <p className="text-xs text-gray-500">Загрузка...</p>
            )}

            {!loading && grouped.length === 0 && (
              <p className="text-xs text-gray-500">
                Слотов не найдено. Возможно, расписание ещё не настроено.
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
                        {daySlots.map((s) => renderSlotTile(s))}
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
