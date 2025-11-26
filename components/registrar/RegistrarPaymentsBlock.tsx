"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

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
}

/**
 * Блок "Оплата по приёму" для карточки консультации.
 *
 * - Загружает оплаты из таблицы payments по appointment_id.
 * - Делит оплаты клиники и клиента.
 * - Даёт регистратуре возможность добавить оплату.
 * - Перед сохранением всегда спрашивает подтверждение.
 */
export function RegistrarPaymentsBlock({
  appointmentId,
}: RegistrarPaymentsBlockProps) {
  const [clinicPayments, setClinicPayments] = useState<PaymentRecord[]>([]);
  const [clientPayments, setClientPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
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
        .select(
          "id, amount, currency, status, note, source, created_at"
        )
        .eq("appointment_id", appointmentId)
        .order("created_at", { ascending: true });

      if (payErr) {
        console.error(payErr);
        setError("Не удалось загрузить данные об оплатах");
      } else {
        const all = (data ?? []) as PaymentRecord[];
        setClinicPayments(
          all.filter((p) => (p.source ?? "clinic") === "clinic")
        );
        setClientPayments(
          all.filter((p) => (p.source ?? "clinic") === "client")
        );
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

  async function handleAdd() {
    if (!supabase) return;

    if (!canSave) {
      setError("Укажите сумму оплаты.");
      return;
    }

    const parsedAmount = Number(amount.replace(",", "."));
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Введите корректную сумму (больше нуля).");
      return;
    }

    // ⚠ Предупреждение перед сохранением
    const confirmText = [
      "Вы уверены, что хотите добавить оплату?",
      "",
      `Сумма: ${parsedAmount} ₽`,
      `Статус: ${
        status === "paid"
          ? "Оплачено"
          : status === "partial"
          ? "Частично оплачено"
          : status === "pending"
          ? "Ожидает оплаты"
          : "Отменена"
      }`,
      note.trim() ? `Комментарий: ${note.trim()}` : "",
      "",
      "Эта оплата будет добавлена в карточку консультации.",
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
        amount: parsedAmount,
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
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-1 text-sm">
        <div className="font-medium">
          {typeof p.amount === "number"
            ? `${p.amount} ₽`
            : "Сумма не указана"}
        </div>
        <div className="text-[11px] text-gray-600">
          Статус: {p.status || "—"}
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
    <div className="space-y-4">
      {/* Бейджи слева/справа */}
      <div className="flex flex-wrap gap-2 text-[10px] text-gray-500">
        <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5">
          Слева — оплаты, внесённые клиникой
        </span>
        <span className="inline-flex items-center rounded-full bg-gray-50 px-2 py-0.5">
          Справа — информация об оплатах клиента
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Левая колонка — клиника */}
        <div className="space-y-3">
          <div className="text-xs font-semibold uppercase text-gray-500">
            Оплаты, зарегистрированные клиникой
          </div>

          {loading && (
            <div className="rounded-xl bg-gray-50 px-3 py-2 text-xs text-gray-500">
              Загружаем оплаты…
            </div>
          )}

          {!loading && clinicPayments.length === 0 && (
            <div className="rounded-xl bg-gray-50 px-3 py-2 text-xs text-gray-500">
              Пока нет оплат, зарегистрированных по этой консультации.
            </div>
          )}

          {!loading && clinicPayments.length > 0 && (
            <div className="space-y-2">
              {clinicPayments.map((p) => (
                <PaymentItem key={p.id} p={p} />
              ))}
            </div>
          )}

          {/* Форма добавления оплаты */}
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-3 space-y-2">
            <div className="text-xs font-semibold text-gray-600">
              Добавить оплату
            </div>
            <div className="text-[11px] text-gray-500">
              Сумма указывается в рублях. В будущем сюда можно будет привязать
              кассу / онлайн-оплату.
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
              <div className="text-[11px] text-red-600">
                {error}
              </div>
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

        {/* Правая колонка — клиент */}
        <div className="space-y-3">
          <div className="text-xs font-semibold uppercase text-gray-500">
            Оплаты со стороны клиента
          </div>

          {loading && (
            <div className="rounded-xl bg-gray-50 px-3 py-2 text-xs text-gray-500">
              Загружаем данные…
            </div>
          )}

          {!loading && clientPayments.length === 0 && (
            <div className="rounded-xl bg-gray-50 px-3 py-2 text-xs text-gray-500">
              Пока нет оплат, зарегистрированных со стороны клиента.
            </div>
          )}

          {!loading && clientPayments.length > 0 && (
            <div className="space-y-2">
              {clientPayments.map((p) => (
                <PaymentItem key={p.id} p={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
