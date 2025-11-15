"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

interface RegistrarActionsProps {
  appointmentId: string;
  currentStatus: string;
}

export function RegistrarActions({
  appointmentId,
  currentStatus,
}: RegistrarActionsProps) {
  const router = useRouter();
  const [updating, setUpdating] = useState<null | "confirm" | "cancel">(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleStatusChange = async (
    newStatus: string,
    kind: "confirm" | "cancel"
  ) => {
    if (!supabase) {
      setErrorMessage("Ошибка: Supabase недоступен на клиенте.");
      return;
    }

    setUpdating(kind);
    setErrorMessage(null);

    const { error } = await supabase
      .from("appointments")
      .update({ status: newStatus })
      .eq("id", appointmentId);

    if (error) {
      setErrorMessage("Не удалось обновить статус. Попробуйте ещё раз.");
      setUpdating(null);
      return;
    }

    // Обновляем данные страницы
    router.refresh();
    setUpdating(null);
  };

  const isConfirmed = currentStatus === "подтверждена";
  const isCancelled = currentStatus === "отменена";
  const isFinished = currentStatus === "завершена";

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500">
        Эти действия меняют статус консультации в базе данных. Позже сюда
        добавим смену врача, времени и синхронизацию с Vetmanager.
      </p>

      {errorMessage && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {errorMessage}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() =>
            handleStatusChange("подтверждена", "confirm")
          }
          disabled={updating === "confirm" || isConfirmed || isFinished}
          className="rounded-xl border border-emerald-600 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-60"
        >
          {updating === "confirm"
            ? "Подтверждаем..."
            : isConfirmed
            ? "Уже подтверждена"
            : isFinished
            ? "Завершена"
            : "Подтвердить консультацию"}
        </button>

        <button
          type="button"
          onClick={() =>
            alert(
              "Перенос / изменение времени пока работает как заглушка. Здесь будет выбор даты/времени с записью в БД и Vetmanager."
            )
          }
          className="rounded-xl border px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
        >
          Перенести / изменить время
        </button>

        <button
          type="button"
          onClick={() =>
            handleStatusChange("отменена", "cancel")
          }
          disabled={updating === "cancel" || isCancelled || isFinished}
          className="rounded-xl border border-red-500 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
        >
          {updating === "cancel"
            ? "Отменяем..."
            : isCancelled
            ? "Уже отменена"
            : isFinished
            ? "Завершена"
            : "Отменить консультацию"}
        </button>
      </div>

      <div className="text-[11px] text-gray-400">
        Текущий статус:&nbsp;
        <span className="font-medium text-gray-700">
          {currentStatus || "неизвестен"}
        </span>
      </div>
    </div>
  );
}
