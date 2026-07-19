# Documentación Técnica y de Producto: Calculadora de Paca MX

Esta documentación detalla el producto tecnológico **Calculadora de Paca**, una solución web premium diseñada específicamente para revendedoras y comerciantes de ropa de paca (segunda mano) en México. Permite optimizar la estrategia de precios por categorías de calidad, controlar la merma, proyectar ganancias reales y calcular el punto de equilibrio financiero.

---

## 1. Visión General del Producto

El negocio de reventa de ropa de paca en México suele enfrentar el problema de la fijación de precios "a ojo" o de manera uniforme ("precio parejo"). Esto ocasiona pérdidas invisibles al no valorar adecuadamente las piezas premium, no descontar correctamente la merma (ropa rota o sucia) y no tener claridad sobre cuándo se recupera la inversión.

La **Calculadora de Paca** resuelve esto mediante un modelo matemático de ponderación que divide el inventario en tres calidades (Primera, Segunda y Tercera), sugiriendo precios óptimos según el canal de venta y calculando en tiempo real el punto de equilibrio exacto.

### Modos de Uso:
1. **Versión Demo (Gratuita):** Permite al usuario realizar un cálculo rápido introduciendo datos básicos para recibir un análisis comparativo y mostrarle cuánto dinero está perdiendo por no usar precios inteligentes.
2. **Versión VIP (Premium):** Acceso completo y sin restricciones protegido por contraseña, que incluye un asistente de 5 pasos, sliders auto-balanceados para clasificación, historial de cálculos guardados, análisis detallado del punto de equilibrio y la posibilidad de compartir el reporte directamente en WhatsApp.

---

## 2. Arquitectura Tecnológica y Stack

El proyecto está construido con un enfoque moderno, veloz y responsivo:

