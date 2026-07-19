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
      <div className="glass-card" style={{ marginTop: "20px" }}>
        <h1>Calculadora de Paca</h1>
        <p className="subtitle">
          Descubre cuánto dinero dejas ir por poner precios "a ojo" en tus prendas.
        </p>

        {!resultados ? (
          <form onSubmit={handleSubmit} style={{ textAlign: "left" }}>
            {/* INPUT 1: Costo Paca */}
            <div className="form-group">
              <label className="form-label" htmlFor="costo-paca">
                Costo de la Paca
              </label>
              <div className="input-wrapper">
                <span className="input-prefix">$</span>
                <input
                  id="costo-paca"
                  type="number"
                  className="form-input has-prefix"
                  placeholder="Ej. 3500"
                  required
                  min="1"
                  value={costoPaca}
                  onChange={(e) => setCostoPaca(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* INPUT 2: Número prendas */}
            <div className="form-group">
              <label className="form-label" htmlFor="numero-prendas">
                Prendas totales (aprox)
              </label>
              <input
                id="numero-prendas"
                type="number"
                className="form-input"
                placeholder="Ej. 150"
                required
                min="1"
                value={prendas}
                onChange={(e) => setPrendas(e.target.value)}
                disabled={isLoading}
              />
            </div>

            {/* INPUT 3: Precio promedio hoy */}
            <div className="form-group">
              <label className="form-label" htmlFor="precio-hoy">
                ¿A cuánto vendes HOY promedio por prenda?
              </label>
              <div className="input-wrapper">
                <span className="input-prefix">$</span>
                <input
                  id="precio-hoy"
                  type="number"
                  className="form-input has-prefix"
                  placeholder="Ej. 60"
                  required
                  min="1"
                  value={precioHoy}
                  onChange={(e) => setPrecioHoy(e.target.value)}
                  disabled={isLoading}
                />
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
                "Ver Resultados Gratis"
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
