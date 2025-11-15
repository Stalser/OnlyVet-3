import Link from "next/link";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { RegistrarHeader } from "@/components/registrar/RegistrarHeader";
import { RegistrarActions } from "@/components/registrar/RegistrarActions";
import { getRegistrarAppointments } from "@/lib/registrar";

export default async function RegistrarQueuePage() {
  const all = await getRegistrarAppointments();
  const pending = all.filter(
    (a) => a.statusLabel.toLowerCase() === "запрошена"
  );

  return (
    <RoleGuard allowed={["registrar", "admin"]}>
      <main className="mx-auto max-w-6xl px-4 py-6 space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <Link
              href="/backoffice/registrar"
              className="text-xs text-gray-500 hover:text-gray-700 hover:underline"
            >
              ← В кабинет регистратуры
            </Link>
            <h1 className="mt-2 text-2xl font-bold tracking-tight">
              Очередь новых заявок
            </h1>
            <p className="text-sm text-gray-500">
              Заявки со статусом “запрошена”. Здесь регистратор может
              подтверждать, перенести или отменить обращения клиентов.
            </p>
          </div>
          <RegistrarHeader />
        </header>

        <section className="rounded-2xl border bg-white p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">
              Новых заявок: {pending.length}
            </h2>
          </div>

          {pending.length === 0 && (
            <p className="text-xs text-gray-400">
              Новых заявок нет. Все обращения либо уже обработаны, либо
              отсутствуют.
            </p>
          )}

          {pending.length > 0 && (
            <div className="space-y-4">
              {pending.map((a) => (
                <div
                  key={a.id}
                  className="rounded-2xl border border-gray-100 bg-gray-50 p-3 text-xs"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-gray-900">
                        {a.dateLabel}
                      </div>
                      {a.createdLabel && (
                        <div className="text-[10px] text-gray-500">
                          Создана: {a.createdLabel}
                        </div>
                      )}
                    </div>
                    <Link
                      href={`/backoffice/registrar/consultations/${a.id}`}
                      className="text-[11px] font-medium text-emerald-700 hover:underline"
                    >
                      Открыть карточку →
                    </Link>
                  </div>

                  <div className="grid gap-2 md:grid-cols-3">
                    {/* Клиент */}
                    <div>
                      <div className="text-[11px] font-semibold text-gray-700">
                        Клиент
                      </div>
                      <div className="text-[11px] text-gray-900">
                        {a.clientName || "Без имени"}
                      </div>
                      {a.clientContact && (
                        <div className="text-[10px] text-gray-600">
                          {a.clientContact}
                        </div>
                      )}
                    </div>

                    {/* Питомец */}
                    <div>
                      <div className="text-[11px] font-semibold text-gray-700">
                        Питомец
                      </div>
                      <div className="text-[11px] text-gray-900">
                        {a.petName || "Не указан"}
                      </div>
                      {a.petSpecies && (
                        <div className="text-[10px] text-gray-600">
                          {a.petSpecies}
                        </div>
                      )}
                    </div>

                    {/* Услуга / врач */}
                    <div>
                      <div className="text-[11px] font-semibold text-gray-700">
                        Услуга / врач
                      </div>
                      <div className="text-[11px] text-gray-900">
                        {a.serviceName}
                      </div>
                      <div className="text-[10px] text-gray-600">
                        {a.doctorName || "Врач не назначен"}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 border-t border-gray-200 pt-3">
                    <RegistrarActions
                      appointmentId={a.id}
                      currentStatus={a.statusLabel}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </RoleGuard>
  );
}
