"use client";

import Link from "next/link";
import { reviews } from "../lib/reviews";

export default function ReviewsHome() {
  const top = reviews.slice(0, 3);

  return (
    <section className="bg-white py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-semibold text-center mb-10">
          Отзывы владельцев
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          {top.map((r) => (
            <div
              key={r.id}
              className="rounded-2xl border border-gray-200 shadow-sm bg-white p-5 flex flex-col"
            >
              <div className="font-medium text-gray-900">{r.name}</div>
              <div className="text-yellow-500 text-sm my-1">
                {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}
              </div>

              <p className="text-gray-600 text-sm line-clamp-4">{r.text}</p>

              <div className="mt-auto pt-4 text-xs text-gray-400">
                {r.date}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-center mt-10">
          <Link
            href="/reviews"
            className="px-5 py-2 rounded-xl bg-black text-white text-sm hover:bg-gray-900"
          >
            Все отзывы ({reviews.length})
          </Link>
        </div>
      </div>
    </section>
  );
}
