"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Doc = {
  id: string;
  title: string;
  content: string | null;
  file_path: string | null;
  source: "clinic" | "client";
};

interface Props {
  appointmentId: string;
  documents: Doc[];
}

export function RegistrarDocumentsBlock({ appointmentId, documents }: Props) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [filePath, setFilePath] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clinicDocs = documents.filter((d) => d.source === "clinic");
  const clientDocs = documents.filter((d) => d.source === "client");

  const handleSave = async () => {
    if (!title.trim()) {
      setError("Укажите название документа.");
      return;
    }

    setSaving(true);
    setError(null);

    const { error: insertError } = await supabase
      .from("appointment_documents")
      .insert({
        appointment_id: appointmentId,
        title,
        description: content,
        file_path: filePath || null,
        source: "clinic",
      });

    if (insertError) {
      setError(insertError.message);
      setSaving(false);
      return;
    }

    setSaving(false);
    setTitle("");
    setContent("");
    setFilePath("");

    alert("Документ сохранён");
  };

  return (
    <div className="space-y-4">

      {/* ---- Бейджи слева/справа ---- */}
      <div className="flex flex-wrap gap-2 text-[10px] text-gray-500 mb-1">
        <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5">
          Слева — документы клиники
        </span>
        <span className="inline-flex items-center rounded-full bg-gray-50 px-2 py-0.5">
          Справа — документы клиента
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">

        {/* ====== ДОКУМЕНТЫ КЛИНИКИ ====== */}
        <div className="space-y-3">
          <div className="text-xs font-semibold uppercase text-gray-500">
            Документы клиники
          </div>

          {clinicDocs.length === 0 && (
            <div className="rounded-xl bg-gray-50 px-3 py-2 text-sm text-gray-500">
              Пока нет документов, добавленных клиникой.
            </div>
          )}

          {clinicDocs.length > 0 && (
            <div className="space-y-2">
              {clinicDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="rounded-xl bg-white border px-3 py-2 text-sm space-y-1"
                >
                  <div className="font-medium">{doc.title}</div>
                  {doc.content && (
                    <div className="text-xs text-gray-600 whitespace-pre-line">
                      {doc.content}
                    </div>
                  )}
                  {doc.file_path && (
                    <a
                      href={doc.file_path}
                      target="_blank"
                      className="text-[11px] text-emerald-700 underline"
                    >
                      Открыть файл
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* --- Добавить документ (в стиле других блоков) --- */}
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-3 space-y-2">
            <div className="text-xs font-medium text-gray-600">
              Добавить документ
            </div>
            <div className="text-[11px] text-gray-500">
              Можно добавлять анализы, заключения, заметки по звонку и т.д.
            </div>

            <input
              className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-emerald-600"
              placeholder="Название документа"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <textarea
              className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none min-h-[70px] focus:ring-1 focus:ring-emerald-600"
              placeholder="Комментарий / содержание"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />

            <input
              className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-emerald-600"
              placeholder="Ссылка на файл (временно)"
              value={filePath}
              onChange={(e) => setFilePath(e.target.value)}
            />

            {error && (
              <div className="text-[11px] text-red-600">{error}</div>
            )}

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center rounded-full bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              Сохранить документ
            </button>
          </div>
        </div>

        {/* ====== ДОКУМЕНТЫ КЛИЕНТА ====== */}
        <div className="space-y-3">
          <div className="text-xs font-semibold uppercase text-gray-500">
            Документы от клиента
          </div>

          {clientDocs.length === 0 && (
            <div className="rounded-xl bg-gray-50 px-3 py-2 text-sm text-gray-500">
              Клиент пока не присылал документы через онлайн-систему.
            </div>
          )}

          {clientDocs.length > 0 && (
            <div className="space-y-2">
              {clientDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="rounded-xl bg-white border px-3 py-2 text-sm space-y-1"
                >
                  <div className="font-medium">{doc.title}</div>
                  {doc.content && (
                    <div className="text-xs text-gray-600 whitespace-pre-line">
                      {doc.content}
                    </div>
                  )}
                  {doc.file_path && (
                    <a
                      href={doc.file_path}
                      target="_blank"
                      className="text-[11px] text-emerald-700 underline"
                    >
                      Открыть документ
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
