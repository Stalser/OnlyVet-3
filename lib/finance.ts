// lib/finance.ts
import { supabase } from "./supabaseClient";

export type PaymentRow = {
  id: number;
  amount: number;
  status: string;
  created_at: string;
};

export type InvoiceWithPayments = {
  id: number;
  status: string;
  created_at: string;
  total_amount: number;
  currency: string;
  notes: string | null;
  payments: PaymentRow[];
};

/**
 * Загрузка всех счетов клиента с вложенными оплатами.
 */
export async function getOwnerInvoices(
  ownerId: number
): Promise<InvoiceWithPayments[]> {
  const client = supabase;

  if (!client) {
    throw new Error("Supabase client is not initialized");
  }

  const { data, error } = await client
    .from("invoices")
    .select(
      `
      id,
      status,
      created_at,
      total_amount,
      currency,
      notes,
      payments (
        id,
        amount,
        status,
        created_at
      )
    `
    )
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getOwnerInvoices error", error);
    throw error;
  }

  const rows = (data || []) as any[];

  return rows.map((row) => ({
    id: row.id,
    status: row.status,
    created_at: row.created_at,
    total_amount: Number(row.total_amount ?? 0),
    currency: row.currency || "RUB",
    notes: row.notes ?? null,
    payments: (row.payments ?? []).map((p: any) => ({
      id: p.id,
      amount: Number(p.amount ?? 0),
      status: p.status,
      created_at: p.created_at,
    })),
  }));
}

/**
 * Простой сценарий: создаём счёт с одной позицией “ручного” описания и суммой.
 * Дальше можно будет усложнить (привязка к приёму, услугам и т.п.).
 */
export async function createSimpleInvoiceForOwner(params: {
  ownerId: number;
  description: string;
  amount: number;
  notes?: string | null;
}): Promise<InvoiceWithPayments> {
  const client = supabase;

  if (!client) {
    throw new Error("Supabase client is not initialized");
  }

  const amount = Number(params.amount || 0);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Сумма счета должна быть положительным числом.");
  }

  // 1. Создаём сам счёт
  const { data: invData, error: invError } = await client
    .from("invoices")
    .insert({
      owner_id: params.ownerId,
      status: "issued",
      total_amount: amount,
      currency: "RUB",
      notes: params.notes ?? null,
    })
    .select("id, status, created_at, total_amount, currency, notes")
    .single();

  if (invError || !invData) {
    console.error("createSimpleInvoiceForOwner: insert invoice error", invError);
    throw invError || new Error("Не удалось создать счёт.");
  }

  // 2. Добавляем одну позицию в invoice_items
  const { error: itemError } = await client.from("invoice_items").insert({
    invoice_id: invData.id,
    service_id: null,
    appointment_id: null,
    description: params.description,
    quantity: 1,
    price: amount,
    amount: amount,
  });

  if (itemError) {
    console.error(
      "createSimpleInvoiceForOwner: insert invoice_item error",
      itemError
    );
    throw itemError;
  }

  // 3. Возвращаем счёт в формате InvoiceWithPayments (платежей ещё нет)
  return {
    id: invData.id,
    status: invData.status,
    created_at: invData.created_at,
    total_amount: Number(invData.total_amount ?? amount),
    currency: invData.currency || "RUB",
    notes: invData.notes ?? null,
    payments: [],
  };
}
