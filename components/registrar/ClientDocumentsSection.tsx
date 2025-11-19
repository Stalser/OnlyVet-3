"use client";

import { useState, useEffect, FormEvent, ChangeEvent } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { OwnerDocument } from "@/lib/documents";
import { getOwnerDocuments } from "@/lib/documents";

type Props = {
  ownerId: number;
  /** Может ли текущий пользователь добавлять/редактировать/удалять документы */
  canManage?: boolean;
};

// Имя bucket'а в Supabase Storage
const STORAGE_BUCKET = "onlyvet-docs";

// Предлагаемые типы документов для клиента (юридические)
const OWNER_DOCUMENT_TYPES = [
  "Договор на оказание услуг",
  "Долгосрочный договор / абонемент",
  "Акт выполненных работ",
  "Информированное согласие",
  "Согласие на операцию / анестезию",
  "Согласие на обработку персональных данных",
  "Согласие на обработку мед. данных",
  "Заявление / претензия",
  "Иное",
] as const;

// Определяем, является ли URL файлом из нашего хранилища Supabase
function isInternalFile(url: string | null | undefined) {
  if (!url) return false;
  return url.includes(`/storage/v1/object/public/${STORAGE_BUCKET}/`);
}

export function ClientDocumentsSection({ ownerId, canManage = false }: Props) {
  const [docs, setDocs] = useState<OwnerDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState<string | null>(null);

  // спойлер
  const [expanded, setExpanded] = useState(false);

  // форма добавления
  const [newType, setNewType] = useState<string>("Договор на оказание услуг");
  const [newTitle, setNewTitle] = useState("");
  const [newFileUrl, setNewFileUrl] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [newFile, setNewFile] = useState<File | null>(null);
  const [savingNew, setSavingNew] = useState(false);

  // редактирование документа
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editType, setEditType] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editFileUrl, setEditFileUrl] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  // фильтрация
  const [filterType, setFilterType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    let ignore = false;

    async function load() {
      setLoading(true);
      setErrorText(null);
      try {
        const data = await getOwnerDocuments(ownerId);
        if (!ignore) {
          const sorted = [...data].sort((a, b) => {
            const da = new Date(a.created_at).getTime();
            const db = new Date(b.created_at).getTime();
            return db - da;
          });
          setDocs(sorted);
        }
      } catch (e) {
        console.error("getOwnerDocuments error", e);
        if (!ignore) {
          setErrorText("Не удалось загрузить документы клиента.");
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

  const resetNewForm = () => {
    setNewType("Договор на оказание услуг");
    setNewTitle("");
    setNewFileUrl("");
    setNewNotes("");
    setNewFile(null);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setNewFile(file);
  };

  const startEdit = (doc: OwnerDocument) => {
    if (!canManage) return;
    setEditingId(doc.id);
    setEditType(doc.type);
    setEditTitle(doc.title);
    setEditFileUrl(doc.file_url || "");
    setEditNotes(doc.notes || "");
    setErrorText(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setSavingEdit(false);
    setErrorText(null);
  };

  async function uploadOwnerFile(file: File): Promise<string | null> {
    const client = supabase;
    if (!client) {
      setErrorText("Supabase недоступен на клиенте.");
      return null;
    }

    const ext = file.name.split(".").pop() || "file";
    const path = `owners/${ownerId}/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${ext}`;

    const { error: uploadError } = await client.storage
      .from(STORAGE_BUCKET)
      .upload(path, file);

    if (uploadError) {
      console.error("upload owner document error", uploadError);
      setErrorText("Не удалось загрузить файл в хранилище.");
      return null;
    }

    const { data: publicData } = client.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(path);

    return publicData.publicUrl ?? null;
  }

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    if (!canManage) return;

    const client = supabase;
    if (!client) {
      setErrorText("Supabase недоступен на клиенте.");
      return;
    }

    if (!newTitle.trim()) {
      setErrorText("Укажите название документа.");
      return;
    }

    setSavingNew(true);
    setErrorText(null);

    let finalUrl: string | null = newFileUrl.trim() || null;

    // если выбран файл — загружаем его и используем URL из хранилища
    if (newFile) {
      const uploadedUrl = await uploadOwnerFile(newFile);
      if (!uploadedUrl) {
        setSavingNew(false);
        return;
      }
      finalUrl = uploadedUrl;
    }

    const payload = {
      owner_id: ownerId,
      type: newType.trim(),
      title: newTitle.trim(),
      file_url: finalUrl,
      notes: newNotes.trim() || null,
    };

    const { data, error } = await client
      .from("owner_documents")
      .insert(payload)
      .select("*")
      .single();

    if (error || !data) {
      console.error("owner_documents insert error", error);
      setErrorText("Не удалось добавить документ клиента.");
      setSavingNew(false);
      return;
    }

    const created = data as OwnerDocument;
    setDocs((prev) =>
      [...prev, created].sort((a, b) => {
        const da = new Date(a.created_at).getTime();
        const db = new Date(b.created_at).getTime();
        return db - da;
      })
    );
    resetNewForm();
    setSavingNew(false);
  };

  const handleEditSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!canManage || editingId == null) return;

    const client = supabase;
    if (!client) {
      setErrorText("Supabase недоступен на клиенте.");
      return;
    }

    if (!editTitle.trim()) {
      setErrorText("Название документа не может быть пустым.");
      return;
    }

    setSavingEdit(true);
    setErrorText(null);

    const payload = {
      type: editType.trim() || "Иное",
      title: editTitle.trim(),
      file_url: editFileUrl.trim() || null,
      notes: editNotes.trim() || null,
    };

    const { error } = await client
      .from("owner_documents")
      .update(payload)
      .eq("id", editingId);

    if (error) {
      console.error("owner_documents update error", error);
      setErrorText("Не удалось сохранить изменения документа.");
      setSavingEdit(false);
      return;
    }

    setDocs((prev) =>
      prev
        .map((d) =>
          d.id === editingId
            ? {
                ...d,
                ...payload,
                updated_at: new Date().toISOString(),
              }
            : d
        )
        .sort((a, b) => {
          const da = new Date(a.created_at).getTime();
          const db = new Date(b.created_at).getTime();
          return db - da;
        })
    );
    setSavingEdit(false);
    setEditingId(null);
  };

  const handleDelete = async (id: number) => {
    if (!canManage) return;
    if (!confirm("Удалить этот документ клиента?")) return;

    const client = supabase;
    if (!client) {
      setErrorText("Supabase недоступен на клиенте.");
      return;
    }

    setErrorText(null);

    const { error } = await client
      .from("owner_documents")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("owner_documents delete error", error);
      setErrorText("Не удалось удалить документ.");
      return;
    }

    setDocs((prev) => prev.filter((d) => d.id !== id));
    if (editingId === id) {
      setEditingId(null);
    }
  };

  // фильтрация
  const filteredDocs = docs.filter((d) => {
    const typeOk = filterType === "all" || d.type === filterType;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return typeOk;
    const haystack =
      (d.title || "").toLowerCase() +
      " " +
      (d.type || "").toLowerCase() +
      " " +
      (d.notes || "").toLowerCase();
    return typeOk && haystack.includes(q);
  });

  const distinctTypes = Array.from(
    new Set(docs.map((d) => d.type).filter(Boolean))
  );

  const hasDocs = docs.length > 0;
  const hasFilteredDocs = filteredDocs.length > 0;

  const emptyMessage = !hasDocs
    ? "Документов клиента пока нет."
    : "Нет документов, удовлетворяющих текущим фильтрам.";

  return (
    <div className="space-y-3">
      {/* ШАПКА + СПОЙЛЕР */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between rounded-2xl border bg-gray-50 px-4 py-3 text-left"
      >
        <div>
          <div className="text-sm font-semibold">Документы клиента</div>
          <div className="text-[11px] text-gray-500">
            Договора, акты, согласия и другие юридические документы, связанные
            с владельцем.
          </div>
        </div>
        <div className="flex flex-col items-end text-[11px] text-gray-500">
          <span>Всего: {docs.length}</span>
          <span className="mt-1">
            {expanded ? "Свернуть ▲" : "Развернуть ▼"}
          </span>
        </div>
      </button>

      {!expanded && (
        <div className="rounded-2xl border bg-white px-4 py-3 text-[11px] text-gray-500">
          Документы скрыты. Нажмите, чтобы развернуть и увидеть список и формы
          управления.
        </div>
      )}

      {expanded && (
        <div className="space-y-3 rounded-2xl border bg-white p-4">
          {/* Ошибки */}
          {errorText && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700">
              {errorText}
            </div>
          )}

          {loading && (
            <p className="text-[11px] text-gray-500">
              Загрузка документов клиента…
            </p>
          )}

          {/* Фильтры */}
          {!loading && (
            <div className="flex flex-wrap items-center gap-3 text-[11px]">
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Тип:</span>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="rounded-xl border px-2 py-1 text-[11px]"
                >
                  <option value="all">Все</option>
                  {distinctTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Поиск:</span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Название, тип, пометки…"
                  className="min-w-[160px] rounded-xl border px-2 py-1 text-[11px]"
                />
              </div>
            </div>
          )}

          {/* Таблица документов */}
          {!loading && (
            <div className="overflow-x-auto">
              <table className="min-w-full text-[11px]">
                <thead>
                  <tr className="border-b bg-gray-50 text-left uppercase text-gray-500">
                    <th className="px-2 py-2">Тип</th>
                    <th className="px-2 py-2">Название</th>
                    <th className="px-2 py-2">Дата добавления</th>
                    <th className="px-2 py-2">Заметки</th>
                    <th className="px-2 py-2 text-right">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {!hasFilteredDocs ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-2 py-4 text-center text-[11px] text-gray-400"
                      >
                        {emptyMessage}
                      </td>
                    </tr>
                  ) : (
                    filteredDocs.map((d) => {
                      const created = d.created_at
                        ? new Date(d.created_at).toLocaleString("ru-RU")
                        : "—";
                      const isEditing = editingId === d.id;
                      const isFile = isInternalFile(d.file_url);

                      if (isEditing && canManage) {
                        return (
                          <tr key={d.id} className="border-b last:border-0">
                            <td className="px-2 py-2 align-top">
                              <select
                                value={editType}
                                onChange={(e) =>
                                  setEditType(e.target.value)
                                }
                                className="w-full rounded-xl border px-2 py-1 text-[11px]"
                              >
                                {OWNER_DOCUMENT_TYPES.map((t) => (
                                  <option key={t} value={t}>
                                    {t}
                                  </option>
                                ))}
                                {!OWNER_DOCUMENT_TYPES.includes(
                                  editType as (typeof OWNER_DOCUMENT_TYPES)[number]
                                ) &&
                                  editType && (
                                    <option value={editType}>{editType}</option>
                                  )}
                              </select>
                            </td>
                            <td className="px-2 py-2 align-top">
                              <input
                                type="text"
                                value={editTitle}
                                onChange={(e) =>
                                  setEditTitle(e.target.value)
                                }
                                className="w-full rounded-xl border px-2 py-1 text-[11px]"
                              />
                              <input
                                type="text"
                                value={editFileUrl}
                                onChange={(e) =>
                                  setEditFileUrl(e.target.value)
                                }
                                className="mt-1 w-full rounded-xl border px-2 py-1 text-[11px]"
                                placeholder="Ссылка на файл (URL)"
                              />
                            </td>
                            <td className="px-2 py-2 align-top text-gray-500">
                              {created}
                            </td>
                            <td className="px-2 py-2 align-top">
                              <textarea
                                value={editNotes}
                                onChange={(e) =>
                                  setEditNotes(e.target.value)
                                }
                                rows={2}
                                className="w-full rounded-xl border px-2 py-1 text-[11px]"
                              />
                            </td>
                            <td className="px-2 py-2 align-top text-right space-y-1">
                              <button
                                type="button"
                                onClick={handleEditSave}
                                disabled={savingEdit}
                                className="block w-full rounded-xl bg-emerald-600 px-2 py-1 text-[11px] font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                              >
                                {savingEdit ? "Сохраняю…" : "Сохранить"}
                              </button>
                              <button
                                type="button"
                                onClick={cancelEdit}
                                className="block w-full rounded-xl border px-2 py-1 text-[11px] text-gray-700 hover:bg-gray-50"
                              >
                                Отмена
                              </button>
                            </td>
                          </tr>
                        );
                      }

                      return (
                        <tr key={d.id} className="border-b last:border-0">
                          <td className="px-2 py-2 align-top text-gray-700">
                            {d.type || "—"}
                          </td>
                          <td className="px-2 py-2 align-top">
                            {d.file_url ? (
                              <a
                                href={d.file_url}
                                target="_blank"
                                rel="noreferrer"
                                title={d.file_url}
                                className="text-emerald-700 hover:underline"
                              >
                                {d.title || "Документ"}
                              </a>
                            ) : (
                              <span className="text-gray-800">
                                {d.title || "Документ"}
                              </span>
                            )}
                            {d.file_url && (
                              <div className="text-[10px] text-gray-400">
                                {isFile ? "Тип: файл (хранилище)" : "Тип: ссылка"}
                              </div>
                            )}
                          </td>
                          <td className="px-2 py-2 align-top text-gray-500">
                            {created}
                          </td>
                          <td className="px-2 py-2 align-top text-gray-700">
                            {d.notes || (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                          <td className="px-2 py-2 align-top text-right space-y-1">
                            {d.file_url && (
                              <>
                                {isFile ? (
                                  <a
                                    href={d.file_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    title={d.file_url}
                                    download
                                    className="block w-full text-left text-[11px] text-emerald-700 hover:underline"
                                  >
                                    Открыть файл
                                  </a>
                                ) : (
                                  <a
                                    href={d.file_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    title={d.file_url}
                                    className="block w-full text-left text-[11px] text-emerald-700 hover:underline"
                                  >
                                    Перейти по ссылке
                                  </a>
                                )}
                              </>
                            )}
                            {canManage && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => startEdit(d)}
                                  className="block w-full text-left text-[11px] text-emerald-700 hover:underline"
                                >
                                  Заменить / редактировать
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDelete(d.id)}
                                  className="block w-full text-left text-[11px] text-red-600 hover:underline"
                                >
                                  Удалить
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Добавление нового документа */}
          {canManage && (
            <div className="mt-2 rounded-xl border bg-gray-50 p-3">
              <h3 className="text-xs font-semibold text-gray-700">
                Добавить документ клиента
              </h3>
              <form
                onSubmit={handleAdd}
                className="mt-2 grid gap-2 text-[11px] md:grid-cols-2"
              >
                <div>
                  <label className="mb-1 block text-gray-500">
                    Тип документа
                  </label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full rounded-xl border px-2 py-1"
                  >
                    {OWNER_DOCUMENT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                    {!OWNER_DOCUMENT_TYPES.includes(
                      newType as (typeof OWNER_DOCUMENT_TYPES)[number]
                    ) && <option value={newType}>{newType}</option>}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-gray-500">
                    Название документа <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full rounded-xl border px-2 py-1"
                    placeholder="Например: Договор на оказание услуг №123"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-gray-500">
                    Ссылка на файл (URL)
                  </label>
                  <input
                    type="text"
                    value={newFileUrl}
                    onChange={(e) => setNewFileUrl(e.target.value)}
                    className="w-full rounded-xl border px-2 py-1"
                    placeholder="https://… (готовый файл в хранилище или внешнем сервисе)"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-gray-500">
                    Файл (загрузить в хранилище)
                  </label>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="w-full text-[11px]"
                  />
                  <p className="mt-1 text-[10px] text-gray-500">
                    Можно либо указать ссылку, либо выбрать файл. Если указаны
                    оба варианта, будет использован загруженный файл.
                  </p>
                </div>

                <div>
                  <label className="mb-1 block text-gray-500">
                    Служебные заметки
                  </label>
                  <textarea
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    rows={3}
                    className="w-full rounded-xl border px-2 py-1"
                    placeholder="Например: оригинал в бумажном архиве, подписан обеими сторонами…"
                  />
                </div>

                <div className="md:col-span-2 flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={savingNew}
                    className="rounded-xl bg-emerald-600 px-4 py-1.5 text-[11px] font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {savingNew ? "Сохраняю…" : "Добавить документ"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
