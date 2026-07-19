import { Metadata } from "next";
import VipClient from "./VipClient";
import PasswordGate from "../../components/PasswordGate";

export const metadata: Metadata = {
  title: "Calculadora VIP — Precios de Reventa | Pacas MX",
  description: "Acceso exclusivo para miembros. Optimiza y calcula los precios de reventa de tus prendas por calidad para maximizar ganancias.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function VipPage() {
  return (
    <PasswordGate>
      <VipClient />
    </PasswordGate>
  );
}
