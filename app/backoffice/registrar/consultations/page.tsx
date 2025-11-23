import Link from "next/link";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { RegistrarHeader } from "@/components/registrar/RegistrarHeader";
import { getRegistrarAppointments } from "@/lib/registrar";
import { RegistrarRecentConsultationsClient } from "@/components/registrar/RegistrarRecentConsultationsClient";

// ✅ Всегда отдаём свежие данные, без кэша
export const dynamic = "force-dynamic";

export default async function RegistrarConsultationsPage() {
  const appointments = await getRegistrarAppointments();

  return (
    <RoleGuard allowed={["registrar", "admin"]}>
      <main className="mx-auto max-w-6xl px-4 py-6 space-y-6">
        {/* Хлебные крошки */}
        <div>
          <Link
            href="/backoffice/registrar"
            className="text-xs text-gray-500 hover:text-gray-700 hover:underline"
          >
            ← В кабинет регистратуры
          </Link>
        </div>

        {/* Шапка страницы */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Все консультации и заявки
            </h1>
            <p className="text-sm text-gray-500">
              Полный список всех онлайн-консультаций с возможностью фильтрации
              по статусу, врачу и поиску.
            </p>
          </div>
          <RegistrarHeader />
        </header>

        {/* Клиентский компонент со списком консультаций */}
        <RegistrarRecentConsultationsClient appointments={appointments} />
      </main>
    </RoleGuard>
  );
}
