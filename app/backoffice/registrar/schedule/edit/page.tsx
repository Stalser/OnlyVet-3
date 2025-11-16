"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { RegistrarHeader } from "@/components/registrar/RegistrarHeader";
import { supabase } from "@/lib/supabaseClient";
import { doctors } from "@/lib/data";
import { servicesPricing } from "@/lib/pricing";

type Slot = {
  id: string;
  doctor_id: string;
  date: string;
  time_start: string;
  time_end: string;
  status: string;
  appointment_id: string | null;
  service_code: string | null;
};

export default function RegistrarScheduleEditPage() {
  // фильтр по специализации
  const [specializationFilter, setSpecializationFilter] = useState("all");

  // врач
  const [doctorId, setDoctorId] = useState(doctors[0].id);

  // фильтры статуса и периода
  const [statusFilter, setStatusFilter] = useState("all");
  const [periodFilter, setPeriodFilter] = useState("7");

  // слоты
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);

  // сообщения
  const [editMessage, setEditMessage] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  // одиночный слот
  const [date, setDate] = useState("");
  const [timeStart, setTimeStart] = useState("");
  const [timeEnd, setTimeEnd] = useState("");
  const [singleServiceCode, setSingleServiceCode] = useState<string>("");
  const [creating, setCreating] = useState(false);

  // массовое создание
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
  const [massServiceCode, setMassServiceCode] = useState<string>("");
  const [massMessage, setMassMessage] = useState("");

  // ---------------------- СПЕЦИАЛИЗАЦИИ ----------------------

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

  const filteredDoctors = useMemo(() => {
    if (specializationFilter === "all") return doctors;
    return doctors.filter(
      (d: any) =>
        (d.specialization ?? "Общая практика") === specializationFilter
    );
  }, [specializationFilter]);

  // если выбранный врач не попадает в отфильтрованный список — берём первого
  useEffect(() => {
    if (!filteredDoctors.find((d) => d.id === doctorId)) {
      if (filteredDoctors.length > 0) {
        setDoctorId(filteredDoctors[0].id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredDoctors]);

  // ---------------------- ЗАГРУЗКА СЛОТОВ ----------------------

  async function loadSlots() {
    setLoading(true);
    setEditMessage(null);
    setEditError(null);

    const client = supabase;
    if (!client) {
      setSlots([]);
      setLoading(false);
      setEditError("Supabase недоступен.");
      return;
    }

    const { data, error } = await client
      .from("doctor_slots")
      .select("*")
      .eq("doctor_id", doctorId)
      .order("date", { ascending: true })
      .order("time_start", { ascending: true });

    if (error) {
      console.error(error);
      setSlots([]);
      setEditError("Ошибка при загрузке слотов расписания.");
      setLoading(false);
      return;
    }

    setSlots(
      (data || []).map((s: any) => ({
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
    setLoading(false);
  }

  useEffect(() => {
    loadSlots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctorId]);

  // ---------------------- ФИЛЬТРЫ + ГРУППИРОВКА ----------------------

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
    const map = new Map<string, Slot[]>();
    filteredByPeriod.forEach((s) => {
      if (!map.has(s.date)) map.set(s.date, []);
      map.get(s.date)!.push(s);
    });

    return Array.from(map.entries()).sort(
      ([d1], [d2]) => new Date(d1).getTime() - new Date(d2).getTime()
    );
  }, [filteredByPeriod]);

  // ---------------------- ДЕЙСТВИЯ: удалить / освободить ----------------------

  async function deleteSlot(id: string) {
    const client = supabase;
    if (!client) {
      setEditError("Supabase недоступен.");
      return;
    }
    setEditMessage(null);
    setEditError(null);

    const { error } = await client.from("doctor_slots").delete().eq("id", id);
    if (error) {
      console.error(error);
      setEditError("Не удалось удалить слот.");
    } else {
      setEditMessage("Слот удалён.");
    }
    loadSlots();
  }

  async function freeSlot(id: string) {
    const client = supabase;
    if (!client) {
      setEditError("Supabase недоступен.");
      return;
    }
    setEditMessage(null);
    setEditError(null);

    const { error } = await client
      .from("doctor_slots")
      .update({ appointment_id: null, status: "available" })
      .eq("id", id);

    if (error) {
      console.error(error);
      setEditError("Не удалось освободить слот.");
    } else {
      setEditMessage("Слот отмечен как свободный.");
    }
    loadSlots();
  }

  // Массовое удаление свободных слотов по текущему фильтру
  async function deleteAvailableFiltered() {
    const client = supabase;
    if (!client) {
      setEditError("Supabase недоступен.");
      return;
    }
    setEditMessage(null);
    setEditError(null);

    const ids = filteredByPeriod
      .filter((s) => s.status === "available")
      .map((s) => s.id);

    if (ids.length === 0) {
      setEditMessage("Нет свободных слотов в текущем фильтре для удаления.");
      return;
    }

    const { error } = await client
      .from("doctor_slots")
      .delete()
      .in("id", ids);

    if (error) {
      console.error(error);
      setEditError("Не удалось массово удалить слоты.");
    } else {
      setEditMessage(`Удалено свободных слотов: ${ids.length}`);
    }
    loadSlots();
  }

  // ---------------------- ОДИНОЧНЫЙ СЛОТ ----------------------

  async function createSlot() {
    if (!date || !timeStart || !timeEnd) {
      setEditError("Укажите дату и время для слота.");
      setEditMessage(null);
      return;
    }

    const client = supabase;
    if (!client) {
      setEditError("Supabase недоступен.");
      setEditMessage(null);
      return;
    }

    setCreating(true);
    setEditError(null);
    setEditMessage(null);

    const { error } = await client.from("doctor_slots").insert({
      doctor_id: doctorId,
      date,
      time_start: timeStart,
      time_end: timeEnd,
      status: "available",
      appointment_id: null,
      service_code: singleServiceCode || null,
    });

    setCreating(false);

    if (error) {
      console.error(error);
      setEditError("Не удалось добавить слот.");
    } else {
      setEditMessage("Слот добавлен.");
      setDate("");
      setTimeStart("");
      setTimeEnd("");
      setSingleServiceCode("");
      loadSlots();
    }
  }

  // ---------------------- МАССОВОЕ СОЗДАНИЕ ----------------------

  async function handleMassGenerate() {
    setMassMessage("");
    setEditError(null);
    setEditMessage(null);

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
    const step = parseInt(massStep, 10);

    if (start > end) {
      setMassMessage("Дата начала позже даты окончания.");
      return;
    }

    if (Number.isNaN(step) || step <= 0) {
      setMassMessage("Некорректный шаг времени.");
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
        const next = new Date(d);
        next.setHours(h, m + step);

        const endStr = next.toTimeString().slice(0, 5);
        if (endStr <= cur || endStr > massTimeEnd) break;

        const { error } = await client.from("doctor_slots").insert({
          doctor_id: doctorId,
          date: dateStr,
          time_start: cur,
          time_end: endStr,
          status: "available",
          appointment_id: null,
          service_code: massServiceCode || null,
        });

        if (error) {
          console.error(error);
          setMassMessage(
            `Ошибка при создании слотов. Некоторые могли быть созданы (успешно: ${created}).`
          );
          loadSlots();
          return;
        }

        created += 1;
        cur = endStr;
      }
    }

    setMassMessage(`Создано слотов: ${created}`);
    loadSlots();
  }

  async function handleAutoWeek() {
    setMassMessage("");
    setEditError(null);
    setEditMessage(null);

    const now = new Date();
    const startStr = now.toISOString().split("T")[0];
    const end = new Date(now);
    end.setDate(now.getDate() + 6);
    const endStr = end.toISOString().split("T")[0];

    setMassStart(startStr);
    setMassEnd(endStr);
    setMassTimeStart("10:00");
    setMassTimeEnd("18:00");
    setMassWeekdays(["mon", "tue", "wed", "thu", "fri"]);
    setMassStep("60");

    await handleMassGenerate();
  }

  // ---------------------- УСЛУГА: имя ----------------------

  function getServiceName(code: string | null) {
    if (!code) return null;
    const found = servicesPricing.find((s: any) => s.code === code);
    return found ? found.name : code;
  }

  // ---------------------- RENDER ----------------------

  return (
    <RoleGuard allowed={["registrar", "admin"]}>
      <main className="mx-auto max-w-6xl px-4 py-6 space-y-6">
        {/* ШАПКА */}
        <header className="flex items-center justify-between">
          <div>
            <Link
              href="/backoffice/registrar/schedule"
              className="text-xs text-gray-500 hover:underline hover:text-gray-700"
            >
              ← Назад к расписанию
            </Link>
            <h1 className="mt-2 text-2xl font-bold tracking-tight">
              Редактирование расписания
            </h1>
            <p className="text-sm text-gray-500">
              Здесь регистратура создаёт, массово генерирует и редактирует
              слоты расписания врачей, включая привязку услуг к окнам.
            </p>
          </div>
          <RegistrarHeader />
        </header>

        {/* Сообщения по действиям */}
        {(editMessage || editError) && (
          <section className="rounded-2xl border bg-white p-3 text-xs">
            {editMessage && (
              <div className="text-emerald-700">{editMessage}</div>
            )}
            {editError && (
              <div className="text-red-700">{editError}</div>
            )}
          </section>
        )}

        {/* ФИЛЬТРЫ */}
        <section className="rounded-2xl border bg-white p-4 space-y-4">
          <h2 className="text-base font-semibold">Фильтры</h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Специализация */}
            <div>
              <label className="text-[11px] text-gray-500">
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
              <label className="text-[11px] text-gray-500">Врач</label>
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
              <label className="text-[11px] text-gray-500">
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
              <label className="text-[11px] text-gray-500">Период</label>
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
        </section>

        {/* ОДИНОЧНЫЙ СЛОТ */}
        <section className="rounded-2xl border bg-white p-4 space-y-3">
          <h2 className="text-base font-semibold">Добавить слот</h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="text-[11px] text-gray-500">Дата</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border px-2 py-1.5 text-xs"
              />
            </div>

            <div>
              <label className="text-[11px] text-gray-500">
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
              <label className="text-[11px] text-gray-500">
                Время конца
              </label>
              <input
                type="time"
                value={timeEnd}
                onChange={(e) => setTimeEnd(e.target.value)}
                className="w-full rounded-xl border px-2 py-1.5 text-xs"
              />
            </div>

            <div>
              <label className="text-[11px] text-gray-500">
                Услуга слота
              </label>
              <select
                value={singleServiceCode}
                onChange={(e) => setSingleServiceCode(e.target.value)}
                className="w-full rounded-xl border px-2 py-1.5 text-xs"
              >
                <option value="">Без привязки</option>
                {servicesPricing.map((s: any) => (
                  <option key={s.code} value={s.code}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={createSlot}
              disabled={creating}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              Добавить слот
            </button>
          </div>
        </section>

        {/* МАССОВОЕ СОЗДАНИЕ */}
        <section className="rounded-2xl border bg-white p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold">
                Массовое создание слотов
              </h2>
              <p className="text-xs text-gray-500">
                Расписание врача на период с указанной услугой.
              </p>
            </div>
            <button
              onClick={handleAutoWeek}
              className="rounded-xl border border-emerald-600 px-3 py-1.5 text-[11px] font-medium text-emerald-700 hover:bg-emerald-50"
            >
              Авто: будни 10–18 (7 дней)
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] text-gray-500">С</label>
              <input
                type="date"
                value={massStart}
                onChange={(e) => setMassStart(e.target.value)}
                className="w-full rounded-xl border px-2 py-1.5 text-xs"
              />
            </div>
            <div>
              <label className="text-[11px] text-gray-500">По</label>
              <input
                type="date"
                value={massEnd}
                onChange={(e) => setMassEnd(e.target.value)}
                className="w-full rounded-xl border px-2 py-1.5 text-xs"
              />
            </div>
            <div>
              <label className="text-[11px] text-gray-500">
                Время: от
              </label>
              <input
                type="time"
                value={massTimeStart}
                onChange={(e) => setMassTimeStart(e.target.value)}
                className="w-full rounded-xl border px-2 py-1.5 text-xs"
              />
              <label className="text-[11px] text-gray-500 mt-2">
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

          <div>
            <label className="block text-[11px] text-gray-500 mb-1">
              Дни недели
            </label>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-gray-500">
                Шаг (мин)
              </label>
              <select
                value={massStep}
                onChange={(e) => setMassStep(e.target.value)}
                className="w-24 rounded-xl border px-2 py-1.5 text-xs"
              >
                <option value="15">15</option>
                <option value="20">20</option>
                <option value="30">30</option>
                <option value="60">60</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] text-gray-500">
                Услуга для слотов
              </label>
              <select
                value={massServiceCode}
                onChange={(e) => setMassServiceCode(e.target.value)}
                className="w-full rounded-xl border px-2 py-1.5 text-xs"
              >
                <option value="">Без привязки</option>
                {servicesPricing.map((s: any) => (
                  <option key={s.code} value={s.code}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-2">
            <button
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

        {/* Список слотов + массовое удаление */}
        <section className="rounded-2xl border bg-white p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Существующие слоты</h2>
            <button
              onClick={deleteAvailableFiltered}
              className="rounded-xl border border-red-500 px-3 py-1.5 text-[11px] font-medium text-red-600 hover:bg-red-50"
            >
              Удалить все свободные в текущем фильтре
            </button>
          </div>

          {loading && (
            <p className="text-xs text-gray-500">Загрузка…</p>
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
                    day: "2-дigits",
                    month: "2-дigits",
                  })}
                </div>

                <div className="flex flex-wrap gap-2">
                  {daySlots.map((s) => {
                    const isAvailable = s.status === "available";
                    const isBusy = s.status === "busy";

                    const baseColor =
                      s.status === "available"
                        ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                        : s.status === "busy"
                        ? "bg-gray-100 text-gray-700 border-gray-300"
                        : "bg-red-50 text-red-700 border-red-300";

                    const serviceName = getServiceName(s.service_code);

                    return (
                      <div
                        key={s.id}
                        className={`rounded-xl border px-3 py-2 text-xs flex flex-col ${baseColor}`}
                      >
                        <div className="font-medium">
                          {s.time_start}–{s.time_end}
                        </div>
                        <div className="text-[10px] text-gray-500">
                          {s.status === "available" && "Свободно"}
                          {s.status === "busy" && "Занято (есть приём)"}
                          {s.status === "unavailable" && "Недоступно"}
                        </div>
                        {serviceName && (
                          <div className="text-[10px] text-gray-600 mt-0.5">
                            Услуга слота: {serviceName}
                          </div>
                        )}

                        {isAvailable && (
                          <button
                            onClick={() => deleteSlot(s.id)}
                            className="mt-1 text-[10px] font-medium text-red-600 hover:underline"
                          >
                            Удалить слот
                          </button>
                        )}

                        {isBusy && (
                          <button
                            onClick={() => freeSlot(s.id)}
                            className="mt-1 text-[10px] font-medium text-emerald-700 hover:underline"
                          >
                            Освободить слот
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
