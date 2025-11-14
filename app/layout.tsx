import type { Metadata } from "next";
import "./globals.css";
import Navbar from "../components/Navbar";
import CookieBanner from "../components/CookieBanner";
import Footer from "../components/Footer";

export const metadata: Metadata = {
  title: "OnlyVet — онлайн-ветеринария",
  description:
    "Мы рядом, даже когда врач далеко. Онлайн-консультации, второе мнение и поддержка владельцев животных.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className="min-h-screen flex flex-col bg-slate-50 text-gray-900">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
        <CookieBanner />
      </body>
    </html>
  );
}
