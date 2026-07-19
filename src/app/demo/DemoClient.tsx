"use client";

import React, { useState } from "react";
import { realizarCalculos } from "../../lib/preciosMX";

export default function DemoClient() {
  const [costoPaca, setCostoPaca] = useState("");
  const [prendas, setPrendas] = useState("");
  const [precioHoy, setPrecioHoy] = useState("");
  
  const [resultados, setResultados] = useState<{
    inversionTotal: number;
    gananciaHoy: number;
    gananciaSistema: number;
    dejasIr: number;
  } | null>(null);

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const costo = parseFloat(costoPaca);
    const pzas = parseInt(prendas);
    const hoy = parseFloat(precioHoy);

    if (isNaN(costo) || costo <= 0 || isNaN(pzas) || pzas <= 0 || isNaN(hoy) || hoy <= 0) {
      alert("Por favor, ingresa valores válidos mayores a 0.");
      return;
    }

    setIsLoading(true);

    // Ejecutar cálculo usando valores semilla típicos:
    // Merma 5%, Meta x2.5, clasificación 20-60-20, canal Marketplace
    const res = realizarCalculos({
      costoPaca: costo,
      gastosExtra: 0,
      prendas: pzas,
      porcentajePrimera: 20,
      porcentajeSegunda: 60,
      porcentajeTercera: 20,
      merma: 5,
      metaGanancia: 2.5,
      precioHoy: hoy,
      canal: "marketplace"
    });

    setTimeout(() => {
      setResultados({
        inversionTotal: res.inversionTotal,
        gananciaHoy: res.gananciaHoy || 0,
        gananciaSistema: res.gananciaProyectada,
        dejasIr: res.gananciaExtra || 0
      });
      setIsLoading(false);
    }, 600); // Pequeña demora para animación visual premium
  };

  const handleReset = () => {
    setCostoPaca("");
    setPrendas("");
    setPrecioHoy("");
    setResultados(null);
  };

  return (
    <main className="app-container">
      <div className="glass-card" style={{ maxWidth: "600px", margin: "20px auto 24px auto", width: "100%" }}>
        <h1>Calculadora de Paca</h1>
        <p className="subtitle">
          Descubre cuánto dinero dejas ir por poner precios "a ojo" en tus prendas.
        </p>

        {!resultados ? (
          <form onSubmit={handleSubmit} style={{ textAlign: "left" }}>
            {/* INPUT 1: Costo Paca */}
            <div className="form-group">
              <label className="form-label" htmlFor="costo-paca">
                Costo de la Paca (MXN)
              </label>
              <div className="input-icon-wrapper">
                <input
                  id="costo-paca"
                  type="number"
                  className="form-input has-icon"
                  placeholder="Ej. 3500"
                  required
                  min="1"
                  value={costoPaca}
                  onChange={(e) => setCostoPaca(e.target.value)}
                  disabled={isLoading}
                />
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23"></line>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
              </div>
            </div>

            {/* INPUT 2: Número prendas */}
            <div className="form-group">
              <label className="form-label" htmlFor="numero-prendas">
                Prendas totales (aprox)
              </label>
              <div className="input-icon-wrapper">
                <input
                  id="numero-prendas"
                  type="number"
                  className="form-input has-icon"
                  placeholder="Ej. 150"
                  required
                  min="1"
                  value={prendas}
                  onChange={(e) => setPrendas(e.target.value)}
                  disabled={isLoading}
                />
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.37 8.91l-8.17-6.07a1 1 0 0 0-1.19 0L2.83 8.91a1 1 0 0 0-.37.77l.79 11.2a1 1 0 0 0 1 .92h14.89a1 1 0 0 0 1-.92l.79-11.2a1 1 0 0 0-.36-.77z"></path>
                  <path d="M12 2v6"></path>
                  <circle cx="12" cy="11" r="1.5"></circle>
                </svg>
              </div>
            </div>

            {/* INPUT 3: Precio promedio hoy */}
            <div className="form-group">
              <label className="form-label" htmlFor="precio-hoy">
                ¿A cuánto vendes HOY promedio por prenda?
              </label>
              <div className="input-icon-wrapper">
                <input
                  id="precio-hoy"
                  type="number"
                  className="form-input has-icon"
                  placeholder="Ej. 60"
                  required
                  min="1"
                  value={precioHoy}
                  onChange={(e) => setPrecioHoy(e.target.value)}
                  disabled={isLoading}
                />
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                  <line x1="7" y1="7" x2="7.01" y2="7"></line>
                </svg>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
              id="btn-calculate-demo"
            >
              {isLoading ? (
                <>
                  <span className="loader-spinner"></span> Calculando...
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="20" x2="12" y2="10" />
                    <line x1="12" y1="20" x2="18" y2="10" />
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                  <span>Ver Resultados Gratis</span>
                </>
              )}
            </button>
          </form>
        ) : (
          <div className="animate-fade-in" style={{ textAlign: "center" }}>
            {/* COMPARADOR HOY VS SISTEMA */}
            <div className="hero-results">
              <div className="hero-label">Ganancia con Precios por Categoría</div>
              <div className="hero-amount" id="demo-profit-optimized">
                ${resultados.gananciaSistema.toLocaleString('es-MX')}
              </div>
              <div className="hero-sub" style={{ marginTop: "6px" }}>
                Con la Calculadora completa, clasificas tu mercancía y obtienes precios sugeridos para maximizar tus ventas.
              </div>
            </div>

            <div className="comparison-card" id="demo-comparison-card" style={{ textAlign: "left" }}>
              <div className="comparison-title" style={{ fontSize: "13px" }}>
                🚨 Estás perdiendo dinero
              </div>
              {resultados.dejasIr > 0 ? (
                <>
                  <div className="comparison-lost" id="demo-lost-money">
                    ¡Dejas ir ${resultados.dejasIr.toLocaleString('es-MX')} por paca!
                  </div>
                  <div className="comparison-text">
                    Vendiendo parejo a <strong>${precioHoy} MXN</strong> ganas <strong>${resultados.gananciaHoy.toLocaleString('es-MX')}</strong>.
                    <br />
                    Con nuestro sistema de precios sugeridos ganarías <strong>${resultados.gananciaSistema.toLocaleString('es-MX')}</strong>.
                  </div>
                </>
              ) : (
                <div className="comparison-text">
                  Tu precio actual te da una ganancia de <strong>${resultados.gananciaHoy.toLocaleString('es-MX')}</strong>.
                  Clasificando por categoría optimizas tu inventario para recuperar más rápido y vender la ropa premium a su verdadero valor.
                </div>
              )}
            </div>

            {/* Banner Evaluador Pre-compra VIP CTA */}
            <div className="comparison-card" style={{ textAlign: "left", marginTop: "16px", border: "1px dashed var(--primary)", background: "rgba(30, 75, 143, 0.03)" }}>
              <div className="comparison-title" style={{ fontSize: "13px", color: "var(--primary)" }}>
                🔍 ¿Vas a comprar una paca?
              </div>
              <div className="comparison-lost" style={{ fontSize: "15px", color: "var(--text-main)", margin: "4px 0" }}>
                ¡Evalúa tu oferta antes de gastar!
              </div>
              <div className="comparison-text" style={{ fontSize: "13px" }}>
                Evita pérdidas con nuestro <strong>Evaluador Pre-Compra</strong>. Descubre si los números salen, compara hasta 3 ofertas y calcula el precio máximo que deberías pagar.
                <br />
                <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block", marginTop: "6px" }}>
                  🔒 Disponible exclusivamente en la versión VIP.
                </span>
              </div>
            </div>

            {/* CTA checkout */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "24px" }}>
              <a
                href="https://inovaris.online/checkout-pacas"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary pulsate"
                id="cta-unlock-calculator"
                style={{ textDecoration: "none" }}
              >
                🔓 Quiero la Calculadora Completa
              </a>
              <button
                className="btn btn-secondary"
                onClick={handleReset}
                id="btn-demo-recalculate"
              >
                🔄 Probar con otros datos
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="footer">
        © 2026 Pacas MX · Todos los derechos reservados
      </div>
    </main>
  );
}
