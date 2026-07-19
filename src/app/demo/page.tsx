import { Metadata } from "next";
import DemoClient from "./DemoClient";

export const metadata: Metadata = {
  title: "Calculadora de Paca — Demo Gratis | Pacas MX",
  description: "Calcula la ganancia real de tu paca. Descubre si estás perdiendo dinero por fijar un solo precio de venta. Prueba la versión demo hoy.",
  robots: {
    index: true,
    follow: true,
  },
};

export default function DemoPage() {
  return <DemoClient />;
}
