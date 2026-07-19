"use client";

import React, { useState } from "react";
import { CalculoResultados, NOMBRES_CANALES } from "../lib/preciosMX";

interface ResultCardProps {
  resultados: CalculoResultados;
  userName?: string;
  canal: string;
  onReset: () => void;
}

export default function ResultCard({ resultados, userName, canal, onReset }: ResultCardProps) {
  const {
    inversionTotal,
    prendasVendibles,
    prendas1,
    prendas2,
    prendas3,
    precio1,
    precio2,
    precio3,
    ajustado1,
    ajustado2,
    ajustado3,
    advertencias,
    ingresosTotales,
    gananciaProyectada,
    gananciaMultiplicador,
    prendasBreakeven,
    descripcionBreakeven,
    categoriasBreakeven,
    gananciaHoy,
    gananciaExtra,
    dejasIrMensual,
    gananciaHoyMensual,
    gananciaSistemaMensual
  } = resultados;

  const [semanalInput, setSemanalInput] = useState("");
  const [semanalRes, setSemanalRes] = useState<string | null>(null);

  const handleCalcularSemanas = (e: React.FormEvent) => {
    e.preventDefault();
    const prendasPorSemana = parseInt(semanalInput);
    if (isNaN(prendasPorSemana) || prendasPorSemana <= 0) {
      setSemanalRes(null);
      return;
    }
    const semanas = Math.ceil(prendasBreakeven / prendasPorSemana);
    if (semanas === 1) {
      setSemanalRes("¡Recuperas tu inversión en tu primer semana de ventas!");
    } else {
      setSemanalRes(`Recuperas tu inversión inicial en aproximadamente ~${semanas} semanas.`);
    }
  };

  // Crear mensaje para compartir en WhatsApp
  const handleShareWhatsApp = () => {
    const nombreMensaje = userName ? `¡Hola! Soy ${userName}. ` : "¡Hola! ";
    const text = `${nombreMensaje}Acabo de calcular el rendimiento de mi paca de ropa con la Calculadora de Paca 🧮 de Pacas MX:

💰 Inversión Total: $${inversionTotal.toLocaleString('es-MX')} MXN
📈 Ganancia Proyectada: $${gananciaProyectada.toLocaleString('es-MX')} MXN (${(gananciaMultiplicador).toFixed(1)}x tu inversión)
👚 Prendas vendibles: ${prendasVendibles} piezas

Precios sugeridos por prenda (${NOMBRES_CANALES[canal] || canal}):
⭐️ Primera (Marca/Etiqueta): $${precio1} MXN (${prendas1} pzas)
✨ Segunda (Buen estado): $${precio2} MXN (${prendas2} pzas)
⚡️ Tercera (Remate): $${precio3} MXN (${prendas3} pzas)

🎯 Punto de equilibrio: ${descripcionBreakeven.replace(/\*\*/g, "")}

Calcula tu paca aquí: https://app-pacas.inovaris.online/demo`;

    const encodedText = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?text=${encodedText}`, "_blank");
  };

  // Porcentajes para la barra visual de punto de equilibrio
  const totalBreakevenVal = prendasBreakeven;
  const pct1 = totalBreakevenVal > 0 ? (categoriasBreakeven.primera / totalBreakevenVal) * 100 : 0;
  const pct2 = totalBreakevenVal > 0 ? (categoriasBreakeven.segunda / totalBreakevenVal) * 100 : 0;
  const pct3 = totalBreakevenVal > 0 ? (categoriasBreakeven.tercera / totalBreakevenVal) * 100 : 0;

  // Porcentaje de prendas de punto de equilibrio vs prendas totales vendibles
  const pctRecuperacionTotal = prendasVendibles > 0 ? (prendasBreakeven / prendasVendibles) * 100 : 0;

  return (
    <div className="result-card-wrapper">
      {/* HÉROE: Ganancia principal */}
      <div className="hero-results animate-fade-in" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div className="landing-logo" style={{ background: "var(--primary-glow)", border: "none", width: "64px", height: "64px", borderRadius: "50%", marginBottom: "16px" }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <div className="hero-label">Ganancia Proyectada</div>
        <div className="hero-amount" id="result-total-profit">
          ${gananciaProyectada.toLocaleString('es-MX')}
        </div>
        <div className="hero-sub">
          {userName ? `${userName}, tu paca` : "Tu paca"} te devolverá un total de{" "}
          <strong>${ingresosTotales.toLocaleString('es-MX')}</strong> en ventas (
          <strong>{(gananciaMultiplicador).toFixed(2)}x</strong> de tu inversión de $
          {inversionTotal.toLocaleString('es-MX')}).
        </div>
      </div>

      {/* GANCHO: Comparativa "Hoy vs Sistema" */}
      {gananciaHoy !== undefined && gananciaExtra !== undefined && (
        <div className="comparison-card animate-fade-in" id="comparison-hook">
          <div className="comparison-title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            ALERTA DE GANANCIA
          </div>
          {gananciaExtra > 0 ? (
            <>
              <div className="comparison-lost" id="result-lost-money">
                ¡Estás dejando ir ${gananciaExtra.toLocaleString('es-MX')}!
              </div>
              <div className="comparison-text">
                Vendiendo todo a un precio parejo le sacarías <strong>${gananciaHoy.toLocaleString('es-MX')}</strong> de ganancia.
                <br />
                Usando precios inteligentes por categoría le sacas <strong>${gananciaProyectada.toLocaleString('es-MX')}</strong>.
              </div>
              {dejasIrMensual !== undefined && dejasIrMensual > 0 && (
                <div className="alert-box warning" style={{ margin: "12px 0 0 0", padding: "10px 14px", display: "flex", gap: "8px", alignItems: "center" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>
                    Si vendes <strong>{resultados.gananciaSistemaMensual ? Math.round(resultados.gananciaSistemaMensual / gananciaProyectada) : 1} pacas</strong> al mes, estás perdiendo <strong>${dejasIrMensual.toLocaleString('es-MX')} MXN</strong> mensuales por poner precios "a ojo".
                  </span>
                </div>
              )}
            </>
          ) : (
            <div className="comparison-text">
              Tu precio promedio actual te da una ganancia de <strong>${gananciaHoy.toLocaleString('es-MX')}</strong>.
              Con nuestro sistema optimizas las ventas por calidad obteniendo <strong>${gananciaProyectada.toLocaleString('es-MX')}</strong>.
            </div>
          )}
        </div>
      )}

      {/* ADVERTENCIAS del motor (Clamping) */}
      {advertencias.length > 0 && (
        <div className="warnings-section">
          {advertencias.map((adv, idx) => (
            <div className="alert-box info" key={idx} role="alert" style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: "2px", flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              <span><strong>Ajuste de precio:</strong> {adv}</span>
            </div>
          ))}
        </div>
      )}

      {/* DETALLES DE PRECIOS POR CATEGORÍA */}
      <div className="glass-card" style={{ padding: "20px" }}>
        <h2 style={{ fontSize: "17px", marginBottom: "12px", textAlign: "left" }}>Precios Sugeridos por Prenda</h2>
        <p style={{ marginBottom: "16px", fontSize: "13px", textAlign: "left" }}>
          Reventa sugerida para canal: <strong>{NOMBRES_CANALES[canal] || canal}</strong>
        </p>

        {/* VISTA DESKTOP: TABLA */}
        <div className="pricing-table-container">
          <table className="pricing-table">
            <thead>
              <tr>
                <th>Categoría</th>
                <th className="col-right">Prendas</th>
                <th className="col-right">Precio Sug.</th>
                <th className="col-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <strong>⭐️ Primera</strong>
                  {ajustado1 !== "none" && (
                    <span className={`badge-clamped ${ajustado1 === "max" ? "badge-max" : "badge-min"}`}>
                      {ajustado1 === "max" ? "Topado" : "Ajustado"}
                    </span>
                  )}
                </td>
                <td className="col-right">{prendas1}</td>
                <td className="col-right"><strong>${precio1}</strong></td>
                <td className="col-right">${(prendas1 * precio1).toLocaleString('es-MX')}</td>
              </tr>
              <tr>
                <td>
                  <strong>✨ Segunda</strong>
                  {ajustado2 !== "none" && (
                    <span className="badge-clamped badge-max">Topado</span>
                  )}
                </td>
                <td className="col-right">{prendas2}</td>
                <td className="col-right"><strong>${precio2}</strong></td>
                <td className="col-right">${(prendas2 * precio2).toLocaleString('es-MX')}</td>
              </tr>
              <tr>
                <td>
                  <strong>⚡️ Tercera</strong>
                  {ajustado3 !== "none" && (
                    <span className={`badge-clamped ${ajustado3 === "max" ? "badge-max" : "badge-min"}`}>
                      {ajustado3 === "max" ? "Topado" : "Ajustado"}
                    </span>
                  )}
                </td>
                <td className="col-right">{prendas3}</td>
                <td className="col-right"><strong>${precio3}</strong></td>
                <td className="col-right">${(prendas3 * precio3).toLocaleString('es-MX')}</td>
              </tr>
              <tr style={{ background: "rgba(15, 118, 110, 0.03)", fontWeight: "bold" }}>
                <td>Total vendible</td>
                <td className="col-right">{prendasVendibles}</td>
                <td className="col-right">-</td>
                <td className="col-right">${ingresosTotales.toLocaleString('es-MX')}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* VISTA MÓVIL: TARJETAS RESPONSIVAS (Evita desbordamiento) */}
        <div className="pricing-cards-mobile">
          {/* Primera */}
          <div className="pricing-card-item primera">
            <div className="pricing-card-info">
              <span className="pricing-card-title">
                ⭐️ Primera
                {ajustado1 !== "none" && (
                  <span className={`badge-clamped ${ajustado1 === "max" ? "badge-max" : "badge-min"}`} style={{ marginLeft: "6px" }}>
                    {ajustado1 === "max" ? "Topado" : "Ajustado"}
                  </span>
                )}
              </span>
              <span className="pricing-card-qty">{prendas1} piezas</span>
            </div>
            <div className="pricing-card-values">
              <span className="pricing-card-price">${precio1}</span>
              <span className="pricing-card-subtotal">${(prendas1 * precio1).toLocaleString('es-MX')} subtotal</span>
            </div>
          </div>

          {/* Segunda */}
          <div className="pricing-card-item segunda">
            <div className="pricing-card-info">
              <span className="pricing-card-title">
                ✨ Segunda
                {ajustado2 !== "none" && (
                  <span className="badge-clamped badge-max" style={{ marginLeft: "6px" }}>Topado</span>
                )}
              </span>
              <span className="pricing-card-qty">{prendas2} piezas</span>
            </div>
            <div className="pricing-card-values">
              <span className="pricing-card-price">${precio2}</span>
              <span className="pricing-card-subtotal">${(prendas2 * precio2).toLocaleString('es-MX')} subtotal</span>
            </div>
          </div>

          {/* Tercera */}
          <div className="pricing-card-item tercera">
            <div className="pricing-card-info">
              <span className="pricing-card-title">
                ⚡️ Tercera
                {ajustado3 !== "none" && (
                  <span className={`badge-clamped ${ajustado3 === "max" ? "badge-max" : "badge-min"}`} style={{ marginLeft: "6px" }}>
                    {ajustado3 === "max" ? "Topado" : "Ajustado"}
                  </span>
                )}
              </span>
              <span className="pricing-card-qty">{prendas3} piezas</span>
            </div>
            <div className="pricing-card-values">
              <span className="pricing-card-price">${precio3}</span>
              <span className="pricing-card-subtotal">${(prendas3 * precio3).toLocaleString('es-MX')} subtotal</span>
            </div>
          </div>

          {/* Total */}
          <div className="pricing-card-item total">
            <div className="pricing-card-info">
              <span className="pricing-card-title" style={{ color: "var(--primary)" }}>Total Vendible</span>
              <span className="pricing-card-qty">{prendasVendibles} piezas</span>
            </div>
            <div className="pricing-card-values">
              <span className="pricing-card-price" style={{ color: "var(--primary)" }}>${ingresosTotales.toLocaleString('es-MX')}</span>
              <span className="pricing-card-subtotal" style={{ color: "var(--primary)" }}>Ingreso total</span>
            </div>
          </div>
        </div>

        <p style={{ fontSize: "12px", color: "var(--text-muted)", fontStyle: "italic", textAlign: "center" }}>
          * Costo promedio por prenda vendible: ${(inversionTotal / (prendasVendibles || 1)).toFixed(2)} MXN
        </p>
      </div>

      {/* PUNTO DE EQUILIBRIO VISUAL */}
      <div className="glass-card" style={{ padding: "20px" }}>
        <h2 style={{ fontSize: "17px", marginBottom: "12px", textAlign: "left" }}>Punto de Equilibrio</h2>
        
        <p className="breakeven-text" style={{ textAlign: "left" }} dangerouslySetInnerHTML={{ __html: descripcionBreakeven }} />

        {prendasBreakeven > 0 && (
          <div className="breakeven-container animate-fade-in">
            <div className="breakeven-bar-wrapper">
              {categoriasBreakeven.primera > 0 && (
                <div 
                  className="breakeven-segment primera" 
                  style={{ width: `${pct1}%` }} 
                  title={`${categoriasBreakeven.primera} de Primera`}
                />
              )}
              {categoriasBreakeven.segunda > 0 && (
                <div 
                  className="breakeven-segment segunda" 
                  style={{ width: `${pct2}%` }}
                  title={`${categoriasBreakeven.segunda} de Segunda`}
                />
              )}
              {categoriasBreakeven.tercera > 0 && (
                <div 
                  className="breakeven-segment tercera" 
                  style={{ width: `${pct3}%` }}
                  title={`${categoriasBreakeven.tercera} de Tercera`}
                />
              )}
            </div>

            <div className="breakeven-legend">
              {categoriasBreakeven.primera > 0 && (
                <div className="legend-item">
                  <div className="legend-color primera"></div>
                  <span>1ra ({categoriasBreakeven.primera} pzas)</span>
                </div>
              )}
              {categoriasBreakeven.segunda > 0 && (
                <div className="legend-item">
                  <div className="legend-color segunda"></div>
                  <span>2da ({categoriasBreakeven.segunda} pzas)</span>
                </div>
              )}
              {categoriasBreakeven.tercera > 0 && (
                <div className="legend-item">
                  <div className="legend-color tercera"></div>
                  <span>3ra ({categoriasBreakeven.tercera} pzas)</span>
                </div>
              )}
            </div>

            <div style={{ marginTop: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "var(--text-muted)", marginBottom: "6px" }}>
                <span>Prendas de recuperación: {prendasBreakeven} pzas</span>
                <span>Prendas de ganancia: {prendasVendibles - prendasBreakeven} pzas</span>
              </div>
              <div className="breakeven-bar-wrapper" style={{ height: "8px", margin: 0 }}>
                <div className="breakeven-segment primera" style={{ width: `${pctRecuperacionTotal}%` }} />
                <div className="breakeven-segment remaining" style={{ width: `${100 - pctRecuperacionTotal}%` }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", fontWeight: "600", marginTop: "6px" }}>
                <span style={{ color: "var(--primary)" }}>Inversión ({Math.round(pctRecuperacionTotal)}%)</span>
                <span style={{ color: "var(--success)" }}>Ganancia pura ({Math.round(100 - pctRecuperacionTotal)}%)</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ESTIMACIÓN SEMANAL (OPCIONAL) */}
      <div className="glass-card" style={{ padding: "20px" }}>
        <h2 style={{ fontSize: "17px", marginBottom: "12px", textAlign: "left" }}>¿En cuánto tiempo recuperas?</h2>
        <p style={{ marginBottom: "12px", fontSize: "13.5px", textAlign: "left" }}>
          Ingresa cuántas prendas estimas vender a la semana para calcular tus semanas de retorno.
        </p>

        <form onSubmit={handleCalcularSemanas} style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}>
          <div className="form-group" style={{ flex: 1, margin: 0 }}>
            <label className="form-label" htmlFor="semanal-vta" style={{ fontSize: "11px" }}>
              Prendas vendidas por semana
            </label>
            <div className="input-icon-wrapper">
              <input
                id="semanal-vta"
                type="number"
                className="form-input has-icon"
                placeholder="Ej. 25"
                value={semanalInput}
                onChange={(e) => setSemanalInput(e.target.value)}
              />
              <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: "auto", padding: "14px 20px", height: "48px", borderRadius: "var(--radius-sm)" }}>
            Calcular
          </button>
        </form>

        {semanalRes && (
          <div className="alert-box info" style={{ marginTop: "14px", marginBottom: 0, display: "flex", gap: "8px", alignItems: "center" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            <span>{semanalRes}</span>
          </div>
        )}
      </div>

      {/* ACCIONES */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "8px", marginBottom: "30px" }}>
        <button className="btn btn-whatsapp" onClick={handleShareWhatsApp} id="btn-share-whatsapp">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
          Compartir en WhatsApp
        </button>
        <button className="btn btn-secondary" onClick={onReset} id="btn-recalculate">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
          </svg>
          Calcular Otra Paca
        </button>
      </div>
    </div>
  );
}
