"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface RegistrarDocumentsBlockProps {
  appointmentId: string;
}

/**
 * Блок "Документы" для карточки консультации.
 *
 * Функционал:
 *  - читает документы по appointment_id из appointment_documents;
 *  - разделяет "clinic" / "client";
 *  - даёт регистратуре возможность добавить простой текстовый документ
 *    (описание, комментарий, пометка) как запись в таблицу.
 *
 * В будущем:
 *  - заменим/расширим добавление на загрузку файлов в Supabase Storage;
 *  - клиентская сторона будет создавать записи с source = 'client'.
 */
export function RegistrarDocumentsBlock({
  appointmentId,
}: RegistrarDocumentsBlockProps) {
  const [loading, setLoading] = useState(true);
  const [documentsClinic, setDocumentsClinic] = useState<any[]>([]);
  const [documentsClient, setDocumentsClient] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // форма добавления документа клиникой
  const [newTitle, setNewTitle] = useState<string>("");
  const [newSummary, setNewSummary] = useState<string>(""); // описание/комментарий
  const [saving, setSaving] = useState<boolean>(false);

  const canAdd = newTitle.trim().length > 0 || newSummary.trim().length > 0;

  const loadDocuments = async () => {
    if (!supabase) return;
    setLoading(true);
    setError(null);

    try {
      const { data, error: docsError } = await supabase
        .from("appointment_documents")
        .select(
          "id, appointment_id, title, summary, source, created_at"
        )
        .eq("appointment_id", appointmentId)
        .order("created_at", { ascending: true });

      if (docsError) {
        console.error(docsError);
        setError("Не удалось загрузить список документов");
        setLoading(false);
        return;
      }

      const clinic = (data ?? []).filter(
        (d) => (d.source ?? "clinic") === "clinic"
      );
      const client = (data ?? []).filter(
        (d) => (d.source ?? "clinic") === "client"
      );

      setDocumentsClinic(clinic);
      setDocumentsClient(client);
    } catch (e: any) {
      console.error(e);
      setError("Ошибка при загрузке документов: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDocuments();
  }, [appointmentId]);

  const handleAddDocument = async () => {
    if (!supabase) return;
    if (!canAdd) return;

    if (!window.confirm("Добавить документ к консультации?")) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const { error: insertError } = await supabase
        .from("appointment_documents")
        .insert({
          appointment_id: appointmentId,
          title: newTitle.trim() || "Документ без названия",
          summary: newSummary.trim() || null,
          source: "clinic", // документ добавляет клиника
        });

      if (insertError) {
        console.error(insertError);
        setError("Не удалось добавить документ: " + insertError.message);
        setSaving(false);
        return;
      }

      setNewTitle("");
      setNewSummary("");
      await loadDocuments();
    } catch (e: any) {
      console.error(e);
      setError("Ошибка при добавлении документа: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3 text-sm">
      {/* Левая часть — документы клиники */}
      <div className="space-y-1">
        <div className="text-xs font-semibold uppercase text-gray-500">
          Документы клиники
        </div>
        {loading ? (
          <div className="rounded-xl bg-gray-50 px-3 py-2 text-[11px] text-gray-500">
            Загружаем документы…
          </div>
        ) : documentsClinic.length === 0 ? (
          <div className="rounded-xl bg-gray-50 px-3 py-2 text-[11px] text-gray-400">
            Пока нет документов, добавленных клиникой.
          </div>
        ) : (
          <ul className="space-y-1">
            {documentsClinic.map((doc) => (
              <li
                key={doc.id}
                className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-[11px]"
              >
                <div className="font-medium text-gray-800">
                  {doc.title || "Документ без названия"}
                </div>
                {doc.summary && (
                  <div className="mt-0.5 text-gray-600 whitespace-pre-line">
                    {doc.summary}
                  </div>
                )}
                {doc.created_at && (
                  <div className="mt-1 text-[10px] text-gray-400">
                    Добавлено:{" "}
                    {new Date(doc.created_at).toLocaleString("ru-RU", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Форма добавления нового документа клиникой */}
      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-3 space-y-2">
        <div className="text-[11px] text-gray-600">
          Добавить документ для врача (анализы, заключения, заметки по звонку
          и т.д.). Позже сюда можно будет привязать файлы.
        </div>
        <div className="space-y-1">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Название документа (например, 'Анализы крови от 24.11')"
            className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-emerald-600 bg-white"
          />
        </div>
        <div className="space-y-1">
          <textarea
            value={newSummary}
            onChange={(e) => setNewSummary(e.target.value)}
            placeholder="Краткое содержание / комментарий для врача..."
            className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-emerald-600 bg-white min-h-[60px]"
          />
        </div>
        <div className="flex justify-end gap-2 text-[11px]">
          <button
            type="button"
            onClick={handleAddDocument}
            disabled={!canAdd || saving}
            className="inline-flex items-center rounded-full bg-emerald-600 px-4 py-1.5 font-medium text-white hover:bg-emerald-700.disabled:opacity-60"
          >
            Сохранить документ
          </button>
        </div>
      </div>

      {/* Правая часть — документы клиента (будущее) */}
      <div className="space-y-1">
        <div className="text-xs font-semibold uppercase text-gray-500">
          Документы от клиента
        </div>
        {loading ? (
          <div className="rounded-xl bg-gray-50 px-3 py-2 text-[11px] text-gray-500">
            Загружаем документы клиента…
          </div>
        ) : documentsClient.length === 0 ? (
          <div className="rounded-xl bg-gray-50 px-3 py-2 text-[11px] text-gray-400">
            Клиент пока не присылал документов через онлайн-систему.
          </div>
        ) : (
          <ul className="space-y-1">
            {documentsClient.map((doc) => (
              <li
                key={doc.id}
                className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-[11px]"
              >
                <div className="font-medium text-gray-800">
                  {doc.title || "Документ без названия"}
                </div>
                {doc.summary && (
                  <div className="mt-0.5 text-gray-600 whitespace-pre-line">
                    {doc.summary}
                  </div>
                )}
                {doc.created_at && (
                  <div className="mt-1 text-[10px] text-gray-400">
                    Получено от клиента:{" "}
                    {new Date(doc.created_at).toLocaleString("ru-RU", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {error && (
        <div className="text-[11px] text-red-600">
          {error}
        </div>
      )}
    </div>
  );
}
