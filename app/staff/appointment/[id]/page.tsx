function NotesBlock({ appointmentId }: { appointmentId: string }) {
  const editorRef = useRef<HTMLDivElement | null>(null);

  type Attachment = {
    id: string;
    name: string;
    size: number;
    type: string;
  };

  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Загрузка уже сохранённой заметки
  useEffect(() => {
    if (!supabase || !editorRef.current) return;

    const loadNote = async () => {
      try {
        const { data, error } = await supabase!
          .from("appointment_notes")
          .select("content")
          .eq("appointment_id", appointmentId)
          .maybeSingle();

        if (error) {
          console.error(error);
          setLoadError("Не удалось загрузить заметки из базы.");
          return;
        }

        if (data && data.content && editorRef.current) {
          editorRef.current.innerHTML = data.content;
        }
      } catch (e) {
        console.error(e);
        setLoadError("Ошибка при загрузке заметок.");
      }
    };

    loadNote();
  }, [appointmentId]);

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

  const handleSave = async () => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;

    // если Supabase не сконфигурирован — ведём себя как раньше
    if (!supabase) {
      setSaving(true);
      console.log("[OnlyVet] Заметки врача (HTML):", html);
      console.log("[OnlyVet] Прикреплённые файлы (метаданные):", attachments);
      setTimeout(() => {
        setSaving(false);
        alert(
          "Supabase не настроен, заметки и файлы не сохраняются в базу, только UI 😊"
        );
      }, 400);
      return;
    }

    setSaving(true);

    try {
      // узнаём, кто врач
      const { data: userData, error: userError } =
        await supabase!.auth.getUser();
      if (userError) {
        console.error(userError);
      }
      const doctorId = userData.user?.id ?? null;

      // проверяем, есть ли уже заметка по этому приёму
      const { data: existing, error: existingError } = await supabase!
        .from("appointment_notes")
        .select("id")
        .eq("appointment_id", appointmentId)
        .maybeSingle();

      if (existingError && existingError.code !== "PGRST116") {
        console.error(existingError);
      }

      if (existing?.id) {
        // update
        const { error } = await supabase!
          .from("appointment_notes")
          .update({
            content: html,
            doctor_id: doctorId,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);

        if (error) {
          console.error(error);
          alert("Не удалось обновить заметки в базе.");
        } else {
          alert("Заметки обновлены.");
        }
      } else {
        // insert
        const { error } = await supabase!
          .from("appointment_notes")
          .insert({
            appointment_id: appointmentId,
            doctor_id: doctorId,
            content: html,
          });

        if (error) {
          console.error(error);
          alert("Не удалось сохранить заметки в базе.");
        } else {
          alert("Заметки сохранены.");
        }
      }
    } catch (e) {
      console.error(e);
      alert("Ошибка при сохранении заметок.");
    } finally {
      setSaving(false);
    }
  };

  const humanSize = (size: number) => {
    if (size > 1024 * 1024) {
      return `${(size / (1024 * 1024)).toFixed(1)} МБ`;
    }
    if (size > 1024) {
      return `${(size / 1024).toFixed(1)} КБ`;
    }
    return `${size} байт`;
  };

  return (
    <div className="rounded-2xl border bg-white p-4 space-y-3 text-sm">
      <h2 className="font-semibold text-base">Заметки врача</h2>
      <p className="text-xs text-gray-500">
        Здесь можно фиксировать жалобы, анамнез, осмотр, дифференциалы и план.
        Выделяйте текст, делайте его жирным, курсивным, подчёркнутым, создавайте списки и выравнивайте текст.
      </p>
      {loadError && (
        <p className="text-xs text-red-600">{loadError}</p>
      )}

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
          className="px-2 py-1 rounded-md border border-gray-300 bg-white hover:bg.gray-100 underline"
        >
          U
        </button>
        <button
          type="button"
          onClick={() => handleExec("insertUnorderedList")}
          className="px-2 py-1 rounded-md border border-gray-300 bg-white hover:bg.gray-100"
        >
          • Список
        </button>
        <button
          type="button"
          onClick={() => handleExec("insertOrderedList")}
          className="px-2 py-1 rounded-md border border-gray-300 bg-white hover:bg.gray-100"
        >
          1. Список
        </button>

        <span className="text-gray-500 mx-2">Выравнивание:</span>
        <button
          type="button"
          onClick={() => handleAlign("left")}
          className="px-2 py-1 rounded-md border border-gray-300 bg-white hover:bg.gray-100"
        >
          ⬅
        </button>
        <button
          type="button"
          onClick={() => handleAlign("center")}
          className="px-2 py-1 rounded-md border border-gray-300 bg.white hover:bg.gray-100"
        >
          ⬌
        </button>
        <button
          type="button"
          onClick={() => handleAlign("right")}
          className="px-2 py-1 rounded-md border border-gray-300 bg.white hover:bg.gray-100"
        >
          ➡
        </button>
      </div>

      {/* Редактор */}
      <div className="rounded-2xl border.border-gray-200 bg.white min-h-[260px] max-h.[520px] overflow-auto px-3 py-2 text-xs leading.relaxed">
        <div
          ref={editorRef}
          contentEditable
          className="outline-none whitespace-pre-wrap"
          suppressContentEditableWarning
        />
      </div>

      {/* Прикреплённые файлы (пока только UI) */}
      <div className="space-y-2">
        <div className="flex items-center.justify-between">
          <span className="font-semibold text-xs">Файлы пациента</span>
          <label className="text-[11px] cursor-pointer rounded-xl px-3.py-1 border border-gray-300 text-gray-700 hover:bg-gray-100">
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
                className="flex items-center.justify-between rounded-lg border.border-gray-100 bg.gray-50 px-2 py-1"
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
          {saving ? "Сохраняем..." : "Сохранить заметки"}
        </button>
      </div>
    </div>
  );
}
