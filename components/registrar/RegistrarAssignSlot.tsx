"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { doctors } from "@/lib/data";

interface RegistrarAssignSlotProps {
  appointmentId: string;
  doctorId: string | null;
}

/**
 * Блок «Расписание консультации» для регистратуры.
 *
 * Функционал:
 *  - показывает текущую дату/время консультации (appointments.starts_at);
 *  - позволяет регистратуре назначить / изменить дату и время;
 *  - если передан doctorId — показывает, к какому врачу относится это расписание.
 *
 * ВАЖНО: врач выбирается в блоке «Врач». Здесь мы только работаем с датой/временем.
 */
export function RegistrarAssignSlot({
  appointmentId,
  doctorId,
}: RegistrarAssignSlotProps) {
  const router = useRouter();

  const [date, setDate] = useState<string>("");
  const [time, setTime] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Имя врача по doctorId (для отображения)
  const doctorName =
    doctors.find((d: any) => d.id === doctorId)?.name || "Не назначен";

  // Загружаем текущий starts_at из appointments, чтобы заполнить дату/время
  useEffect(() => {
    const loadAppointment = async () => {
      if (!supabase) return;
      setInitialLoading(true);
      setError(null);

      try {
        const { data, error: apptError } = await supabase
          .from("appointments")
          .select("starts_at")
          .eq("id", appointmentId)
          .maybeSingle();

        if (apptError) {
          console.error(apptError);
          setError("Не удалось загрузить текущую дату и время консультации");
        } else if (data && data.starts_at) {
          const d = new Date(data.starts_at);
          // дата в формате YYYY-MM-DD
          const isoDate = d.toISOString().slice(0, 10);
          const hh = String(d.getHours()).padStart(2, "0");
          const mm = String(d.getMinutes()).padStart(2, "0");
          setDate(isoDate);
          setTime(`${hh}:${mm}`);
        } else {
          // если времени нет — ставим сегодняшнюю дату и ближайшие 30 минут
          const now = new Date();
          const isoDate = now.toISOString().slice(0, 10);
          const hh = String(now.getHours()).padStart(2, "0");
          const mm = String(Math.round(now.getMinutes() / 5) * 5).padStart(
            2,
            "0"
          );
          setDate(isoDate);
          setTime(`${hh}:${mm}`);
        }
      } catch (e: any) {
        console.error(e);
        setError("Ошибка при загрузке консультации: " + e.message);
      } finally {
        setInitialLoading(false);
      }
    };

    void loadAppointment();
  }, [appointmentId]);

  const handleSave = async () => {
    if (!supabase) {
      setError("Supabase не сконфигурирован.");
      return;
    }

    if (!date || !time) {
      setError("Укажите дату и время консультации.");
      return;
    }

    const isoString = new Date(`${date}T${time}:00`).toISOString();

    if (
      !window.confirm(
        `Сохранить назначенное время консультации: ${date} ${time}?`
      )
    ) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from("appointments")
        .update({
          starts_at: isoString,
        })
        .eq("id", appointmentId);

      if (updateError) {
        console.error(updateError);
        setError(
          "Не удалось сохранить дату и время консультации: " +
            updateError.message
        );
        setLoading(false);
        return;
      }

      router.refresh();
    } catch (e: any) {
      console.error(e);
      setError("Ошибка при сохранении: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-[11px] text-gray-500">
        Загружаем текущее расписание консультации…
      </div>
    );
  }

  return (
    <div className="space-y-3 text-sm">
      {/* Врач — информативно, без возможности выбора */}
      <div className="space-y-1">
        <div className="text-xs text-gray-500">Врач</div>
        <div className="rounded-lg bg-gray-50 px-3 py-2 text-sm">
          {doctorName}
        </div>
        {!doctorId && (
          <div className="text-[11px] text-gray-400 mt-1">
            Врач ещё не назначен. Обычно сначала выбирают врача в блоке выше, а
            затем ставят время.
          </div>
        )}
      </div>

      {/* Дата / время */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-1">
          <div className="text-xs text-gray-500">Дата</div>
          <input
            type="date"
            className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-emerald-600"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <div className="text-xs text-gray-500">Время</div>
          <input
            type="time"
            className="w-full rounded-lg border.border-gray-300 px-3.py-1.5 text-sm outline-none focus:ring-1 focus:ring-emerald-600"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </div>

        {/* Кнопка сохранения справа на широких экранах */}
        <div className="flex items-end justify-start md:justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="inline-flex items-center rounded-full bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            Сохранить
          </button>
        </div>
      </div>

      {error && (
        <div className="text-[11px] text-red-600">
          {error}
        </div>
      )}

      <div className="text-[11px] text-gray-400">
        Эти данные увидит врач в своём кабинете. Настройки определяют, когда и
        с кем фактически пройдёт консультация.
      </div>
    </div>
  );
}
