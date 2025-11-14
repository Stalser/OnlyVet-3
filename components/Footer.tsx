// components/Footer.tsx

export default function Footer() {
  return (
    <footer className="bg-navy text-white py-10 mt-20">
      <div className="container grid md:grid-cols-3 gap-8 text-sm">
        <div>
          <div className="text-lg font-semibold mb-2">OnlyVet</div>
          <p className="opacity-80">Мы рядом, даже когда врач далеко.</p>
        </div>
        <div>
          <div className="font-semibold mb-2">Документы</div>
          <ul className="space-y-1 opacity-90">
            <li>Пользовательское соглашение</li>
            <li>Политика конфиденциальности</li>
            <li>Согласие на обработку данных</li>
          </ul>
        </div>
        <div>
          <div className="font-semibold mb-2">Контакты</div>
          <p className="opacity-90">Напишите нам в Telegram или VK.</p>
        </div>
      </div>
    </footer>
  );
}
