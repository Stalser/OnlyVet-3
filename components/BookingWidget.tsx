"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

import { doctors } from "../lib/data";
import { servicesPricing } from "../lib/pricing";

export default function BookingWidget() {
  const searchParams = useSearchParams();

  // Автоподстановка из URL (повторная запись, переход с карточек и т.п.)
  const initialDoctor = searchParams.get("doctor") || "";
  const initialService = searchParams.get("service") || "";
  const initialPet = searchParams.get("pet") || "";
  const initialSpecies = searchParams.get("species") || "";

  const [doctorId, setDoctorId] = useState(initialDoctor);
  const [serviceCode, setServiceCode] = useState(initialService);
  const [petName, setPetName] = useState(initialPet);
  const [species, setSpecies] = useState(initialSpecies);
  const [contact, setContact] = useState("");
  const [comment, setComment] = useState("");
  const [time, setTime] = useState("");

  // Временные слоты — пока статический список, позже привяжем к расписанию врача
  const availableTimes = ["10:00", "11:00", "12:00", "14:00", "15:00", "16:00"];

  const canSubmit =
    doctorId &&
    serviceCode &&
    petName.trim() &&
    species.trim() &&
    contact.trim() &&
    time;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    // TODO: здесь позже сделаем реальную отправку в Supabase / Vetmanager
    alert(
      `Заявка отправлена:\nВрач: ${doctorId}\nУслуга: ${serviceCode}\nВремя: ${time}\nПитомец: ${petName} (${species})`
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-gray-200 bg-white p-4 space-y-4 text-sm text-gray-800"
    >
      <div className="space-y-1">
        <h2 className="font-medium text-base">Запись на консультацию</h2>
        <p className="text-xs text-gray-500">
          Выберите врача, услугу и удобное время — запрос уйдёт администратору.
        </p>
      </div>

      {/* ВРАЧ */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-500">Врач</label>
        <select
          value={doctorId}
          onChange={(e) => {
            setDoctorId(e.target.value);
          }}
          className="rounded-xl border border-gray-300 px-3 py-2 text-xs outline-none focus:border-black focus:ring-1 focus:ring-black bg-white"
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
      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-500">Услуга</label>
        <select
          value={serviceCode}
          onChange={(e) => setServiceCode(e.target.value)}
          className="rounded-xl border border-gray-300 px-3 py-2 text-xs outline-none focus:border-black focus:ring-1 focus:ring-black bg-white"
        >
          <option value="">Выберите услугу</option>
          {servicesPricing.map((s) => (
            <option key={s.code} value={s.code}>
              {s.name}
              {" — "}
              {s.price} ₽
            </option>
          ))}
        </select>

        {serviceCode && (
          <p className="text-[11px] text-gray-500">
            {
              servicesPricing.find((s) => s.code === serviceCode)
                ?.description
            }
          </p>
        )}
      </div>

      {/* ВРЕМЯ */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-500">Время</label>
        <select
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="rounded-xl border border-gray-300 px-3 py-2 text-xs outline-none focus:border-black focus:ring-1 focus:ring-black bg-white"
        >
          <option value="">Выберите время</option>
          {availableTimes.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {/* ПИТОМЕЦ */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-500">Имя питомца</label>
        <input
          value={petName}
          onChange={(e) => setPetName(e.target.value)}
          placeholder="Например, Мурзик"
          className="rounded-xl border border-gray-300 px-3 py-2 text-xs outline-none focus:border-black focus:ring-1 focus:ring-black"
        />
      </div>

      {/* Вид животного */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-500">Вид животного</label>
        <input
          value={species}
          onChange={(e) => setSpecies(e.target.value)}
          placeholder="кошка, собака..."
          className="rounded-xl border border-gray-300 px-3 py-2 text-xs outline-none focus:border-black focus:ring-1 focus:ring-black"
        />
      </div>

      {/* Контакт */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-500">Контакт для связи</label>
        <input
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder="Телефон или Telegram"
          className="rounded-xl border border-gray-300 px-3 py-2 text-xs outline-none focus:border-black focus:ring-1 focus:ring-black"
        />
      </div>

      {/* Комментарий */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-500">Комментарий</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Кратко опишите проблему, ранние диагнозы..."
          className="rounded-xl border border-gray-300 px-3 py-2 text-xs outline-none focus:border-black focus:ring-1 focus:ring-black min-h-[60px]"
        />
      </div>

      {/* Кнопка */}
      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full mt-2 rounded-xl px-4 py-3 bg-gray-800 text-white font-medium text-sm hover:bg-black disabled:opacity-50"
      >
        Записаться
      </button>

      <p className="text-[11px] text-gray-400 pt-1">
        Нажимая «Записаться», вы соглашаетесь на обработку персональных данных и условия договора.
      </p>
    </form>
  );
}
