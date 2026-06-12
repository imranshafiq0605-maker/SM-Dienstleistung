import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SM Dienstleistung",
  description: "SM Dienstleistung Web-App",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className="h-full antialiased">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
