// app/backoffice/registrar/consultations/[id]/page.tsx
import Link from "next/link";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { RegistrarHeader } from "@/components/registrar/RegistrarHeader";
import { getRegistrarAppointmentById } from "@/lib/registrar";
import { RegistrarActions } from "@/components/registrar/RegistrarActions";
import { RegistrarAssignSlot } from "@/components/registrar/RegistrarAssignSlot";

interface PageProps {
  params: {
    id: string;
  };
}

function statusBadgeClass(status: string): string {
  const s = (status || "").toLowerCase();

  if (s.includes("отмен")) return "bg-red-50 text-red-700";
  if (s.includes("запрош")) return "bg-amber-50 text-amber-700";
  if (s.includes("подтверж")) return "bg-blue-50 text-blue-700";
  if (s.includes("заверш")) return "bg-gray-100 text-gray-700";

  return "bg-emerald-50 text-emerald-700";
}

export default async function RegistrarConsultationPage({ params }: PageProps) {
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
              Детальная информация по заявке и основные действия регистратуры.
            </p>
          </div>

          {appointment && (
            <span
              className={
                "inline-flex rounded-full px-3 py-1 text-[11px] font-medium " +
                statusBadgeClass(appointment.statusLabel)
              }
            >
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
              <h2 className="text-base font-semibold">Основная информация</h2>

              {/* ID + дата */}
              <div className="flex flex-wrap.items-center justify-between gap-3">
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
                      Позже здесь будет явная привязка к карточке клиента из
                      owner_profiles.
                    </div>
                  </div>

                  <h3 className="text-xs font-semibold uppercase text-gray-500">
                    Питомец
                  </h3>
                  <div className="rounded-xl bg-gray-50 p-3 text-sm space-y-1">
                    {/* утверждённый регистратурой */}
                    <div className="font-medium">
                      {appointment.petName || "Не указан"}
                    </div>
                    {appointment.petSpecies && (
                      <div className="text-xs text-gray-600">
                        {appointment.petSpecies}
                      </div>
                    )}
                    {/* подсказка, что регистратор ещё не подтвердил */}
                    {appointment.statusLabel
                      .toLowerCase()
                      .includes("запрош") &&
                      !appointment.petName && (
                        <div className="text-[10px] text-gray-400">
                          Питомец ещё не подтверждён регистратурой.
                        </div>
                      )}
                    {/* выбор клиента */}
                    {(appointment.requestedPetName ||
                      appointment.requestedPetSpecies) && (
                      <div className="text-[11px] text-gray-400 mt-1">
                        выбрал клиент:{" "}
                        {appointment.requestedPetName ||
                          appointment.requestedPetSpecies ||
                          "—"}
                      </div>
                    )}
                    <div className="mt-2 text-[11px] text-gray-400">
                      Здесь будет ссылка на карточку питомца из таблицы pets,
                      если pet_id присутствует.
                    </div>
                  </div>
                </div>

                {/* Услуга + врач + платформа связи */}
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase text-gray-500">
                    Услуга и врач
                  </h3>
                  <div className="rounded-xl bg-gray-50 p-3 text-sm space-y-3">
                    <div>
                      <div className="text-xs text-gray-500">Услуга</div>
                      <div className="font-medium">
                        {appointment.serviceName || "Не выбрана"}
                      </div>
                      {appointment.serviceCode && (
                        <div className="text-[11px] text-gray-500">
                          код: {appointment.serviceCode}
                        </div>
                      )}
                      {appointment.requestedServiceName && (
                        <div className="mt-1 text-[11px] text-gray-400">
                          выбрал клиент: {appointment.requestedServiceName}
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="text-xs text-gray-500">Врач</div>
                      <div className="font-medium">
                        {appointment.doctorName || "Не назначен"}
                      </div>
                      {appointment.requestedDoctorName && (
                        <div className="mt-1 text-[11px] text-gray-400">
                          выбрал клиент: {appointment.requestedDoctorName}
                        </div>
                      )}
                    </div>
                  </div>

                  <h3 className="text-xs font-semibold uppercase text-gray-500">
                    Формат связи
                  </h3>
                  <div className="rounded-xl bg-gray-50 p-3 text-sm space-y-2">
                    <div>
                      <div className="text-xs text-gray-500">Платформа</div>
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
                        Ссылка на Телемост пока не указана. Можно добавить её,
                        отредактировав консультацию или через интерфейс врача в
                        будущем.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Документы и оплата */}
              <div className="grid gap-4 md:grid-cols-2 pt-2 border-t border-gray-100 mt-2">
                <div className="space-y-1">
                  <h3 className="text-xs font-semibold uppercase text-gray-500">
                    Документы и оплата
                  </h3>
                  <div className="rounded-xl bg-gray-50 p-3 text-sm space-y-1">
                    <div>
                      <span className="text-xs text-gray-500">
                        Документы по приёму:
                      </span>{" "}
                      <span className="font-medium">
                        {appointment.hasDocuments ? "есть" : "нет"}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">
                        Оплата по приёму:
                      </span>{" "}
                      <span className="font-medium">
                        {appointment.hasPayments ? "есть" : "нет"}
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-400 mt-1">
                      Здесь позже можно будет открыть список документов и
                      платежей по этой консультации.
                    </div>
                  </div>
                </div>

                {/* Индикатор редактирования + причина отмены */}
                <div className="space-y-1">
                  <h3 className="text-xs font-semibold uppercase text-gray-500">
                    Статус обработки
                  </h3>
                  <div className="rounded-xl bg-gray-50 p-3 text-sm space-y-1">
                    <div>
                      <span className="text-xs text-gray-500">Статус:</span>{" "}
                      <span className="font-medium">
                        {appointment.statusLabel}
                      </span>
                    </div>
                    {appointment.cancellationReason && (
                      <div className="text-xs text-red-700">
                        Причина отмены: {appointment.cancellationReason}
                      </div>
                    )}
                    {/* позже тут можно добавить индикатор "карточка редактировалась регистратурой" */}
                  </div>
                </div>
              </div>
            </section>

            {/* ======= Блок "Жалоба / описание проблемы" ======= */}
            <section className="rounded-2xl border bg-white p-4 space-y-3">
              <h2 className="text-base font-semibold">
                Жалоба / описание проблемы
              </h2>

              <div className="grid gap-4 md:grid-cols-2">
                {/* Жалоба регистратора (пока только отображение) */}
                <div className="space-y-1">
                  <div className="text-xs font-semibold uppercase text-gray-500">
                    Формулировка регистратуры
                  </div>
                  <div className="rounded-xl bg-gray-50 p-3 text-sm min-h-[60px] whitespace-pre-line">
                    {appointment.complaint && appointment.complaint.trim()
                      ? appointment.complaint
                      : "— пока не заполнено"}
                  </div>
                  <div className="text-[11px] text-gray-400">
                    В будущем эта формулировка будет редактироваться
                    регистратурой и отображаться врачу.
                  </div>
                </div>

                {/* Исходный текст клиента */}
                <div className="space-y-1">
                  <div className="text-xs font-semibold uppercase text-gray-500">
                    Писал клиент при записи
                  </div>
                  <div className="rounded-xl bg-gray-50 p-3 text-sm min-h-[60px] whitespace-pre-line">
                    {appointment.requestedComplaint &&
                    appointment.requestedComplaint.trim()
                      ? appointment.requestedComplaint
                      : "Клиент не указал жалобу при записи."}
                  </div>
                  <div className="text-[11px] text-gray-400">
                    Это исходный текст владельца из формы записи. Он не
                    изменяется регистратурой.
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
                initialCancellationReason={appointment.cancellationReason}
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