- **Framework:** [Next.js](https://nextjs.org/) (App Router) con React y TypeScript.
- **Estilos:** Vanilla CSS robusto localizado en `globals.css`. Utiliza variables CSS (`:root`), tipografía premium (`Outfit` e `Inter` de Google Fonts), orbes flotantes de fondo autogenerados, efectos de glassmorphism y transiciones suaves.
- **Seguridad:** Validación criptográfica nativa en el navegador usando la Web Crypto API (SHA-256) para proteger la sección VIP.
- **Persistencia:** Uso de `localStorage` en el cliente para guardar tanto la sesión VIP autorizada como el historial de las últimas 10 pacas calculadas.
- **Integraciones:** Generador dinámico de enlaces API para WhatsApp que permite compartir resultados formateados en un solo clic.

---

## 3. Estructura del Código Fuente

La estructura del código sigue el patrón estándar de Next.js App Router dentro de la carpeta `src/`:

```text
src/
├── app/
│   ├── app-pacas-vip/
│   │   ├── page.tsx          # Página contenedora protegida de la versión VIP
│   │   └── VipClient.tsx     # Cliente interactivo: Asistente de 5 pasos e Historial
│   ├── demo/
│   │   ├── page.tsx          # Página de la versión demo gratuita
│   │   └── DemoClient.tsx    # Formulario rápido y gancho de venta (Lead Generator)
│   ├── favicon.ico
│   ├── globals.css           # Estilos globales, diseño de marca y animaciones
│   ├── layout.tsx            # Layout raíz de la aplicación
│   └── page.tsx              # Landing page principal (Portal de Acceso)
├── components/
│   ├── PasswordGate.tsx      # Componente de seguridad para validar acceso VIP
│   └── ResultCard.tsx        # Reporte interactivo y detallado de resultados
└── lib/
    └── preciosMX.ts          # Motor matemático de cálculos y reglas de negocio
```

---

## 4. Motor de Cálculos y Reglas de Negocio (`preciosMX.ts`)

El núcleo lógico de la aplicación reside en [preciosMX.ts](file:///Users/brandonmuro/Desktop/calculadora-pacas/src/lib/preciosMX.ts). A continuación se explican sus componentes clave:

### A. Parámetros del Mercado Mexicano (Rangos de Precios)
Para evitar que la calculadora sugiera precios irreales, se definen rangos de precios mínimos y máximos en Pesos Mexicanos (MXN) para tres canales de venta típicos:

| Canal de Venta | Categoría Primera (Marca) | Categoría Segunda (Media) | Categoría Tercera (Remate) |
| :--- | :--- | :--- | :--- |
| **Marketplace / FB** | $120 - $350 MXN | $50 - $120 MXN | $15 - $50 MXN |
| **WhatsApp / Catálogo** | $150 - $400 MXN | $60 - $150 MXN | $20 - $50 MXN |
| **Tianguis / Local** | $80 - $200 MXN | $30 - $80 MXN | $10 - $30 MXN |

### B. Algoritmo de Ponderación por Calidad
El cálculo de precios no es lineal. Para reflejar la realidad del comercio de ropa, cada categoría tiene un peso de valor relativo:
- **Primera:** **3.5x** del precio base.
- **Segunda:** **2.0x** del precio base.
- **Tercera:** **0.8x** del precio base.

El motor resuelve la variable de precio base ($P$) mediante la siguiente ecuación, donde la meta es obtener los ingresos totales deseados (Inversión Total $\times$ Multiplicador de Meta):

$$\text{Prendas}_1 \cdot (3.5 \cdot P) + \text{Prendas}_2 \cdot (2.0 \cdot P) + \text{Prendas}_3 \cdot (0.8 \cdot P) = \text{Inversión Total} \cdot \text{Meta}$$

Una vez hallado $P$, los precios sugeridos preliminares se calculan como:
$$\text{Precio}_1 = 3.5 \cdot P, \quad \text{Precio}_2 = 2.0 \cdot P, \quad \text{Precio}_3 = 0.8 \cdot P$$

### C. Ajuste Psicológico y Límites (Clamping y Redondeo)
1. **Redondeo a $5:** Los precios calculados se redondean al múltiplo de $5 MXN más cercano (ej. $112 a $115, $83 a $80), adaptándose a la costumbre de cobro físico en tianguis y entregas directas.
2. **Límites de Canal (Clamping):** Si un precio calculado supera el máximo de su canal, se reduce automáticamente a ese tope; si queda por debajo del mínimo, se ajusta al valor mínimo.
3. **Advertencias de Ajuste:** Si el algoritmo tuvo que topar o ajustar un precio debido a los límites del canal, se genera una notificación clara (ej. *"Se limitó al precio máximo sugerido del canal para no quedar fuera de mercado"*).

### D. Gestión de la Merma
La merma representa prendas inutilizables. En el modelo:
- Se descuenta el total de piezas de merma directamente de las prendas estimadas de **Tercera Categoría** (que es el lote destinado a remate), asegurando que el costo de esta pérdida sea absorbido y cubierto por las prendas de mayor valor (Primera y Segunda).

### E. Algoritmo Greedy para Punto de Equilibrio
Para saber exactamente cuántas prendas y de qué categorías se deben vender para recuperar la inversión:
- Se utiliza un orden descendente de precios (Greedy): primero se calcula cuántas prendas de **Primera** se requieren. Si no basta, se añaden prendas de **Segunda**, y si es necesario, de **Tercera**. Esto genera una frase explicativa muy humana para el usuario (ej. *"Vendiendo solo 15 prendas de Primera y 4 de Segunda ya recuperaste tu inversión. ¡Todo lo demás es ganancia pura!"*).

---

## 5. Funcionalidades Detalladas del Módulo VIP

El módulo VIP ([VipClient.tsx](file:///Users/brandonmuro/Desktop/calculadora-pacas/src/app/app-pacas-vip/VipClient.tsx)) ofrece una experiencia enriquecida y profesional:

### A. Password Gate de Alta Seguridad
El acceso a la sección VIP está restringido mediante el componente [PasswordGate.tsx](file:///Users/brandonmuro/components/PasswordGate.tsx). 
- Utiliza la API nativa de criptografía del navegador `crypto.subtle.digest` para calcular el hash SHA-256 del código ingresado por el usuario.
- El hash esperado es `03088df3b97da57fc1cafd3593490fb08ef3cb3d7563d0f122a6a806f48f9cb1`, el cual corresponde a la contraseña **`PACAS-VIP-2026`**.
- Tras validarse con éxito, el código se almacena en `localStorage` bajo la clave `pacas_vip_access` para evitar que el usuario deba reingresarlo en futuras visitas.

### B. Asistente Dinámico de 5 Pasos
Para no abrumar al usuario con un único formulario gigante, la recolección de datos se distribuye de forma intuitiva:
1. **Identificación:** Nombre del usuario y etiqueta personalizada para la paca.
2. **Inversión:** Costo de compra de la paca y gastos extras adicionales (transporte, lavado, embalaje).
3. **Inventario:** Total de prendas y porcentaje de merma esperada.
4. **Clasificación y Canal:** Configuración del canal de distribución y distribución de calidad.
5. **Meta:** Definición del multiplicador de ganancia deseado (x2, x2.5 sugerido, x3, o personalizado) y comparación con el precio de venta habitual del usuario.

### C. Deslizadores de Auto-Balanceo (Sliders)
En el Paso 4, el usuario ajusta el porcentaje de ropa que corresponde a Primera, Segunda y Tercera. Para evitar que la suma difiera de 100%, el componente implementa un **algoritmo de auto-balanceo interactivo**:
- Cuando el usuario desplaza un control (ej. aumenta Primera), los otros dos controles disminuyen proporcionalmente para mantener una suma constante de exactamente 100%.

### D. Historial de Pacas Persistente
- Permite guardar y desplegar las últimas 10 pacas calculadas.
- Los datos se guardan estructurados en un arreglo JSON dentro de `localStorage` (`pacas_history_log`).
- Al hacer clic en cualquier elemento del historial, todos los campos del asistente de 5 pasos se rellenan automáticamente y se calculan al instante, facilitando comparaciones rápidas.

### E. Integración de Compartido por WhatsApp
El botón de compartir extrae los resultados del cálculo y genera una plantilla con emojis listos para enviar a socios o clientes. Incluye:
- Inversión total
- Ganancia proyectada (con su respectivo multiplicador)
- Detalle de piezas y precios por categoría
- Desglose del punto de equilibrio

---

## 6. Diseño Premium y Experiencia de Usuario (UI/UX)

La aplicación sigue lineamientos de diseño premium, profesional y moderno para inspirar confianza y profesionalismo:

- **Paleta de Colores Curada:**
  - Fondo refinado en color hueso/crema (`#FCFAF6`).
  - Color primario denim oscuro (`#1E4B8F`) y contrastes elegantes en azul marino (`#102A54`) para tipografía.
  - Acentos cálidos en tono coral (`#EB7A64`) y detalles refinados en oro suave (`#DAB270`).
- **Glassmorphism y Efecto de Profundidad:** Tarjetas con fondos semitransparentes, bordes definidos claros y sombras suaves multicapa que simulan cristales flotando sobre orbes radiales de fondo en constante suavidad.
- **Diseño Móvil Responsivo:** Las tablas de precios se transforman dinámicamente en tarjetas apilables en pantallas táctiles pequeñas para evitar desbordamientos horizontales.
- **Gráficos de Progreso Visual:** Indicadores en barra para visualizar la proporción de prendas necesarias para recuperar la inversión frente a las prendas que representan ganancia neta.

---

## 7. Instrucciones para Desarrolladores (Ejecución y Despliegue)

### Requisitos Previos
- Node.js (versión 18 o superior)
- npm, yarn, pnpm o bun

### Instalación de Dependencias
```bash
npm install
```

### Ejecutar Servidor de Desarrollo
```bash
npm run dev
```
La aplicación estará disponible en [http://localhost:3000](http://localhost:3000).

### Compilación para Producción
```bash
npm run build
```
Este comando valida tipos de TypeScript, ejecuta el linter de Next.js y genera la compilación optimizada en la carpeta `.next/`.

Para iniciar el servidor compilado localmente:
```bash
npm run start
```
