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

const SPECIES_OPTIONS = [
  "Собака",
  "Кошка",
  "Грызун",
  "Птица",
  "Рептилия",
  "Другое",
] as const;

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

  const [isEditingOwner, setIsEditingOwner] = useState(false);
  const [ownerFullName, setOwnerFullName] = useState("");
  const [ownerCity, setOwnerCity] = useState("");
  const [savingOwner, setSavingOwner] = useState(false);

  const [newPetName, setNewPetName] = useState("");
  const [newPetSpecies, setNewPetSpecies] =
    useState<(typeof SPECIES_OPTIONS)[number]>("Кошка");
  const [newPetSpeciesOther, setNewPetSpeciesOther] = useState("");
  const [newPetBreed, setNewPetBreed] = useState("");
  const [addingPet, setAddingPet] = useState(false);

  const [isEditingPrivate, setIsEditingPrivate] = useState(false);
  const [savingPrivate, setSavingPrivate] = useState(false);

  const [actionError, setActionError] = useState<string | null>(null);

  // === ЗАГРУЗКА ВСЕГО КЛИЕНТА ===
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
      if (!client) {
        setLoadError("Supabase не доступен");
        return;
      }

      // --- КЛИЕНТ ---
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

      // --- ПИТОМЦЫ ---
      const { data: petsData } = await client
        .from("pets")
        .select("*")
        .eq("owner_id", ownerKey)
        .order("name", { ascending: true });

      setPets((petsData as any[]) || []);
      const petIds = (petsData || []).map((p: any) => p.id?.toString());

      // --- КОНСУЛЬТАЦИИ ---
      const { data: apptData } = await client
        .from("appointments")
        .select(
          "id, starts_at, status, pet_name, species, service_code"
        )
        .eq("owner_id", ownerKey)
        .order("starts_at", { ascending: false });

      setAppointments((apptData as any[]) || []);

      // --- ПЕРСОНАЛЬНЫЕ ДАННЫЕ ---
      const { data: privData } = await client
        .from("owner_private_data")
        .select("*")
        .eq("owner_id", ownerKey)
        .maybeSingle();

      setPrivateData(privData ?? null);

      // --- ИСТОРИЯ (owner + pet) ---
      const { data: auditRaw } = await client
        .from("audit_log")
        .select("*")
        .in("entity_type", ["owner", "pet"])
        .order("created_at", { ascending: false });

      const history = (auditRaw as AuditRow[]).filter((row) => {
        if (row.entity_type === "owner") {
          return row.entity_id === ownerKey.toString();
        }
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

    setSavingOwner(true);
    setActionError(null);

    const { error } = await client
      .from("owner_profiles")
      .update({
        full_name: ownerFullName.trim(),
        city: ownerCity.trim() || null,
      })
      .eq("user_id", owner.user_id);

    if (error) {
      console.error(error);
      setActionError("Не удалось сохранить изменения клиента.");
      setSavingOwner(false);
      return;
    }

    setOwner({
      ...owner,
      full_name: ownerFullName.trim(),
      city: ownerCity.trim() || null,
    });
    setSavingOwner(false);
    setIsEditingOwner(false);
  };

  // === УДАЛЕНИЕ КЛИЕНТА (SOFT-DELETE) ===
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

    const { error: ownerError } = await client
      .from("owner_profiles")
      .update({ deleted_at: new Date().toISOString() })
      .eq("user_id", owner.user_id);

    if (ownerError) {
      console.error(ownerError);
      setActionError("Не удалось пометить клиента как удалённого.");
      setLoading(false);
      return;
    }

    router.push("/backoffice/registrar/clients");
  };

  // === УДАЛЕНИЕ ПИТОМЦА (ПОКА ЖЁСТКО) ===
  const handleDeletePet = async (petId: string) => {
    if (!confirm("Удалить этого питомца из картотеки?")) return;

    const client = supabase;
    if (!client) {
      setActionError("Supabase недоступен на клиенте.");
      return;
    }

    setActionError(null);

    const { error } = await client.from("pets").delete().eq("id", petId);

    if (error) {
      console.error(error);
      setActionError(
        "Не удалось удалить питомца: " + (error.message || "")
      );
      return;
    }

    setPets((prev) => prev.filter((p) => p.id !== petId));
  };

  // === ДОБАВЛЕНИЕ ПИТОМЦА ===
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

    const speciesText =
      newPetSpecies === "Другое"
        ? newPetSpeciesOther.trim() || "другое"
        : newPetSpecies;
    const fullSpecies = newPetBreed.trim()
      ? `${speciesText}, ${newPetBreed.trim()}`
      : speciesText;

    const { data, error } = await client
      .from("pets")
      .insert({
        owner_id: owner.user_id,
        name: newPetName.trim(),
        species: fullSpecies,
      })
      .select("*")
      .single();

    if (error || !data) {
      console.error("add pet error", error);
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
    setAddingPet(false);
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
      console.error(error);
      setActionError("Не удалось сохранить персональные данные клиента.");
      setSavingPrivate(false);
      return;
    }

    setSavingPrivate(false);
    setIsEditingPrivate(false);
  };

  // === РЕНДЕР КОНТАКТОВ ===
  const renderContacts = (extra: any) => {
    if (!extra) {
      return <div className="text-xs text-gray-500">Контакты не указаны.</div>;
    }

    let parsed: Record<string, any> | null = null;

    if (typeof extra === "object" && !Array.isArray(extra)) {
      parsed = extra as Record<string, any>;
    } else if (typeof extra === "string") {
      try {
        parsed = JSON.parse(extra);
      } catch {
        parsed = null;
      }
    }

    if (parsed) {
      const email = parsed.email ?? parsed.mail ?? null;
      const phone = parsed.phone ?? parsed.tel ?? null;
      const telegram =
        parsed.telegram ?? parsed.tg ?? parsed.telegramNick ?? null;

      const hasKnown =
        (email && String(email).trim()) ||
        (phone && String(phone).trim()) ||
        (telegram && String(telegram).trim());

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
          {!hasKnown && (
            <>
              <div className="text-gray-500">
                Контакты указаны, но структура не распознана. Сырые данные:
              </div>
              <pre className="mt-1 rounded-lg bg-gray-100 px-2 py-1 text-[10px] text-gray-700 whitespace-pre-wrap break-words">
                {JSON.stringify(parsed, null, 2)}
              </pre>
            </>
          )}
        </div>
      );
    }

    return (
      <pre className="rounded-lg bg-gray-100 px-2 py-1 text-[10px] text-gray-700 whitespace-pre-wrap break-words">
        {typeof extra === "string" ? extra : JSON.stringify(extra, null, 2)}
      </pre>
    );
  };

  // === ФОРМАТИРОВАНИЕ ДАТЫ КОНСУЛЬТАЦИИ ===
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

  // === ЗАГОЛОВОК ДЕЙСТВИЯ ИСТОРИИ ===
  const getAuditActionLabel = (row: AuditRow) => {
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
      return row.action;
    }

    return row.action;
  };

  // === ОПИСАНИЕ ДЕЙСТВИЯ ИСТОРИИ ===
  const renderAuditSummary = (row: AuditRow) => {
    const before = row.payload_before || {};
    const after = row.payload_after || {};

    if (row.entity_type === "owner") {
      const changes: string[] = [];

      if (before.full_name !== after.full_name) {
        changes.push(
          `ФИО: "${before.full_name || "—"}" → "${after.full_name || "—"}"`
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
      const name = after.name || before.name || `ID ${row.entity_id}`;
      const species = after.species || before.species || "";

      if (row.action === "create") {
        return `Создан питомец "${name}"${species ? ` (${species})` : ""}`;
      }
      if (row.action === "delete") {
        return `Удалён питомец "${name}"${species ? ` (${species})` : ""}`;
      }
      if (row.action === "update") {
        return `Изменены данные питомца "${name}"`;
      }
    }

    return "Изменение данных";
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
            <h1 className="mt-2 text-2xl font-bold tracking-tight">Клиент</h1>
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
              Клиент с идентификатором <span className="font-mono">{idParam}</span> не найден.
            </p>
          </section>
        )}

        {/* === ОСНОВНОЙ КОНТЕНТ === */}
        {!loading && !loadError && owner && (
          <>

            {/* === БЛОК "ОСНОВНАЯ ИНФОРМАЦИЯ" === */}
            <section className="rounded-2xl border bg-white p-4 space-y-3">

              <div className="flex items-center justify-between gap-3">
                <h2 className="text-base font-semibold">Основная информация</h2>

                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/backoffice/registrar?ownerId=${owner.user_id}`}
                    className="rounded-xl border border-emerald-600 px-3 py-1.5 text-[11px] font-medium text-emerald-700 hover:bg-emerald-50"
                  >
                    Создать консультацию
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingOwner((v) => !v);
                      setActionError(null);
                    }}
                    className="rounded-xl border border-gray-300 px-3 py-1.5 text-[11px] text-gray-700 hover:bg-gray-50"
                  >
                    {isEditingOwner ? "Отмена" : "Редактировать клиента"}
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

              {/* Просмотр или редактирование */}
              {!isEditingOwner ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Левый блок */}
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
                      <div className="text-[11px] text-gray-500 mb-1">ID клиента</div>
                      <div className="rounded-xl border bg-gray-50 px-3 py-2 text-xs font-mono text-gray-800">
                        {owner.user_id}
                      </div>
                    </div>

                    <div>
                      <div className="text-[11px] text-gray-500 mb-1">Дата создания</div>
                      <div className="rounded-xl border bg-gray-50 px-3 py-2 text-xs text-gray-800">
                        {owner.created_at
                          ? new Date(owner.created_at).toLocaleString("ru-RU")
                          : "—"}
                      </div>
                    </div>
                  </div>

                  {/* Контакты */}
                  <div className="space-y-2">
                    <div className="text-[11px] text-gray-500 mb-1">Контакты</div>
                    <div className="rounded-xl border bg-gray-50 px-3 py-2">
                      {renderContacts(owner.extra_contacts)}
                    </div>
                  </div>
                </div>
              ) : (
                /* Форма редактирования */
                <form onSubmit={handleOwnerSave} className="grid gap-4 md:grid-cols-2">

                  <div className="space-y-2">
                    <div>
                      <label className="text-[11px] text-gray-500 mb-1 block">ФИО</label>
                      <input
                        type="text"
                        value={ownerFullName}
                        onChange={(e) => setOwnerFullName(e.target.value)}
                        className="w-full rounded-xl border px-3 py-1.5 text-xs"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-gray-500 mb-1 block">Город</label>
                      <input
                        type="text"
                        value={ownerCity}
                        onChange={(e) => setOwnerCity(e.target.value)}
                        className="w-full rounded-xl border px-3 py-1.5 text-xs"
                      />
                    </div>

                    <div>
                      <div className="text-[11px] text-gray-500 mb-1">ID</div>
                      <div className="rounded-xl border bg-gray-50 px-3 py-2 text-xs font-mono">
                        {owner.user_id}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] text-gray-500">Контакты</label>
                    <div className="rounded-xl border bg-gray-50 px-3 py-2">
                      {renderContacts(owner.extra_contacts)}
                    </div>
                    <p className="text-[10px] text-gray-400">
                      Контакты пока редактировать нельзя.
                    </p>
                  </div>

                  {/* Кнопки */}
                  <div className="md:col-span-2 flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingOwner(false);
                        setOwnerFullName(owner.full_name || "");
                        setOwnerCity(owner.city || "");
                      }}
                      className="rounded-xl border px-3 py-1.5 text-xs text-gray-600"
                    >
                      Отмена
                    </button>

                    <button
                      type="submit"
                      disabled={savingOwner}
                      className="rounded-xl bg-emerald-600 px-4 py-1.5 text-xs text-white"
                    >
                      {savingOwner ? "Сохраняю…" : "Сохранить"}
                    </button>
                  </div>
                </form>
              )}
            </section>

            {/* === ПЕРСОНАЛЬНЫЕ ДАННЫЕ === */}
            (… блок персональных данных — остаётся как в твоём файле из Части 2 …)

            {/* === ПИТОМЦЫ === */}
            (… блок питомцев — оставь полностью как в Части 2 …)

            {/* === ИСТОРИЯ КОНСУЛЬТАЦИЙ === */}
            (… оставь как в Части 2 …)

            {/* === ИСТОРИЯ ИЗМЕНЕНИЙ ПРОФИЛЯ + ПИТОМЦЕВ === */}
            <section className="rounded-2xl border bg-white p-4 space-y-3">
              <h2 className="text-base font-semibold">История изменений</h2>

              {auditRows.length === 0 && (
                <p className="text-xs text-gray-400">
                  История пока пуста. Изменения появятся после редактирования профиля или питомцев.
                </p>
              )}

              {auditRows.length > 0 && (
                <table className="min-w-full text-xs">
                  <thead>
                    <tr className="border-b bg-gray-50 text-left text-[11px] uppercase text-gray-500">
                      <th className="px-2 py-2">Дата</th>
                      <th className="px-2 py-2">Тип</th>
                      <th className="px-2 py-2">Описание</th>
                    </tr>
                  </thead>

                  <tbody>
                    {auditRows.map((row) => (
                      <tr key={row.id} className="border-b hover:bg-gray-50">
                        <td className="px-2 py-2 text-[11px]">
                          {new Date(row.created_at).toLocaleString("ru-RU")}
                        </td>

                        <td className="px-2 py-2 text-[11px]">
                          {getAuditActionLabel(row)}
                        </td>

                        <td className="px-2 py-2 text-[11px]">
                          {renderAuditSummary(row)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {auditRows.length > 0 && (
                <p className="text-[10px] text-gray-400">
                  Показаны только последние 10 изменений. Позже сделаем полный журнал.
                </p>
              )}
            </section>

          </>
        )}
      </main>
    </RoleGuard>
  );
}
