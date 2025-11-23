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

  // Владелец
  const [ownerProfile, setOwnerProfile] = useState<DbOwnerProfile | null>(null);
  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [noMiddleName, setNoMiddleName] = useState(false);
  const [phone, setPhone] = useState("");
  const [telegram, setTelegram] = useState("");

  // Питомцы
  const [existingPets, setExistingPets] = useState<DbPet[]>([]);
  const [selectedPetId, setSelectedPetId] = useState<"new" | number>("new");
  const [petName, setPetName] = useState("");
  const [species, setSpecies] = useState("");

  // Проблема и время
  const [complaint, setComplaint] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  // Услуга и предпочтительный врач
  const [serviceCode, setServiceCode] = useState("");
  const [doctorCode, setDoctorCode] = useState<"any" | string>("any");

  // Галочки согласий
  const [agreePersonalData, setAgreePersonalData] = useState(false);
  const [agreeOffer, setAgreeOffer] = useState(false);

  if (!supabase) {
    return (
      <main className="bg-slate-50 min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <h1 className="text-xl font-semibold">Ошибка конфигурации</h31>
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
      const metaRole =
        (user.user_metadata?.role as AuthRole | undefined) ?? "user";
      setRole(metaRole === "staff" ? "staff" : "user");

      // 2. Пытаемся найти owner_profile по auth_id
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

        // Разобрать ФИО
        if (o.full_name) {
          const parts = o.full_name.trim().split(/\s+/);
          if (parts.length >= 1) setLastName(parts[0]);
          if (parts.length >= 2) setFirstName(parts[1]);
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

        // Контакты из extra_contacts
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
            // игнорируем если JSON кривой
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

      // 5. Услуга по умолчанию
      if (servicesPricing.length > 0) {
        setServiceCode(servicesPricing[0].code ?? "");
      }

      setLoading(false);
    };

    void init();
  }, [client]);

  // При выборе существующего питомца подставляем его данные
  useEffect(() => {
    if (selectedPetId === "new") return;
    const pet = existingPets.find((p) => p.id === selectedPetId);
    if (pet) {
      setPetName(pet.name);
      setSpecies(pet.species || "");
    }
  }, [selectedPetId, existingPets]);

  const buildFullName = () => {
    const parts = [lastName, firstName];
    if (!no…
