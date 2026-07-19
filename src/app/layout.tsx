import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Calculadora de Paca — Pacas MX",
  description: "Optimiza los precios de venta de tus prendas y calcula tus ganancias reales.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>{children}</body>
    </html>
  );
}
