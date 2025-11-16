import Link from "next/link";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { RegistrarHeader } from "@/components/registrar/RegistrarHeader";
import { getRegistrarAppointmentById } from "@/lib/registrar";

interface PageProps {
  params: {
    id: string;
  };
}

export default async function StaffAppointmentPage({ params }: PageProps) {
  const appointment = await getRegistrarAppointmentById(params.id);

  return (
    <RoleGuard allowed={["vet", "admin"]}>
      <main className="mx-auto max-w-4xl px-4 py-6 space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <Link
              href="/staff"
              className="text-xs text-gray-500 hover:text-gray-700 hover:underline"
            >
              ← В кабинет врача
            </Link>
            <h1 className="mt-2 text-xl font-bold tracking-tight">
              Онлайн-консультация
            </h1>
            <p className="text-sm text-gray-500">
              Информация о приёме, пациенте и ссылке на Телемост.
            </p>
          </div>
          <RegistrarHeader />
        </header>

        {!appointment && (
          <section className="rounded-2xl border bg-white p-4">
            <p className="text-sm text-gray-500">
              Консультация с идентификатором{" "}
              <span className="font-mono">{params.id}</span> не найдена.
            </p>
          </section>
        )}

        {appointment && (
          <>
            {/* Основная информация */}
            <section className="rounded-2xl border bg-white p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs text-gray-500">
                    Дата / время
                  </div>
                  <div className="text-sm font-medium text-gray-900">
                    {appointment.dateLabel}
                  </div>
                </div>
                <div className="text-right text-xs text-gray-500">
                  Статус
                  <div className="mt-1 text-[11px] font-semibold text-gray-900">
                    {appointment.statusLabel}
                  </div>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <h2 className="text-xs font-semibold uppercase text-gray-500">
                    Пациент
                  </h2>
                  <div className="rounded-xl bg-gray-50 p-3 text-sm">
                    <div className="font-medium">
                      {appointment.petName || "Без имени"}
                    </div>
                    {appointment.petSpecies && (
                      <div className="mt-1 text-xs text-gray-600">
                        {appointment.petSpecies}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <h2 className="text-xs font-semibold uppercase text-gray-500">
                    Услуга
                  </h2>
                  <div className="rounded-xl bg-gray-50 p-3 text-sm">
                    <div className="font-medium">
                      {appointment.serviceName}
                    </div>
                    {appointment.serviceCode && (
                      <div className="mt-1 text-[11px] text-gray-500">
                        код: {appointment.serviceCode}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* Формат связи: Телемост */}
            <section className="rounded-2xl border bg-white p-4 space-y-3">
              <h2 className="text-sm font-semibold">
                Формат связи (для подключения врача)
              </h2>
              <div className="rounded-xl bg-emerald-50 p-3 text-sm space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[11px] text-emerald-800">
                      Платформа
                    </div>
                    <div className="text-sm font-semibold text-emerald-900">
                      Яндекс Телемост
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-600" />
                    Онлайн
                  </span>
                </div>

                {appointment.videoUrl ? (
                  <div className="text-[11px]">
                    <a
                      href={appointment.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-700 hover:underline"
                    >
                      Перейти в Телемост
                    </a>
                  </div>
                ) : (
                  <div className="text-[11px] text-emerald-800">
                    Ссылка на Телемост пока не указана. Уточните у
                    регистратуры или создайте конференцию и добавьте ссылку
                    в карточке консультации.
                  </div>
                )}
              </div>
            </section>

            {/* Заглушка под блок "Заключение врача" */}
            <section className="rounded-2xl border bg-white p-4 space-y-2">
              <h2 className="text-sm font-semibold">
                Заключение врача (будет дорабатываться)
              </h2>
              <p className="text-xs text-gray-500">
                Здесь будет основная рабочая зона врача: заключение,
                назначения, шаблоны. Сейчас это заглушка, чтобы
                архитектурно закрепить кабинет.
              </p>
            </section>
          </>
        )}
      </main>
    </RoleGuard>
  );
}
