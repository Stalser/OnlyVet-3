"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface RegistrarVideoEditorProps {
  appointmentId: string;
  videoPlatform: string | null;
  videoUrl: string | null;
}

/**
 * Редактор формата связи / ссылки на Телемост.
 * Позволяет регистратуре указать или изменить ссылку для онлайн-консультации.
 */
export function RegistrarVideoEditor({
  appointmentId,
  videoPlatform,
  videoUrl,
}: RegistrarVideoEditorProps) {
  const [editing, setEditing] = useState(false);
  const [platform, setPlatform] = useState<string>(
    videoPlatform || "yandex_telemost"
  );
  const [url, setUrl] = useState<string>(videoUrl || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isYandex = platform === "yandex_telemost";

  async function handleSave() {
    if (!supabase) {
      setError("Supabase не сконфигурирован.");
      return;
    }

    // Простая проверка: если указан URL, он должен начинаться с http
    if (url.trim() && !/^https?:\/\//i.test(url.trim())) {
      setError("Ссылка должна начинаться с http:// или https://");
      return;
    }

    const confirmText = [
      "Вы уверены, что хотите сохранить формат связи?",
      "",
      `Платформа: ${
        platform === "yandex_telemost"
          ? "Яндекс Телемост"
          : platform || "не указана"
      }`,
      url.trim() ? `Ссылка: ${url.trim()}` : "Ссылка не указана",
      "",
      "Эта ссылка будет видна врачу в его кабинете.",
    ]
      .filter(Boolean)
      .join("\n");

    if (!window.confirm(confirmText)) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: updErr } = await supabase
        .from("appointments")
        .update({
          video_platform: platform || null,
          video_url: url.trim() || null,
        })
        .eq("id", appointmentId);

      if (updErr) {
        console.error(updErr);
        setError("Не удалось сохранить настройки формата связи.");
      } else {
        setEditing(false);
      }
    } catch (e: any) {
      console.error(e);
      setError("Ошибка при сохранении: " + e.message);
    } finally {
      setLoading(false);
    }
  }

  function handleCancel() {
    setPlatform(videoPlatform || "yandex_telemost");
    setUrl(videoUrl || "");
    setEditing(false);
    setError(null);
  }

  if (!editing) {
    return (
      <div className="space-y-2">
        <div className="text-xs text-gray-500">Платформа</div>
        <div className="font-medium text-gray-900">
          {isYandex || !videoPlatform
            ? "Яндекс Телемост"
            : videoPlatform}
        </div>

        {videoUrl && (
          <div className="text-[11px]">
            <a
              href={videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-700 hover:underline"
            >
              Открыть ссылку Телемоста
            </a>
          </div>
        )}

        {!videoUrl && (
          <div className="text-[10px] text-gray-400">
            Ссылка на Телемост ещё не указана. Можно добавить её через
            редактирование.
          </div>
        )}

        <button
          type="button"
          onClick={() => setEditing(true)}
          className="mt-2 inline-flex items-center rounded-full border border-gray-300 bg-white px-3 py-1 text-[11px] text-gray-600 hover:bg-gray-50"
        >
          Редактировать
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="text-xs text-gray-500">Платформа</div>
      <select
        value={platform}
        onChange={(e) => setPlatform(e.target.value)}
        className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-emerald-600 bg-white"
      >
        <option value="yandex_telemost">Яндекс Телемост</option>
        <option value="other">Другая платформа</option>
      </select>

      <div className="text-xs text-gray-500 mt-2">Ссылка на консультацию</div>
      <input
        type="text"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder={
          isYandex
            ? "https://telemost.yandex.ru/..."
            : "https://..."
        }
        className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-emerald-600 bg-white"
      />

      {error && (
        <div className="text-[11px] text-red-600">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={handleCancel}
          disabled={loading}
          className="inline-flex items-center rounded-full border border-gray-300 bg-white px-3 py-1 text-[11px] text-gray-600 hover:bg-gray-50"
        >
          Отмена
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={loading}
          className="inline-flex items-center rounded-full bg-emerald-600 px-4 py-1 text-[11px] font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {loading ? "Сохраняем…" : "Сохранить"}
        </button>
      </div>

      <div className="text-[10px] text-gray-400">
        Ссылка будет видна врачу в его кабинете. В будущем здесь можно будет
        показывать и ссылку для клиента.
      </div>
    </div>
  );
}
