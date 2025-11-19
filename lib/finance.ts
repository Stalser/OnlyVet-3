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

export async function getOwnerInvoices(
  ownerId: number
): Promise<InvoiceWithPayments[]> {
  const client = supabase;

  if (!client) {
    // для фронта это маловероятно, но TS теперь доволен
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
