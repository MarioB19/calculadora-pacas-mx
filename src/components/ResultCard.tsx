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
      <div className="hero-results animate-fade-in">
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
            ⚠️ ALERTA DE GANANCIA
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
                <div className="alert-box warning" style={{ margin: "8px 0 0 0", padding: "8px 12px" }}>
                  Si vendes <strong>{resultados.gananciaSistemaMensual ? Math.round(resultados.gananciaSistemaMensual / gananciaProyectada) : 1} pacas</strong> al mes, estás perdiendo <strong>${dejasIrMensual.toLocaleString('es-MX')} MXN</strong> mensuales por poner precios "a ojo".
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
            <div className="alert-box info" key={idx} role="alert">
              <strong>Ajuste de precio:</strong> {adv}
            </div>
          ))}
        </div>
      )}

      {/* TABLA DE PRECIOS POR CATEGORÍA */}
      <div className="glass-card" style={{ padding: "20px" }}>
        <h2 style={{ fontSize: "17px", marginBottom: "12px" }}>Precios Sugeridos por Prenda</h2>
        <p style={{ marginBottom: "16px", fontSize: "13px" }}>
          Reventa sugerida para canal: <strong>{NOMBRES_CANALES[canal] || canal}</strong>
        </p>

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
                  <strong>Primera</strong>
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
                  <strong>Segunda</strong>
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
                  <strong>Tercera</strong>
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
        <p style={{ fontSize: "12px", color: "var(--text-muted)", fontStyle: "italic", textAlign: "center" }}>
          * Costo promedio por prenda vendible: ${(inversionTotal / (prendasVendibles || 1)).toFixed(2)} MXN
        </p>
      </div>

      {/* PUNTO DE EQUILIBRIO VISUAL */}
      <div className="glass-card" style={{ padding: "20px" }}>
        <h2 style={{ fontSize: "17px", marginBottom: "12px" }}>Punto de Equilibrio</h2>
        
        <p className="breakeven-text" dangerouslySetInnerHTML={{ __html: descripcionBreakeven }} />

        {prendasBreakeven > 0 && (
          <div className="breakeven-container">
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

            <div style={{ marginTop: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px" }}>
                <span>Prendas de recuperación: {prendasBreakeven} pzas</span>
                <span>Prendas de ganancia: {prendasVendibles - prendasBreakeven} pzas</span>
              </div>
              <div className="breakeven-bar-wrapper" style={{ height: "8px", margin: 0 }}>
                <div className="breakeven-segment primera" style={{ width: `${pctRecuperacionTotal}%` }} />
                <div className="breakeven-segment remaining" style={{ width: `${100 - pctRecuperacionTotal}%` }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", fontWeight: "600", marginTop: "4px" }}>
                <span style={{ color: "var(--primary)" }}>Inversión ({Math.round(pctRecuperacionTotal)}%)</span>
                <span style={{ color: "var(--success)" }}>Ganancia pura ({Math.round(100 - pctRecuperacionTotal)}%)</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ESTIMACIÓN SEMANAL (OPCIONAL) */}
      <div className="glass-card" style={{ padding: "20px" }}>
        <h2 style={{ fontSize: "17px", marginBottom: "12px" }}>¿En cuánto tiempo recuperas?</h2>
        <p style={{ marginBottom: "12px" }}>
          Ingresa cuántas prendas estimas vender a la semana para calcular tus semanas de retorno.
        </p>

        <form onSubmit={handleCalcularSemanas} style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}>
          <div className="form-group" style={{ flex: 1, margin: 0 }}>
            <label className="form-label" htmlFor="semanal-vta" style={{ fontSize: "11px" }}>
              Prendas vendidas por semana
            </label>
            <input
              id="semanal-vta"
              type="number"
              className="form-input"
              placeholder="Ej. 25"
              value={semanalInput}
              onChange={(e) => setSemanalInput(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: "auto", padding: "14px 20px" }}>
            Calcular
          </button>
        </form>

        {semanalRes && (
          <div className="alert-box info" style={{ marginTop: "14px", marginBottom: 0 }}>
            ✨ {semanalRes}
          </div>
        )}
      </div>

      {/* ACCIONES */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "8px", marginBottom: "30px" }}>
        <button className="btn btn-whatsapp" onClick={handleShareWhatsApp} id="btn-share-whatsapp">
          💬 Compartir Resultados en WhatsApp
        </button>
        <button className="btn btn-secondary" onClick={onReset} id="btn-recalculate">
          🔄 Calcular Otra Paca
        </button>
      </div>
    </div>
  );
}
