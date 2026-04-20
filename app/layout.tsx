import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "오늘 뭐드세요? 🍱",
  description: "점심 메뉴 고민 해결 앱",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full">
      <body className="h-full bg-gray-50">{children}</body>
    </html>
  );
}
