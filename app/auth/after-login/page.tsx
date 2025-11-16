"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/lib/useCurrentUser";

export default function AfterLoginPage() {
  const router = useRouter();
  const { user, loading } = useCurrentUser();

  useEffect(() => {
    if (loading) return;

    // не залогинен – на логин
    if (!user) {
      router.replace("/auth/login");
      return;
    }

    // базовая роль из user
    let effectiveRole = user.role ?? "client";
    const email = (user.email ?? "").toLowerCase();

    // 💡 временное правило:
    // doctor@onlyvet.com считаем врачом (vet),
    // даже если в БД роль ещё не прописана как vet
    if (email === "doctor@onlyvet.com") {
      effectiveRole = "vet";
    }

    // логика маршрутов по ролям
    switch (effectiveRole) {
      case "registrar":
        router.replace("/backoffice/registrar");
        break;
      case "admin":
        // можно сделать отдельный кабинет админа,
        // пока направим туда же
        router.replace("/backoffice/registrar");
        break;
      case "vet":
        router.replace("/staff");
        break;
      case "client":
      default:
        router.replace("/account");
        break;
    }
  }, [user, loading, router]);

  return (
    <main className="flex min-h-[60vh] items-center justify-center">
      <div className="rounded-2xl border bg-white px-4 py-3 text-sm text-gray-500 shadow-sm">
        Определяем роль пользователя…
      </div>
    </main>
  );
}
