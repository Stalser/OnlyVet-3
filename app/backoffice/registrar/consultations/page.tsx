// app/backoffice/registrar/consultations/page.tsx
import Link from "next/link";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { RegistrarHeader } from "@/components/registrar/RegistrarHeader";
import { getRegistrarAppointments } from "@/lib/registrar";
import { RegistrarConsultationsClient } from "@/components/registrar/RegistrarConsultationsClient";

// Всегда отдаём свежие данные, без кэша
export const dynamic = "force-dynamic";

export default async function RegistrarConsultationsPage() {
  const appointments = await getRegistrarAppointments();

  return (
    <RoleGuard allowed={["registrar", "admin"]}>
      <main className="mx-auto max-w-7xl px-6 py-6 space-y-6">
        {/* Навигация назад */}
        <div>
          <Link
            href="/backoffice/registrar"
            className="text-xs text-gray-500 hover:text-gray-700 hover:underline"
          >
            ← В кабинет регистратуры
          </Link>
        </div>

        {/* Шапка */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Все консультации и заявки
            </h1>
            <p className="text-sm text-gray-500">
              Полный список всех онлайн-консультаций с возможностью фильтрации
              по статусу, врачу, услуге, жалобе и документам.
            </p>
          </div>
          <RegistrarHeader />
        </header>

        {/* Основная таблица */}
        <RegistrarConsultationsClient appointments={appointments} />
      </main>
    </RoleGuard>
  );
}
