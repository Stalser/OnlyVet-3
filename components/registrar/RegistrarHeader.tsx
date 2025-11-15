"use client";

import { useCurrentUser } from "@/lib/useCurrentUser";

export function RegistrarHeader() {
  const { user, loading } = useCurrentUser();

  if (loading) {
    return (
      <div className="flex flex-col items-end gap-1 text-xs text-gray-500">
        <span>Загружаем данные сотрудника…</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-end gap-1 text-xs text-red-500">
        <span>Сотрудник не авторизован</span>
      </div>
    );
  }

  const isAdmin = user.role === "admin";
  const roleLabel =
    user.role === "registrar"
      ? "Регистратор"
      : user.role === "vet"
      ? "Врач"
      : isAdmin
      ? "Администратор"
      : "Пользователь";

  return (
    <div className="flex flex-col items-end gap-0.5 text-right">
      <div className="text-xs text-gray-500">Сейчас работает</div>
      <div className="text-sm font-semibold text-gray-900">
        {roleLabel}
      </div>
      <div className="text-[11px] text-gray-500">
        {user.email ?? "email не указан"}
      </div>
    </div>
  );
}
