import React from "react";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Calculadora de Paca — Optimiza tus precios | Pacas MX",
  description: "Fija precios inteligentes por categoría (Primera, Segunda, Tercera) para tu ropa de paca. Calcula tu ganancia y punto de equilibrio al instante.",
  robots: {
    index: true,
    follow: true,
  },
};

export default function Home() {
  return (
    <main className="app-container" style={{ justifyContent: "center", minHeight: "100vh" }}>
      <div className="glass-card text-center animate-fade-in" style={{ padding: "40px 24px" }}>
        <div style={{ fontSize: "52px", marginBottom: "16px" }}>🧮</div>
        <h1>Calculadora de Paca</h1>
        <p className="subtitle" style={{ fontSize: "16px", marginBottom: "32px" }}>
          La herramienta definitiva para revendedoras de ropa en México. Deja de poner precios "a ojo" y multiplica tus ganancias.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <Link href="/demo" className="btn btn-primary" style={{ textDecoration: "none" }}>
            📊 Probar Demo Gratis
          </Link>
          
          <Link href="/app-pacas-vip" className="btn btn-secondary" style={{ textDecoration: "none" }}>
            🔒 Acceder a Versión VIP
          </Link>
        </div>

        <div className="footer" style={{ marginTop: "40px", paddingBottom: "0" }}>
          Desarrollado por Brandon Muro para Pacas MX · 2026
        </div>
      </div>
    </main>
  );
}
