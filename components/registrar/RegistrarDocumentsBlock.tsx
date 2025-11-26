"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface DocumentRecord {
  id: string;
  title: string | null;
  summary: string | null;
  source: "clinic" | "client";
  file_path: string | null;
  file_type: string | null;
  created_at: string;
}

interface Props {
  appointmentId: string;
  documents: DocumentRecord[];
}

export function RegistrarDocumentsBlock({ appointmentId, documents }: Props) {
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [filePath, setFilePath] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clinicDocs = documents.filter((d) => d.source === "clinic");
  const clientDocs = documents.filter((d) => d.source === "client");

  async function handleAddDocument() {
    if (!title.trim()) {
      setError("Введите название документа");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: insertErr } = await supabase
        .from("appointment_documents")
        .insert({
          appointment_id: appointmentId,
          title: title.trim(),
          summary: summary.trim(),
          source: "clinic",
          file_path: filePath.trim() || null,
          created_by: "registrar",
        });

      if (insertErr) {
        setError("Ошибка сохранения: " + insertErr.message);
      } else {
        setTitle("");
        setSummary("");
        setFilePath("");
        window.location.reload();
      }
    } catch (err: any) {
      setError(err.message);
    }

    setLoading(false);
  }

  function DocumentItem({ d }: { d: DocumentRecord }) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-1 text-sm">
        <div className="font-medium">{d.title}</div>
        {d.summary && (
          <div className="text-xs text-gray-600 whitespace-pre-line">
            {d.summary}
          </div>
        )}

        {d.file_path ? (
          <a
            href={d.file_path}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-emerald-700 hover:underline inline-flex items-center gap-1"
          >
            📎 Открыть файл
          </a>
        ) : (
          <div className="text-[10px] text-gray-400">
            Этот документ пока без файла.
          </div>
        )}

        <div className="text-[10px] text-gray-400">
          Добавлен: {new Date(d.created_at).toLocaleString()}
        </div>
      </div>
    );
  }

  return (
    <section className="rounded-2xl border bg-white p-4 space-y-4">
      <h2 className="text-base font-semibold">Документы</h2>

      {/* Клиника */}
      <div className="space-y-3">
        <div className="text-xs font-semibold uppercase text-gray-500">
          Документы клиники
        </div>

        {clinicDocs.length === 0 && (
          <div className="rounded-xl bg-gray-50 px-3 py-2 text-xs text-gray-500">
            Пока нет документов, добавленных клиникой.
          </div>
        )}

        {clinicDocs.length > 0 && (
          <div className="space-y-2">
            {clinicDocs.map((d) => (
              <DocumentItem key={d.id} d={d} />
            ))}
          </div>
        )}
      </div>

      {/* Форма добавления */}
      <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 space-y-3">
        <div className="text-xs font-semibold text-gray-500">
          Добавить документ
        </div>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Название документа"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-emerald-600"
        />

        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="Краткое описание или комментарий"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none min-h-[60px] focus:ring-1 focus:ring-emerald-600"
        />

        <input
          value={filePath}
          onChange={(e) => setFilePath(e.target.value)}
          placeholder="Ссылка на файл (временно, пока не сделаем загрузку)"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-emerald-600"
        />

        {error && <div className="text-xs text-red-600">{error}</div>}

        <div className="flex justify-end">
          <button
            onClick={handleAddDocument}
            disabled={loading}
            className="rounded-full bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {loading ? "Сохраняем…" : "Сохранить документ"}
          </button>
        </div>
      </div>

      {/* Клиент */}
      <div className="space-y-3">
        <div className="text-xs font-semibold uppercase text-gray-500">
          Документы от клиента
        </div>

        {clientDocs.length === 0 && (
          <div className="rounded-xl bg-gray-50 px-3 py-2 text-xs text-gray-500">
            Клиент пока не присылал документы через онлайн-систему.
          </div>
        )}

        {clientDocs.length > 0 && (
          <div className="space-y-2">
            {clientDocs.map((d) => (
              <DocumentItem key={d.id} d={d} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
