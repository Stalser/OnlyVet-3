import { RoleGuard } from "@/components/auth/RoleGuard";

export default function RegistrarDashboardPage() {
  return (
    <RoleGuard allowed={["registrar", "admin"]}>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <h1 className="text-2xl font-bold tracking-tight">
          Кабинет регистратуры
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Здесь будет управление заявками, консультациями и расписанием
          врачей.
        </p>
      </main>
    </RoleGuard>
  );
}
