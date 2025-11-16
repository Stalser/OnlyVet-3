import { RoleGuard } from "@/components/auth/RoleGuard";
import { RegistrarHeader } from "@/components/registrar/RegistrarHeader";
import { StaffNav } from "@/components/staff/StaffNav";

export default function StaffProfilePage() {
  return (
    <RoleGuard allowed={["vet", "admin"]}>
      <main className="mx-auto max-w-6xl px-4 py-6 space-y-6">
        {/* Шапка */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Профиль врача
            </h1>
            <p className="text-sm text-gray-500">
              Скелет профиля. Позже здесь можно будет редактировать личные
              данные, расписание и уведомления.
            </p>
          </div>
          <RegistrarHeader />
        </header>

        {/* Горизонтальное меню врача */}
        <StaffNav />

        {/* Основной блок профиля */}
        <section className="rounded-2xl border bg-white p-4 space-y-4">
          <h2 className="text-base font-semibold">
            Основная информация (скелет)
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Левые поля */}
            <div className="space-y-3">
              <div>
                <div className="text-[11px] text-gray-500 mb-1">
                  ФИО врача
                </div>
                <div className="rounded-xl border bg-gray-50 px-3 py-2 text-sm text-gray-800">
                  Здесь будет ФИО врача, привязанного к этому аккаунту.
                </div>
              </div>

              <div>
                <div className="text-[11px] text-gray-500 mb-1">
                  Специализация
                </div>
                <div className="rounded-xl border bg-gray-50 px-3 py-2 text-sm text-gray-800">
                  Например: терапия, кардиология, дерматология. Позже
                  подтянем из общей базы врачей.
                </div>
              </div>

              <div>
                <div className="text-[11px] text-gray-500 mb-1">
                  Контакты
                </div>
                <div className="rounded-xl border bg-gray-50 px-3 py-2 text-xs text-gray-700 space-y-1">
                  <div>E-mail: будет взят из учётной записи</div>
                  <div>Телефон: можно будет настроить позже</div>
                  <div>Telegram: можно будет указать позже</div>
                </div>
              </div>
            </div>

            {/* Правый блок: будущее редактирование */}
            <div className="space-y-3">
              <div>
                <div className="text-[11px] text-gray-500 mb-1">
                  Расписание и график работы
                </div>
                <div className="rounded-xl border bg-gray-50 px-3 py-2 text-xs text-gray-700 space-y-1">
                  <p>
                    В будущем здесь можно будет настраивать личный график
                    работы: рабочие дни, окна для онлайн-приёмов, отпуска,
                    недоступность и т.п.
                  </p>
                  <p>
                    Пока расписанием полностью управляет регистратура.
                  </p>
                </div>
              </div>

              <div>
                <div className="text-[11px] text-gray-500 mb-1">
                  Уведомления
                </div>
                <div className="rounded-xl border bg-gray-50 px-3 py-2 text-xs text-gray-700 space-y-1">
                  <p>
                    Здесь появятся настройки уведомлений: e-mail, Telegram,
                    напоминания перед приёмом, уведомления об изменениях в
                    расписании.
                  </p>
                  <p>
                    Сейчас уведомления могут настроить только через
                    регистратуру или общие системные настройки.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <p className="text-[10px] text-gray-400 pt-1">
            Этот раздел пока носит ознакомительный характер и служит для
            того, чтобы врач видел структуру будущего личного кабинета.
            Логика привязки реальных данных и сохранения настроек будет
            добавлена позже.
          </p>
        </section>
      </main>
    </RoleGuard>
  );
}
