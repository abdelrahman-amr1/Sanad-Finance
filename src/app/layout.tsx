import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "سند | المنصة الذكية لإدارة مكاتب المحاسبة والاستشارات الضريبية",
  description: "منصة سحابية متكاملة (SaaS) لإدارة مكاتب المحاسبين القانونيين ومستشاري الضرائب وأتمتة لجان الفحص والطعن بالذكاء الاصطناعي",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className="h-full">
      <body
        className={`${cairo.variable} font-sans antialiased h-full bg-[#F8FAFC] text-[#0F172A]`}
      >
        {children}
      </body>
    </html>
  );
}
