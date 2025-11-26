"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { doctors } from "@/lib/data";

interface RegistrarDoctorEditorProps {
  appointmentId: string;
  doctorId: string | null;
}

/**
 * Редактор врача для регистратуры.
 * Слева в блоке «Врач»:
 *  - сначала выбираем специальность,
 *  - затем врача внутри этой специальности,
 *  - сохраняем doctor_id в appointments.
 *
 * Справа в блоке показывается врач из заявки клиента (requested_doctor_code).
 */
export function RegistrarDoctorEditor({
  appointmentId,
  doctorId,
}: RegistrarDoctorEditorProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(
    doctorId ?? ""
  );
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wasEdited, setWasEdited] = useState<boolean>(!!doctorId);

  // Расширяем doctors локальным полем specialty
  const extendedDoctors = useMemo(
    () =>
      (doctors as any[]).map((d) => ({
        ...d,
        specialty:
          d.specialty ||
          d.specialisation ||
          d.specialization ||
          "Без специализации",
      })),
    []
  );

  const specialties = useMemo(
    () =>
      Array.from(
        new Set(
          extendedDoctors
            .map((d) => d.specialty as string)
            .filter((s) => s && s.trim().length > 0)
        )
      ),
    [extendedDoctors]
  );

  // Текущий врач по doctorId
  const currentDoctor =
    extendedDoctors.find((d) => d.id === doctorId)?.name || "Не назначен";
  const currentDoctorSpecialty =
    extendedDoctors.find((d) => d.id === doctorId)?.specialty || null;

  // Доктора по выбранной специальности
  const filteredDoctors = useMemo(() => {
    if (!selectedSpecialty) return extendedDoctors;
    return extendedDoctors.filter((d) => d.specialty === selectedSpecialty);
  }, [extendedDoctors, selectedSpecialty]);

  const handleSave = async () => {
    if (!supabase) {
      setError("Supabase не сконфигурирован.");
      return;
    }

    if (!window.confirm("Сохранить выбранного врача для этой консультации?")) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const finalDoctorId = selectedDoctorId.trim() || null;

      const { error: updateError } = await supabase
        .from("appointments")
        .update({
          doctor_id: finalDoctorId,
        })
        .eq("id", appointmentId);

      if (updateError) {
        console.error(updateError);
        setError("Не удалось сохранить врача: " + updateError.message);
        setLoading(false);
        return;
      }

      setWasEdited(!!finalDoctorId);
      setEditing(false);
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setError("Ошибка при сохранении врача: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setSelectedDoctorId(doctorId ?? "");
    setSelectedSpecialty("");
    setEditing(false);
    setError(null);
  };

  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold uppercase text-gray-500">
        Врач (для работы регистратуры)
      </div>

      <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="text-[11px] text-gray-600">
            Этот врач увидит заявку в своём кабинете
          </div>
          <button
            type="button"
            onClick={() => setEditing((prev) => !prev)}
            className="inline-flex items-center rounded-full border border-gray-300 bg-white px-3 py-0.5 text-[11px] text-gray-600 hover:bg-gray-50 disabled:opacity-60"
            disabled={loading}
          >
            {editing ? "Отмена" : "Редактировать"}
          </button>
        </div>

        {/* Просмотр */}
        {!editing && (
          <>
            <div className="rounded-lg bg-white px-3 py-2 text-sm space-y-1">
              <div className="font-medium">{currentDoctor}</div>
              {currentDoctorSpecialty && (
                <div className="text-[11px] text-gray-500">
                  Специализация: {currentDoctorSpecialty}
                </div>
              )}
              {!doctorId && (
                <div className="text-[10px] text-gray-400 mt-1">
                  Врач ещё не назначен регистратурой.
                </div>
              )}
            </div>
            <div className="text-[11px] text-gray-400">
              Справа видно врача, которого выбирал клиент при записи. Здесь —
              финальное решение регистратуры.
            </div>
            {wasEdited && (
              <div className="text-[11px] text-gray-400">
                Отредактировано регистратурой (подробности будут в истории
                изменений).
              </div>
            )}
            {error && (
              <div className="text-[11px] text-red-600 mt-1">{error}</div>
            )}
          </>
        )}

        {/* Редактирование */}
        {editing && (
          <>
            <div className="grid gap-2 md:grid-cols-2 text-sm">
              <div className="space-y-1">
                <div className="text-xs text-gray-500">Специальность</div>
                <select
                  className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-emerald-600"
                  value={selectedSpecialty}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSelectedSpecialty(value);
                    setSelectedDoctorId("");
                  }}
                >
                  <option value="">Все специальности</option>
                  {specialties.map((spec) => (
                    <option key={spec} value={spec}>
                      {spec}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <div className="text-xs text-gray-500">Врач</div>
                <select
                  className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-emerald-600"
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                >
                  <option value="">Не назначен</option>
                  {filteredDoctors.map((d: any) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 text-[11px] mt-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={loading}
                className="inline-flex items-center rounded-full bg-emerald-600 px-4 py-1.5 font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                Сохранить
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={loading}
                className="inline-flex items-center rounded-full border border-gray-300 bg-white px-4 py-1.5 font-medium text-gray-700 hover:bg-gray-50"
              >
                Отменить
              </button>
            </div>

            {error && (
              <div className="text-[11px] text-red-600 mt-1">{error}</div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
