"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { doctors } from "@/lib/data";

type SlotOption = {
  id: string;
  label: string;
  raw: any;
};

interface RegistrarAssignSlotProps {
  appointmentId: string;
  doctorId?: string;
}

export function RegistrarAssignSlot({
  appointmentId,
  doctorId,
}: RegistrarAssignSlotProps) {
  const router = useRouter();
  const [slots, setSlots] = useState<SlotOption[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function load() {
      if (!doctorId) {
        setLoading(false);
        return;
      }
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
        .eq("doctor_id", doctorId)
        .order("date", { ascending: true })
        .order("time_start", { ascending: true });

      if (error || !data) {
        if (!ignore) {
          setErrorMessage("Не удалось загрузить слоты для врача.");
          setLoading(false);
        }
        return;
      }

      const available = data.filter(
        (row: any) =>
          !row.appointment_id && row.status === "available"
      );

      const mapped: SlotOption[] = available.map((row: any) => {
        const label = `${row.date} ${row.time_start}–${row.time_end}`;
        return {
          id: row.id,
          label,
          raw: row,
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
  }, [doctorId]);

  if (!doctorId) {
    return (
      <div className="text-[11px] text-gray-400">
        Врач пока не назначен — выбор слота недоступен.
      </div>
    );
  }

  const handleAssign = async (e: FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      setErrorMessage("Supabase недоступен на клиенте.");
      return;
    }
    if (!selectedSlotId) {
      setErrorMessage("Выберите слот для назначения.");
      return;
    }

    const slot = slots.find((s) => s.id === selectedSlotId);
    if (!slot) {
      setErrorMessage("Слот не найден.");
      return;
    }

    setSaving(true);
    setErrorMessage(null);

    // 1) помечаем слот как занятый и привязываем консультацию
    const { error: slotError } = await supabase
      .from("doctor_slots")
      .update({
        appointment_id: appointmentId,
        status: "busy",
      })
      .eq("id", selectedSlotId);

    if (slotError) {
      setErrorMessage("Не удалось привязать консультацию к слоту.");
      setSaving(false);
      return;
    }

    // 2) обновляем запись приёма (дата/время/врач)
    const doc = doctors.find((d) => d.id === doctorId);

    const { error: appError } = await supabase
      .from("appointments")
      .update({
        date: slot.raw.date,
        time: slot.raw.time_start,
        doctor_id: doctorId,
        doctor_name: doc?.name ?? null,
      })
      .eq("id", appointmentId);

    if (appError) {
      setErrorMessage(
        "Слот обновлён, но не удалось обновить данные консультации."
      );
      setSaving(false);
      return;
    }

    setSaving(false);
    router.refresh();
  };

  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold text-gray-700">
        Назначить консультацию на слот врача
      </div>

      {loading && (
        <div className="text-[11px] text-gray-500">
          Загружаем доступные слоты…
        </div>
      )}

      {!loading && slots.length === 0 && (
        <div className="text-[11px] text-gray-400">
          Для этого врача пока нет свободных слотов. Создайте их на
          странице расписания.
        </div>
      )}

      {!loading && slots.length > 0 && (
        <form
          onSubmit={handleAssign}
          className="flex flex-wrap items-center gap-2"
        >
          <select
            value={selectedSlotId}
            onChange={(e) => setSelectedSlotId(e.target.value)}
            className="rounded-xl border px-2 py-1.5 text-xs"
          >
            <option value="">Выберите слот…</option>
            {slots.map((slot) => (
              <option key={slot.id} value={slot.id}>
                {slot.label}
              </option>
            ))}
          </select>

          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {saving ? "Назначаем…" : "Назначить на слот"}
          </button>
        </form>
      )}

      {errorMessage && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700">
          {errorMessage}
        </div>
      )}
    </div>
  );
}
