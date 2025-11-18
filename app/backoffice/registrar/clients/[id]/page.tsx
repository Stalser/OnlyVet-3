"use client";

import { useEffect, useState, FormEvent } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
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
  id: number;
  owner_id: number;
  name: string | null;
  species: string | null;
  breed: string | null;
  sex: string | null;
  birth_date: string | null;
  weight_kg: number | null;
  microchip_number: string | null;
  notes: string | null;
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

const SPECIES_OPTIONS = ["Собака", "Кошка", "Грызун", "Птица", "Рептилия", "Другое"] as const;
const SEX_OPTIONS = ["Самец", "Самка"] as const;

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const search = useSearchParams();

  const idParam = params?.id as string;

  // Считываем параметры, чтобы правильно вычислить обратную ссылку
  const from = search.get("from");
  const petsFilter = search.get("pets") ?? "all";
  const privFilter = search.get("priv") ?? "all";
  const mode = search.get("mode") ?? "dashboard";

  const backUrl =
    from === "all"
      ? `/backoffice/registrar/clients?pets=${petsFilter}&priv=${privFilter}&mode=all`
      : `/backoffice/registrar/clients?pets=${petsFilter}&priv=${privFilter}&mode=dashboard`;

  const [owner, setOwner] = useState<Owner | null>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [privateData, setPrivateData] = useState<OwnerPrivateData | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // редактирование владельца
  const [isEditingOwner, setIsEditingOwner] = useState(false);
  const [ownerFullName, setOwnerFullName] = useState("");
  const [ownerCity, setOwnerCity] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [ownerTelegram, setOwnerTelegram] = useState("");
  const [savingOwner, setSavingOwner] = useState(false);

  // добавление питомца
  const [showAddPetForm, setShowAddPetForm] = useState(false);
  const [newPetName, setNewPetName] = useState("");
  const [newPetSpecies, setNewPetSpecies] = useState<(typeof SPECIES_OPTIONS)[number]>("Кошка");
  const [newPetSpeciesOther, setNewPetSpeciesOther] = useState("");
  const [newPetBreed, setNewPetBreed] = useState("");
  const [newPetSex, setNewPetSex] = useState<(typeof SEX_OPTIONS)[number]>("Самец");
  const [newPetBirthDate, setNewPetBirthDate] = useState("");
  const [newPetWeight, setNewPetWeight] = useState("");
  const [newPetChip, setNewPetChip] = useState("");
  const [newPetNotes, setNewPetNotes] = useState("");
  const [addingPet, setAddingPet] = useState(false);

  // редактирование питомца
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [savingPetEdit, setSavingPetEdit] = useState(false);

  // персональные данные
  const [isEditingPrivate, setIsEditingPrivate] = useState(false);
  const [savingPrivate, setSavingPrivate] = useState(false);
    // ===== helpers =====

  const parseContacts = (extra: any): {
    email: string;
    phone: string;
    telegram: string;
  } => {
    if (!extra) return { email: "", phone: "", telegram: "" };

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
      return { email: "", phone: "", telegram: "" };
    }

    const email = parsed.email ?? parsed.mail ?? "";
    const phone =
      parsed.phone ??
      parsed.phone_main ??
      parsed.whatsapp ??
      parsed.telegram_phone ??
      "";
    const telegram =
      parsed.telegram ?? parsed.tg ?? parsed.telegramNick ?? "";

    return {
      email: String(email || ""),
      phone: String(phone || ""),
      telegram: String(telegram || ""),
    };
  };

  const renderContacts = (extra: any) => {
    const { email, phone, telegram } = parseContacts(extra);
    if (!email && !phone && !telegram) {
      return (
        <div className="text-xs text-gray-500">
          Контакты не указаны.
        </div>
      );
    }
    return (
      <div className="space-y-1 text-xs text-gray-800">
        {email && (
          <div>
            <span className="font-semibold">E-mail: </span>
            <span>{email}</span>
          </div>
        )}
        {phone && (
          <div>
            <span className="font-semibold">Телефон: </span>
            <span>{phone}</span>
          </div>
        )}
        {telegram && (
          <div>
            <span className="font-semibold">Telegram: </span>
            <span>{telegram}</span>
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

  const formatPetBirthDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("ru-RU") : "—";

  const formatPetWeight = (w: number | null) =>
    w != null ? `${w.toFixed(1)} кг` : "—";

  const privateStatus =
    privateData &&
    (privateData.passport_series ||
      privateData.passport_number ||
      privateData.registration_address ||
      privateData.actual_address)
      ? "заполнены"
      : "не заполнены";

  const privateStatusLabel = privateStatus;

  // ===== ЗАГРУЗКА КЛИЕНТА =====

  useEffect(() => {
    let ignore = false;

    async function load() {
      setLoading(true);
      setLoadError(null);
      setActionError(null);

      const ownerKey = parseInt(idParam, 10);
      if (Number.isNaN(ownerKey)) {
        setLoadError("Некорректный ID клиента.");
        setLoading(false);
        return;
      }

      const client = supabase;
      if (!client) {
        setLoadError("Supabase недоступен на клиенте.");
        setLoading(false);
        return;
      }

      try {
        // 1. Клиент
        const { data: ownerData, error: ownerError } = await client
          .from("owner_profiles")
          .select("*")
          .eq("user_id", ownerKey)
          .is("deleted_at", null)
          .maybeSingle();

        if (ownerError) throw ownerError;
        setOwner(ownerData ?? null);

        if (!ownerData) {
          setPets([]);
          setAppointments([]);
          setPrivateData(null);
          setLoading(false);
          return;
        }

        setOwnerFullName(ownerData.full_name ?? "");
        setOwnerCity(ownerData.city ?? "");
        const c = parseContacts(ownerData.extra_contacts);
        setOwnerEmail(c.email);
        setOwnerPhone(c.phone);
        setOwnerTelegram(c.telegram);

        // 2. Питомцы
        const { data: petsData, error: petsError } = await client
          .from("pets")
          .select(
            "id, owner_id, name, species, breed, sex, birth_date, weight_kg, microchip_number, notes"
          )
          .eq("owner_id", ownerKey)
          .is("deleted_at", null)
          .order("name", { ascending: true });

        if (petsError) throw petsError;
        setPets((petsData as Pet[]) || []);

        // 3. Консультации
        const { data: apptData, error: apptError } = await client
          .from("appointments")
          .select(
            "id, starts_at, status, pet_name, species, service_code"
          )
          .eq("owner_id", ownerKey)
          .order("starts_at", { ascending: false });

        if (apptError) throw apptError;
        setAppointments((apptData as Appointment[]) || []);

        // 4. Персональные данные
        const { data: privData, error: privError } = await client
          .from("owner_private_data")
          .select(
            "passport_series, passport_number, passport_issued_by, passport_issued_at, registration_address, actual_address, legal_notes"
          )
          .eq("owner_id", ownerKey)
          .maybeSingle();

        if (privError) throw privError;
        setPrivateData((privData as OwnerPrivateData) || null);
      } catch (e) {
        console.error("load client error", e);
        setLoadError("Ошибка загрузки данных клиента.");
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    load();
    return () => {
      ignore = true;
    };
  }, [idParam]);

  // ===== ОБРАБОТЧИКИ ПРОФИЛЯ =====

  const handleOwnerSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!owner) return;

    const client = supabase;
    if (!client) {
      setActionError("Supabase недоступен.");
      return;
    }

    if (!ownerFullName.trim()) {
      setActionError("ФИО клиента не может быть пустым.");
      return;
    }

    setSavingOwner(true);
    setActionError(null);

    const extra_contacts = {
      email: ownerEmail.trim() || null,
      phone: ownerPhone.trim() || null,
      telegram: ownerTelegram.trim() || null,
    };

    const { error } = await client
      .from("owner_profiles")
      .update({
        full_name: ownerFullName.trim(),
        city: ownerCity.trim() || null,
        extra_contacts,
      })
      .eq("user_id", owner.user_id);

    if (error) {
      console.error("handleOwnerSave error", error);
      setActionError("Не удалось сохранить профиль клиента.");
      setSavingOwner(false);
      return;
    }

    setOwner({
      ...owner,
      full_name: ownerFullName.trim(),
      city: ownerCity.trim() || null,
      extra_contacts,
    });
    setSavingOwner(false);
    setIsEditingOwner(false);
  };

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
      setActionError("Supabase недоступен.");
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

  // ===== ОБРАБОТЧИКИ ПИТОМЦЕВ =====

  const handleDeletePet = async (petId: number) => {
    if (!confirm("Удалить этого питомца из картотеки?")) return;

    const client = supabase;
    if (!client) {
      setActionError("Supabase недоступен.");
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
    if (editingPet && editingPet.id === petId) setEditingPet(null);
  };

  const handleAddPet = async (e: FormEvent) => {
    e.preventDefault();
    if (!owner) return;

    const client = supabase;
    if (!client) {
      setActionError("Supabase недоступен.");
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
    const notes = newPetNotes.trim() || null;

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
        notes,
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
    setNewPetNotes("");
    setAddingPet(false);
    setShowAddPetForm(false);
  };

  const startEditPet = (pet: Pet) => {
    setEditingPet(pet);
    setActionError(null);
  };

  const cancelEditPet = () => {
    setEditingPet(null);
    setActionError(null);
  };

  const handleSavePetEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingPet) return;

    const client = supabase;
    if (!client) {
      setActionError("Supabase недоступен.");
      return;
    }

    if (!editingPet.name || !editingPet.name.trim()) {
      setActionError("Имя питомца не может быть пустым.");
      return;
    }

    setSavingPetEdit(true);
    setActionError(null);

    const { error } = await client
      .from("pets")
      .update({
        name: editingPet.name.trim(),
        species: editingPet.species?.trim() || null,
        breed: editingPet.breed?.trim() || null,
        sex: editingPet.sex || null,
        birth_date: editingPet.birth_date || null,
        weight_kg:
          editingPet.weight_kg != null
            ? Number(editingPet.weight_kg)
            : null,
        microchip_number: editingPet.microchip_number?.trim() || null,
        notes: editingPet.notes?.trim() || null,
      })
      .eq("id", editingPet.id);

    if (error) {
      console.error("handleSavePetEdit error", error);
      setActionError(
        "Не удалось сохранить изменения питомца: " +
          (error.message || "")
      );
      setSavingPetEdit(false);
      return;
    }

    setPets((prev) =>
      prev.map((p) => (p.id === editingPet.id ? editingPet : p))
    );
    setSavingPetEdit(false);
    setEditingPet(null);
  };

  // ===== ПЕРСОНАЛЬНЫЕ ДАННЫЕ: DELETE + INSERT =====

  const handlePrivateSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!owner) return;

    const client = supabase;
    if (!client) {
      setActionError("Supabase недоступен.");
      return;
    }

    setSavingPrivate(true);
    setActionError(null);

    const payload: OwnerPrivateData = {
      passport_series: privateData?.passport_series || null,
      passport_number: privateData?.passport_number || null,
      passport_issued_by: privateData?.passport_issued_by || null,
      passport_issued_at: privateData?.passport_issued_at || null,
      registration_address: privateData?.registration_address || null,
      actual_address: privateData?.actual_address || null,
      legal_notes: privateData?.legal_notes || null,
    };

    try {
      // удаляем старую запись (если была)
      const { error: delError } = await client
        .from("owner_private_data")
        .delete()
        .eq("owner_id", owner.user_id);

      if (delError) {
        console.error("owner_private_data delete error", delError);
        throw delError;
      }

      // вставляем новую запись
      const { error: insError } = await client
        .from("owner_private_data")
        .insert({
          owner_id: owner.user_id,
          ...payload,
        });

      if (insError) {
        console.error("owner_private_data insert error", insError);
        throw insError;
      }

      setPrivateData(payload);
      setSavingPrivate(false);
      setIsEditingPrivate(false);
    } catch (err) {
      console.error("handlePrivateSave error", err);
      setActionError(
        "Не удалось сохранить персональные данные клиента."
      );
      setSavingPrivate(false);
    }
  };

  // ===== РЕНДЕР СТРОКИ ПИТОМЦА =====

  const renderPetRow = (pet: Pet) => (
    <tr key={pet.id} className="border-b last:border-0 hover:bg-gray-50">
      <td className="px-2 py-2 text-[11px] text-emerald-700 hover:underline">
        <Link href={`/backoffice/registrar/pets/${pet.id}`}>
          {pet.name || "Без имени"}
        </Link>
      </td>
      <td className="px-2 py-2 text-[11px] text-gray-700">
        {pet.species || "Не указан"}
        {pet.breed && (
          <span className="text-[10px] text-gray-500"> ({pet.breed})</span>
        )}
      </td>
      <td className="px-2 py-2 text-[11px] text-gray-700">
        {pet.sex || "—"}
      </td>
      <td className="px-2 py-2 text-[11px] text-gray-700">
        {formatPetBirthDate(pet.birth_date)}
      </td>
      <td className="px-2 py-2 text-[11px] text-gray-700">
        {formatPetWeight(pet.weight_kg)}
      </td>
      <td className="px-2 py-2 text-[11px] text-gray-700">
        {pet.microchip_number || "—"}
        {pet.notes && (
          <div className="text-[10px] text-gray-500">Заметки: {pet.notes}</div>
        )}
      </td>
      <td className="px-2 py-2 text-right text-[11px] space-y-1">
        <Link
          href={`/backoffice/registrar/pets/${pet.id}`}
          className="block text-emerald-700 hover:underline"
        >
          Открыть профиль
        </Link>
        <Link
          href={`/backoffice/registrar?ownerId=${pet.owner_id}&petId=${pet.id}`}
          className="block text-emerald-700 hover:underline"
        >
          Записать на консультацию
        </Link>
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
    if (loading) {
    return (
      <RoleGuard allowed={["registrar", "admin"]}>
        <main className="mx-auto max-w-6xl px-4 py-6">
          <p className="text-xs text-gray-500">Загрузка данных…</p>
        </main>
      </RoleGuard>
    );
  }

  if (loadError || !owner) {
    return (
      <RoleGuard allowed={["registrar", "admin"]}>
        <main className="mx-auto max-w-6xl px-4 py-6">
          <p className="text-sm text-gray-500">
            {loadError || "Клиент не найден."}
          </p>
        </main>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard allowed={["registrar", "admin"]}>
      <main className="mx-auto max-w-6xl px-4 py-6 space-y-6">
        {/* ШАПКА */}
        <header className="flex items-center justify-between">
          <div>
            <Link
              href={backUrl}
              className="text-xs text-gray-500 hover:text-gray-700 hover:underline"
            >
              ← К картотеке клиентов
            </Link>
            <h1 className="mt-2 text-2xl font-bold tracking-tight">Клиент</h1>
            <p className="text-sm text-gray-500">
              Карточка клиента, его питомцы и персональные данные.
            </p>
          </div>
          <RegistrarHeader />
        </header>

        {/* ОШИБКИ */}
        {actionError && (
          <section className="rounded-2xl border bg-white p-3">
            <p className="text-xs text-red-700">{actionError}</p>
          </section>
        )}

        {/* ОСНОВНАЯ ИНФОРМАЦИЯ */}
        <section className="rounded-2xl border bg-white p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold">Основная информация</h2>
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
                  <div className="mb-1 text-[11px] text-gray-500">ФИО</div>
                  <div className="rounded-xl border bg-gray-50 px-3 py-2 text-sm text-gray-800">
                    {owner.full_name || "Без имени"}
                  </div>
                </div>
                <div>
                  <div className="mb-1 text-[11px] text-gray-500">Город</div>
                  <div className="rounded-xl border bg-gray-50 px-3 py-2 text-sm text-gray-800">
                    {owner.city || "Не указан"}
                  </div>
                </div>
                <div>
                  <div className="mb-1 text-[11px] text-gray-500">
                    ID клиента
                  </div>
                  <div className="rounded-xl border bg-gray-50 px-3 py-2 text-xs font-mono text-gray-800">
                    {owner.user_id}
                  </div>
                </div>
                <div>
                  <div className="mb-1 text-[11px] text-gray-500">
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
                <div className="mb-1 text-[11px] text-gray-500">Контакты</div>
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
                  <label className="mb-1 block text-[11px] text-gray-500">
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
                  <label className="mb-1 block text-[11px] text-gray-500">
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
                  <div className="mb-1 text-[11px] text-gray-500">
                    ID клиента
                  </div>
                  <div className="rounded-xl border bg-gray-50 px-3 py-2 text-xs font-mono text-gray-800">
                    {owner.user_id}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div>
                  <label className="mb-1 block text-[11px] text-gray-500">
                    E-mail
                  </label>
                  <input
                    type="email"
                    value={ownerEmail}
                    onChange={(e) => setOwnerEmail(e.target.value)}
                    className="w-full rounded-xl border px-3 py-1.5 text-xs"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] text-gray-500">
                    Телефон
                  </label>
                  <input
                    type="text"
                    value={ownerPhone}
                    onChange={(e) => setOwnerPhone(e.target.value)}
                    className="w-full rounded-xl border px-3 py-1.5 text-xs"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] text-gray-500">
                    Telegram
                  </label>
                  <input
                    type="text"
                    value={ownerTelegram}
                    onChange={(e) => setOwnerTelegram(e.target.value)}
                    className="w-full rounded-xl border px-3 py-1.5 text-xs"
                    placeholder="@username"
                  />
                </div>
              </div>

              <div className="md:col-span-2 flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingOwner(false);
                    if (owner) {
                      setOwnerFullName(owner.full_name ?? "");
                      setOwnerCity(owner.city ?? "");
                      const c = parseContacts(owner.extra_contacts);
                      setOwnerEmail(c.email);
                      setOwnerPhone(c.phone);
                      setOwnerTelegram(c.telegram);
                    }
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

        {/* ПЕРСОНАЛЬНЫЕ ДАННЫЕ */}
        <section className="rounded-2xl border bg-white p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold">
                Персональные данные (паспорт и адреса)
              </h2>
              <p className="text-[11px] text-gray-500">
                Этот блок заполняет регистратор. Клиент не видит эти данные.
              </p>
            </div>
            <div className="flex flex-col items-end text-[11px] text-gray-500">
              <span>Статус: {privateStatusLabel}</span>
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
                {privateData?.passport_series || privateData?.passport_number
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
                <span className="font-semibold">Адрес регистрации: </span>
                {privateData?.registration_address || "не указан"}
              </div>
              <div>
                <span className="font-semibold">Фактический адрес: </span>
                {privateData?.actual_address || "не указан"}
              </div>
              <div>
                <span className="font-semibold">Служебные пометки: </span>
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

        {/* ПИТОМЦЫ */}
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
                    <th className="px-2 py-2">Чип / заметки</th>
                    <th className="px-2 py-2 text-right">Действия</th>
                  </tr>
                </thead>
                <tbody>{pets.map((p) => renderPetRow(p))}</tbody>
              </table>
            </div>
          )}
                    {/* РЕДАКТИРОВАНИЕ ПИТОМЦА */}
          {editingPet && (
            <div className="rounded-xl border bg-gray-50 p-3 space-y-3">
              <h3 className="text-xs font-semibold text-gray-700">
                Редактирование питомца
              </h3>
              <form onSubmit={handleSavePetEdit} className="space-y-2 text-xs">
                <div>
                  <label className="mb-1 block text-[11px] text-gray-500">
                    Имя
                  </label>
                  <input
                    type="text"
                    value={editingPet.name || ""}
                    onChange={(e) =>
                      setEditingPet({
                        ...editingPet,
                        name: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border px-3 py-1.5 text-xs"
                  />
                </div>

                <div className="grid gap-2 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[11px] text-gray-500">
                      Вид
                    </label>
                    <input
                      type="text"
                      value={editingPet.species || ""}
                      onChange={(e) =>
                        setEditingPet({
                          ...editingPet,
                          species: e.target.value,
                        })
                      }
                      className="w-full rounded-xl border px-3 py-1.5 text-xs"
                      placeholder="Кошка, Собака…"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] text-gray-500">
                      Порода / описание
                    </label>
                    <input
                      type="text"
                      value={editingPet.breed || ""}
                      onChange={(e) =>
                        setEditingPet({
                          ...editingPet,
                          breed: e.target.value,
                        })
                      }
                      className="w-full rounded-xl border px-3 py-1.5 text-xs"
                      placeholder="Бернский зенненхунд…"
                    />
                  </div>
                </div>

                <div className="grid gap-2 md:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-[11px] text-gray-500">
                      Пол
                    </label>
                    <select
                      value={editingPet.sex || ""}
                      onChange={(e) =>
                        setEditingPet({
                          ...editingPet,
                          sex: e.target.value || null,
                        })
                      }
                      className="w-full rounded-xl border px-3 py-1.5 text-xs"
                    >
                      <option value="">Не указан</option>
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
                      value={editingPet.birth_date || ""}
                      onChange={(e) =>
                        setEditingPet({
                          ...editingPet,
                          birth_date: e.target.value || null,
                        })
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
                      value={
                        editingPet.weight_kg != null
                          ? String(editingPet.weight_kg)
                          : ""
                      }
                      onChange={(e) =>
                        setEditingPet({
                          ...editingPet,
                          weight_kg: e.target.value
                            ? Number(e.target.value)
                            : null,
                        })
                      }
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
                    value={editingPet.microchip_number || ""}
                    onChange={(e) =>
                      setEditingPet({
                        ...editingPet,
                        microchip_number: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border px-3 py-1.5 text-xs"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[11px] text-gray-500">
                    Заметки
                  </label>
                  <textarea
                    value={editingPet.notes || ""}
                    onChange={(e) =>
                      setEditingPet({
                        ...editingPet,
                        notes: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border px-3 py-1.5 text-xs"
                    rows={2}
                  />
                </div>

                <div className="pt-1 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={cancelEditPet}
                    className="rounded-xl border px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    disabled={savingPetEdit}
                    className="rounded-xl bg-emerald-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {savingPetEdit ? "Сохраняю…" : "Сохранить"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ДОБАВЛЕНИЕ ПИТОМЦА — СПОЙЛЕР */}
          <div className="mt-4 rounded-xl border bg-gray-50 p-3 space-y-3">
            <button
              type="button"
              onClick={() => setShowAddPetForm((v) => !v)}
              className="flex w-full items-center justify-between text-left text-xs font-semibold text-gray-700"
            >
              <span>Добавить нового питомца</span>
              <span className="text-[10px] text-gray-500">
                {showAddPetForm ? "Свернуть ▲" : "Развернуть ▼"}
              </span>
            </button>

            {showAddPetForm && (
              <form onSubmit={handleAddPet} className="space-y-2 text-xs">
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
                      onChange={(e) => setNewPetBirthDate(e.target.value)}
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

                <div>
                  <label className="mb-1 block text-[11px] text-gray-500">
                    Заметки
                  </label>
                  <textarea
                    value={newPetNotes}
                    onChange={(e) => setNewPetNotes(e.target.value)}
                    className="w-full rounded-xl border px-3 py-1.5 text-xs"
                    rows={2}
                    placeholder="Особенности, аллергии, поведение…"
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
            )}
          </div>
        </section>

        {/* ИСТОРИЯ КОНСУЛЬТАЦИЙ */}
        <section className="rounded-2xl border bg-white p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">
              История консультаций клиента
            </h2>
          </div>

          {appointments.length === 0 ? (
            <p className="text-xs text-gray-400">
              У клиента пока нет ни одной консультации.
            </p>
          ) : (
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
      </main>
    </RoleGuard>
  );
}
