"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import {
  useEffect,
  useState,
  useRef,
  type ChangeEvent,
} from "react";

import {
  appointments,
  type Appointment,
} from "../../../../lib/appointments";
import {
  mockMedicalDocs,
  type MedicalDocument,
} from "../../../../lib/medicalDocs";
import { supabase } from "../../../../lib/supabaseClient";

type PageProps = {
  params: { id: string };
};

export default function StaffAppointmentWorkspace({ params }: PageProps) {
  const sourceAppointment = appointments.find((a) => a.id === params.id);

  if (!sourceAppointment) {
    return notFound();
  }

  const [status, setStatus] = useState<Appointment["status"]>(
    sourceAppointment.status
  );
  const [savingStatus, setSavingStatus] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  const docs = mockMedicalDocs.filter(
    (d) => d.appointmentId === sourceAppointment.id
  );

  const dateLabel = `${sourceAppointment.date} в ${sourceAppointment.time}`;
  const hasPersonalAccount = !!sourceAppointment.userId;

  const handleFinish = async () => {
    if (status === "завершена") return;

    setSavingStatus(true);
    setStatusError(null);
    setStatus("завершена");

    if (!supabase) {
      console.warn(
        "[OnlyVet] Supabase не сконфигурирован, статус изменён только в UI"
      );
      setSavingStatus(false);
      return;
    }

    try {
      const { error } = await supabase!
        .from("appointments")
        .update({ status: "завершена" })
        .eq("id", sourceAppointment.id);

      if (error) {
        console.error(error);
        setStatusError(
          "Не удалось сохранить статус в базе. Попробуйте позже."
        );
      }
    } catch (e: any) {
      console.error(e);
      setStatusError("Ошибка при обновлении статуса.");
    } finally {
      setSavingStatus(false);
    }
  };

  return (
    <main className="bg-slate-50 min-h-screen py-12">
      <div className="container space-y-6">
        <div className="text-xs text-gray-500 flex justify-between.items-center">
          <Link href="/staff" className="hover:text-gray-800">
            ← Назад в кабинет сотрудника
          </Link>
          <span className="text-gray-400">Приём #{sourceAppointment.id}</span>
        </div>

        {/* Шапка */}
        <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold">
              Консультация: {sourceAppointment.petName} (
              {sourceAppointment.species})
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {dateLabel} · {sourceAppointment.serviceName}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Текущий статус:{" "}
              <span className="font-medium">{status}</span>
            </p>
            {statusError && (
              <p className="text-xs text-red-600 mt-1">{statusError}</p>
            )}
          </div>

          {/* Таймер + кнопка завершения, на одной линии */}
          <div className="flex flex-col sm:items-end gap-2">
            <div className="flex items-center gap-2">
              <TimerBlock />
              {status !== "завершена" && (
                <button
                  type="button"
                  onClick={handleFinish}
                  disabled={savingStatus}
                  className="rounded-xl px-4 py-2 bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 disabled:opacity-60"
                >
                  {savingStatus ? "Сохраняем..." : "Завершить приём"}
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Основной контент: слева заметки, справа инфо */}
        <div className="grid lg:grid-cols-3 gap-4 items-start">
          {/* Заметки врача — левый большой блок */}
          <section className="lg:col-span-2">
            <NotesBlock />
          </section>

          {/* Правая колонка: заметки администратора, пациент, клиент, документы */}
          <section className="space-y-4">
            {/* Заметки администратора / регистратора */}
            <div className="rounded-2xl border bg-white p-4 space-y-2 text-sm">
              <h2 className="font-semibold text-base">
                Заметки администратора
              </h2>
              <p className="text-xs text-gray-500">
                Здесь регистратор может оставить важную информацию для врача:
                особенности владельца, нюансы общения, технические детали
                связи, комментарии по оплате и т.п.
              </p>
              {/* Пока заглушка. Позже можно подгружать реальные данные из БД */}
              <p className="text-xs text-gray-700">
                Нет особых пометок. Пациент впервые обращается в OnlyVet.{" "}
                (заглушка)
              </p>
            </div>

            {/* Пациент */}
            <div className="rounded-2xl border bg-white p-4 space-y-2 text-sm">
              <h2 className="font-semibold text-base">Пациент</h2>
              <div className="grid gap-2 text-xs text-gray-700">
                <InfoRow label="Имя питомца" value={sourceAppointment.petName} />
                <InfoRow label="Вид животного" value={sourceAppointment.species} />
                <InfoRow label="Услуга" value={sourceAppointment.serviceName} />
              </div>
            </div>

            {/* Клиент */}
            <div className="rounded-2xl border bg-white p-4 space-y-2 text-sm">
              <h2 className="font-semibold text-base">Клиент</h2>
              <div className="grid gap-2 text-xs text-gray-700">
                <InfoRow label="Имя владельца" value="Иванова Анна (заглушка)" />
                <InfoRow
                  label="Email"
                  value="test1@onlyvet.com (заглушка)"
                />
                <InfoRow
                  label="Контакт для связи"
                  value="+7 900 000-00-00 / @username"
                />
                <div>
                  <div className="text-gray-500 text-[11px]">
                    Личный кабинет
                  </div>
                  <div className="font-medium">
                    {hasPersonalAccount
                      ? "Есть (зарегистрирован в OnlyVet)"
                      : "Нет (только гостевой пользователь)"}
                  </div>
                </div>
              </div>
            </div>

            {/* Документы пациента */}
            <div className="rounded-2xl border bg-white p-4 space-y-2 text-sm">
              <h2 className="font-semibold text-base">Документы пациента</h2>
              {docs.length === 0 && (
                <p className="text-xs text-gray-500">
                  Документы по приёму пока не загружены.
                </p>
              )}
              {docs.length > 0 && (
                <ul className="space-y-2 text-xs">
                  {docs.map((d) => (
                    <DocumentItem key={d.id} doc={d} />
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

/* ---------- Вспомогательные компоненты ---------- */

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-gray-500 text-[11px]">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}

function DocumentItem({ doc }: { doc: MedicalDocument }) {
  const dateLabel = new Date(doc.createdAt).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });

  return (
    <li className="border border-gray-100 rounded-xl px-3 py-2 bg-gray-50 flex justify-between items-center">
      <div>
        <div className="font-medium">{doc.title}</div>
        <div className="text-gray-500 text-[11px]">
          {doc.type} • {dateLabel}
        </div>
      </div>
      <div className="flex gap-2">
        <button className="text-[11px] text-blue-600 underline underline-offset-2">
          Посмотреть
        </button>
        <button className="text-[11px] text-gray-700 underline underline-offset-2">
          Скачать
        </button>
      </div>
    </li>
  );
}

/* ---------- Таймер: компактный прямоугольник рядом с кнопкой ---------- */

function TimerBlock() {
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  const toggle = () => setRunning((r) => !r);
  const reset = () => {
    setRunning(false);
    setSeconds(0);
  };

  const h = Math.floor(seconds / 3600)
    .toString()
    .padStart(2, "0");
  const m = Math.floor((seconds % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");

  return (
    <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs">
      <span className="text-gray-500 text-[11px]">Таймер</span>
      <span className="font-mono text-sm text-gray-900">
        {h}:{m}:{s}
      </span>
      <button
        type="button"
        onClick={toggle}
        className="rounded-lg px-2 py-1 bg-black text-white text-[11px] hover:bg-gray-900"
      >
        {running ? "Пауза" : "Старт"}
      </button>
      <button
        type="button"
        onClick={reset}
        className="rounded-lg px-2.py-1 border border-gray-300 text-[11px] text-gray-700 hover:bg-gray-100"
      >
        Сброс
      </button>
    </div>
  );
}

/* ---------- Заметки врача: редактор + файлы ---------- */

function NotesBlock() {
  const editorRef = useRef<HTMLDivElement | null>(null);

  type Attachment = {
    id: string;
    name: string;
    size: number;
    type: string;
  };

  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [saving, setSaving] = useState(false);

  const handleExec = (command: string) => {
    if (typeof document !== "undefined") {
      document.execCommand(command, false);
      editorRef.current?.focus();
    }
  };

  const handleAlign = (align: "left" | "center" | "right") => {
    if (typeof document !== "undefined") {
      const command =
        align === "left"
          ? "justifyLeft"
          : align === "center"
          ? "justifyCenter"
          : "justifyRight";
      document.execCommand(command, false);
      editorRef.current?.focus();
    }
  };

  const handleFilesAdded = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const next: Attachment[] = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      next.push({
        id: `${Date.now()}-${i}`,
        name: f.name,
        size: f.size,
        type: f.type || "file",
      });
    }
    setAttachments((prev) => [...prev, ...next]);
    e.target.value = "";
  };

  const handleSave = () => {
    if (!editorRef.current) return;
    setSaving(true);

    const html = editorRef.current.innerHTML;
    console.log("[OnlyVet] Заметки врача (HTML):", html);
    console.log("[OnlyVet] Прикреплённые файлы (метаданные):", attachments);

    setTimeout(() => {
      setSaving(false);
      alert(
        "Пока что заметки и файлы не сохраняются в базу, только интерфейс 😊"
      );
    }, 400);
  };

  return (
    <div className="rounded-2xl border bg-white p-4.space-y-3 text-sm">
      <h2 className="font-semibold text-base">Заметки врача</h2>
      <p className="text-xs text-gray-500">
        Здесь можно фиксировать жалобы, анамнез, осмотр, дифференциалы и план.
        Выделяйте текст, делайте его жирным, курсивным, подчёркнутым, создавайте списки и выравнивайте текст.
      </p>

      {/* Панель форматирования */}
      <div className="flex flex-wrap gap-2 items-center border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 text-[11px]">
        <span className="text-gray-500 mr-1">Формат:</span>
        <button
          type="button"
          onClick={() => handleExec("bold")}
          className="px-2 py-1 rounded-md border border-gray-300 bg-white hover:bg-gray-100 font-semibold"
        >
          B
        </button>
        <button
          type="button"
          onClick={() => handleExec("italic")}
          className="px-2 py-1 rounded-md border border-gray-300 bg-white hover:bg-gray-100 italic"
        >
          I
        </button>
        <button
          type="button"
          onClick={() => handleExec("underline")}
          className="px-2 py-1 rounded-md border border-gray-300 bg-white hover:bg-gray-100 underline"
        >
          U
        </button>
        <button
          type="button"
          onClick={() => handleExec("insertUnorderedList")}
          className="px-2 py-1 rounded-md border border-gray-300 bg-white hover:bg-gray-100"
        >
          • Список
        </button>
        <button
          type="button"
          onClick={() => handleExec("insertOrderedList")}
          className="px-2 py-1 rounded-md border.border-gray-300 bg-white hover:bg-gray-100"
        >
          1. Список
        </button>

        <span className="text-gray-500 mx-2">Выравнивание:</span>
        <button
          type="button"
          onClick={() => handleAlign("left")}
          className="px-2 py-1 rounded-md border.border-gray-300 bg-white hover:bg-gray-100"
        >
          ⬅
        </button>
        <button
          type="button"
          onClick={() => handleAlign("center")}
          className="px-2 py-1 rounded-md border.border-gray-300 bg-white hover:bg-gray-100"
        >
          ⬌
        </button>
        <button
          type="button"
          onClick={() => handleAlign("right")}
          className="px-2 py-1 rounded-md border.border-gray-300 bg-white hover:bg-gray-100"
        >
          ➡
        </button>
      </div>

      {/* Редактор */}
      <div className="rounded-2xl border border-gray-200 bg-white min-h-[260px] max-h-[520px] overflow-auto px-3 py-2 text-xs leading-relaxed">
        <div
          ref={editorRef}
          contentEditable
          className="outline-none whitespace-pre-wrap"
          suppressContentEditableWarning
        />
      </div>

      {/* Прикреплённые файлы */}
      <div className="space-y-2">
        <div className="flex items-center.justify-between">
          <span className="font-semibold text-xs">Файлы пациента</span>
          <label className="text-[11px] cursor-pointer rounded-xl px-3 py-1 border border-gray-300.text-gray-700 hover:bg-gray-100">
            Добавить файлы
            <input
              type="file"
              multiple
              className="hidden"
              onChange={handleFilesAdded}
            />
          </label>
        </div>

        {attachments.length === 0 && (
          <p className="text-[11px] text-gray-500">
            Пока нет прикреплённых файлов. Можно добавить анализы, фото, pdf и т.д.
          </p>
        )}

        {attachments.length > 0 && (
          <ul className="space-y-1 text-[11px]">
            {attachments.map((f) => (
              <li
                key={f.id}
                className="flex items-center.justify-between rounded-lg border.border-gray-100 bg-gray-50 px-2 py-1"
              >
                <div className="flex flex-col">
                  <span className="font-medium">{f.name}</span>
                  <span className="text-gray-500">
                    {humanSize(f.size)} • {f.type || "файл"}
                  </span>
                </div>
                <button
                  type="button"
                  className="text-red-500 hover:text-red-700 text-[11px]"
                  onClick={() =>
                    setAttachments((prev) =>
                      prev.filter((x) => x.id !== f.id)
                    )
                  }
                >
                  Удалить
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Сохранение */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-xl px-4 py-1.5 bg-black text-white text-[11px] font-medium hover:bg-gray-900 disabled:opacity-60"
        >
          {saving ? "Сохраняем..." : "Сохранить (пока заглушка)"}
        </button>
      </div>
    </div>
  );
}

function humanSize(size: number) {
  if (size > 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} МБ`;
  }
  if (size > 1024) {
    return `${(size / 1024).toFixed(1)} КБ`;
  }
  return `${size} байт`;
}
