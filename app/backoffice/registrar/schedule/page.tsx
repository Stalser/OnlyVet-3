"use client";

import { useEffect, useMemo, useState } from "react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { RegistrarHeader } from "@/components/registrar/RegistrarHeader";
import { supabase } from "@/lib/supabaseClient";
import { doctors } from "@/lib/data";
import Link from "next/link";

type SlotRow = {
  id: string;
  doctor_id: string;
  date: string;
  time_start: string;
  time_end: string;
  status: string;
  appointment_id: string | null;
};

export default function RegistrarSchedulePage() {
  const [doctorId, setDoctorId] = useState(doctors[0].id);
  const [statusFilter, setStatusFilter] = useState("all");
  const [periodFilter, setPeriodFilter] = useState("7"); // 7 days default
  const [slots, setSlots] = useState<SlotRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Create slot form
  const [date, setDate] = useState("");
  const [timeStart, setTimeStart] = useState("");
  const [timeEnd, setTimeEnd] = useState("");
  const [creating, setCreating] = useState(false);

  async function loadSlots() {
    setLoading(true);

    const { data, error } = await supabase
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
        }))
      );
    }

    setLoading(false);
  }

  useEffect(() => {
    loadSlots();
  }, [doctorId]);

  // Фильтрация по статусу
  const filteredByStatus = useMemo(() => {
    if (statusFilter === "all") return slots;
    return slots.filter((s) => s.status === statusFilter);
  }, [slots, statusFilter]);

  // Фильтрация по периоду
  const filteredByPeriod = useMemo(() => {
    if (periodFilter === "all") return filteredByStatus;

    const now = new Date();
    const end = new Date();

    if (periodFilter === "0") end.setDate(now.getDate());
    if (periodFilter === "7") end.setDate(now.getDate() + 7);
    if (periodFilter === "30") end.setDate(now.getDate() + 30);

    return filteredByStatus.filter((s) => {
      const d = new Date(s.date);
      return d >= now && d <= end;
    });
  }, [filteredByStatus, periodFilter]);

  // Группировка по дате
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

  // Создание слота
  async function createSlot() {
    if (!date || !timeStart || !timeEnd) return;

    setCreating(true);

    await supabase.from("doctor_slots").insert({
      doctor_id: doctorId,
      date,
      time_start: timeStart,
      time_end: timeEnd,
      status: "available",
      appointment_id: null,
    });

    setCreating(false);
    setDate("");
    setTimeStart("");
    setTimeEnd("");
    loadSlots();
  }

  // Удаление свободного слота
  async function deleteSlot(id: string) {
    await supabase.from("doctor_slots").delete().eq("id", id);
    loadSlots();
  }

  // Освобождение занятого слота
  async function freeSlot(id: string) {
    await supabase
      .from("doctor_slots")
      .update({ appointment_id: null, status: "available" })
      .eq("id", id);
    loadSlots();
  }

  return (
    <RoleGuard allowed={["registrar", "admin"]}>
      <main className="mx-auto max-w-6xl px-4 py-6 space-y-6">
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
              Управление рабочими слотами врачей. Определяет доступное время
              для записи.
            </p>
          </div>
          <RegistrarHeader />
        </header>

        {/* Фильтры */}
        <section className="rounded-2xl border bg-white p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Фильтр по врачу */}
            <div>
              <label className="mb-1 block text-[11px] text-gray-500">
                Врач
              </label>
              <select
                value={doctorId}
                onChange={(e) => setDoctorId(e.target.value)}
                className="w-full rounded-xl border px-2 py-1.5 text-xs"
              >
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Фильтр по статусу */}
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

            {/* Фильтр по периоду */}
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
                <option value="0">Сегодня</option>
                <option value="7">Ближайшие 7 дней</option>
                <option value="30">Ближайшие 30 дней</option>
              </select>
            </div>
          </div>
        </section>

        {/* Создание слота */}
        <section className="rounded-2xl border bg-white p-4 space-y-3">
          <h2 className="text-base font-semibold">Добавить слот</h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] text-gray-500 mb-1">
                Дата
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border px-2 py-1.5 text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] text-gray-500 mb-1">
                Время начала
              </label>
              <input
                type="time"
                value={timeStart}
                onChange={(e) => setTimeStart(e.target.value)}
                className="w-full rounded-xl border px-2 py-1.5 text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] text-gray-500 mb-1">
                Время конца
              </label>
              <input
                type="time"
                value={timeEnd}
                onChange={(e) => setTimeEnd(e.target.value)}
                className="w-full rounded-xl border px-2 py-1.5 text-xs"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={createSlot}
                disabled={creating}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                Добавить
              </button>
            </div>
          </div>
        </section>

        {/* Список слотов */}
        <section className="rounded-2xl border bg-white p-4 space-y-4">
          <h2 className="text-base font-semibold">Слоты врача</h2>

          {loading && (
            <p className="text-xs text-gray-500">Загрузка...</p>
          )}

          {!loading && grouped.length === 0 && (
            <p className="text-xs text-gray-500">
              Слотов не найдено. Добавьте новые.
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

                        {s.status === "available" && (
                          <button
                            onClick={() => deleteSlot(s.id)}
                            className="mt-1 text-[10px] font-medium text-red-600 hover:underline"
                          >
                            Удалить
                          </button>
                        )}

                        {s.status === "busy" && (
                          <button
                            onClick={() => freeSlot(s.id)}
                            className="mt-1 text-[10px] font-medium text-emerald-700 hover:underline"
                          >
                            Освободить
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
        </section>
      </main>
    </RoleGuard>
  );
}
