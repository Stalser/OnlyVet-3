import { RoleGuard } from "@/components/auth/RoleGuard";
import { RegistrarHeader } from "@/components/registrar/RegistrarHeader";
import { getOwnersSummary } from "@/lib/clients";
import { RegistrarClientsClient } from "@/components/registrar/RegistrarClientsClient";

export default async function RegistrarClientsPage() {
  const owners = await getOwnersSummary();

  return (
    <RoleGuard allowed={["registrar", "admin"]}>
      <main className="mx-auto max-w-6xl px-4 py-6 space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Картотека клиентов
            </h1>
            <p className="text-sm text-gray-500">
              Список всех клиентов сервиса с информацией о питомцах и
              консультациях.
            </p>
          </div>
          <RegistrarHeader />
        </header>

        <RegistrarClientsClient owners={owners} />
      </main>
    </RoleGuard>
  );
}
