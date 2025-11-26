"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

interface RegistrarPetEditorProps {
  appointmentId: string;
  ownerId: number | null;
  petId: number | null;
  petName: string | null;
  petSpecies: string | null;
}

/**
 * Редактор питомца для блока «Питомец (для работы регистратуры)».
 *
 * Возможности:
 *  - увидеть текущего питомца, привязанного к приёму;
 *  - выбрать питомца из существующих у владельца;
 *  - создать нового питомца (минимальные поля) и привязать его к приёму.
 */
export function RegistrarPetEditor({
  appointmentId,
  ownerId,
  petId,
  petName,
  petSpecies,
}: RegistrarPetEditorProps) {
  const router = useRouter();

  const [editing, setEditing] = useState(false);
  const [mode, setMode] = useState<"existing" | "new">("existing");

  const [pets, setPets] = useState<any[]>([]);
  const [petsLoading, setPetsLoading] = useState(false);

  const [selectedPetId, setSelectedPetId] = useState<string>(
    petId != null ? String(petId) : ""
  );

  const [newPetName, setNewPetName] = useState<string>("");
  const [newPetSpecies, setNewPetSpecies] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wasEdited, setWasEdited] = useState<boolean>(!!petId || !!petName);

  // Загружаем список питомцев владельца
  useEffect(() => {
    const loadPets = async () => {
      if (!supabase) return;
      if (!ownerId) return;

      setPetsLoading(true);
      setError(null);
      try {
        const { data, error: petsError } = await supabase
          .from("pets")
          .select("*")
          .eq("owner_id", ownerId)
          .order("name", { ascending: true });

        if (petsError) {
          console.error(petsError);
          setError("Не удалось загрузить список питомцев владельца");
        } else {
          setPets(data ?? []);
        }
      } catch (e: any) {
        console.error(e);
        setError("Ошибка при загрузке питомцев: " + e.message);
      } finally {
        setPetsLoading(false);
      }
    };

    loadPets();
  }, [ownerId]);

  const currentDisplayName =
    petName && petName.trim().length > 0 ? petName : "Не указан";

  const handleSave = async () => {
    if (!supabase) {
      setError("Supabase не сконфигурирован.");
      return;
    }

    if (!window.confirm("Сохранить выбранного/созданного питомца для приёма?")) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let finalPetId: number | null = null;
      let finalPetName: string | null = null;
      let finalPetSpecies: string | null = null;

      if (mode === "existing") {
        // выбор из существующих
        if (!selectedPetId) {
          setError("Выберите питомца или переключитесь на создание нового.");
          setLoading(false);
          return;
        }

        const pet = pets.find(
          (p) => String(p.id) === String(selectedPetId)
        );
        if (!pet) {
          setError("Выбранный питомец не найден.");
          setLoading(false);
          return;
        }

        finalPetId = pet.id as number;
        finalPetName = pet.name ?? null;
        finalPetSpecies = pet.species ?? null;
      } else {
        // создание нового
        const nameTrimmed = newPetName.trim();
        const speciesTrimmed = newPetSpecies.trim();

        if (!ownerId) {
          setError("Неизвестен владелец, невозможно создать питомца.");
          setLoading(false);
          return;
        }

        if (!nameTrimmed || !speciesTrimmed) {
          setError("Укажите кличку и вид нового питомца.");
          setLoading(false);
          return;
        }

        const { data: inserted, error: insertError } = await supabase
          .from("pets")
          .insert({
            owner_id: ownerId,
            name: nameTrimmed,
            species: speciesTrimmed,
          })
          .select("*")
          .single();

        if (insertError || !inserted) {
          console.error(insertError);
          setError("Не удалось создать нового питомца.");
          setLoading(false);
          return;
        }

        finalPetId = inserted.id as number;
        finalPetName = inserted.name ?? null;
        finalPetSpecies = inserted.species ?? null;
      }

      const { error: updateError } = await supabase
        .from("appointments")
        .update({
          pet_id: finalPetId,
          pet_name: finalPetName,
          species: finalPetSpecies,
        })
        .eq("id", appointmentId);

      if (updateError) {
        console.error(updateError);
        setError("Не удалось привязать питомца к приёму: " + updateError.message);
        setLoading(false);
        return;
      }

      setWasEdited(true);
      setEditing(false);
      router.refresh();
    } catch (e: any) {
      console.error(e);
      setError("Ошибка при сохранении питомца: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setSelectedPetId(petId != null ? String(petId) : "");
    setNewPetName("");
    setNewPetSpecies("");
    setMode("existing");
    setEditing(false);
    setError(null);
  };

  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold uppercase text-gray-500">
        Питомец (для работы регистратуры)
      </div>

      <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="text-[11px] text-gray-600">
            Этот питомец попадёт в карточку приёма и медкарту
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
              <div className="font-medium">{currentDisplayName}</div>
              {petSpecies && (
                <div className="text-[11px] text-gray-500">
                  Вид: {petSpecies}
                </div>
              )}
              {!petName && (
                <div className="text-[10px] text-gray-400 mt-1">
                  Питомец ещё не подтверждён регистратурой.
                </div>
              )}
            </div>
            <div className="text-[11px] text-gray-400">
              Справа видно, что указывал клиент при записи.
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
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="space-y-1">
                <div className="text-xs text-gray-500">Режим выбора</div>
                <div className="flex flex-col gap-1 text-[11px]">
                  <label className="inline-flex.items-center gap-1">
                    <input
                      type="radio"
                      className="h-3 w-3"
                      checked={mode === "existing"}
                      onChange={() => setMode("existing")}
                    />
                    <span>Выбрать из существующих питомцев</span>
                  </label>
                  <label className="inline-flex.items-center gap-1">
                    <input
                      type="radio"
                      className="h-3 w-3"
                      checked={mode === "new"}
                      onChange={() => setMode("new")}
                    />
                    <span>Создать нового питомца</span>
                  </label>
                </div>
              </div>

              {mode === "existing" && (
                <div className="flex-1 space-y-1">
                  <div className="text-xs text-gray-500">
                    Существующие питомцы владельца
                  </div>
                  {petsLoading ? (
                    <div className="text-[11px] text-gray-400">
                      Загружаем список питомцев…
                    </div>
                  ) : pets.length === 0 ? (
                    <div className="text-[11px] text-gray-400">
                      У владельца пока нет сохранённых питомцев. Вы можете
                      создать нового.
                    </div>
                  ) : (
                    <select
                      className="w-full rounded-lg border.border-gray-300 px-3.py-1.5 text-sm outline-none focus:ring-1 focus:ring-emerald-600"
                      value={selectedPetId}
                      onChange={(e) => setSelectedPetId(e.target.value)}
                    >
                      <option value="">Не выбран</option>
                      {pets.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.species || "вид не указан"})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {mode === "new" && (
                <div className="flex-1 space-y-2">
                  <div className="space-y-1">
                    <div className="text-xs text-gray-500">Кличка</div>
                    <input
                      type="text"
                      className="w-full rounded-lg border border-gray-300 px-3.py-1.5 text-sm outline-none focus:ring-1 focus:ring-emerald-600"
                      value={newPetName}
                      onChange={(e) => setNewPetName(e.target.value)}
                      placeholder="Например: Персик"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-gray-500">Вид</div>
                    <input
                      type="text"
                      className="w-full rounded-lg border border-gray-300 px-3.py-1.5 text-sm outline-none focus:ring-1 focus:ring-emerald-600"
                      value={newPetSpecies}
                      onChange={(e) => setNewPetSpecies(e.target.value)}
                      placeholder="Кот, собака, хорёк…"
                    />
                  </div>
                  {!ownerId && (
                    <div className="text-[11px] text-red-600">
                      Владелец не определён — создание нового питомца будет
                      недоступно.
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 text-[11px] mt-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={loading}
                className="inline-flex.items-center rounded-full bg-emerald-600 px-4.py-1.5 font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                Сохранить
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={loading}
                className="inline-flex.items-center rounded-full border border-gray-300 bg-white px-4.py-1.5 font-medium text-gray-700 hover:bg-gray-50"
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
