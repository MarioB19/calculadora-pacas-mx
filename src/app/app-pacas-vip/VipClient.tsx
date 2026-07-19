"use client";

import React, { useState, useEffect } from "react";
import { realizarCalculos, CalculoResultados, NOMBRES_CANALES } from "../../lib/preciosMX";
import ResultCard from "../../components/ResultCard";

interface HistorialPaca {
  id: string;
  fecha: string;
  nombre: string;
  costo: number;
  prendas: number;
  ganancia: number;
  inputData: any;
}

export default function VipClient() {
  const [step, setStep] = useState(1);
  const [userName, setUserName] = useState("");
  const [pacaName, setPacaName] = useState("");
  
  // Costos
  const [costoPaca, setCostoPaca] = useState("");
  const [gastosExtra, setGastosExtra] = useState("0");
  
  // Inventario
  const [prendas, setPrendas] = useState("");
  const [merma, setMerma] = useState("5");

  // Clasificación (deben sumar 100)
  const [porcentajePrimera, setPorcentajePrimera] = useState(20);
  const [porcentajeSegunda, setPorcentajeSegunda] = useState(60);
  const [porcentajeTercera, setPorcentajeTercera] = useState(20);
  
  // Configuración de Venta
  const [canal, setCanal] = useState<"marketplace" | "whatsapp" | "tianguis">("marketplace");
  const [metaSeleccionada, setMetaSeleccionada] = useState("2.5"); // "2", "2.5", "3", "custom"
  const [metaPersonalizada, setMetaPersonalizada] = useState("");
  const [precioHoy, setPrecioHoy] = useState("");
  const [pacasAlMes, setPacasAlMes] = useState("1");

  // Resultados y Historial
  const [resultados, setResultados] = useState<CalculoResultados | null>(null);
  const [historial, setHistorial] = useState<HistorialPaca[]>([]);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  useEffect(() => {
    // Cargar historial desde localStorage al iniciar
    const saved = localStorage.getItem("pacas_history_log");
    if (saved) {
      try {
        setHistorial(JSON.parse(saved));
      } catch (e) {
        console.error("Error al cargar historial", e);
      }
    }
  }, []);

  // Algoritmo de auto-balanceo para los sliders de clasificación
  // Asegura que Primera % + Segunda % + Tercera % = 100%
  const handleSliderChange = (
    category: "primera" | "segunda" | "tercera",
    newValue: number
  ) => {
    let p1 = porcentajePrimera;
    let p2 = porcentajeSegunda;
    let p3 = porcentajeTercera;

    if (category === "primera") {
      p1 = newValue;
      const diff = 100 - p1;
      const sumOthers = p2 + p3;
      if (sumOthers > 0) {
        p2 = Math.round(diff * (p2 / sumOthers));
        p3 = 100 - p1 - p2;
      } else {
        p2 = Math.round(diff / 2);
        p3 = 100 - p1 - p2;
      }
    } else if (category === "segunda") {
      p2 = newValue;
      const diff = 100 - p2;
      const sumOthers = p1 + p3;
      if (sumOthers > 0) {
        p1 = Math.round(diff * (p1 / sumOthers));
        p3 = 100 - p1 - p2;
      } else {
        p1 = Math.round(diff / 2);
        p3 = 100 - p1 - p2;
      }
    } else {
      p3 = newValue;
      const diff = 100 - p3;
      const sumOthers = p1 + p2;
      if (sumOthers > 0) {
        p1 = Math.round(diff * (p1 / sumOthers));
        p2 = 100 - p1 - p3;
      } else {
        p1 = Math.round(diff / 2);
        p2 = 100 - p1 - p3;
      }
    }

    // Doble verificación de límites
    p1 = Math.max(0, Math.min(100, p1));
    p2 = Math.max(0, Math.min(100, p2));
    p3 = Math.max(0, Math.min(100, p3));

    // Ajustar el último para evitar errores de redondeo de suma (garantizar 100%)
    const total = p1 + p2 + p3;
    if (total !== 100) {
      const adjustment = 100 - total;
      if (category === "primera") {
        p2 += adjustment;
      } else {
        p1 += adjustment;
      }
    }

    setPorcentajePrimera(p1);
    setPorcentajeSegunda(p2);
    setPorcentajeTercera(p3);
  };

  const handleNext = () => {
    // Validaciones de paso
    if (step === 2) {
      const costo = parseFloat(costoPaca);
      if (isNaN(costo) || costo <= 0) {
        alert("Por favor, ingresa un costo de paca válido.");
        return;
      }
    }
    if (step === 3) {
      const pzas = parseInt(prendas);
      if (isNaN(pzas) || pzas <= 0) {
        alert("Por favor, ingresa el número de prendas.");
        return;
      }
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();

    const costo = parseFloat(costoPaca);
    const extra = parseFloat(gastosExtra) || 0;
    const pzas = parseInt(prendas);
    const mrm = parseFloat(merma) || 0;
    const hoy = precioHoy ? parseFloat(precioHoy) : undefined;
    const pacasM = parseInt(pacasAlMes) || 1;

    let meta = parseFloat(metaSeleccionada);
    if (metaSeleccionada === "custom") {
      meta = parseFloat(metaPersonalizada);
    }

    if (isNaN(costo) || isNaN(pzas) || isNaN(meta) || meta <= 0) {
      alert("Por favor verifica que todos los campos requeridos tengan valores válidos.");
      return;
    }

    // Ejecutar lógica de cálculos del motor
    const inputs = {
      costoPaca: costo,
      gastosExtra: extra,
      prendas: pzas,
      porcentajePrimera,
      porcentajeSegunda,
      porcentajeTercera,
      merma: mrm,
      metaGanancia: meta,
      precioHoy: hoy,
      canal,
      pacasAlMes: pacasM
    };

    const res = realizarCalculos(inputs);
    setResultados(res);

    // Guardar en historial
    const nombrePaca = pacaName.trim() || `Paca de $${costo.toLocaleString()}`;
    const nuevoLog: HistorialPaca = {
      id: Date.now().toString(),
      fecha: new Date().toLocaleDateString("es-MX", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }),
      nombre: nombrePaca,
      costo: costo + extra,
      prendas: pzas,
      ganancia: res.gananciaProyectada,
      inputData: {
        userName,
        pacaName: nombrePaca,
        costoPaca,
        gastosExtra,
        prendas,
        merma,
        porcentajePrimera,
        porcentajeSegunda,
        porcentajeTercera,
        canal,
        metaSeleccionada,
        metaPersonalizada,
        precioHoy,
        pacasAlMes
      }
    };

    const nuevoHistorial = [nuevoLog, ...historial.slice(0, 9)]; // Límite de 10 pacas
    setHistorial(nuevoHistorial);
    localStorage.setItem("pacas_history_log", JSON.stringify(nuevoHistorial));
  };

  const handleReset = () => {
    setResultados(null);
    setStep(1);
    setPacaName("");
    setCostoPaca("");
    setGastosExtra("0");
    setPrendas("");
    setMerma("5");
    setPorcentajePrimera(20);
    setPorcentajeSegunda(60);
    setPorcentajeTercera(20);
    setMetaSeleccionada("2.5");
    setMetaPersonalizada("");
    setPrecioHoy("");
    setPacasAlMes("1");
  };

  const loadHistoryItem = (item: HistorialPaca) => {
    const data = item.inputData;
    setUserName(data.userName || "");
    setPacaName(data.pacaName || "");
    setCostoPaca(data.costoPaca || "");
    setGastosExtra(data.gastosExtra || "0");
    setPrendas(data.prendas || "");
    setMerma(data.merma || "5");
    setPorcentajePrimera(data.porcentajePrimera ?? 20);
    setPorcentajeSegunda(data.porcentajeSegunda ?? 60);
    setPorcentajeTercera(data.porcentajeTercera ?? 20);
    setCanal(data.canal || "marketplace");
    setMetaSeleccionada(data.metaSeleccionada || "2.5");
    setMetaPersonalizada(data.metaPersonalizada || "");
    setPrecioHoy(data.precioHoy || "");
    setPacasAlMes(data.pacasAlMes || "1");

    // Ejecutar cálculo automático al cargar
    const costoVal = parseFloat(data.costoPaca);
    const extraVal = parseFloat(data.gastosExtra) || 0;
    const pzasVal = parseInt(data.prendas);
    const mrmVal = parseFloat(data.merma) || 0;
    const hoyVal = data.precioHoy ? parseFloat(data.precioHoy) : undefined;
    const pacasMVal = parseInt(data.pacasAlMes) || 1;
    let metaVal = parseFloat(data.metaSeleccionada);
    if (data.metaSeleccionada === "custom") {
      metaVal = parseFloat(data.metaPersonalizada);
    }

    const res = realizarCalculos({
      costoPaca: costoVal,
      gastosExtra: extraVal,
      prendas: pzasVal,
      porcentajePrimera: data.porcentajePrimera,
      porcentajeSegunda: data.porcentajeSegunda,
      porcentajeTercera: data.porcentajeTercera,
      merma: mrmVal,
      metaGanancia: metaVal,
      precioHoy: hoyVal,
      canal: data.canal,
      pacasAlMes: pacasMVal
    });

    setResultados(res);
  };

  const handleClearHistory = () => {
    if (confirm("¿Estás seguro de borrar todo tu historial de pacas?")) {
      setHistorial([]);
      localStorage.removeItem("pacas_history_log");
    }
  };

  return (
    <main className="app-container">
      {!resultados ? (
        <div className="glass-card animate-fade-in" style={{ marginTop: "10px" }}>
          {/* Indicador de pasos */}
          <div className="steps-indicator">
            {[1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                className={`step-node ${step === s ? "active" : ""} ${
                  step > s ? "completed" : ""
                }`}
              >
                {s}
              </div>
            ))}
          </div>

          <h1>Calculadora de Paca VIP</h1>
          <p className="subtitle">
            Calcula precios de reventa inteligentes y optimiza las ganancias de tus pacas.
          </p>

          <form onSubmit={handleCalculate} style={{ textAlign: "left" }}>
            
            {/* PASO 1: Onboarding y Nombre */}
            {step === 1 && (
              <div className="animate-fade-in">
                <h2>Paso 1: Identificación</h2>
                <div className="form-group">
                  <label className="form-label" htmlFor="user-name">
                    Tu Nombre (Opcional)
                  </label>
                  <input
                    id="user-name"
                    type="text"
                    className="form-input"
                    placeholder="Ej. Ana"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                  />
                  <p style={{ marginTop: "4px", fontSize: "12px" }}>
                    Lo usamos para personalizar tus reportes de ganancia.
                  </p>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="paca-name">
                    Nombre o etiqueta de la Paca (Opcional)
                  </label>
                  <input
                    id="paca-name"
                    type="text"
                    className="form-input"
                    placeholder="Ej. Paca Premium Verano"
                    value={pacaName}
                    onChange={(e) => setPacaName(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* PASO 2: Costos (Inversión) */}
            {step === 2 && (
              <div className="animate-fade-in">
                <h2>Paso 2: Inversión de la Paca</h2>
                
                <div className="form-group">
                  <label className="form-label" htmlFor="vip-costo-paca">
                    Costo de la Paca (MXN) *
                  </label>
                  <div className="input-wrapper">
                    <span className="input-prefix">$</span>
                    <input
                      id="vip-costo-paca"
                      type="number"
                      className="form-input has-prefix"
                      placeholder="Ej. 4500"
                      required
                      min="1"
                      value={costoPaca}
                      onChange={(e) => setCostoPaca(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="vip-gastos-extra">
                    Gastos Extra (Flete, Lavado, Bolsa)
                    <span 
                      className="tooltip-trigger"
                      onMouseEnter={() => setActiveTooltip("gastos")}
                      onMouseLeave={() => setActiveTooltip(null)}
                      onClick={() => setActiveTooltip(activeTooltip === "gastos" ? null : "gastos")}
                    >
                      ¿Qué es esto?
                    </span>
                  </label>
                  <div className="input-wrapper">
                    <span className="input-prefix">$</span>
                    <input
                      id="vip-gastos-extra"
                      type="number"
                      className="form-input has-prefix"
                      placeholder="Ej. 300"
                      value={gastosExtra}
                      onChange={(e) => setGastosExtra(e.target.value)}
                    />
                  </div>
                  {activeTooltip === "gastos" && (
                    <div className="tooltip-content animate-fade-in" style={{ top: "34px", right: "0px" }}>
                      Suma el transporte, jabón de lavado, ganchos o empaque. ¡También forman parte de tu inversión inicial!
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* PASO 3: Inventario y Merma */}
            {step === 3 && (
              <div className="animate-fade-in">
                <h2>Paso 3: Prendas y Merma</h2>

                <div className="form-group">
                  <label className="form-label" htmlFor="vip-prendas">
                    Número de prendas aproximadas *
                  </label>
                  <input
                    id="vip-prendas"
                    type="number"
                    className="form-input"
                    placeholder="Ej. 100"
                    required
                    min="1"
                    value={prendas}
                    onChange={(e) => setPrendas(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="vip-merma">
                    Merma esperada (% de prendas rotas/sucias)
                    <span 
                      className="tooltip-trigger"
                      onMouseEnter={() => setActiveTooltip("merma")}
                      onMouseLeave={() => setActiveTooltip(null)}
                      onClick={() => setActiveTooltip(activeTooltip === "merma" ? null : "merma")}
                    >
                      ¿Por qué merma?
                    </span>
                  </label>
                  <input
                    id="vip-merma"
                    type="number"
                    className="form-input"
                    placeholder="Ej. 5"
                    min="0"
                    max="90"
                    value={merma}
                    onChange={(e) => setMerma(e.target.value)}
                  />
                  {activeTooltip === "merma" && (
                    <div className="tooltip-content animate-fade-in" style={{ top: "34px", right: "0px" }}>
                      Siempre hay prendas que vienen rotas, inservibles o manchadas que no podrás vender. Se descuentan del lote de Remates.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* PASO 4: Clasificación y Canal */}
            {step === 4 && (
              <div className="animate-fade-in">
                <h2>Paso 4: Clasificación y Canal de Venta</h2>
                
                <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "16px" }}>
                  Ajusta la calidad esperada de tu ropa. Los 3 sliders deben sumar 100% (se auto-balancean al moverlos).
                </p>

                {/* Slider 1: Primera */}
                <div className="slider-container">
                  <div className="slider-header">
                    <span className="category-name">⭐️ Primera (Marca/Etiqueta)</span>
                    <span className="percentage">{porcentajePrimera}%</span>
                  </div>
                  <input
                    type="range"
                    className="form-slider slider-primera"
                    min="0"
                    max="100"
                    value={porcentajePrimera}
                    onChange={(e) => handleSliderChange("primera", parseInt(e.target.value))}
                  />
                </div>

                {/* Slider 2: Segunda */}
                <div className="slider-container">
                  <div className="slider-header">
                    <span className="category-name">✨ Segunda (Buen estado)</span>
                    <span className="percentage">{porcentajeSegunda}%</span>
                  </div>
                  <input
                    type="range"
                    className="form-slider slider-segunda"
                    min="0"
                    max="100"
                    value={porcentajeSegunda}
                    onChange={(e) => handleSliderChange("segunda", parseInt(e.target.value))}
                  />
                </div>

                {/* Slider 3: Tercera */}
                <div className="slider-container">
                  <div className="slider-header">
                    <span className="category-name">⚡️ Tercera (Defectos/Remate)</span>
                    <span className="percentage">{porcentajeTercera}%</span>
                  </div>
                  <input
                    type="range"
                    className="form-slider slider-tercera"
                    min="0"
                    max="100"
                    value={porcentajeTercera}
                    onChange={(e) => handleSliderChange("tercera", parseInt(e.target.value))}
                  />
                </div>

                {/* Selector Canal */}
                <div className="form-group" style={{ marginTop: "20px" }}>
                  <label className="form-label" htmlFor="vip-canal">
                    Canal Principal de Venta
                  </label>
                  <div className="select-wrapper">
                    <select
                      id="vip-canal"
                      className="form-select"
                      value={canal}
                      onChange={(e: any) => setCanal(e.target.value)}
                    >
                      <option value="marketplace">Marketplace / FB (Venta digital)</option>
                      <option value="whatsapp">WhatsApp / Catálogo (Clientes directos)</option>
                      <option value="tianguis">Tianguis / Local Físico</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* PASO 5: Meta y Precio Actual */}
            {step === 5 && (
              <div className="animate-fade-in">
                <h2>Paso 5: Meta y Comparativa</h2>

                {/* Meta Ganancia */}
                <div className="form-group">
                  <label className="form-label">Meta de Ganancia</label>
                  <div className="segmented-control">
                    <button
                      type="button"
                      className={`segmented-button ${metaSeleccionada === "2" ? "active" : ""}`}
                      onClick={() => setMetaSeleccionada("2")}
                    >
                      x2 (Duplicar)
                    </button>
                    <button
                      type="button"
                      className={`segmented-button ${metaSeleccionada === "2.5" ? "active" : ""}`}
                      onClick={() => setMetaSeleccionada("2.5")}
                    >
                      x2.5 (Sugerido)
                    </button>
                    <button
                      type="button"
                      className={`segmented-button ${metaSeleccionada === "3" ? "active" : ""}`}
                      onClick={() => setMetaSeleccionada("3")}
                    >
                      x3 (Triplicar)
                    </button>
                    <button
                      type="button"
                      className={`segmented-button ${metaSeleccionada === "custom" ? "active" : ""}`}
                      onClick={() => setMetaSeleccionada("custom")}
                    >
                      Otro
                    </button>
                  </div>

                  {metaSeleccionada === "custom" && (
                    <div className="animate-fade-in" style={{ marginBottom: "16px" }}>
                      <label className="form-label" htmlFor="vip-meta-custom" style={{ fontSize: "12px" }}>
                        Multiplicador personalizado (ej. 3.5)
                      </label>
                      <input
                        id="vip-meta-custom"
                        type="number"
                        step="0.1"
                        min="1.1"
                        max="10"
                        className="form-input"
                        placeholder="Ej. 2.7"
                        required
                        value={metaPersonalizada}
                        onChange={(e) => setMetaPersonalizada(e.target.value)}
                      />
                    </div>
                  )}
                </div>

                {/* Precio actual hoy */}
                <div className="form-group">
                  <label className="form-label" htmlFor="vip-precio-hoy">
                    ¿A cuánto vendes HOY promedio por prenda? (Opcional)
                  </label>
                  <div className="input-wrapper">
                    <span className="input-prefix">$</span>
                    <input
                      id="vip-precio-hoy"
                      type="number"
                      className="form-input has-prefix"
                      placeholder="Ej. 65"
                      value={precioHoy}
                      onChange={(e) => setPrecioHoy(e.target.value)}
                    />
                  </div>
                  <p style={{ marginTop: "4px", fontSize: "12px", color: "var(--text-muted)" }}>
                    Sirve para calcular cuánto dinero extra te generaría nuestro sistema.
                  </p>
                </div>

                {/* Pacas al mes (Si metió precio de venta actual) */}
                {precioHoy && parseFloat(precioHoy) > 0 && (
                  <div className="form-group animate-fade-in">
                    <label className="form-label" htmlFor="vip-pacas-mes">
                      ¿Cuántas pacas vendes / compras al mes?
                    </label>
                    <input
                      id="vip-pacas-mes"
                      type="number"
                      className="form-input"
                      min="1"
                      placeholder="Ej. 2"
                      value={pacasAlMes}
                      onChange={(e) => setPacasAlMes(e.target.value)}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Acciones del Formulario */}
            <div className="step-actions">
              {step > 1 && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleBack}
                  style={{ flex: 1 }}
                >
                  Atrás
                </button>
              )}
              {step < 5 ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleNext}
                  style={{ flex: 2 }}
                >
                  Siguiente
                </button>
              ) : (
                <button
                  type="submit"
                  className="btn btn-primary"
                  id="btn-submit-vip"
                  style={{ flex: 2 }}
                >
                  Calcular Rendimiento
                </button>
              )}
            </div>
          </form>

          {/* Sección de Historial en formulario (v2 LocalStorage) */}
          {historial.length > 0 && (
            <div className="history-container">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h2 style={{ fontSize: "16px", margin: 0 }}>Historial de Pacas</h2>
                <button 
                  onClick={handleClearHistory} 
                  style={{ background: "none", border: "none", color: "var(--error)", fontSize: "12px", cursor: "pointer", fontWeight: "600" }}
                >
                  Borrar Todo
                </button>
              </div>
              <div>
                {historial.map((item) => (
                  <div 
                    key={item.id} 
                    className="history-item"
                    onClick={() => loadHistoryItem(item)}
                    title="Hacer clic para cargar estos datos"
                  >
                    <div className="history-item-details">
                      <span className="history-item-name">{item.nombre}</span>
                      <span className="history-item-meta">{item.fecha} · {item.prendas} pzas</span>
                    </div>
                    <span className="history-item-profit">
                      +${item.ganancia.toLocaleString('es-MX')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* VISTA DE RESULTADOS */
        <ResultCard
          resultados={resultados}
          userName={userName}
          canal={canal}
          onReset={handleReset}
        />
      )}
    </main>
  );
}
