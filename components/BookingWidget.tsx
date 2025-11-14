"use client";

import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { doctors } from "../lib/data";
import { servicesPricing } from "../lib/pricing";
import { doctorSchedule } from "../lib/doctorSchedule";

export default function BookingWidget() {
  const searchParams = useSearchParams();

  // ===== Автоподстановка при повторной записи =====
  const initialDoctor = searchParams.get("doctor") || "";
  const initialService = searchParams.get("service") || "";
  const initialPet = searchParams.get("pet") || "";
  const initialSpecies = searchParams.get("species") || "";

  // ===== Состояния =====
  const [doctorId, setDoctorId] = useState(initialDoctor);
  const [serviceCode, setServiceCode] = useState(initialService);
  const [petName, setPetName] = useState(initialPet);
  const [species, setSpecies] = useState(initialSpecies);
  const [contact, setContact] = useState("");
  const [comment, setComment] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");

  // ===== Фильтр услуг по врачу =====
  const doctor = doctors.find((d) => d.id === doctorId);
  const doctorServices = doctor
    ? doctor.services
    : servicesPricing.map((s) => s.code);

  const services = servicesPricing.filter((s) =>
    doctorServices.includes(s.code)
  );

  // ===== Слоты времени врача =====
  const availableSlots = useMemo(() => {
    if (!doctorId) return [];
    return doctorSchedule[doctorId] || [];
  }, [doctorId]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 space-y-4 text-sm text-gray-800">
      <h2 className="font-medium mb-1 text-base">Запись на консультацию</h2>
      <p className="text-gray-500 text-xs">
        Выберите врача, услугу и удобное время. Запрос придёт администратору.
      </p>

      {/* ВРАЧ */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-500">Врач</label>
        <select
          value={doctorId}
          onChange={(e) => {
            setDoctorId(e.target.value);
            setSelectedSlot("");
          }}
          className="rounded-xl border-gray-300 text-sm"
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
          className="rounded-xl border-gray-300 text-sm"
        >
          <option value="">Выберите услугу</option>

          {services.map((s) => (
            <option key={s.code} value={s.code}>
              {s.name} — {s.price} ₽
            </option>
          ))}
        </select>

        {/* Описание услуги */}
        {serviceCode && (
          <p className="text-[11px] text-gray-500">
            {services.find((s) => s.code === serviceCode)?.description}
          </p>
        )}
      </div>

      {/* СВОБОДНЫЕ ВРЕМЕНА */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-500">Время</label>

        {!doctorId && (
          <p className="text-[11px] text-gray-400">
            Сначала выберите врача — затем появятся свободные слоты.
          </p>
        )}

        {doctorId && availableSlots.length === 0 && (
          <p className="text-[11px] text-gray-400">
            У выбранного врача нет свободных слотов.
          </p>
        )}

        {doctorId && availableSlots.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {availableSlots.map((slot) => (
              <button
                key={slot}
                onClick={() => setSelectedSlot(slot)}
                className={`px-3 py-1.5 rounded-xl border text-xs ${
                  selectedSlot === slot
                    ? "bg-black text-white border-black"
                    : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                }`}
              >
                {slot}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ФИО/Питомец */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-500">Имя питомца</label>
        <input
          value={petName}
          onChange={(e) => setPetName(e.target.value)}
          placeholder="Например, Мурзик"
          className="rounded-xl border-gray-300 text-sm"
        />
      </div>

      {/* Вид животного */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-500">Вид животного</label>
        <input
          value={species}
          onChange={(e) => setSpecies(e.target.value)}
          placeholder="кошка, собака..."
          className="rounded-xl border-gray-300 text-sm"
        />
      </div>

      {/* Контакт */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-500">Контакт для связи</label>
        <input
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder="Телефон или Telegram"
          className="rounded-xl border-gray-300 text-sm"
        />
      </div>

      {/* Комментарий */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-500">Комментарий</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Кратко опишите проблему, ранние диагнозы..."
          className="rounded-xl border-gray-300 text-sm"
          rows={3}
        />
      </div>

      {/* КНОПКА */}
      <button
        className="w-full mt-2 rounded-xl px-4 py-3 bg-gray-800 text-white font-medium text-sm hover:bg-black disabled:bg-gray-300"
        disabled={!selectedSlot || !serviceCode || !petName || !species}
      >
        Записаться
      </button>

      <p className="text-[11px] text-gray-400 pt-1">
        Нажимая «Записаться», вы соглашаетесь на обработку персональных данных.
      </p>
    </div>
  );
}
