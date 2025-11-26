"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

interface RegistrarComplaintEditorProps {
  appointmentId: string;
  complaint: string | null;
  requestedComplaint: string | null;
}

export function RegistrarComplaintEditor({
  appointmentId,
  complaint,
  requestedComplaint,
}: RegistrarComplaintEditorProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState<string>(complaint ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wasEdited, setWasEdited] = useState<boolean>(!!complaint);

  const handleSave = async () => {
    if (!supabase) {
      setError("Supabase не сконфигурирован.");
      return;
    }

    const trimmed = value.trim();

    if (!window.confirm("Сохранить формулировку жалобы для регистратуры?")) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from("appointments")
        .update({
          complaint: trimmed.length > 0 ? trimmed : null,
        })
        .eq("id", appointmentId);

      if (updateError) {
        console.error(updateError);
        setError(
          "Не удалось сохранить формулировку жалобы: " + updateError.message
        );
        setLoading(false);
        return;
      }

      setWasEdited(!!trimmed);
      setEditing(false);
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setError("Ошибка при сохранении жалобы: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setValue(complaint ?? "");
    setEditing(false);
    setError(null);
  };

  const displayText =
    complaint && complaint.trim().length > 0
      ? complaint
      : "— пока не заполнено";

  return (
    <div className="space-y-1">
      <div className="text-xs font-semibold uppercase text-gray-500">
        Формулировка регистратуры
      </div>

      {/* Карточка с рамкой */}
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="text-[11px] font-medium text-gray-700">
            Текст, который увидит врач
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

        {/* Режим просмотра */}
        {!editing && (
          <div className="rounded-lg bg-white px-3 py-2 min-h-[60px] whitespace-pre-line">
            {displayText}
          </div>
        )}

        {/* Режим редактирования */}
        {editing && (
          <div className="space-y-2">
            <textarea
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-emerald-600 min-h-[80px]"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Как регистратура формулирует жалобу/направление для врача..."
            />
            <div className="flex flex-wrap items-center gap-2 text-[11px]">
              <button
                type="button"
                onClick={handleSave}
                disabled={loading}
                className="inline-flex.items-center rounded-xl bg-emerald-600 px-3.py-1.5 font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                Сохранить
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={loading}
                className="inline-flex.items-center rounded-xl border border-gray-300 bg-white px-3.py-1.5 font-medium text-gray-700 hover:bg-gray-50"
              >
                Отменить
              </button>
              {error && <span className="text-red-600">{error}</span>}
            </div>
          </div>
        )}
      </div>

      {/* Подписи под карточкой */}
      <div className="text-[11px] text-gray-400">
        Этот текст увидят врач и медкарта. Справа показывается исходный текст
        клиента из онлайн-формы, он не изменяется регистратурой.
      </div>
      {wasEdited && !editing && (
        <div className="text-[11px] text-gray-400">
          отредактировано регистратурой (подробности появятся в истории
          изменений)
        </div>
      )}
    </div>
  );
}
