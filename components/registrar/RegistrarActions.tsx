// components/registrar/RegistrarActions.tsx
"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { SupabaseClient } from "@supabase/supabase-js";

type Props = {
  appointmentId: string;
  currentStatus: string;
};

type ActionStatus = "idle" | "loading" | "success" | "error";

export function RegistrarActions({ appointmentId, currentStatus }: Props) {
  const [actionState, setActionState] = useState<ActionStatus>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [statusNow, setStatusNow] = useState<string>(currentStatus);

  const client: SupabaseClient | null = supabase;

  const updateStatus = async (newStatus: string) => {
    if (!client) {
      setActionState("error");
      setMessage("Supabase не сконфигурирован.");
      return;
    }

    setActionState("loading");
    setMessage(null);

    const { error } = await client
      .from("appointments")
      .update({ status: newStatus })
      .eq("id", appointmentId);

    if (error) {
      console.error("RegistrarActions updateStatus error:", error);
      setActionState("error");
      setMessage("Не удалось обновить статус приёма.");
      return;
    }

    setStatusNow(newStatus);
    setActionState("success");
    setMessage(`Статус обновлён на: "${newStatus}".`);
  };

  const handleConfirm = () => updateStatus("подтверждена");
  const handleCancel = () => updateStatus("отменена");
  const handleComplete = () => updateStatus("завершена");

  const isLoading = actionState === "loading";

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 text-xs">
        <button
          type="button"
          onClick={handleConfirm}
          disabled={isLoading || statusNow === "подтверждена"}
          className="rounded-xl border border-emerald-600 px-3 py-1.5 font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          Подтвердить
        </button>

        <button
          type="button"
          onClick={handleCancel}
          disabled={isLoading || statusNow === "отменена"}
          className="rounded-xl border border-red-500 px-3 py-1.5 font-medium text-red-600 hover:bg-red-50 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          Отменить
        </button>

        <button
          type="button"
          onClick={handleComplete}
          disabled={isLoading || statusNow === "завершена"}
          className="rounded-xl border border-gray-400 px-3.py-1.5 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          Отметить завершённым
        </button>
      </div>

      <div className="text-[11px] text-gray-500">
        Текущий статус:{" "}
        <span className="font-semibold text-gray-800">
          {statusNow || "неизвестен"}
        </span>
      </div>

      {actionState !== "idle" && message && (
        <div
          className={`text-[11px] ${
            actionState === "error"
              ? "text-red-600"
              : actionState === "success"
              ? "text-emerald-700"
              : "text-gray-500"
          }`}
        >
          {message}
        </div>
      )}
    </div>
  );
}
