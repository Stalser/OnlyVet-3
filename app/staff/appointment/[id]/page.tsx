"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { useEffect, useState } from "react";

import { appointments, type Appointment } from "../../../../lib/appointments";
import { mockMedicalDocs } from "../../../../lib/medicalDocs";

type PageProps = {
  params: { id: string };
};

export default function StaffAppointmentWorkspace({ params }: PageProps) {
  const appointment = appointments.find((a) => a.id === params.id);

  if (!appointment) {
    return notFound();
  }

  const docs = mockMedicalDocs.filter(
    (d) => d.appointmentId === appointment.id
  );

  return (
    <main className="bg-slate-50 min-h-screen py-12">
      <div className="container space-y-6">
        <div className="text-xs text-gray-500 flex.justify-between items-center">
          <Link href="/staff" className="hover:text-gray-800">
            ← Назад в кабинет сотрудника
          </Link>
          <span className="text-gray-400">
            Приём #{appointment.id}
          </span>
        </div>

        <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold">
              Консультация: {appointment.petName} ({appointment.species})
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {appointment.date} в {appointment.time} · {appointment.serviceName}
            </p>
          </div>
          <TimerBlock />
        </header>

        <div className="grid lg:grid-cols-3 gap-4 items-start">
          {/* Левая часть: пациент и клиент */}
          <section className="lg:col-span-2 space-y-4">
            {/* Информация о пациенте */}
            <div className="rounded-2xl border bg-white p-4 space-y-2 text-sm">
              <h2 className="font-semibold text-base">Пациент</h2>
              <div className="grid sm:grid-cols-2 gap-2 text-xs text-gray-700">
                <div>
                  <div className="text-gray-500 text-[11px]">Имя питомца</div>
                  <div className="font-medium">{appointment.petName}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-[11px]">
                    Вид животного
                  </div>
                  <div className="font-medium">{appointment.species}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-[11px]">Услуга</div>
                  <div className="font-medium">
                    {appointment.serviceName}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 text-[11px]">Статус</div>
                  <div className="font-medium">{appointment.status}</div>
                </div>
              </div>
            </div>

            {/* Информация о клиенте (пока заглушка, позже свяжем с профилем владельца) */}
            <div className="rounded-2xl border bg-white p-4 space-y-2 text-sm">
              <h2 className="font-semibold text-base">Клиент</h2>
              <div className="grid sm:grid-cols-2 gap-2 text-xs.text-gray-700">
                <div>
                  <div className="text-gray-500 text-[11px]">
                    Имя владельца
                  </div>
                  <div className="font-medium">
                    {/* позже сюда подставим реальные данные из профиля владельца */}
                    Иванова Анна (заглушка)
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 text-[11px]">
                    Контакт для связи
                  </div>
                  <div className="font-medium">
                    +7 900 000-00-00 / @username
                  </div>
                </div>
              </div>
            </div>

            {/* Документы по приёму (для врача) */}
            <div className="rounded-2xl border bg-white p-4 space-y-2 text-sm">
              <h2 className="font-semibold text-base">Документы пациента</h2>
              {docs.length === 0 && (
                <p className="text-xs text-gray-500">
                  Документы по приёму пока не загружены.
                </p>
              )}
              {docs.length > 0 && (
                <ul className="space-y-2 text-xs">
                  {docs.map((d) => (
                    <li
                      key={d.id}
                      className="border border-gray-100 rounded-xl px-3.py-2 bg-gray-50 flex justify-between"
                    >
                      <div>
                        <div className="font-medium">{d.title}</div>
                        <div className="text-gray-500 text-[11px]">
                          {d.type} •{" "}
                          {new Date(d.createdAt).toLocaleDateString("ru-RU")}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="text-[11px] text-blue-600 underline underline-offset-2">
                          Посмотреть
                        </button>
                        <button className="text-[11px] text-gray-700 underline underline-offset-2">
                          Скачать
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          {/* Правая часть: заметки врача */}
          <section className="space-y-4">
            <NotesBlock />
          </section>
        </div>
      </div>
    </main>
  );
}

/* ---------- Таймер консультации ---------- */

function TimerBlock() {
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  const toggle = () => setRunning((r) => !r);
  const reset = () => {
    setRunning(false);
    setSeconds(0);
  };

  const h = Math.floor(seconds / 3600)
    .toString()
    .padStart(2, "0");
  const m = Math.floor((seconds % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");

  return (
    <div className="rounded-2xl border bg-white px-4 py-3 text-xs flex flex-col items-stretch gap-2 min-w-[220px]">
      <div className="text-gray-500 text-[11px]">Время консультации</div>
      <div className="text-2xl font-mono text-gray-900">
        {h}:{m}:{s}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={toggle}
          className="flex-1 rounded-xl px-3.py-1.5 bg-black text-white text-[11px] font-medium hover:bg-gray-900"
        >
          {running ? "Пауза" : "Старт"}
        </button>
        <button
          type="button"
          onClick={reset}
          className="rounded-xl px-3 py-1.5 border border-gray-300 text-[11px] text-gray-700 hover:bg-gray-100"
        >
          Сброс
        </button>
      </div>
    </div>
  );
}

/* ---------- Блок заметок врача ---------- */

function NotesBlock() {
  const [notes, setNotes] = useState("");

  // Сейчас заметки живут только в памяти.
  // Позже можно сохранять в Supabase по appointmentId.
  const handleSave = () => {
    alert("Пока что заметки не сохраняются в базу, только UI 😅");
  };

  return (
    <div className="rounded-2xl border bg-white p-4 space-y-2 text-sm">
      <h2 className="font-semibold text-base">Заметки врача</h2>
      <p className="text-xs text-gray-500">
        Здесь можно фиксировать жалобы, осмотр, дифференциалы и план
        рекомендаций. Позже это можно будет сохранить в заключение.
      </p>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs min-h-[140px] outline-none focus:border-black focus:ring-1 focus:ring-black"
        placeholder="Запишите ключевые моменты консультации..."
      />
      <div className="flex.justify-end">
        <button
          type="button"
          onClick={handleSave}
          className="rounded-xl px-4 py-1.5 bg-black text-white text-[11px] font-medium hover:bg-gray-900"
        >
          Сохранить (пока заглушка)
        </button>
      </div>
    </div>
  );
}
