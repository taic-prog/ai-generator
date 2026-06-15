import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI App Generator",
  description: "自然言語でHTMLアプリを即時生成するAIデモ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full">
      <body className="h-full flex flex-col">{children}</body>
    </html>
  );
}
