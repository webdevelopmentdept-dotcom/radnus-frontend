import React from "react";
import { useSearchParams } from "react-router-dom";

const KEY = "admin-loan-mode";

// URL (?mode=) first, apram localStorage, default bde
export function useLoanMode() {
  const [params, setParams] = useSearchParams();
  const fromUrl = params.get("mode");
  const stored = typeof window !== "undefined" ? localStorage.getItem(KEY) : null;
  const mode = fromUrl === "marketing" || fromUrl === "bde"
    ? fromUrl
    : stored === "marketing" ? "marketing" : "bde";

  const setMode = (m) => {
    localStorage.setItem(KEY, m);
    const next = new URLSearchParams(params);
    next.set("mode", m);
    setParams(next, { replace: true });
  };
  return [mode, setMode];
}

export default function LoanModeToggle({ mode, onChange }) {
  const btn = (active) => ({
    padding: "6px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer",
    border: "none", borderRadius: 8,
    background: active ? "#2A3EB1" : "transparent",
    color: active ? "#fff" : "#64748B",
  });
  return (
    <div style={{ display: "inline-flex", gap: 4, padding: 4, background: "#EEF1FD",
                  borderRadius: 10, marginBottom: 12 }}>
      <button style={btn(mode === "bde")} onClick={() => onChange("bde")}>BDE</button>
      <button style={btn(mode === "marketing")} onClick={() => onChange("marketing")}>Marketing</button>
    </div>
  );
}