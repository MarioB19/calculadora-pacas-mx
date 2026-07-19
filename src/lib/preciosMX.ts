export interface RangoPrecio {
  min: number;
  max: number;
}

export interface CanalPrecios {
  primera: RangoPrecio;
  segunda: RangoPrecio;
  tercera: RangoPrecio;
}

// Rangos de reventa típicos por prenda y canal en México (MXN)
export const PRECIOS_SEMILLA: Record<string, CanalPrecios> = {
  marketplace: {
    primera: { min: 120, max: 350 },
    segunda: { min: 50, max: 120 },
    tercera: { min: 15, max: 50 }
  },
  whatsapp: {
    primera: { min: 150, max: 400 },
    segunda: { min: 60, max: 150 },
    tercera: { min: 20, max: 50 }
  },
  tianguis: {
    primera: { min: 80, max: 200 },
    segunda: { min: 30, max: 80 },
    tercera: { min: 10, max: 30 }
  }
};

export const NOMBRES_CANALES: Record<string, string> = {
  marketplace: "Marketplace / FB",
  whatsapp: "WhatsApp / Catálogo",
  tianguis: "Tianguis / Local"
};

export interface CalculoInput {
  costoPaca: number;
  gastosExtra: number;
  prendas: number;
  porcentajePrimera: number; // e.g. 20
  porcentajeSegunda: number; // e.g. 60
  porcentajeTercera: number; // e.g. 20
  merma: number; // e.g. 5
  metaGanancia: number; // e.g. 2.5
  precioHoy?: number;
  canal: 'marketplace' | 'whatsapp' | 'tianguis';
  pacasAlMes?: number; // default 1
}

export interface CalculoResultados {
  inversionTotal: number;
  prendasVendibles: number;
  costoPorPrenda: number;

  prendas1: number;
  prendas2: number;
  prendas3: number;

  precio1Raw: number;
  precio2Raw: number;
  precio3Raw: number;

  precio1: number;
  precio2: number;
  precio3: number;

  ajustado1: 'max' | 'min' | 'none';
  ajustado2: 'max' | 'min' | 'none';
  ajustado3: 'max' | 'min' | 'none';

  advertencias: string[];

  ingresosTotales: number;
  gananciaProyectada: number;
  gananciaMultiplicador: number;

  prendasBreakeven: number;
  descripcionBreakeven: string;
  categoriasBreakeven: {
    primera: number;
    segunda: number;
    tercera: number;
  };

  gananciaHoy?: number;
  gananciaExtra?: number;
  gananciaHoyMensual?: number;
  gananciaSistemaMensual?: number;
  dejasIrMensual?: number;
}

// Redondear a múltiplos de $5 (Psicología de tianguis)
export function redondear5(val: number): number {
  return Math.max(0, Math.round(val / 5) * 5);
}

