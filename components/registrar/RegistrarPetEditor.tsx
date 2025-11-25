"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

interface RegistrarPetEditorProps {
  appointmentId: string;
  petName: string | null;
  petSpecies: string | null;
}

export function RegistrarPetEditor({
  appointmentId,
  petName,
  petSpecies,
}: RegistrarPetEditorProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState<string>(petName ?? "");
  const [species, setSpecies] = useState<string>(petSpecies ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wasEdited, setWasEdited] = useState<boolean>(
    !!(petName || petSpecies)
  );

  const handleSave = async () => {
    if (!supabase) {
      setError("Supabase не сконфигурирован.");
      return;
    }

    const trimmedName = name.trim();
    const trimmedSpecies = species.trim();

    if (
      !window.confirm(
        "Сохранить данные питомца для работы регистратуры и врачей?"
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
          pet_name: trimmedName.length > 0 ? trimmedName : null,
          species: trimmedSpecies.length > 0 ? trimmedSpecies : null,
        })
        .eq("id", appointmentId);

      if (updateError) {
        console.error(updateError);
        setError("Не удалось сохранить данные по питомцу: " + updateError.message);
        setLoading(false);
        return;
      }

      setWasEdited(!!(trimmedName || trimmedSpecies));
      setEditing(false);
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setError("Ошибка при сохранении данных питомца: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setName(petName ?? "");
    setSpecies(petSpecies ?? "");
    setEditing(false);
    setError(null);
  };

  const displayName =
    petName && petName.trim().length > 0 ? petName : "Не указан";

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs text-gray-500 font-semibold uppercase">
          Питомец (для работы регистратуры)
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
          <div className="font-medium text-sm">{displayName}</div>
          {petSpecies && (
            <div className="text-xs text-gray-600">{petSpecies}</div>
          )}
          {!petName && (
            <div className="text-[10px] text-gray-400 mt-1">
              Питомец ещё не подтверждён регистратурой.
            </div>
          )}
          <div className="text-[11px] text-gray-400 mt-1">
            Эти данные будут отображаться врачу и в медкарте.
          </div>
          {wasEdited && (
            <div className="text-[11px] text-gray-400">
              отредактировано регистратурой (точное время будет видно в истории
              изменений)
            </div>
          )}
          {error && (
            <div className="text-[11px] text-red-600 mt-1">{error}</div>
          )}
        </>
      )}

      {/* редактирование */}
      {editing && (
        <div className="space-y-2">
          <div className="space-y-1">
            <label className="text-[11px] text-gray-600">Кличка</label>
            <input
              type="text"
              className="w-full rounded-xl border border-gray-200 px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-emerald-600"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например: Персик"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] text-gray-600">Вид</label>
            <input
              type="text"
              className="w-full rounded-xl border border-gray-200 px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-emerald-600"
              value={species}
              onChange={(e) => setSpecies(e.target.value)}
              placeholder="Кот, собака, хорёк…"
            />
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
              className="inline-flex items-center rounded-xl border border-gray-300 bg-white px-3 py-1.5 font-medium text-gray-700 hover:bg-gray-50"
            >
              Отменить
            </button>
            {error && <span className="text-red-600">{error}</span>}
          </div>
          <div className="text-[11px] text-gray-400">
            Это официальные данные по питомцу для врачей. Справа отображается
            исходный выбор клиента.
          </div>
        </div>
      )}
    </div>
  );
}
