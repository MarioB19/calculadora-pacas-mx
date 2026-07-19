"use client";

import React, { useState, useEffect } from "react";

interface PasswordGateProps {
  children: React.ReactNode;
}

const TARGET_HASH = "03088df3b97da57fc1cafd3593490fb08ef3cb3d7563d0f122a6a806f48f9cb1"; // SHA-256 de PACAS-VIP-2026
const LOCAL_STORAGE_KEY = "pacas_vip_access";

// Función nativa para calcular el hash SHA-256
async function calcularSHA256(text: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(text.trim());
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  return hashHex;
}

export default function PasswordGate({ children }: PasswordGateProps) {
  const [password, setPassword] = useState("");
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    // Verificar si ya tiene acceso persistido en localStorage
    const savedCode = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedCode) {
      calcularSHA256(savedCode).then(hash => {
        if (hash === TARGET_HASH) {
          setIsAuthorized(true);
        } else {
          // Si el código guardado no es válido, limpiar
          localStorage.removeItem(LOCAL_STORAGE_KEY);
          setIsAuthorized(false);
        }
      }).catch(() => {
        setIsAuthorized(false);
      });
    } else {
      setIsAuthorized(false);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setErrorMsg("Por favor, ingresa un código de acceso.");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");

    try {
      const hash = await calcularSHA256(password);
      if (hash === TARGET_HASH) {
        localStorage.setItem(LOCAL_STORAGE_KEY, password.trim());
        setIsAuthorized(true);
      } else {
        setErrorMsg("Código de acceso incorrecto. Verifica e intenta de nuevo.");
      }
    } catch (err) {
      setErrorMsg("Ocurrió un error al validar. Por favor intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  // Mientras se comprueba el estado inicial en localStorage, mostrar pantalla de carga
  if (isAuthorized === null) {
    return (
      <div className="gate-container">
        <div className="glass-card gate-card">
          <div className="loader-spinner" style={{ width: 40, height: 40 }}></div>
          <p style={{ marginTop: 12 }}>Cargando acceso seguro...</p>
        </div>
      </div>
    );
  }

  if (isAuthorized) {
    return <>{children}</>;
  }

  return (
    <div className="gate-container animate-fade-in">
      <div className={`glass-card gate-card ${isFocused ? "gate-card-focused" : ""}`}>
        <div className="gate-icon">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <h1>Calculadora VIP</h1>
        <p className="subtitle" style={{ marginBottom: 20 }}>
          Ingresa tu código de acceso para desbloquear la versión completa de la Calculadora de Paca.
        </p>

        <form onSubmit={handleSubmit} style={{ textAlign: "left" }}>
          <div className="form-group">
            <label className="form-label" htmlFor="vip-code">
              Código de Acceso
            </label>
            <div className="input-icon-wrapper">
              <input
                id="vip-code"
                type="password"
                className="form-input has-icon"
                placeholder="Ej. PACAS-XXXX-XXXX"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
              />
              <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
          </div>

          {errorMsg && (
            <div className="alert-box error" role="alert" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading}
            id="btn-unlock-app"
          >
            {isLoading ? (
              <>
                <span className="loader-spinner"></span> Validando...
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3.5-3.5-3 3z" />
                </svg>
                <span>Desbloquear Calculadora</span>
              </>
            )}
          </button>
        </form>

        <div className="footer" style={{ marginTop: 24, paddingBottom: 0 }}>
          Desarrollado para Pacas MX · 2026
        </div>
      </div>
    </div>
  );
}
