"use client";

import Link from "next/link";
import { useMemo } from "react";

import {
  appointments,
  currentUserId,
  type Appointment,
} from "../../lib/appointments";

import {
  mockMedicalDocs,
  type MedicalDocument,
} from "../../lib/medicalDocs";

export default function AccountPage() {
  // Записи текущего пользователя
  const myAppointments = useMemo(
    () => appointments.filter((a) => a.userId === currentUserId),
    []
  );

  // Питомцы
  const pets = useMemo(() => {
    const map = new Map<string, { name: string; species: string }>();
    myAppointments.forEach((a) => {
      const key = `${a.petName}-${a.species}`;
      if (!map.has(key)) {
        map.set(key, { name: a.petName, species: a.species });
      }
    });
    return Array.from(map.values());
  }, [myAppointments]);

  // Документы
  const myDocs = useMemo<MedicalDocument[]>(
    () => mockMedicalDocs,
    []
  );

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

        {/* Профиль и питомцы */}
        <section className="grid md:grid-cols-3 gap-4">
          {/* Профиль */}
          <div className="md:col-span-2 rounded-2xl border bg-white p-4 space-y-2">
            <h2 className="font-semibold text-base">Профиль</h2>
            <div className="text-sm">
              <div className="text-gray-600">
                <span className="text-xs text-gray-500">Имя: </span>
                Иванова Анна Сергеевна
              </div>
              <div className="text-gray-600">
                <span className="text-xs text-gray-500">Email: </span>
                user@example.com
              </div>
              <div className="text-gray-600">
                <span className="text-xs text-gray-500">
                  Телефон/Telegram:
                </span>{" "}
                @username / +7 900 000-00-00
              </div>
            </div>
            <p className="text-[11px] text-gray-400">
              Позже эти данные будут подставляться автоматически из вашей регистрации.
            </p>
          </div>

          {/* Питомцы */}
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
                  <li key={`${p.name}-${p.species}`}>
                    {p.name}{" "}
                    <span className="text-gray-500">({p.species})</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Мои записи */}
        <section className="rounded-2xl border bg-white p-4 space-y-3">
          <h2 className="font-semibold text-base">Мои записи</h2>

          {myAppointments.length === 0 && (
            <p className="text-xs text-gray-500">
              У вас пока нет записей. Нажмите «Записаться на консультацию», чтобы создать первую.
            </p>
          )}

          {myAppointments.length > 0 && (
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
                  {myAppointments.map((a) => (
                    <AppointmentRow key={a.id} a={a} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Документы */}
        <section className="rounded-2xl border bg-white p-4 space-y-3">
          <h2 className="font-semibold text-base">Документы</h2>

          {myDocs.length === 0 && (
            <p className="text-xs text-gray-500">Документов пока нет.</p>
          )}

          {myDocs.length > 0 && (
            <ul className="text-xs space-y-2">
              {myDocs.map((d) => (
                <DocumentRow key={d.id} doc={d} />
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}

/* ===== Строка записи (кликабельная) ===== */

function AppointmentRow({ a }: { a: Appointment }) {
  const statusColor =
    a.status === "подтверждена"
      ? "text-emerald-700 bg-emerald-50"
      : a.status === "запрошена"
      ? "text-amber-700 bg-amber-50"
      : a.status === "завершена"
      ? "text-gray-700 bg-gray-50"
      : "text-red-700 bg-red-50";

  return (
    <tr className="border-b border-gray-50 hover:bg-slate-50">
      <td className="py-2 pr-3">{a.date}</td>
      <td className="py-2 pr-3">{a.time}</td>
      <td className="py-2 pr-3">
        {a.petName} <span className="text-gray-500">({a.species})</span>
      </td>
      <td className="py-2 pr-3">{a.doctorName}</td>
      <td className="py-2 pr-3">{a.serviceName}</td>
      <td className="py-2 pr-3">
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 ${statusColor}`}
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

/* ===== Строка документа ===== */

function DocumentRow({ doc }: { doc: MedicalDocument }) {
  const dateLabel = new Date(doc.createdAt).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });

  return (
    <li className="rounded-xl border p-3 bg-gray-50 flex justify-between items-center">
      <div>
        <div className="font-medium">{doc.title}</div>
        <div className="text-gray-500 text-[11px]">
          {doc.petName} • {dateLabel}
        </div>
      </div>

      <Link
        href={`/account/appointment/${doc.appointmentId}`}
        className="text-[11px] text-blue-600 underline underline-offset-2"
      >
        Открыть приём
      </Link>
    </li>
  );
}
