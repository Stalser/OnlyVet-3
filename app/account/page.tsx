"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  appointments,
  currentUserId,
  type Appointment,
} from "../../lib/appointments";
import {
  medicalDocuments,
  type MedicalDocument,
  type DocumentType,
} from "../../lib/medicalDocs";

type DateFilter = "all" | "month" | "halfyear";

export default function AccountPage() {
  // Записи текущего пользователя
  const myAppointments = useMemo(
    () => appointments.filter((a) => a.userId === currentUserId),
    []
  );

  // Уникальные питомцы из записей
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

  // Документы текущего пользователя
  const myDocsAll = useMemo(
    () => medicalDocuments.filter((d) => d.userId === currentUserId),
    []
  );

  const [docPetFilter, setDocPetFilter] = useState<string>("all");
  const [docTypeFilter, setDocTypeFilter] = useState<DocumentType | "all">(
    "all"
  );
  const [docDateFilter, setDocDateFilter] = useState<DateFilter>("all");

  const filteredDocs = useMemo(() => {
    const now = new Date("2025-11-20T00:00:00"); // потом заменим на new Date()
    return myDocsAll.filter((d) => {
      // питомец
      if (docPetFilter !== "all" && d.petName !== docPetFilter) return false;
      // тип документа
      if (docTypeFilter !== "all" && d.type !== docTypeFilter) return false;
      // фильтр по дате
      if (docDateFilter !== "all") {
        const dDate = new Date(d.date + "T00:00:00");
        const diffDays = (now.getTime() - dDate.getTime()) / (1000 * 60 * 60 * 24);
        if (docDateFilter === "month" && diffDays > 31) return false;
        if (docDateFilter === "halfyear" && diffDays > 31 * 6) return false;
      }
      return true;
    });
  }, [myDocsAll, docPetFilter, docTypeFilter, docDateFilter]);

  const docPetsOptions = useMemo(() => {
    const set = new Set<string>();
    myDocsAll.forEach((d) => set.add(d.petName));
    return Array.from(set.values());
  }, [myDocsAll]);

  return (
    <main className="bg-slate-50 min-h-screen py-12">
      <div className="container space-y-8">
        {/* Шапка */}
        <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold">
              Личный кабинет
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Здесь будут ваши питомцы, записи на консультации и заключения.
            </p>
          </div>
          <Link
            href="/booking"
            className="rounded-xl px-4 py-2 bg-black text-white text-sm font-medium hover:bg-gray-900"
          >
            Записаться на консультацию
          </Link>
        </header>

        {/* Профиль + питомцы */}
        <section className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2 rounded-2xl border border-gray-200 bg-white p-4 space-y-2 text-sm">
            <h2 className="font-semibold text-base">Профиль</h2>
            <div className="text-gray-700">
              <div>
                <span className="text-xs text-gray-500">Имя: </span>
                <span className="font-medium">Иванова Анна Сергеевна</span>
              </div>
              <div>
                <span className="text-xs text-gray-500">Email: </span>
                <span className="font-medium">user@example.com</span>
              </div>
              <div>
                <span className="text-xs text-gray-500">
                  Телефон/Telegram:{" "}
                </span>
                <span className="font-medium">@username / +7 900 000-00-00</span>
              </div>
            </div>
            <p className="text-[11px] text-gray-400">
              В дальнейшем эти данные будут подставляться автоматически из вашей
              регистрации.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4 space-y-2 text-sm">
            <h2 className="font-semibold text-base">Ваши питомцы</h2>
            {pets.length === 0 && (
              <p className="text-xs text-gray-500">
                Пока нет записанных питомцев. После первой консультации они
                появятся здесь.
              </p>
            )}
            {pets.length > 0 && (
              <ul className="space-y-1 text-xs">
                {pets.map((p) => (
                  <li key={`${p.name}-${p.species}`}>
                    <span className="font-medium">{p.name}</span>{" "}
                    <span className="text-gray-500">({p.species})</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Мои записи */}
        <section className="rounded-2xl border border-gray-200 bg-white p-4 space-y-3 text-sm">
          <h2 className="font-semibold text-base">Мои записи</h2>

          {myAppointments.length === 0 && (
            <p className="text-xs text-gray-500">
              У вас пока нет записей. Нажмите «Записаться на консультацию», чтобы
              создать первую.
            </p>
          )}

          {myAppointments.length > 0 && (
            <div className="overflow-x-auto text-xs">
              <table className="min-w-full">
                <thead>
                  <tr className="text-gray-500 border-b border-gray-100">
                    <th className="py-2 pr-3 text-left font-normal">Дата</th>
                    <th className="py-2.pr-3 text-left font-normal">Время</th>
                    <th className="py-2 pr-3 text-left font-normal">Питомец</th>
                    <th className="py-2 pr-3 text-left font-normal">Врач</th>
                    <th className="py-2 pr-3 text-left font-normal">
                      Услуга
                    </th>
                    <th className="py-2 text-left font-normal">Статус</th>
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
        <section className="rounded-2xl border border-gray-200 bg-white p-4 space-y-3 text-sm">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <h2 className="font-semibold text-base">Документы</h2>
              <p className="text-xs text-gray-500 max-w-xl">
                Заключения, результаты анализов и договоры, привязанные к вашим
                консультациям. В дальнейшем здесь можно будет открывать файлы и
                скачивать их.
              </p>
            </div>
            <div className="text-[11px] text-gray-500">
              Показано: {filteredDocs.length} из {myDocsAll.length}
            </div>
          </div>

          {/* Фильтры */}
          <div className="flex flex-wrap gap-2 text-xs items-center">
            {/* Питомец */}
            <select
              className="rounded-xl border border-gray-200 px-3 py-1 bg-white outline-none"
              value={docPetFilter}
              onChange={(e) => setDocPetFilter(e.target.value)}
            >
              <option value="all">Все питомцы</option>
              {docPetsOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>

            {/* Тип документа */}
            <select
              className="rounded-xl border border-gray-200 px-3 py-1 bg-white outline-none"
              value={docTypeFilter}
              onChange={(e) => setDocTypeFilter(e.target.value as any)}
            >
              <option value="all">Все типы</option>
              <option value="заключение">Заключения</option>
              <option value="анализы">Анализы</option>
              <option value="договор">Договоры</option>
              <option value="другое">Другое</option>
            </select>

            {/* Период */}
            <select
              className="rounded-xl border border-gray-200 px-3 py-1 bg-white outline-none"
              value={docDateFilter}
              onChange={(e) => setDocDateFilter(e.target.value as DateFilter)}
            >
              <option value="all">За всё время</option>
              <option value="month">Последний месяц</option>
              <option value="halfyear">Последние 6 месяцев</option>
            </select>
          </div>

          {/* Таблица документов */}
          {filteredDocs.length === 0 && (
            <p className="text-xs text-gray-500 mt-1">
              Документов по выбранным фильтрам пока нет.
            </p>
          )}

          {filteredDocs.length > 0 && (
            <div className="overflow-x-auto text-xs mt-2">
              <table className="min-w-full">
                <thead>
                  <tr className="text-gray-500 border-b border-gray-100">
                    <th className="py-2 pr-3 text-left font-normal">Дата</th>
                    <th className="py-2 pr-3 text-left font-normal">
                      Питомец
                    </th>
                    <th className="py-2 pr-3 text-left font-normal">Тип</th>
                    <th className="py-2 pr-3 text-left font-normal">
                      Название
                    </th>
                    <th className="py-2 text-left font-normal">
                      Приём
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDocs.map((d) => (
                    <DocumentRow key={d.id} doc={d} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function AppointmentRow({ a }: { a: Appointment }) {
  const statusColor =
    a.status === "подтверждена"
      ? "text-emerald-700 bg-emerald-50"
      : a.status === "запрошена"
      ? "text-amber-700 bg-amber-50"
      : a.status === "завершена"
      ? "text-gray-700 bg-gray-50"
      : "text-red-700 bg-red-50";

  const dateLabel = new Date(`${a.date}T${a.time}`).toLocaleDateString(
    "ru-RU",
    {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    }
  );

  return (
    <tr className="border-b border-gray-50">
      <td className="py-2 pr-3">{dateLabel}</td>
      <td className="py-2 pr-3">{a.time}</td>
      <td className="py-2 pr-3">
        {a.petName}{" "}
        <span className="text-gray-500">({a.species})</span>
      </td>
      <td className="py-2 pr-3">{a.doctorName}</td>
      <td className="py-2 pr-3">{a.serviceName}</td>
      <td className="py-2">
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 ${statusColor}`}
        >
          {a.status}
        </span>
      </td>
    </tr>
  );
}

function DocumentRow({ doc }: { doc: MedicalDocument }) {
  const dateLabel = new Date(doc.date + "T00:00:00").toLocaleDateString(
    "ru-RU",
    {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    }
  );

  return (
    <tr className="border-b border-gray-50">
      <td className="py-2 pr-3">{dateLabel}</td>
      <td className="py-2 pr-3">
        {doc.petName}{" "}
        <span className="text-gray-500">({doc.species})</span>
      </td>
      <td className="py-2 pr-3">
        {doc.type === "заключение"
          ? "Заключение"
          : doc.type === "анализы"
          ? "Анализы"
          : doc.type === "договор"
          ? "Договор"
          : "Другое"}
      </td>
      <td className="py-2 pr-3">{doc.title}</td>
      <td className="py-2 text-gray-500">
        {doc.appointmentId ? `Приём ${doc.appointmentId}` : "Без привязки"}
      </td>
    </tr>
  );
}
