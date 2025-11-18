"use client";

import { useEffect, useState, FormEvent } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { RegistrarHeader } from "@/components/registrar/RegistrarHeader";
import { supabase } from "@/lib/supabaseClient";

type Owner = {
  user_id: number;
  full_name: string | null;
  city: string | null;
  extra_contacts: any;
  created_at: string | null;
  deleted_at?: string | null;
};

type Pet = {
  id: string;
  name: string | null;
  species: string | null;
  breed?: string | null;
  sex?: string | null;
  birth_date?: string | null;
  weight_kg?: number | null;
  microchip_number?: string | null;
};

type Appointment = {
  id: string;
  starts_at: string | null;
  status: string | null;
  pet_name: string | null;
  species: string | null;
  service_code: string | null;
};

type OwnerPrivateData = {
  passport_series?: string | null;
  passport_number?: string | null;
  passport_issued_by?: string | null;
  passport_issued_at?: string | null;
  registration_address?: string | null;
  actual_address?: string | null;
  legal_notes?: string | null;
};

type AuditRow = {
  id: number;
  entity_type: string;
  entity_id: string;
  action: string;
  payload_before: any;
  payload_after: any;
  created_at: string;
};

const SPECIES_OPTIONS = ["Собака", "Кошка", "Грызун", "Птица", "Рептилия", "Другое"] as const;
const SEX_OPTIONS = ["Самец", "Самка"] as const;

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const idParam = params?.id as string;

  const [owner, setOwner] = useState<Owner | null>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [privateData, setPrivateData] = useState<OwnerPrivateData | null>(null);
  const [auditRows, setAuditRows] = useState<AuditRow[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Редактирование клиента
  const [isEditingOwner, setIsEditingOwner] = useState(false);
  const [ownerFullName, setOwnerFullName] = useState("");
  const [ownerCity, setOwnerCity] = useState("");
  const [savingOwner, setSavingOwner] = useState(false);

  // Новый питомец
  const [newPetName, setNewPetName] = useState("");
  const [newPetSpecies, setNewPetSpecies] = useState<(typeof SPECIES_OPTIONS)[number]>("Кошка");
  const [newPetSpeciesOther, setNewPetSpeciesOther] = useState("");
  const [newPetBreed, setNewPetBreed] = useState("");
  const [newPetSex, setNewPetSex] = useState<(typeof SEX_OPTIONS)[number]>("Самец");
  const [newPetBirthDate, setNewPetBirthDate] = useState("");
  const [newPetWeight, setNewPetWeight] = useState("");
  const [newPetChip, setNewPetChip] = useState("");
  const [addingPet, setAddingPet] = useState(false);

  // Редактирование существующего питомца
  const [editingPetId, setEditingPetId] = useState<string | null>(null);

  // Персональные данные
  const [isEditingPrivate, setIsEditingPrivate] = useState(false);
  const [savingPrivate, setSavingPrivate] = useState(false);

  const [actionError, setActionError] = useState<string | null>(null);

  // === ЗАГРУЗКА ВСЕХ ДАННЫХ ===
  useEffect(() => {
    let ignore = false;
    async function load() {
      setLoading(true);
      setLoadError(null);
      setActionError(null);

      const ownerKey = parseInt(idParam, 10);
      if (Number.isNaN(ownerKey)) {
        setLoadError("Некорректный ID клиента");
        setLoading(false);
        return;
      }

      const client = supabase;

      // Клиент
      const { data: ownerData } = await client
        .from("owner_profiles")
        .select("*")
        .eq("user_id", ownerKey)
        .is("deleted_at", null)
        .maybeSingle();

      setOwner(ownerData ?? null);
      if (ownerData) {
        setOwnerFullName(ownerData.full_name ?? "");
        setOwnerCity(ownerData.city ?? "");
      }

      // Питомцы
      const { data: petsData } = await client
        .from("pets")
        .select("*")
        .eq("owner_id", ownerKey)
        .is("deleted_at", null)
        .order("name", { ascending: true });

      setPets(petsData ?? []);

      const petIds = (petsData || []).map((p: any) => p.id?.toString());

      // Персональные данные
      const { data: privData } = await client
        .from("owner_private_data")
        .select("*")
        .eq("owner_id", ownerKey)
        .maybeSingle();

      setPrivateData(privData ?? null);

      // История owner + pet
      const { data: auditRaw } = await client
        .from("audit_log")
        .select("*")
        .in("entity_type", ["owner", "pet"])
        .order("created_at", { ascending: false });

      const history = (auditRaw || []).filter((row: AuditRow) => {
        if (row.entity_type === "owner") return row.entity_id === ownerKey.toString();
        if (row.entity_type === "pet") {
          const before = row.payload_before || {};
          const after = row.payload_after || {};
          return (
            petIds.includes(row.entity_id) ||
            before.owner_id === ownerKey ||
            after.owner_id === ownerKey
          );
        }
        return false;
      });

      setAuditRows(history.slice(0, 10));
      setLoading(false);
    }

    load();
    return () => {
      ignore = true;
    };
  }, [idParam]);
    // === СОХРАНЕНИЕ КЛИЕНТА (ФИО / ГОРОД) ===
  const handleOwnerSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!owner) return;

    const client = supabase;
    if (!client) {
      setActionError("Supabase недоступен на клиенте.");
      return;
    }

    if (!ownerFullName.trim()) {
      setActionError("ФИО клиента не может быть пустым.");
      return;
    }

    setActionError(null);
    setLoading(true);

    const { error } = await client
      .from("owner_profiles")
      .update({
        full_name: ownerFullName.trim(),
        city: ownerCity.trim() || null,
      })
      .eq("user_id", owner.user_id);

    if (error) {
      console.error("handleOwnerSave error", error);
      setActionError("Не удалось сохранить профиль клиента.");
      setLoading(false);
      return;
    }

    setOwner({
      ...owner,
      full_name: ownerFullName.trim(),
      city: ownerCity.trim() || null,
    });

    setLoading(false);
    setIsEditingOwner(false);
  };

  // === УДАЛЕНИЕ КЛИЕНТА (soft-delete) ===
  const handleDeleteOwner = async () => {
    if (
      !owner ||
      !confirm(
        "Удалить этого клиента из картотеки? Его профиль будет скрыт, но данные можно будет восстановить позже."
      )
    ) {
      return;
    }

    const client = supabase;
    if (!client) {
      setActionError("Supabase недоступен на клиенте.");
      return;
    }

    setActionError(null);
    setLoading(true);

    const { error } = await client
      .from("owner_profiles")
      .update({ deleted_at: new Date().toISOString() })
      .eq("user_id", owner.user_id);

    if (error) {
      console.error("handleDeleteOwner error", error);
      setActionError("Не удалось пометить клиента как удалённого.");
      setLoading(false);
      return;
    }

    router.push("/backoffice/registrar/clients");
  };

  // === УДАЛЕНИЕ ПИТОМЦА ===
  const handleDeletePet = async (petId: number) => {
    if (!confirm("Удалить этого питомца из картотеки?")) return;

    const client = supabase;
    if (!client) {
      setActionError("Supabase недоступен на клиенте.");
      return;
    }

    setActionError(null);

    const { error } = await client.from("pets").delete().eq("id", petId);

    if (error) {
      console.error("handleDeletePet error", error);
      setActionError(
        "Не удалось удалить питомца: " + (error.message || "")
      );
      return;
    }

    setPets((prev) => prev.filter((p) => p.id !== petId));
  };

  // === ДОБАВЛЕНИЕ НОВОГО ПИТОМЦА ===
  const handleAddPet = async (e: FormEvent) => {
    e.preventDefault();
    if (!owner) return;

    const client = supabase;
    if (!client) {
      setActionError("Supabase недоступен на клиенте.");
      return;
    }

    if (!newPetName.trim()) {
      setActionError("Укажите имя питомца.");
      return;
    }

    setAddingPet(true);
    setActionError(null);

    const baseSpecies =
      newPetSpecies === "Другое"
        ? newPetSpeciesOther.trim() || "Другое"
        : newPetSpecies;
    const species = baseSpecies;
    const breed = newPetBreed.trim() || null;
    const sex = newPetSex || null;
    const birth_date = newPetBirthDate || null;
    const weight_kg = newPetWeight ? Number(newPetWeight) : null;
    const microchip_number = newPetChip.trim() || null;

    const { data, error } = await client
      .from("pets")
      .insert({
        owner_id: owner.user_id,
        name: newPetName.trim(),
        species,
        breed,
        sex,
        birth_date,
        weight_kg,
        microchip_number,
      })
      .select("*")
      .single();

    if (error || !data) {
      console.error("handleAddPet error", error);
      setActionError(
        "Не удалось добавить питомца: " +
          (error?.message || "ошибка базы данных")
      );
      setAddingPet(false);
      return;
    }

    setPets((prev) => [...prev, data as Pet]);
    setNewPetName("");
    setNewPetSpecies("Кошка");
    setNewPetSpeciesOther("");
    setNewPetBreed("");
    setNewPetSex("Самец");
    setNewPetBirthDate("");
    setNewPetWeight("");
    setNewPetChip("");
    setAddingPet(false);
  };

  // === НАЧАТЬ РЕДАКТИРОВАНИЕ ПИТОМЦА ===
  const startEditPet = (pet: Pet) => {
    setEditingPetId(String(pet.id));
    setActionError(null);
  };

  const cancelEditPet = () => {
    setEditingPetId(null);
    setActionError(null);
  };

  // === СОХРАНЕНИЕ ПИТОМЦА (inline в таблице) ===
  const handlePetFieldChange = (
    petId: number,
    field: keyof Pet,
    value: any
  ) => {
    setPets((prev) =>
      prev.map((p) =>
        p.id === petId
          ? {
              ...p,
              [field]:
                field === "weight_kg"
                  ? value
                    ? Number(value)
                    : null
                  : value,
            }
          : p
      )
    );
  };

  const handlePetSave = async (pet: Pet) => {
    const client = supabase;
    if (!client) {
      setActionError("Supabase недоступен на клиенте.");
      return;
    }

    if (!pet.name || !pet.name.trim()) {
      setActionError("Имя питомца не может быть пустым.");
      return;
    }

    setActionError(null);
    setLoading(true);

    const species = pet.species?.trim() || null;
    const breed = pet.breed?.trim() || null;
    const sex = pet.sex?.trim() || null;
    const birth_date = pet.birth_date || null;
    const weight_kg =
      pet.weight_kg !== null && pet.weight_kg !== undefined
        ? Number(pet.weight_kg)
        : null;
    const microchip_number = pet.microchip_number?.trim() || null;

    const { error } = await client
      .from("pets")
      .update({
        name: pet.name.trim(),
        species,
        breed,
        sex,
        birth_date,
        weight_kg,
        microchip_number,
      })
      .eq("id", pet.id);

    if (error) {
      console.error("handlePetSave error", error);
      setActionError(
        "Не удалось сохранить изменения питомца: " +
          (error.message || "")
      );
      setLoading(false);
      return;
    }

    setEditingPetId(null);
    setLoading(false);
  };

  // === СОХРАНЕНИЕ ПЕРСОНАЛЬНЫХ ДАННЫХ ===
  const handlePrivateSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!owner) return;

    const client = supabase;
    if (!client) {
      setActionError("Supabase недоступен на клиенте.");
      return;
    }

    setSavingPrivate(true);
    setActionError(null);

    const payload = {
      passport_series: privateData?.passport_series || null,
      passport_number: privateData?.passport_number || null,
      passport_issued_by: privateData?.passport_issued_by || null,
      passport_issued_at: privateData?.passport_issued_at || null,
      registration_address: privateData?.registration_address || null,
      actual_address: privateData?.actual_address || null,
      legal_notes: privateData?.legal_notes || null,
    };

    let error = null;

    if (privateData) {
      const { error: updError } = await client
        .from("owner_private_data")
        .update(payload)
        .eq("owner_id", owner.user_id);
      error = updError;
    } else {
      const { error: insError } = await client
        .from("owner_private_data")
        .insert({
          owner_id: owner.user_id,
          ...payload,
        });
      error = insError;
    }

    if (error) {
      console.error("handlePrivateSave error", error);
      setActionError(
        "Не удалось сохранить персональные данные клиента."
      );
      setSavingPrivate(false);
      return;
    }

    setSavingPrivate(false);
    setIsEditingPrivate(false);
  };

  // === ВСПОМОГАТЕЛЬНЫЕ РЕНДЕРЫ ===

  const renderContacts = (extra: any) => {
    if (!extra) {
      return (
        <div className="text-xs text-gray-500">
          Контакты не указаны.
        </div>
      );
    }

    let parsed: any = null;
    if (typeof extra === "object" && !Array.isArray(extra)) {
      parsed = extra;
    } else if (typeof extra === "string") {
      try {
        parsed = JSON.parse(extra);
      } catch {
        parsed = null;
      }
    }

    if (!parsed || typeof parsed !== "object") {
      return (
        <pre className="rounded bg-gray-50 px-2 py-1 text-[10px] text-gray-700 whitespace-pre-wrap break-words">
          {typeof extra === "string"
            ? extra
            : JSON.stringify(extra, null, 2)}
        </pre>
      );
    }

    const email = parsed.email ?? parsed.mail ?? null;
    const phone =
      parsed.phone ??
      parsed.phone_main ??
      parsed.whatsapp ??
      parsed.telegram_phone ??
      null;
    const telegram =
      parsed.telegram ?? parsed.tg ?? parsed.telegramNick ?? null;

    const hasKnown =
      (email && String(email).trim()) ||
      (phone && String(phone).trim()) ||
      (telegram && String(telegram).trim());

    if (!hasKnown) {
      return (
        <pre className="rounded bg-gray-50 px-2 py-1 text-[10px] text-gray-700 whitespace-pre-wrap break-words">
          {JSON.stringify(parsed, null, 2)}
        </pre>
      );
    }

    return (
      <div className="space-y-1 text-xs text-gray-800">
        {email && (
          <div>
            <span className="font-semibold">E-mail: </span>
            <span>{String(email)}</span>
          </div>
        )}
        {phone && (
          <div>
            <span className="font-semibold">Телефон: </span>
            <span>{String(phone)}</span>
          </div>
        )}
        {telegram && (
          <div>
            <span className="font-semibold">Telegram: </span>
            <span>{String(telegram)}</span>
          </div>
        )}
      </div>
    );
  };

  const formatApptDate = (starts_at: string | null) => {
    if (!starts_at) return "—";
    const d = new Date(starts_at);
    return d.toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const privateStatus =
    privateData &&
    (privateData.passport_series ||
      privateData.passport_number ||
      privateData.registration_address ||
      privateData.actual_address)
      ? "заполнены"
      : "не заполнены";

  const renderAuditAction = (row: AuditRow) => {
    const a = row.action.toLowerCase();
    if (row.entity_type === "owner") {
      if (a === "create") return "Создание профиля";
      if (a === "update") return "Изменение профиля";
      if (a === "delete") return "Удаление профиля";
      return row.action;
    }
    if (row.entity_type === "pet") {
      if (a === "create") return "Создание питомца";
      if (a === "update") return "Изменение питомца";
      if (a === "delete") return "Удаление питомца";
    }
    return row.action;
  };

  const renderAuditSummary = (row: AuditRow) => {
    const before = row.payload_before || {};
    const after = row.payload_after || {};

    if (row.entity_type === "owner") {
      const changes: string[] = [];
      if (before.full_name !== after.full_name) {
        changes.push(
          `ФИО: "${before.full_name || "—"}" → "${
            after.full_name || "—"
          }"`
        );
      }
      if (before.city !== after.city) {
        changes.push(
          `Город: "${before.city || "—"}" → "${after.city || "—"}"`
        );
      }
      if (changes.length === 0) {
        if (row.action === "create") return "Создан профиль клиента";
        if (row.action === "delete") return "Клиент помечен как удалённый";
        return "Изменение записи клиента";
      }
      return changes.join("; ");
    }

    if (row.entity_type === "pet") {
      const beforeName = before.name || "";
      const afterName = after.name || "";
      if (row.action === "create") {
        return `Создан питомец "${afterName || "без имени"}"`;
      }
      if (row.action === "delete") {
        return `Удалён питомец "${beforeName || "без имени"}"`;
      }
      return `Изменены данные питомца "${afterName || beforeName || "без имени"}"`;
    }

    return "Изменение данных";
  };

  const renderPetRow = (pet: Pet) => {
    const isEditing = editingPetId === String(pet.id);

    if (!isEditing) {
      return (
        <tr key={pet.id} className="border-b last:border-0 hover:bg-gray-50">
          <td className="px-2 py-2 text-[11px] text-gray-800">
            {pet.name || "Без имени"}
          </td>
          <td className="px-2 py-2 text-[11px] text-gray-700">
            {pet.species || "Не указан"}
            {pet.breed && (
              <span className="text-[10px] text-gray-500">
                {" "}
                ({pet.breed})
              </span>
            )}
          </td>
          <td className="px-2 py-2 text-[11px] text-gray-700">
            {pet.sex || "—"}
          </td>
          <td className="px-2 py-2 text-[11px] text-gray-700">
            {pet.birth_date
              ? new Date(pet.birth_date).toLocaleDateString("ru-RU")
              : "—"}
          </td>
          <td className="px-2 py-2 text-[11px] text-gray-700">
            {pet.weight_kg != null ? `${pet.weight_kg.toFixed(1)} кг` : "—"}
          </td>
          <td className="px-2 py-2 text-[11px] text-gray-700">
            {pet.microchip_number && (
              <div>
                <span className="font-semibold">Чип: </span>
                {pet.microchip_number}
              </div>
            )}
          </td>
          <td className="px-2 py-2 text-right text-[11px] space-y-1">
            <button
              type="button"
              onClick={() => startEditPet(pet)}
              className="block w-full text-left text-emerald-700 hover:underline"
            >
              Редактировать
            </button>
            <button
              type="button"
              onClick={() => handleDeletePet(pet.id)}
              className="block w-full text-left text-red-600 hover:underline"
            >
              Удалить
            </button>
          </td>
        </tr>
      );
    }

    // Режим редактирования
    return (
      <tr key={pet.id} className="border-b last:border-0 bg-gray-50">
        <td className="px-2 py-2 text-[11px]">
          <input
            type="text"
            value={pet.name ?? ""}
            onChange={(e) =>
              handlePetFieldChange(pet.id, "name", e.target.value)
            }
            className="w-full rounded border px-2 py-1 text-[11px]"
          />
        </td>
        <td className="px-2 py-2 text-[11px]">
          <input
            type="text"
            value={pet.species ?? ""}
            onChange={(e) =>
              handlePetFieldChange(pet.id, "species", e.target.value)
            }
            className="mb-1 w-full rounded border px-2 py-1 text-[11px]"
            placeholder="Вид"
          />
          <input
            type="text"
            value={pet.breed ?? ""}
            onChange={(e) =>
              handlePetFieldChange(pet.id, "breed", e.target.value)
            }
            className="w-full rounded border px-2 py-1 text-[11px]"
            placeholder="Порода / описание"
          />
        </td>
        <td className="px-2 py-2 text-[11px]">
          <select
            value={pet.sex ?? ""}
            onChange={(e) =>
              handlePetFieldChange(pet.id, "sex", e.target.value)
            }
            className="w-full rounded border px-2 py-1 text-[11px]"
          >
            <option value="">Не указан</option>
            {SEX_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </td>
        <td className="px-2 py-2 text-[11px]">
          <input
            type="date"
            value={pet.birth_date ?? ""}
            onChange={(e) =>
              handlePetFieldChange(pet.id, "birth_date", e.target.value)
            }
            className="w-full rounded border px-2 py-1 text-[11px]"
          />
        </td>
        <td className="px-2 py-2 text-[11px]">
          <input
            type="number"
            step="0.1"
            min="0"
            value={pet.weight_kg ?? ""}
            onChange={(e) =>
              handlePetFieldChange(pet.id, "weight_kg", e.target.value)
            }
            className="w-full rounded border px-2 py-1 text-[11px]"
            placeholder="Вес, кг"
          />
        </td>
        <td className="px-2 py-2 text-[11px]">
          <input
            type="text"
            value={pet.microchip_number ?? ""}
            onChange={(e) =>
              handlePetFieldChange(
                pet.id,
                "microchip_number",
                e.target.value
              )
            }
            className="w-full rounded border px-2 py-1 text-[11px]"
            placeholder="Номер чипа"
          />
        </td>
        <td className="px-2 py-2 text-right text-[11px] space-y-1">
          <button
            type="button"
            onClick={cancelEditPet}
            className="block w-full rounded border px-2 py-1 text-[10px]"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={() => handlePetSave(pet)}
            className="block w-full rounded bg-emerald-600 px-2 py-1 text-[10px] font-medium text-white"
          >
            Сохранить
          </button>
        </td>
      </tr>
    );
  };
    return (
    <RoleGuard allowed={["registrar", "admin"]}>
      <main className="mx-auto max-w-6xl px-4 py-6 space-y-6">
        {/* Шапка */}
        <header className="flex items-center justify-between">
          <div>
            <Link
              href="/backoffice/registrar/clients"
              className="text-xs text-gray-500 hover:text-gray-700 hover:underline"
            >
              ← К картотеке клиентов
            </Link>
            <h1 className="mt-2 text-2xl font-bold tracking-tight">
              Клиент
            </h1>
            <p className="text-sm text-gray-500">
              Карточка клиента, его питомцы, персональные данные и история изменений.
            </p>
          </div>
          <RegistrarHeader />
        </header>

        {/* Ошибки / загрузка */}
        {loadError && (
          <section className="rounded-2xl border bg-white p-4">
            <p className="text-sm text-red-700">{loadError}</p>
          </section>
        )}

        {actionError && !loadError && (
          <section className="rounded-2xl border bg-white p-3">
            <p className="text-xs text-red-700">{actionError}</p>
          </section>
        )}

        {loading && !loadError && (
          <section className="rounded-2xl border bg-white p-4">
            <p className="text-xs text-gray-500">Загрузка данных…</p>
          </section>
        )}

        {!loading && !loadError && !owner && (
          <section className="rounded-2xl border bg-white p-4">
            <p className="text-sm text-gray-500">
              Клиент с идентификатором{" "}
              <span className="font-mono">{idParam}</span> не найден.
            </p>
          </section>
        )}

        {!loading && !loadError && owner && (
          <>
            {/* Основная информация */}
            <section className="rounded-2xl border bg-white p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-base font-semibold">Основная информация</h2>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingOwner((v) => !v);
                      setActionError(null);
                    }}
                    className="rounded-xl border border-gray-300 px-3 py-1.5 text-[11px] text-gray-700 hover:bg-gray-50"
                  >
                    {isEditingOwner ? "Отмена" : "Редактировать"}
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteOwner}
                    className="rounded-xl border border-red-500 px-3 py-1.5 text-[11px] text-red-600 hover:bg-red-50"
                  >
                    Удалить клиента
                  </button>
                </div>
              </div>

              {!isEditingOwner ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <div>
                      <div className="text-[11px] text-gray-500 mb-1">ФИО</div>
                      <div className="rounded-xl border bg-gray-50 px-3 py-2 text-sm text-gray-800">
                        {owner.full_name || "Без имени"}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-gray-500 mb-1">Город</div>
                      <div className="rounded-xl border bg-gray-50 px-3 py-2 text-sm text-gray-800">
                        {owner.city || "Не указан"}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-gray-500 mb-1">
                        ID клиента
                      </div>
                      <div className="rounded-xl border bg-gray-50 px-3 py-2 text-xs font-mono text-gray-800">
                        {owner.user_id}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-gray-500 mb-1">
                        Дата создания
                      </div>
                      <div className="rounded-xl border bg-gray-50 px-3 py-2 text-xs text-gray-800">
                        {owner.created_at
                          ? new Date(owner.created_at).toLocaleString("ru-RU")
                          : "—"}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-[11px] text-gray-500 mb-1">
                      Контакты
                    </div>
                    <div className="rounded-xl border bg-gray-50 px-3 py-2">
                      {renderContacts(owner.extra_contacts)}
                    </div>
                  </div>
                </div>
              ) : (
                <form
                  onSubmit={handleOwnerSave}
                  className="grid gap-4 md:grid-cols-2"
                >
                  <div className="space-y-2">
                    <div>
                      <label className="text-[11px] text-gray-500 mb-1 block">
                        ФИО
                      </label>
                      <input
                        type="text"
                        value={ownerFullName}
                        onChange={(e) => setOwnerFullName(e.target.value)}
                        className="w-full rounded-xl border px-3 py-1.5 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-gray-500 mb-1 block">
                        Город
                      </label>
                      <input
                        type="text"
                        value={ownerCity}
                        onChange={(e) => setOwnerCity(e.target.value)}
                        className="w-full rounded-xl border px-3 py-1.5 text-xs"
                      />
                    </div>
                    <div>
                      <div className="text-[11px] text-gray-500 mb-1">
                        ID клиента
                      </div>
                      <div className="rounded-xl border bg-gray-50 px-3 py-2 text-xs font-mono text-gray-800">
                        {owner.user_id}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-[11px] text-gray-500 mb-1">Контакты</div>
                    {/* Здесь можно вывести редактируемые контакты позже */}
                    <div className="rounded-xl border bg-gray-50 px-3 py-2">
                      {renderContacts(owner.extra_contacts)}
                    </div>
                  </div>

                  <div className="md:col-span-2 flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingOwner(false);
                        setOwnerFullName(owner.full_name ?? "");
                        setOwnerCity(owner.city ?? "");
                        setActionError(null);
                      }}
                      className="rounded-xl border px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
                    >
                      Отмена
                    </button>
                    <button
                      type="submit"
                      disabled={savingOwner}
                      className="rounded-xl bg-emerald-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                    >
                      {savingOwner ? "Сохраняю…" : "Сохранить"}
                    </button>
                  </div>
                </form>
              )}
            </section>

            {/* Персональные данные */}
            <section className="rounded-2xl border bg-white p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold">
                    Персональные данные (паспорт и адреса)
                  </h2>
                  <p className="text-[11px] text-gray-500">
                    Этот блок заполняет регистратор. Клиент не видит эти данные.
                  </p>
                </div>
                <div className="flex flex-col items-end text-[11px] text-gray-500">
                  <span>Статус: {privateStatus}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingPrivate((v) => !v);
                      setActionError(null);
                    }}
                    className="mt-1 rounded-xl border border-gray-300 px-3 py-1.5 text-[11px] text-gray-700 hover:bg-gray-50"
                  >
                    {isEditingPrivate ? "Отмена" : "Редактировать"}
                  </button>
                </div>
              </div>

              {!isEditingPrivate ? (
                <div className="space-y-2 text-xs text-gray-700">
                  <div>
                    <span className="font-semibold">Паспорт: </span>
                    {privateData?.passport_series ||
                    privateData?.passport_number
                      ? `${privateData.passport_series || ""} ${
                          privateData.passport_number || ""
                        }`.trim()
                      : "не указан"}
                  </div>
                  <div>
                    <span className="font-semibold">Кем выдан: </span>
                    {privateData?.passport_issued_by || "не указано"}
                  </div>
                  <div>
                    <span className="font-semibold">Дата выдачи: </span>
                    {privateData?.passport_issued_at
                      ? new Date(
                          privateData.passport_issued_at
                        ).toLocaleDateString("ru-RU")
                      : "не указана"}
                  </div>
                  <div>
                    <span className="font-semibold">
                      Адрес регистрации:{" "}
                    </span>
                    {privateData?.registration_address || "не указан"}
                  </div>
                  <div>
                    <span className="font-semibold">
                      Фактический адрес:{" "}
                    </span>
                    {privateData?.actual_address || "не указан"}
                  </div>
                  <div>
                    <span className="font-semibold">
                      Служебные пометки:{" "}
                    </span>
                    {privateData?.legal_notes || "нет"}
                  </div>
                </div>
              ) : (
                <form onSubmit={handlePrivateSave} className="space-y-2 text-xs">
                  <div className="grid gap-2 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-[11px] text-gray-500">
                        Серия паспорта
                      </label>
                      <input
                        type="text"
                        value={privateData?.passport_series || ""}
                        onChange={(e) =>
                          setPrivateData((prev) => ({
                            ...(prev || {}),
                            passport_series: e.target.value,
                          }))
                        }
                        className="w-full rounded-xl border px-3 py-1.5 text-xs"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] text-gray-500">
                        Номер паспорта
                      </label>
                      <input
                        type="text"
                        value={privateData?.passport_number || ""}
                        onChange={(e) =>
                          setPrivateData((prev) => ({
                            ...(prev || {}),
                            passport_number: e.target.value,
                          }))
                        }
                        className="w-full rounded-xl border px-3 py-1.5 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] text-gray-500">
                      Кем выдан
                    </label>
                    <input
                      type="text"
                      value={privateData?.passport_issued_by || ""}
                      onChange={(e) =>
                        setPrivateData((prev) => ({
                          ...(prev || {}),
                          passport_issued_by: e.target.value,
                        }))
                      }
                      className="w-full rounded-xl border px-3 py-1.5 text-xs"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] text-gray-500">
                      Дата выдачи
                    </label>
                    <input
                      type="date"
                      value={
                        privateData?.passport_issued_at
                          ? privateData.passport_issued_at.substring(0, 10)
                          : ""
                      }
                      onChange={(e) =>
                        setPrivateData((prev) => ({
                          ...(prev || {}),
                          passport_issued_at: e.target.value || null,
                        }))
                      }
                      className="w-full rounded-xl border px-3 py-1.5 text-xs"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] text-gray-500">
                      Адрес регистрации
                    </label>
                    <textarea
                      value={privateData?.registration_address || ""}
                      onChange={(e) =>
                        setPrivateData((prev) => ({
                          ...(prev || {}),
                          registration_address: e.target.value,
                        }))
                      }
                      className="w-full rounded-xl border px-3 py-1.5 text-xs"
                      rows={2}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] text-gray-500">
                      Фактический адрес
                    </label>
                    <textarea
                      value={privateData?.actual_address || ""}
                      onChange={(e) =>
                        setPrivateData((prev) => ({
                          ...(prev || {}),
                          actual_address: e.target.value,
                        }))
                      }
                      className="w-full rounded-xl border px-3 py-1.5 text-xs"
                      rows={2}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] text-gray-500">
                      Служебные пометки
                    </label>
                    <textarea
                      value={privateData?.legal_notes || ""}
                      onChange={(e) =>
                        setPrivateData((prev) => ({
                          ...(prev || {}),
                          legal_notes: e.target.value,
                        }))
                      }
                      className="w-full rounded-xl border px-3 py-1.5 text-xs"
                      rows={3}
                    />
                  </div>

                  <div className="pt-1 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingPrivate(false);
                        setActionError(null);
                      }}
                      className="rounded-xl border px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
                    >
                      Отмена
                    </button>
                    <button
                      type="submit"
                      disabled={savingPrivate}
                      className="rounded-xl bg-emerald-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                    >
                      {savingPrivate ? "Сохраняю…" : "Сохранить"}
                    </button>
                  </div>
                </form>
              )}
            </section>

            {/* Питомцы */}
            <section className="rounded-2xl border bg-white p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold">Питомцы</h2>
              </div>

              {pets.length === 0 && (
                <p className="text-xs text-gray-400">
                  У этого клиента пока нет ни одного питомца.
                </p>
              )}

              {pets.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs">
                    <thead>
                      <tr className="border-b bg-gray-50 text-left text-[11px] uppercase text-gray-500">
                        <th className="px-2 py-2">Имя</th>
                        <th className="px-2 py-2">Вид / порода</th>
                        <th className="px-2 py-2">Пол</th>
                        <th className="px-2 py-2">Дата рождения</th>
                        <th className="px-2 py-2">Вес</th>
                        <th className="px-2 py-2">Чип</th>
                        <th className="px-2 py-2 text-right">Действия</th>
                      </tr>
                    </thead>
                    <tbody>{pets.map((p) => renderPetRow(p))}</tbody>
                  </table>
                </div>
              )}

              {/* Добавление питомца */}
              <div className="mt-4 rounded-xl border bg-gray-50 p-3 space-y-3">
                <h3 className="text-xs font-semibold text-gray-700">
                  Добавить нового питомца
                </h3>
                <form onSubmit={handleAddPet} className="space-y-2">
                  <div>
                    <label className="mb-1 block text-[11px] text-gray-500">
                      Имя питомца <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newPetName}
                      onChange={(e) => setNewPetName(e.target.value)}
                      className="w-full rounded-xl border px-3 py-1.5 text-xs"
                      placeholder="Например: Мурзик"
                    />
                  </div>

                  <div className="grid gap-2 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-[11px] text-gray-500">
                        Вид
                      </label>
                      <select
                        value={newPetSpecies}
                        onChange={(e) =>
                          setNewPetSpecies(
                            e.target.value as (typeof SPECIES_OPTIONS)[number]
                          )
                        }
                        className="w-full rounded-xl border px-3 py-1.5 text-xs"
                      >
                        {SPECIES_OPTIONS.map((sp) => (
                          <option key={sp} value={sp}>
                            {sp}
                          </option>
                        ))}
                      </select>
                      {newPetSpecies === "Другое" && (
                        <input
                          type="text"
                          value={newPetSpeciesOther}
                          onChange={(e) =>
                            setNewPetSpeciesOther(e.target.value)
                          }
                          className="mt-2 w-full rounded-xl border px-3 py-1.5 text-xs"
                          placeholder="Уточните вид"
                        />
                      )}
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] text-gray-500">
                        Порода / описание
                      </label>
                      <input
                        type="text"
                        value={newPetBreed}
                        onChange={(e) => setNewPetBreed(e.target.value)}
                        className="w-full rounded-xl border px-3 py-1.5 text-xs"
                        placeholder="Например: британская, метис…"
                      />
                    </div>
                  </div>

                  <div className="grid gap-2 md:grid-cols-3">
                    <div>
                      <label className="mb-1 block text-[11px] text-gray-500">
                        Пол
                      </label>
                      <select
                        value={newPetSex}
                        onChange={(e) =>
                          setNewPetSex(
                            e.target.value as (typeof SEX_OPTIONS)[number]
                          )
                        }
                        className="w-full rounded-xl border px-3 py-1.5 text-xs"
                      >
                        {SEX_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] text-gray-500">
                        Дата рождения
                      </label>
                      <input
                        type="date"
                        value={newPetBirthDate}
                        onChange={(e) =>
                          setNewPetBirthDate(e.target.value)
                        }
                        className="w-full rounded-xl border px-3 py-1.5 text-xs"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] text-gray-500">
                        Вес (кг)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={newPetWeight}
                        onChange={(e) => setNewPetWeight(e.target.value)}
                        className="w-full rounded-xl border px-3 py-1.5 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] text-gray-500">
                      Номер чипа
                    </label>
                    <input
                      type="text"
                      value={newPetChip}
                      onChange={(e) => setNewPetChip(e.target.value)}
                      className="w-full rounded-xl border px-3 py-1.5 text-xs"
                    />
                  </div>

                  <div className="pt-1 flex justify-end">
                    <button
                      type="submit"
                      disabled={addingPet}
                      className="rounded-xl bg-emerald-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                    >
                      {addingPet ? "Добавляем…" : "Добавить питомца"}
                    </button>
                  </div>
                </form>
              </div>
            </section>

            {/* История консультаций */}
            <section className="rounded-2xl border bg-white p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold">
                  История консультаций клиента
                </h2>
              </div>

              {appointments.length === 0 && (
                <p className="text-xs text-gray-400">
                  У клиента пока нет ни одной консультации.
                </p>
              )}

              {appointments.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs">
                    <thead>
                      <tr className="border-b bg-gray-50 text-left text-[11px] uppercase text-gray-500">
                        <th className="px-2 py-2">Дата / время</th>
                        <th className="px-2 py-2">Питомец</th>
                        <th className="px-2 py-2">Услуга (код)</th>
                        <th className="px-2 py-2">Статус</th>
                      </tr>
                    </thead>
                    <tbody>
                      {appointments.map((a) => (
                        <tr
                          key={a.id}
                          className="border-b last:border-0 hover:bg-gray-50"
                        >
                          <td className="px-2 py-2 align-top text-[11px] text-gray-700">
                            {formatApptDate(a.starts_at)}
                          </td>
                          <td className="px-2 py-2 align-top text-[11px] text-gray-700">
                            {a.pet_name || "Без имени"}
                            {a.species && (
                              <span className="text-[10px] text-gray-500">
                                {" "}
                                ({a.species})
                              </span>
                            )}
                          </td>
                          <td className="px-2 py-2 align-top text-[11px] text-gray-700">
                            {a.service_code || "—"}
                          </td>
                          <td className="px-2 py-2 align-top text-[11px] text-gray-700">
                            {a.status || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* История изменений профиля и питомцев */}
            <section className="rounded-2xl border bg-white p-4 space-y-3">
              <h2 className="text-base font-semibold">
                История изменений профиля клиента
              </h2>

              {auditRows.length === 0 && (
                <p className="text-xs text-gray-400">
                  Изменения профиля и питомцев ещё не фиксировались.
                </p>
              )}

              {auditRows.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs">
                    <thead>
                      <tr className="border-b bg-gray-50 text-left text-[11px] uppercase text-gray-500">
                        <th className="px-2 py-2">Дата / время</th>
                        <th className="px-2 py-2">Действие</th>
                        <th className="px-2 py-2">Описание</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditRows.map((row) => (
                        <tr
                          key={row.id}
                          className="border-b last:border-0 hover:bg-gray-50"
                        >
                          <td className="px-2 py-2 align-top text-[11px] text-gray-700">
                            {new Date(row.created_at).toLocaleString("ru-RU")}
                          </td>
                          <td className="px-2 py-2 align-top text-[11px] text-gray-700">
                            {renderAuditAction(row)}
                          </td>
                          <td className="px-2 py-2 align-top text-[11px] text-gray-700">
                            {renderAuditSummary(row)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </RoleGuard>
  );
}
