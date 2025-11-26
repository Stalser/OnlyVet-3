"use client";

import { useMemo, useState } from "react";
import { doctors } from "../lib/data";

export default function Doctors() {
  // Все уникальные специализации
  const specialties = useMemo(
    () =>
      Array.from(
        new Set(
          doctors
            .map((d) => d.specialty)
            .filter((s): s is string => Boolean(s && s.trim()))
        )
      ),
    []
  );

  const [activeSpecialty, setActiveSpecialty] = useState<string>("all");

  const filteredDoctors = useMemo(() => {
    if (activeSpecialty === "all") return doctors;
    return doctors.filter((d) => d.specialty === activeSpecialty);
  }, [activeSpecialty]);

  return (
    <section className="space-y-4">
      {/* Заголовок */}
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">Наши врачи</h2>
        <p className="text-sm text-gray-500">
          Команда OnlyVet — онлайн-ветеринары с опытом, которые помогают вам и
          вашим питомцам на расстоянии.
        </p>
      </div>

      {/* Фильтр по специальности */}
      {specialties.length > 0 && (
        <div className="flex flex-wrap gap-2 text-xs">
          <button
            type="button"
            onClick={() => setActiveSpecialty("all")}
            className={
              "rounded-full border px-3 py-1 " +
              (activeSpecialty === "all"
                ? "border-gray-900 bg-gray-900 text-white"
                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50")
            }
          >
            Все специализации
          </button>
          {specialties.map((spec) => (
            <button
              key={spec}
              type="button"
              onClick={() => setActiveSpecialty(spec)}
              className={
                "rounded-full border px-3 py-1 " +
                (activeSpecialty === spec
                  ? "border-gray-900 bg-gray-900 text-white"
                  : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50")
              }
            >
              {spec}
            </button>
          ))}
        </div>
      )}

      {/* Список врачей */}
      <div className="grid gap-4 md:grid-cols-2">
        {filteredDoctors.map((d) => (
          <article
            key={d.id}
            className="flex gap-3 rounded-2xl border border-gray-200 bg-white p-3"
          >
            {/* Аватар */}
            <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-full bg-gray-100">
              {d.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={d.avatar}
                  alt={d.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                  фото
                </div>
              )}
            </div>

            {/* Инфо */}
            <div className="flex flex-col gap-1 text-sm">
              <div>
                <div className="font-medium">{d.name}</div>
                {d.specialty && (
                  <div className="text-[11px] text-gray-500">
                    {d.specialty}
                  </div>
                )}
              </div>

              {d.experience && (
                <div className="text-[11px] text-gray-500">
                  Стаж: {d.experience}
                </div>
              )}

              {typeof d.rating === "number" && (
                <div className="text-[11px] text-gray-500">
                  Рейтинг: {d.rating.toFixed(1)}★
                </div>
              )}

              {d.bio && (
                <p className="text-[11px] text-gray-600 line-clamp-3">
                  {d.bio}
                </p>
              )}
            </div>
          </article>
        ))}

        {filteredDoctors.length === 0 && (
          <p className="text-xs text-gray-400">
            Врачей с такой специализацией пока нет.
          </p>
        )}
      </div>
    </section>
  );
}
