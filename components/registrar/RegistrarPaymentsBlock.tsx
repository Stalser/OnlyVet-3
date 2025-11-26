"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { servicesPricing } from "@/lib/pricing";

interface PaymentRecord {
  id: string;
  amount: number | null;
  currency: string | null;
  status: string | null;
  note: string | null;
  source: "clinic" | "client" | null;
  created_at: string;
}

interface RegistrarPaymentsBlockProps {
  appointmentId: string;
  serviceCode: string | null;
}

/**
 * Блок "Оплата по приёму" для карточки консультации.
 *
 * - Показывает оплаты по консультации.
 * - Даёт регистратуре возможность добавить оплату вручную.
 * - Если есть выбранная услуга и нет оплат — подставляет рекомендуемую сумму.
 */
export function RegistrarPaymentsBlock({
  appointmentId,
  serviceCode,
}: RegistrarPaymentsBlockProps) {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // форма добавления
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState("paid");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const canSave = amount.trim().length > 0;
async function loadPayments() {
  if (!supabase) return;

  setLoading(true);
  setError(null);

  try {
    const { data, error: payErr } = await supabase
      .from("payments")
      .select("id, amount, currency, status, note, source, created_at")
      .eq("appointment_id", appointmentId)
      .order("created_at", { ascending: true });

    if (payErr) {
      console.error(payErr);
      setError("Не удалось загрузить данные об оплатах: " + payErr.message);
    } else {
      setPayments((data ?? []) as PaymentRecord[]);
    }
  } catch (e: any) {
    console.error(e);
    setError("Ошибка при загрузке оплат: " + e.message);
  } finally {
    setLoading(false);
  }
}

  useEffect(() => {
    void loadPayments();
  }, [appointmentId]);

  /**
   * Если нет оплат, есть выбранная услуга и поле "Сумма" ещё пустое —
   * подставляем рекомендованную сумму из servicesPricing.
   */
  useEffect(() => {
    if (!serviceCode) return;
    if (payments.length > 0) return;
    if (amount.trim().length > 0) return;

    const priceItem = servicesPricing.find(
      (s: any) => s.code === serviceCode
    );
    if (!priceItem) return;

    const price =
  typeof priceItem.priceRUB === "number" ? priceItem.priceRUB : null;

    if (price != null && !Number.isNaN(price)) {
      setAmount(String(price));
    }
  }, [payments, serviceCode, amount]);

  async function handleAdd() {
    if (!supabase) return;

    if (!canSave) {
      setError("Укажите сумму оплаты.");
      return;
    }

    const parsed = Number(amount.replace(",", "."));
    if (Number.isNaN(parsed) || parsed <= 0) {
      setError("Введите корректную сумму (больше нуля).");
      return;
    }

    const statusLabel =
      status === "paid"
        ? "Оплачено"
        : status === "partial"
        ? "Частично оплачено"
        : status === "pending"
        ? "Ожидает оплаты"
        : "Отменена";

    const confirmText = [
      "Вы уверены, что хотите зарегистрировать оплату по этой консультации?",
      "",
      `Сумма: ${parsed} ₽`,
      `Статус: ${statusLabel}`,
      note.trim() ? `Комментарий: ${note.trim()}` : "",
      "",
      "Эта запись будет сохранена в карточке консультации.",
    ]
      .filter(Boolean)
      .join("\n");

    if (!window.confirm(confirmText)) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const { error: insertErr } = await supabase.from("payments").insert({
        appointment_id: appointmentId,
        amount: parsed,
        currency: "RUB",
        status,
        note: note.trim() || null,
        source: "clinic",
      });

      if (insertErr) {
        console.error(insertErr);
        setError("Не удалось добавить оплату: " + insertErr.message);
      } else {
        setAmount("");
        setStatus("paid");
        setNote("");
        await loadPayments();
      }
    } catch (e: any) {
      console.error(e);
      setError("Ошибка при добавлении оплаты: " + e.message);
    } finally {
      setSaving(false);
    }
  }

  function PaymentItem({ p }: { p: PaymentRecord }) {
    const label =
      p.status === "paid"
        ? "Оплачено"
        : p.status === "partial"
        ? "Частично оплачено"
        : p.status === "pending"
        ? "Ожидает оплаты"
        : p.status === "cancelled"
        ? "Отменена"
        : p.status || "—";

    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm space-y-1">
        <div className="flex justify-between items-baseline gap-2">
          <div className="font-medium">
            {typeof p.amount === "number" ? `${p.amount} ₽` : "Сумма не задана"}
          </div>
          <div className="text-[11px] text-gray-600">{label}</div>
        </div>

        {p.note && (
          <div className="text-xs text-gray-600 whitespace-pre-line">
            {p.note}
          </div>
        )}

        <div className="text-[10px] text-gray-400">
          Добавлено: {new Date(p.created_at).toLocaleString("ru-RU")}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Список оплат */}
      <div className="space-y-2">
        <div className="text-xs font-semibold uppercase text-gray-500">
          Оплаты, зарегистрированные клиникой
        </div>

        {loading && (
          <div className="rounded-xl bg-gray-50 px-3 py-2 text-xs text-gray-500">
            Загружаем оплаты…
          </div>
        )}

        {!loading && payments.length === 0 && (
          <div className="rounded-xl bg-gray-50 px-3 py-2 text-xs text-gray-500">
            Пока нет оплат, зарегистрированных по этой консультации.
          </div>
        )}

        {!loading && payments.length > 0 && (
          <div className="space-y-2">
            {payments.map((p) => (
              <PaymentItem key={p.id} p={p} />
            ))}
          </div>
        )}
      </div>

      {/* Форма добавления новой оплаты */}
      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-3 space-y-2">
        <div className="text-xs font-semibold text-gray-600">
          Добавить оплату
        </div>
        <div className="text-[11px] text-gray-500">
          Сумма указывается в рублях. В будущем сюда можно будет привязать кассу
          или онлайн-оплату.
        </div>

        <input
          type="text"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Сумма, ₽"
          className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-emerald-600 bg-white"
        />

        <div className="space-y-1">
          <div className="text-xs text-gray-500">Статус оплаты</div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-emerald-600 bg-white"
          >
            <option value="paid">Оплачено</option>
            <option value="partial">Частично оплачено</option>
            <option value="pending">Ожидает оплаты</option>
            <option value="cancelled">Отменена</option>
          </select>
        </div>

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Комментарий (способ оплаты, номер счёта, прочее)…"
          className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-emerald-600 bg-white min-h-[60px]"
        />

        {error && (
          <div className="text-[11px] text-red-600">{error}</div>
        )}

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleAdd}
            disabled={!canSave || saving}
            className="inline-flex items-center rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {saving ? "Сохраняем…" : "Сохранить оплату"}
          </button>
        </div>
      </div>
    </div>
  );
}
