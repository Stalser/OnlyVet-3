"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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

const SEX_OPTIONS = ["Самец", "Самка"] as const;

export default function RegistrarCreateClientPage() {
  const router = useRouter();

  // Данные клиента
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
  const [petSex, setPetSex] =
    useState<(typeof SEX_OPTIONS)[number]>("Самец");
  const [petBirthDate, setPetBirthDate] = useState("");
  const [petWeight, setPetWeight] = useState("");
  const [petChip, setPetChip] = useState("");
  const [petNotes, setPetNotes] = useState("");

  // Персональные данные (опционально, под спойлером)
  const [showPrivateBlock, setShowPrivateBlock] = useState(false);
  const [passportSeries, setPassportSeries] = useState("");
  const [passportNumber, setPassportNumber] = useState("");
  const [passportIssuedBy, setPassportIssuedBy] = useState("");
  const [passportIssuedAt, setPassportIssuedAt] = useState("");
  const [registrationAddress, setRegistrationAddress] = useState("");
  const [actualAddress, setActualAddress] = useState("");
  const [legalNotes, setLegalNotes] = useState("");

  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const hasPrivateDataToSave =
    passportSeries.trim() ||
    passportNumber.trim() ||
    passportIssuedBy.trim() ||
    passportIssuedAt.trim() ||
    registrationAddress.trim() ||
    actualAddress.trim() ||
    legalNotes.trim();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setActionError(null);

    if (!fullName.trim()) {
      setActionError("ФИО клиента не может быть пустым.");
      return;
    }

    const client = supabase;
    if (!client) {
      setActionError("Supabase недоступен.");
      return;
    }

    setSaving(true);

    try {
      // 1. Создаём клиента (owner_profiles)
      const extra_contacts = {
        email: email.trim() || null,
        phone: phone.trim() || null,
        telegram: telegram.trim() || null,
      };

      const { data: ownerRow, error: ownerError } = await client
        .from("owner_profiles")
        .insert({
          full_name: fullName.trim(),
          city: city.trim() || null,
          extra_contacts,
        })
        .select("*")
        .single();

      if (ownerError || !ownerRow) {
        console.error("Create owner error", ownerError);
        throw new Error("Не удалось создать клиента.");
      }

      const ownerId = ownerRow.user_id as number;

      // 2. Если указан питомец — создаём первого питомца
      if (petName.trim()) {
        const baseSpecies =
          petSpecies === "Другое"
            ? petSpeciesOther.trim() || "Другое"
            : petSpecies;

        const species = baseSpecies;
        const breed = petBreed.trim() || null;
        const sex = petSex || null;
        const birth_date = petBirthDate || null;
        const weight_kg = petWeight ? Number(petWeight) : null;
        const microchip_number = petChip.trim() || null;
        const notes = petNotes.trim() || null;

        const { error: petError } = await client.from("pets").insert({
          owner_id: ownerId,
          name: petName.trim(),
          species,
          breed,
          sex,
          birth_date,
          weight_kg,
          microchip_number,
          notes,
        });

        if (petError) {
          console.error("Create pet error", petError);
          throw new Error(
            "Клиент создан, но не удалось создать первого питомца."
          );
        }
      }

      // 3. Если заполнен блок персональных данных — создаём owner_private_data
      if (hasPrivateDataToSave) {
        const payload = {
          owner_id: ownerId,
          passport_series: passportSeries.trim() || null,
          passport_number: passportNumber.trim() || null,
          passport_issued_by: passportIssuedBy.trim() || null,
          passport_issued_at: passportIssuedAt || null,
          registration_address: registrationAddress.trim() || null,
          actual_address: actualAddress.trim() || null,
          legal_notes: legalNotes.trim() || null,
        };

        const { error: privError } = await client
          .from("owner_private_data")
          .insert(payload);

        if (privError) {
          console.error("Create owner_private_data error", privError);
          throw new Error(
            "Клиент создан, но не удалось сохранить персональные данные."
          );
        }
      }

      // 4. Переходим в карточку клиента
      router.push(`/backoffice/registrar/clients/${ownerId}`);
    } catch (err: any) {
      console.error("Create client full error", err);
      setActionError(
        err?.message ||
          "Произошла ошибка при создании клиента. Попробуйте ещё раз."
      );
      setSaving(false);
      return;
    }

    setSaving(false);
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
              добавить первого питомца и персональные данные.
            </p>
          </div>
          <RegistrarHeader />
        </header>

        {/* Ошибка */}
        {actionError && (
          <section className="rounded-2xl border bg-white p-3">
            <p className="text-xs text-red-700">{actionError}</p>
          </section>
        )}

        {/* Форма */}
        <section className="rounded-2xl border bg-white p-4">
          <form onSubmit={handleSubmit} className="space-y-6 text-xs">
            {/* Данные клиента */}
            <div className="space-y-3">
              <h2 className="text-base font-semibold">Данные клиента</h2>

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

              <div className="grid gap-3 md:grid-cols-3">
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
                    type="text"
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

            {/* Персональные данные — спойлер */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setShowPrivateBlock((v) => !v)}
                className="flex w-full items-center justify-between rounded-xl border bg-gray-50 px-3 py-2 text-left text-xs font-semibold text-gray-700"
              >
                <span>Персональные данные (паспорт и адреса, опционально)</span>
                <span className="text-[10px] text-gray-500">
                  {showPrivateBlock ? "Свернуть ▲" : "Развернуть ▼"}
                </span>
              </button>

              {showPrivateBlock && (
                <div className="rounded-xl border bg-gray-50 p-3 space-y-2">
                  <div className="grid gap-2 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-[11px] text-gray-500">
                        Серия паспорта
                      </label>
                      <input
                        type="text"
                        value={passportSeries}
                        onChange={(e) =>
                          setPassportSeries(e.target.value)
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
                        value={passportNumber}
                        onChange={(e) =>
                          setPassportNumber(e.target.value)
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
                      value={passportIssuedBy}
                      onChange={(e) =>
                        setPassportIssuedBy(e.target.value)
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
                      value={passportIssuedAt}
                      onChange={(e) =>
                        setPassportIssuedAt(e.target.value)
                      }
                      className="w-full rounded-xl border px-3 py-1.5 text-xs"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] text-gray-500">
                      Адрес регистрации
                    </label>
                    <textarea
                      value={registrationAddress}
                      onChange={(e) =>
                        setRegistrationAddress(e.target.value)
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
                      value={actualAddress}
                      onChange={(e) =>
                        setActualAddress(e.target.value)
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
                      value={legalNotes}
                      onChange={(e) =>
                        setLegalNotes(e.target.value)
                      }
                      className="w-full rounded-xl border px-3 py-1.5 text-xs"
                      rows={3}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Питомец (опционально) */}
            <div className="space-y-3">
              <h2 className="text-base font-semibold">
                Питомец (необязательно)
              </h2>
              <p className="text-[11px] text-gray-500">
                Можно сразу добавить первого питомца этого клиента. Поля ниже
                не обязательны, но помогут в дальнейшем.
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
                  placeholder="Например: Мурзик"
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
                    value={petSex}
                    onChange={(e) =>
                      setPetSex(
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
                    value={petBirthDate}
                    onChange={(e) =>
                      setPetBirthDate(e.target.value)
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
                    value={petWeight}
                    onChange={(e) =>
                      setPetWeight(e.target.value)
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
                  value={petChip}
                  onChange={(e) => setPetChip(e.target.value)}
                  className="w-full rounded-xl border px-3 py-1.5 text-xs"
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] text-gray-500">
                  Заметки
                </label>
                <textarea
                  value={petNotes}
                  onChange={(e) => setPetNotes(e.target.value)}
                  className="w-full rounded-xl border px-3 py-1.5 text-xs"
                  rows={2}
                  placeholder="Особенности, аллергии, поведение…"
                />
              </div>
            </div>

            {/* Кнопка */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-emerald-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
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
