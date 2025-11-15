"use client";

import Link from "next/link";
import { notFound } from "next/navigation";

import { doctors } from "../../../lib/data";
import { servicesPricing } from "../../../lib/pricing";

type Doctor = (typeof doctors)[number] | any;

type PageProps = {
  params: { id: string };
};

export default function DoctorProfilePage({ params }: PageProps) {
  const list = doctors as Doctor[];
  const doctor = list.find((d) => d.id === params.id);

  if (!doctor) {
    return notFound();
  }

  const description =
    doctor.fullBio ||
    doctor.bio ||
    doctor.description ||
    "Врач консультирует онлайн, помогает разбирать анализы, подбирать лечение и давать второе мнение.";

  // если у врача есть services: string[] с кодами услуг – фильтруем прайс;
  // иначе показываем основной список услуг
  const doctorServiceCodes: string[] = Array.isArray(doctor.services)
    ? doctor.services
    : [];
  const services =
    doctorServiceCodes.length > 0
      ? servicesPricing.filter((s: any) => doctorServiceCodes.includes(s.code))
      : (servicesPricing as any[]);

  const bookingBase = `/booking?doctor=${doctor.id}`;

  return (
    <main className="bg-slate-50 min-h-screen py-12">
      <div className="container space-y-8">
        {/* Навигация назад */}
        <div className="text-xs text-gray-500">
          <Link href="/doctors" className="hover:text-gray-800">
            ← Ко всем врачам
          </Link>
        </div>

        {/* Шапка врача */}
        <section className="rounded-2xl border bg-white p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1 text-sm">
            <div className="text-xs text-gray-500">Ветеринарный врач</div>
            <h1 className="text-2xl font-semibold leading-snug">
              {doctor.name}
            </h1>
            {doctor.speciality && (
              <div className="text-xs text-gray-500">
                {doctor.speciality}
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <Link
              href={bookingBase}
              className="rounded-xl px-5 py-2 bg-black text-white text-sm font-medium hover:bg-gray-900"
            >
              Записаться к врачу
            </Link>
          </div>
        </section>

        {/* Описание */}
        <section className="rounded-2xl border bg-white p-4 space-y-2 text-sm">
          <h2 className="font-semibold text-base">О враче</h2>
          <p className="text-gray-700 text-sm leading-relaxed">
            {description}
          </p>
        </section>

        {/* Услуги врача */}
        <section className="rounded-2xl border bg-white p-4 space-y-3 text-sm">
          <h2 className="font-semibold text-base">Услуги врача</h2>
          <p className="text-xs text-gray-500">
            Ниже — основные услуги, которые оказывает врач. При выборе услуги
            она будет автоматически подставлена в форму записи.
          </p>

          <div className="space-y-2">
            {services.map((s: any) => {
              const price =
                typeof s.priceRUB !== "undefined"
                  ? s.priceRUB
                  : typeof s.price !== "undefined"
                  ? s.price
                  : null;

              return (
                <div
                  key={s.code}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 text-xs"
                >
                  <div>
                    <div className="font-medium">{s.name}</div>
                    {s.description && (
                      <div className="text-gray-600 text-[11px] mt-0.5">
                        {s.description}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {price !== null && (
                      <div className="text-gray-800 font-semibold">
                        {price.toLocaleString("ru-RU")} ₽
                      </div>
                    )}
                    <Link
                      href={`${bookingBase}&service=${s.code}`}
                      className="rounded-xl px-3 py-1.5 bg-black text-white text-[11px] font-medium hover:bg-gray-900"
                    >
                      Записаться на эту услугу
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
