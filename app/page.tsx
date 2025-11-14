"use client";

import Link from "next/link";
import Doctors from "../components/Doctors";
import ReviewsHome from "../components/ReviewsHome";

export default function HomePage() {
  return (
    <main className="flex flex-col">

      {/* HERO */}
      <section className="bg-white pt-20 pb-16">
        <div className="container grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
              Мы рядом, даже когда <br /> врач далеко
            </h1>

            <p className="mt-4 text-gray-600 text-lg max-w-xl">
              Онлайн-консультации ветеринарных врачей 24/7.{" "}
              Поможем вам с диагнозом, лечением и интерпретацией анализов.
            </p>

            <div className="mt-6 flex flex-wrap gap-4">
              <Link
                href="/booking"
                className="rounded-xl px-6 py-3 bg-black text-white text-sm font-medium hover:bg-gray-900"
              >
                Записаться онлайн
              </Link>

              <Link
                href="/services"
                className="rounded-xl px-6 py-3 text-sm font-medium border border-gray-300 bg-white hover:bg-gray-50"
              >
                Услуги и цены
              </Link>
            </div>

            <p className="mt-4 text-xs text-gray-500">
              Не заменяет экстренную помощь. При угрозе жизни — срочно в клинику.
            </p>
          </div>

          <div className="flex justify-center">
            <img
              src="/hero-vet.png"
              alt="Ветеринар онлайн"
              className="w-full max-w-md drop-shadow-xl"
            />
          </div>
        </div>
      </section>

      {/* УСЛУГИ И ЦЕНЫ */}
      <section className="bg-slate-50 py-16">
        <div className="container space-y-4 text-center">
          <h2 className="text-3xl font-semibold">Услуги и цены</h2>
          <p className="text-gray-600 max-w-xl mx-auto">
            Онлайн-консультации, разбор анализов, второе мнение —{" "}
            всё в одном сервисе, быстро и удобно.
          </p>
          <Link
            href="/services"
            className="inline-block rounded-xl px-6 py-3 bg-black text-white text-sm font-medium hover:bg-gray-900"
          >
            Открыть список услуг
          </Link>
        </div>
      </section>

      {/* ВРАЧИ */}
      <section className="bg-white py-16">
        <div className="container">
          <h2 className="text-3xl font-semibold mb-8">Врачи OnlyVet</h2>
          <Doctors />
        </div>
      </section>

      {/* ОТЗЫВЫ */}
      <ReviewsHome />

      {/* НИЖНИЙ CTA */}
      <section className="bg-white py-20">
        <div className="container flex flex-col items-center text-center">
          <h2 className="text-3xl font-semibold max-w-2xl leading-tight">
            Нужна помощь ветеринара?{" "}
            Начните консультацию прямо сейчас.
          </h2>

          <p className="text-gray-600 max-w-xl mt-3">
            Достаточно описать проблему и прикрепить фото.{" "}
            Дежурный врач быстро подскажет, что делать дальше.
          </p>

          <div className="mt-6">
            <Link
              href="/booking"
              className="rounded-xl px-6 py-3 bg-black text-white text-sm font-medium hover:bg-gray-900"
            >
              Начать консультацию
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
