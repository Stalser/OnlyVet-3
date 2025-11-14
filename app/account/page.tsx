"use client";

import Link from "next/link";
import { useMemo } from "react";
import { appointments, currentUserId, type Appointment } from "../../lib/appointments";

export default function AccountPage() {
  // Отфильтрованные записи текущего пользователя
  const myAppointments = useMemo(
    () => appointments.filter((a) => a.userId === currentUserId),
    []
  );

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

  return (
    <main className="bg-slate-50 min-h-screen py-12">
      <div className="container space-y-8">
        {/* Заголовок */}
        <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold">
              Личный кабинет
            </h1>
            <p className="text-sm.text-gray-600.mt-1">
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

        {/* Профиль пользователя – пока заглушка */}
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
                <span className="text-xs text-gray-500">Телефон/Telegram: </span>
                <span className="font-medium">@username / +7 900 000-00-00</span>
              </div>
            </div>
            <p className="text-[11px] text-gray-400">
              В дальнейшем эти данные будут подставляться автоматически из вашей регистрации.
            </p>
          </div>

          {/* Питомцы */}
          <div className="rounded-2xl border border-gray-200 bg-white p-4 space-y-2 text-sm">
            <h2 className="font-semibold text-base">Ваши питомцы</h2>
            {pets.length === 0 && (
              <p className="text-xs text-gray-500">
                Пока нет записанных питомцев. После первой консультации они появятся здесь.
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
              У вас пока нет записей. Нажмите «Записаться на консультацию», чтобы создать первую.
            </p>
          )}

          {myAppointments.length > 0 && (
            <div className="overflow-x-auto text-xs">
              <table className="min-w-full">
                <thead>
                  <tr className="text-gray-500 border-b border-gray-100">
                    <th className="py-2 pr-3 text-left font-normal">Дата</th>
                    <th className="py-2 pr-3 text-left font-normal">Время</th>
                    <th className="py-2 pr-3 text-left font-normal">Питомец</th>
                    <th className="py-2 pr-3 text-left font-normal">Врач</th>
                    <th className="py-2 pr-3 text-left font-normal">Услуга</th>
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
      ? "text-gray-700.bg-gray-50"
      : "text-red-700 bg-red-50";

  const dateLabel = new Date(`${a.date}T${a.time}`).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });

  return (
    <tr className="border-b border-gray-50">
      <td className="py-2 pr-3">{dateLabel}</td>
      <td className="py-2 pr-3">{a.time}</td>
      <td className="py-2 pr-3">
        {a.petName} <span className="text-gray-500">({a.species})</span>
      </td>
      <td className="py-2 pr-3">{a.doctorName}</td>
      <td className="py-2 pr-3">{a.serviceName}</td>
      <td className="py-2">
        <span
          className={`inline-flex items-center rounded-full px-2.py-0.5 ${statusColor}`}
        >
          {a.status}
        </span>
      </td>
    </tr>
  );
}
