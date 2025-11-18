"use client";

import { useState, useEffect, FormEvent, ChangeEvent } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { PetDocument } from "@/lib/documents";
import { getPetDocuments } from "@/lib/documents";

type Props = {
  petId: number;
  /** Может ли текущий пользователь добавлять/редактировать/удалять документы */
  canManage?: boolean;
};

const STORAGE_BUCKET = "onlyvet-docs";

const PET_DOCUMENT_TYPES = [
  "Заключение врача / консультация",
  "Результат лабораторного анализа",
  "Результат инструментального исследования (УЗИ/рентген/КТ/ЭХО)",
  "Протокол операции / наркозный лист",
  "Выписка из стационара",
  "Вакцинация / ветпаспорт / чипирование",
  "Направление",
  "Иное",
] as const;

export function PetDocumentsSection({ petId, canManage = false }: Props) {
  const [docs, setDocs] = useState<PetDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState<string | null>(null);

  const [expanded, setExpanded] = useState(true);

  // добавление
  const [newType, setNewType] =
    useState<string>("Заключение врача / консультация");
  const [newTitle, setNewTitle] = useState("");
  const [newFileUrl, setNewFileUrl] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [newFile, setNewFile] = useState<File | null>(null);
  const [savingNew, setSavingNew] = useState(false);

  // редактирование (через URL)
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editType, setEditType] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editFileUrl, setEditFileUrl] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  // фильтры
  const [filterType, setFilterType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    let ignore = false;

    async function load() {
      setLoading(true);
      setErrorText(null);
      try {
        const data = await getPetDocuments(petId);
        if (!ignore) {
          const sorted = [...data].sort((a, b) => {
            const da = new Date(a.created_at).getTime();
            const db = new Date(b.created_at).getTime();
            return db - da;
          });
          setDocs(sorted);
        }
      } catch (e) {
        console.error("getPetDocuments error", e);
        if (!ignore) {
          setErrorText("Не удалось загрузить документы питомца.");
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    load();
    return () => {
      ignore = true;
    };
  }, [petId]);

  const resetNewForm = () => {
    setNewType("Заключение врача / консультация");
    setNewTitle("");
    setNewFileUrl("");
    setNewNotes("");
    setNewFile(null);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setNewFile(file);
  };

  async function uploadPetFile(file: File): Promise<string | null> {
    const client = supabase;
    if (!client) {
      setErrorText("Supabase недоступен на клиенте.");
      return null;
    }

    const ext = file.name.split(".").pop() || "file";
    const path = `pets/${petId}/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${ext}`;

    const { error: uploadError } = await client.storage
      .from(STORAGE_BUCKET)
      .upload(path, file);

    if (uploadError) {
      console.error("upload pet document error", uploadError);
      setErrorText("Не удалось загрузить файл в хранилище.");
      return null;
    }

    const { data: publicData } = client.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(path);

    return publicData.publicUrl ?? null;
  }

  const startEdit = (doc: PetDocument) => {
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

    if (newFile) {
      const uploadedUrl = await uploadPetFile(newFile);
      if (!uploadedUrl) {
        setSavingNew(false);
        return;
      }
      finalUrl = uploadedUrl;
    }

    const payload = {
      pet_id: petId,
      type: newType.trim(),
      title: newTitle.trim(),
      file_url: finalUrl,
      notes: newNotes.trim() || null,
    };

    const { data, error } = await client
      .from("pet_documents")
      .insert(payload)
      .select("*")
      .single();

    if (error || !data) {
      console.error("pet_documents insert error", error);
      setErrorText("Не удалось добавить документ питомца.");
      setSavingNew(false);
      return;
    }

    const created = data as PetDocument;
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
      .from("pet_documents")
      .update(payload)
      .eq("id", editingId);

    if (error) {
      console.error("pet_documents update error", error);
      setErrorText("Не удалось сохранить изменения документа.");
      setSavingEdit(false);
      return;
    }

    setDocs((prev) =>
      prev
        .map((d) =>
          d.id === editingId
            ? { ...d, ...payload, updated_at: new Date().toISOString() }
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
    if (!confirm("Удалить этот документ питомца?")) return;

    const client = supabase;
    if (!client) {
      setErrorText("Supabase недоступен на клиенте.");
      return;
    }

    setErrorText(null);

    const { error } = await client
      .from("pet_documents")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("pet_documents delete error", error);
      setErrorText("Не удалось удалить документ.");
      return;
    }

    setDocs((prev) => prev.filter((d) => d.id !== id));
    if (editingId === id) {
      setEditingId(null);
    }
  };

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

  let emptyMessage: string;
  if (!hasDocs) {
    emptyMessage = "Документов по этому питомцу пока нет.";
  } else {
    emptyMessage = "Нет документов, удовлетворяющих текущим фильтрам.";
  }

  return (
    <section className="rounded-2xl border bg-white p-4 space-y-3">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between text-left"
      >
        <div>
          <h2 className="text-base font-semibold">Документы питомца</h2>
          <p className="text-[11px] text-gray-500">
            Медицинские документы по этому животному: заключения, анализы, УЗИ,
            выписки, операции и т.д.
          </p>
        </div>
        <span className="text-[11px] text-gray-500">
          {expanded ? "Свернуть ▲" : "Развернуть ▼"}
        </span>
      </button>

      {expanded && (
        <>
          {errorText && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700">
              {errorText}
            </div>
          )}

          {loading && (
            <p className="text-[11px] text-gray-500">
              Загрузка документов питомца…
            </p>
          )}

          {!loading && (
            <>
              {/* Фильтры */}
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

              {/* Таблица */}
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
                                  {PET_DOCUMENT_TYPES.map((t) => (
                                    <option key={t} value={t}>
                                      {t}
                                    </option>
                                  ))}
                                  {!PET_DOCUMENT_TYPES.includes(
                                    editType as any
                                  ) &&
                                    editType && (
                                      <option value={editType}>
                                        {editType}
                                      </option>
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
                                <div className="text-[10px] text-gray-500">
                                  Файл: {d.file_url}
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
                                <a
                                  href={d.file_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="block w-full text-left text-[11px] text-emerald-700 hover:underline"
                                >
                                  Открыть / скачать
                                </a>
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

              {/* Добавление нового документа */}
              {canManage && (
                <div className="mt-2 rounded-xl border bg-gray-50 p-3">
                  <h3 className="text-xs font-semibold text-gray-700">
                    Добавить документ питомца
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
                        {PET_DOCUMENT_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                        {!PET_DOCUMENT_TYPES.includes(newType as any) && (
                          <option value={newType}>{newType}</option>
                        )}
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-gray-500">
                        Название документа{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        className="w-full rounded-xl border px-2 py-1"
                        placeholder="Например: ОАК от 12.03.2025"
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
                        Можно либо указать ссылку, либо выбрать файл. Если
                        указаны оба варианта, будет использован загруженный
                        файл.
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
                        placeholder="Например: внешний лабцентр, оригинал в бумажном архиве…"
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
            </>
          )}
        </>
      )}
    </section>
  );
}
