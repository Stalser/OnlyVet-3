// app/backoffice/registrar/consultations/[id]/page.tsx
import Link from "next/link";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { RegistrarHeader } from "@/components/registrar/RegistrarHeader";
import { getRegistrarAppointmentById } from "@/lib/registrar";
import { RegistrarActions } from "@/components/registrar/RegistrarActions";
import { RegistrarAssignSlot } from "@/components/registrar/RegistrarAssignSlot";
import { RegistrarComplaintEditor } from "@/components/registrar/RegistrarComplaintEditor";
import { RegistrarPetEditor } from "@/components/registrar/RegistrarPetEditor";
import { RegistrarServiceDoctorEditor } from "@/components/registrar/RegistrarServiceDoctorEditor";

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
        {/* Навигация назад + шапка регистратуры */}
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/backoffice/registrar"
            className="text-xs text-gray-500 hover:text-gray-700 hover:underline"
          >
            ← Назад к списку
          </Link>
          <RegistrarHeader />
        </div>

        {/* Шапка карточки + статус */}
        <header className="flex items-center justify-between gap-3">
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
          <section className="rounded-2xl border.bg-white p-4">
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
              <div className="flex flex-wrap items-center.justify-between gap-3">
                <h2 className="text-base font-semibold">Основная информация</h2>
                <div className="text-right text-xs text-gray-500">
                  <div>Дата / время консультации</div>
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

              <div className="grid gap-4 md:grid-cols-2">
                {/* Левая часть: ID + клиент + доки/оплата */}
                <div className="space-y-3">
                  <div>
                    <div className="text-xs text-gray-500">ID заявки</div>
                    <div className="font-mono text-sm text-gray-900">
                      {appointment.id}
                    </div>
                  </div>

                  <div>
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
                        В будущем здесь будет явная привязка к карточке клиента
                        из owner_profiles.
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-semibold.uppercase text-gray-500">
                      Документы и оплата
                    </h3>
                    <div className="rounded-xl.bg-gray-50 p-3 text-sm space-y-1">
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
                        Позже здесь можно будет открыть список документов и
                        платежей по этой консультации.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Правая часть: статус обработки + формат связи */}
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase text-gray-500">
                    Статус обработки
                  </h3>
                  <div className="rounded-xl.bg-gray-50 p-3 text-sm space-y-2">
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
                    <div className="text-[11px] text-gray-400">
                      Изменения статуса и причины отмены будут отображаться в
                      истории изменений и карточке клиента.
                    </div>
                  </div>

                  <h3 className="text-xs font-semibold.uppercase text-gray-500">
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
                        Ссылка на Телемост пока не указана. Можно добавить её
                        позже при редактировании консультации или через кабинет
                        врача.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* ======= Питомец, услуга и врач ======= */}
            <section className="rounded-2xl border bg-white p-4 space-y-4">
              <div className="flex flex-wrap.items-center justify-between gap-3">
                <h2 className="text-base font-semibold">
                  Питомец, услуга и врач
                </h2>
                <div className="flex flex-wrap gap-2 text-[10px] text-gray-500">
                  <span className="inline-flex items-center.rounded-full bg-gray-100 px-2.py-0.5">
                    Левая колонка — для работы регистратуры
                  </span>
                  <span className="inline-flex items-center.rounded-full bg-gray-50 px-2.py-0.5">
                    Правая колонка — данные из заявки клиента
                  </span>
                </div>
              </div>

              <div className="grid.gap-4 md:grid-cols-2">
                {/* Левая колонка: рабочий слой клиники */}
                <div className="space-y-3">
                  <h3 className="text-xs.font-semibold.uppercase text-gray-500">
                    Данные для работы регистратуры
                  </h3>

                  <div className="rounded-xl.bg-gray-50 p-3 text-sm space-y-3">
                    {/* Питомец (редактируемый) */}
                    <RegistrarPetEditor
                      appointmentId={appointment.id}
                      petName={appointment.petName ?? null}
                      petSpecies={appointment.petSpecies ?? null}
                    />
                  </div>

                  <div className="rounded-xl.bg-gray-50 p-3 text-sm space-y-3">
                    {/* Услуга и врач (редактируемые) */}
                    <RegistrarServiceDoctorEditor
                      appointmentId={appointment.id}
                      serviceCode={appointment.serviceCode ?? null}
                      doctorId={appointment.doctorId ?? null}
                    />
                  </div>
                </div>

                {/* Правая колонка: данные клиента */}
                <div className="space-y-3">
                  <h3 className="text-xs.font-semibold.uppercase text-gray-500">
                    Данные из заявки клиента
                  </h3>

                  {/* Питомец из заявки */}
                  <div className="rounded-xl bg-white border border-dashed border-gray-200 p-3 text-sm space-y-1">
                    <div className="text-xs text-gray-500">
                      Питомец, выбранный клиентом
                    </div>
                    <div className="font-medium">
                      {appointment.requestedPetName || "не указан"}
                    </div>
                    {appointment.requestedPetSpecies && (
                      <div className="text-xs text-gray-600">
                        {appointment.requestedPetSpecies}
                      </div>
                    )}
                    {!appointment.requestedPetName &&
                      !appointment.requestedPetSpecies && (
                        <div className="text-[10px] text-gray-400 mt-1">
                          Клиент не указал питомца при записи.
                        </div>
                      )}
                  </div>

                  {/* Услуга и врач из заявки */}
                  <div className="rounded-xl bg-white border border-dashed border-gray-200 p-3 text-sm space-y-3">
                    <div>
                      <div className="text-xs text-gray-500">
                        Услуга, выбранная клиентом
                      </div>
                      <div className="font-medium">
                        {appointment.requestedServiceName ||
                          "клиент не выбрал услугу"}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-gray-500">
                        Врач, выбранный клиентом
                      </div>
                      <div className="font-medium">
                        {appointment.requestedDoctorName ||
                          "клиент не выбрал врача"}
                      </div>
                    </div>

                    <div className="text-[10px] text-gray-400">
                      Эти данные не редактируются. Регистратура может назначить
                      другую услугу или врача слева.
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* ======= Жалоба / описание проблемы ======= */}
            <section className="rounded-2xl border bg-white p-4 space-y-3">
              <div className="flex flex-wrap.items-center justify-between gap-3">
                <h2 className="text-base font-semibold">
                  Жалоба / описание проблемы
                </h2>
                <div className="flex flex-wrap.gap-2 text-[10px] text-gray-500">
                  <span className="inline-flex items-center.rounded-full bg-gray-100 px-2.py-0.5">
                    Слева — формулировка регистратуры
                  </span>
                  <span className="inline-flex items-center.rounded-full bg-gray-50 px-2.py-0.5">
                    Справа — что писал клиент
                  </span>
                </div>
              </div>

              <div className="grid.gap-4 md:grid-cols-2">
                {/* Лево: жалоба регистратуры (редактируемая) */}
                <div className="space-y-1">
                  <RegistrarComplaintEditor
                    appointmentId={appointment.id}
                    complaint={appointment.complaint ?? null}
                    requestedComplaint={appointment.requestedComplaint ?? null}
                  />
                </div>

                {/* Право: исходный текст клиента */}
                <div className="space-y-1">
                  <div className="text-xs.font-semibold.uppercase text-gray-500">
                    Писал клиент при записи
                  </div>
                  <div className="rounded-xl.bg-white border border-dashed.border-gray-200 p-3 text-sm min-h-[60px] whitespace-pre-line">
                    {appointment.requestedComplaint &&
                    appointment.requestedComplaint.trim()
                      ? appointment.requestedComplaint
                      : "Клиент не указал жалобу при записи."}
                  </div>
                  <div className="text-[11px] text-gray-400">
                    Это исходный текст владельца из онлайн-формы. Он не
                    изменяется регистратурой.
                  </div>
                </div>
              </div>
            </section>

            {/* ======= Действия регистратуры ======= */}
            <section className="rounded-2xl.border bg-white p-4 space-y-4">
              <h2 className="text-base font-semibold">
                Действия регистратуры
              </h2>

              <RegistrarActions
                appointmentId={appointment.id}
                currentStatus={appointment.statusLabel}
                initialCancellationReason={appointment.cancellationReason}
              />

              <div className="border-t.border-gray-100 pt-4 mt-2">
                <RegistrarAssignSlot
                  appointmentId={appointment.id}
                  doctorId={appointment.doctorId}
                />
              </div>

              <p className="text-[11px] text-gray-400">
                Далее сюда добавим историю изменений по заявке (кто и когда
                изменил статус, врача, услугу или жалобу).
              </p>
            </section>
          </>
        )}
      </main>
    </RoleGuard>
  );
}
