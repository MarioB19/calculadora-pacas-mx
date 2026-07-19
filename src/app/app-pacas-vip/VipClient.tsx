"use client";

import React, { useState, useEffect } from "react";
import { 
  realizarCalculos, 
  calcularEvaluacionPreCompra, 
  CalculoResultados, 
  NOMBRES_CANALES, 
  PRECIOS_SEMILLA 
} from "../../lib/preciosMX";
import ResultCard from "../../components/ResultCard";

interface VentasLog {
  id: string;
  fecha: string;
  categoria: 'primera' | 'segunda' | 'tercera';
  precio: number;
  cantidad: number;
}

interface HistorialPaca {
  id: string;
  fecha: string;
  nombre: string;
  costo: number;
  prendas: number;
  ganancia: number;
  inputData: any;
  // Nuevos campos v1.1
  schemaVersion?: number;
  estado?: 'calculada' | 'en_seguimiento' | 'recuperada';
  ventas?: VentasLog[];
  preciosAjustados?: {
    primera: number;
    segunda: number;
    tercera: number;
  };
}

interface OfertaEvaluada {
  id: string;
  nombre: string;
  costo: number;
  prendas: number;
  porcentajePrimera: number;
  porcentajeSegunda: number;
  porcentajeTercera: number;
  canal: 'marketplace' | 'whatsapp' | 'tianguis';
  resultado: any;
}

