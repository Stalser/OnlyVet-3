"use client";

import { useEffect, useState } from "react";
import { getOwnerInvoices, type InvoiceWithPayments } from "@/lib/finance";

type Props = {
  ownerId: number;
  /** Может ли текущий пользователь управлять финансами (создание/редактирование счетов). */
  canManage?: boolean;
};

function getPaidAmount(invoice: InvoiceWithPayments): number {
  return (invoice.payments || [])
    .filter(
      (p) =>
        p.status === "successful" ||
        p.status === "paid" ||
        p.status === "completed"
    )
    .reduce((sum, p) => sum + (p.amount || 0), 0);
}

function formatDateTime(iso: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("ru-RU");
}

function statusLabel(status: string) {
  switch (status) {
    case "draft":
      return { text: "Черновик", color: "bg-gray-100 text-gray-700" };
    case "issued":
      return { text: "Выставлен", color: "bg-blue-100 text-blue-700" };
    case "paid":
      return { text: "Оплачен", color: "bg-emerald-100 text-emerald-700" };
    case "partial":
      return { text: "Частично оплачен", color: "bg-amber-100 text-amber-700" };
    case "cancelled":
      return {
        text: "Отменён",
        color: "bg-red-100 text-red-700 line-through",
      };
    default:
      return { text: status || "—", color: "bg-gray-100 text-gray-700" };
  }
}

