import Link from "next/link";
import { RoleGuard } from "@/components/auth/RoleGuard";
import {
  getRegistrarAppointmentById,
  type RegistrarAppointmentRow,
} from "@/lib/registrar";
import { RegistrarActions } from "@/components/registrar/RegistrarActions";

interface PageProps {
  params: {
    id: string;
  };
}

export default async function RegistrarConsultationPage({
  params,
}: PageProps) {
  const appointment = await getRegistrarAppointmentById(params.id);

  return (
    <RoleGuard allowed={["registrar", "admin"]}>
      <main className="mx-auto max-w-4xl px-4 py-6 space-y-8">
        {/* Навигация назад */}
        <div>
          <Link
            href="/backoffice/registrar"
            className="text-xs text-gray-500 hover:text-gray-700 hover:underline"
          >
            ← Назад к списку
          </Link>
        </div>

        {/* Заголовок */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              Карточка консультации
            </h1>
            <p className="text-sm text-gray-500">
              Детальная информация по заявке и основные действия
              регистратуры.
            </p>
          </div>

          {appointment && (
            <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-700">
              Статус: {appointment.statusLabel}
            </span>
          )}
        </header>

        {/* Если запись не найдена */}
        {!appointment && (
          <section className="rounded-2xl border bg-white p-4">
            <p className="text-sm text-gray-500">
              Консультация с идентификатором{" "}
              <span className="font-mono">{params.id}</span> не найдена.
            </p>
          </section>
        )}

        {/* Если запись найдена — подробности */}
        {appointment && (
          <>
            {/* ======= Блок "Основная информация" ======= */}
            <section className="rounded-2xl border bg-white p-4 space-y-4">
              <h2 className="text-base font-semibold">Основная информация</h2>

              {/* Дата и ID */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-xs text-gray-500">ID заявки</div>
                  <div className="font-mono text-sm text-gray-900">
                    {appointment.id}
                  </div>
                </div>

                <div className="text-right text-xs text-gray-500">
                  <div>Дата / время</div>
                  <div className="text-sm text-gray-900">
                    {appointment.dateLabel}
                  </div>
                  {appointment.createdLabel && (
                    <div className="text-[11px] text-gray-400">
                      создано: {appointment.createdLabel}
                    </div>
                  )}
                </div>
              </div>

              {/* Клиент + Питомец */}
              <div className="grid gap-4 md:grid-cols-2">
                {/* Клиент */}
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase text-gray-500">
                    Клиент
                  </h3>
                  <div className="rounded-xl bg-gray-50 p-3 text-sm">
                    <div className="font-medium">{appointment.clientName}</div>
                    {appointment.clientContact && (
                      <div className="mt-1 text-xs text-gray-600">
                        {appointment.clientContact}
                      </div>
                    )}
                    <div className="mt-2 text-[11px] text-gray-400">
                      Позже здесь будет ссылка на карточку клиента.
                    </div>
                  </div>

                  <h3 className="text-xs font-semibold uppercase text-gray-500">
                    Питомец
                  </h3>
                  <div className="rounded-xl bg-gray-50 p-3 text-sm">
                    <div className="font-medium">
                      {appointment.petName || "Не указан"}
                    </div>
                    {appointment.petSpecies && (
                      <div className="mt-1 text-xs text-gray-600">
                        {appointment.petSpecies}
                      </div>
                    )}
                    <div className="mt-2 text-[11px] text-gray-400">
                      Тут будет связка с карточкой пациента / Vetmanager.
                    </div>
                  </div>
                </div>

                {/* Услуга + Врач */}
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase text-gray-500">
                    Услуга и врач
                  </h3>
                  <div className="rounded-xl bg-gray-50 p-3 text-sm space-y-2">
                    <div>
                      <div className="text-xs text-gray-500">Услуга</div>
                      <div className="font-medium">
                        {appointment.serviceName}
                      </div>
                      {appointment.serviceCode && (
                        <div className="text-[11px] text-gray-500">
                          код: {appointment.serviceCode}
                        </div>
                      )}
                    </div>
                    <div className="pt-2">
                      <div className="text-xs text-gray-500">Врач</div>
                      <div className="font-medium">
                        {appointment.doctorName || "Не назначен"}
                      </div>
                    </div>
                  </div>

                  <h3 className="text-xs font-semibold uppercase text-gray-500">
                    Служебная информация
                  </h3>
                  <div className="rounded-xl bg-gray-50 p-3 text-[11px] text-gray-500">
                    <p>
                      Сейчас данные берутся из таблицы{" "}
                      <code className="mx-1 rounded bg-white px-1">
                        public.appointments
                      </code>{" "}
                      (если она заполнена), иначе — из мок-файла{" "}
                      <code className="mx-1 rounded bg-white px-1">
                        lib/appointments.ts
                      </code>
                      . Позже здесь будет связка с Vetmanager.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* ======= Блок "Действия регистратуры" ======= */}
            <section className="rounded-2xl border bg-white p-4 space-y-3">
              <h2 className="text-base font-semibold">
                Действия регистратуры
              </h2>

              <RegistrarActions
                appointmentId={appointment.id}
                currentStatus={appointment.statusLabel}
              />
            </section>
          </>
        )}
      </main>
    </RoleGuard>
  );
}
