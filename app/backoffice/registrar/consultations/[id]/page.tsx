import Link from "next/link";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { RegistrarHeader } from "@/components/registrar/RegistrarHeader";
import { getRegistrarAppointmentById } from "@/lib/registrar";

import { RegistrarActions } from "@/components/registrar/RegistrarActions";
import { RegistrarAssignSlot } from "@/components/registrar/RegistrarAssignSlot";
import { RegistrarComplaintEditor } from "@/components/registrar/RegistrarComplaintEditor";
import { RegistrarPetEditor } from "@/components/registrar/RegistrarPetEditor";
import { RegistrarServiceEditor } from "@/components/registrar/RegistrarServiceEditor";
import { RegistrarDoctorEditor } from "@/components/registrar/RegistrarDoctorEditor";
import { RegistrarDocumentsBlock } from "@/components/registrar/RegistrarDocumentsBlock";

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

        {/* Навигация */}
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/backoffice/registrar"
            className="text-xs text-gray-500 hover:underline"
          >
            ← Назад к списку
          </Link>
          <RegistrarHeader />
        </div>

        {!appointment && (
          <section className="rounded-2xl border bg-white p-4">
            <p className="text-sm text-gray-500">
              Консультация <span className="font-mono">{params.id}</span> не найдена.
            </p>
          </section>
        )}

        {appointment && (
          <>
            {/* ======= Основная информация ======= */}
            <section className="rounded-2xl border bg-white p-4 space-y-4">

              <div className="flex items-center justify-between gap-3">
                <div>
                  <h1 className="text-xl font-bold tracking-tight">
                    Карточка консультации
                  </h1>
                  <p className="text-sm text-gray-500">
                    Детальная информация по заявке и действия регистратуры.
                  </p>
                </div>

                <span
                  className={
                    "inline-flex rounded-full px-3 py-1 text-[11px] font-medium " +
                    statusBadgeClass(appointment.statusLabel)
                  }
                >
                  Статус: {appointment.statusLabel}
                </span>
              </div>

              <div className="grid gap-4 md:grid-cols-2">

                {/* Клиент */}
                <div className="space-y-3">
                  <div>
                    <div className="text-xs text-gray-500">ID заявки</div>
                    <div className="font-mono text-sm">{appointment.id}</div>
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
                      <div className="text-[11px] text-gray-400 mt-2">
                        Позже здесь появится привязка к owner_profiles.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Статус + формат связи */}
                <div className="space-y-3">
                  <div>
                    <h3 className="text-xs font-semibold uppercase text-gray-500">
                      Статус обработки
                    </h3>
                    <div className="rounded-xl bg-gray-50 p-3 text-sm space-y-2">
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
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-semibold uppercase text-gray-500">
                      Формат связи
                    </h3>
                    <div className="rounded-xl bg-gray-50 p-3 text-sm space-y-1">
                      <div className="text-xs text-gray-500">Платформа</div>
                      <div className="font-medium">
                        {appointment.videoPlatform === "yandex_telemost" ||
                        !appointment.videoPlatform
                          ? "Яндекс Телемост"
                          : appointment.videoPlatform}
                      </div>

                      {appointment.videoUrl ? (
                        <a
                          href={appointment.videoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-emerald-700 hover:underline"
                        >
                          Открыть ссылку
                        </a>
                      ) : (
                        <div className="text-[10px] text-gray-400">
                          Ссылка не указана.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            </section>

            {/* ======= Документы ======= */}
            <section className="rounded-2xl border bg-white p-4 space-y-4">

              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold">Документы</h2>

                <div className="flex gap-2 text-[10px] text-gray-500">
                  <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5">
                    Слева — документы клиники
                  </span>
                  <span className="inline-flex items-center rounded-full bg-gray-50 px-2 py-0.5">
                    Справа — документы клиента
                  </span>
                </div>
              </div>

              <RegistrarDocumentsBlock appointmentId={appointment.id} />
            </section>

            {/* ======= Питомец ======= */}
            <section className="rounded-2xl border bg-white p-4 space-y-4">

              <div className="flex.items-center justify-between">
                <h2 className="text-base font-semibold">Питомец</h2>

                <div className="flex gap-2 text-[10px] text-gray-500">
                  <span className="inline-flex.items-center rounded-full bg-gray-100 px-2 py-0.5">
                    Слева — питомец для работы регистратуры
                  </span>
                  <span className="inline-flex.items-center rounded-full bg-gray-50 px-2 py-0.5">
                    Справа — питомец из заявки клиента
                  </span>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">

                <RegistrarPetEditor
                  appointmentId={appointment.id}
                  ownerId={appointment.ownerId ?? null}
                  petId={appointment.petId ?? null}
                  petName={appointment.petName ?? null}
                  petSpecies={appointment.petSpecies ?? null}
                />

                <div className="rounded-xl bg-white.border border-dashed border-gray-200 p-3 text-sm">
                  <div className="font-medium">
                    {appointment.requestedPetName || "не указан"}
                  </div>
                  {appointment.requestedPetSpecies && (
                    <div className="text-xs text-gray-600">
                      {appointment.requestedPetSpecies}
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* ======= Врач ======= */}
            <section className="rounded-2xl border bg-white p-4 space-y-4">

              <div className="flex.items-center justify-between">
                <h2 className="text-base font-semibold">Врач</h2>

                <div className="flex gap-2 text-[10px] text-gray-500">
                  <span className="inline-flex.items-center rounded-full bg-gray-100 px-2 py-0.5">
                    Слева — назначенный врач
                  </span>
                  <span className="inline-flex.items-center rounded-full bg-gray-50 px-2 py-0.5">
                    Справа — врач из заявки клиента
                  </span>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">

                <RegistrarDoctorEditor
                  appointmentId={appointment.id}
                  doctorId={appointment.doctorId ?? null}
                />

                <div className="rounded-xl bg-white.border border-dashed border-gray-200 p-3 text-sm">
                  <div className="font-medium">
                    {appointment.requestedDoctorName || "клиент не выбрал врача"}
                  </div>
                </div>
              </div>
            </section>

            {/* ======= Расписание ======= */}
            <section className="rounded-2xl border bg-white p-4 space-y-4">

              <div className="flex.items-center justify-between">
                <h2 className="text-base font-semibold">Расписание консультации</h2>

                <div className="text-[11px] text-gray-500">
                  Сначала выбирают врача, затем ставят время
                </div>
              </div>

              <RegistrarAssignSlot
                appointmentId={appointment.id}
                doctorId={appointment.doctorId ?? null}
              />
            </section>

            {/* ======= Услуга ======= */}
            <section className="rounded-2xl border bg-white p-4 space-y-4">

              <div className="flex.items-center justify-between">
                <h2 className="text-base font-semibold">Услуга</h2>

                <div className="flex gap-2 text-[10px] text-gray-500">
                  <span className="inline-flex.items-center rounded-full bg-gray-100 px-2 py-0.5">
                    Слева — назначенная услуга
                  </span>
                  <span className="inline-flex.items-center rounded-full bg-gray-50 px-2 py-0.5">
                    Справа — услуга клиента
                  </span>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">

                <RegistrarServiceEditor
                  appointmentId={appointment.id}
                  serviceCode={appointment.serviceCode ?? null}
                />

                <div className="rounded-xl bg-white.border border-dashed border-gray-200 p-3 text-sm">
                  <div className="font-medium">
                    {appointment.requestedServiceName || "клиент не выбрал услугу"}
                  </div>
                </div>
              </div>
            </section>

            {/* ======= Жалоба ======= */}
            <section className="rounded-2xl border bg-white p-4 space-y-4">

              <div className="flex.items-center justify-between">
                <h2 className="text-base font-semibold">Жалоба / описание проблемы</h2>

                <div className="flex gap-2 text-[10px] text-gray-500">
                  <span className="inline-flex.items-center rounded-full bg-gray-100 px-2 py-0.5">
                    Слева — формулировка регистратуры
                  </span>
                  <span className="inline-flex.items-center rounded-full bg-gray-50 px-2 py-0.5">
                    Справа — текст клиента
                  </span>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">

                <RegistrarComplaintEditor
                  appointmentId={appointment.id}
                  complaint={appointment.complaint ?? null}
                  requestedComplaint={appointment.requestedComplaint ?? null}
                />

                <div className="rounded-xl bg-white.border border-dashed border-gray-200 p-3 text-sm whitespace-pre-line">
                  {appointment.requestedComplaint?.trim() ||
                    "Клиент не указал жалобу"}
                </div>
              </div>
            </section>

            {/* ======= Действия ======= */}
            <section className="rounded-2xl border bg-white p-4 space-y-4">
              <RegistrarActions
                appointmentId={appointment.id}
                currentStatus={appointment.statusLabel}
                initialCancellationReason={appointment.cancellationReason}
              />

              <p className="text-[11px] text-gray-400">
                Здесь позже появится история изменений.
              </p>
            </section>
          </>
        )}
      </main>
    </RoleGuard>
  );
}
