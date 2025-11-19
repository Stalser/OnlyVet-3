"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { RegistrarHeader } from "@/components/registrar/RegistrarHeader";
import { supabase } from "@/lib/supabaseClient";

type DocKind = "owner" | "pet";

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

type KindFilter = "all" | "owner" | "pet";

const STORAGE_BUCKET = "onlyvet-docs"; // на будущее, если будем показывать файлы

export default function FinanceCenterPage() {
  const [rows, setRows] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // фильтры
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [ownerFilter, setOwnerFilter] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  // ошибки действий
  const [actionError, setActionError] = useState<string | null>(null);

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
        // 1. Считываем все счета
        const { data: invData, error: invError } = await client
          .from("invoices")
          .select(
            "id, owner_id, status, created_at, total_amount, currency, notes"
          )
          .order("created_at", { ascending: false });

        if (invError) throw invError;

        const invoices = (invData || []) as any[];

        // 2. Подбираем владельцев
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

        if (!ignore) {
          setRows(unified);
        }
      } catch (e) {
        console.error("loadAll invoices error", e);
        if (!ignore) {
          setLoadError("Не удалось загрузить список счетов.");
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

  const resetFilters = () => {
    setStatusFilter("all");
    setOwnerFilter("");
    setDateFrom("");
    setDateTo("");
  };

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
              клиентам. Пока режим только просмотра, без редактирования.
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

        {/* СВОДКА + ФИЛЬТРЫ ПО ВЕРХУ ТАБЛИЦЫ */}
        <section className="rounded-2xl border bg-white p-4 space-y-3">
          {/* Заголовок + счётчик + кнопки справа */}
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
                  счетов. Страница {page} из {totalPages}.
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={resetFilters}
                className="rounded-xl border border-emerald-600 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
              >
                Сбросить фильтры
              </button>
            </div>
          </div>

          <div className="grid gap-2 text-[11px] md:grid-cols-3">
            <div className="rounded-xl border bg-gray-50 px-3 py-2">
              <div className="text-gray-500">Всего по счетам</div>
              <div className="text-lg font-semibold">
                {totalAmount.toLocaleString("ru-RU", {
                  style: "currency",
                  currency: "RUB",
                  maximumFractionDigits: 0,
                })}
              </div>
            </div>
          </div>

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
                {/* строка фильтров по колонкам, аналогично "Клиенты" */}
                <tr className="border-b bg-white text-[11px] text-gray-700">
                  <th className="px-2 py-2 align-top"></th>
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
                  <th className="px-2 py-2 align-top"></th>
                  <th className="px-2 py-2 align-top"></th>
                  <th className="px-2 py-2 align-top"></th>
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
                          {/* позже здесь появится "Открыть счёт" */}
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
              <div>
                Страница {page} из {totalPages}.
              </div>
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
