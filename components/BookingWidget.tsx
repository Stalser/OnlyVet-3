"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { doctors } from "../lib/data";
import {
  servicesPricing,
  doctorServicesMap,
  PriceItem,
} from "../lib/pricing";
import {
  doctorSlots,
  getDoctorDates,
  getDoctorSlotsForDate,
} from "../lib/doctorSchedule";

type Doctor = (typeof doctors)[number];

export default function BookingWidget() {
  const searchParams = useSearchParams();
  const initialDoctorId = searchParams.get("doctor") || "";
  const initialServiceCode = searchParams.get("service") || "";

  const [doctorId, setDoctorId] = useState(initialDoctorId);
  const [serviceCode, setServiceCode] = useState(initialServiceCode);
  const [date, setDate] = useState("");
  const [slotId, setSlotId] = useState("");

  const [ownerName, setOwnerName] = useState("");       // ФИО клиента
  const [species, setSpecies] = useState("");           // Вид животного
  const [petName, setPetName] = useState("");

  const [email, setEmail] = useState("");
  const [contact, setContact] = useState("");
  const [comment, setComment] = useState("");

  const [agreePersonal, setAgreePersonal] = useState(false);
  const [agreeContract, setAgreeContract] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const selectedDoctor: Doctor | undefined = useMemo(
    () => doctors.find((d) => d.id === doctorId),
    [doctorId]
  );

  const allowedServices: PriceItem[] = useMemo(() => {
    if (!doctorId) return servicesPricing;
    const codes = doctorServicesMap[doctorId] || [];
    return servicesPricing.filter((s) => codes.includes(s.code));
  }, [doctorId]);

  const selectedService = useMemo(
    () => allowedServices.find((s) => s.code === serviceCode),
    [allowedServices, serviceCode]
  );

  const availableDates = useMemo(() => {
    if (!doctorId) return [] as string[];
    return getDoctorDates(doctorId);
  }, [doctorId]);

  const dateSlots = useMemo(() => {
    if (!doctorId || !date) return [] as typeof doctorSlots;
    return getDoctorSlotsForDate(doctorId, date);
  }, [doctorId, date]);

  const canSubmit =
    !!doctorId &&
    !!serviceCode &&
    !!date &&
    !!slotId &&
    ownerName.trim() &&
    petName.trim() &&
    species.trim() &&
    email.trim() &&
    contact.trim() &&
    agreePersonal &&
    agreeContract &&
    !sending;

  function handleDoctorChange(id: string) {
    setDoctorId(id);
    setDate("");
    setSlotId("");
    // если выбранная услуга не подходит новому врачу – сбрасываем
    if (serviceCode && doctorServicesMap[id]) {
      const codes = doctorServicesMap[id];
      if (!codes.includes(serviceCode)) {
        setServiceCode("");
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setSending(true);
    setResult(null);

    try {
      // здесь позже будет реальный запрос в БД / Vetmanager
      await new Promise((resolve) => setTimeout(resolve, 800));
      setResult(
        "Запрос отправлен. Администратор свяжется с вами для подтверждения времени."
      );
      setOwnerName("");
      setSpecies("");
      setPetName("");
      setEmail("");
      setContact("");
      setComment("");
      setSlotId("");
      setDate("");
    } catch {
      setResult("Не удалось отправить запрос. Попробуйте ещё раз.");
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-sm text-gray-800">
      <div className="space-y-1">
        <h2 className="font-semibold text-base">Запись на консультацию</h2>
        <p className="text-xs text-gray-500">
          Опишите проблему, выберите врача, услугу и удобное время — запрос
          уйдёт администратору.
        </p>
      </div>

      {/* ВРАЧ */}
      <div className="space-y-1">
        <label className="block text-xs font-medium text-gray-700">
          Врач
        </label>
        <select
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs outline-none focus:border-black focus:ring-1 focus:ring-black bg-white"
          value={doctorId}
          onChange={(e) => handleDoctorChange(e.target.value)}
        >
          <option value="">Любой врач</option>
          {doctors.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name} — {d.speciality}
            </option>
          ))}
        </select>
      </div>

      {/* УСЛУГА */}
      <div className="space-y-1">
        <label className="block text-xs font-medium text-gray-700">
          Услуга
        </label>
        <select
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs outline-none focus:border-black focus:ring-1 focus:ring-black bg-white"
          value={serviceCode}
          onChange={(e) => setServiceCode(e.target.value)}
        >
          <option value="">Выберите услугу</option>
          {allowedServices.map((s) => (
            <option key={s.code} value={s.code}>
              {s.name}
              {s.priceRUB
                ? ` — ${s.priceRUB.toLocaleString("ru-RU")} ₽`
                : ""}
            </option>
          ))}
        </select>
        {selectedService && (
          <p className="text-[11px] text-gray-500 mt-1">
            {selectedService.description}
          </p>
        )}
      </div>

      {/* ДАТА */}
      <div className="space-y-1">
        <label className="block text-xs font-medium text-gray-700">
          Дата
        </label>
        {doctorId ? (
          availableDates.length ? (
            <select
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs outline-none focus:border-black focus:ring-1 focus:ring-black bg-white"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setSlotId("");
              }}
            >
              <option value="">Выберите дату</option>
              {availableDates.map((d) => (
                <option key={d} value={d}>
                  {new Date(d).toLocaleDateString("ru-RU", {
                    weekday: "short",
                    day: "numeric",
                    month: "long",
                  })}
                </option>
              ))}
            </select>
          ) : (
            <p className="text-[11px] text-gray-500">
              Для выбранного врача пока нет свободных дат.
            </p>
          )
        ) : (
          <p className="text-[11px] text-gray-500">
            Сначала выберите врача — затем появятся доступные даты.
          </p>
        )}
      </div>

      {/* ВРЕМЯ */}
      <div className="space-y-1">
        <label className="block text-xs font-medium text-gray-700">
          Время
        </label>
        {doctorId && date ? (
          dateSlots.length ? (
            <select
              className="w-full rounded-xl border border-gray-200 px-3.py-2 text-xs outline-none.focus:border-black focus:ring-1 focus:ring-black bg-white"
              value={slotId}
              onChange={(e) => setSlotId(e.target.value)}
            >
              <option value="">Выберите время</option>
              {dateSlots.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.time}
                </option>
              ))}
            </select>
          ) : (
            <p className="text-[11px] text-gray-500">
              На выбранную дату нет свободных слотов.
            </p>
          )
        ) : (
          <p className="text-[11px] text-gray-500">
            Сначала выберите врача и дату.
          </p>
        )}
      </div>

      {/* ДАННЫЕ КЛИЕНТА И ПАЦИЕНТА */}
      <div className="grid gap-3">
        {/* ФИО клиента */}
        <div className="space-y-1">
          <label className="block text-xs.font-medium text-gray-700">
            ФИО клиента <span className="text-red-500">*</span>
          </label>
          <input
            required
            className="w-full rounded-xl border border-gray-200 px-3.py-2 text-xs outline-none focus:border-black focus:ring-1 focus:ring-black"
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
            placeholder="Например, Иванова Анна Сергеевна"
          />
        </div>

        {/* Вид животного */}
        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-700">
            Вид животного <span className="text-red-500">*</span>
          </label>
          <select
            required
            className="w-full rounded-xl border border-gray-200 px-3.py-2 text-xs outline-none.focus:border-black focus:ring-1 focus:ring-black bg-white"
            value={species}
            onChange={(e) => setSpecies(e.target.value)}
          >
            <option value="">Выберите вид</option>
            <option value="кошка">Кошка</option>
            <option value="собака">Собака</option>
            <option value="другое">Другое животное</option>
          </select>
        </div>

        {/* Имя питомца */}
        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-700">
            Имя питомца <span className="text-red-500">*</span>
          </label>
          <input
            required
            className="w-full rounded-xl border border-gray-200 px-3.py-2 text-xs outline-none.focus:border-black focus:ring-1 focus:ring-black"
            value={petName}
            onChange={(e) => setPetName(e.target.value)}
            placeholder="Например, Мурзик"
          />
        </div>

        {/* Email */}
        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-700">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            required
            className="w-full rounded-xl border border-gray-200 px-3.py-2 text-xs outline-none.focus:border-black focus:ring-1 focus:ring-black"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>

        {/* Контакт для связи */}
        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-700">
            Контакт для связи <span className="text-red-500">*</span>
          </label>
          <input
            required
            className="w-full rounded-xl border border-gray-200 px-3.py-2 text-xs outline-none.focus:border-black focus:ring-1 focus:ring-black"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="Телефон или Telegram"
          />
        </div>

        {/* Комментарий */}
        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-700">
            Комментарий
          </label>
          <textarea
            className="w-full rounded-xl border border-gray-200 px-3.py-2 text-xs outline-none focus:border-black focus:ring-1 focus:ring-black min-h-[60px]"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Кратко опишите проблему, ранее поставленные диагнозы..."
          />
        </div>
      </div>

      {/* ГАЛОЧКИ */}
      <div className="space-y-2 text-[11px] text-gray-600">
        <label className="flex items-start gap-2">
          <input
            type="checkbox"
            checked={agreePersonal}
            onChange={(e) => setAgreePersonal(e.target.checked)}
            className="mt-0.5"
          />
          <span>
            Согласен(на) на обработку персональных данных согласно{" "}
            <a
              href="/docs"
              className="text-blue-600 underline underline-offset-2"
              target="_blank"
            >
              политике конфиденциальности
            </a>
            .
          </span>
        </label>

        <label className="flex items-start gap-2">
          <input
            type="checkbox"
            checked={agreeContract}
            onChange={(e) => setAgreeContract(e.target.checked)}
            className="mt-0.5"
          />
          <span>
            Записываясь на консультацию, подтверждаю, что ознакомлен(а) с{" "}
            <a
              href="/docs"
              className="text-blue-600 underline underline-offset-2"
              target="_blank"
            >
              договором на оказание услуг
            </a>
            .
          </span>
        </label>
      </div>

      {result && (
        <div className="rounded-xl bg-emerald-50 px-3.py-2 text-[11px] text-emerald-700">
          {result}
        </div>
      )}

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full rounded-xl bg-black text-white text-sm font-medium py-2.5 mt-2 disabled:opacity-40"
      >
        {sending ? "Отправляем..." : "Записаться"}
      </button>
    </form>
  );
}
