import { RoleGuard } from "@/components/auth/RoleGuard";
import { RegistrarHeader } from "@/components/registrar/RegistrarHeader";
import { RegistrarScheduleClient } from "@/components/registrar/RegistrarScheduleClient";

export default function RegistrarSchedulePage() {
  return (
    <RoleGuard allowed={["registrar", "admin"]}>
      <main className="mx-auto max-w-6xl px-4 py-6 space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Расписание врачей
            </h1>
            <p className="text-sm text-gray-500">
              Управление слотами приёма для онлайн-консультаций.
            </p>
          </div>
          <RegistrarHeader />
        </header>

        <RegistrarScheduleClient />
      </main>
    </RoleGuard>
  );
}
