"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface DocumentRecord {
  id: string;
  title: string | null;
  summary: string | null;
  source: "clinic" | "client" | null;
  file_path: string | null;
  file_type: string | null;
  created_at: string;
}

interface RegistrarDocumentsBlockProps {
  appointmentId: string;
}

export function RegistrarDocumentsBlock({
  appointmentId,
}: RegistrarDocumentsBlockProps) {
  const [docsClinic, setDocsClinic] = useState<DocumentRecord[]>([]);
  const [docsClient, setDocsClient] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // форма добавления
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [filePath, setFilePath] = useState("");
  const [saving, setSaving] = useState(false);

  const canSave = title.trim().length > 0;

  async function loadDocuments() {
    if (!supabase) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: docsError } = await supabase
        .from("appointment_documents")
        .select(
          "id, title, summary, source, file_path, file_type, created_at"
        )
        .eq("appointment_id", appointmentId)
        .order("created_at", { ascending: true });

      if (docsError) {
        console.error(docsError);
        setError("Не удалось загрузить документы");
      } else {
        const all = (data ?? []) as DocumentRecord[];
        setDocsClinic(
          all.filter((d) => (d.source ?? "clinic") === "clinic")
        );
        setDocsClient(
          all.filter((d) => (d.source ?? "clinic") === "client")
        );
      }
    } catch (e: any) {
      console.error(e);
      setError("Ошибка при загрузке документов: " + e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDocuments();
  }, [appointmentId]);

  async function handleAdd() {
    if (!supabase) return;
    if (!canSave) {
      setError("Введите название документа");
      return;
    }

    if (
      !window.confirm(
        "Добавить документ к этой консультации?"
      )
    ) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const { error: insertError } = await supabase
        .from("appointment_documents")
        .insert({
          appointment_id: appointmentId,
          title: title.trim(),
          summary: summary.trim() || null,
          source: "clinic",
          file_path: filePath.trim() || null,
          created_by: "registrar",
        });

      if (insertError) {
        console.error(insertError);
        setError("Не удалось добавить документ: " + insertError.message);
      } else {
        setTitle("");
        setSummary("");
        setFilePath("");
        await loadDocuments();
      }
    } catch (e: any) {
      console.error(e);
      setError("Ошибка при добавлении документа: " + e.message);
    } finally {
      setSaving(false);
    }
  }

  function DocumentItem({ doc }: { doc: DocumentRecord }) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-1 text-sm">
        <div className="font-medium">
          {doc.title || "Документ без названия"}
        </div>

        {doc.summary && (
          <div className="text-xs text-gray-600 whitespace-pre-line">
            {doc.summary}
          </div>
        )}

        {doc.file_path ? (
          <a
            href={doc.file_path}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-emerald-700 hover:underline"
          >
            📎 Открыть файл
          </a>
        ) : (
          <div className="text-[10px] text-gray-400">
            Файл не прикреплён.
          </div>
        )}

        <div className="text-[10px] text-gray-400">
          Добавлено: {new Date(doc.created_at).toLocaleString("ru-RU")}
        </div>
      </div>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold">Документы</h2>
        <div className="text-[11px] text-gray-500">
          Слева — документы клиники, справа — документы клиента
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Левая колонка: клиника */}
        <div className="space-y-3">
          <div className="text-xs font-semibold uppercase text-gray-500">
            Документы клиники
          </div>

          {loading && (
            <div className="rounded-xl bg-gray-50 px-3 py-2 text-xs text-gray-500">
              Загружаем документы…
            </div>
          )}

          {!loading && docsClinic.length === 0 && (
            <div className="rounded-xl bg-gray-50 px-3 py-2 text-xs text-gray-500">
              Пока нет документов, добавленных клиникой.
            </div>
          )}

          {!loading && docsClinic.length > 0 && (
            <div className="space-y-2">
              {docsClinic.map((d) => (
                <DocumentItem key={d.id} doc={d} />
              ))}
            </div>
          )}

          {/* Форма добавления */}
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-3 space-y-2">
            <div className="text-xs font-semibold text-gray-500">
              Добавить документ
            </div>
            <div className="text-[11px] text-gray-500">
              Можно добавить анализы, заключения, заметки по звонку и т.д. Позже
              сюда привяжем загрузку файлов.
            </div>

            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Название документа (например, 'Анализы крови от 24.11')"
              className="w-full rounded-lg border border-gray-300 px-3.py-1.5 text-xs outline-none focus:ring-1 focus:ring-emerald-600 bg-white"
            />

            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Краткое содержание / комментарий для врача..."
              className="w-full rounded-lg border border-gray-300 px-3.py-1.5 text-xs outline-none focus:ring-1 focus:ring-emerald-600 bg-white min-h-[60px]"
            />

            <input
              type="text"
              value={filePath}
              onChange={(e) => setFilePath(e.target.value)}
              placeholder="Ссылка на файл (временно, пока не настроена загрузка)"
              className="w-full rounded-lg border border-gray-300 px-3.py-1.5 text-xs outline-none focus:ring-1 focus:ring-emerald-600 bg-white"
            />

            {error && (
              <div className="text-[11px] text-red-600">
                {error}
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleAdd}
                disabled={!canSave || saving}
                className="inline-flex items-center rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {saving ? "Сохраняем…" : "Сохранить документ"}
              </button>
            </div>
          </div>
        </div>

        {/* Правая колонка: клиент */}
        <div className="space-y-3">
          <div className="text-xs font-semibold uppercase text-gray-500">
            Документы от клиента
          </div>

          {loading && (
            <div className="rounded-xl bg-gray-50 px-3.py-2 text-xs text-gray-500">
              Загружаем документы клиента…
            </div>
          )}

          {!loading && docsClient.length === 0 && (
            <div className="rounded-xl bg-gray-50 px-3.py-2 text-xs text-gray-500">
              Клиент пока не присылал документы через онлайн-систему.
            </div>
          )}

          {!loading && docsClient.length > 0 && (
            <div className="space-y-2">
              {docsClient.map((d) => (
                <DocumentItem key={d.id} doc={d} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
