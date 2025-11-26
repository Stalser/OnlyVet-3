"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { servicesPricing } from "@/lib/pricing";

interface AppointmentServiceRow {
  id: number;
  service_code: string | null;
  quantity: number | null;
  price_per_unit: number | null;
  comment: string | null;
}

interface RegistrarServiceEditorProps {
  appointmentId: string;
  serviceCode: string | null; // пока не используем активно, но оставляем для совместимости
}

/**
 * Редактор услуг для консультации.
 *
 * Работает через appointment_services:
 *  - загружает список услуг по appointment_id,
 *  - позволяет добавить несколько услуг,
 *  - позволяет удалить услугу.
 *
 * Позже сюда можно будет добавить редактирование количества и цены.
 */
export function RegistrarServiceEditor({
  appointmentId,
}: RegistrarServiceEditorProps) {
  const [rows, setRows] = useState<AppointmentServiceRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [editing, setEditing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // выбор категории и услуги
  const [selectedSection, setSelectedSection] = useState<string>("all");
  const [selectedCode, setSelectedCode] = useState<string>("");

  const [saving, setSaving] = useState<boolean>(false);

  // Категории услуг из servicesPricing
  const sections = useMemo(
    () =>
      Array.from(
        new Set(
          servicesPricing
            .map((s) => s.section)
            .filter((s) => s && s.trim().length > 0)
        )
      ),
    []
  );

  const filteredServices = useMemo(() => {
    return servicesPricing.filter((s) => {
      if (selectedSection === "all") return true;
      return s.section === selectedSection;
    });
  }, [selectedSection]);

  async function loadServices() {
    if (!supabase) return;
    setLoading(true);
    setError(null);

    try {
      const { data, error: svcErr } = await supabase
        .from("appointment_services")
        .select("id, service_code, quantity, price_per_unit, comment")
        .eq("appointment_id", appointmentId)
        .order("id", { ascending: true });

      if (svcErr) {
        console.error(svcErr);
        setError("Не удалось загрузить услуги по консультации");
      } else {
        setRows((data ?? []) as AppointmentServiceRow[]);
      }
    } catch (e: any) {
      console.error(e);
      setError("Ошибка при загрузке услуг: " + e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadServices();
  }, [appointmentId]);

  async function handleAddService() {
    if (!supabase) return;
    if (!selectedCode) {
      setError("Выберите услугу из списка.");
      return;
    }

    const service = servicesPricing.find((s) => s.code === selectedCode);
    if (!service) {
      setError("Выбранная услуга не найдена в прайсе.");
      return;
    }

    const basePrice =
      typeof service.priceRUB === "number" ? service.priceRUB : null;

    const confirmText = [
      "Добавить услугу к этой консультации?",
      "",
      `Услуга: ${service.name}`,
      service.section ? `Категория: ${service.section}` : "",
      basePrice != null ? `Базовая цена: ${basePrice} ₽` : "",
    ]
      .filter(Boolean)
      .join("\n");

    if (!window.confirm(confirmText)) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const { error: insertErr } = await supabase
        .from("appointment_services")
        .insert({
          appointment_id: appointmentId,
          service_code: service.code,
          quantity: 1,
          price_per_unit: basePrice,
          comment: null,
        });

      if (insertErr) {
        console.error(insertErr);
        setError("Не удалось добавить услугу: " + insertErr.message);
      } else {
        setSelectedCode("");
        await loadServices();
      }
    } catch (e: any) {
      console.error(e);
      setError("Ошибка при добавлении услуги: " + e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteService(id: number) {
    if (!supabase) return;

    if (!window.confirm("Удалить эту услугу из консультации?")) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const { error: delErr } = await supabase
        .from("appointment_services")
        .delete()
        .eq("id", id);

      if (delErr) {
        console.error(delErr);
        setError("Не удалось удалить услугу: " + delErr.message);
      } else {
        await loadServices();
      }
    } catch (e: any) {
      console.error(e);
      setError("Ошибка при удалении услуги: " + e.message);
    } finally {
      setSaving(false);
    }
  }

  function renderServiceRow(r: AppointmentServiceRow) {
    const svc =
      r.service_code &&
      servicesPricing.find((s) => s.code === r.service_code);

    const name = svc ? svc.name : r.service_code || "Неизвестная услуга";
    const section = svc?.section;
    const basePrice = r.price_per_unit ?? svc?.priceRUB ?? null;

    return (
      <div
        key={r.id}
        className="flex items-start justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm"
      >
        <div className="space-y-0.5">
          <div className="font-medium">{name}</div>
          {section && (
            <div className="text-[11px] text-gray-500">{section}</div>
          )}
          {basePrice != null && (
            <div className="text-[11px] text-gray-500">
              Цена: {basePrice} ₽
            </div>
          )}
          {r.comment && (
            <div className="text-[11px] text-gray-600 whitespace-pre-line">
              Комментарий: {r.comment}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => handleDeleteService(r.id)}
          disabled={saving}
          className="text-[11px] text-red-600 hover:underline"
        >
          Удалить
        </button>
      </div>
    );
  }

  // ---------- UI ----------

  if (loading && !editing && rows.length === 0) {
    return (
      <div className="text-xs text-gray-500">Загружаем услуги…</div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Просмотр */}
      {!editing && (
        <>
          {rows.length === 0 ? (
            <div className="rounded-xl bg-gray-50 px-3 py-2 text-sm text-gray-500">
              Пока ни одна услуга не назначена. Выберите нужные услуги в режиме
              редактирования.
            </div>
          ) : (
            <div className="space-y-2">
              {rows.map((r) => renderServiceRow(r))}
            </div>
          )}

          {error && (
            <div className="text-[11px] text-red-600">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={() => setEditing(true)}
            className="mt-2 inline-flex items-center rounded-full border border-gray-300 bg-white px-3 py-1 text-[11px] text-gray-600 hover:bg-gray-50"
          >
            Редактировать услуги
          </button>
        </>
      )}

      {/* Редактирование */}
      {editing && (
        <div className="space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs font-semibold text-gray-600">
              Услуги (для работы регистратуры)
            </div>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setError(null);
              }}
              className="text-[11px] text-gray-500 hover:underline"
            >
              Закрыть
            </button>
          </div>

          {/* Список текущих услуг */}
          {rows.length > 0 ? (
            <div className="space-y-2">
              {rows.map((r) => renderServiceRow(r))}
            </div>
          ) : (
            <div className="rounded-lg bg-white px-3 py-2 text-xs text-gray-500">
              Пока ни одна услуга не назначена.
            </div>
          )}

          {/* Добавление новой услуги */}
          <div className="space-y-2 pt-2 border-t border-gray-200 mt-2">
            <div className="text-xs font-semibold text-gray-600">
              Добавить услугу
            </div>

            <div className="grid gap-2 md:grid-cols-2">
              <div className="space-y-1">
                <div className="text-[11px] text-gray-500">
                  Категория услуги
                </div>
                <select
                  value={selectedSection}
                  onChange={(e) => {
                    setSelectedSection(e.target.value);
                    setSelectedCode("");
                  }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-emerald-600 bg-white"
                >
                  <option value="all">Все категории</option>
                  {sections.map((sec) => (
                    <option key={sec} value={sec}>
                      {sec}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <div className="text-[11px] text-gray-500">Услуга</div>
                <select
                  value={selectedCode}
                  onChange={(e) => setSelectedCode(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-emerald-600 bg-white"
                >
                  <option value="">Выберите услугу</option>
                  {filteredServices.map((s) => (
                    <option key={s.code} value={s.code}>
                      {s.name}
                      {typeof s.priceRUB === "number"
                        ? ` — ${s.priceRUB} ₽`
                        : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {error && (
              <div className="text-[11px] text-red-600">
                {error}
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleAddService}
                disabled={saving}
                className="inline-flex items-center rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {saving ? "Добавляем…" : "Добавить услугу"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