export function ClientFinanceSection({ ownerId, canManage = false }: Props) {
  const [invoices, setInvoices] = useState<InvoiceWithPayments[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<"all" | "unpaid" | "paid">(
    "all"
  );

  useEffect(() => {
    let ignore = false;

    async function load() {
      setLoading(true);
      setErrorText(null);
      try {
        const data = await getOwnerInvoices(ownerId);
        if (!ignore) {
          setInvoices(data);
        }
      } catch (e) {
        console.error("getOwnerInvoices error", e);
        if (!ignore) {
          setErrorText("Не удалось загрузить финансовые данные клиента.");
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

  const filteredInvoices = invoices.filter((inv) => {
    const paid = getPaidAmount(inv);
    if (statusFilter === "paid") {
      return paid >= inv.total_amount && inv.total_amount > 0;
    }
    if (statusFilter === "unpaid") {
      return inv.total_amount > 0 && paid < inv.total_amount;
    }
    return true;
  });

  const totalAmount = invoices.reduce(
    (sum, inv) => sum + (inv.total_amount || 0),
    0
  );
  const totalPaid = invoices.reduce(
    (sum, inv) => sum + getPaidAmount(inv),
    0
  );
  const totalOutstanding = totalAmount - totalPaid;

  return (
    <section className="rounded-2xl border bg-white p-4 space-y-3">
      {/* ШАПКА БЛОКА */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">Финансы клиента</h2>
          <p className="text-[11px] text-gray-500">
            Счета и оплаты по всем консультациям и услугам клиента. Здесь пока
            только просмотр; создание и редактирование счетов добавим на
            следующем шаге.
          </p>
        </div>
        {canManage && (
          <button
            type="button"
            className="rounded-xl bg-emerald-600 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-emerald-700"
            onClick={() => {
              alert("Создание счёта добавим на следующем шаге.");
            }}
          >
            Создать счёт
          </button>
        )}
      </div>

      {/* СВОДКА */}
      <div className="grid gap-2 text-[11px] md:grid-cols-3">
        <div className="rounded-xl border bg-gray-50 px-3 py-2">
          <div className="text-gray-500">Всего выставлено</div>
          <div className="text-lg font-semibold">
            {totalAmount.toLocaleString("ru-RU", {
              style: "currency",
              currency: "RUB",
              maximumFractionDigits: 0,
            })}
          </div>
        </div>
        <div className="rounded-xl border bg-gray-50 px-3 py-2">
          <div className="text-gray-500">Оплачено</div>
          <div className="text-lg font-semibold text-emerald-700">
            {totalPaid.toLocaleString("ru-RU", {
              style: "currency",
              currency: "RUB",
              maximumFractionDigits: 0,
            })}
          </div>
        </div>
        <div className="rounded-xl border bg-gray-50 px-3 py-2">
          <div className="text-gray-500">Задолженность</div>
          <div className="text-lg font-semibold text-red-600">
            {totalOutstanding.toLocaleString("ru-RU", {
              style: "currency",
              currency: "RUB",
              maximumFractionDigits: 0,
            })}
          </div>
        </div>
      </div>

      {/* ФИЛЬТР ПО СТАТУСУ */}
      {!loading && invoices.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <span className="text-gray-500">Фильтр по статусу:</span>
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`rounded-full px-3 py-1 border ${
              statusFilter === "all"
                ? "bg-emerald-600 text-white border-emerald-600"
                : "border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            Все
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("unpaid")}
            className={`rounded-full px-3 py-1 border ${
              statusFilter === "unpaid"
                ? "bg-amber-500 text-white border-amber-500"
                : "border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            Неоплаченные
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("paid")}
            className={`rounded-full px-3 py-1 border ${
              statusFilter === "paid"
                ? "bg-emerald-600 text-white border-emerald-700"
                : "border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            Оплаченные
          </button>
        </div>
      )}

      {/* ОШИБКИ */}
      {errorText && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700">
          {errorText}
        </div>
      )}

      {/* ТАБЛИЦА СЧЁТОВ */}
      {!loading && (
        <div className="overflow-x-auto">
          <table className="min-w-full text-[11px]">
            <thead>
              <tr className="border-b bg-gray-50 text-left uppercase text-gray-500">
                <th className="px-2 py-2">№</th>
                <th className="px-2 py-2">Дата</th>
                <th className="px-2 py-2">Статус</th>
                <th className="px-2 py-2">Сумма</th>
                <th className="px-2 py-2">Оплачено</th>
                <th className="px-2 py-2">Задолженность</th>
                <th className="px-2 py-2 text-right">Действия</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-2 py-4 text-center text-[11px] text-gray-400"
                  >
                    {invoices.length === 0
                      ? "Счета для этого клиента ещё не выставлялись."
                      : "Нет счетов, удовлетворяющих текущим фильтрам."}
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const paid = getPaidAmount(inv);
                  const outstanding = (inv.total_amount || 0) - paid;
                  const badge = statusLabel(inv.status);

                  return (
                    <tr
                      key={inv.id}
                      className="border-b last:border-0 hover:bg-gray-50"
                    >
                      <td className="px-2 py-2 align-top text-gray-700">
                        #{inv.id}
                      </td>
                      <td className="px-2 py-2 align-top text-gray-700">
                        {formatDateTime(inv.created_at)}
                      </td>
                      <td className="px-2 py-2 align-top">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${badge.color}`}
                        >
                          {badge.text}
                        </span>
                      </td>
                      <td className="px-2 py-2 align-top text-gray-700">
                        {inv.total_amount.toLocaleString("ru-RU", {
                          style: "currency",
                          currency: inv.currency || "RUB",
                          maximumFractionDigits: 0,
                        })}
                      </td>
                      <td className="px-2 py-2 align-top text-emerald-700">
                        {paid > 0
                          ? paid.toLocaleString("ru-RU", {
                              style: "currency",
                              currency: inv.currency || "RUB",
                              maximumFractionDigits: 0,
                            })
                          : "—"}
                      </td>
                      <td className="px-2 py-2 align-top text-red-600">
                        {outstanding > 0
                          ? outstanding.toLocaleString("ru-RU", {
                              style: "currency",
                              currency: inv.currency || "RUB",
                              maximumFractionDigits: 0,
                            })
                          : "—"}
                      </td>
                      <td className="px-2 py-2 align-top text-right space-y-1">
                        <button
                          type="button"
                          className="block w-full text-left text-[11px] text-emerald-700 hover:underline"
                          onClick={() => {
                            alert(
                              `Открытие подробностей счёта #${inv.id} добавим на следующем шаге.`
                            );
                          }}
                        >
                          Открыть
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {!loading && filteredInvoices.length > 0 && (
            <div className="mt-2 text-[10px] text-gray-500">
              Всего счетов: {invoices.length}. Отфильтровано:{" "}
              {filteredInvoices.length}.
            </div>
          )}
        </div>
      )}
    </section>
  );
}
