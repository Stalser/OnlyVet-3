import { reviews } from "../../lib/reviews";

export default function ReviewsPage() {
  return (
    <main className="container mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold mb-8">Отзывы владельцев</h1>

      <div className="grid md:grid-cols-2 gap-8">
        {reviews.map((r) => (
          <div
            key={r.id}
            className="bg-white p-6 shadow-sm border border-gray-200 rounded-xl"
          >
            <div className="font-semibold text-lg">{r.name}</div>
            <div className="text-yellow-500 text-sm mb-2">
              {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}
            </div>
            <p className="text-gray-700 whitespace-pre-line">{r.text}</p>
            <div className="text-xs text-gray-400 mt-4">{r.date}</div>
          </div>
        ))}
      </div>
    </main>
  );
}
