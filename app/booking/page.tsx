"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabaseClient";
import type { SupabaseClient } from "@supabase/supabase-js";

type DbOwnerProfile = {
  id: number;            // или user_id, если так в БД
  full_name: string | null;
  phone: string | null;
  auth_id?: string | null;
};

export default function BookingPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [petName, setPetName] = useState("");
  const [species, setSpecies] = useState("");
  const [complaint, setComplaint] = useState("");
  const [date, setDate] = useState("");   // YYYY-MM-DD
  const [time, setTime] = useState("");   // HH:MM

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Если supabase вообще не настроен
  if (!supabase) {
    return (
      <main className="bg-slate-50 min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <h1 className="text-xl font-semibold">Ошибка конфигурации</h1>
          <p className="text-sm text-gray-600">
            Supabase не сконфигурирован. Проверьте переменные окружения
            <code className="mx-1">NEXT_PUBLIC_SUPABASE_URL</code> и
            <code className="mx-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>.
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

      // 2. Пытаемся найти owner_profile, чтобы предзаполнить данные
      const { data: ownerProfile, error: ownerErr } = await client
        .from("owner_profiles")
        .select("id, full_name, phone, auth_id")
        .eq("auth_id", user.id)
        .maybeSingle();

      if (ownerErr) {
        console.error(ownerErr);
        // Не критично, просто не будет предзаполнения
      } else if (ownerProfile) {
        const o = ownerProfile as DbOwnerProfile;
        if (o.full_name) setFullName(o.full_name);
        if (o.phone) setPhone(o.phone);
      }

      // дефолт — сегодня + ближайшие полчаса
      const now = new Date();
      const isoDate = now.toISOString().slice(0, 10); // YYYY-MM-DD
      const hh = String(now.getHours()).padStart(2, "0");
      const mm = String(now.getMinutes()).padStart(2, "0");

      setDate(isoDate);
      setTime(`${hh}:${mm}`);

      setLoading(false);
    };

    init();
  }, [client]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!isLoggedIn) {
      setError("Для записи на консультацию необходимо войти в личный кабинет.");
      return;
    }

    if (!fullName.trim() || !phone.trim() || !petName.trim() || !species.trim()) {
      setError("Пожалуйста, заполните данные владельца и питомца.");
      return;
    }

    if (!date || !time) {
      setError("Пожалуйста, укажите желаемую дату и время.");
      return;
    }

    setSubmitting(true);

    try {
      // 1. Ещё раз получаем пользователя для надёжности
      const { data: userData, error: userErr } = await client.auth.getUser();
      if (userErr || !userData.user) {
        setError("Не удалось определить пользователя. Попробуйте войти заново.");
        setSubmitting(false);
        return;
      }
      const user = userData.user;

      // 2. Ищем или создаём owner_profile
      const { data: existingOwner, error: ownerErr } = await client
        .from("owner_profiles")
        .select("id, full_name, phone, auth_id")
        .eq("auth_id", user.id)
        .maybeSingle();

      let ownerId: number;

      if (ownerErr) {
        console.error(ownerErr);
        setError("Ошибка при поиске профиля владельца");
        setSubmitting(false);
        return;
      }

      if (!existingOwner) {
        // Создаём новую карточку владельца
        const { data: inserted, error: insertErr } = await client
          .from("owner_profiles")
          .insert({
            full_name: fullName,
            phone,
            auth_id: user.id,
          })
          .select("id")
          .single();

        if (insertErr || !inserted) {
          console.error(insertErr);
          setError("Не удалось создать профиль владельца");
          setSubmitting(false);
          return;
        }

        ownerId = (inserted as any).id;
      } else {
        ownerId = (existingOwner as any).id;
        // при желании можно обновить ФИО/телефон, если они изменились
      }

      // 3. Формируем дату/время
      const startsAt = new Date(`${date}T${time}:00`);
      const startsIso = startsAt.toISOString();

      // 4. Создаём запись (appointment)
      const { error: apptErr } = await client.from("appointments").insert({
        owner_id: ownerId,
        user_id: user.id,
        pet_name: petName,
        species,
        starts_at: startsIso,
        status: "запрошена",
        // complaint / description и т.п. можно будет добавить, когда определим точные поля
      });

      if (apptErr) {
        console.error(apptErr);
        setError("Не удалось создать запись на консультацию");
        setSubmitting(false);
        return;
      }

      setSuccess("Заявка на консультацию отправлена. Мы свяжемся с вами для подтверждения времени.");
      // Можно почистить только часть полей
      setComplaint("");
    } catch (err) {
      console.error(err);
      setError("Произошла непредвиденная ошибка при записи.");
    } finally {
      setSubmitting(false);
    }
  };

  // Если пользователь не залогинен
  if (!loading && !isLoggedIn) {
    return (
      <main className="bg-slate-50 min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3 max-w-md">
          <h1 className="text-2xl font-semibold">Запись на консультацию</h1>
          <p className="text-sm text-gray-600">
            Чтобы записаться на онлайн-консультацию, войдите в личный кабинет.
            Так мы сможем сохранить вашу историю, питомцев и документы.
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
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold">Запись на онлайн-консультацию</h1>
          <p className="text-sm text-gray-600">
            Заполните данные о себе и питомце. Мы подберём свободного врача и подтвердим время консультации.
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
            {/* Блок владельца */}
            <section className="space-y-2">
              <h2 className="font-semibold text-base">Владелец</h2>
              <div className="grid gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-gray-600">
                    ФИО владельца
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-black"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Например: Иванова Анна Сергеевна"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-gray-600">
                    Телефон или Telegram
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

            {/* Блок питомца */}
            <section className="space-y-2">
              <h2 className="font-semibold text-base">Питомец</h2>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs text-gray-600">Кличка</label>
                  <input
                    type="text"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-black"
                    value={petName}
                    onChange={(e) => setPetName(e.target.value)}
                    placeholder="Например: Барсик"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-gray-600">Вид</label>
                  <input
                    type="text"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-black"
                    value={species}
                    onChange={(e) => setSpecies(e.target.value)}
                    placeholder="Кот, собака, хорёк…"
                  />
                </div>
              </div>
            </section>

            {/* Проблема и время */}
            <section className="space-y-2">
              <h2 className="font-semibold text-base">Проблема и время</h2>
              <div className="space-y-1">
                <label className="text-xs text-gray-600">
                  Кратко опишите проблему
                </label>
                <textarea
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-black min-h-[80px]"
                  value={complaint}
                  onChange={(e) => setComplaint(e.target.value)}
                  placeholder="Когда началось, какие симптомы, какие лекарства уже давали…"
                />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs text-gray-600">
                    Предпочтительная дата
                  </label>
                  <input
                    type="date"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-black"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-gray-600">
                    Предпочтительное время
                  </label>
                  <input
                    type="time"
                    className="w-full rounded-xl.border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-black"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                  />
                </div>
              </div>
            </section>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-xl px-4 py-2 bg-black text-white text-sm font-medium hover:bg-gray-900 disabled:opacity-60 disabled:cursor-not-allowed"
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
