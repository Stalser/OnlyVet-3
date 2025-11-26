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
import { RegistrarPaymentsBlock } from "@/components/registrar/RegistrarPaymentsBlock";
import { RegistrarVideoEditor } from "@/components/registrar/RegistrarVideoEditor";

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

        {/* Если не нашли заявку */}
        {!appointment && (
          <section className="rounded-2xl border bg-white p-4">
            <p className="text-sm text-gray-500">
              Консультация с идентификатором{" "}
              <span className="font-mono">{params.id}</span> не найдена.
            </p>
          </section>
        )}

        {/* Если заявка найдена */}
        {appointment && (
          <>
            {/* ======= Основная информация ======= */}
<section className="rounded-2xl border bg-white p-4 space-y-4">
  {/* Заголовок + статус */}
  <div className="flex flex-wrap items-center justify-between gap-3">
    <div>
      <h1 className="text-xl font-bold tracking-tight">
        Карточка консультации
      </h1>
      <p className="text-sm text-gray-500">
        Заявка клиента и рабочие действия регистратуры.
      </p>
    </div>

    <span
      className={
        "inline-flex items-center rounded-full px-3 py-1 text-[11px] font-medium " +
        statusBadgeClass(appointment.statusLabel)
      }
    >
      Статус: {appointment.statusLabel}
    </span>
  </div>

  {/* Две колонки: слева клиент/документы, справа статус обработки и формат связи */}
  <div className="grid gap-4 md:grid-cols-2">
    {/* Левая колонка: ID + Клиент + Документы/оплата */}
    <div className="space-y-3">
      {/* ID заявки */}
      <div>
        <div className="text-xs text-gray-500">ID заявки</div>
        <div className="font-mono text-sm text-gray-900">
          {appointment.id}
        </div>
      </div>

      {/* Клиент */}
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
            В будущем здесь будет явная привязка к карточке клиента из
            owner_profiles.
          </div>
        </div>
      </div>

      {/* Документы и оплата */}
      <div>
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
          <div className="text-[11px] text-gray-400">
            Ниже можно открыть список документов и платежей по этой
            консультации.
          </div>
        </div>
      </div>
    </div>

    {/* Правая колонка: статус обработки + формат связи */}
    <div className="space-y-3">
      {/* Статус обработки */}
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
          <div className="text-[11px] text-gray-400">
            Изменения статуса и причины отмены будут отображаться в
            истории изменений.
          </div>
        </div>
      </div>

      {/* Формат связи */}
      <div>
        <h3 className="text-xs font-semibold uppercase text-gray-500">
          Формат связи
        </h3>
        <div className="rounded-xl bg-gray-50 p-3 text-sm">
          <RegistrarVideoEditor
            appointmentId={appointment.id}
            videoPlatform={appointment.videoPlatform ?? null}
            videoUrl={appointment.videoUrl ?? null}
          />
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
            {/* ======= Оплата по приёму ======= */}
<section className="rounded-2xl border bg-white p-4 space-y-4">
  <h2 className="text-base font-semibold">Оплата по приёму</h2>
  <RegistrarPaymentsBlock appointmentId={appointment.id} />
</section>
            {/* ======= Питомец ======= */}
            <section className="rounded-2xl border bg-white p-4 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-base font-semibold">Питомец</h2>
                <div className="flex flex-wrap gap-2 text-[10px] text-gray-500">
                  <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5">
                    Слева — питомец для работы регистратуры
                  </span>
                  <span className="inline-flex items-center rounded-full bg-gray-50 px-2 py-0.5">
                    Справа — питомец из заявки клиента
                  </span>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {/* Регистратура */}
                <div className="space-y-1">
                  <RegistrarPetEditor
                    appointmentId={appointment.id}
                    ownerId={appointment.ownerId ?? null}
                    petId={appointment.petId ?? null}
                    petName={appointment.petName ?? null}
                    petSpecies={appointment.petSpecies ?? null}
                  />
                </div>

                {/* Клиент */}
                <div className="space-y-1">
                  <div className="text-xs font-semibold uppercase text-gray-500">
                    Питомец из заявки клиента
                  </div>
                  <div className="rounded-xl bg-white border border-dashed border-gray-200 p-3 text-sm space-y-1">
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
                </div>
              </div>
            </section>

            {/* ======= Врач ======= */}
            <section className="rounded-2xl border bg-white p-4 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-base font-semibold">Врач</h2>
                <div className="flex flex-wrap gap-2 text-[10px] text-gray-500">
                  <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5">
                    Слева — назначенный врач
                  </span>
                  <span className="inline-flex items-center.rounded-full bg-gray-50 px-2.py-0.5">
                    Справа — врач из заявки клиента
                  </span>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {/* Регистратура */}
                <div className="space-y-1">
                  <RegistrarDoctorEditor
                    appointmentId={appointment.id}
                    doctorId={appointment.doctorId ?? null}
                  />
                </div>

                {/* Клиент */}
                <div className="space-y-1">
                  <div className="text-xs font-semibold.uppercase text-gray-500">
                    Врач из заявки клиента
                  </div>
                  <div className="rounded-xl bg-white border border-dashed.border-gray-200 p-3 text-sm">
                    <div className="font-medium">
                      {appointment.requestedDoctorName ||
                        "клиент не выбрал врача"}
                    </div>
                    <div className="text-[10px] text-gray-400 mt-1">
                      Это желаемый врач со стороны клиента. Регистратура может
                      назначить другого врача слева.
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* ======= Расписание консультации ======= */}
            <section className="rounded-2xl border bg-white p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-base font-semibold">
                  Расписание консультации
                </h2>
                <div className="text-[11px] text-gray-500">
                  Обычно сначала выбирают врача, затем назначают дату и время
                </div>
              </div>

              <div className="space-y-2">
                <RegistrarAssignSlot
                  appointmentId={appointment.id}
                  doctorId={appointment.doctorId ?? null}
                />
              </div>

              <p className="text-[11px] text-gray-400">
                Эти настройки определяют, когда и с кем фактически пройдёт
                консультация. Данные будут видны врачу в его рабочем кабинете.
              </p>
            </section>

            {/* ======= Услуга ======= */}
            <section className="rounded-2xl border bg-white p-4 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-base font-semibold">Услуга</h2>
                <div className="flex flex-wrap gap-2 text-[10px] text-gray-500">
                  <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5">
                    Слева — услуга, назначенная клиникой
                  </span>
                  <span className="inline-flex items-center rounded-full bg-gray-50 px-2 py-0.5">
                    Справа — услуга из заявки клиента
                  </span>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {/* Регистратура */}
                <div className="space-y-1">
                  <RegistrarServiceEditor
                    appointmentId={appointment.id}
                    serviceCode={appointment.serviceCode ?? null}
                  />
                </div>

                {/* Клиент */}
                <div className="space-y-1">
                  <div className="text-xs font-semibold uppercase text-gray-500">
                    Услуга из заявки клиента
                  </div>
                  <div className="rounded-xl bg-white border border-dashed.border-gray-200 p-3 text-sm">
                    <div className="font-medium">
                      {appointment.requestedServiceName ||
                        "клиент не выбрал услугу"}
                    </div>
                    <div className="text-[10px] text-gray-400 mt-1">
                      Это исходный выбор клиента. Регистратура может назначить
                      другую услугу слева.
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* ======= Жалоба ======= */}
            <section className="rounded-2xl border bg-white p-4 space-y-4">
              <div className="flex flex-wrap.items-center justify-between gap-3">
                <h2 className="text-base font-semibold">
                  Жалоба / описание проблемы
                </h2>
                <div className="flex flex-wrap gap-2 text-[10px] text-gray-500">
                  <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5">
                    Слева — формулировка регистратуры
                  </span>
                  <span className="inline-flex items-center rounded-full bg-gray-50 px-2 py-0.5">
                    Справа — текст клиента
                  </span>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {/* Регистратура */}
                <div className="space-y-1">
                  <RegistrarComplaintEditor
                    appointmentId={appointment.id}
                    complaint={appointment.complaint ?? null}
                    requestedComplaint={appointment.requestedComplaint ?? null}
                  />
                </div>

              {/* Клиент */}
                <div className="space-y-1">
                  <div className="text-xs font-semibold uppercase text-gray-500">
                    Писал клиент при записи
                  </div>
                  <div className="rounded-xl bg-white border border-dashed border-gray-200 p-3 text-sm min-h-[60px] whitespace-pre-line">
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
            <section className="rounded-2xl border bg-white p-4 space-y-4">
              <RegistrarActions
                appointmentId={appointment.id}
                currentStatus={appointment.statusLabel}
                initialCancellationReason={appointment.cancellationReason}
              />

              <p className="text-[11px] text-gray-400">
                Позже здесь появится история изменений по заявке (кто и когда
                изменил статус, врача, услугу или жалобу).
              </p>
            </section>
          </>
        )}
      </main>
    </RoleGuard>
  );
}
