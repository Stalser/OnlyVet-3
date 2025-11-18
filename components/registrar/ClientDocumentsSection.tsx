"use client";

import { useState, useEffect, FormEvent } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { OwnerDocument } from "@/lib/documents";
import { getOwnerDocuments } from "@/lib/documents";

type Props = {
  ownerId: number;
};

export function ClientDocumentsSection({ ownerId }: Props) {
  const [docs, setDocs] = useState<OwnerDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState<string | null>(null);

  // форма
  const [type, setType] = useState("");
  const [title, setTitle] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // загрузка документов при открытии
  useEffect(() => {
    let ignore = false;

    async function load() {
      setLoading(true);
      setErrorText(null);

      try {
        const data = await getOwnerDocuments(ownerId);
        if (!ignore) {
          setDocs(data);
        }
      } catch (e) {
        console.error("ClientDocumentsSection load error", e);
        if (!ignore) {
          setErrorText("Не удалось загрузить документы клиента.");
          setDocs([]);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    load();

    return () => {
      ignore = true;
    };
  }, [ownerId]);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!type.trim() || !title.trim()) {
      setErrorText("Укажите тип и название документа.");
      return;
    }

    const client = supabase;
    if (!client) {
      setErrorText("Supabase недоступен на клиенте.");
      return;
    }

    setSaving(true);
    setErrorText(null);

    const payload = {
      owner_id: ownerId,
      type: type.trim(),
      title: title.trim(),
      file_url: fileUrl.trim() || null,
      notes: notes.trim() || null,
    };

    const { data, error } = await client
      .from("owner_documents")
      .insert(payload)
      .select("*")
      .single();

    setSaving(false);

    if (error || !data) {
      console.error("add owner_document error", error);
      setErrorText("Не удалось добавить документ.");
      return;
    }

    setDocs((prev) => [data as OwnerDocument, ...prev]);
    setType("");
    setTitle("");
    setFileUrl("");
    setNotes("");
  }

  async function handleDelete(id: number) {
    if (!confirm("Удалить этот документ?")) return;

    const client = supabase;
    if (!client) {
      setErrorText("Supabase недоступен на клиенте.");
      return;
    }

    setErrorText(null);

    const { error } = await client
      .from("owner_documents")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      console.error("delete owner_document error", error);
      setErrorText("Не удалось удалить документ.");
      return;
    }

    setDocs((prev) => prev.filter((d) => d.id !== id));
  }

  return (
    <section className="rounded-2xl border bg-white p-4 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold">Документы клиента</h2>
        <span className="text-[11px] text-gray-500">
          Всего документов: {docs.length}
        </span>
      </div>

      {errorText && (
        <p className="text-[11px] text-red-600">{errorText}</p>
      )}

      {loading ? (
        <p className="text-xs text-gray-400">Загрузка документов…</p>
      ) : docs.length === 0 ? (
        <p className="text-xs text-gray-400">
          У этого клиента ещё нет документов.
        </p>
      ) : (
        <div className="space-y-2">
          {docs.map((doc) => (
            <div
              key={doc.id}
              className="flex items-start justify-between gap-3 rounded-xl border bg-gray-50 px-3 py-2"
            >
              <div className="space-y-1">
                <div className="text-sm font-medium text-gray-800">
                  {doc.title}
                </div>
                <div className="text-[11px] text-gray-500">
                  Тип: {doc.type}
                </div>
                {doc.file_url && (
                  <a
                    href={doc.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-emerald-700 hover:underline"
                  >
                    Открыть файл
                  </a>
                )}
                {doc.notes && (
                  <div className="text-[11px] text-gray-500">
                    {doc.notes}
                  </div>
                )}
                <div className="text-[10px] text-gray-400">
                  Добавлен:{" "}
                  {new Date(doc.created_at).toLocaleString("ru-RU")}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(doc.id)}
                className="text-[11px] text-red-600 hover:underline"
              >
                Удалить
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Форма добавления нового документа */}
      <div className="mt-3 rounded-xl border bg-gray-50 p-3 space-y-2">
        <h3 className="text-xs font-semibold text-gray-700">
          Добавить документ
        </h3>
        <form onSubmit={handleAdd} className="space-y-2 text-xs">
          <div className="grid gap-2 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-[11px] text-gray-500">
                Тип документа
              </label>
              <input
                type="text"
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full rounded-xl border px-3 py-1.5 text-xs"
                placeholder="например: договор, акт, заключение"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-gray-500">
                Название
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border px-3 py-1.5 text-xs"
                placeholder="например: Договор на оказание услуг"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-[11px] text-gray-500">
              Ссылка на файл
            </label>
            <input
              type="text"
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              className="w-full rounded-xl border px-3 py-1.5 text-xs"
              placeholder="https://... (можно пока оставить пустым)"
            />
          </div>

          <div>
            <label className="mb-1 block text-[11px] text-gray-500">
              Примечание
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border px-3 py-1.5 text-xs"
              rows={2}
              placeholder="Любая служебная информация по документу"
            />
          </div>

          <div className="pt-1 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-emerald-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {saving ? "Сохраняю…" : "Добавить документ"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
