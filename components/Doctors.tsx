"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { doctors } from "../lib/data";
import { servicesPricing, doctorServicesMap } from "../lib/pricing";

type Doctor = (typeof doctors)[number];

function MiniPrice({ doctor }: { doctor: Doctor }) {
  const codes = doctorServicesMap[doctor.id] || [];
  const items = servicesPricing.filter((s) => codes.includes(s.code));

  if (!items.length) return null;

  return (
    <div className="mt-2 text-xs text-gray-700">
      <div className="font-semibold mb-1">Основные услуги:</div>
      <ul className="space-y-0.5">
        {items.map((s) => (
          <li key={s.code} className="flex justify-between gap-2">
            <span className="opacity-80">{s.name}</span>
            <span className="font-semibold">
              {s.priceRUB !== undefined
                ? `${s.priceRUB.toLocaleString("ru-RU")} ₽`
                : "уточняется"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Doctors() {
  const [specialtyFilter, setSpecialtyFilter] = useState<string | "all">("all");

  const specialties = useMemo(
    () =>
      Array.from(
        new Set(
          doctors
            .map((d) => d.speciality)
            .filter((s): s is string => Boolean(s && s.trim()))
        )
      ),
    []
  );

  const filtered = useMemo(() => {
    let list = doctors;
    if (specialtyFilter !== "all") {
      list = list.filter((d) => d.speciality === specialtyFilter);
    }
    return list;
  }, [specialtyFilter]);

  const totalCount = doctors.length;

  return (
    <section className="container py-12 sm:py-16 space-y-6">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-2xl sm:text-3xl font-semibold">
            Врачи OnlyVet
          </h2>
          <p className="opacity-80 text-sm sm:text-base max-w-xl mt-1">
            Выберите врача по специализации. В мини-прайсе указаны основные
            услуги, которые он оказывает.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <Link
            href="/doctors"
            className="btn btn-outline"
          >
            Все врачи ({totalCount})
          </Link>
          <Link
            href="/services"
            className="btn btn-outline"
          >
            Услуги и цены
          </Link>
        </div>
      </div>

      {specialties.length > 0 && (
        <div className="flex flex-wrap gap-2 text-xs">
          <button
            className={[
              "badge",
              specialtyFilter === "all" ? "badge-active" : "",
            ].join(" ")}
            onClick={() => setSpecialtyFilter("all")}
          >
            Все специализации
          </button>
          {specialties.map((sp) => (
            <button
              key={sp}
              className={[
                "badge",
                specialtyFilter === sp ? "badge-active" : "",
              ].join(" ")}
              onClick={() => setSpecialtyFilter(sp)}
            >
              {sp}
            </button>
          ))}
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((doctor) => (
          <article
            key={doctor.id}
            className="card p-4 flex flex-col gap-3"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-4">
                {doctor.avatar && (
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-100">
                    <Image
                      src={doctor.avatar}
                      alt={doctor.name}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-base">{doctor.name}</h3>
                  <p className="text-xs text-gray-500">
                    {doctor.speciality || "Врач"}
                  </p>
                  {doctor.experience && (
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      {doctor.experience}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <MiniPrice doctor={doctor} />

            <div className="flex justify-between items-center mt-3 text-xs">
              <Link
                href={`/doctors/${doctor.id}`}
                className="text-blue-600 underline underline-offset-2"
              >
                Подробнее
              </Link>
              <Link
                href={`/booking?doctorId=${doctor.id}`}
                className="btn btn-primary px-3 py-1.5 text-xs"
              >
                Записаться
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
