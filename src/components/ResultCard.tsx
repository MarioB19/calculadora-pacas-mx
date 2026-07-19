"use client";

import React, { useState, useEffect } from "react";
import { CalculoResultados, NOMBRES_CANALES } from "../lib/preciosMX";

interface ResultCardProps {
  resultados: CalculoResultados;
  userName?: string;
  canal: string;
  onReset: () => void;
  pacaId?: string;
  onActivateTracking?: (adjustedPrices: { primera: number, segunda: number, tercera: number }) => void;
}

// Helper para redondear a múltiplos de $5
function redondear5(val: number): number {
  return Math.max(0, Math.round(val / 5) * 5);
}

// Función pura para recalcular el punto de equilibrio en base a precios dinámicos
function calcularPuntoEquilibrio(
  precio1: number,
  precio2: number,
  precio3: number,
  prendas1: number,
  prendas2: number,
  prendas3: number,
  inversionTotal: number,
  prendasVendibles: number
) {
  let restante = inversionTotal;
  let necesarias1 = 0;
  let necesarias2 = 0;
  let necesarias3 = 0;

  // Primera
  if (precio1 > 0) {
    const ingresosMax1 = prendas1 * precio1;
    if (ingresosMax1 >= restante) {
      necesarias1 = Math.ceil(restante / precio1);
      restante = 0;
    } else {
      necesarias1 = prendas1;
      restante -= ingresosMax1;
    }
  }

  // Segunda
  if (restante > 0 && precio2 > 0) {
    const ingresosMax2 = prendas2 * precio2;
    if (ingresosMax2 >= restante) {
      necesarias2 = Math.ceil(restante / precio2);
      restante = 0;
    } else {
      necesarias2 = prendas2;
      restante -= ingresosMax2;
    }
  }

  // Tercera
  if (restante > 0 && precio3 > 0) {
    const ingresosMax3 = prendas3 * precio3;
    if (ingresosMax3 >= restante) {
      necesarias3 = Math.ceil(restante / precio3);
      restante = 0;
    } else {
      necesarias3 = prendas3;
      restante -= ingresosMax3;
    }
  }

  const prendasBreakeven = necesarias1 + necesarias2 + necesarias3;
  let descripcionBreakeven = "";

  if (restante <= 0) {
    if (necesarias1 > 0 && necesarias2 === 0 && necesarias3 === 0) {
      descripcionBreakeven = `Vendiendo solo **${necesarias1} prendas de Primera** ya recuperaste tu inversión total. ¡Todo lo demás es ganancia!`;
    } else if (necesarias1 > 0 && necesarias2 > 0 && necesarias3 === 0) {
      descripcionBreakeven = `Vendiendo tus **${necesarias1} prendas de Primera** y **${necesarias2} de Segunda** ya recuperaste tu inversión.`;
    } else {
      const partes = [];
      if (necesarias1 > 0) partes.push(`**${necesarias1} de Primera**`);
      if (necesarias2 > 0) partes.push(`**${necesarias2} de Segunda**`);
      if (necesarias3 > 0) partes.push(`**${necesarias3} de Tercera**`);
      descripcionBreakeven = `Vendiendo ${partes.join(", ")} recuperas tu inversión de $${inversionTotal.toLocaleString('es-MX')}.`;
    }
  } else {
    descripcionBreakeven = `Aun vendiendo todas tus prendas vendibles (${prendasVendibles} pzas), no se recupera toda la inversión debido al ajuste por precios del canal. Faltarían $${restante.toLocaleString('es-MX')}.`;
  }

  return {
    prendasBreakeven,
    descripcionBreakeven,
    categoriasBreakeven: {
      primera: necesarias1,
      segunda: necesarias2,
      tercera: necesarias3
    }
  };
}

