"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

interface RegistrarActionsProps {
  appointmentId: string;
  currentStatus: string;
  initialCancellationReason?: string | null;
}

export function RegistrarActions({
  appointmentId,
  currentStatus,
  initialCancellationReason,
}: RegistrarActionsProps) {
  const router = useRouter();
  const [status, setStatus] = useState<string>(currentStatus);
  const [cancellationReason, setCancellationReason] = useState<string>(
    initialCancellationReason ?? ""
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const normalizedStatus = (status || "").toLowerCase();

  const handleUpdateStatus = async (nextStatus: string) => {
    setError(null);

    if (!supabase) {
      setError("Supabase не сконфигурирован.");
      return;
    }

    let question = "";
    if (nextStatus.toLowerCase().includes("подтверж")) {
      question = "Подтвердить запись и перевести её в работу?";
    } else if (nextStatus.toLowerCase().includes("отмен")) {
      question =
        "Отменить запись? Клиент увидит причину отмены, которую вы укажете ниже.";
    } else if (nextStatus.toLowerCase().includes("заверш")) {
      question = "Отметить запись как завершённую?";
    } else {
      question = `Изменить статус записи на «${nextStatus}»?`;
    }

    if (!window.confirm(question)) {
      return;
    }

    // При отмене — причина обязательна
    if (nextStatus.toLowerCase().includes("отмен")) {
      if (!cancellationReason.trim()) {
        setError("Нельзя отменить запись без указания причины.");
        return;
      }
    }

    setLoading(true);
    try {
      const updateData: any = { status: nextStatus };

      if (nextStatus.toLowerCase().includes("отмен")) {
        updateData.cancellation_reason = cancellationReason.trim();
      }

      const { error: updateError } = await supabase
        .from("appointments")
        .update(updateData)
        .eq("id", appointmentId);

      if (updateError) {
        console.error(updateError);
        setError("Не удалось обновить статус: " + updateError.message);
        setLoading(false);
        return;
      }

      setStatus(nextStatus);
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setError("Ошибка при обновлении статуса: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const onConfirmClick = () => handleUpdateStatus("подтверждена");
  const onCancelClick = () => handleUpdateStatus("отменена");
  const onFinishClick = () => handleUpdateStatus("завершена");

  // Функция для красивого бейджа статуса
  const statusBadge = (s: string) => {
    const v = (s || "").toLowerCase();
    let className =
      "inline-flex items-center rounded-full px-3 py-1 text-[11px] font-medium ";
    if (v.includes("запрош")) {
      className += "bg-amber-50 text-amber-700 border border-amber-200";
    } else if (v.includes("подтверж")) {
      className += "bg-emerald-50 text-emerald-700 border border-emerald-200";
    } else if (v.includes("отмен")) {
      className += "bg-red-50 text-red-700 border border-red-200";
    } else if (v.includes("заверш")) {
      className += "bg-gray-100 text-gray-700 border border-gray-200";
    } else {
      className += "bg-gray-50 text-gray-600 border border-gray-200";
    }

    return (
      <span className={className}>
        Текущий статус: <span className="ml-1 font-semibold">{s}</span>
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Верхняя строка: заголовок и статус */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold">
          Действия регистратуры
        </h2>
        {statusBadge(status)}
      </div>

      {/* Кнопки статуса */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <button
          type="button"
          onClick={onConfirmClick}
          disabled={loading}
          className={
            "rounded-xl border px-3 py-1.5 font-medium transition " +
            (normalizedStatus.includes("подтверж")
              ? "border-emerald-600 bg-emerald-50 text-emerald-700"
              : "border-emerald-600 text-emerald-700 hover:bg-emerald-50")
          }
        >
          Подтвердить
        </button>

        <button
          type="button"
          onClick={onCancelClick}
          disabled={loading}
          className={
            "rounded-xl border px-3 py-1.5 font-medium transition " +
            (normalizedStatus.includes("отмен")
              ? "border-red-600 bg-red-50 text-red-700"
              : "border-red-600 text-red-700 hover:bg-red-50")
          }
        >
          Отменить
        </button>

        <button
          type="button"
          onClick={onFinishClick}
          disabled={loading}
          className={
            "rounded-xl border px-3 py-1.5 font-medium transition " +
            (normalizedStatus.includes("заверш")
              ? "border-gray-500 bg-gray-100 text-gray-700"
              : "border-gray-400 text-gray-700 hover:bg-gray-50")
          }
        >
          Отметить завершённым
        </button>
      </div>

      {/* Причина отмены */}
      <div className="space-y-1 text-xs">
        <label className="font-medium text-gray-700">
          Причина отмены (обязательна при статусе «отменена»)
        </label>
        <textarea
          value={cancellationReason}
          onChange={(e) => setCancellationReason(e.target.value)}
          placeholder="Кратко объясните, почему запись отменена. Этот текст увидит клиент."
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-emerald-600 min-h-[70px]"
        />
        <p className="text-[11px] text-gray-400">
          В будущем это поле будет использоваться для уведомлений клиенту и
          внутреннего аудита работы регистратуры.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}
