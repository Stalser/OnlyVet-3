"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { RegistrarHeader } from "@/components/registrar/RegistrarHeader";
import { supabase } from "@/lib/supabaseClient";

const SPECIES_OPTIONS = [
  "Собака",
  "Кошка",
  "Грызун",
  "Птица",
  "Рептилия",
  "Другое",
] as const;

export default function NewClientPage() {
  const router = useRouter();

  // Клиент
  const [fullName, setFullName] = useState("");
  const [city, setCity] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [telegram, setTelegram] = useState("");

  // Питомец (опционально)
  const [petName, setPetName] = useState("");
  const [petSpecies, setPetSpecies] =
    useState<(typeof SPECIES_OPTIONS)[number]>("Кошка");
  const [petSpeciesOther, setPetSpeciesOther] = useState("");
  const [petBreed, setPetBreed] = useState("");

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    null
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const client = supabase;
    if (!client) {
      setErrorMessage("Supabase недоступен на клиенте.");
      return;
    }

    if (!fullName.trim()) {
      setErrorMessage("Укажите ФИО клиента.");
      return;
    }

    setSaving(true);
    setErrorMessage(null);

    // собираем extra_contacts в JSON
    const extraContacts: Record<string, string> = {};
    if (email.trim()) extraContacts.email = email.trim();
    if (phone.trim()) extraContacts.phone = phone.trim();
    if (telegram.trim()) extraContacts.telegram = telegram.trim();

    // создаём клиента
    const { data: ownerInsert, error: ownerError } = await client
      .from("owner_profiles")
      .insert({
        full_name: fullName.trim(),
        city: city.trim() || null,
        extra_contacts:
          Object.keys(extraContacts).length > 0
            ? extraContacts
            : null,
      })
      .select("user_id")
      .single();

    if (ownerError || !ownerInsert) {
      console.error(ownerError);
      setErrorMessage("Не удалось создать клиента.");
      setSaving(false);
      return;
    }

    const ownerId = ownerInsert.user_id as number;

    // если введён питомец — создаём его
    if (petName.trim()) {
      const speciesText =
        petSpecies === "Другое"
          ? petSpeciesOther.trim() || "другое"
          : petSpecies;
      const fullSpecies = petBreed.trim()
        ? `${speciesText}, ${petBreed.trim()}`
        : speciesText;

      const { error: petError } = await client.from("pets").insert({
        owner_id: ownerId,
        name: petName.trim(),
        species: fullSpecies,
      });

      if (petError) {
        console.error(petError);
        // не падаем, просто показываем предупреждение
        setErrorMessage(
          "Клиент создан, но не удалось сохранить питомца. Проверьте таблицу pets."
        );
        setSaving(false);
        router.push(`/backoffice/registrar/clients/${ownerId}`);
        return;
      }
    }

    setSaving(false);
    router.push(`/backoffice/registrar/clients/${ownerId}`);
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
              Добавить клиента
            </h1>
            <p className="text-sm text-gray-500">
              Создание нового владельца. При необходимости можно сразу
              добавить первого питомца.
            </p>
          </div>
          <RegistrarHeader />
        </header>

        <section className="rounded-2xl border bg-white p-4 space-y-4">
          {errorMessage && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {errorMessage}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            {/* Клиент */}
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-gray-800">
                Данные клиента
              </h2>
              <div>
                <label className="mb-1 block text-[11px] text-gray-500">
                  ФИО <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-xl border px-3 py-1.5 text-xs"
                  placeholder="Иванов Иван Иванович"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] text-gray-500">
                  Город
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full rounded-xl border px-3 py-1.5 text-xs"
                  placeholder="Например: Москва"
                />
              </div>

              {/* Контакты */}
              <div className="grid gap-2 md:grid-cols-3">
                <div>
                  <label className="mb-1 block text-[11px] text-gray-500">
                    E-mail
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border px-3 py-1.5 text-xs"
                    placeholder="user@example.com"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] text-gray-500">
                    Телефон
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-xl border px-3 py-1.5 text-xs"
                    placeholder="+7 900 000-00-00"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] text-gray-500">
                    Telegram
                  </label>
                  <input
                    type="text"
                    value={telegram}
                    onChange={(e) => setTelegram(e.target.value)}
                    className="w-full rounded-xl border px-3 py-1.5 text-xs"
                    placeholder="@username"
                  />
                </div>
              </div>
            </div>

            {/* Питомец (опционально) */}
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-gray-800">
                Питомец (необязательно)
              </h2>
              <p className="text-[11px] text-gray-500">
                Можно сразу добавить первого питомца этого клиента. Поля
                ниже не обязательны.
              </p>

              <div>
                <label className="mb-1 block text-[11px] text-gray-500">
                  Имя питомца
                </label>
                <input
                  type="text"
                  value={petName}
                  onChange={(e) => setPetName(e.target.value)}
                  className="w-full rounded-xl border px-3 py-1.5 text-xs"
                  placeholder="Мурзик"
                />
              </div>

              <div className="grid gap-2 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[11px] text-gray-500">
                    Вид
                  </label>
                  <select
                    value={petSpecies}
                    onChange={(e) =>
                      setPetSpecies(
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
                  {petSpecies === "Другое" && (
                    <input
                      type="text"
                      value={petSpeciesOther}
                      onChange={(e) =>
                        setPetSpeciesOther(e.target.value)
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
                    value={petBreed}
                    onChange={(e) => setPetBreed(e.target.value)}
                    className="w-full rounded-xl border px-3 py-1.5 text-xs"
                    placeholder="Например: британская, метис..."
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {saving ? "Создаём клиента…" : "Создать клиента"}
              </button>
            </div>
          </form>
        </section>
      </main>
    </RoleGuard>
  );
}
