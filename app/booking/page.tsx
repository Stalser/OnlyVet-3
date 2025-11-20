"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabaseClient";
import type { SupabaseClient } from "@supabase/supabase-js";

type AuthRole = "guest" | "user" | "staff";

type DbOwnerProfile = {
  user_id: number;
  full_name: string | null;
  auth_id: string | null;
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
  const [telegram, setTelegram] = useState("");
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Питомцы
  const [existingPets, setExistingPets] = useState<DbPet[]>([]);
  const [selectedPetId, setSelectedPetId] = useState<"new" | number>("new");
  const [petName, setPetName] = useState("");
  const [species, setSpecies] = useState("");

  // Проблема и время
  const [complaint, setComplaint] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  // Согласия
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

      // 1. Проверяем авторизацию
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
      setUserEmail(user.email ?? null);

      const metaRole =
        (user.user_metadata?.role as AuthRole | undefined) ?? "user";
      setRole(metaRole === "staff" ? "staff" : "user");

      // 2. owner_profiles по auth_id
      const { data: ownerRow, error: ownerErr } = await client
        .from("owner_profiles")
        .select("user_id, full_name, auth_id")
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
      } else {
        setOwnerProfile(null);
      }

      // 3. Питомцы этого владельца
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

      // 4. Дата/время по умолчанию
      const now = new Date();
      const isoDate = now.toISOString().slice(0, 10);
      const hh = String(now.getHours()).padStart(2, "0");
      const mm = String(now.getMinutes()).padStart(2, "0");

      setDate(isoDate);
      setTime(`${hh}:${mm}`);

      setLoading(false);
    };

    init();
  }, [client]);

  // При выборе существующего питомца — подставляем его данные
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
      setError("Пожалуйста, укажите номер телефона.");
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

    if (!agreePersonalData || !agreeOffer) {
      setError(
        "Чтобы записаться, необходимо дать согласие на обработку данных и принять условия договора."
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

      // 1. Ищем/создаём owner_profile (без телефона/телеграма пока)
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
          })
          .select("user_id, full_name, auth_id")
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

      // 2. Дата/время
      const startsAt = new Date(`${date}T${time}:00`);
      const startsIso = startsAt.toISOString();

      // 3. Создаём appointment
      const { error: apptErr } = await client.from("appointments").insert({
        owner_id: ownerId,
        pet_name: petName,
        species,
        starts_at: startsIso,
        status: "запрошена",
        // TODO: complaint, телефон, Telegram, услуга, врач — в следующих итерациях добавим в схему
      });

      if (apptErr) {
        console.error(apptErr);
        setError(
          "Не удалось создать запись на консультацию: " + apptErr.message
        );
        setSubmitting(false);
        return;
      }

      setSuccess(
        "Заявка на консультацию отправлена. Мы свяжемся с вами для подтверждения времени."
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
    !agreePersonalData ||
    !agreeOffer;

  // Неавторизованный
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
        {/* Назад */}
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
          <div className="rounded-xl border.border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700 space-y-1">
            <p>{success}</p>
            <p>
              Вы можете следить за статусом записи в{" "}
              <Link
                href="/account"
                className="underline underline-offset-2.text-emerald-800"
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
            <section className="space-y-3">
              <h2 className="font-semibold text-base">Владелец</h2>
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs text-gray-600">
                    ФИО владельца <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-black"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Например: Иванова Анна Сергеевна"
                  />
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-1">
                    <label className mistaken */
