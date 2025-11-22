// components/registrar/RegistrarAssignSlot.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { SupabaseClient } from "@supabase/supabase-js";
import { doctors } from "@/lib/data";

type Props = {
  appointmentId: string;
  doctorId?: string | null;
};

type FormState = {
  doctorId: string;
  date: string;
  time: string;
};

export function RegistrarAssignSlot({ appointmentId, doctorId }: Props) {
  const client: SupabaseClient | null = supabase;

  const [form, setForm] = useState<FormState>({
    doctorId: doctorId ?? "",
    date: "",
    time: "",
  });

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Подставляем сегодняшнюю дату и ближайшее время по умолчанию
  useEffect(() => {
    const now = new Date();
    const date = now.toISOString().slice(0, 10);
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    setForm((prev) => ({
      ...prev,
      date: prev.date || date,
      time: prev.time || `${hh}:${mm}`,
    }));
  }, []);

  const handleChange = (
    field: keyof FormState,
    value: string
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setErrorMsg(null);

    if (!client) {
      setErrorMsg("Supabase не сконфигурирован.");
      return;
    }

    if (!form.date || !form.time) {
      setErrorMsg("Укажите дату и время.");
      return;
    }

    setLoading(true);

    try {
      const startsAt = new Date(`${form.date}T${form.time}:00`);
      const startsIso = startsAt.toISOString();

      const updates: Record<string, any> = {
        starts_at: startsIso,
      };

      if (form.doctorId) {
        updates.doctor_id = form.doctorId;
      }

      const { error } = await client
        .from("appointments")
        .update(updates)
        .eq("id", appointmentId);

      if (error) {
        console.error("RegistrarAssignSlot update error:", error);
        setErrorMsg("Не удалось сохранить слот и врача.");
      } else {
        setMsg("Время и врач обновлены.");
      }
    } catch (err) {
      console.error("RegistrarAssignSlot error:", err);
      setErrorMsg("Ошибка при обработке даты/времени.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 text-xs"
    >
      <div className="grid gap-2 md:grid-cols-3">
        {/* Врач */}
        <div className="space-y-1">
          <label className="text-[11px] text-gray-600">
            Врач
          </label>
          <select
            className="w-full rounded-xl border border-gray-200 px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-emerald-600"
            value={form.doctorId}
            onChange={(e) =>
              handleChange("doctorId", e.target.value)
            }
          >
            <option value="">Не указан</option>
            {doctors.map((d: any) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        {/* Дата */}
        <div className="space-y-1">
          <label className="text-[11px] text-gray-600">
            Дата
          </label>
          <input
            type="date"
            className="w-full rounded-xl border border-gray-200 px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-emerald-600"
            value={form.date}
            onChange={(e) =>
              handleChange("date", e.target.value)
            }
          />
        </div>

        {/* Время */}
        <div className="space-y-1">
          <label className="text-[11px] text-gray-600">
            Время
          </label>
          <input
            type="time"
            className="w-full rounded-xl border border-gray-200 px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-emerald-600"
            value={form.time}
            onChange={(e) =>
              handleChange("time", e.target.value)
            }
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 pt-1">
        <div className="text-[10px] text-gray-400">
          Эти данные увидит врач в своём кабинете.
        </div>
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-emerald-600 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Сохраняем…" : "Сохранить"}
        </button>
      </div>

      {msg && (
        <p className="text-[11px] text-emerald-700">
          {msg}
        </p>
      )}
      {errorMsg && (
        <p className="text-[11px] text-red-600">
          {errorMsg}
        </p>
      )}
    </form>
  );
}
