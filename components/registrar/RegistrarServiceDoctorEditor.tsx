"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { servicesPricing } from "@/lib/pricing";
import { doctors } from "@/lib/data";

interface RegistrarServiceDoctorEditorProps {
  appointmentId: string;
  serviceCode: string | null;
  doctorId: string | null;
}

export function RegistrarServiceDoctorEditor({
  appointmentId,
  serviceCode,
  doctorId,
}: RegistrarServiceDoctorEditorProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [service, setService] = useState<string>(serviceCode ?? "");
  const [doctor, setDoctor] = useState<string>(doctorId ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wasEdited, setWasEdited] = useState<boolean>(
    !!(serviceCode || doctorId)
  );

  const handleSave = async () => {
    if (!supabase) {
      setError("Supabase не сконфигурирован.");
      return;
    }

    if (
      !window.confirm(
        "Сохранить выбранную услугу и врача как рабочие для этой консультации?"
      )
    ) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const updateData: any = {
        service_code: service.trim() || null,
        doctor_id: doctor.trim() || null,
      };

      const { error: updateError } = await supabase
        .from("appointments")
        .update(updateData)
        .eq("id", appointmentId);

      if (updateError) {
        console.error(updateError);
        setError("Не удалось сохранить услугу/врача: " + updateError.message);
        setLoading(false);
        return;
      }

      setWasEdited(!!(service.trim() || doctor.trim()));
      setEditing(false);
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setError("Ошибка при сохранении: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setService(serviceCode ?? "");
    setDoctor(doctorId ?? "");
    setEditing(false);
    setError(null);
  };

  const currentService =
    servicesPricing.find((s: any) => s.code === serviceCode)?.name || "";
  const displayService = currentService || "Не выбрана";

  const currentDoctor =
    doctors.find((d: any) => d.id === doctorId)?.name || "Не назначен";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs text-gray-500 font-semibold uppercase">
          Услуга и врач (для работы регистратуры)
        </div>
        <button
          type="button"
          onClick={() => setEditing((prev) => !prev)}
          className="inline-flex items-center rounded-full border border-gray-300 bg-white px-2 py-0.5 text-[10px] text-gray-600 hover:bg-gray-50 disabled:opacity-60"
          disabled={loading}
        >
          {editing ? "Отмена" : "✎ Редактировать"}
        </button>
      </div>

      {/* просмотр */}
      {!editing && (
        <>
          <div className="space-y-2 text-sm">
            <div>
              <div className="text-xs text-gray-500">
                Услуга (назначена клиникой)
              </div>
              <div className="font-medium">
                {displayService}
              </div>
              {serviceCode && (
                <div className="text-[11px] text-gray-500">
                  код: {serviceCode}
                </div>
              )}
              {!serviceCode && (
                <div className="text-[10px] text-gray-400 mt-1">
                  Услуга ещё не назначена регистратурой.
                </div>
              )}
            </div>

            <div className="pt-1">
              <div className="text-xs text-gray-500">
                Врач (назначенный)
              </div>
              <div className="font-medium">
                {currentDoctor}
              </div>
              {!doctorId && (
                <div className="text-[10px] text-gray-400">
                  Врач ещё не назначен регистратурой.
                </div>
              )}
            </div>
          </div>
          {wasEdited && (
            <div className="text-[11px] text-gray-400">
              отредактировано регистратурой (подробности будут в истории
              изменений)
            </div>
          )}
          {error && (
            <div className="text-[11px] text-red-600 mt-1">
              {error}
            </div>
          )}
        </>
      )}

      {/* редактирование */}
      {editing && (
        <div className="space-y-2 text-sm">
          <div className="space-y-1">
            <div className="text-xs text-gray-500">Услуга</div>
            <select
              className="w-full rounded-xl border border-gray-200 px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-emerald-600"
              value={service}
              onChange={(e) => setService(e.target.value)}
            >
              <option value="">Не выбрано</option>
              {servicesPricing.map((s: any) => (
                <option key={s.code} value={s.code}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <div className="text-xs text-gray-500">Врач</div>
            <select
              className="w-full rounded-xl border border-gray-200 px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-emerald-600"
              value={doctor}
              onChange={(e) => setDoctor(e.target.value)}
            >
              <option value="">Не назначен</option>
              {doctors.map((d: any) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[11px] mt-1">
            <button
              type="button"
              onClick={handleSave}
              disabled={loading}
              className="inline-flex items-center rounded-xl bg-emerald-600 px-3 py-1.5 font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              Сохранить
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              className="inline-flex items-center.rounded-xl border border-gray-300.bg-white px-3 py-1.5 font-medium text-gray-700 hover:bg-gray-50"
            >
              Отменить
            </button>
            {error && <span className="text-red-600">{error}</span>}
          </div>

          <div className="text-[11px] text-gray-400">
            Эти значения используются при расчёте услуг, оплат и в медицинских
            документах. Справа видно, что выбрал клиент.
          </div>
        </div>
      )}
    </div>
  );
}
