import { RoleGuard } from "@/components/auth/RoleGuard";

export default function RegistrarRoot() {
  return (
    <RoleGuard allowed={["registrar", "admin"]}>
      <main className="p-6">
        <h1 className="text-2xl font-bold">Кабинет регистратуры</h1>
        <p className="text-gray-600 mt-2">
          Здесь будут заявки, консультации, расписание врачей.
        </p>
      </main>
    </RoleGuard>
  );
}
