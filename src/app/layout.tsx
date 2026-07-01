import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "A&B Team | نظام إدارة الاستشارات القانونية والضريبية الذكي",
  description: "نظام إلكتروني ذكي لإدارة لجان الفحص والطعن والاستشارات القانونية والضريبية بدعم كامل بالذكاء الاصطناعي - شركة Sameh Samir - A&B team",
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
