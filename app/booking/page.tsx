"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabaseClient";
import type { SupabaseClient } from "@supabase/supabase-js";

// ⚠️ используем те же источники, что и в lib/clients.ts
import { servicesPricing } from "../../lib/pricing";
import { doctors } from "../../lib/data";

type AuthRole = "guest" | "user" | "staff";

type DbOwnerProfile = {
  user_id: number;
  full_name: string | null;
  auth_id: string | null;
  extra_contacts?: any;
};

type DbPet = {
  id: number;
  name: string;
  species: string | null;
};

export default function BookingPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState<AuthRole>("guest");

  // Владелец
  const [ownerProfile, setOwnerProfile] = useState<DbOwnerProfile | null>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  // Питомцы
  const [existingPets, setExistingPets] = useState<DbPet[]>([]);
  const [selectedPetId, setSelectedPetId] = useState<"new" | number>("new");
  const [petName, setPetName] = useState("");
  const [species, setSpecies] = useState("");

  // Проблема и время
  const [complaint, setComplaint] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  // Выбор услуги и врача
  const [serviceCode, setServiceCode] = useState("");
  const [doctorId, setDoctorId] = useState<string | "any">("any");

  // Галочки согласий
  const [agreePersonalData, setAgreePersonalData] = useState(false);
  const [agreeOffer, setAgreeOffer] = useState(false);

  if (!supabase) {
    return (
      <main className="bg-slate-50 min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <h1 className="text-xl font-semibold">Ошибка конфигурации</h1>
          <p className="text-sm text-gray-600">
            Supabase не сконфигурирован. Проверьте переменные окружения.
          </p>
        </div>
      </main>
    );
  }

  const client: SupabaseClient = supabase;

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setError(null);

      const { data: userData, error: userErr } = await client.auth.getUser();
      if (userErr) {
        console.error(userErr);
        setError("Ошибка проверки авторизации");
        setLoading(false);
        return;
      }

      const user = userData.user;
      if (!user) {
        setIsLoggedIn(false);
        setLoading(false);
        return;
      }

      setIsLoggedIn(true);
      const metaRole =
        (user.user_metadata?.role as AuthRole | undefined) ?? "user";
      setRole(metaRole === "staff" ? "staff" : "user");

      // owner_profiles по auth_id
      const { data: ownerRow, error: ownerErr } = await client
        .from("owner_profiles")
        .select("user_id, full_name, auth_id, extra_contacts")
        .eq("auth_id", user.id)
        .maybeSingle();

      let ownerId: number | null = null;

      if (ownerErr) {
        console.error(ownerErr);
        setError("Ошибка при поиске профиля владельца");
        setLoading(false);
        return;
      }

      if (ownerRow) {
        const o = ownerRow as DbOwnerProfile;
        setOwnerProfile(o);
        ownerId = o.user_id;
        if (o.full_name) setFullName(o.full_name);

        // 🔹 попробуем достать контакт из extra_contacts
        if (o.extra_contacts) {
          try {
            const extra =
              typeof o.extra_contacts === "string"
                ? JSON.parse(o.extra_contacts)
                : o.extra_contacts;
            const phoneCandidate =
              extra?.phone ??
              extra?.phone_main ??
              extra?.whatsapp ??
              extra?.telegram_phone ??
              extra?.telegram ??
              "";
            if (phoneCandidate && !phone) {
              setPhone(String(phoneCandidate));
            }
          } catch {
            // если extra_contacts в неожиданном формате — просто игнорируем
          }
        }
      } else {
        setOwnerProfile(null);
      }

      // Питомцы
      if (ownerId !== null) {
        const { data: petsData, error: petsErr } = await client
          .from("pets")
          .select("id, name, species")
          .eq("owner_id", ownerId)
          .order("name", { ascending: true });

        if (petsErr) {
          console.error(petsErr);
        } else {
          setExistingPets((petsData ?? []) as DbPet[]);
        }
      }

      // Дата/время по умолчанию
      const now = new Date();
      const isoDate = now.toISOString().slice(0, 10);
      const hh = String(now.getHours()).padStart(2, "0");
      const mm = String(now.getMinutes()).padStart(2, "0");

      setDate(isoDate);
      setTime(`${hh}:${mm}`);

      // Услуга по умолчанию — первая из списка, если есть
      if (servicesPricing.length > 0) {
        setServiceCode(servicesPricing[0].code ?? "");
      }

      setLoading(false);
    };

    void init();
  }, [client, phone]);

  // При выборе существующего питомца подставляем его кличку и вид
  useEffect(() => {
    if (selectedPetId === "new") return;
    const pet = existingPets.find((p) => p.id === selectedPetId);
    if (pet) {
      setPetName(pet.name);
      setSpecies(pet.species || "");
    }
  }, [selectedPetId, existingPets]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!isLoggedIn) {
      setError("Для записи на консультацию необходимо войти в личный кабинет.");
      return;
    }

    if (!fullName.trim()) {
      setError("Пожалуйста, укажите ФИО владельца.");
      return;
    }

    if (!phone.trim()) {
      setError("Пожалуйста, укажите телефон или Telegram.");
      return;
    }

    if (!petName.trim() || !species.trim()) {
      setError("Пожалуйста, укажите питомца: кличку и вид.");
      return;
    }

    if (!date || !time) {
      setError("Пожалуйста, укажите желаемые дату и время.");
      return;
    }

    if (!serviceCode.trim()) {
      setError("Пожалуйста, выберите услугу.");
      return;
    }

    if (!agreePersonalData || !agreeOffer) {
      setError(
        "Чтобы записаться, необходимо согласиться с условиями и обработкой персональных данных.",
      );
      return;
    }

    setSubmitting(true);

    try {
      const { data: userData, error: userErr } = await client.auth.getUser();
      if (userErr || !userData.user) {
        setError("Не удалось определить пользователя. Попробуйте войти заново.");
        setSubmitting(false);
        return;
      }
      const user = userData.user;

      // Ищем/создаём owner_profile
      let ownerId: number | null = null;

      if (ownerProfile) {
        ownerId = ownerProfile.user_id;

        if (ownerProfile.full_name !== fullName) {
          await client
            .from("owner_profiles")
            .update({ full_name: fullName })
            .eq("user_id", ownerProfile.user_id);
        }
      } else {
        const { data: inserted, error: insertErr } = await client
          .from("owner_profiles")
          .insert({
            full_name: fullName,
            auth_id: user.id,
            extra_contacts: { phone }, // лёгкая заготовка на будущее
          })
          .select("user_id, full_name, auth_id, extra_contacts")
          .single();

        if (insertErr || !inserted) {
          console.error(insertErr);
          setError("Не удалось создать профиль владельца");
          setSubmitting(false);
          return;
        }

        const o = inserted as DbOwnerProfile;
        setOwnerProfile(o);
        ownerId = o.user_id;
      }

      if (ownerId === null) {
        setError("Не удалось определить владельца.");
        setSubmitting(false);
        return;
      }

      const startsAt = new Date(`${date}T${time}:00`);
      const startsIso = startsAt.toISOString();

      // создаём appointment с услугой, врачом и жалобой
      const { error: apptErr } = await client.from("appointments").insert({
        owner_id: ownerId,
        pet_name: petName,
        species,
        starts_at: startsIso,
        status: "запрошена",
        complaint: complaint || null,
        service_code: serviceCode || null,
        doctor_id: doctorId === "any" ? null : doctorId,
      });

      if (apptErr) {
        console.error(apptErr);
        setError(
          "Не удалось создать запись на консультацию: " + apptErr.message,
        );
        setSubmitting(false);
        return;
      }

      setSuccess(
        "Заявка на консультацию отправлена. Мы свяжемся с вами для подтверждения времени.",
      );
      setComplaint("");
    } catch (err: any) {
      console.error(err);
      setError("Произошла ошибка при записи: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const isSubmitDisabled =
    submitting ||
    !isLoggedIn ||
    !fullName.trim() ||
    !phone.trim() ||
    !petName.trim() ||
    !species.trim() ||
    !date ||
    !time ||
    !serviceCode.trim() ||
    !agreePersonalData ||
    !agreeOffer;

  if (!loading && !isLoggedIn) {
    return (
      <main className="bg-slate-50 min-h-screen flex items-center justify-center py-10">
        <div className="text-center space-y-3 max-w-md">
          <h1 className="text-2xl font-semibold">Запись на консультацию</h1>
          <p className="text-sm text-gray-600">
            Чтобы записаться на онлайн-консультацию, войдите в личный кабинет.
          </p>
          <div className="flex justify-center gap-3 mt-2">
            <Link
              href="/auth/login"
              className="rounded-xl px-4 py-2 bg-black text-white text-sm font-medium hover:bg-gray-900"
            >
              Войти
            </Link>
            <Link
              href="/auth/register"
              className="rounded-xl px-4 py-2 border border-gray-300 text-sm font-medium hover:bg-gray-50"
            >
              Регистрация
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-slate-50 min-h-screen py-12">
      <div className="container max-w-2xl space-y-6">
        <div>
          <Link
            href="/account"
            className="text-xs text-gray-600 hover:text-black underline underline-offset-2"
          >
            ← Назад в личный кабинет
          </Link>
        </div>

        <header className="space-y-2">
          <h1 className="text-2xl font-semibold">Запись на онлайн-консультацию</h1>
          <p className="text-sm text-gray-600">
            Заполните данные о себе и питомце. Мы подберём свободного врача и
            подтвердим время консультации.
          </p>
        </header>

        {loading && (
          <p className="text-xs text-gray-500">Загружаем ваши данные…</p>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700 space-y-1">
            <p>{success}</p>
            <p>
              Вы можете следить за статусом записи в{" "}
              <Link
                href="/account"
                className="underline underline-offset-2 text-emerald-800"
              >
                личном кабинете
              </Link>
              .
            </p>
          </div>
        )}

        {!loading && (
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border bg-white p-4 space-y-4"
          >
            {/* Владелец */}
            <section className="space-y-2">
              <h2 className="font-semibold text.base">Владелец</h2>
              <div className="grid gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-gray-600">
                    ФИО владельца <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-xl border border-gray-200 px-3.py-2 text-sm outline-none focus:ring-1 focus:ring-black"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Например: Иванова Анна Сергеевна"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-gray-600">
                    Телефон или Telegram <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-black"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+7 900 000-00-00 или @username"
                  />
                </div>
              </div>
            </section>

            {/* Питомец */}
            <section className="space-y-2">
              <h2 className="font-semibold text-base">Питомец</h2>

              {existingPets.length > 0 && (
                <div className="space-y-1">
                  <label className="text-xs text-gray-600">
                    Выберите питомца или укажите нового
                  </label>
                  <select
                    className="w-full rounded-xl border border-gray-200 px-3.py-2 text-sm outline-none focus:ring-1 focus:ring-black"
                    value={selectedPetId === "new" ? "new" : String(selectedPetId)}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === "new") setSelectedPetId("new");
                      else setSelectedPetId(Number(v));
                    }}
                  >
                    <option value="new">Новый питомец</option>
                    {existingPets.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.species || "вид не указан"})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs text-gray-600">
                    Кличка <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-xl border border-gray-200 px-3.py-2 text-sm outline-none focus:ring-1 focus:ring-black"
                    value={petName}
                    onChange={(e) => setPetName(e.target.value)}
                    placeholder="Например: Барсик"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-gray-600">
                    Вид <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full.rounded-xl border border-gray-200 px-3.py-2 text-sm outline-none focus:ring-1 focus:ring-black"
                    value={species}
                    onChange={(e) => setSpecies(e.target.value)}
                    placeholder="Кот, собака, хорёк…"
                  />
                </div>
              </div>
            </section>

            {/* Врач и услуга */}
            <section className="space-y-2">
              <h2 className="font-semibold text-base">Врач и услуга</h2>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs text-gray-600">
                    Услуга <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full rounded-xl border border-gray-200 px-3.py-2 text-sm outline-none focus:ring-1 focus:ring-black"
                    value={serviceCode}
                    onChange={(e) => setServiceCode(e.target.value)}
                  >
                    <option value="">Выберите услугу</option>
                    {servicesPricing.map((s: any) => (
                      <option key={s.code} value={s.code}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-gray-600">
                    Предпочтительный врач
                  </label>
                  <select
                    className="w-full rounded-xl border border-gray-200 px-3.py-2 text-sm outline-none focus:ring-1 focus:ring-black"
                    value={doctorId}
                    onChange={(e) =>
                      setDoctorId(e.target.value as string | "any")
                    }
                  >
                    <option value="any">Любой врач</option>
                    {doctors.map((d: any) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <p className="text-[11px] text-gray-400">
                На этом этапе вы выбираете предпочтительную услугу и врача. Точное
                время и запись к конкретному специалисту подтвердит
                регистратор.
              </p>
            </section>

            {/* Проблема и время */}
            <section className="space-y-2">
              <h2 className="font-semibold text-base">Проблема и время</h2>
              <div className="space-y-1">
                <label className="text-xs text-gray-600">
                  Кратко опишите проблему
                </label>
                <textarea
                  className="w-full rounded-xl border border-gray-200 px-3.py-2 text-sm outline-none focus:ring-1 focus:ring-black min-h-[80px]"
                  value={complaint}
                  onChange={(e) => setComplaint(e.target.value)}
                  placeholder="Когда началось, какие симптомы, какие лекарства уже давали…"
                />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs text-gray-600">
                    Предпочтительная дата <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    className="w-full rounded-xl border border-gray-200 px-3.py-2 text-sm outline-none focus:ring-1 focus:ring-black"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-gray-600">
                    Предпочтительное время <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    className="w-full.rounded-xl border border-gray-200 px-3.py-2 text-sm outline-none focus:ring-1 focus:ring-black"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                  />
                </div>
              </div>
            </section>

            {/* Согласия */}
            <section className="space-y-2">
              <h2 className="font-semibold text-base">Согласия</h2>
              <div className="space-y-1 text-[11px] text-gray-600">
                <label className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={agreePersonalData}
                    onChange={(e) => setAgreePersonalData(e.target.checked)}
                  />
                  <span>
                    Я даю согласие на обработку моих персональных данных в целях
                    записи на консультацию, оказания ветеринарных услуг и
                    последующей связи со мной.{" "}
                    <Link
                      href="/docs/privacy"
                      target="_blank"
                      className="underline underline-offset-2"
                    >
                      Политика обработки персональных данных
                    </Link>
                    .
                  </span>
                </label>

                <label className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={agreeOffer}
                    onChange={(e) => setAgreeOffer(e.target.checked)}
                  />
                  <span>
                    Я ознакомился(лась) и соглашаюсь с условиями{" "}
                    <Link
                      href="/docs/offer"
                      target="_blank"
                      className="underline underline-offset-2"
                    >
                      договора-оферты на оказание онлайн-ветеринарных услуг
                    </Link>
                    . Записываясь на консультацию, я заключаю данный договор.
                  </span>
                </label>
              </div>

              <p className="text-[11px] text-gray-400">
                Поля, отмеченные <span className="text-red-500">*</span>,
                обязательны для заполнения. Без согласий кнопка «Записаться»
                будет недоступна.
              </p>
            </section>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isSubmitDisabled}
                className="rounded-xl px-4 py-2 bg-black text-white text-sm font-medium hover:bg-gray-900.disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? "Отправляем заявку..." : "Записаться"}
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
