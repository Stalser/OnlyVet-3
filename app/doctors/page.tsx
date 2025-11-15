"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { doctors } from "../../lib/data";

type Doctor = (typeof doctors)[number] | any;

export default function DoctorsPage() {
  const list = doctors as Doctor[];

  const [search, setSearch] = useState("");
  const [specialityFilter, setSpecialityFilter] = useState("all");

  const specialities = useMemo(
    () =>
      Array.from(
        new Set(
          list
            .map((d) => d.speciality as string | undefined)
            .filter(Boolean)
        )
      ),
    [list]
  );

  const filtered = useMemo(
    () =>
      list.filter((d) => {
        if (
          search &&
          !`${d.name} ${d.speciality}`
            .toLowerCase()
            .includes(search.toLowerCase())
        ) {
          return false;
        }
        if (
          specialityFilter !== "all" &&
          d.speciality !== specialityFilter
        ) {
          return false;
        }
        return true;
      }),
    [list, search, specialityFilter]
  );

  return (
    <main className="bg-slate-50 min-h-screen py-12">
      <div className="container space-y-6">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold">Наши врачи</h1>
            <p className="text-sm text-gray-600 mt-1 max-w-xl">
              Выберите врача по специализации и запишитесь на онлайн-консультацию.
            </p>
          </div>
          <Link
            href="/booking"
            className="rounded-xl px-4 py-2 bg-black text-white text-sm font-medium hover:bg-gray-900"
          >
            Записаться онлайн
          </Link>
        </header>

        {/* Фильтры */}
        <section className="rounded-2xl border bg-white p-4 flex flex-col md:flex-row gap-3 md:items-center md:justify-between text-xs">
          <div className="flex flex-wrap gap-2 items-center">
            <input
              type="text"
              placeholder="Поиск по имени"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-xl border border-gray-200 px-3 py-1.5 text-xs outline-none focus:border-black focus:ring-1 focus:ring-black bg-white"
            />
            <select
              value={specialityFilter}
              onChange={(e) => setSpecialityFilter(e.target.value)}
              className="rounded-xl border border-gray-200 px-3 py-1.5 bg-white outline-none"
            >
              <option value="all">Все специализации</option>
              {specialities.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="text-[11px] text-gray-500">
            Показано: {filtered.length} из {list.length}
          </div>
        </section>

        {/* Список врачей */}
        <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((d) => (
            <DoctorCard key={d.id} doctor={d} />
          ))}

          {filtered.length === 0 && (
            <p className="text-xs text-gray-500">
              Врачей по заданным фильтрам не найдено.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}

function DoctorCard({ doctor }: { doctor: Doctor }) {
  const description =
    doctor.description ||
    doctor.bio ||
    "Опытный врач, консультирует онлайн и помогает в сложных клинических случаях.";

  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-4 flex flex-col gap-3 text-sm">
      <div>
        <div className="text-xs text-gray-500 mb-1">Ветеринарный врач</div>
        <h2 className="font-semibold text-base leading-snug">
          {doctor.name}
        </h2>
        {doctor.speciality && (
          <div className="text-xs text-gray-500 mt-0.5">
            {doctor.speciality}
          </div>
        )}
      </div>

      <p className="text-xs text-gray-600 line-clamp-4 min-h-[3.5rem]">
        {description}
      </p>

      <div className="mt-auto flex justify-between items-center gap-2">
        <Link
          href={`/doctors/${doctor.id}`}
          className="text-xs text-blue-600 underline underline-offset-2"
        >
          Профиль врача
        </Link>
        <Link
          href={`/booking?doctor=${doctor.id}`}
          className="rounded-xl px-4 py-1.5 bg-black text-white text-xs font-medium hover:bg-gray-900"
        >
          Записаться
        </Link>
      </div>
    </article>
  );
}
