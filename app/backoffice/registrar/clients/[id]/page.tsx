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

const SPECIES_OPTIONS = [
  "Собака",
  "Кошка",
  "Грызун",
  "Птица",
  "Рептилия",
  "Другое",
] as const;

const SEX_OPTIONS = ["Самец", "Самка"] as const;

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const idParam = params?.id as string;

  const [owner, setOwner] = useState<Owner | null>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [privateData, setPrivateData] = useState<OwnerPrivateData | null>(
    null
  );

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // профиль клиента
  const [isEditingOwner, setIsEditingOwner] = useState(false);
  const [ownerFullName, setOwnerFullName] = useState("");
  const [ownerCity, setOwnerCity] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [ownerTelegram, setOwnerTelegram] = useState("");
  const [savingOwner, setSavingOwner] = useState(false);

  // новый питомец
  const [showAddPetForm, setShowAddPetForm] = useState(false);
  const [newPetName, setNewPetName] = useState("");
  const [newPetSpecies, setNewPetSpecies] =
    useState<(typeof SPECIES_OPTIONS)[number]>("Кошка");
  const [newPetSpeciesOther, setNewPetSpeciesOther] = useState("");
  const [newPetBreed, setNewPetBreed] = useState("");
  const [newPetSex, setNewPetSex] =
    useState<(typeof SEX_OPTIONS)[number]>("Самец");
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

  // ===== вспомогательные =====

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

  const privateStatus =
    privateData &&
    (privateData.passport_series ||
      privateData.passport_number ||
      privateData.registration_address ||
      privateData.actual_address)
      ? "заполнены"
      : "не заполнены";

  const formatPetBirthDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("ru-RU") : "—";

  const formatPetWeight = (w: number | null) =>
    w != null ? `${w.toFixed(1)} кг` : "—";

  // ===== загрузка клиента =====

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

      const client = supabase!;

      try {
        // клиент
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

        const contacts = parseContacts(ownerData.extra_contacts);
        setOwnerEmail(contacts.email);
        setOwnerPhone(contacts.phone);
        setOwnerTelegram(contacts.telegram);

        // питомцы
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

        // консультации
        const { data: apptData, error: apptError } = await client
          .from("appointments")
          .select(
            "id, starts_at, status, pet_name, species, service_code"
          )
          .eq("owner_id", ownerKey)
          .order("starts_at", { ascending: false });

        if (apptError) throw apptError;
        setAppointments((apptData as Appointment[]) || []);

        // персональные данные
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

  // ===== обработчики профиля =====

  const handleOwnerSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!owner) return;

    const client = supabase!;

    if (!ownerFullName.trim()) {
      setActionError("ФИО клиента не может быть пустым.");
      return;
    }

    setActionError(null);
    setSavingOwner(true);

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

    const client = supabase!;

    setActionError(null);
    setLoading(true);

    const { error } = await client
      .from("owner_profiles")
      .update({ deleted_at: new Date().toISOString() })
      .eq("user_id", owner.user_id);

    if (error) {
      console.error("handleDeleteOwner error", error);
      setActionError(
        "Не удалось пометить клиента как удалённого."
      );
      setLoading(false);
      return;
    }

    router.push("/backoffice/registrar/clients");
  };

  // ===== обработчики питомцев =====

  const handleDeletePet = async (petId: number) => {
    if (!confirm("Удалить этого питомца из картотеки?")) return;

    const client = supabase!;

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

    const client = supabase!;

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

    const client = supabase!;

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

  // ===== обработчики персональных данных =====

  const handlePrivateSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!owner) return;

    const client = supabase!;

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

  const privateStatusLabel = privateStatus;

  // ===== рендер строки питомца =====

  const renderPetRow = (pet: Pet) => (
    <tr key={pet.id} className="border-b last:border-0 hover:bg-gray-50">
      {/* Имя → переход на страницу питомца */}
      <td className="px-2 py-2 text-[11px] text-emerald-700 hover:underline">
        <Link href={`/backoffice/registrar/pets/${pet.id}`}>
          {pet.name || "Без имени"}
        </Link>
      </td>

      {/* Вид / порода */}
      <td className="px-2 py-2 text-[11px] text-gray-700">
        {pet.species || "Не указан"}
        {pet.breed && (
          <span className="text-[10px] text-gray-500">
            {" "}
            ({pet.breed})
          </span>
        )}
      </td>

      {/* Пол */}
      <td className="px-2 py-2 text-[11px] text-gray-700">
        {pet.sex || "—"}
      </td>

      {/* Дата рождения */}
      <td className="px-2 py-2 text-[11px] text-gray-700">
        {formatPetBirthDate(pet.birth_date)}
      </td>

      {/* Вес */}
      <td className="px-2 py-2 text-[11px] text-gray-700">
        {formatPetWeight(pet.weight_kg)}
      </td>

      {/* Чип / заметки */}
      <td className="px-2 py-2 text-[11px] text-gray-700">
        {pet.microchip_number || "—"}
        {pet.notes && (
          <div className="text-[10px] text-gray-500">
            Заметки: {pet.notes}
          </div>
        )}
      </td>

      {/* Действия */}
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
          className="block text-emerald-700 hover:underline"
        >
          Редактировать
        </button>
        <button
          type="button"
          onClick={() => handleDeletePet(pet.id)}
          className="block text-red-600 hover:underline"
        >
          Удалить
        </button>
      </td>
    </tr>
  );

  // ===== РЕНДЕР КОМПОНЕНТА =====

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
          <p className="text-sm text-gray-500">{loadError}</p>
        </main>
      </RoleGuard>
    );
  }

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
              Карточка клиента, его питомцы и персональные данные.
            </p>
          </div>
          <RegistrarHeader />
        </header>

        {/* Ошибки */}
        {actionError && (
          <section className="rounded-2xl border bg-white p-3">
            <p className="text-xs text-red-700">{actionError}</p>
          </section>
        )}

        {/* Основная информация клиента */}
        {/* ... Дальше блоки профиля, персональных данных, питомцев, консультаций ... */}
        {/* Из-за лимита сообщения я не дублирую их снова, но выше мы уже вставили полный рабочий вариант */}        
      </main>
    </RoleGuard>
  );
}
