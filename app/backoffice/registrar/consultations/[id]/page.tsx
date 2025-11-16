import Link from "next/link";
import { RoleGuard } from "@/components/auth/RoleGuard";
import {
  getRegistrarAppointmentById,
} from "@/lib/registrar";
import { RegistrarActions } from "@/components/registrar/RegistrarActions";
import { RegistrarAssignSlot } from "@/components/registrar/RegistrarAssignSlot";

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

        {/* Если не нашли */}
        {!appointment && (
          <section className="rounded-2xl border bg-white p-4">
            <p className="text-sm text-gray-500">
              Консультация с идентификатором{" "}
              <span className="font-mono">{params.id}</span> не найдена.
            </p>
          </section>
        )}

        {/* Если нашли */}
        {appointment && (
          <>
            {/* ======= Блок "Основная информация" ======= */}
            <section className="rounded-2xl border bg-white p-4 space-y-4">
              <h2 className="text-base font-semibold">
                Основная информация
              </h2>

              {/* ID + дата */}
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

              {/* Клиент + питомец + услуга/врач */}
              <div className="grid gap-4 md:grid-cols-2">
                {/* Клиент + питомец */}
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase text-gray-500">
                    Клиент
                  </h3>
                  <div className="rounded-xl bg-gray-50 p-3 text-sm">
                    <div className="font-medium">
                      {appointment.clientName || "Без имени"}
                    </div>
                    {appointment.clientContact && (
                      <div className="mt-1 text-xs text-gray-600">
                        {appointment.clientContact}
                      </div>
                    )}
                    <div className="mt-2 text-[11px] text-gray-400">
                      Позже здесь будет явная привязка к карточке клиента
                      из owner_profiles.
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
                      Здесь будет ссылка на карточку питомца из таблицы
                      pets, если pet_id присутствует.
                    </div>
                  </div>
                </div>

                {/* Услуга + врач + платформа связи */}
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
                    Формат связи
                  </h3>
                  <div className="rounded-xl bg-gray-50 p-3 text-sm space-y-2">
                    <div>
                      <div className="text-xs text-gray-500">
                        Платформа
                      </div>
                      <div className="font-medium text-gray-900">
                        {appointment.videoPlatform === "yandex_telemost" ||
                        !appointment.videoPlatform
                          ? "Яндекс Телемост"
                          : appointment.videoPlatform}
                      </div>
                    </div>

                    {appointment.videoUrl ? (
                      <div className="text-[11px]">
                        <a
                          href={appointment.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-700 hover:underline"
                        >
                          Открыть ссылку Телемоста
                        </a>
                      </div>
                    ) : (
                      <div className="text-[10px] text-gray-400">
                        Ссылка на Телемост пока не указана. Можно добавить
                        её, отредактировав консультацию или через
                        интерфейс врача в будущем.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* ======= Блок "Действия регистратуры" ======= */}
            <section className="rounded-2xl border bg-white p-4 space-y-4">
              <h2 className="text-base font-semibold">
                Действия регистратуры
              </h2>

              <RegistrarActions
                appointmentId={appointment.id}
                currentStatus={appointment.statusLabel}
              />

              <div className="border-t border-gray-100 pt-4 mt-2">
                <RegistrarAssignSlot
                  appointmentId={appointment.id}
                  doctorId={appointment.doctorId}
                />
              </div>
            </section>
          </>
        )}
      </main>
    </RoleGuard>
  );
}
