# Calculadora de Paca — Pacas MX 🧮👚

¡Bienvenido al repositorio de la **Calculadora de Paca**! Una aplicación web premium, responsiva e interactiva creada para revendedoras y comerciantes de ropa de paca en México. Esta herramienta optimiza la fijación de precios, calcula las ganancias proyectadas y ayuda a planificar el retorno de inversión.

## 🚀 Funcionalidades Principales

- **Fijación de Precios por Categorías:** Clasifica la ropa en *Primera* (premium/marca), *Segunda* (buen estado) y *Tercera* (remate/detalles).
- **Ajuste Inteligente por Canal:** Adapta los precios recomendados a las realidades de venta física y digital en México (*Marketplace*, *WhatsApp* y *Tianguis*).
- **Gestión Automática de Merma:** Absorbe las pérdidas por prendas rotas o sucias deduciéndolas del lote de remates de forma matemática.
- **Punto de Equilibrio (Breakeven):** Te dice exactamente cuántas prendas y de qué categorías debes vender para recuperar el 100% de tu inversión.
- **Historial Persistido (Versión VIP):** Guarda hasta 10 pacas calculadas localmente para cargarlas al instante.
- **Compartir por WhatsApp:** Genera reportes listos con formato y emojis para enviar de inmediato.

---

## 🛠️ Stack Tecnológico

- **Frontend:** Next.js (App Router), React, TypeScript.
- **Estilos:** Vanilla CSS moderno (diseño responsivo, glassmorphism, temas de color estilizados).
- **Seguridad:** Criptografía nativa (`Web Crypto API`) con hashing SHA-256 para el acceso VIP.
- **Persistencia:** LocalStorage para guardar configuraciones y el historial de cálculos.

---

## 📖 Documentación Detallada

Para una explicación técnica profunda que incluye:
- El modelo matemático de ponderación (Primera 3.5x, Segunda 2x, Tercera 0.8x).
- Los rangos de precios por canal de venta en México.
- Detalles del algoritmo Greedy de punto de equilibrio.
- Flujo de balanceo dinámico de sliders.

Consulta el archivo completo de [Documentación del Producto (DOCUMENTACION.md)](file:///Users/brandonmuro/Desktop/calculadora-pacas/DOCUMENTACION.md).

---

## 💻 Desarrollo Local

### 1. Clonar el repositorio e instalar dependencias

```bash
npm install
```

### 2. Levantar el servidor de desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador para ver la aplicación.

### 3. Compilar para producción

```bash
npm run build
npm run start
```

---

## 🔒 Acceso VIP

La versión completa/VIP está bloqueada por motivos de distribución. 
- **Código de acceso:** `PACAS-VIP-2026`

Desarrollado por **Brandon Muro** para **Pacas MX** · 2026.