export default function ResultCard({
  resultados,
  userName,
  canal,
  onReset,
  pacaId,
  onActivateTracking
}: ResultCardProps) {
  const {
    inversionTotal,
    prendasVendibles,
    prendas1,
    prendas2,
    prendas3,
    precio1: precio1Base,
    precio2: precio2Base,
    precio3: precio3Base,
    ajustado1,
    ajustado2,
    ajustado3,
    advertencias,
    inputsInfo
  } = resultados;

  // Estado del Simulador de Escenarios: 'pesimista' | 'realista' | 'optimista'
  const [escenario, setEscenario] = useState<"pesimista" | "realista" | "optimista">("realista");
  
  // Precios editables ajustados por el simulador (inicializados con base en realist)
  const [precio1, setPrecio1] = useState(precio1Base);
  const [precio2, setPrecio2] = useState(precio2Base);
  const [precio3, setPrecio3] = useState(precio3Base);

  // Estados del Kit de Venta
  const [showKitModal, setShowKitModal] = useState(false);
  const [nombreNegocio, setNombreNegocio] = useState(userName ? `Boutique de ${userName}` : "Mi Boutique");
  const [activeKitTab, setActiveKitTab] = useState<"copys" | "imprimir">("copys");

  // Estado para la estimación semanal
  const [semanalInput, setSemanalInput] = useState("");
  const [semanalRes, setSemanalRes] = useState<string | null>(null);

  // Recalcular precios cuando cambia el escenario
  useEffect(() => {
    if (escenario === "realista") {
      setPrecio1(precio1Base);
      setPrecio2(precio2Base);
      setPrecio3(precio3Base);
    } else if (escenario === "pesimista") {
      setPrecio1(redondear5(precio1Base * 0.85));
      setPrecio2(redondear5(precio2Base * 0.85));
      setPrecio3(redondear5(precio3Base * 0.85));
    } else if (escenario === "optimista") {
      setPrecio1(redondear5(precio1Base * 1.15));
      setPrecio2(redondear5(precio2Base * 1.15));
      setPrecio3(redondear5(precio3Base * 1.15));
    }
  }, [escenario, precio1Base, precio2Base, precio3Base]);

  // Si cambia el escenario, recalcular prendas vendibles pesimistas si aplica
  const mermaActual = inputsInfo?.merma ?? 5;
  const prendasTotal = inputsInfo?.prendas ?? (prendas1 + prendas2 + prendas3 + Math.round((prendas1 + prendas2 + prendas3) * (mermaActual / 100)));
  
  const prendas3Pesimista = escenario === "pesimista"
    ? Math.max(0, Math.round(prendasTotal * ((inputsInfo?.porcentajeTercera ?? 20) / 100)) - Math.round(prendasTotal * ((mermaActual + 5) / 100)))
    : prendas3;

  const prendasVendiblesActivas = escenario === "pesimista"
    ? prendas1 + prendas2 + prendas3Pesimista
    : prendasVendibles;

  const prendas3Activa = escenario === "pesimista" ? prendas3Pesimista : prendas3;

  // Cálculos vivos derivados de los precios ajustados
  const ingresosTotales = (prendas1 * precio1) + (prendas2 * precio2) + (prendas3Activa * precio3);
  const gananciaProyectada = ingresosTotales - inversionTotal;
  const gananciaMultiplicador = inversionTotal > 0 ? ingresosTotales / inversionTotal : 0;

  const {
    prendasBreakeven,
    descripcionBreakeven,
    categoriasBreakeven
  } = calcularPuntoEquilibrio(precio1, precio2, precio3, prendas1, prendas2, prendas3Activa, inversionTotal, prendasVendiblesActivas);

  // Calcular las ganancias de los 3 escenarios estáticos para mostrar en la comparativa
  const calculateEscenarioGanancia = (mode: "pesimista" | "realista" | "optimista") => {
    let p1 = precio1Base;
    let p2 = precio2Base;
    let p3 = precio3Base;
    let pVend = prendasVendibles;
    let p3V = prendas3;

    if (mode === "pesimista") {
      p1 = redondear5(precio1Base * 0.85);
      p2 = redondear5(precio2Base * 0.85);
      p3 = redondear5(precio3Base * 0.85);
      const mP = Math.max(0, Math.round(prendasTotal * ((inputsInfo?.porcentajeTercera ?? 20) / 100)) - Math.round(prendasTotal * ((mermaActual + 5) / 100)));
      pVend = prendas1 + prendas2 + mP;
      p3V = mP;
    } else if (mode === "optimista") {
      p1 = redondear5(precio1Base * 1.15);
      p2 = redondear5(precio2Base * 1.15);
      p3 = redondear5(precio3Base * 1.15);
    }

    const ing = (prendas1 * p1) + (prendas2 * p2) + (p3V * p3);
    return ing - inversionTotal;
  };

  const gananciaPesimista = calculateEscenarioGanancia("pesimista");
  const gananciaRealista = calculateEscenarioGanancia("realista");
  const gananciaOptimista = calculateEscenarioGanancia("optimista");

  // Manejar el submit de la estimación semanal
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

  // Crear copys de venta personalizados
  const copysVenta = [
    {
      titulo: "WhatsApp / Estados 📱",
      texto: `🔥 ¡NUEVA PACA RECIÉN LLEGADA! 🇺🇸 Ropa de marca americana original.
⭐️ Calidad de etiqueta desde $${precio1} MXN
✨ Prendas chulas de segunda a $${precio2} MXN
⚡️ Piezas de remate desde $${precio3} MXN
Mándame mensaje para fotos de las prendas más bonitas, ¡vuela todo rapidísimo! 📲`
    },
    {
      titulo: "Facebook Marketplace 🛍️",
      texto: `Hermosa ropa de paca americana en excelente estado.
Tengo blusas, vestidos y pantalones a precios increíbles por categorías:
⭐️ Calidad Primera (Marcas Premium): $${precio1} c/u
✨ Calidad Segunda (Súper buen estado): $${precio2} c/u
⚡️ Calidad Tercera (Remate): $${precio3} c/u
Entregas en puntos medios de la ciudad o envíos a coordinar. Escríbeme sin compromiso para ver fotos reales de las piezas.`
    },
    {
      titulo: "Promoción Express / Remates ⚡️",
      texto: `¡Remate de ropa americana en ${nombreNegocio}!
Prendas seleccionadas de remate a solo $${precio3} c/u.
¡O llévate 3 prendas de Segunda por solo $${precio2 * 3} pesos!
Ven a armar tu guardarropa con poco dinero. Piezas únicas.`
    },
    {
      titulo: "Mensaje Directo Clientes VIP 👑",
      texto: `¡Hola! Espero que estés súper bien. Te aviso que acabo de abrir paca de ropa americana premium.
Tengo prendas hermosas de marcas reconocidas en $${precio1} (Primera) y piezas en excelente estado en $${precio2} (Segunda).
También ropa para andar en casa o de remate en $${precio3}.
Si gustas, avísame y te mando fotos exclusivas antes de publicarlas en general. ¡Que tengas lindo día!`
    }
  ];

  // Copiar plantilla al portapapeles
  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("¡Texto copiado al portapapeles! Listo para pegar en WhatsApp o Facebook.");
  };

  // Compartir directo a WhatsApp
  const handleShareVenta = (text: string) => {
    const encodedText = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?text=${encodedText}`, "_blank");
  };

  // Compartir resultado global a WhatsApp
  const handleShareGlobalWhatsApp = () => {
    const nombreMensaje = userName ? `Soy ${userName} de ${nombreNegocio}. ` : "";
    const text = `¡Hola! ${nombreMensaje}Acabo de proyectar el rendimiento de mi paca con la Calculadora Inteligente de Pacas MX:
    
💰 Inversión total: $${inversionTotal.toLocaleString('es-MX')} MXN
📈 Ganancia proyectada: $${gananciaProyectada.toLocaleString('es-MX')} MXN (${gananciaMultiplicador.toFixed(1)}x)
👚 Prendas vendibles: ${prendasVendiblesActivas} pzas

Precios por categoría sugeridos:
⭐️ Primera: $${precio1} MXN (${prendas1} pzas)
✨ Segunda: $${precio2} MXN (${prendas2} pzas)
⚡️ Tercera: $${precio3} MXN (${prendas3Activa} pzas)

🎯 Punto de equilibrio: ${descripcionBreakeven.replace(/\*\*/g, "")}`;

    handleShareVenta(text);
  };

  // Porcentajes para la barra visual del punto de equilibrio
  const totalBreakevenVal = prendasBreakeven;
  const pct1 = totalBreakevenVal > 0 ? (categoriasBreakeven.primera / totalBreakevenVal) * 100 : 0;
  const pct2 = totalBreakevenVal > 0 ? (categoriasBreakeven.segunda / totalBreakevenVal) * 100 : 0;
  const pct3 = totalBreakevenVal > 0 ? (categoriasBreakeven.tercera / totalBreakevenVal) * 100 : 0;

  // Porcentaje de prendas de punto de equilibrio vs prendas totales vendibles
  const pctRecuperacionTotal = prendasVendiblesActivas > 0 ? (prendasBreakeven / prendasVendiblesActivas) * 100 : 0;

  return (
    <div className="result-card-wrapper animate-fade-in">
      <div className="results-desktop-layout">
        <div className="results-desktop-left">
          {/* HERO GANANCIA */}
          <div className="hero-results" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div className="landing-logo" style={{ background: "var(--primary-glow)", border: "none", width: "64px", height: "64px", borderRadius: "50%", marginBottom: "16px" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div className="hero-label">Ganancia Proyectada Escenario</div>
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

          {/* ADVERTENCIAS del motor */}
          {advertencias.length > 0 && (
            <div className="warnings-section">
              {advertencias.map((adv, idx) => (
                <div className="alert-box info" key={idx} role="alert" style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: "2px", flexShrink: 0 }}>
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                  <span><strong>Ajuste de canal:</strong> {adv}</span>
                </div>
              ))}
            </div>
          )}

          {/* PUNTO DE EQUILIBRIO VISUAL */}
          <div className="glass-card" style={{ padding: "20px" }}>
            <h2 style={{ fontSize: "17px", marginBottom: "12px", textAlign: "left" }}>Punto de Equilibrio</h2>
            
            <p className="breakeven-text" style={{ textAlign: "left" }} dangerouslySetInnerHTML={{ __html: descripcionBreakeven }} />

            {prendasBreakeven > 0 && (
              <div className="breakeven-container animate-fade-in">
                <div className="breakeven-bar-wrapper">
                  {categoriasBreakeven.primera > 0 && <div className="breakeven-segment primera" style={{ width: `${pct1}%` }} title={`${categoriasBreakeven.primera} de Primera`} />}
                  {categoriasBreakeven.segunda > 0 && <div className="breakeven-segment segunda" style={{ width: `${pct2}%` }} title={`${categoriasBreakeven.segunda} de Segunda`} />}
                  {categoriasBreakeven.tercera > 0 && <div className="breakeven-segment tercera" style={{ width: `${pct3}%` }} title={`${categoriasBreakeven.tercera} de Tercera`} />}
                </div>

                <div className="breakeven-legend">
                  {categoriasBreakeven.primera > 0 && <div className="legend-item"><div className="legend-color primera"></div><span>1ra ({categoriasBreakeven.primera} pzas)</span></div>}
                  {categoriasBreakeven.segunda > 0 && <div className="legend-item"><div className="legend-color segunda"></div><span>2da ({categoriasBreakeven.segunda} pzas)</span></div>}
                  {categoriasBreakeven.tercera > 0 && <div className="legend-item"><div className="legend-color tercera"></div><span>3ra ({categoriasBreakeven.tercera} pzas)</span></div>}
                </div>

                <div style={{ marginTop: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "var(--text-muted)", marginBottom: "6px" }}>
                    <span>Prendas de recuperación: {prendasBreakeven} pzas</span>
                    <span>Prendas de ganancia: {prendasVendiblesActivas - prendasBreakeven} pzas</span>
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

          {/* ESTIMACIÓN SEMANAL */}
          <div className="glass-card" style={{ padding: "20px", marginBottom: 0 }}>
            <h2 style={{ fontSize: "17px", marginBottom: "12px", textAlign: "left" }}>¿En cuánto tiempo recuperas?</h2>
            <p style={{ marginBottom: "12px", fontSize: "13.5px", textAlign: "left" }}>
              Ingresa cuántas prendas estimas vender a la semana para calcular tus semanas de retorno.
            </p>

            <form onSubmit={handleCalcularSemanas} style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}>
              <div className="form-group" style={{ flex: 1, margin: 0 }}>
                <label className="form-label" htmlFor="semanal-vta" style={{ fontSize: "11px" }}>Prendas vendidas por semana</label>
                <div className="input-icon-wrapper">
                  <input id="semanal-vta" type="number" className="form-input has-icon" placeholder="Ej. 25" value={semanalInput} onChange={(e) => setSemanalInput(e.target.value)} />
                  <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: "auto", padding: "14px 20px", height: "48px", borderRadius: "var(--radius-sm)" }}>Calcular</button>
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
        </div>

        <div className="results-desktop-right">
          {/* SIMULADOR DE ESCENARIOS */}
          <div className="glass-card" style={{ padding: "20px", marginBottom: 0 }}>
            <h2 style={{ fontSize: "17px", marginBottom: "12px", textAlign: "left" }}>1. Simular Escenarios</h2>
            
            {/* Segmented Control de Escenario */}
            <div className="scenario-segmented">
              <button 
                type="button" 
                className={`scenario-btn ${escenario === "pesimista" ? "active" : ""}`}
                onClick={() => setEscenario("pesimista")}
              >
                Pesimista 😟
              </button>
              <button 
                type="button" 
                className={`scenario-btn ${escenario === "realista" ? "active" : ""}`}
                onClick={() => setEscenario("realista")}
              >
                Realista Sugerido 😊
              </button>
              <button 
                type="button" 
                className={`scenario-btn ${escenario === "optimista" ? "active" : ""}`}
                onClick={() => setEscenario("optimista")}
              >
                Optimista 😎
              </button>
            </div>

            {/* Tabla comparativa de escenarios */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", textAlign: "center", marginBottom: "16px" }}>
              <div style={{ padding: "8px", background: escenario === "pesimista" ? "var(--error-bg)" : "white", border: "1px solid var(--border-color)", borderRadius: "8px" }}>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block" }}>Pesimista (-15% y merma)</span>
                <strong style={{ fontSize: "13px", color: "var(--error)" }}>${gananciaPesimista.toLocaleString('es-MX')}</strong>
              </div>
              <div style={{ padding: "8px", background: escenario === "realista" ? "var(--primary-bg)" : "white", border: "1px solid var(--border-color)", borderRadius: "8px" }}>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block" }}>Realista (Base)</span>
                <strong style={{ fontSize: "13px", color: "var(--primary)" }}>${gananciaRealista.toLocaleString('es-MX')}</strong>
              </div>
              <div style={{ padding: "8px", background: escenario === "optimista" ? "var(--success-bg)" : "white", border: "1px solid var(--border-color)", borderRadius: "8px" }}>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block" }}>Optimista (+15%)</span>
                <strong style={{ fontSize: "13px", color: "var(--success)" }}>${gananciaOptimista.toLocaleString('es-MX')}</strong>
              </div>
            </div>

            <h3 style={{ fontSize: "14px", marginTop: "16px", marginBottom: "8px", textAlign: "left", fontWeight: "700" }}>Ajuste Manual de Precios (Múltiplos de $5):</h3>
            
            {/* Steppers de ajuste manual */}
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div className="manual-stepper-row">
                <span>⭐️ Primera</span>
                <div className="stepper-controls">
                  <button type="button" className="stepper-btn" onClick={() => setPrecio1(Math.max(0, precio1 - 5))}>-</button>
                  <span className="stepper-value">${precio1}</span>
                  <button type="button" className="stepper-btn" onClick={() => setPrecio1(precio1 + 5)}>+</button>
                </div>
              </div>
              <div className="manual-stepper-row">
                <span>✨ Segunda</span>
                <div className="stepper-controls">
                  <button type="button" className="stepper-btn" onClick={() => setPrecio2(Math.max(0, precio2 - 5))}>-</button>
                  <span className="stepper-value">${precio2}</span>
                  <button type="button" className="stepper-btn" onClick={() => setPrecio2(precio2 + 5)}>+</button>
                </div>
              </div>
              <div className="manual-stepper-row">
                <span>⚡️ Tercera</span>
                <div className="stepper-controls">
                  <button type="button" className="stepper-btn" onClick={() => setPrecio3(Math.max(0, precio3 - 5))}>-</button>
                  <span className="stepper-value">${precio3}</span>
                  <button type="button" className="stepper-btn" onClick={() => setPrecio3(precio3 + 5)}>+</button>
                </div>
              </div>
            </div>
          </div>

          {/* DETALLES DE PRECIOS POR CATEGORÍA */}
          <div className="glass-card" style={{ padding: "20px", marginBottom: 0 }}>
            <h2 style={{ fontSize: "17px", marginBottom: "12px", textAlign: "left" }}>Precios en Visualización</h2>
            <p style={{ marginBottom: "16px", fontSize: "13px", textAlign: "left" }}>
              Reventa simulada para canal: <strong>{NOMBRES_CANALES[canal] || canal}</strong>
            </p>

            {/* VISTA DESKTOP: TABLA */}
            <div className="pricing-table-container">
              <table className="pricing-table">
                <thead>
                  <tr>
                    <th>Categoría</th>
                    <th className="col-right">Prendas</th>
                    <th className="col-right">Precio unitario</th>
                    <th className="col-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <strong>⭐️ Primera</strong>
                      {ajustado1 !== "none" && <span className={`badge-clamped ${ajustado1 === "max" ? "badge-max" : "badge-min"}`}>{ajustado1 === "max" ? "Topado" : "Ajustado"}</span>}
                    </td>
                    <td className="col-right">{prendas1}</td>
                    <td className="col-right"><strong>${precio1}</strong></td>
                    <td className="col-right">${(prendas1 * precio1).toLocaleString('es-MX')}</td>
                  </tr>
                  <tr>
                    <td>
                      <strong>✨ Segunda</strong>
                      {ajustado2 !== "none" && <span className="badge-clamped badge-max">Topado</span>}
                    </td>
                    <td className="col-right">{prendas2}</td>
                    <td className="col-right"><strong>${precio2}</strong></td>
                    <td className="col-right">${(prendas2 * precio2).toLocaleString('es-MX')}</td>
                  </tr>
                  <tr>
                    <td>
                      <strong>⚡️ Tercera</strong>
                      {ajustado3 !== "none" && <span className={`badge-clamped ${ajustado3 === "max" ? "badge-max" : "badge-min"}`}>{ajustado3 === "max" ? "Topado" : "Ajustado"}</span>}
                    </td>
                    <td className="col-right">{prendas3Activa}</td>
                    <td className="col-right"><strong>${precio3}</strong></td>
                    <td className="col-right">${(prendas3Activa * precio3).toLocaleString('es-MX')}</td>
                  </tr>
                  <tr style={{ background: "rgba(15, 118, 110, 0.03)", fontWeight: "bold" }}>
                    <td>Total vendible</td>
                    <td className="col-right">{prendasVendiblesActivas}</td>
                    <td className="col-right">-</td>
                    <td className="col-right">${ingresosTotales.toLocaleString('es-MX')}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* VISTA MÓVIL: TARJETAS RESPONSIVAS */}
            <div className="pricing-cards-mobile">
              <div className="pricing-card-item primera">
                <div className="pricing-card-info">
                  <span className="pricing-card-title">⭐️ Primera</span>
                  <span className="pricing-card-qty">{prendas1} piezas</span>
                </div>
                <div className="pricing-card-values">
                  <span className="pricing-card-price">${precio1}</span>
                  <span className="pricing-card-subtotal">${(prendas1 * precio1).toLocaleString('es-MX')} subtotal</span>
                </div>
              </div>

              <div className="pricing-card-item segunda">
                <div className="pricing-card-info">
                  <span className="pricing-card-title">✨ Segunda</span>
                  <span className="pricing-card-qty">{prendas2} piezas</span>
                </div>
                <div className="pricing-card-values">
                  <span className="pricing-card-price">${precio2}</span>
                  <span className="pricing-card-subtotal">${(prendas2 * precio2).toLocaleString('es-MX')} subtotal</span>
                </div>
              </div>

              <div className="pricing-card-item tercera">
                <div className="pricing-card-info">
                  <span className="pricing-card-title">⚡️ Tercera</span>
                  <span className="pricing-card-qty">{prendas3Activa} piezas</span>
                </div>
                <div className="pricing-card-values">
                  <span className="pricing-card-price">${precio3}</span>
                  <span className="pricing-card-subtotal">${(prendas3Activa * precio3).toLocaleString('es-MX')} subtotal</span>
                </div>
              </div>

              <div className="pricing-card-item total">
                <div className="pricing-card-info">
                  <span className="pricing-card-title" style={{ color: "var(--primary)" }}>Total Vendible</span>
                  <span className="pricing-card-qty">{prendasVendiblesActivas} piezas</span>
                </div>
                <div className="pricing-card-values">
                  <span className="pricing-card-price" style={{ color: "var(--primary)" }}>${ingresosTotales.toLocaleString('es-MX')}</span>
                  <span className="pricing-card-subtotal" style={{ color: "var(--primary)" }}>Ingreso total</span>
                </div>
              </div>
            </div>

            <p style={{ fontSize: "12px", color: "var(--text-muted)", fontStyle: "italic", textAlign: "center", marginTop: "12px" }}>
              * Costo promedio por prenda vendible: ${(inversionTotal / (prendasVendiblesActivas || 1)).toFixed(2)} MXN
            </p>
          </div>

          {/* BOTONES DE ACCIÓN VIP */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "8px", marginBottom: 0 }}>
            {/* BOTÓN MODO SEGUIMIENTO */}
            {pacaId && onActivateTracking && (
              <button 
                className="btn btn-primary pulsate" 
                onClick={() => onActivateTracking({ primera: precio1, segunda: precio2, tercera: precio3 })}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
                Activar seguimiento de esta paca
              </button>
            )}

            {/* BOTÓN GENERAR KIT DE VENTAS */}
            <button 
              className="btn btn-primary" 
              onClick={() => setShowKitModal(true)}
              style={{ background: "#4f46e5", borderColor: "#4f46e5", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                <line x1="7" y1="7" x2="7.01" y2="7"></line>
              </svg>
              Generar mi Kit de Venta 🏷️
            </button>

            <button className="btn btn-whatsapp" onClick={handleShareGlobalWhatsApp} id="btn-share-whatsapp">
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
      </div>

      {/* MODAL DEL KIT DE VENTAS */}
      {showKitModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center",
          justifyContent: "center", zIndex: 100, padding: "16px"
        }} className="animate-fade-in">
          <div className="glass-card" style={{
            maxWidth: "500px", width: "100%", maxHeight: "90vh",
            overflowY: "auto", background: "white", padding: "24px", margin: 0
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ fontSize: "20px", margin: 0 }}>Kit de Venta 🏷️</h2>
              <button 
                onClick={() => setShowKitModal(false)}
                style={{ background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: "var(--text-muted)" }}
              >
                &times;
              </button>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="kit-business-name">Nombre de tu Negocio / Boutique</label>
              <input 
                id="kit-business-name"
                type="text" 
                className="form-input" 
                placeholder="Ej. Boutique de Ropa Ana" 
                value={nombreNegocio} 
                onChange={(e) => setNombreNegocio(e.target.value)} 
              />
            </div>

            {/* Selector de sub-pestañas */}
            <div className="scenario-segmented" style={{ marginBottom: "16px" }}>
              <button 
                type="button" 
                className={`scenario-btn ${activeKitTab === "copys" ? "active" : ""}`}
                onClick={() => setActiveKitTab("copys")}
              >
                Copys de Redes 📱
              </button>
              <button 
                type="button" 
                className={`scenario-btn ${activeKitTab === "imprimir" ? "active" : ""}`}
                onClick={() => setActiveKitTab("imprimir")}
              >
                Imprimir Material 🖨️
              </button>
            </div>

            {/* TAB COPYS */}
            {activeKitTab === "copys" && (
              <div className="whatsapp-copys-container">
                {copysVenta.map((cp, idx) => (
                  <div key={idx} className="copy-card">
                    <strong style={{ fontSize: "14px" }}>{cp.titulo}</strong>
                    <div className="copy-text">{cp.texto}</div>
                    <div className="copy-actions">
                      <button className="btn-copy" onClick={() => handleCopyText(cp.texto)}>
                        📋 Copiar Texto
                      </button>
                      <button className="btn-share-mini" onClick={() => handleShareVenta(cp.texto)}>
                        💬 Compartir WhatsApp
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB IMPRIMIR */}
            {activeKitTab === "imprimir" && (
              <div style={{ textAlign: "center", padding: "10px 0" }}>
                <p style={{ fontSize: "14px", color: "var(--text-muted)", marginBottom: "20px" }}>
                  Haz clic abajo para abrir el diálogo de impresión. Imprimiremos un cartel grande formato carta para tu negocio, y una hoja llena de etiquetas recortables listas para poner a tus prendas.
                </p>
                
                <div style={{ padding: "16px", border: "1px dashed var(--border-color)", borderRadius: "8px", background: "#f9f9f8", marginBottom: "20px", textAlign: "left" }}>
                  <strong style={{ fontSize: "13px", display: "block", marginBottom: "4px" }}>Vista previa de impresión:</strong>
                  <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                    - Página 1: Cartel grande de precios (${precio1} / ${precio2} / ${precio3})<br />
                    - Página 2: Hoja con 30 etiquetas listas para recortar
                  </span>
                </div>

                <button 
                  onClick={() => window.print()}
                  className="btn btn-primary"
                  style={{ width: "100%" }}
                >
                  🖨️ Imprimir Cartel y Etiquetas
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CONTENIDO SOLO PARA IMPRESION (OCULTO EN PANTALLA MEDIANTE CSS) */}
      <div className="print-section">
        {/* PAGINA 1: CARTEL DE PRECIOS */}
        <div className="print-cartel-wrapper print-page-break">
          <div className="print-cartel-title">{nombreNegocio}</div>
          <div className="print-cartel-subtitle">Nuestros Precios de Temporada</div>
          
          <div className="print-cartel-row">
            <span className="print-cartel-cat">⭐️ Ropa de Primera (Marca / Etiqueta)</span>
            <span className="print-cartel-price">${precio1} MXN</span>
          </div>
          <div className="print-cartel-row">
            <span className="print-cartel-cat">✨ Ropa de Segunda (Buen estado)</span>
            <span className="print-cartel-price">${precio2} MXN</span>
          </div>
          <div className="print-cartel-row">
            <span className="print-cartel-cat">⚡ Ropa de Tercera (Remate / Oferta)</span>
            <span className="print-cartel-price">${precio3} MXN</span>
          </div>
          
          <div style={{ marginTop: "100px", fontSize: "14px", color: "#666" }}>
            ¡Gracias por tu compra! · Ropa americana seleccionada
          </div>
        </div>

        {/* PAGINA 2: ETIQUETAS RECORTABLES */}
        <div className="print-etiquetas-title" style={{ textAlign: "center", fontSize: "24px", fontWeight: "bold", marginBottom: "20px" }}>
          Etiquetas para Prendas ({nombreNegocio})
        </div>
        <div className="print-etiquetas-grid">
          {/* 9 etiquetas para primera */}
          {Array.from({ length: 9 }).map((_, idx) => (
            <div key={`et-p1-${idx}`} className="print-tag-item">
              <span className="print-tag-cat">⭐ Primera</span>
              <strong className="print-tag-price">${precio1}</strong>
              <span className="print-tag-footer">{nombreNegocio}</span>
            </div>
          ))}
          
          {/* 12 etiquetas para segunda */}
          {Array.from({ length: 12 }).map((_, idx) => (
            <div key={`et-p2-${idx}`} className="print-tag-item">
              <span className="print-tag-cat">✨ Segunda</span>
              <strong className="print-tag-price">${precio2}</strong>
              <span className="print-tag-footer">{nombreNegocio}</span>
            </div>
          ))}
          
          {/* 9 etiquetas para tercera */}
          {Array.from({ length: 9 }).map((_, idx) => (
            <div key={`et-p3-${idx}`} className="print-tag-item">
              <span className="print-tag-cat">⚡ Tercera</span>
              <strong className="print-tag-price">${precio3}</strong>
              <span className="print-tag-footer">{nombreNegocio}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
