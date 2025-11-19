"use client";

import { useEffect, useState, FormEvent } from "react";
import Link from "next/link";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { RegistrarHeader } from "@/components/registrar/RegistrarHeader";
import { supabase } from "@/lib/supabaseClient";

// Тип объединённой строки документа
type DocKind = "owner" | "pet";

type UnifiedDocRow = {
  id: number;
  kind: DocKind;
  type: string;
  title: string;
  file_url: string | null;
  notes: string | null;
  created_at: string;
  ownerId: number | null;
  ownerName: string | null;
  petId: number | null;
  petName: string | null;
};

type OwnerDocRaw = {
  id: number;
  owner_id: number;
  type: string;
  title: string;
  file_url: string | null;
  notes: string | null;
  created_at: string;
};

type PetDocRaw = {
  id: number;
  pet_id: number;
  type: string;
  title: string;
  file_url: string | null;
  notes: string | null;
  created_at: string;
};

type OwnerProfile = {
  user_id: number;
  full_name: string | null;
};

type PetRow = {
  id: number;
  owner_id: number;
  name: string | null;
};

// Фильтры
type KindFilter = "all" | "owner" | "pet";

// имя bucket'а, как в Client/PetDocumentsSection
const STORAGE_BUCKET = "onlyvet-docs";

// определяем, наш ли это файл из Supabase Storage
function isInternalFile(url: string | null | undefined) {
  if (!url) return false;
  return url.includes(`/storage/v1/object/public/${STORAGE_BUCKET}/`);
}

