"use client";

import { useEffect, useState, FormEvent } from "react";
import { supabase } from "@/lib/supabaseClient";
import { doctors } from "@/lib/data";

type Slot = {
  id: string;
  doctorId: string;
  doctorName: string;
  date: string;
  timeStart: string;
  timeEnd: string;
  status: string;
};

export function RegistrarScheduleClient() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [doctorId, setDoctorId] = useState<string>(
    doctors[0]?.id ?? ""
  );
  const [date, setDate] = useState("");
  const [timeStart, setTimeStart] = useState("");
  const [timeEnd, setTimeEnd] = useState("");

  useEffect(() => {
    let ignore = false;

    async function load() {
      if (!supabase) {
        setErrorMessage("Supabase недоступен на клиенте.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setErrorMessage(null);

      const { data, error } = await supabase
        .from("doctor_slots")
        .select("*")
        .order("date", { ascending: true })
        .order("time_start", { ascending: true });

      if (error) {
        if (!ignore) {
          setErrorMessage("Не удалось загрузить расписание.");
          setLoading(false);
        }
        return;
      }

      if (!data) {
        if (!ignore) {
          setSlots([]);
          setLoading(false);
        }
        return;
      }

      const mapped: Slot[] = data.map((row: any) => {
        const doc = doctors.find((d) => d.id === row.doctor_id);
        return {
          id: row.id,
          doctorId: row.doctor_id,
          doctorName: doc?.name ?? row.doctor_id ?? "Неизвестный врач",
          date: row.date,
          timeStart: row.time_start,
          timeEnd: row.time_end,
          status: row.status,
        };
      });

      if (!ignore) {
        setSlots(mapped);
        setLoading(false);
      }
    }

    load();

    return () => {
      ignore = true;
    };
  }, []);

  const handleCreateSlot = async (e: FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      setErrorMessage("Supabase недоступен на клиенте.");
      return;
    }

    if (!doctorId || !date || !timeStart || !timeEnd) {
      setErrorMessage("Заполните врача, дату и время.");
      return;
    }

    setSaving(true);
    setErrorMessage(null);

    const { data, error } = await supabase
      .from("doctor_slots")
      .insert({
        doctor_id: doctorId,
        date,
        time_start: timeStart,
        time_end: timeEnd,
        status: "available",
      })
      .select("*")
      .single();

    if (error || !data) {
      setErrorMessage("Не удалось создать слот. Попробуйте ещё раз.");
      setSaving(false);
      return;
    }

    const doc = doctors.find((d) => d.id === data.doctor_id);

    const newSlot: Slot = {
      id: data.id,
      doctorId: data.doctor_id,
      doctorName: doc?.name ?? data.doctor_id ?? "Неизвестный врач",
      date: data.date,
      timeStart: data.time_start,
      timeEnd: data.time_end,
      status: data.status,
    };

    setSlots((prev) => [...prev, newSlot]);
    setSaving(false);

    // сбрасываем форму
    setDate("");
    setTimeStart("");
    setTimeEnd("");
  };

  const handleDeleteSlot = async (id: string) => {
    if (!supabase) {
      setErrorMessage("Supabase недоступен на клиенте.");
      return;
    }

    const ok = window.confirm("Удалить этот слот из расписания?");
    if (!ok) return;

    const { error } = await supabase
      .from("doctor_slots")
      .delete()
      .eq("id", id);

    if (error) {
      setErrorMessage("Не удалось удалить слот.");
      return;
    }

    setSlots((prev) => prev.filter((s) => s.id !== id));
  };

  // группируем слоты по дате
  const slotsByDate = slots.reduce<Record<string, Slot[]>>((acc, slot) => {
    if (!acc[slot.date]) acc[slot.date] = [];
    acc[slot.date].push(slot);
    return acc;
  }, {});

  const sortedDates = Object.keys(slotsByDate).sort();

  return (
    <div className="space-y-6">
      {/* Форма создания слота */}
      <section className="rounded-2xl border bg-white p-4 space-y-4">
        <h2 className="text-base font-semibold">
          Добавить слот в расписание
        </h2>
        <p className="text-xs text-gray-500">
          Регистратор может заранее создать окно приёма для выбранного
          врача. В будущем эти слоты будут использоваться при записи
          клиентов и синхронизироваться с Vetmanager.
        </p>

        {errorMessage && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {errorMessage}
          </div>
        )}

        <form
          onSubmit={handleCreateSlot}
          className="grid gap-3 md:grid-cols-[2fr,2fr,1fr,1fr,auto]"
        >
          <div className="flex flex-col">
            <label className="text-[11px] text-gray-500 mb-1">
              Врач
            </label>
            <select
              value={doctorId}
              onChange={(e) => setDoctorId(e.target.value)}
              className="rounded-xl border px-2 py-1.5 text-xs"
            >
              {doctors.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-[11px] text-gray-500 mb-1">
              Дата
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-xl border px-2 py-1.5 text-xs"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-[11px] text-gray-500 mb-1">
              Время начала
            </label>
            <input
              type="time"
              value={timeStart}
              onChange={(e) => setTimeStart(e.target.value)}
              className="rounded-xl border px-2 py-1.5 text-xs"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-[11px] text-gray-500 mb-1">
              Время конца
            </label>
            <input
              type="time"
              value={timeEnd}
              onChange={(e) => setTimeEnd(e.target.value)}
              className="rounded-xl border px-2 py-1.5 text-xs"
            />
          </div>

          <div className="flex flex-col justify-end">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {saving ? "Сохраняем…" : "Добавить слот"}
            </button>
          </div>
        </form>
      </section>

      {/* Список слотов по датам */}
      <section className="rounded-2xl border bg-white p-4 space-y-4">
        <h2 className="text-base font-semibold">Текущее расписание</h2>

        {loading && (
          <p className="text-xs text-gray-500">Загружаем слоты…</p>
        )}

        {!loading && slots.length === 0 && (
          <p className="text-xs text-gray-400">
            Пока нет ни одного слота. Добавьте первый.
          </p>
        )}

        {!loading &&
          sortedDates.map((dateKey) => (
            <div key={dateKey} className="space-y-2">
              <div className="text-xs font-semibold text-gray-700">
                {dateKey}
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead>
                    <tr className="border-b bg-gray-50 text-left text-[11px] uppercase text-gray-500">
                      <th className="px-2 py-1.5">Врач</th>
                      <th className="px-2 py-1.5">Время</th>
                      <th className="px-2 py-1.5">Статус</th>
                      <th className="px-2 py-1.5 text-right">Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {slotsByDate[dateKey].map((slot) => (
                      <tr
                        key={slot.id}
                        className="border-b last:border-0 hover:bg-gray-50"
                      >
                        <td className="px-2 py-1.5 align-top">
                          {slot.doctorName}
                        </td>
                        <td className="px-2 py-1.5 align-top">
                          {slot.timeStart}–{slot.timeEnd}
                        </td>
                        <td className="px-2 py-1.5 align-top">
                          <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                            {slot.status}
                          </span>
                        </td>
                        <td className="px-2 py-1.5 align-top text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteSlot(slot.id)}
                            className="text-[11px] text-red-600 hover:underline"
                          >
                            Удалить
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
      </section>
    </div>
  );
}
