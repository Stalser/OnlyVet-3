import Link from "next/link";
import { Suspense } from "react";
import BookingWidget from "../../components/BookingWidget";

export default function BookingPage() {
  return (
    <main className="bg-slate-50 py-12">
      <div className="container grid lg:grid-cols-[2fr,1.5fr] gap-10 items-start">
        <div className="space-y-4">
          <h1 className="text-3xl.font-semibold">Запись на консультацию</h1>
          <p className="text-sm.text-gray-600.max-w-xl">
            Опишите проблему, выберите врача и услугу — администратор свяжется
            с вами для подтверждения времени и способов связи.
          </p>
          <p className="text-xs.text-gray-500">
            Не заменяет экстренную помощь. При угрозе жизни животного срочно
            обращайтесь в ближайшую круглосуточную клинику.
          </p>

          <Link
            href="/services"
            className="inline-flex text-xs text-blue-600 underline underline-offset-2"
          >
            Посмотреть список услуг и цены
          </Link>
        </div>

        <div className="card p-4">
          <Suspense fallback={<div className="text-sm text-gray-500">Загружаем форму записи...</div>}>
            <BookingWidget />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