export default function DocumentsCenterPage() {
  const [rows, setRows] = useState<UnifiedDocRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // фильтры
  const [kindFilter, setKindFilter] = useState<KindFilter>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  // редактирование
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingKind, setEditingKind] = useState<DocKind | null>(null);
  const [editType, setEditType] = useState<string>("");
  const [editTitle, setEditTitle] = useState<string>("");
  const [editFileUrl, setEditFileUrl] = useState<string>("");
  const [editNotes, setEditNotes] = useState<string>("");
  const [savingEdit, setSavingEdit] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // списки типов для подсказок при редактировании
  const OWNER_DOC_TYPES = [
    "Договор на оказание услуг",
    "Долгосрочный договор / абонемент",
    "Акт выполненных работ",
    "Информированное согласие",
    "Согласие на операцию / анестезию",
    "Согласие на обработку персональных данных",
    "Согласие на обработку мед. данных",
    "Заявление / претензия",
    "Иное",
  ];

  const PET_DOC_TYPES = [
    "Заключение врача / консультация",
    "Результат лабораторного анализа",
    "Результат инструментального исследования (УЗИ/рентген/КТ/ЭХО)",
    "Протокол операции / наркозный лист",
    "Выписка из стационара",
    "Вакцинация / ветпаспорт / чипирование",
    "Направление",
    "Иное",
  ];

  // ====== ЗАГРУЗКА ВСЕХ ДОКУМЕНТОВ ======

  useEffect(() => {
    let ignore = false;

    async function loadAll() {
      setLoading(true);
      setLoadError(null);
      setActionError(null);

      const client = supabase;
      if (!client) {
        setLoadError("Supabase недоступен на клиенте.");
        setLoading(false);
        return;
      }

      try {
        // 1. Документы владельцев
        const { data: ownerDocsData, error: ownerDocsError } =
          await client
            .from("owner_documents")
            .select(
              "id, owner_id, type, title, file_url, notes, created_at"
            );

        if (ownerDocsError) throw ownerDocsError;
        const ownerDocs = (ownerDocsData || []) as OwnerDocRaw[];

        // 2. Документы питомцев
        const { data: petDocsData, error: petDocsError } = await client
          .from("pet_documents")
          .select(
            "id, pet_id, type, title, file_url, notes, created_at"
          );

        if (petDocsError) throw petDocsError;
        const petDocs = (petDocsData || []) as PetDocRaw[];

        // Собираем ID
        const ownerIds = new Set<number>();
        ownerDocs.forEach((d) => ownerIds.add(d.owner_id));

        const petIds = new Set<number>();
        petDocs.forEach((d) => petIds.add(d.pet_id));

        // 3. Питомцы
        const petIdsArray = Array.from(petIds);
        let pets: PetRow[] = [];
        if (petIdsArray.length > 0) {
          const { data: petsData, error: petsError } = await client
            .from("pets")
            .select("id, owner_id, name")
            .in("id", petIdsArray);

          if (petsError) throw petsError;
          pets = (petsData || []) as PetRow[];
          pets.forEach((p) => {
            if (p.owner_id) ownerIds.add(p.owner_id);
          });
        }

        // 4. Владельцы
        const ownerIdsArray = Array.from(ownerIds);
        let owners: OwnerProfile[] = [];
        if (ownerIdsArray.length > 0) {
          const { data: ownersData, error: ownersError } = await client
            .from("owner_profiles")
            .select("user_id, full_name")
            .in("user_id", ownerIdsArray);

          if (ownersError) throw ownersError;
          owners = (ownersData || []) as OwnerProfile[];
        }

        // 5. Мапы
        const ownerMap = new Map<number, OwnerProfile>();
        owners.forEach((o) => ownerMap.set(o.user_id, o));

        const petMap = new Map<number, PetRow>();
        pets.forEach((p) => petMap.set(p.id, p));

        // 6. Собираем единый список
        const unified: UnifiedDocRow[] = [];

        // owner_documents
        for (const d of ownerDocs) {
          const owner = ownerMap.get(d.owner_id);
          unified.push({
            id: d.id,
            kind: "owner",
            type: d.type,
            title: d.title,
            file_url: d.file_url,
            notes: d.notes,
            created_at: d.created_at,
            ownerId: d.owner_id,
            ownerName: owner?.full_name || null,
            petId: null,
            petName: null,
          });
        }

        // pet_documents
        for (const d of petDocs) {
          const pet = petMap.get(d.pet_id);
          const owner = pet ? ownerMap.get(pet.owner_id) : undefined;
          unified.push({
            id: d.id,
            kind: "pet",
            type: d.type,
            title: d.title,
            file_url: d.file_url,
            notes: d.notes,
            created_at: d.created_at,
            ownerId: pet?.owner_id ?? null,
            ownerName: owner?.full_name || null,
            petId: d.pet_id,
            petName: pet?.name || null,
          });
        }

        unified.sort((a, b) => {
          const da = new Date(a.created_at).getTime();
          const db = new Date(b.created_at).getTime();
          return db - da; // новые сверху
        });

        if (!ignore) {
          setRows(unified);
        }
      } catch (e) {
        console.error("loadAll documents error", e);
        if (!ignore) {
          setLoadError("Не удалось загрузить общий список документов.");
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadAll();
    return () => {
      ignore = true;
    };
  }, []);

  // ===== ВСПОМОГАТЕЛЬНЫЕ ДЕЙСТВИЯ =====

  const startEditRow = (row: UnifiedDocRow) => {
    setEditingId(row.id);
    setEditingKind(row.kind);
    setEditType(row.type);
    setEditTitle(row.title);
    setEditFileUrl(row.file_url || "");
    setEditNotes(row.notes || "");
    setActionError(null);
  };

  const cancelEditRow = () => {
    setEditingId(null);
    setEditingKind(null);
    setSavingEdit(false);
    setActionError(null);
  };

  const handleEditSave = async (e: FormEvent) => {
    e.preventDefault();
    if (editingId == null || !editingKind) return;

    const client = supabase;
    if (!client) {
      setActionError("Supabase недоступен на клиенте.");
      return;
    }

    if (!editTitle.trim()) {
      setActionError("Название документа не может быть пустым.");
      return;
    }

    setSavingEdit(true);
    setActionError(null);

    const payload = {
      type: editType.trim() || "Иное",
      title: editTitle.trim(),
      file_url: editFileUrl.trim() || null,
      notes: editNotes.trim() || null,
    };

    try {
      if (editingKind === "owner") {
        const { error } = await client
          .from("owner_documents")
          .update(payload)
          .eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await client
          .from("pet_documents")
          .update(payload)
          .eq("id", editingId);
        if (error) throw error;
      }

      setRows((prev) =>
        prev
          .map((r) =>
            r.id === editingId && r.kind === editingKind
              ? { ...r, ...payload }
              : r
          )
          .sort((a, b) => {
            const da = new Date(a.created_at).getTime();
            const db = new Date(b.created_at).getTime();
            return db - da;
          })
      );
      setSavingEdit(false);
      setEditingId(null);
      setEditingKind(null);
    } catch (err) {
      console.error("documents update error", err);
      setActionError("Не удалось сохранить изменения документа.");
      setSavingEdit(false);
    }
  };

  const handleDelete = async (row: UnifiedDocRow) => {
    if (!confirm("Удалить этот документ?")) return;

    const client = supabase;
    if (!client) {
      setActionError("Supabase недоступен на клиенте.");
      return;
    }

    setActionError(null);

    try {
      if (row.kind === "owner") {
        const { error } = await client
          .from("owner_documents")
          .delete()
          .eq("id", row.id);
        if (error) throw error;
      } else {
        const { error } = await client
          .from("pet_documents")
          .delete()
          .eq("id", row.id);
        if (error) throw error;
      }

      setRows((prev) =>
        prev.filter((r) => !(r.id === row.id && r.kind === row.kind))
      );
      if (editingId === row.id && editingKind === row.kind) {
        setEditingId(null);
        setEditingKind(null);
      }
    } catch (err) {
      console.error("documents delete error", err);
      setActionError("Не удалось удалить документ.");
    }
  };

  // ===== ПРИМЕНЕНИЕ ФИЛЬТРОВ =====

  const typeOptions = Array.from(new Set(rows.map((r) => r.type))).sort();

  const filteredRows = rows.filter((r) => {
    if (kindFilter !== "all" && r.kind !== kindFilter) return false;

    if (typeFilter !== "all" && r.type !== typeFilter) return false;

    if (dateFrom) {
      const fromTs = new Date(dateFrom).getTime();
      const createdTs = new Date(r.created_at).getTime();
      if (createdTs < fromTs) return false;
    }

    if (dateTo) {
      const createdTs = new Date(r.created_at).getTime();
      const endOfDay = new Date(dateTo + "T23:59:59").getTime();
      if (createdTs > endOfDay) return false;
    }

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      const haystack =
        (r.title || "").toLowerCase() +
        " " +
        (r.type || "").toLowerCase() +
        " " +
        (r.notes || "").toLowerCase() +
        " " +
        (r.ownerName || "").toLowerCase() +
        " " +
        (r.petName || "").toLowerCase();
      if (!haystack.includes(q)) return false;
    }

    return true;
  });

  const formatDateTime = (iso: string) => {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString("ru-RU");
  };

  return (
    <RoleGuard allowed={["registrar", "admin"]}>
      <main className="mx-auto max-w-6xl px-4 py-6 space-y-6">
        {/* ШАПКА */}
        <header className="flex items-center justify-between">
          <div>
            <Link
              href="/backoffice/registrar"
              className="text-xs text-gray-500 hover:text-gray-700 hover:underline"
            >
              ← К панели регистратуры
            </Link>
            <h1 className="mt-2 text-2xl font-bold tracking-tight">
              Документы клиентов и питомцев
            </h1>
            <p className="text-sm text-gray-500">
              Единый центр управления документами: договоры, согласия, анализы,
              заключения, УЗИ, выписки и другие файлы.
            </p>
          </div>
          <RegistrarHeader />
        </header>

        {/* ОШИБКИ */}
        {loadError && (
          <section className="rounded-2xl border bg-white p-3">
            <p className="text-xs text-red-700">{loadError}</p>
          </section>
        )}
        {actionError && (
          <section className="rounded-2xl border bg-white p-3">
            <p className="text-xs text-red-700">{actionError}</p>
          </section>
        )}

        {/* ФИЛЬТРЫ */}
        <section className="rounded-2xl border bg-white p-4 space-y-3">
          <h2 className="text-sm font-semibold">Фильтры</h2>
          <div className="grid gap-3 text-[11px] md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1">
              <div className="text-gray-500">Принадлежность</div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setKindFilter("all")}
                  className={`rounded-xl border px-3 py-1.5 ${
                    kindFilter === "all"
                      ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                      : "border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Все
                </button>
                <button
                  type="button"
                  onClick={() => setKindFilter("owner")}
                  className={`rounded-xl border px-3 py-1.5 ${
                    kindFilter === "owner"
                      ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                      : "border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Документы клиента
                </button>
                <button
                  type="button"
                  onClick={() => setKindFilter("pet")}
                  className={`rounded-xl border px-3 py-1.5 ${
                    kindFilter === "pet"
                      ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                      : "border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Документы питомца
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-gray-500">Тип документа</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full rounded-xl border px-3 py-1.5"
              >
                <option value="all">Все типы</option>
                {typeOptions.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-gray-500">Поиск по тексту</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border px-3 py-1.5"
                placeholder="Название, клиент, питомец, пометки…"
              />
            </div>

            <div className="space-y-1">
              <label className="text-gray-500">Дата с</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full rounded-xl border px-3 py-1.5"
              />
            </div>
            <div className="space-y-1">
              <label className="text-gray-500">Дата по</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full rounded-xl border px-3 py-1.5"
              />
            </div>

            <div className="space-y-1">
              <div className="text-gray-500">Быстрые действия</div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setKindFilter("all");
                    setTypeFilter("all");
                    setSearchQuery("");
                    setDateFrom("");
                    setDateTo("");
                  }}
                  className="rounded-xl border border-gray-300 px-3 py-1.5 text-gray-700 hover:bg-gray-50"
                >
                  Сбросить фильтры
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ТАБЛИЦА ДОКУМЕНТОВ */}
        <section className="rounded-2xl border bg-white p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Все документы</h2>
            {loading && (
              <span className="text-[11px] text-gray-500">
                Загрузка…
              </span>
            )}
          </div>

          {!loading && filteredRows.length === 0 && (
            <p className="text-[11px] text-gray-500">
              Документов, удовлетворяющих текущим фильтрам, нет.
            </p>
          )}

          {!loading && filteredRows.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full text-[11px]">
                <thead>
                  <tr className="border-b bg-gray-50 text-left uppercase text-gray-500">
                    <th className="px-2 py-2">Тип</th>
                    <th className="px-2 py-2">Название</th>
                    <th className="px-2 py-2">Клиент</th>
                    <th className="px-2 py-2">Питомец</th>
                    <th className="px-2 py-2">Дата</th>
                    <th className="px-2 py-2 text-right">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row) => {
                    const isEditing =
                      editingId === row.id && editingKind === row.kind;
                    const isOwnerDoc = row.kind === "owner";
                    const isFile = isInternalFile(row.file_url);

                    if (isEditing) {
                      const typeList =
                        row.kind === "owner" ? OWNER_DOC_TYPES : PET_DOC_TYPES;

                      return (
                        <tr key={`${row.kind}-${row.id}`} className="border-b">
                          <td className="px-2 py-2 align-top">
                            <select
                              value={editType}
                              onChange={(e) =>
                                setEditType(e.target.value)
                              }
                              className="w-full rounded-xl border px-2 py-1"
                            >
                              {typeList.map((t) => (
                                <option key={t} value={t}>
                                  {t}
                                </option>
                              ))}
                              {!typeList.includes(editType) && editType && (
                                <option value={editType}>{editType}</option>
                              )}
                            </select>
                            <div className="mt-1 text-[10px] text-gray-500">
                              {isOwnerDoc
                                ? "Документ клиента"
                                : "Документ питомца"}
                            </div>
                          </td>
                          <td className="px-2 py-2 align-top">
                            <input
                              type="text"
                              value={editTitle}
                              onChange={(e) =>
                                setEditTitle(e.target.value)
                              }
                              className="mb-1 w-full rounded-xl border px-2 py-1"
                            />
                            <input
                              type="text"
                              value={editFileUrl}
                              onChange={(e) =>
                                setEditFileUrl(e.target.value)
                              }
                              className="w-full rounded-xl border px-2 py-1"
                              placeholder="Ссылка на файл (URL)"
                            />
                          </td>
                          <td className="px-2 py-2 align-top text-gray-700">
                            {row.ownerName || "—"}
                            {row.ownerId && (
                              <div>
                                <Link
                                  href={`/backoffice/registrar/clients/${row.ownerId}`}
                                  className="text-[10px] text-emerald-700 hover:underline"
                                >
                                  Открыть клиента
                                </Link>
                              </div>
                            )}
                          </td>
                          <td className="px-2 py-2 align-top text-gray-700">
                            {row.petName || "—"}
                            {row.petId && (
                              <div>
                                <Link
                                  href={`/backoffice/registrar/pets/${row.petId}`}
                                  className="text-[10px] text-emerald-700 hover:underline"
                                >
                                  Открыть питомца
                                </Link>
                              </div>
                            )}
                          </td>
                          <td className="px-2 py-2 align-top text-gray-500">
                            {formatDateTime(row.created_at)}
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
                              onClick={cancelEditRow}
                              className="block w-full rounded-xl border px-2 py-1 text-[11px] text-gray-700 hover:bg-gray-50"
                            >
                              Отмена
                            </button>
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <tr
                        key={`${row.kind}-${row.id}`}
                        className="border-b last:border-0"
                      >
                        <td className="px-2 py-2 align-top text-gray-700">
                          <span
                            className={
                              isOwnerDoc
                                ? "rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] text-emerald-700"
                                : "rounded-full bg-sky-50 px-2 py-0.5 text-[10px] text-sky-700"
                            }
                          >
                            {isOwnerDoc
                              ? "Документ клиента"
                              : "Документ питомца"}
                          </span>
                          <div className="mt-1 text-[11px] text-gray-700">
                            {row.type || "—"}
                          </div>
                          {row.file_url && (
                            <div className="mt-1 text-[10px] text-gray-400">
                              {isFile ? "Файл (хранилище)" : "Ссылка"}
                            </div>
                          )}
                        </td>
                        <td className="px-2 py-2 align-top">
                          {row.file_url ? (
                            <a
                              href={row.file_url}
                              target="_blank"
                              rel="noreferrer"
                              title={row.file_url}
                              className="text-emerald-700 hover:underline"
                            >
                              {row.title || "Документ"}
                            </a>
                          ) : (
                            <span className="text-gray-800">
                              {row.title || "Документ"}
                            </span>
                          )}
                          {row.notes && (
                            <div className="mt-1 text-[10px] text-gray-500">
                              {row.notes}
                            </div>
                          )}
                        </td>
                        <td className="px-2 py-2 align-top text-gray-700">
                          {row.ownerName || "—"}
                          {row.ownerId && (
                            <div>
                              <Link
                                href={`/backoffice/registrar/clients/${row.ownerId}`}
                                className="text-[10px] text-emerald-700 hover:underline"
                              >
                                Открыть клиента
                              </Link>
                            </div>
                          )}
                        </td>
                        <td className="px-2 py-2 align-top text-gray-700">
                          {row.petName || "—"}
                          {row.petId && (
                            <div>
                              <Link
                                href={`/backoffice/registrar/pets/${row.petId}`}
                                className="text-[10px] text-emerald-700 hover:underline"
                              >
                                Открыть питомца
                              </Link>
                            </div>
                          )}
                        </td>
                        <td className="px-2 py-2 align-top text-gray-500">
                          {formatDateTime(row.created_at)}
                        </td>
                        <td className="px-2 py-2 align-top text-right space-y-1">
                          {row.file_url && (
                            <>
                              {isFile ? (
                                <a
                                  href={row.file_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  title={row.file_url}
                                  download
                                  className="block w-full text-left text-[11px] text-emerald-700 hover:underline"
                                >
                                  Открыть файл
                                </a>
                              ) : (
                                <a
                                  href={row.file_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  title={row.file_url}
                                  className="block w-full text-left text-[11px] text-emerald-700 hover:underline"
                                >
                                  Перейти по ссылке
                                </a>
                              )}
                            </>
                          )}
                          <button
                            type="button"
                            onClick={() => startEditRow(row)}
                            className="block w-full text-left text-[11px] text-emerald-700 hover:underline"
                          >
                            Редактировать
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(row)}
                            className="block w-full text-left text-[11px] text-red-600 hover:underline"
                          >
                            Удалить
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </RoleGuard>
  );
}
