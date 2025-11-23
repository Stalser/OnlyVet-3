// app/backoffice/registrar/consultations/page.tsx
import { RoleGuard } from "@/components/auth/RoleGuard";
import { RegistrarHeader } from "@/components/registrar/RegistrarHeader";
import { getRegistrarAppointments } from "@/lib/registrar";
import { RegistrarConsultationsClient } from "@/components/registrar/RegistrarConsultationsClient";

// ✅ Всегда отдаём свежие данные, без кэша
export const dynamic = "force-dynamic";

export default async function RegistrarConsultationsPage() {
  const appointments = await getRegistrarAppointments();

  return (
    <RoleGuard allowed={["registrar", "admin"]}>
      <main className="mx-auto max-w-6xl px-4 py-6 space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Все консультации и заявки
            </h1>
            <p className="text-sm text-gray-500">
              Полный список всех онлайн-консультаций с возможностью
              фильтрации по статусу, врачу и поиску.
            </p>
          </div>
          <RegistrarHeader />
        </header>

        <RegistrarConsultationsClient appointments={appointments} />
      </main>
    </RoleGuard>
  );
}
