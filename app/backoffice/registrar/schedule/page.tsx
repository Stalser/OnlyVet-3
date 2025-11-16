"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { RegistrarHeader } from "@/components/registrar/RegistrarHeader";
import { supabase } from "@/lib/supabaseClient";
import { doctors } from "@/lib/data";

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
  const [periodFilter, setPeriodFilter] = useState("7"); // 7 дней по умолчанию
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");

  const [slots, setSlots] = useState<SlotRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Создание одиночного слота
  const [date, setDate] = useState("");
  const [timeStart, setTimeStart] = useState("");
  const [timeEnd, setTimeEnd] = useState("");
  const [creating, setCreating] = useState(false);

  // Массовое создание слотов
  const [massStart, setMassStart] = useState("");
  const [massEnd, setMassEnd] = useState("");
  const [massTimeStart, setMassTimeStart] = useState("");
  const [massTimeEnd, setMassTimeEnd] = useState("");
  const [massWeekdays, setMassWeekdays] = useState<string[]>([
    "mon",
    "tue",
    "wed",
    "thu",
    "fri",
  ]);
  const [massStep, setMassStep] = useState("30");
  const [massMessage, setMassMessage] = useState("");

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

  // Фильтрация по статусу
  const filteredByStatus = useMemo(() => {
    if (statusFilter === "all") return slots;
    return slots.filter((s) => s.status === statusFilter);
  }, [slots, statusFilter]);

  // Фильтрация по периоду
  const filteredByPeriod = useMemo(() => {
    if (periodFilter === "all") return filteredByStatus;

    const now = new Date();
    const start = new Date(now);
    const end = new Date(now);

    if (periodFilter === "0") {
      // сегодня
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

  // Группировка по дате (для списка и календаря)
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

  // Создание одиночного слота
  async function createSlot() {
    if (!date || !timeStart || !timeEnd) return;

    const client = supabase;
    if (!client) return;

    setCreating(true);

    await client.from("doctor_slots").insert({
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
    const client = supabase;
    if (!client) return;

    await client.from("doctor_slots").delete().eq("id", id);
    loadSlots();
  }

  // Освобождение занятого слота
  async function freeSlot(id: string) {
    const client = supabase;
    if (!client) return;

    await client
      .from("doctor_slots")
      .update({ appointment_id: null, status: "available" })
      .eq("id", id);
    loadSlots();
  }

  // Массовое создание слотов
  async function handleMassGenerate() {
    setMassMessage("");

    if (!massStart || !massEnd || !massTimeStart || !massTimeEnd) {
      setMassMessage("Заполните период и диапазон времени.");
      return;
    }

    const client = supabase;
    if (!client) {
      setMassMessage("Supabase недоступен.");
      return;
    }

    const start = new Date(massStart);
    const end = new Date(massEnd);
    if (start > end) {
      setMassMessage("Дата начала не может быть позже даты окончания.");
      return;
    }

    const stepMinutes = parseInt(massStep, 10);
    if (Number.isNaN(stepMinutes) || stepMinutes <= 0) {
      setMassMessage("Неверный шаг по времени.");
      return;
    }

    const weekdayKeys = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
    let created = 0;

    for (
      let d = new Date(start);
      d.getTime() <= end.getTime();
      d.setDate(d.getDate() + 1)
    ) {
      const weekday = weekdayKeys[d.getDay()];
      if (!massWeekdays.includes(weekday)) continue;

      const dateStr = d.toISOString().split("T")[0];

      let cur = massTimeStart;
      while (cur < massTimeEnd) {
        const [h, m] = cur.split(":").map(Number);
        const curDate = new Date(d);
        curDate.setHours(h, m + stepMinutes, 0, 0);

        const next = curDate.toTimeString().slice(0, 5); // HH:MM
        if (next <= cur || next > massTimeEnd) break;

        await client.from("doctor_slots").insert({
          doctor_id: doctorId,
          date: dateStr,
          time_start: cur,
          time_end: next,
          status: "available",
          appointment_id: null,
        });

        created += 1;
        cur = next;
      }
    }

    setMassMessage(`Создано слотов: ${created}`);
    loadSlots();
  }

  // Автозаполнение: будни, ближайшие 7 дней, 10:00–18:00, шаг 60 мин
  async function handleAutoWeek() {
    setMassMessage("");

    const client = supabase;
    if (!client) {
      setMassMessage("Supabase недоступен.");
      return;
    }

    const now = new Date();
    const start = new Date(now);
    const end = new Date(now);
    end.setDate(now.getDate() + 6);

    const weekdayKeys = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
    const autoWeekdays = ["mon", "tue", "wed", "thu", "fri"];

    const timeFrom = "10:00";
    const timeTo = "18:00";
    const stepMinutes = 60;

    let created = 0;

    for (
      let d = new Date(start);
      d.getTime() <= end.getTime();
      d.setDate(d.getDate() + 1)
    ) {
      const weekday = weekdayKeys[d.getDay()];
      if (!autoWeekdays.includes(weekday)) continue;

      const dateStr = d.toISOString().split("T")[0];

      let cur = timeFrom;
      while (cur < timeTo) {
        const [h, m] = cur.split(":").map(Number);
        const curDate = new Date(d);
        curDate.setHours(h, m + stepMinutes, 0, 0);

        const next = curDate.toTimeString().slice(0, 5);
        if (next <= cur || next > timeTo) break;

        await client.from("doctor_slots").insert({
          doctor_id: doctorId,
          date: dateStr,
          time_start: cur,
          time_end: next,
          status: "available",
          appointment_id: null,
        });

        created += 1;
        cur = next;
      }
    }

    setMassMessage(
      `Автоматически создано слотов на неделю для выбранного врача: ${created}`
    );
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

        {/* Фильтры + переключатель вида */}
        <section className="rounded-2xl border bg-white p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full md:w-auto md:flex-1">
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
                  {doctors.map((d) => (
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
        </section>

        {/* Создание одиночного слота */}
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
                type="button"
                onClick={createSlot}
                disabled={creating}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                Добавить
              </button>
            </div>
          </div>
        </section>

        {/* МАССОВОЕ СОЗДАНИЕ СЛОТОВ + автонеделя */}
        <section className="rounded-2xl border bg-white p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">
                Массовое создание слотов
              </h2>
              <p className="text-xs text-gray-500">
                Быстрое создание расписания врача на нужный период.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAutoWeek}
              className="rounded-xl border border-emerald-600 px-3 py-1.5 text-[11px] font-medium text-emerald-700 hover:bg-emerald-50"
            >
              Авто: будни 10–18 (7 дней)
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Период дат */}
            <div>
              <label className="block text-[11px] text-gray-500 mb-1">
                Период: с
              </label>
              <input
                type="date"
                value={massStart}
                onChange={(e) => setMassStart(e.target.value)}
                className="w-full rounded-xl border px-2 py-1.5 text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] text-gray-500 mb-1">
                по
              </label>
              <input
                type="date"
                value={massEnd}
                onChange={(e) => setMassEnd(e.target.value)}
                className="w-full rounded-xl border px-2 py-1.5 text-xs"
              />
            </div>

            {/* Диапазон времени */}
            <div>
              <label className="block text-[11px] text-gray-500 mb-1">
                Время: от
              </label>
              <input
                type="time"
                value={massTimeStart}
                onChange={(e) => setMassTimeStart(e.target.value)}
                className="w-full rounded-xl border px-2 py-1.5 text-xs"
              />
              <label className="block text-[11px] text-gray-500 mb-1 mt-2">
                до
              </label>
              <input
                type="time"
                value={massTimeEnd}
                onChange={(e) => setMassTimeEnd(e.target.value)}
                className="w-full rounded-xl border px-2 py-1.5 text-xs"
              />
            </div>
          </div>

          {/* Дни недели */}
          <div className="space-y-1">
            <div className="text-[11px] text-gray-500">Дни недели</div>
            <div className="flex flex-wrap gap-2 text-xs">
              {[
                ["mon", "Пн"],
                ["tue", "Вт"],
                ["wed", "Ср"],
                ["thu", "Чт"],
                ["fri", "Пт"],
                ["sat", "Сб"],
                ["sun", "Вс"],
              ].map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() =>
                    setMassWeekdays((prev) =>
                      prev.includes(key)
                        ? prev.filter((d) => d !== key)
                        : [...prev, key]
                    )
                  }
                  className={`px-3 py-1 rounded-full border ${
                    massWeekdays.includes(key)
                      ? "bg-emerald-50 border-emerald-600 text-emerald-700"
                      : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Шаг */}
          <div>
            <label className="block text-[11px] text-gray-500 mb-1">
              Шаг, минут
            </label>
            <select
              value={massStep}
              onChange={(e) => setMassStep(e.target.value)}
              className="w-32 rounded-xl border px-2 py-1.5 text-xs"
            >
              <option value="15">15 минут</option>
              <option value="20">20 минут</option>
              <option value="30">30 минут</option>
              <option value="60">60 минут</option>
            </select>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleMassGenerate}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-700"
            >
              Создать слоты
            </button>
          </div>

          {massMessage && (
            <p className="text-xs text-emerald-700 pt-2">{massMessage}</p>
          )}
        </section>

        {/* Список или календарь слотов */}
        {viewMode === "list" ? (
          <section className="rounded-2xl border bg-white p-4 space-y-4">
            <h2 className="text-base font-semibold">Слоты врача (список)</h2>

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
                      const isAvailable = s.status === "available";
                      const isBusy = s.status === "busy";

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
                            {s.status === "busy" &&
                              "Занято (есть консультация)"}
                            {s.status === "unavailable" && "Недоступно"}
                          </div>

                          {isAvailable && (
                            <button
                              type="button"
                              onClick={() => deleteSlot(s.id)}
                              className="mt-1 text-[10px] font-medium text-red-600 hover:underline"
                            >
                              Удалить
                            </button>
                          )}

                          {isBusy && (
                            <button
                              type="button"
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
        ) : (
          <section className="rounded-2xl border bg-white p-4 space-y-4">
            <h2 className="text-base font-semibold">
              Слоты врача (календарь)
            </h2>

            {loading && (
              <p className="text-xs text-gray-500">Загрузка...</p>
            )}

            {!loading && grouped.length === 0 && (
              <p className="text-xs text-gray-500">
                Слотов не найдено. Добавьте новые.
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
                          const isAvailable = s.status === "available";
                          const isBusy = s.status === "busy";

                          const color =
                            s.status === "available"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                              : s.status === "busy"
                              ? "bg-gray-100 text-gray-700 border-gray-300"
                              : "bg-red-50 text-red-700 border-red-300";

                          return (
                            <div
                              key={s.id}
                              className={`rounded-xl border px-2 py-1 text-[11px] ${color}`}
                            >
                              <div className="font-medium">
                                {s.time_start}–{s.time_end}
                              </div>
                              <div className="text-[10px] text-gray-500">
                                {isAvailable && "Свободно"}
                                {isBusy && "Занято"}
                                {s.status === "unavailable" &&
                                  "Недоступно"}
                              </div>
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
