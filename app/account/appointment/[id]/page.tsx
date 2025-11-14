"use client";

import Link from "next/link";
import { notFound } from "next/navigation";

import { appointments, type Appointment } from "../../../../lib/appointments";
import { mockMedicalDocs, type MedicalDocument } from "../../../../lib/medicalDocs";
import { doctors } from "../../../../lib/data";

type PageProps = {
  params: { id: string };
};

export default function AppointmentDetailsPage({ params }: PageProps) {
  const appointment = appointments.find((a) => a.id === params.id);

  if (!appointment) {
    return notFound();
  }

  const docs = mockMedicalDocs.filter(
    (d) => d.appointmentId === appointment.id
  );

  const doctor = doctors.find((d) => d.id === appointment.doctorId);

  const dateLabel = new Date(
    `${appointment.date}T${appointment.time}`
  ).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  // повторная запись (по умолчанию — повторная консультация OC2)
  const repeatHref = `/booking?doctor=${appointment.doctorId}&service=OC2&pet=${encodeURIComponent(
    appointment.petName
  )}&species=${encodeURIComponent(appointment.species)}`;

  return (
    <main className="bg-slate-50 min-h-screen py-12">
      <div className="container space-y-6">
        {/* Навигация назад */}
        <div className="text-xs text-gray-500">
          <Link href="/account" className="hover:text-gray-800">
            ← Назад в личный кабинет
          </Link>
        </div>

        {/* Заголовок */}
        <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold">
              Приём от {dateLabel}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Питомец: {appointment.petName} ({appointment.species})
            </p>
          </div>
          <Link
            href={repeatHref}
            className="rounded-xl px-4 py-2 bg-black text-white text-sm font-medium hover:bg-gray-900"
          >
            Записаться повторно
          </Link>
        </header>

        {/* Информация о приёме */}
        <section className="rounded-2xl border border-gray-200 bg-white p-4 space-y-2 text-sm">
          <h2 className="font-semibold text-base">Информация о приёме</h2>
          <div className="grid sm:grid-cols-2 gap-2 text-gray-700 text-xs sm:text-sm">
            <div>
              <span className="text-gray-500 text-xs">Дата и время: </span>
              <div className="font-medium">{dateLabel}</div>
            </div>
            <div>
              <span className="text-gray-500.text-xs">Услуга: </span>
              <div className="font-medium">{appointment.serviceName}</div>
            </div>
            <div>
              <span className="text-gray-500.text-xs">Статус: </span>
              <div className="font-medium">{appointment.status}</div>
            </div>
            <div>
              <span className="text-gray-500.text-xs">Питомец: </span>
              <div className="font-medium">
                {appointment.petName} ({appointment.species})
              </div>
            </div>
          </div>
        </section>

        {/* Врач */}
        <section className="rounded-2xl border border-gray-200 bg-white p-4 space-y-2 text-sm">
          <h2 className="font-semibold text-base">Врач</h2>

          {doctor ? (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs sm:text-sm">
              <div>
                <div className="font-medium">{doctor.name}</div>
                <div className="text-gray-500">{doctor.speciality}</div>
              </div>
              <div className="flex gap-3">
                <Link
                  href={`/doctors/${doctor.id}`}
                  className="text-xs text-blue-600 underline underline-offset-2"
                >
                  Профиль врача
                </Link>
                <Link
                  href={repeatHref}
                  className="rounded-xl px-3 py-1.5 bg-black text-white text-xs font-medium hover:bg-gray-900"
                >
                  Записаться повторно
                </Link>
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-500">
              Информация о враче пока недоступна.
            </p>
          )}
        </section>

        {/* Документы по приёму */}
        <section className="rounded-2xl border border-gray-200 bg-white p-4 space-y-3 text-sm">
          <h2 className="font-semibold text-base">Документы по приёму</h2>
          {docs.length === 0 && (
            <p className="text-xs text-gray-500">
              Пока нет загруженных документов. Позже здесь будут заключения, анализы и другие файлы.
            </p>
          )}

          {docs.length > 0 && (
            <div className="space-y-2 text-xs">
              {docs.map((d) => (
                <DocumentBlock key={d.id} doc={d} />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function DocumentBlock({ doc }: { doc: MedicalDocument }) {
  const dateLabel = new Date(doc.createdAt).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });

  return (
    <article className="border border-gray-100 rounded-xl px-3 py-2 bg-gray-50">
      <div className="flex items-center justify-between gap-2">
        <div className="font-medium">{doc.title}</div>
        <div className="text-[11px] text-gray-500">{dateLabel}</div>
      </div>
      <p className="text-[11px] text-gray-600 mt-1">
        {doc.petName} — {doc.type}
      </p>
    </article>
  );
}
