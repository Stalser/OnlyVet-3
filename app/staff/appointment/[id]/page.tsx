import Link from "next/link";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { StaffHeader } from "@/components/staff/StaffHeader";
import { StaffNav } from "@/components/staff/StaffNav";
import { getRegistrarAppointmentById } from "@/lib/registrar";

interface PageProps {
  params: {
    id: string;
  };
}

export default async function StaffAppointmentPage({ params }: PageProps) {
  const appointment = await getRegistrarAppointmentById(params.id);

  return (
    <RoleGuard allowed={["vet", "admin"]}>
      <main className="mx-auto max-w-4xl px-4 py-6 space-y-6">
        {/* Шапка */}
        <header className="flex items-center justify-between">
          <div>
            <Link
              href="/staff"
              className="text-xs text-gray-500 hover:text-gray-700 hover:underline"
            >
              ← В кабинет врача
            </Link>
            <h1 className="mt-2 text-xl font-bold tracking-tight">
              Онлайн-консультация
            </h1>
            <p className="text-sm text-gray-500">
              Информация о приёме и рабочее пространство врача.
            </p>
          </div>
          <StaffHeader />
        </header>

        <StaffNav />

        {/* дальше — твой текущий JSX карточки приёма без изменений */}
      </main>
    </RoleGuard>
  );
}
