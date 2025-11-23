"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabaseClient";
import type { SupabaseClient } from "@supabase/supabase-js";
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

  // --- Владелец ---
  const [ownerProfile, setOwnerProfile] = useState<DbOwnerProfile | null>(null);
  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [noMiddleName, setNoMiddleName] = useState(false);
  const [phone, setPhone] = useState("");
  const [telegram, setTelegram] = useState("");

  // --- Питомцы ---
  const [existingPets, setExistingPets] = useState<DbPet[]>([]);
  const [selectedPetId, setSelectedPetId] = useState<"new" | number>("new");
  const [petName, setPetName] = useState("");
  const [species, setSpecies] = useState("");

  // --- Проблема / время ---
  const [complaint, setComplaint] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  // --- Услуга и врач ---
  const [serviceCode, setServiceCode] = useState("");
  const [doctorCode, setDoctorCode] = useState<"any" | string>("any");

  // --- Согласия ---
  const [agreePersonalData, setAgreePersonalData] = useState(false);
  const [agreeOffer, setAgreeOffer] = useState(false);

  // --- Защита TS: supabase может быть null ---
  const client = supabase;

  if (!client) {
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

  // ---------------------------------------------------------
  // INIT
  // ---------------------------------------------------------
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setError(null);

      if (!client) {
        setError("Supabase не сконфигурирован.");
        setLoading(false);
        return;
      }

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

      const metaRole =
        (user.user_metadata?.role as AuthRole | undefined) ?? "user";
      setRole(metaRole === "staff" ? "staff" : "user");

      // 2. owner_profile
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

        // --- разбор ФИО ---
        if (o.full_name) {
          const parts = o.full_name.trim().split(/\s+/);
          setLastName(parts[0] ?? "");
          setFirstName(parts[1] ?? "");
          if (parts.length >= 3) {
            setMiddleName(parts.slice(2).join(" "));
            setNoMiddleName(false);
          } else {
            setMiddleName("");
            setNoMiddleName(true);
          }
        } else {
          setNoMiddleName(true);
        }

        // --- контакты ---
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
              "";

            const tgCandidate =
              extra?.telegram ??
              extra?.tg ??
              extra?.telegram_username ??
              "";

            if (phoneCandidate && !phone) setPhone(String(phoneCandidate));
            if (tgCandidate && !telegram) setTelegram(String(tgCandidate));
          } catch {
            /* ignore */
          }
        }
      } else {
        setOwnerProfile(null);
        setNoMiddleName(true);
      }

      // 3. Питомцы
      if (ownerId !== null) {
        const { data: petsData, error: petsErr } = await client
          .from("pets")
          .select("id, name, species")
          .eq("owner_id", ownerId)
          .order("name");

        if (!petsErr) {
          setExistingPets((petsData ?? []) as DbPet[]);
        }
      }

      // 4. Дата и время по умолчанию
      const now = new Date();
      setDate(now.toISOString().slice(0, 10));

      const hh = String(now.getHours()).padStart(2, "0");
      const mm = String(now.getMinutes()).padStart(2, "0");
      setTime(`${hh}:${mm}`);

      // 5. Услуга по умолчанию
      if (servicesPricing.length > 0) {
        setServiceCode(servicesPricing[0].code ?? "");
      }

      setLoading(false);
    };

    void init();
  }, [client]);

  // ---------------------------------------------------------
  // ПОДСТАВЛЯЕМ ДАННЫЕ ПИТОМЦА
  // ---------------------------------------------------------
  useEffect(() => {
    if (selectedPetId === "new") return;
    const pet = existingPets.find((p) => p.id === selectedPetId);
    if (pet) {
      setPetName(pet.name);
      setSpecies(pet.species ?? "");
    }
  }, [selectedPetId, existingPets]);

  // ---------------------------------------------------------
  // UI
  // ---------------------------------------------------------
  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-gray-500">Загрузка…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen py-10 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <Link
          href={isLoggedIn ? "/account" : "/auth/login"}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Назад в личный кабинет
        </Link>

        <h1 className="text-2xl font-bold tracking-tight">
          Запись на онлайн-консультацию
        </h1>

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* ... остальная часть UI формы остаётся без изменений ... */}

      </div>
    </main>
  );
}
