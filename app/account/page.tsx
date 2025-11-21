"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import type { SupabaseClient } from "@supabase/supabase-js";

// подключаем такие же справочники, как в регистратуре
import { doctors } from "../../lib/data";
import { servicesPricing } from "../../lib/pricing";

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

type AppointmentStatus =
  | "запрошена"
  | "подтверждена"
  | "завершена"
  | "отменена";

type DbAppointment = {
  id: string;
  starts_at: string;
  pet_name: string;
  species: string | null;
  status: AppointmentStatus;
  service_code: string | null;
  doctor_id: string | null;
};

type DocumentType = "conclusion" | "analysis" | "contract" | "other";

type DbDocument = {
  id: string;
  title: string;
  type: DocumentType;
  created_at: string;
  appointment_id: string | null;
  appointments?: {
    owner_id: number;
    pet_name: string;
  }[];
};

export default function AccountPage() {
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<AuthRole>("guest");

  const [owner, setOwner] = useState<DbOwnerProfile | null>(null);
  const [pets, setPets] = useState<DbPet[]>([]);
  const [appointments, setAppointments] = useState<DbAppointment[]>([]);
  const [docs, setDocs] = useState<DbDocument[]>([]);
  const [error, setError] = useState<string | null>(null);

  // фильтры
  const [apptPetFilter, setApptPetFilter] = useState<string>("all");
  const [apptStatusFilter, setApptStatusFilter] =
    useState<AppointmentStatus | "all">("all");

  const [docPetFilter, setDocPetFilter] = useState<string>("all");
  const [docTypeFilter, setDocTypeFilter] =
    useState<DocumentType | "all">("all");

  useEffect(() => {
    if (!supabase) {
      setError("Supabase не сконфигурирован (нет env-переменных).");
      setLoading(false);
      return;
    }

    const client: SupabaseClient = supabase;

    const load = async () => {
      setLoading(true);
      setError(null);

      // 1. Текущий пользователь
      const { data: userData, error: userErr } = await.client.auth.getUser();
      if (userErr) {
        console.error(userErr);
        setError("Ошибка получения пользователя");
        setLoading(false);
        return;
      }

      const user = userData.user;
      if (!user) {
        setRole("guest");
        setLoading(false);
        return;
      }

      const metaRole =
        (user.user_metadata?.role as AuthRole | undefined) ?? "user";
      setRole(metaRole === "staff" ? "staff" : "user");

      // 2. owner_profile по auth_id
      const { data: ownerProfile, error: ownerErr } = await client
        .from("owner_profiles")
        .select("user_id, full_name, auth_id")
        .eq("auth_id", user.id)
        .maybeSingle();

      if (ownerErr) {
        console.error(ownerErr);
        setError("Ошибка получения профиля владельца");
        setLoading(false);
        return;
      }

      if (!ownerProfile) {
        setOwner(null);
        setPets([]);
        setAppointments([]);
        setDocs([]);
        setLoading(false);
        return;
      }

      const ownerRow = ownerProfile as DbOwnerProfile;
      setOwner(ownerRow);
      const ownerId = ownerRow.user_id;

      // 3. Питомцы
      const { data: petsData, error: petsErr } = await client
        .from("pets")
        .select("id, name, species")
        .eq("owner_id", ownerId)
        .order("name", { ascending: true });

      if (petsErr) {
        console.error(petsErr);
        setError("Ошибка загрузки питомцев");
      } else {
        setPets((petsData ?? []) as DbPet[]);
      }

      // 4. Записи — расширяем select полями service_code и doctor_id
      const { data: apptsData, error: apptsErr } = await client
        .from("appointments")
        .select(
          `
          id,
          starts_at,
          pet_name,
          species,
          status,
          service_code,
          doctor_id
        `
        )
        .eq("owner_id", ownerId)
        .order("starts_at", { ascending: false });

      if (apptsErr) {
        console.error(apptsErr);
        setError("Ошибка загрузки записей");
      } else {
        setAppointments((apptsData ?? []) as DbAppointment[]);
      }

      // 5. Документы по приёмам этого владельца
      const { data: docsData, error: docsErr } = await client
        .from("appointment_documents")
        .select(
          `
          id,
          title,
          type,
          created_at,
          appointment_id,
          appointments!inner (
            owner_id,
            pet_name
          )
        `
        )
        .eq("appointments.owner_id", ownerId)
        .order("created_at", { ascending: false });

      if (docsErr) {
        console.error(docsErr);
        setError("Ошибка загрузки документов");
      } else {
        setDocs(((docsData ?? []) as unknown) as DbDocument[]);
      }

      setLoading(false);
    };

    load();
  }, []);

  // производные

  const appointmentPets = useMemo(
    () =>
      Array.from(new Set(appointments.map((a) => a.pet_name))).filter(Boolean),
    [appointments]
  );

  const filteredAppointments = useMemo(
    () =>
      appointments.filter((a) => {
        if (apptPetFilter !== "all" && a.pet_name !== apptPetFilter)
          return false;
        if (apptStatusFilter !== "all" && a.status !== apptStatusFilter)
          return false;
        return true;
      }),
    [appointments, apptPetFilter, apptStatusFilter]
  );

  const docPets = useMemo(
    () =>
      Array.from(
        new Set(
          docs
            .map((d) => d.appointments?.[0]?.pet_name)
            .filter((x): x is string => Boolean(x))
        )
      ),
    [docs]
  );

  const filteredDocs = useMemo(
    () =>
      docs.filter((d) => {
        const petName = d.appointments?.[0]?.pet_name;
        if (docPetFilter !== "all" && petName !== docPetFilter) return false;
        if (docTypeFilter !== "all" && d.type !== docTypeFilter) return false;
        return true;
      }),
    [docs, docPetFilter, docTypeFilter]
  );

  // ===== UI =====

  if (!loading && role === "guest") {
    return (
      <main className="bg-slate-50 min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <h1 className="text-xl font-semibold">
            Личный кабинет доступен только авторизованным пользователям
          </h1>
          <p className="text-sm text-gray-600">
            Пожалуйста, войдите или зарегистрируйтесь, чтобы увидеть свои
            записи и документы.
          </p>
          <Link
            href="/auth/login"
            className="inline-block mt-2 rounded-xl px-4 py-2 bg-black text-white text-sm font-medium hover:bg-gray-900"
          >
            Войти
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-slate-50 min-h-screen py-12">
      <div className="container space-y-10">
        {/* Заголовок */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold">Личный кабинет</h1>
            <p className="text-gray-600 text-sm mt-1">
              Ваши питомцы, записи, документы и история консультаций.
            </p>
          </div>
          <Link
            href="/booking"
            className="rounded-xl px-4 py-2 bg-black text-white text-sm font-medium hover:bg-gray-900"
          >
            Записаться на консультацию
          </Link>
        </header>

        {loading && (
          <p className="text-xs text-gray-500">Загружаем ваши данные…</p>
        )}
        {error && (
          <p className="text-xs text-red-600">
            {error}
          </p>
        )}

        {/* Профиль и питомцы */}
        <section className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2 rounded-2xl.border bg-white p-4 space-y-2">
            <h2 className="font-semibold text-base">Профиль</h2>

            {owner ? (
              <div className="text-sm">
                <div className="text-gray-600">
                  <span className="text-xs.text-gray-500">Имя: </span>
                  {owner.full_name || "—"}
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-600">
                Профиль ещё не заполнен. После первой консультации мы создадим
                вашу карточку автоматически.
              </p>
            )}

            <p className="text-[11px] text-gray-400">
              Позже эти данные будут подставляться автоматически из вашей
              регистрации и обращения в клинику.
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-4 space-y-2">
            <h2 className="font-semibold text-base">Ваши питомцы</h2>
            {pets.length === 0 && (
              <p className="text-xs text-gray-500">
                После первой консультации питомцы появятся здесь.
              </p>
            )}
            {pets.length > 0 && (
              <ul className="text-xs space-y-1">
                {pets.map((p) => (
                  <li key={p.id}>
                    {p.name}{" "}
                    <span className="text-gray-500">
                      ({p.species || "вид не указан"})
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Мои записи */}
        <section className="rounded-2xl border bg-white p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h2 className="font-semibold text-base">Мои записи</h2>

            <div className="flex flex-wrap gap-2 text-xs">
              <select
                className="rounded-xl border border-gray-200 px-3 py-1 bg-white outline-none"
                value={apptPetFilter}
                onChange={(e) => setApptPetFilter(e.target.value)}
              >
                <option value="all">Все питомцы</option>
                {appointmentPets.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>

              <select
                className="rounded-xl border border-gray-200 px-3 py-1 bg-white outline-none"
                value={apptStatusFilter}
                onChange={(e) =>
                  setApptStatusFilter(
                    e.target.value as AppointmentStatus | "all"
                  )
                }
              >
                <option value="all">Все статусы</option>
                <option value="запрошена">Запрошена</option>
                <option value="подтверждена">Подтверждена</option>
                <option value="завершена">Завершена</option>
                <option value="отменена">Отменена</option>
              </select>
            </div>
          </div>

          {filteredAppointments.length === 0 && (
            <p className="text-xs text-gray-500">
              Нет записей по выбранным фильтрам.
            </p>
          )}

          {filteredAppointments.length > 0 && (
            <div className="overflow-x-auto text-xs">
              <table className="min-w-full">
                <thead>
                  <tr className="text-gray-500 border-b">
                    <th className="py-2 pr-3 text-left font-normal">Дата</th>
                    <th className="py-2 pr-3 text-left font-normal">Время</th>
                    <th className="py-2 pr-3 text-left font-normal">Питомец</th>
                    <th className="py-2 pr-3 text-left font-normal">Врач</th>
                    <th className="py-2 pr-3 text-left font-normal">Услуга</th>
                    <th className="py-2 pr-3 text-left font-normal">Статус</th>
                    <th className="py-2 text-left font-normal" />
                  </tr>
                </thead>
                <tbody>
                  {filteredAppointments.map((a) => (
                    <AppointmentRow key={a.id} a={a} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Документы */}
        <section className="rounded-2xl border bg-white p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h2 className="font-semibold text-base">Документы</h2>
            <div className="flex flex-wrap gap-2 text-xs">
              <select
                className="rounded-xl border.border-gray-200 px-3 py-1 bg-white outline-none"
                value={docPetFilter}
                onChange={(e) => setDocPetFilter(e.target.value)}
              >
                <option value="all">Все питомцы</option>
                {docPets.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>

              <select
                className="rounded-xl border border-gray-200 px-3.py-1 bg-white outline-none"
                value={docTypeFilter}
                onChange={(e) =>
                  setDocTypeFilter(e.target.value as DocumentType | "all")
                }
              >
                <option value="all">Все типы</option>
                <option value="conclusion">Заключения</option>
                <option value="analysis">Анализы</option>
                <option value="contract">Договоры</option>
                <option value="other">Другое</option>
              </select>
            </div>
          </div>

          {filteredDocs.length === 0 && (
            <p className="text-xs text-gray-500">
              Документов по выбранным фильтрам пока нет.
            </p>
          )}

          {filteredDocs.length > 0 && (
            <ul className="text-xs space-y-2">
              {filteredDocs.map((d) => (
                <DocumentRow key={d.id} doc={d} />
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}

function AppointmentRow({ a }: { a: DbAppointment }) {
  // статус
  const statusColor =
    a.status === "подтверждена"
      ? "text-emerald-700 bg-emerald-50"
      : a.status === "запрошена"
      ? "text-amber-700 bg-amber-50"
      : a.status === "завершена"
      ? "text-gray-700 bg-gray-50"
      : "text-red-700 bg-red-50";

  // дата/время
  const date = new Date(a.starts_at);
  const dateLabel = date.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
  const timeLabel = date.toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // врач (по doctor_id)
  const doctor =
    a.doctor_id != null
      ? doctors.find((d: any) => d.id === a.doctor_id)
      : null;
  const doctorName = doctor?.name ?? "—";

  // услуга (по service_code)
  const service =
    a.service_code != null
      ? servicesPricing.find((s: any) => s.code === a.service_code)
      : null;
  const serviceName = service?.name ?? "—";

  return (
    <tr className="border-b border-gray-50 hover:bg-slate-50">
      <td className="py-2 pr-3">{dateLabel}</td>
      <td className="py-2 pr-3">{timeLabel}</td>
      <td className="py-2 pr-3">
        {a.pet_name}{" "}
        <span className="text-gray-500">
          ({a.species || "вид не указан"})
        </span>
      </td>
      <td className="py-2 pr-3">{doctorName}</td>
      <td className="py-2 pr-3">{serviceName}</td>
      <td className="py-2 pr-3">
        <span
          className={`inline-flex items-center rounded-full px-2.py-0.5 ${statusColor}`}
        >
          {a.status}
        </span>
      </td>
      <td className="py-2 pr-3">
        <Link
          href={`/account/appointment/${a.id}`}
          className="text-[11px] text-blue-600 underline underline-offset-2"
        >
          Подробнее
        </Link>
      </td>
    </tr>
  );
}

function DocumentRow({ doc }: { doc: DbDocument }) {
  const dateLabel = new Date(doc.created_at).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });

  const petName =
    doc.appointments && doc.appointments.length > 0
      ? doc.appointments[0].pet_name
      : "Питомец не указан";

  return (
    <li className="rounded-xl border p-3 bg-gray-50 flex.justify-between items-center">
      <div>
        <div className="font-medium">{doc.title}</div>
        <div className="text-gray-500 text-[11px]">
          {petName} • {dateLabel}
        </div>
      </div>

      <Link
        href={`/account/appointment/${doc.appointment_id}`}
        className="text-[11px] text-blue-600 underline underline-offset-2"
      >
        Открыть приём
      </Link>
    </li>
  );
}
