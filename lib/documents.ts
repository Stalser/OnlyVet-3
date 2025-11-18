import { supabase } from "@/lib/supabaseClient";

// --------------------------
// Типы документов
// --------------------------

export type OwnerDocument = {
  id: number;
  owner_id: number;
  type: string;
  title: string;
  file_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type PetDocument = {
  id: number;
  pet_id: number;
  type: string;
  title: string;
  file_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

// --------------------------
// Загрузка документов клиента
// --------------------------

export async function getOwnerDocuments(
  ownerId: number,
): Promise<OwnerDocument[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("owner_documents")
    .select(
      "id, owner_id, type, title, file_url, notes, created_at, updated_at, deleted_at",
    )
    .eq("owner_id", ownerId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error || !data) {
    console.error("getOwnerDocuments error", error);
    return [];
  }

  return data.map((row: any) => ({
    id: row.id,
    owner_id: row.owner_id,
    type: row.type,
    title: row.title,
    file_url: row.file_url ?? null,
    notes: row.notes ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));
}

// --------------------------
// Загрузка документов питомца
// --------------------------

export async function getPetDocuments(
  petId: number,
): Promise<PetDocument[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("pet_documents")
    .select(
      "id, pet_id, type, title, file_url, notes, created_at, updated_at, deleted_at",
    )
    .eq("pet_id", petId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error || !data) {
    console.error("getPetDocuments error", error);
    return [];
  }

  return data.map((row: any) => ({
    id: row.id,
    pet_id: row.pet_id,
    type: row.type,
    title: row.title,
    file_url: row.file_url ?? null,
    notes: row.notes ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));
}
