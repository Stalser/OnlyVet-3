"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../../../lib/supabaseClient";
import type { SupabaseClient } from "@supabase/supabase-js";

type AuthRole = "guest" | "user" | "staff";

type AppointmentStatus =
  | "запрошена"
  | "подтверждена"
  | "завершена"
  | "отменена";

type DbAppointmentDetail = {
  id: string;
  owner_id: number;
  pet_name: string;
  species: string | null;
  starts_at: string;
  status: AppointmentStatus;
  doctor_name: string | null;
  service_name: string | null;
  // TODO: если есть отдельные поля в БД (complaint, notes, etc.) — добавить сюда
};

type DocumentType = "conclusion" | "analysis" | "contract" | "other";

type DbAppointmentDocument = {
  id: string;
  title: string;
  type: DocumentType;
  created_at: string;
  summary: string | null;
  file_url: string | null;
};

export default function AppointmentDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [role, setRole] = useState<AuthRole>("guest");

  const [loading, setLoading] = useState(true);
  const [appointment, setAppointment] = useState<DbAppointmentDetail | null>(
    null
  );
  const [docs, setDocs] = useState<DbAppointmentDocument[]>([]);
  const [error, setError] = useState<string | null>(null);

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
    const load = async () => {
      setLoading(true);
      setError(null);

      // 1. Текущий пользователь
      const { data: userData, error: userErr } = await client.auth.getUser();
      if (userErr) {
        console.error(userErr);
        setError("Ошибка проверки авторизации");
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

      // 2. Находим owner_profile, чтобы знать, к кому принадлежат записи
      const { data: ownerProfile, error: ownerErr } = await client
        .from("owner_profiles")
        .select("id, auth_id")
        .eq("auth_id", user.id)
        .maybeSingle();

      if (ownerErr) {
        console.error(ownerErr);
        setError("Ошибка получения профиля владельца");
        setLoading(false);
        return;
      }

      if (!ownerProfile) {
        setError("Профиль владельца не найден");
        setLoading(false);
        return;
      }

      const ownerId = (ownerProfile as any).id; // если у тебя user_id — поменяй здесь и в eq ниже

      const appointmentId = params.id;

      // 3. Грузим сам приём и проверяем, что он принадлежит этому owner
      const { data: apptData, error: apptErr } = await client
        .from("appointments")
        .select(
          `
          id,
          owner_id,
          pet_name,
          species,
          starts_at,
          status,
          doctor_name,
          service_name
        `
        )
        .eq("id", appointmentId)
        .eq("owner_id", ownerId)
        .maybeSingle();

      if (apptErr) {
        console.error(apptErr);
        setError("Ошибка загрузки приёма");
        setLoading(false);
        return;
      }

      if (!apptData) {
        setError("Приём не найден или недоступен");
        setLoading(false);
        return;
      }

      setAppointment(apptData as DbAppointmentDetail);

      // 4. Документы этого приёма
      const { data: docsData, error: docsErr } = await client
        .from("appointment_documents")
        .select("id, title, type, created_at, summary, file_url")
        .eq("appointment_id", appointmentId)
        .order("created_at", { ascending: false });

      if (docsErr) {
        console.error(docsErr);
        setError("Ошибка загрузки документов приёма");
      } else {
        setDocs((docsData ?? []) as DbAppointmentDocument[]);
      }

      setLoading(false);
    };

    load();
  }, [client, params.id]);

  // Неавторизованный
  if (!loading && role === "guest") {
    return (
      <main className="bg-slate-50 min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <h1 className="text-xl font-semibold">Доступ ограничен</h1>
          <p className="text-sm text-gray-600">
            Чтобы просматривать информацию о приёмах, войдите в личный кабинет.
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

  const statusBadge = (status: AppointmentStatus) => {
    const base = "inline-flex items-center rounded-full px-2 py-0.5 text-[11px]";
    if (status === "подтверждена")
      return `${base} text-emerald-700 bg-emerald-50`;
    if (status === "запрошена")
      return `${base} text-amber-700 bg-amber-50`;
    if (status === "завершена")
      return `${base} text-gray-700 bg-gray-50`;
    return `${base} text-red-700 bg-red-50`;
  };

  const formatDateTime = (iso: string) => {
    const d = new Date(iso);
    const dateLabel = d.toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
    const timeLabel = d.toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return { dateLabel, timeLabel };
  };

  return (
    <main className="bg-slate-50 min-h-screen py-10">
      <div className="container max-w-3xl space-y-6">
        <button
          type="button"
          onClick={() => router.push("/account")}
          className="text-xs text-gray-600 hover:text-black underline underline-offset-2"
        >
          ← Назад в личный кабинет
        </button>

        {loading && (
          <p className="text-xs text-gray-500">Загружаем данные приёма…</p>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && appointment && (
          <>
            {/* Шапка приёма */}
            <section className="rounded-2xl border bg-white p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h1 className="text-lg font-semibold">
                    Приём для питомца {appointment.pet_name}
                  </h1>
                  <p className="text-xs text-gray-500">
                    ID: {appointment.id}
                  </p>
                </div>
                <div className="flex flex-col.items-end gap-1">
                  <span className={statusBadge(appointment.status)}>
                    {appointment.status}
                  </span>
                  <DateTimeLabel iso={appointment.starts_at} />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3 text-xs text-gray-700">
                <div>
                  <div className="text-gray-500">Питомец</div>
                  <div>
                    {appointment.pet_name}{" "}
                    <span className="text-gray-500">
                      ({appointment.species || "вид не указан"})
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-gray-500">Врач</div>
                  <div>{appointment.doctor_name || "Будет назначен"}</div>
                </div>
                <div>
                  <div className="text-gray-500">Услуга</div>
                  <div>{appointment.service_name || "Консультация онлайн"}</div>
                </div>
              </div>
            </section>

            {/* TODO: блок с жалобой / описанием */}
            <section className="rounded-2xl border bg-white p-4 space-y-2">
              <h2 className="font-semibold text-sm">Описание проблемы</h2>
              <p className="text-xs text-gray-500">
                Описание жалоб и анамнеза будет отображаться здесь, когда мы
                добавим соответствующее поле в базе данных (complaint / reason).
              </p>
            </section>

            {/* Документы */}
            <section className="rounded-2xl border bg-white p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-sm">Документы по приёму</h2>
                <span className="text-[11px] text-gray-500">
                  {docs.length > 0
                    ? `${docs.length} документ(ов)`
                    : "Документов пока нет"}
                </span>
              </div>

              {docs.length === 0 && (
                <p className="text-xs text-gray-500">
                  Документы по этому приёму ещё не добавлены.
                </p>
              )}

              {docs.length > 0 && (
                <ul className="space-y-2 text-xs">
                  {docs.map((d) => (
                    <li
                      key={d.id}
                      className="rounded-xl border px-3 py-2 bg-gray-50 flex justify-between items-start gap-3"
                    >
                      <div>
                        <div className="font-medium">{d.title}</div>
                        <div className="text-gray-500 text-[11px]">
                          <DocumentTypeLabel type={d.type} /> •{" "}
                          {new Date(d.created_at).toLocaleDateString("ru-RU", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "2-digit",
                          })}
                        </div>
                        {d.summary && (
                          <div className="mt-1 text-[11px] text-gray-600">
                            {d.summary}
                          </div>
                        )}
                      </div>

                      {d.file_url && (
                        <a
                          href={d.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-blue-600 underline underline-offset-2"
                        >
                          Открыть файл
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function DateTimeLabel({ iso }: { iso: string }) {
  const d = new Date(iso);
  const dateLabel = d.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
  const timeLabel = d.toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="text-[11px] text-gray-600 text-right">
      <div>{dateLabel}</div>
      <div>{timeLabel}</div>
    </div>
  );
}

function DocumentTypeLabel({ type }: { type: DocumentType }) {
  if (type === "conclusion") return <>Заключение</>;
  if (type === "analysis") return <>Анализы</>;
  if (type === "contract") return <>Договор</>;
  return <>Другое</>;
}
