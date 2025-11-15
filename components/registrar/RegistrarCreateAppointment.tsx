"use client";

import { FormEvent, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { doctors } from "@/lib/data";
import { servicesPricing } from "@/lib/pricing";
import { useRouter } from "next/navigation";

export function RegistrarCreateAppointment() {
  const router = useRouter();

  const [doctorId, setDoctorId] = useState<string>(
    doctors[0]?.id ?? ""
  );
  const [serviceCode, setServiceCode] = useState<string>(
    servicesPricing[0]?.code ?? ""
  );
  const [clientName, setClientName] = useState(""); // пока не используем в БД
  const [clientContact, setClientContact] = useState(""); // тоже
  const [petName, setPetName] = useState("");
  const [petSpecies, setPetSpecies] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    null
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!supabase) {
      setErrorMessage("Supabase недоступен на клиенте.");
      return;
    }

    if (!serviceCode || !date || !time) {
      setErrorMessage(
        "Заполните услугу, дату и время. Остальные поля — по возможности."
      );
      return;
    }

    setSaving(true);
    setErrorMessage(null);

    // Собираем дату/время в один timestamptz
    // (для простоты используем локальную зону, Supabase примет ISO-строку)
    const startsAt = new Date(`${date}T${time}`);

    const { data, error } = await supabase
      .from("appointments")
      .insert({
        // user_id, owner_id, doctor_id можно добавить позже, когда привяжем к реальным сущностям
        starts_at: startsAt.toISOString(),
        status: "запрошена",
        pet_name: petName || null,
        species: petSpecies || null,
        service_code: serviceCode,
      })
      .select("id")
      .single();

    if (error || !data) {
      console.error(error);
      setErrorMessage("Не удалось создать консультацию. Попробуйте ещё раз.");
      setSaving(false);
      return;
    }

    // Сбрасываем форму
    setClientName("");
    setClientContact("");
    setPetName("");
    setPetSpecies("");
    setDate("");
    setTime("");

    setSaving(false);

    // Обновляем список и переходим на карточку
    router.refresh();
    router.push(`/backoffice/registrar/consultations/${data.id}`);
  };

  return (
    <section className="rounded-2xl border bg-white p-4 space-y-4">
      <h2 className="text-base font-semibold">
        Создать новую консультацию
      </h2>
      <p className="text-xs text-gray-500">
        Регистратор может вручную создать запись: по звонку, мессенджеру
        или при обращении постоянного клиента. Позже здесь появится
        привязка к карточке клиента и пациента.
      </p>

      {errorMessage && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {errorMessage}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="grid gap-3 md:grid-cols-2"
      >
        {/* Клиент (пока только визуально, в БД не сохраняем) */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-gray-700">
            Клиент (пока без сохранения в БД)
          </div>
          <div className="space-y-2">
            <div>
              <label className="mb-1 block text-[11px] text-gray-500">
                Имя клиента
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full rounded-xl border px-2 py-1.5 text-xs"
                placeholder="Например, Иван Иванов"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-gray-500">
                Контакт (телефон / e-mail / Telegram)
              </label>
              <input
                type="text"
                value={clientContact}
                onChange={(e) => setClientContact(e.target.value)}
                className="w-full rounded-xl border px-2 py-1.5 text-xs"
                placeholder="+7..., @username, email..."
              />
            </div>
          </div>
        </div>

        {/* Питомец */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-gray-700">
            Питомец
          </div>
          <div className="space-y-2">
            <div>
              <label className="mb-1 block text-[11px] text-gray-500">
                Имя питомца
              </label>
              <input
                type="text"
                value={petName}
                onChange={(e) => setPetName(e.target.value)}
                className="w-full rounded-xl border px-2 py-1.5 text-xs"
                placeholder="Например, Мурзик"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-gray-500">
                Вид / порода
              </label>
              <input
                type="text"
                value={petSpecies}
                onChange={(e) => setPetSpecies(e.target.value)}
                className="w-full rounded-xl border px-2 py-1.5 text-xs"
                placeholder="Кошка, шотландская; Собака, корги..."
              />
            </div>
          </div>
        </div>

        {/* Врач и услуга (пока только услуга уходит в БД) */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-gray-700">
            Врач и услуга
          </div>
          <div className="space-y-2">
            <div>
              <label className="mb-1 block text-[11px] text-gray-500">
                Врач (пока только визуально)
              </label>
              <select
                value={doctorId}
                onChange={(e) => setDoctorId(e.target.value)}
                className="w-full rounded-xl border px-2 py-1.5 text-xs"
              >
                {doctors.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-gray-500">
                Услуга
              </label>
              <select
                value={serviceCode}
                onChange={(e) => setServiceCode(e.target.value)}
                className="w-full rounded-xl border px-2 py-1.5 text-xs"
              >
                {servicesPricing.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Дата и время */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-gray-700">
            Дата и время
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-[11px] text-gray-500">
                Дата
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border px-2 py-1.5 text-xs"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-gray-500">
                Время
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full rounded-xl border px-2 py-1.5 text-xs"
              />
            </div>
          </div>

          <div className="pt-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {saving
                ? "Создаём консультацию…"
                : "Создать консультацию"}
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}
