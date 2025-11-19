"use client";

import { useEffect, useState, FormEvent } from "react";
import Link from "next/link";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { RegistrarHeader } from "@/components/registrar/RegistrarHeader";
import { supabase } from "@/lib/supabaseClient";
import { createSimpleInvoiceForOwner } from "@/lib/finance";

type InvoiceRow = {
  id: number;
  ownerId: number | null;
  ownerName: string | null;
  status: string;
  created_at: string;
  total_amount: number;
  currency: string;
  notes: string | null;
};

type SearchOwner = {
  user_id: number;
  full_name: string | null;
};

const STORAGE_BUCKET = "onlyvet-docs"; // на будущее, если будем прикреплять файлы к счетам

export default function FinanceCenterPage() {
  const [rows, setRows] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // фильтры (глобальные)
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [ownerFilter, setOwnerFilter] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  // ошибки действий
  const [actionError, setActionError] = useState<string | null>(null);

  // форма создания счёта
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newDescription, setNewDescription] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newNotes, setNewNotes] = useState("");

  // выбор клиента через поиск
  const [ownerSearch, setOwnerSearch] = useState("");
  const [ownerSearchResults, setOwnerSearchResults] = useState<SearchOwner[]>([]);
  const [searchingOwners, setSearchingOwners] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState<{
    id: number;
    name: string | null;
  } | null>(null);

  const [savingInvoice, setSavingInvoice] = useState(false);

  // ===== ЗАГРУЗКА ВСЕХ СЧЁТОВ =====

  const fetchInvoices = async () => {
    const client = supabase;
    if (!client) {
      setLoadError("Supabase недоступен на клиенте.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError(null);
    setActionError(null);

    try {
      const { data: invData, error: invError } = await client
        .from("invoices")
        .select(
          "id, owner_id, status, created_at, total_amount, currency, notes"
        )
        .order("created_at", { ascending: false });

      if (invError) throw invError;

      const invoices = (invData || []) as any[];

      const ownerIds = Array.from(
        new Set<number>(
          invoices
            .map((i) => i.owner_id)
            .filter((id: number | null) => id != null)
        )
      );

      let owners: { user_id: number; full_name: string | null }[] = [];
      if (ownerIds.length > 0) {
        const { data: ownersData, error: ownersError } = await client
          .from("owner_profiles")
          .select("user_id, full_name")
          .in("user_id", ownerIds);

        if (ownersError) throw ownersError;
        owners =
          (ownersData as { user_id: number; full_name: string | null }[]) ||
          [];
      }

      const ownerMap = new Map<number, string | null>();
      owners.forEach((o) => ownerMap.set(o.user_id, o.full_name));

      const unified: InvoiceRow[] = invoices.map((inv) => ({
        id: inv.id,
        ownerId: inv.owner_id ?? null,
        ownerName:
          (inv.owner_id != null ? ownerMap.get(inv.owner_id) : null) || null,
        status: inv.status,
        created_at: inv.created_at,
        total_amount: Number(inv.total_amount ?? 0),
        currency: inv.currency || "RUB",
        notes: inv.notes ?? null,
      }));

      setRows(unified);
    } catch (e: any) {
      console.error("loadAll invoices error", e);
      const msg =
        e?.message ||
        e?.error?.message ||
        "Не удалось загрузить список счетов (ошибка без подробностей).";
      setLoadError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetFilters = () => {
    setStatusFilter("all");
    setOwnerFilter("");
    setDateFrom("");
    setDateTo("");
  };

  // ===== ФИЛЬТРАЦИЯ =====

  const filteredRows = rows.filter((r) => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;

    if (ownerFilter.trim()) {
      const q = ownerFilter.trim().toLowerCase();
      if (!(r.ownerName || "").toLowerCase().includes(q)) return false;
    }

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

    return true;
  });

  const page = 1;
  const totalPages = 1;
  const visibleRows = filteredRows;

  const formatDateTime = (iso: string) => {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString("ru-RU");
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case "draft":
        return { text: "Черновик", color: "bg-gray-100 text-gray-700" };
      case "issued":
        return { text: "Выставлен", color: "bg-blue-100 text-blue-700" };
      case "paid":
        return { text: "Оплачен", color: "bg-emerald-100 text-emerald-700" };
      case "partial":
        return {
          text: "Частично оплачен",
          color: "bg-amber-100 text-amber-700",
        };
      case "cancelled":
        return {
          text: "Отменён",
          color: "bg-red-100 text-red-700 line-through",
        };
      default:
        return { text: status || "—", color: "bg-gray-100 text-gray-700" };
    }
  };

  const totalAmount = rows.reduce(
    (sum, r) => sum + (r.total_amount || 0),
    0
  );

  // ===== ПОИСК КЛИЕНТА ДЛЯ СОЗДАНИЯ СЧЁТА =====

  const handleOwnerSearch = async (e: FormEvent) => {
    e.preventDefault();
    setActionError(null);

    const client = supabase;
    if (!client) {
      setActionError("Supabase недоступен на клиенте.");
      return;
    }

    const q = ownerSearch.trim();
    if (!q) {
      setOwnerSearchResults([]);
      return;
    }

    setSearchingOwners(true);
    try {
      const { data, error } = await client
        .from("owner_profiles")
        .select("user_id, full_name")
        .ilike("full_name", `%${q}%`)
        .order("full_name", { ascending: true })
        .limit(15);

      if (error) throw error;

      setOwnerSearchResults(
        (data as { user_id: number; full_name: string | null }[]) || []
      );
    } catch (err: any) {
      console.error("handleOwnerSearch error", err);
      setActionError(
        err?.message ||
          "Не удалось выполнить поиск клиента. Попробуйте ещё раз."
      );
    } finally {
      setSearchingOwners(false);
    }
  };

  const handleSelectOwner = (owner: SearchOwner) => {
    setSelectedOwner({
      id: owner.user_id,
      name: owner.full_name,
    });
    setOwnerSearchResults([]);
    setOwnerSearch(owner.full_name || String(owner.user_id));
    setActionError(null);
  };

  const handleResetSelectedOwner = () => {
    setSelectedOwner(null);
    setOwnerSearch("");
    setOwnerSearchResults([]);
  };

  // ===== СОЗДАНИЕ СЧЁТА =====

  const handleCreateInvoice = async (e: FormEvent) => {
    e.preventDefault();
    setActionError(null);

    if (!selectedOwner) {
      setActionError(
        "Сначала выберите клиента через поиск и подтвердите выбор."
      );
      return;
    }

    if (!newDescription.trim()) {
      setActionError("Укажите описание счёта.");
      return;
    }

    const amountNum = Number(newAmount.replace(",", "."));
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      setActionError("Сумма счёта должна быть положительным числом.");
      return;
    }

    setSavingInvoice(true);

    try {
      await createSimpleInvoiceForOwner({
        ownerId: selectedOwner.id,
        description: newDescription.trim(),
        amount: amountNum,
        notes: newNotes.trim() || null,
      });

      await fetchInvoices();

      // сбрасываем форму
      setSelectedOwner(null);
      setOwnerSearch("");
      setOwnerSearchResults([]);
      setNewDescription("");
      setNewAmount("");
      setNewNotes("");
      setShowCreateForm(false);
    } catch (err: any) {
      console.error("handleCreateInvoice error", err);
      setActionError(
        err?.message || "Не удалось создать счёт. Проверьте данные."
      );
    } finally {
      setSavingInvoice(false);
    }
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
              Финансы клиентов
            </h1>
            <p className="text-sm text-gray-500">
              Счета за консультации и услуги, статусы оплат и сводка по
              клиентам.
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

        {/* СЧЕТА КЛИЕНТОВ */}
        <section className="rounded-2xl border bg-white p-4 space-y-3">
          {/* Заголовок + сводка + кнопки справа */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <h2 className="text-sm font-semibold">Счета клиентов</h2>
              {!loading && (
                <div className="text-[11px] text-gray-500">
                  Показано{" "}
                  <span className="font-semibold">
                    {visibleRows.length}
                  </span>{" "}
                  из{" "}
                  <span className="font-semibold">{rows.length}</span>{" "}
                  счетов. Страница 1 из 1.
                </div>
              )}
              <div className="text-[11px] text-gray-500">
                Всего по счетам:{" "}
                <span className="font-semibold">
                  {totalAmount.toLocaleString("ru-RU", {
                    style: "currency",
                    currency: "RUB",
                    maximumFractionDigits: 0,
                  })}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={resetFilters}
                className="rounded-xl border border-emerald-600 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
              >
                Сбросить фильтры
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm((v) => !v);
                  setActionError(null);
                }}
                className="rounded-xl bg-emerald-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
              >
                {showCreateForm ? "Свернуть" : "Создать счёт"}
              </button>
            </div>
          </div>

          {/* ФОРМА СОЗДАНИЯ СЧЁТА */}
          {showCreateForm && (
            <div className="mt-2 rounded-xl border bg-gray-50 p-3">
              <h3 className="text-xs font-semibold text-gray-700">
                Создать новый счёт
              </h3>
              <form
                onSubmit={handleCreateInvoice}
                className="mt-2 grid gap-2 text-[11px] md:grid-cols-2"
              >
                {/* Поиск и выбор клиента */}
                <div className="md:col-span-2">
                  <label className="mb-1 block text-gray-500">
                    Клиент <span className="text-red-500">*</span>
                  </label>

                  {selectedOwner ? (
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-white px-3 py-1.5">
                      <div>
                        <div className="text-[11px] font-semibold text-gray-800">
                          {selectedOwner.name || "Без имени"}
                        </div>
                        <div className="text-[10px] text-gray-500">
                          ID клиента: {selectedOwner.id}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleResetSelectedOwner}
                        className="rounded-xl border px-2 py-1 text-[10px] text-gray-700 hover:bg-gray-50"
                      >
                        Сменить клиента
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <form
                        onSubmit={handleOwnerSearch}
                        className="flex flex-wrap items-center gap-2"
                      >
                        <input
                          type="text"
                          value={ownerSearch}
                          onChange={(e) => setOwnerSearch(e.target.value)}
                          className="flex-1 min-w-[160px] rounded-xl border px-3 py-1.5"
                          placeholder="Начните вводить ФИО клиента…"
                        />
                        <button
                          type="submit"
                          disabled={searchingOwners}
                          className="rounded-xl border border-emerald-600 px-3 py-1.5 text-[11px] text-emerald-700 hover:bg-emerald-50 disabled:opacity-60"
                        >
                          {searchingOwners ? "Ищем…" : "Найти"}
                        </button>
                      </form>

                      {ownerSearchResults.length > 0 && (
                        <div className="rounded-xl border bg-white p-2 max-h-48 overflow-y-auto">
                          <div className="mb-1 text-[10px] text-gray-500">
                            Найдено клиентов: {ownerSearchResults.length}. Выберите
                            нужного:
                          </div>
                          <ul className="space-y-1">
                            {ownerSearchResults.map((o) => (
                              <li key={o.user_id}>
                                <button
                                  type="button"
                                  onClick={() => handleSelectOwner(o)}
                                  className="flex w-full items-center justify-between rounded-lg px-2 py-1 text-left text-[11px] hover:bg-emerald-50"
                                >
                                  <span>{o.full_name || "Без имени"}</span>
                                  <span className="text-[10px] text-gray-500">
                                    ID: {o.user_id}
                                  </span>
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {ownerSearchResults.length === 0 &&
                        ownerSearch.trim().length > 0 &&
                        !searchingOwners && (
                          <div className="text-[10px] text-gray-400">
                            Клиенты по этому запросу не найдены. Уточните ФИО или
                            проверьте картотеку клиентов.
                          </div>
                        )}
                    </div>
                  )}
                </div>

                {/* Сумма */}
                <div>
                  <label className="mb-1 block text-gray-500">
                    Сумма счёта (RUB) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    className="w-full rounded-xl border px-3 py-1.5"
                    placeholder="Например: 3500"
                  />
                </div>

                {/* Описание */}
                <div>
                  <label className="mb-1 block text-gray-500">
                    Описание счёта <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="w-full rounded-xl border px-3 py-1.5"
                    placeholder="Например: Консультация терапевта + анализы"
                  />
                </div>

                {/* Заметки */}
                <div className="md:col-span-2">
                  <label className="mb-1 block text-gray-500">
                    Служебные заметки
                  </label>
                  <textarea
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    className="w-full rounded-xl border px-3 py-1.5"
                    rows={2}
                    placeholder="Например: счёт за приём от 19.11.2025, оплатить до..."
                  />
                </div>

                <div className="md:col-span-2 flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      setActionError(null);
                    }}
                    className="rounded-xl border px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    disabled={savingInvoice}
                    className="rounded-xl bg-emerald-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {savingInvoice ? "Создаю…" : "Создать счёт"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ТАБЛИЦА СЧЁТОВ */}
          <div className="overflow-x-auto">
            <table className="min-w-full text-[11px]">
              <thead>
                <tr className="border-b bg-gray-50 text-left uppercase text-gray-500">
                  <th className="px-2 py-2">№</th>
                  <th className="px-2 py-2">Дата</th>
                  <th className="px-2 py-2">Клиент</th>
                  <th className="px-2 py-2">Статус</th>
                  <th className="px-2 py-2">Сумма</th>
                  <th className="px-2 py-2">Примечания</th>
                  <th className="px-2 py-2 text-right">Действия</th>
                </tr>
                {/* строка фильтров по колонкам */}
                <tr className="border-b bg-white text-[11px] text-gray-700">
                  <th className="px-2 py-2 align-top" />
                  <th className="px-2 py-2 align-top">
                    <div className="space-y-1">
                      <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="w-full rounded-xl border px-2 py-1"
                      />
                      <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="w-full rounded-xl border px-2 py-1"
                      />
                    </div>
                  </th>
                  <th className="px-2 py-2 align-top">
                    <input
                      type="text"
                      value={ownerFilter}
                      onChange={(e) => setOwnerFilter(e.target.value)}
                      placeholder="ФИО клиента…"
                      className="w-full rounded-xl border px-2 py-1"
                    />
                  </th>
                  <th className="px-2 py-2 align-top">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full rounded-xl border px-2 py-1"
                    >
                      <option value="all">Все статусы</option>
                      <option value="draft">Черновики</option>
                      <option value="issued">Выставленные</option>
                      <option value="paid">Оплаченные</option>
                      <option value="partial">Частично оплаченные</option>
                      <option value="cancelled">Отменённые</option>
                    </select>
                  </th>
                  <th className="px-2 py-2 align-top" />
                  <th className="px-2 py-2 align-top" />
                  <th className="px-2 py-2 align-top" />
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-2 py-6 text-center text-[11px] text-gray-400"
                    >
                      Загрузка счетов…
                    </td>
                  </tr>
                ) : visibleRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-2 py-6 text-center text-[11px] text-gray-400"
                    >
                      Счетов, удовлетворяющих текущим фильтрам, нет.
                    </td>
                  </tr>
                ) : (
                  visibleRows.map((row) => {
                    const badge = statusLabel(row.status);

                    return (
                      <tr
                        key={row.id}
                        className="border-b last:border-0 hover:bg-gray-50"
                      >
                        <td className="px-2 py-2 align-top text-gray-700">
                          #{row.id}
                        </td>
                        <td className="px-2 py-2 align-top text-gray-700">
                          {formatDateTime(row.created_at)}
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
                        <td className="px-2 py-2 align-top">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${badge.color}`}
                          >
                            {badge.text}
                          </span>
                        </td>
                        <td className="px-2 py-2 align-top text-gray-700">
                          {row.total_amount.toLocaleString("ru-RU", {
                            style: "currency",
                            currency: row.currency || "RUB",
                            maximumFractionDigits: 0,
                          })}
                        </td>
                        <td className="px-2 py-2 align-top text-gray-700">
                          {row.notes || (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-2 py-2 align-top text-right space-y-1">
                          {row.ownerId && (
                            <Link
                              href={`/backoffice/registrar/clients/${row.ownerId}`}
                              className="block w-full text-right text-[11px] text-emerald-700 hover:underline"
                            >
                              В карточку клиента →
                            </Link>
                          )}
                          {/* позже: отдельная страница/модалка для счёта */}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* “подвал” как в Клиентах */}
          {!loading && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-[11px] text-gray-500">
              <div>Страница 1 из 1.</div>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled
                  className="rounded-xl border px-3 py-1.5 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-300"
                >
                  Назад
                </button>
                <button
                  type="button"
                  disabled
                  className="rounded-xl border px-3 py-1.5 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-300"
                >
                  Вперёд
                </button>
              </div>
            </div>
          )}
        </section>
      </main>
    </RoleGuard>
  );
}