export default function VipClient() {
  const [tab, setTab] = useState<"calcular" | "evaluar" | "mis_pacas">("calcular");
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
  const [lastCalculatedPacaId, setLastCalculatedPacaId] = useState<string | null>(null);
  const [historial, setHistorial] = useState<HistorialPaca[]>([]);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  // Estados del Evaluador Pre-Compra
  const [evalNombre, setEvalNombre] = useState("");
  const [evalCosto, setEvalCosto] = useState("");
  const [evalPrendas, setEvalPrendas] = useState("");
  const [evalPrimera, setEvalPrimera] = useState(20);
  const [evalSegunda, setEvalSegunda] = useState(60);
  const [evalTercera, setEvalTercera] = useState(20);
  const [evalCanal, setEvalCanal] = useState<"marketplace" | "whatsapp" | "tianguis">("marketplace");
  const [ofertas, setOfertas] = useState<OfertaEvaluada[]>([]);

  // Estados del Modo Seguimiento Activo
  const [selectedPacaId, setSelectedPacaId] = useState<string | null>(null);
  const [logVentaCat, setLogVentaCat] = useState<'primera' | 'segunda' | 'tercera'>('primera');
  const [logVentaPrecio, setLogVentaPrecio] = useState("");
  const [logVentaCantidad, setLogVentaCantidad] = useState(1);

  useEffect(() => {
    // Cargar historial desde localStorage al iniciar con migración a v1.1
    const saved = localStorage.getItem("pacas_history_log");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          let modified = false;
          const migrated = parsed.map((item: any) => {
            if (!item.schemaVersion || item.schemaVersion < 2) {
              modified = true;
              
              // Recalcular precios de semilla para guardarlos como precios sugeridos base
              let p1 = 0, p2 = 0, p3 = 0;
              try {
                const res = realizarCalculos({
                  costoPaca: parseFloat(item.inputData?.costoPaca || item.costo),
                  gastosExtra: parseFloat(item.inputData?.gastosExtra) || 0,
                  prendas: parseInt(item.inputData?.prendas || item.prendas),
                  porcentajePrimera: item.inputData?.porcentajePrimera ?? 20,
                  porcentajeSegunda: item.inputData?.porcentajeSegunda ?? 60,
                  porcentajeTercera: item.inputData?.porcentajeTercera ?? 20,
                  merma: parseFloat(item.inputData?.merma) || 5,
                  metaGanancia: item.inputData?.metaSeleccionada === "custom" 
                    ? parseFloat(item.inputData?.metaPersonalizada) 
                    : parseFloat(item.inputData?.metaSeleccionada || "2.5"),
                  canal: item.inputData?.canal || "marketplace"
                });
                p1 = res.precio1;
                p2 = res.precio2;
                p3 = res.precio3;
              } catch (err) {
                console.error("Error recalculating for migration", err);
              }

              return {
                ...item,
                schemaVersion: 2,
                estado: item.estado || 'calculada',
                ventas: item.ventas || [],
                preciosAjustados: {
                  primera: p1 || 120,
                  segunda: p2 || 60,
                  tercera: p3 || 20
                }
              };
            }
            return item;
          });

          setHistorial(migrated);
          if (modified) {
            localStorage.setItem("pacas_history_log", JSON.stringify(migrated));
          }
        }
      } catch (e) {
        console.error("Error al cargar historial", e);
      }
    }
  }, []);

  // Algoritmo de auto-balanceo para los sliders de clasificación
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

    p1 = Math.max(0, Math.min(100, p1));
    p2 = Math.max(0, Math.min(100, p2));
    p3 = Math.max(0, Math.min(100, p3));

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

  // Auto-balanceo para el Evaluador
  const handleEvalSliderChange = (
    category: "primera" | "segunda" | "tercera",
    newValue: number
  ) => {
    let p1 = evalPrimera;
    let p2 = evalSegunda;
    let p3 = evalTercera;

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

    p1 = Math.max(0, Math.min(100, p1));
    p2 = Math.max(0, Math.min(100, p2));
    p3 = Math.max(0, Math.min(100, p3));

    const total = p1 + p2 + p3;
    if (total !== 100) {
      const adjustment = 100 - total;
      if (category === "primera") {
        p2 += adjustment;
      } else {
        p1 += adjustment;
      }
    }

    setEvalPrimera(p1);
    setEvalSegunda(p2);
    setEvalTercera(p3);
  };

  const handleNext = () => {
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

    const pacaId = Date.now().toString();
    setLastCalculatedPacaId(pacaId);

    const nombrePaca = pacaName.trim() || `Paca de $${costo.toLocaleString()}`;
    const nuevoLog: HistorialPaca = {
      id: pacaId,
      fecha: new Date().toLocaleDateString("es-MX", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }),
      nombre: nombrePaca,
      costo: costo + extra,
      prendas: pzas,
      ganancia: res.gananciaProyectada,
      schemaVersion: 2,
      estado: 'calculada',
      ventas: [],
      preciosAjustados: {
        primera: res.precio1,
        segunda: res.precio2,
        tercera: res.precio3
      },
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

    const nuevoHistorial = [nuevoLog, ...historial.slice(0, 9)];
    setHistorial(nuevoHistorial);
    localStorage.setItem("pacas_history_log", JSON.stringify(nuevoHistorial));
  };

  const handleReset = () => {
    setResultados(null);
    setLastCalculatedPacaId(null);
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

    // Recalcular resultados usando precios guardados en historial para que persista
    const res = realizarCalculos({
      costoPaca: parseFloat(data.costoPaca),
      gastosExtra: parseFloat(data.gastosExtra) || 0,
      prendas: parseInt(data.prendas),
      porcentajePrimera: data.porcentajePrimera,
      porcentajeSegunda: data.porcentajeSegunda,
      porcentajeTercera: data.porcentajeTercera,
      merma: parseFloat(data.merma) || 5,
      metaGanancia: data.metaSeleccionada === "custom" ? parseFloat(data.metaPersonalizada) : parseFloat(data.metaSeleccionada || "2.5"),
      canal: data.canal,
      precioHoy: data.precioHoy ? parseFloat(data.precioHoy) : undefined,
      pacasAlMes: parseInt(data.pacasAlMes) || 1
    });

    // Si tiene precios manuales guardados, aplicarlos
    if (item.preciosAjustados) {
      res.precio1 = item.preciosAjustados.primera;
      res.precio2 = item.preciosAjustados.segunda;
      res.precio3 = item.preciosAjustados.tercera;
      res.ingresosTotales = (res.prendas1 * res.precio1) + (res.prendas2 * res.precio2) + (res.prendas3 * res.precio3);
      res.gananciaProyectada = res.ingresosTotales - res.inversionTotal;
      res.gananciaMultiplicador = res.inversionTotal > 0 ? res.ingresosTotales / res.inversionTotal : 0;
    }

    setResultados(res);
    setLastCalculatedPacaId(item.id);
    setTab("calcular");
  };

  const handleClearHistory = () => {
    if (confirm("¿Estás seguro de borrar todo tu historial de pacas?")) {
      setHistorial([]);
      localStorage.removeItem("pacas_history_log");
      setSelectedPacaId(null);
    }
  };

  // Activa el modo seguimiento desde el ResultCard
  const handleActivateTrackingFromResults = (pacaId: string, adjustedPrices: { primera: number, segunda: number, tercera: number }) => {
    const updated = historial.map(item => {
      if (item.id === pacaId) {
        return {
          ...item,
          estado: 'en_seguimiento' as const,
          preciosAjustados: adjustedPrices
        };
      }
      return item;
    });
    setHistorial(updated);
    localStorage.setItem("pacas_history_log", JSON.stringify(updated));
    setSelectedPacaId(pacaId);
    
    // Inicializar inputs de ventas con el primer precio ajustado
    const activePaca = updated.find(p => p.id === pacaId);
    if (activePaca && activePaca.preciosAjustados) {
      setLogVentaPrecio(activePaca.preciosAjustados.primera.toString());
    }
    setLogVentaCat('primera');
    setLogVentaCantidad(1);

    setTab("mis_pacas");
  };

  // Inicia seguimiento directo desde la lista de pacas
  const handleStartTrackingFromList = (pacaId: string) => {
    const updated = historial.map(item => {
      if (item.id === pacaId) {
        return {
          ...item,
          estado: 'en_seguimiento' as const
        };
      }
      return item;
    });
    setHistorial(updated);
    localStorage.setItem("pacas_history_log", JSON.stringify(updated));
    setSelectedPacaId(pacaId);

    const activePaca = updated.find(p => p.id === pacaId);
    if (activePaca && activePaca.preciosAjustados) {
      setLogVentaPrecio(activePaca.preciosAjustados.primera.toString());
    }
    setLogVentaCat('primera');
    setLogVentaCantidad(1);
  };

  // Agregar venta en seguimiento
  const handleAddVenta = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPacaId) return;

    const pzCount = logVentaCantidad;
    const prcVal = parseFloat(logVentaPrecio);

    if (isNaN(pzCount) || pzCount <= 0 || isNaN(prcVal) || prcVal < 0) {
      alert("Por favor ingresa cantidad y precio válidos.");
      return;
    }

    const targetPaca = historial.find(p => p.id === selectedPacaId);
    if (!targetPaca) return;

    // Calcular distribución para advertencia
    const calc = realizarCalculos({
      costoPaca: parseFloat(targetPaca.inputData.costoPaca),
      gastosExtra: parseFloat(targetPaca.inputData.gastosExtra) || 0,
      prendas: parseInt(targetPaca.inputData.prendas),
      porcentajePrimera: targetPaca.inputData.porcentajePrimera,
      porcentajeSegunda: targetPaca.inputData.porcentajeSegunda,
      porcentajeTercera: targetPaca.inputData.porcentajeTercera,
      merma: parseFloat(targetPaca.inputData.merma) || 5,
      metaGanancia: 2.0,
      canal: targetPaca.inputData.canal
    });

    const maxQty = logVentaCat === 'primera' ? calc.prendas1 : logVentaCat === 'segunda' ? calc.prendas2 : calc.prendas3;
    const currentSold = (targetPaca.ventas || [])
      .filter(v => v.categoria === logVentaCat)
      .reduce((sum, v) => sum + v.cantidad, 0);

    if (currentSold + pzCount > maxQty) {
      if (!confirm(`⚠️ Estás registrando más prendas de ${logVentaCat === 'primera' ? 'Primera' : logVentaCat === 'segunda' ? 'Segunda' : 'Tercera'} de las proyectadas (${maxQty} max). ¿Deseas continuar de todos modos?`)) {
        return;
      }
    }

    const nuevaVenta: VentasLog = {
      id: Date.now().toString(),
      fecha: new Date().toLocaleDateString("es-MX", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }),
      categoria: logVentaCat,
      precio: prcVal,
      cantidad: pzCount
    };

    const updatedVentas = [...(targetPaca.ventas || []), nuevaVenta];
    const totalRecuperado = updatedVentas.reduce((sum, v) => sum + (v.precio * v.cantidad), 0);
    const inversionTotal = targetPaca.costo;
    const nuevoEstado = totalRecuperado >= inversionTotal ? 'recuperada' : 'en_seguimiento';

    const updatedHistorial = historial.map(item => {
      if (item.id === selectedPacaId) {
        return {
          ...item,
          ventas: updatedVentas,
          estado: nuevoEstado as any
        };
      }
      return item;
    });

    setHistorial(updatedHistorial);
    localStorage.setItem("pacas_history_log", JSON.stringify(updatedHistorial));

    // Resetear form de venta
    setLogVentaCantidad(1);
    // Mantener precio actual de la categoría elegida
    const activePaca = updatedHistorial.find(p => p.id === selectedPacaId);
    if (activePaca && activePaca.preciosAjustados) {
      setLogVentaPrecio(activePaca.preciosAjustados[logVentaCat].toString());
    }
  };

  // Eliminar venta en seguimiento
  const handleDeleteVenta = (ventaId: string) => {
    if (!selectedPacaId) return;

    const targetPaca = historial.find(p => p.id === selectedPacaId);
    if (!targetPaca) return;

    const updatedVentas = (targetPaca.ventas || []).filter(v => v.id !== ventaId);
    const totalRecuperado = updatedVentas.reduce((sum, v) => sum + (v.precio * v.cantidad), 0);
    const inversionTotal = targetPaca.costo;
    const nuevoEstado = totalRecuperado >= inversionTotal ? 'recuperada' : 'en_seguimiento';

    const updatedHistorial = historial.map(item => {
      if (item.id === selectedPacaId) {
        return {
          ...item,
          ventas: updatedVentas,
          estado: nuevoEstado as any
        };
      }
      return item;
    });

    setHistorial(updatedHistorial);
    localStorage.setItem("pacas_history_log", JSON.stringify(updatedHistorial));
  };

  const handleLogVentaCatChange = (cat: 'primera' | 'segunda' | 'tercera') => {
    setLogVentaCat(cat);
    const targetPaca = historial.find(p => p.id === selectedPacaId);
    if (targetPaca && targetPaca.preciosAjustados) {
      setLogVentaPrecio(targetPaca.preciosAjustados[cat].toString());
    }
  };

  // Evaluador: Agregar Oferta
  const handleAddOferta = (e: React.FormEvent) => {
    e.preventDefault();
    const costo = parseFloat(evalCosto);
    const pzas = parseInt(evalPrendas);

    if (isNaN(costo) || costo <= 0 || isNaN(pzas) || pzas <= 0) {
      alert("Ingresa valores de costo y prendas válidos.");
      return;
    }

    if (ofertas.length >= 3) {
      alert("Puedes comparar un máximo de 3 ofertas lado a lado.");
      return;
    }

    const resultado = calcularEvaluacionPreCompra({
      costoPaca: costo,
      prendas: pzas,
      porcentajePrimera: evalPrimera,
      porcentajeSegunda: evalSegunda,
      porcentajeTercera: evalTercera,
      canal: evalCanal
    });

    const nuevaOferta: OfertaEvaluada = {
      id: Date.now().toString(),
      nombre: evalNombre.trim() || `Oferta ${ofertas.length + 1}`,
      costo,
      prendas: pzas,
      porcentajePrimera: evalPrimera,
      porcentajeSegunda: evalSegunda,
      porcentajeTercera: evalTercera,
      canal: evalCanal,
      resultado
    };

    setOfertas([...ofertas, nuevaOferta]);
    
    // Limpiar formulario evaluador
    setEvalNombre("");
    setEvalCosto("");
    setEvalPrendas("");
  };

  const handleDeleteOferta = (id: string) => {
    setOfertas(ofertas.filter(o => o.id !== id));
  };

  // Cargar oferta seleccionada en el formulario de la calculadora
  const handleBuyOferta = (oferta: OfertaEvaluada) => {
    setPacaName(oferta.nombre);
    setCostoPaca(oferta.costo.toString());
    setGastosExtra("0");
    setPrendas(oferta.prendas.toString());
    setMerma("5");
    setPorcentajePrimera(oferta.porcentajePrimera);
    setPorcentajeSegunda(oferta.porcentajeSegunda);
    setPorcentajeTercera(oferta.porcentajeTercera);
    setCanal(oferta.canal);
    setMetaSeleccionada("2.5");
    setMetaPersonalizada("");
    setPrecioHoy("");
    setPacasAlMes("1");
    setResultados(null);
    setLastCalculatedPacaId(null);
    setStep(5); // Ir al paso final para calcular directamente
    setTab("calcular");
  };

  // Encontrar el ID de la mejor oferta para resaltarla
  const getMejorOfertaId = () => {
    if (ofertas.length === 0) return null;
    let mejor = ofertas[0];
    for (let i = 1; i < ofertas.length; i++) {
      if (ofertas[i].resultado.ratio > mejor.resultado.ratio) {
        mejor = ofertas[i];
      } else if (ofertas[i].resultado.ratio === mejor.resultado.ratio) {
        if (ofertas[i].resultado.gananciaProyectada > mejor.resultado.gananciaProyectada) {
          mejor = ofertas[i];
        }
      }
    }
    return mejor.id;
  };

  const mejorOfertaId = getMejorOfertaId();

  // Elementos activos para el modo de seguimiento de la paca seleccionada
  const activeTrackingPaca = historial.find(p => p.id === selectedPacaId);
  let trackingStats: any = null;

  if (activeTrackingPaca) {
    const paca = activeTrackingPaca;
    const inv = paca.costo;
    const ventas = paca.ventas || [];
    const totalRecuperado = ventas.reduce((sum, v) => sum + (v.precio * v.cantidad), 0);
    const restante = Math.max(0, inv - totalRecuperado);

    // Calcular distribución de prendas
    const calc = realizarCalculos({
      costoPaca: parseFloat(paca.inputData.costoPaca),
      gastosExtra: parseFloat(paca.inputData.gastosExtra) || 0,
      prendas: parseInt(paca.inputData.prendas),
      porcentajePrimera: paca.inputData.porcentajePrimera,
      porcentajeSegunda: paca.inputData.porcentajeSegunda,
      porcentajeTercera: paca.inputData.porcentajeTercera,
      merma: parseFloat(paca.inputData.merma) || 5,
      metaGanancia: 2.0,
      canal: paca.inputData.canal
    });

    const v1 = ventas.filter(v => v.categoria === 'primera').reduce((sum, v) => sum + v.cantidad, 0);
    const v2 = ventas.filter(v => v.categoria === 'segunda').reduce((sum, v) => sum + v.cantidad, 0);
    const v3 = ventas.filter(v => v.categoria === 'tercera').reduce((sum, v) => sum + v.cantidad, 0);

    const r1 = Math.max(0, calc.prendas1 - v1);
    const r2 = Math.max(0, calc.prendas2 - v2);
    const r3 = Math.max(0, calc.prendas3 - v3);

    // Precios ajustados
    const p1 = paca.preciosAjustados?.primera || 0;
    const p2 = paca.preciosAjustados?.segunda || 0;
    const p3 = paca.preciosAjustados?.tercera || 0;

    // Greedy breakeven recommendation
    let rem = restante;
    let n1 = 0, n2 = 0, n3 = 0;
    let recommendation = "";

    if (rem > 0) {
      if (p1 > 0) {
        const max1 = r1 * p1;
        if (max1 >= rem) {
          n1 = Math.ceil(rem / p1);
          rem = 0;
        } else {
          n1 = r1;
          rem -= max1;
        }
      }
      if (rem > 0 && p2 > 0) {
        const max2 = r2 * p2;
        if (max2 >= rem) {
          n2 = Math.ceil(rem / p2);
          rem = 0;
        } else {
          n2 = r2;
          rem -= max2;
        }
      }
      if (rem > 0 && p3 > 0) {
        const max3 = r3 * p3;
        if (max3 >= rem) {
          n3 = Math.ceil(rem / p3);
          rem = 0;
        } else {
          n3 = r3;
          rem -= max3;
        }
      }

      if (n1 > 0) {
        recommendation = `Te faltan vender ~${n1} prendas de Primera para recuperar tu inversión.`;
      } else if (n2 > 0) {
        recommendation = `Te faltan vender ~${n2} prendas de Segunda para recuperar tu inversión.`;
      } else if (n3 > 0) {
        recommendation = `Te faltan vender ~${n3} prendas de Tercera para recuperar tu inversión.`;
      } else {
        recommendation = `Aún vendiendo toda tu ropa restante, te faltarían $${rem.toLocaleString('es-MX')} para recuperar tu paca.`;
      }
    } else {
      recommendation = "🎉 ¡Paca recuperada! Desde aquí todo es ganancia neta para ti.";
    }

    // Comparación real vs proyectado
    const originalProyectado = (calc.prendas1 * p1) + (calc.prendas2 * p2) + (calc.prendas3 * p3);
    const gananciaOriginal = originalProyectado - inv;

    const inventarioRestanteValuado = (r1 * p1) + (r2 * p2) + (r3 * p3);
    const totalVentasEstimadas = totalRecuperado + inventarioRestanteValuado;
    const gananciaEstimadaActualizada = totalVentasEstimadas - inv;

    trackingStats = {
      inversionTotal: inv,
      totalRecuperado,
      restante,
      pctRecuperado: (totalRecuperado / Math.max(inv, originalProyectado)) * 100,
      pctBreakeven: (inv / Math.max(inv, originalProyectado)) * 100,
      recommendation,
      originalProyectado,
      gananciaOriginal,
      totalVentasEstimadas,
      gananciaEstimadaActualizada,
      r1, r2, r3,
      v1, v2, v3,
      calc
    };
  }

  return (
    <main className="app-container">
      {/* TABS VIP */}
      <div className="vip-tabs">
        <button
          className={`vip-tab-btn ${tab === "calcular" ? "active" : ""}`}
          onClick={() => setTab("calcular")}
        >
          🧮 Calcular
        </button>
        <button
          className={`vip-tab-btn ${tab === "evaluar" ? "active" : ""}`}
          onClick={() => setTab("evaluar")}
        >
          🟢 Evaluar
        </button>
        <button
          className={`vip-tab-btn ${tab === "mis_pacas" ? "active" : ""}`}
          onClick={() => setTab("mis_pacas")}
        >
          📂 Mis Pacas
        </button>
      </div>

      {/* TAB 1: CALCULAR */}
      {tab === "calcular" && (
        <>
          {!resultados ? (
            <div className="glass-card animate-fade-in" style={{ maxWidth: "600px", margin: "10px auto 24px auto", width: "100%" }}>
              {/* Indicador de pasos */}
              <div className="steps-indicator">
                <div className="steps-progress-bar">
                  <div className="steps-progress-fill" style={{ width: `${(step - 1) * 25}%` }}></div>
                </div>
                {[1, 2, 3, 4, 5].map((s) => (
                  <div
                    key={s}
                    className={`step-node ${step === s ? "active" : ""} ${
                      step > s ? "completed" : ""
                    }`}
                  >
                    {step > s ? "✓" : s}
                  </div>
                ))}
              </div>

              <div style={{ textAlign: "center", fontSize: "12.5px", fontWeight: "700", color: "var(--primary-light)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "20px" }}>
                Paso {step} de 5: {step === 1 && "Identificación"} {step === 2 && "Inversión"} {step === 3 && "Inventario"} {step === 4 && "Calidad y Canal"} {step === 5 && "Meta y Comparación"}
              </div>

              <h1>Calculadora de Paca VIP</h1>
              <p className="subtitle">
                Calcula precios de reventa inteligentes y optimiza las ganancias de tus pacas.
              </p>

              <form onSubmit={handleCalculate} style={{ textAlign: "left" }}>
                {step === 1 && (
                  <div className="animate-fade-in">
                    <h2>Paso 1: Identificación</h2>
                    <div className="form-group">
                      <label className="form-label" htmlFor="user-name">
                        Tu Nombre (Opcional)
                      </label>
                      <div className="input-icon-wrapper">
                        <input
                          id="user-name"
                          type="text"
                          className="form-input has-icon"
                          placeholder="Ej. Ana"
                          value={userName}
                          onChange={(e) => setUserName(e.target.value)}
                        />
                        <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                          <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="paca-name">
                        Nombre o etiqueta de la Paca (Opcional)
                      </label>
                      <div className="input-icon-wrapper">
                        <input
                          id="paca-name"
                          type="text"
                          className="form-input has-icon"
                          placeholder="Ej. Paca Premium Verano"
                          value={pacaName}
                          onChange={(e) => setPacaName(e.target.value)}
                        />
                        <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                          <line x1="7" y1="7" x2="7.01" y2="7"></line>
                        </svg>
                      </div>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="animate-fade-in">
                    <h2>Paso 2: Inversión de la Paca</h2>
                    <div className="form-group">
                      <label className="form-label" htmlFor="vip-costo-paca">
                        Costo de la Paca (MXN) *
                      </label>
                      <div className="input-icon-wrapper">
                        <input
                          id="vip-costo-paca"
                          type="number"
                          className="form-input has-icon"
                          placeholder="Ej. 4500"
                          required
                          min="1"
                          value={costoPaca}
                          onChange={(e) => setCostoPaca(e.target.value)}
                        />
                        <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="12" y1="1" x2="12" y2="23"></line>
                          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                        </svg>
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
                      <div className="input-icon-wrapper">
                        <input
                          id="vip-gastos-extra"
                          type="number"
                          className="form-input has-icon"
                          placeholder="Ej. 300"
                          value={gastosExtra}
                          onChange={(e) => setGastosExtra(e.target.value)}
                        />
                        <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="1" y="3" width="15" height="13"></rect>
                          <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                          <circle cx="5.5" cy="18.5" r="2.5"></circle>
                          <circle cx="18.5" cy="18.5" r="2.5"></circle>
                        </svg>
                      </div>
                      {activeTooltip === "gastos" && (
                        <div className="tooltip-content animate-fade-in" style={{ top: "34px", right: "0px" }}>
                          Suma el transporte, jabón de lavado, ganchos o empaque. ¡También forman parte de tu inversión inicial!
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="animate-fade-in">
                    <h2>Paso 3: Prendas y Merma</h2>
                    <div className="form-group">
                      <label className="form-label" htmlFor="vip-prendas">
                        Número de prendas aproximadas *
                      </label>
                      <div className="input-icon-wrapper">
                        <input
                          id="vip-prendas"
                          type="number"
                          className="form-input has-icon"
                          placeholder="Ej. 100"
                          required
                          min="1"
                          value={prendas}
                          onChange={(e) => setPrendas(e.target.value)}
                        />
                        <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 2a3 3 0 0 0-3 3h6a3 3 0 0 0-3-3z"></path>
                          <path d="M2 17h20a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-5l-4-4-4 4H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2z"></path>
                        </svg>
                      </div>
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
                      <div className="input-icon-wrapper">
                        <input
                          id="vip-merma"
                          type="number"
                          className="form-input has-icon"
                          placeholder="Ej. 5"
                          min="0"
                          max="90"
                          value={merma}
                          onChange={(e) => setMerma(e.target.value)}
                        />
                        <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 6h18"></path>
                          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                          <line x1="10" y1="11" x2="10" y2="17"></line>
                          <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                      </div>
                      {activeTooltip === "merma" && (
                        <div className="tooltip-content animate-fade-in" style={{ top: "34px", right: "0px" }}>
                          Siempre hay prendas que vienen rotas, inservibles o manchadas que no podrás vender. Se descuentan del lote de Remates.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div className="animate-fade-in">
                    <h2>Paso 4: Clasificación y Canal de Venta</h2>
                    <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "16px" }}>
                      Ajusta la calidad esperada de tu ropa. Los 3 sliders deben sumar 100% (se auto-balancean al moverlos).
                    </p>

                    <div className="slider-container">
                      <div className="slider-header">
                        <span className="category-name">⭐️ Primera (Marca/Etiqueta)</span>
                        <span className="percentage">{porcentajePrimera}%</span>
                      </div>
                      <div className="slider-control-row">
                        <button type="button" className="slider-btn" onClick={() => handleSliderChange("primera", Math.max(0, porcentajePrimera - 5))}>-</button>
                        <input type="range" className="form-slider slider-primera" min="0" max="100" value={porcentajePrimera} onChange={(e) => handleSliderChange("primera", parseInt(e.target.value))} />
                        <button type="button" className="slider-btn" onClick={() => handleSliderChange("primera", Math.min(100, porcentajePrimera + 5))}>+</button>
                      </div>
                    </div>

                    <div className="slider-container">
                      <div className="slider-header">
                        <span className="category-name">✨ Segunda (Buen estado)</span>
                        <span className="percentage">{porcentajeSegunda}%</span>
                      </div>
                      <div className="slider-control-row">
                        <button type="button" className="slider-btn" onClick={() => handleSliderChange("segunda", Math.max(0, porcentajeSegunda - 5))}>-</button>
                        <input type="range" className="form-slider slider-segunda" min="0" max="100" value={porcentajeSegunda} onChange={(e) => handleSliderChange("segunda", parseInt(e.target.value))} />
                        <button type="button" className="slider-btn" onClick={() => handleSliderChange("segunda", Math.min(100, porcentajeSegunda + 5))}>+</button>
                      </div>
                    </div>

                    <div className="slider-container">
                      <div className="slider-header">
                        <span className="category-name">⚡️ Tercera (Defectos/Remate)</span>
                        <span className="percentage">{porcentajeTercera}%</span>
                      </div>
                      <div className="slider-control-row">
                        <button type="button" className="slider-btn" onClick={() => handleSliderChange("tercera", Math.max(0, porcentajeTercera - 5))}>-</button>
                        <input type="range" className="form-slider slider-tercera" min="0" max="100" value={porcentajeTercera} onChange={(e) => handleSliderChange("tercera", parseInt(e.target.value))} />
                        <button type="button" className="slider-btn" onClick={() => handleSliderChange("tercera", Math.min(100, porcentajeTercera + 5))}>+</button>
                      </div>
                    </div>

                    <div className="form-group" style={{ marginTop: "20px" }}>
                      <label className="form-label" htmlFor="vip-canal">
                        Canal Principal de Venta
                      </label>
                      <div className="select-wrapper">
                        <select id="vip-canal" className="form-select" value={canal} onChange={(e: any) => setCanal(e.target.value)}>
                          <option value="marketplace">Marketplace / FB (Venta digital)</option>
                          <option value="whatsapp">WhatsApp / Catálogo (Clientes directos)</option>
                          <option value="tianguis">Tianguis / Local Físico</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {step === 5 && (
                  <div className="animate-fade-in">
                    <h2>Paso 5: Meta y Comparativa</h2>
                    <div className="form-group">
                      <label className="form-label">Meta de Ganancia</label>
                      <div className="segmented-control">
                        <button type="button" className={`segmented-button ${metaSeleccionada === "2" ? "active" : ""}`} onClick={() => setMetaSeleccionada("2")}>x2 (Duplicar)</button>
                        <button type="button" className={`segmented-button ${metaSeleccionada === "2.5" ? "active" : ""}`} onClick={() => setMetaSeleccionada("2.5")}>x2.5 (Sugerido)</button>
                        <button type="button" className={`segmented-button ${metaSeleccionada === "3" ? "active" : ""}`} onClick={() => setMetaSeleccionada("3")}>x3 (Triplicar)</button>
                        <button type="button" className={`segmented-button ${metaSeleccionada === "custom" ? "active" : ""}`} onClick={() => setMetaSeleccionada("custom")}>Otro</button>
                      </div>

                      {metaSeleccionada === "custom" && (
                        <div className="animate-fade-in" style={{ marginBottom: "16px" }}>
                          <label className="form-label" htmlFor="vip-meta-custom" style={{ fontSize: "12px" }}>Multiplicador personalizado (ej. 3.5)</label>
                          <input id="vip-meta-custom" type="number" step="0.1" min="1.1" max="10" className="form-input" placeholder="Ej. 2.7" required value={metaPersonalizada} onChange={(e) => setMetaPersonalizada(e.target.value)} />
                        </div>
                      )}
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="vip-precio-hoy">
                        ¿A cuánto vendes HOY promedio por prenda? (Opcional)
                      </label>
                      <div className="input-icon-wrapper">
                        <input id="vip-precio-hoy" type="number" className="form-input has-icon" placeholder="Ej. 65" value={precioHoy} onChange={(e) => setPrecioHoy(e.target.value)} />
                        <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="12" y1="1" x2="12" y2="23"></line>
                          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                        </svg>
                      </div>
                    </div>

                    {precioHoy && parseFloat(precioHoy) > 0 && (
                      <div className="form-group animate-fade-in">
                        <label className="form-label" htmlFor="vip-pacas-mes">¿Cuántas pacas vendes / compras al mes?</label>
                        <div className="input-icon-wrapper">
                          <input id="vip-pacas-mes" type="number" className="form-input has-icon" min="1" placeholder="Ej. 2" value={pacasAlMes} onChange={(e) => setPacasAlMes(e.target.value)} />
                          <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="step-actions">
                  {step > 1 && (
                    <button type="button" className="btn btn-secondary" onClick={handleBack} style={{ flex: 1 }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="19" y1="12" x2="5" y2="12"></line>
                        <polyline points="12 19 5 12 12 5"></polyline>
                      </svg>
                      Atrás
                    </button>
                  )}
                  {step < 5 ? (
                    <button type="button" className="btn btn-primary" onClick={handleNext} style={{ flex: 2 }}>
                      <span>Siguiente</span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                        <polyline points="12 5 19 12 12 19"></polyline>
                      </svg>
                    </button>
                  ) : (
                    <button type="submit" className="btn btn-primary" id="btn-submit-vip" style={{ flex: 2 }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="20" x2="12" y2="10" />
                        <line x1="12" y1="20" x2="18" y2="10" />
                        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                      </svg>
                      <span>Calcular Rendimiento</span>
                    </button>
                  )}
                </div>
              </form>

              {/* Historial rápido abajo del formulario */}
              {historial.length > 0 && (
                <div className="history-container">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <h2 style={{ fontSize: "16px", margin: 0 }}>Historial de Pacas</h2>
                    <button onClick={handleClearHistory} style={{ background: "none", border: "none", color: "var(--error)", fontSize: "12px", cursor: "pointer", fontWeight: "600" }}>Borrar Todo</button>
                  </div>
                  <div>
                    {historial.map((item) => (
                      <div key={item.id} className="history-item" onClick={() => loadHistoryItem(item)} title="Cargar paca en calculadora">
                        <div className="history-item-details">
                          <span className="history-item-name">{item.nombre}</span>
                          <span className="history-item-meta">{item.fecha} · {item.prendas} pzas · {item.estado === 'recuperada' ? '🎉 Recuperada' : item.estado === 'en_seguimiento' ? '📈 En Seguimiento' : 'Calculada'}</span>
                        </div>
                        <span className="history-item-profit">+${item.ganancia.toLocaleString('es-MX')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* RESULTADOS CARD CON CALLBACK DE SEGUIMIENTO */
            <ResultCard
              resultados={resultados}
              userName={userName}
              canal={canal}
              onReset={handleReset}
              pacaId={lastCalculatedPacaId || undefined}
              onActivateTracking={(prices) => {
                if (lastCalculatedPacaId) {
                  handleActivateTrackingFromResults(lastCalculatedPacaId, prices);
                }
              }}
            />
          )}
        </>
      )}

      {/* TAB 2: EVALUAR COMPRA */}
      {tab === "evaluar" && (
        <div className="evaluator-desktop-layout animate-fade-in" style={{ marginTop: "10px" }}>
          <div className="glass-card" style={{ marginBottom: 0 }}>
            <h1>¿Me conviene esta paca?</h1>
            <p className="subtitle">
              Ingresa los datos de una paca antes de comprarla y evalúa si cumple tus metas de negocio.
            </p>

            <form onSubmit={handleAddOferta} style={{ textAlign: "left" }}>
              <div className="form-group">
                <label className="form-label" htmlFor="eval-nombre">Nombre de la Oferta / Distribuidor</label>
                <input id="eval-nombre" type="text" className="form-input" placeholder="Ej. Paca Americana Premium - Distribuidor Norte" value={evalNombre} onChange={(e) => setEvalNombre(e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="eval-costo">Costo de la Paca (MXN) *</label>
                <input id="eval-costo" type="number" required min="1" className="form-input" placeholder="Ej. 3500" value={evalCosto} onChange={(e) => setEvalCosto(e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="eval-prendas">Prendas estimadas *</label>
                <input id="eval-prendas" type="number" required min="1" className="form-input" placeholder="Ej. 150" value={evalPrendas} onChange={(e) => setEvalPrendas(e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">Calidad Estimada (% prendas)</label>
                
                <div className="slider-container">
                  <div className="slider-header">
                    <span className="category-name">⭐️ Primera (Marca/Etiqueta)</span>
                    <span className="percentage">{evalPrimera}%</span>
                  </div>
                  <div className="slider-control-row">
                    <button type="button" className="slider-btn" onClick={() => handleEvalSliderChange("primera", Math.max(0, evalPrimera - 5))}>-</button>
                    <input type="range" className="form-slider slider-primera" min="0" max="100" value={evalPrimera} onChange={(e) => handleEvalSliderChange("primera", parseInt(e.target.value))} />
                    <button type="button" className="slider-btn" onClick={() => handleEvalSliderChange("primera", Math.min(100, evalPrimera + 5))}>+</button>
                  </div>
                </div>

                <div className="slider-container">
                  <div className="slider-header">
                    <span className="category-name">✨ Segunda (Buen estado)</span>
                    <span className="percentage">{evalSegunda}%</span>
                  </div>
                  <div className="slider-control-row">
                    <button type="button" className="slider-btn" onClick={() => handleEvalSliderChange("segunda", Math.max(0, evalSegunda - 5))}>-</button>
                    <input type="range" className="form-slider slider-segunda" min="0" max="100" value={evalSegunda} onChange={(e) => handleEvalSliderChange("segunda", parseInt(e.target.value))} />
                    <button type="button" className="slider-btn" onClick={() => handleEvalSliderChange("segunda", Math.min(100, evalSegunda + 5))}>+</button>
                  </div>
                </div>

                <div className="slider-container">
                  <div className="slider-header">
                    <span className="category-name">⚡️ Tercera (Defectos/Remate)</span>
                    <span className="percentage">{evalTercera}%</span>
                  </div>
                  <div className="slider-control-row">
                    <button type="button" className="slider-btn" onClick={() => handleEvalSliderChange("tercera", Math.max(0, evalTercera - 5))}>-</button>
                    <input type="range" className="form-slider slider-tercera" min="0" max="100" value={evalTercera} onChange={(e) => handleEvalSliderChange("tercera", parseInt(e.target.value))} />
                    <button type="button" className="slider-btn" onClick={() => handleEvalSliderChange("tercera", Math.min(100, evalTercera + 5))}>+</button>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="eval-canal">Canal de Venta Estimado</label>
                <div className="select-wrapper">
                  <select id="eval-canal" className="form-select" value={evalCanal} onChange={(e: any) => setEvalCanal(e.target.value)}>
                    <option value="marketplace">Marketplace / FB</option>
                    <option value="whatsapp">WhatsApp / Catálogo</option>
                    <option value="tianguis">Tianguis / Local Físico</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: "100%" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="16" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                </svg>
                Evaluar y Comparar Oferta
              </button>
            </form>
          </div>

          {/* Comparador side-by-side */}
          {ofertas.length > 0 ? (
            <div className="glass-card" style={{ marginBottom: 0 }}>
              <h2 style={{ fontSize: "18px", marginBottom: "12px" }}>
                Comparador de Ofertas ({ofertas.length}/3)
              </h2>
              
              <div className="ofertas-comparador">
                {ofertas.map((of) => {
                  const esMejor = of.id === mejorOfertaId;
                  const res = of.resultado;
                  return (
                    <div key={of.id} className={`oferta-card ${esMejor ? 'mejor' : ''}`}>
                      {esMejor && <span className="mejor-badge">Mejor Opción</span>}
                      
                      <div>
                        <div style={{ fontWeight: '800', fontSize: '15px', color: 'var(--text-main)', marginBottom: '4px' }}>{of.nombre}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                          Canal: {NOMBRES_CANALES[of.canal]}
                        </div>

                        {/* Veredicto semáforo */}
                        <div className={`badge-veredicto ${res.veredicto}`}>
                          {res.veredicto === 'verde' && "🟢 Los números salen"}
                          {res.veredicto === 'amarillo' && "🟡 Ajustado — negocia"}
                          {res.veredicto === 'rojo' && "🔴 No conviene"}
                        </div>

                        <div style={{ fontSize: '13px', margin: '6px 0' }}>
                          Inversión: <strong>${of.costo.toLocaleString('es-MX')}</strong>
                        </div>
                        <div style={{ fontSize: '13px', margin: '6px 0' }}>
                          Prendas: <strong>{of.prendas} pzas</strong> (1ra: {of.porcentajePrimera}%, 2da: {of.porcentajeSegunda}%, 3ra: {of.porcentajeTercera}%)
                        </div>
                        <div style={{ fontSize: '13px', margin: '6px 0' }}>
                          Costo/Prenda vendible: <strong>${res.costoPorPrenda.toFixed(2)}</strong>
                        </div>
                        <div style={{ fontSize: '13px', margin: '6px 0' }}>
                          Ganancia simulada: <strong style={{ color: res.veredicto === 'rojo' ? 'var(--error)' : 'var(--success)' }}>
                            ${res.gananciaProyectada.toLocaleString('es-MX')}
                          </strong>
                        </div>
                        
                        <div style={{ marginTop: '14px', padding: '10px', background: 'rgba(16, 42, 84, 0.03)', borderRadius: '6px', fontSize: '12.5px', borderLeft: '3px solid var(--primary-light)' }}>
                          <strong>Precio Máx Paca sugerido:</strong>
                          <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-main)', marginTop: '2px' }}>
                            ${Math.round(res.precioMaximoPagar).toLocaleString('es-MX')} MXN
                          </div>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            Para duplicar tu inversión vendiendo en este canal.
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
                        <button 
                          onClick={() => handleBuyOferta(of)} 
                          className="btn btn-primary" 
                          style={{ padding: '8px 12px', fontSize: '12.5px', borderRadius: '8px' }}
                        >
                          La compré → calcular precios
                        </button>
                        <button 
                          onClick={() => handleDeleteOferta(of.id)} 
                          className="btn btn-secondary" 
                          style={{ padding: '8px 12px', fontSize: '12.5px', borderRadius: '8px', color: 'var(--error)', borderColor: 'rgba(220, 38, 38, 0.2)' }}
                        >
                          Eliminar oferta
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', color: 'var(--text-muted)', textAlign: 'center', padding: '24px', marginBottom: 0 }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '12px', opacity: 0.5 }}>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <h3>Sin ofertas comparadas</h3>
              <p style={{ fontSize: '13px', marginTop: '6px' }}>Completa los datos de una oferta y haz clic en "Evaluar y Comparar Oferta" para comenzar.</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: MIS PACAS & SEGUIMIENTO */}
      {tab === "mis_pacas" && (
        <div className="glass-card animate-fade-in" style={{ marginTop: "10px" }}>
          {!selectedPacaId || !activeTrackingPaca ? (
            /* LISTADO DE PACAS GUARDADAS */
            <div>
              <h1>Mis Pacas</h1>
              <p className="subtitle">
                Lista de pacas registradas. Monitorea tus ventas hasta recuperar tu inversión total.
              </p>

              {historial.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)" }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: "12px", opacity: 0.5 }}>
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <line x1="9" y1="3" x2="9" y2="21" />
                    <line x1="15" y1="3" x2="15" y2="21" />
                    <line x1="3" y1="9" x2="21" y2="9" />
                    <line x1="3" y1="15" x2="21" y2="15" />
                  </svg>
                  <p>Aún no has guardado ninguna paca.</p>
                  <p style={{ fontSize: "13px", marginTop: "6px" }}>¡Calcula precios en la pestaña <strong>Calcular</strong> y activa el seguimiento!</p>
                </div>
              ) : (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <span style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: "600" }}>Total: {historial.length} pacas</span>
                    <button onClick={handleClearHistory} style={{ background: "none", border: "none", color: "var(--error)", fontSize: "12.5px", cursor: "pointer", fontWeight: "600" }}>Borrar todo el historial</button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {historial.map((paca) => {
                      const totalRecuperado = (paca.ventas || []).reduce((sum, v) => sum + (v.precio * v.cantidad), 0);
                      const inv = paca.costo;
                      const pct = Math.min(100, Math.round((totalRecuperado / inv) * 100)) || 0;

                      return (
                        <div key={paca.id} className="history-item" style={{ flexDirection: 'column', alignItems: 'stretch', cursor: 'default', padding: '16px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                            <div>
                              <h3 style={{ fontSize: '15.5px', fontWeight: '700', margin: 0 }}>{paca.nombre}</h3>
                              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{paca.fecha} · {paca.prendas} prendas</span>
                            </div>
                            <div>
                              {paca.estado === 'recuperada' ? (
                                <span className="venta-cat-badge primera" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>🎉 Recuperada</span>
                              ) : paca.estado === 'en_seguimiento' ? (
                                <span className="venta-cat-badge segunda">📈 En Seguimiento</span>
                              ) : (
                                <span className="venta-cat-badge tercera" style={{ background: '#f3f4f6', color: '#6b7280' }}>Calculada</span>
                              )}
                            </div>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', margin: '4px 0', color: 'var(--text-main)' }}>
                            <span>Inversión: <strong>${inv.toLocaleString('es-MX')}</strong></span>
                            <span>Recuperado: <strong>${totalRecuperado.toLocaleString('es-MX')} ({pct}%)</strong></span>
                          </div>

                          {/* Mini barra de progreso */}
                          <div style={{ height: '6px', background: 'rgba(16, 42, 84, 0.05)', borderRadius: '3px', margin: '8px 0 12px 0', overflow: 'hidden' }}>
                            <div 
                              style={{ 
                                height: '100%', 
                                width: `${pct}%`, 
                                background: paca.estado === 'recuperada' ? 'var(--success)' : 'var(--primary-light)',
                                borderRadius: '3px'
                              }} 
                            />
                          </div>

                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
                            {paca.estado === 'calculada' ? (
                              <button 
                                onClick={() => handleStartTrackingFromList(paca.id)} 
                                className="btn btn-primary"
                                style={{ padding: '8px 14px', fontSize: '12px', width: 'auto', height: 'auto', borderRadius: '8px' }}
                              >
                                Iniciar Seguimiento
                              </button>
                            ) : (
                              <button 
                                onClick={() => setSelectedPacaId(paca.id)} 
                                className="btn btn-primary"
                                style={{ padding: '8px 14px', fontSize: '12px', width: 'auto', height: 'auto', borderRadius: '8px', background: 'var(--primary-light)' }}
                              >
                                Ver Seguimiento 📈
                              </button>
                            )}
                            <button 
                              onClick={() => {
                                if (confirm("¿Segura que deseas eliminar esta paca? Se perderán sus ventas registradas.")) {
                                  const updated = historial.filter(item => item.id !== paca.id);
                                  setHistorial(updated);
                                  localStorage.setItem("pacas_history_log", JSON.stringify(updated));
                                }
                              }} 
                              className="btn btn-secondary"
                              style={{ padding: '8px', fontSize: '12px', width: 'auto', height: 'auto', borderRadius: '8px', color: 'var(--error)', borderColor: 'rgba(220, 38, 38, 0.2)' }}
                              title="Eliminar paca"
                            >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* PANEL DE SEGUIMIENTO ACTIVO DE LA PACA */
            <div className="animate-fade-in">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <button 
                  onClick={() => setSelectedPacaId(null)} 
                  style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: '14px', fontWeight: '600', padding: 0 }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
                    <line x1="19" y1="12" x2="5" y2="12"></line>
                    <polyline points="12 19 5 12 12 5"></polyline>
                  </svg>
                  Volver a mis pacas
                </button>
              </div>

              <h1>{activeTrackingPaca.nombre}</h1>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '-8px', marginBottom: '20px' }}>
                Fecha de registro: {activeTrackingPaca.fecha} · Canal: {NOMBRES_CANALES[activeTrackingPaca.inputData.canal]}
              </p>

              <div className="tracking-desktop-layout">
                <div className="tracking-left-col">
                  {/* BARRA DE RECUPERACIÓN GRANDE */}
                  <div className="glass-card" style={{ padding: '16px', marginBottom: 0, background: 'rgba(255, 255, 255, 0.4)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
                      <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>
                        ${trackingStats.totalRecuperado.toLocaleString('es-MX')} recuperados
                      </span>
                      <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                        de ${trackingStats.inversionTotal.toLocaleString('es-MX')} invertidos
                      </span>
                    </div>

                    <div className="tracking-progress-container" style={{ marginTop: '24px', marginBottom: '16px' }}>
                      <div className="tracking-bar-outer">
                        {/* Breakeven line marker */}
                        <div 
                          className="tracking-breakeven-line" 
                          style={{ left: `${trackingStats.pctBreakeven}%` }}
                        >
                          <span className="tracking-breakeven-label">
                            Meta Inversión
                          </span>
                        </div>
                        {/* Progress fill */}
                        <div 
                          className={`tracking-bar-fill ${activeTrackingPaca.estado === 'recuperada' ? 'recuperada' : ''}`}
                          style={{ width: `${trackingStats.pctRecuperado}%` }}
                        />
                      </div>
                    </div>

                    <div style={{ fontSize: '13.5px', fontWeight: '600', color: activeTrackingPaca.estado === 'recuperada' ? 'var(--success)' : 'var(--text-main)', marginTop: '8px', minHeight: '20px' }}>
                      {trackingStats.recommendation}
                    </div>

                    {activeTrackingPaca.estado === 'recuperada' && (
                      <div className="alert-box success" style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px' }}>
                        <span style={{ fontSize: '20px' }}>🎉</span>
                        <strong style={{ fontSize: '13.5px' }}>
                          ¡Paca recuperada! Desde aquí todo es ganancia neta: +${(trackingStats.totalRecuperado - trackingStats.inversionTotal).toLocaleString('es-MX')} MXN
                        </strong>
                      </div>
                    )}
                  </div>

                  {/* COMPARATIVA REAL VS PROYECTADO */}
                  <div className="glass-card" style={{ padding: '16px', marginBottom: 0, background: 'rgba(255, 255, 255, 0.4)' }}>
                    <h3 style={{ fontSize: '15px', marginBottom: '10px', fontWeight: '700' }}>Ganancia Proyectada vs Real</h3>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div style={{ padding: '10px', background: 'white', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Proyección Original</span>
                        <strong style={{ fontSize: '16px', color: 'var(--primary)' }}>
                          +${trackingStats.gananciaOriginal.toLocaleString('es-MX')}
                        </strong>
                      </div>
                      <div style={{ padding: '10px', background: 'white', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Estimado Real (Actualizado)</span>
                        <strong style={{ fontSize: '16px', color: trackingStats.gananciaEstimadaActualizada >= trackingStats.gananciaOriginal ? 'var(--success)' : 'var(--warning)' }}>
                          +${trackingStats.gananciaEstimadaActualizada.toLocaleString('es-MX')}
                        </strong>
                      </div>
                    </div>
                    
                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '8px', fontStyle: 'italic' }}>
                      * El estimado real suma lo vendido más las prendas restantes valuadas al precio sugerido actual.
                    </div>
                  </div>

                  {/* HISTORIAL DE VENTAS REGISTRADAS */}
                  <div className="glass-card" style={{ padding: '16px', marginBottom: 0 }}>
                    <h3 style={{ fontSize: '15.5px', marginBottom: '12px', fontWeight: '700' }}>Ventas Registradas</h3>
                    
                    {(!activeTrackingPaca.ventas || activeTrackingPaca.ventas.length === 0) ? (
                      <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', padding: '20px 0' }}>No has registrado ninguna venta para esta paca aún.</p>
                    ) : (
                      <div>
                        <div className="ventas-list">
                          {activeTrackingPaca.ventas.map((v) => (
                            <div key={v.id} className="venta-item">
                              <div>
                                <span className={`venta-cat-badge ${v.categoria}`} style={{ marginRight: '6px' }}>
                                  {v.categoria === 'primera' ? '1ra' : v.categoria === 'segunda' ? '2da' : '3ra'}
                                </span>
                                <span style={{ fontSize: '13px', fontWeight: '600' }}>{v.cantidad} pza(s) x ${v.precio}</span>
                                <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>{v.fecha}</div>
                              </div>
                              
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <strong style={{ fontSize: '14px', color: 'var(--text-main)' }}>+${v.precio * v.cantidad}</strong>
                                <button 
                                  onClick={() => handleDeleteVenta(v.id)} 
                                  style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', padding: '4px' }}
                                  title="Borrar venta"
                                >
                                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="3 6 5 6 21 6" />
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', fontSize: '14.5px', marginTop: '12px', padding: '8px 12px', background: 'rgba(16, 42, 84, 0.03)', borderRadius: '6px' }}>
                          <span>Total recuperado actual:</span>
                          <span style={{ color: 'var(--success)' }}>${trackingStats.totalRecuperado.toLocaleString('es-MX')} MXN</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="tracking-right-col">
                  {/* REGISTRAR VENTA (MAX 3 TAPS) */}
                  <div className="glass-card" style={{ padding: '16px', marginBottom: 0 }}>
                    <h3 style={{ fontSize: '15.5px', marginBottom: '12px', fontWeight: '700' }}>Registrar Venta</h3>
                    
                    <form onSubmit={handleAddVenta}>
                      {/* TAP 1: Categoría Buttons */}
                      <label className="form-label" style={{ fontSize: '12px', marginBottom: '6px' }}>1. Selecciona Categoría *</label>
                      <div className="sales-quick-grid">
                        <button 
                          type="button" 
                          onClick={() => handleLogVentaCatChange('primera')}
                          className={`sales-quick-btn primera ${logVentaCat === 'primera' ? 'active' : ''}`}
                        >
                          <span style={{ fontSize: '11px', fontWeight: '700' }}>⭐️ 1ra</span>
                          <strong style={{ fontSize: '13px' }}>${activeTrackingPaca.preciosAjustados?.primera}</strong>
                          <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Quedan: {trackingStats.r1}</span>
                        </button>
                        
                        <button 
                          type="button" 
                          onClick={() => handleLogVentaCatChange('segunda')}
                          className={`sales-quick-btn segunda ${logVentaCat === 'segunda' ? 'active' : ''}`}
                        >
                          <span style={{ fontSize: '11px', fontWeight: '700' }}>✨ 2da</span>
                          <strong style={{ fontSize: '13px' }}>${activeTrackingPaca.preciosAjustados?.segunda}</strong>
                          <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Quedan: {trackingStats.r2}</span>
                        </button>
                        
                        <button 
                          type="button" 
                          onClick={() => handleLogVentaCatChange('tercera')}
                          className={`sales-quick-btn tercera ${logVentaCat === 'tercera' ? 'active' : ''}`}
                        >
                          <span style={{ fontSize: '11px', fontWeight: '700' }}>⚡️ 3ra</span>
                          <strong style={{ fontSize: '13px' }}>${activeTrackingPaca.preciosAjustados?.tercera}</strong>
                          <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Quedan: {trackingStats.r3}</span>
                        </button>
                      </div>

                      <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                        {/* TAP 2: Precio Real Editable */}
                        <div style={{ flex: 1 }}>
                          <label className="form-label" htmlFor="venta-precio-log" style={{ fontSize: '12px' }}>Precio Venta (MXN) *</label>
                          <input 
                            id="venta-precio-log"
                            type="number" 
                            required 
                            className="form-input" 
                            style={{ padding: '8px 12px', fontSize: '14.5px', height: '40px' }}
                            value={logVentaPrecio} 
                            onChange={(e) => setLogVentaPrecio(e.target.value)} 
                          />
                        </div>
                        
                        {/* TAP 3: Cantidad con Stepper */}
                        <div style={{ flex: 1 }}>
                          <label className="form-label" style={{ fontSize: '12px' }}>Cantidad *</label>
                          <div className="stepper-controls" style={{ height: '40px', justifyContent: 'center', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', background: 'white' }}>
                            <button 
                              type="button" 
                              className="stepper-btn" 
                              style={{ width: '28px', height: '28px', border: 'none' }}
                              onClick={() => setLogVentaCantidad(Math.max(1, logVentaCantidad - 1))}
                            >
                              -
                            </button>
                            <span style={{ fontSize: '14.5px', fontWeight: '700', width: '30px', textAlign: 'center' }}>{logVentaCantidad}</span>
                            <button 
                              type="button" 
                              className="stepper-btn" 
                              style={{ width: '28px', height: '28px', border: 'none' }}
                              onClick={() => setLogVentaCantidad(logVentaCantidad + 1)}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>

                      <button 
                        type="submit" 
                        className="btn btn-primary" 
                        style={{ width: '100%', marginTop: '16px', padding: '12px', fontSize: '14px', borderRadius: '8px' }}
                      >
                        Registrar Venta
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
