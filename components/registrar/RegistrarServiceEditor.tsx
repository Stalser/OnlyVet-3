"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { servicesPricing } from "@/lib/pricing";

interface RegistrarServiceEditorProps {
  appointmentId: string;
  serviceCode: string | null;
}

/**
 * Редактор услуги для регистратуры.
 * Слева в блоке «Услуга»:
 *  - сначала выбираем категорию услуги,
 *  - затем конкретную услугу внутри категории,
 *  - сохраняем service_code в appointments.
 *
 * Справа в блоке остаётся услуга из заявки клиента.
 */
export function RegistrarServiceEditor({
  appointmentId,
  serviceCode,
}: RegistrarServiceEditorProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedServiceCode, setSelectedServiceCode] = useState<string>(
    serviceCode ?? ""
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wasEdited, setWasEdited] = useState<boolean>(!!serviceCode);

  // расширяем услуги локальным полем category
  const extendedServices = useMemo(
    () =>
      (servicesPricing as any[]).map((s) => ({
        ...s,
        category: s.category || "Без категории",
      })),
    []
  );

  const categories = useMemo(
    () =>
      Array.from(
        new Set(
          extendedServices
            .map((s) => s.category as string)
            .filter((c) => c && c.trim().length > 0)
        )
      ),
    [extendedServices]
  );

  const currentService =
    extendedServices.find((s) => s.code === serviceCode)?.name || "Не выбрана";
  const currentCategory =
    extendedServices.find((s) => s.code === serviceCode)?.category || null;

  const filteredServices = useMemo(() => {
    if (!selectedCategory) return extendedServices;
    return extendedServices.filter((s) => s.category === selectedCategory);
  }, [extendedServices, selectedCategory]);

  const handleSave = async () => {
    if (!supabase) {
      setError("Supabase не сконфигурирован.");
      return;
    }

    if (
      !window.confirm(
        "Сохранить выбранную услугу как рабочую для этой консультации?"
      )
    ) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const finalCode = selectedServiceCode.trim() || null;

      const { error: updateError } = await supabase
        .from("appointments")
        .update({
          service_code: finalCode,
        })
        .eq("id", appointmentId);

      if (updateError) {
        console.error(updateError);
        setError("Не удалось сохранить услугу: " + updateError.message);
        setLoading(false);
        return;
      }

      setWasEdited(!!finalCode);
      setEditing(false);
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setError("Ошибка при сохранении услуги: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setSelectedServiceCode(serviceCode ?? "");
    setSelectedCategory("");
    setEditing(false);
    setError(null);
  };

  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold uppercase text-gray-500">
        Услуга (для работы регистратуры)
      </div>

      <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 space-y-3">
        <div className="flex items-center.justify-between gap-2">
          <div className="text-[11px] text-gray-600">
            Эта услуга пойдёт в расчёт стоимости и документы
          </div>
          <button
            type="button"
            onClick={() => setEditing((prev) => !prev)}
            className="inline-flex.items-center rounded-full border border-gray-300 bg-white px-3.py-0.5 text-[11px] text-gray-600 hover:bg-gray-50 disabled:opacity-60"
            disabled={loading}
          >
            {editing ? "Отмена" : "Редактировать"}
          </button>
        </div>

        {/* Просмотр */}
        {!editing && (
          <>
            <div className="rounded-lg bg-white px-3 py-2 text-sm space-y-1">
              <div className="font-medium">
                {currentService}
              </div>
              {currentCategory && (
                <div className="text-[11px] text-gray-500">
                  Категория: {currentCategory}
                </div>
              )}
              {!serviceCode && (
                <div className="text-[10px] text-gray-400 mt-1">
                  Услуга ещё не назначена регистратурой.
                </div>
              )}
            </div>
            <div className="text-[11px] text-gray-400">
              Справа видно услугу, которую выбирал клиент при записи.
            </div>
            {wasEdited && (
              <div className="text-[11px] text-gray-400">
                Отредактировано регистратурой (подробности будут в истории
                изменений).
              </div>
            )}
            {error && (
              <div className="text-[11px] text-red-600 mt-1">
                {error}
              </div>
            )}
          </>
        )}

        {/* Редактирование */}
        {editing && (
          <>
            <div className="grid gap-2 md:grid-cols-2 text-sm">
              <div className="space-y-1">
                <div className="text-xs text-gray-500">Категория услуги</div>
                <select
                  className="w-full rounded-lg border border-gray-300 px-3.py-1.5 text-sm outline-none focus:ring-1 focus:ring-emerald-600"
                  value={selectedCategory}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSelectedCategory(value);
                    setSelectedServiceCode("");
                  }}
                >
                  <option value="">Все категории</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <div className="text-xs text-gray-500">Услуга</div>
                <select
                  className="w-full rounded-lg border border-gray-300 px-3.py-1.5 text-sm outline-none focus:ring-1 focus:ring-emerald-600"
                  value={selectedServiceCode}
                  onChange={(e) => setSelectedServiceCode(e.target.value)}
                >
                  <option value="">Не выбрана</option>
                  {filteredServices.map((s: any) => (
                    <option key={s.code} value={s.code}>
                      {s.name}
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