export function realizarCalculos(input: CalculoInput): CalculoResultados {
  const {
    costoPaca,
    gastosExtra = 0,
    prendas,
    porcentajePrimera,
    porcentajeSegunda,
    porcentajeTercera,
    merma,
    metaGanancia,
    precioHoy,
    canal,
    pacasAlMes = 1
  } = input;

  const inversionTotal = costoPaca + gastosExtra;
  const prendasVendibles = Math.max(0, Math.round(prendas * (1 - merma / 100)));
  const costoPorPrenda = prendasVendibles > 0 ? inversionTotal / prendasVendibles : 0;

  // Distribución de prendas por clasificación
  const prendas1 = Math.round(prendas * (porcentajePrimera / 100));
  const prendas2 = Math.round(prendas * (porcentajeSegunda / 100));
  
  // La merma se descuenta de la tercera categoría
  const prendas3SinMerma = Math.round(prendas * (porcentajeTercera / 100));
  const prendasMerma = Math.round(prendas * (merma / 100));
  const prendas3 = Math.max(0, prendas3SinMerma - prendasMerma);

  // Pesos relativos: Primera (3.5x), Segunda (2.0x), Tercera (0.8x)
  // Resolver P de modo que: prendas1*(3.5*P) + prendas2*(2.0*P) + prendas3*(0.8*P) = inversionTotal * metaGanancia
  const divisor = (3.5 * prendas1) + (2.0 * prendas2) + (0.8 * prendas3);
  const baseP = divisor > 0 ? (inversionTotal * metaGanancia) / divisor : 0;

  const precio1Raw = 3.5 * baseP;
  const precio2Raw = 2.0 * baseP;
  const precio3Raw = 0.8 * baseP;

  // Redondear preliminarmente a múltiplos de $5
  const precio1Redond = redondear5(precio1Raw);
  const precio2Redond = redondear5(precio2Raw);
  const precio3Redond = redondear5(precio3Raw);

  // Clamping contra la tabla de rangos del canal
  const rangosCanal = PRECIOS_SEMILLA[canal] || PRECIOS_SEMILLA.marketplace;
  const canalNombre = NOMBRES_CANALES[canal] || "este canal";

  let precio1 = precio1Redond;
  let ajustado1: 'max' | 'min' | 'none' = 'none';
  if (precio1Redond > rangosCanal.primera.max) {
    precio1 = rangosCanal.primera.max;
    ajustado1 = 'max';
  } else if (precio1Redond < rangosCanal.primera.min) {
    precio1 = rangosCanal.primera.min;
    ajustado1 = 'min';
  }

  let precio2 = precio2Redond;
  let ajustado2: 'max' | 'min' | 'none' = 'none';
  if (precio2Redond > rangosCanal.segunda.max) {
    precio2 = rangosCanal.segunda.max;
    ajustado2 = 'max';
  } else if (precio2Redond < rangosCanal.segunda.min) {
    precio2 = rangosCanal.segunda.min;
    ajustado2 = 'min';
  }

  let precio3 = precio3Redond;
  let ajustado3: 'max' | 'min' | 'none' = 'none';
  if (precio3Redond > rangosCanal.tercera.max) {
    precio3 = rangosCanal.tercera.max;
    ajustado3 = 'max';
  } else if (precio3Redond < rangosCanal.tercera.min) {
    precio3 = rangosCanal.tercera.min;
    ajustado3 = 'min';
  }

  // Generar advertencias
  const advertencias: string[] = [];
  if (ajustado1 === 'max') {
    advertencias.push(`Tu meta de ganancia requiere vender prendas de Primera a $${precio1Redond}, lo cual supera el límite del mercado en ${canalNombre} ($${rangosCanal.primera.max}). Se limitó al precio máximo sugerido del canal.`);
  } else if (ajustado1 === 'min') {
    advertencias.push(`Tu precio calculado de Primera ($${precio1Redond}) está por debajo del promedio del mercado en ${canalNombre}. Se ajustó al mínimo de $${rangosCanal.primera.min}.`);
  }

  if (ajustado2 === 'max') {
    advertencias.push(`El precio requerido para las prendas de Segunda ($${precio2Redond}) supera el mercado en ${canalNombre} ($${rangosCanal.segunda.max}). Se limitó al máximo.`);
  }

  if (ajustado3 === 'max') {
    advertencias.push(`El precio requerido para las de Tercera ($${precio3Redond}) supera el mercado en ${canalNombre} ($${rangosCanal.tercera.max}). Se limitó al máximo.`);
  }

  // Ingresos con precios finales (después de redondear y clamp)
  const ingresosTotales = (prendas1 * precio1) + (prendas2 * precio2) + (prendas3 * precio3);
  const gananciaProyectada = ingresosTotales - inversionTotal;
  const gananciaMultiplicador = inversionTotal > 0 ? ingresosTotales / inversionTotal : 0;

  // Punto de equilibrio (Algoritmo Greedy: mayor precio a menor precio)
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

  const resultados: CalculoResultados = {
    inversionTotal,
    prendasVendibles,
    costoPorPrenda,
    prendas1,
    prendas2,
    prendas3,
    precio1Raw,
    precio2Raw,
    precio3Raw,
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
    categoriasBreakeven: {
      primera: necesarias1,
      segunda: necesarias2,
      tercera: necesarias3
    }
  };

  // Comparativa "hoy" si se provee el precio actual del usuario
  if (precioHoy && precioHoy > 0) {
    const gananciaHoy = (prendasVendibles * precioHoy) - inversionTotal;
    const gananciaExtra = gananciaProyectada - gananciaHoy;

    resultados.gananciaHoy = gananciaHoy;
    resultados.gananciaExtra = gananciaExtra;
    resultados.gananciaHoyMensual = gananciaHoy * pacasAlMes;
    resultados.gananciaSistemaMensual = gananciaProyectada * pacasAlMes;
    resultados.dejasIrMensual = gananciaExtra * pacasAlMes;
  }

  return resultados;
}
