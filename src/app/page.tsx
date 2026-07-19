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
        
        {/* LOGO PREMIUM */}
        <div className="landing-logo">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
            <line x1="9" y1="22" x2="9" y2="16" />
            <line x1="15" y1="22" x2="15" y2="16" />
            <line x1="9" y1="16" x2="15" y2="16" />
            <line x1="8" y1="6" x2="16" y2="6" />
            <circle cx="9" cy="11" r="1.2" fill="currentColor" />
            <circle cx="15" cy="11" r="1.2" fill="currentColor" />
            <circle cx="9" cy="15" r="1.2" fill="currentColor" />
            <circle cx="15" cy="15" r="1.2" fill="currentColor" />
          </svg>
        </div>

        <h1>Calculadora de Paca</h1>
        <p className="subtitle" style={{ fontSize: "15px", marginBottom: "28px" }}>
          La herramienta definitiva para revendedoras de ropa en México. Deja de poner precios "a ojo" y multiplica tus ganancias.
        </p>

        {/* BENEFICIOS GRID */}
        <div className="benefits-grid">
          <div className="benefit-card">
            <div className="benefit-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </div>
            <div className="benefit-content">
              <h3>Precios por Calidad</h3>
              <p>Asigna un valor real más alto a tus piezas de Primera y recupera rápido.</p>
            </div>
          </div>

          <div className="benefit-card">
            <div className="benefit-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </div>
            <div className="benefit-content">
              <h3>Control de Merma</h3>
              <p>Descuenta de forma automática la ropa rota o manchada sin perder dinero.</p>
            </div>
          </div>

          <div className="benefit-card">
            <div className="benefit-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <div className="benefit-content">
              <h3>Punto de Equilibrio</h3>
              <p>Conoce exactamente cuántas prendas debes vender para cubrir tu inversión.</p>
            </div>
          </div>
        </div>

        {/* ACCIONES */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <Link href="/demo" className="btn btn-primary" style={{ textDecoration: "none" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3v18h18" />
              <path d="m19 9-5 5-4-4-3 3" />
            </svg>
            Probar Demo Gratis
          </Link>
          
          <Link href="/app-pacas-vip" className="btn btn-secondary" style={{ textDecoration: "none" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Acceder a Versión VIP
          </Link>
        </div>

        <div className="footer" style={{ marginTop: "40px", paddingBottom: "0" }}>
          Desarrollado por Brandon Muro para Pacas MX · 2026
        </div>
      </div>
    </main>
  );
}
