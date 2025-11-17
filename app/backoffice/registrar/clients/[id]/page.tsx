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
};

type Pet = {
  id: string;
  name: string | null;
  species: string | null;
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
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Редактирование владельца
  const [isEditingOwner, setIsEditingOwner] = useState(false);
  const [ownerFullName, setOwnerFullName] = useState("");
  const [ownerCity, setOwnerCity] = useState("");
  const [savingOwner, setSavingOwner] = useState(false);

  // Добавление питомца
  const [newPetName, setNewPetName] = useState("");
  const [newPetSpecies, setNewPetSpecies] =
    useState<(typeof SPECIES_OPTIONS)[number]>("Кошка");
  const [newPetSpeciesOther, setNewPetSpeciesOther] = useState("");
  const [newPetBreed, setNewPetBreed] = useState("");
  const [addingPet, setAddingPet] = useState(false);

  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function load() {
      setLoading(true);
      setLoadError(null);
      setActionError(null);

      const ownerId = parseInt(idParam, 10);
      if (Number.isNaN(ownerId)) {
        setOwner(null);
        setPets([]);
        setLoading(false);
        setLoadError("Некорректный идентификатор клиента.");
        return;
      }

      const client = supabase;
      if (!client) {
        setOwner(null);
        setPets([]);
        setLoading(false);
        setLoadError("Supabase недоступен на клиенте.");
        return;
      }

      // загружаем клиента
      const {
        data: ownerData,
        error: ownerError,
      } = await client
        .from("owner_profiles")
        .select("*")
        .eq("user_id", ownerId)
        .maybeSingle();

      // загружаем питомцев
      const {
        data: petsData,
        error: petsError,
      } = await client
        .from("pets")
        .select("*")
        .eq("owner_id", ownerId)
        .order("name", { ascending: true });

      if (!ignore) {
        if (ownerError) {
          console.error(ownerError);
          setLoadError("Ошибка загрузки данных клиента.");
          setOwner(null);
        } else {
          setOwner(ownerData as Owner);
          if (ownerData) {
            setOwnerFullName(ownerData.full_name ?? "");
            setOwnerCity(ownerData.city ?? "");
          }
        }

        if (petsError) {
          console.error(petsError);
          setPets([]);
        } else {
          setPets((petsData as Pet[]) || []);
        }

        setLoading(false);
      }
    }

    load();

    return () => {
      ignore = true;
    };
  }, [idParam]);

  // Сохранение изменений владельца
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

  // Удаление питомца
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
      setActionError("Не удалось удалить питомца.");
      return;
    }

    setPets((prev) => prev.filter((p) => p.id !== petId));
  };

  // Удаление клиента и всех питомцев
  const handleDeleteOwner = async () => {
    if (
      !owner ||
      !confirm(
        "Удалить этого клиента и всех его питомцев из картотеки? Это действие нельзя отменить."
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

    const { error: petsError } = await client
      .from("pets")
      .delete()
      .eq("owner_id", owner.user_id);

    if (petsError) {
      console.error(petsError);
      setActionError("Не удалось удалить питомцев клиента.");
      setLoading(false);
      return;
    }

    const { error: ownerError } = await client
      .from("owner_profiles")
      .delete()
      .eq("user_id", owner.user_id);

    if (ownerError) {
      console.error(ownerError);
      setActionError("Не удалось удалить клиента.");
      setLoading(false);
      return;
    }

    router.push("/backoffice/registrar/clients");
  };

  // Добавление нового питомца
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
      console.error(error);
      setActionError("Не удалось добавить питомца.");
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

  // Красивое форматирование extra_contacts
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
      const telegram = parsed.telegram ?? parsed.tg ?? parsed.telegramNick ?? null;

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
            <div className="text-gray-500">
              Контакты указаны, но структура не распознана. Сырые данные:
            </div>
          )}
          {!hasKnown && (
            <pre className="mt-1 rounded-lg bg-gray-100 px-2 py-1 text-[10px] text-gray-700 whitespace-pre-wrap break-words">
              {JSON.stringify(parsed, null, 2)}
            </pre>
          )}
        </div>
      );
    }

    // если это вообще не JSON и не объект — просто покажем как есть
    return (
      <pre className="rounded-lg bg-gray-100 px-2 py-1 text-[10px] text-gray-700 whitespace-pre-wrap break-words">
        {typeof extra === "string" ? extra : JSON.stringify(extra, null, 2)}
      </pre>
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
              Карточка клиента и список его питомцев. Питомцы всегда
              привязаны к этому клиенту. У одного клиента может быть
              несколько животных.
            </p>
          </div>
          <RegistrarHeader />
        </header>

        {/* Ошибки */}
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
                <h2 className="text-base font-semibold">
                  Основная информация
                </h2>
                <div className="flex items-center gap-2">
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

              {!isEditingOwner ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <div>
                      <div className="text-[11px] text-gray-500 mb-1">
                        ФИО
                      </div>
                      <div className="rounded-xl border bg-gray-50 px-3 py-2 text-sm text-gray-800">
                        {owner.full_name || "Без имени"}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-gray-500 mb-1">
                        Город
                      </div>
                      <div className="rounded-xl border bg-gray-50 px-3 py-2 text-sm text-gray-800">
                        {owner.city || "Не указан"}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-gray-500 mb-1">
                        ID клиента (user_id)
                      </div>
                      <div className="rounded-xl border bg-gray-50 px-3 py-2 text-xs font-mono text-gray-800">
                        {owner.user_id}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-gray-500 mb-1">
                        Дата создания профиля
                      </div>
                      <div className="rounded-xl border bg-gray-50 px-3 py-2 text-xs text-gray-800">
                        {owner.created_at
                          ? new Date(owner.created_at).toLocaleString(
                              "ru-RU"
                            )
                          : "—"}
                      </div>
                    </div>
                  </div>

                  {/* Контакты — красиво */}
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
                        placeholder="Иванов Иван Иванович"
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
                        placeholder="Например: Москва"
                      />
                    </div>
                    <div>
                      <div className="text-[11px] text-gray-500 mb-1">
                        ID клиента (только чтение)
                      </div>
                      <div className="rounded-xl border bg-gray-50 px-3 py-2 text-xs font-mono text-gray-800">
                        {owner.user_id}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-gray-500 mb-1">
                        Дата создания профиля
                      </div>
                      <div className="rounded-xl border bg-gray-50 px-3 py-2 text-xs text-gray-800">
                        {owner.created_at
                          ? new Date(owner.created_at).toLocaleString(
                              "ru-RU"
                            )
                          : "—"}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-[11px] text-gray-500 mb-1">
                      Контакты (только чтение)
                    </div>
                    <div className="rounded-xl border bg-gray-50 px-3 py-2">
                      {renderContacts(owner.extra_contacts)}
                    </div>
                    <p className="text-[10px] text-gray-400">
                      Редактирование контактов будет добавлено позже. Сейчас
                      можно менять только ФИО и город.
                    </p>
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
                      {savingOwner ? "Сохраняю…" : "Сохранить изменения"}
                    </button>
                  </div>
                </form>
              )}
            </section>

            {/* Питомцы клиента */}
            <section className="rounded-2xl border bg-white p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold">Питомцы</h2>
              </div>

              {/* Список питомцев */}
              {pets.length === 0 && (
                <p className="text-xs text-gray-400">
                  У этого клиента пока нет ни одного питомца в базе.
                </p>
              )}

              {pets.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs">
                    <thead>
                      <tr className="border-b bg-gray-50 text-left text-[11px] uppercase text-gray-500">
                        <th className="px-2 py-2">Имя</th>
                        <th className="px-2 py-2">Вид / порода</th>
                        <th className="px-2 py-2">ID</th>
                        <th className="px-2 py-2 text-right">Действия</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pets.map((p) => (
                        <tr
                          key={p.id}
                          className="border-b last:border-0 hover:bg-gray-50"
                        >
                          <td className="px-2 py-2 align-top text-[11px] text-gray-800">
                            {p.name || "Без имени"}
                          </td>
                          <td className="px-2 py-2 align-top text-[11px] text-gray-600">
                            {p.species || "Не указана"}
                          </td>
                          <td className="px-2 py-2 align-top text-[11px] text-gray-500 font-mono">
                            {p.id}
                          </td>
                          <td className="px-2 py-2 align-top text-right">
                            <button
                              type="button"
                              onClick={() => handleDeletePet(p.id)}
                              className="text-[10px] font-medium text-red-600 hover:underline"
                            >
                              Удалить питомца
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Добавление питомца */}
              <div className="mt-4 rounded-xl border bg-gray-50 p-3 space-y-3">
                <h3 className="text-xs font-semibold text-gray-700">
                  Добавить нового питомца этому клиенту
                </h3>
                <form
                  onSubmit={handleAddPet}
                  className="space-y-2"
                >
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
                            e.target
                              .value as (typeof SPECIES_OPTIONS)[number]
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
                        placeholder="Например: британская, метис..."
                      />
                    </div>
                  </div>
                  <div className="pt-1 flex justify-end">
                    <button
                      type="submit"
                      disabled={addingPet}
                      className="rounded-xl bg-emerald-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                    >
                      {addingPet
                        ? "Добавляем питомца…"
                        : "Добавить питомца"}
                    </button>
                  </div>
                </form>
              </div>
            </section>
          </>
        )}
      </main>
    </RoleGuard>
  );
}
