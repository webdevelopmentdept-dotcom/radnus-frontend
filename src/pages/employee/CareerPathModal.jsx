// components/employee/CareerPathModal.jsx
import { useEffect, useRef } from "react";

const MODAL_STYLES = `
  .cpm-overlay {
    position: fixed; inset: 0; z-index: 2000;
    background: rgba(10,12,22,0.72);
    backdrop-filter: blur(4px);
    display: flex; align-items: flex-end; justify-content: center;
    padding: 0;
    animation: cpmFadeIn .22s ease;
  }
  @keyframes cpmFadeIn { from { opacity: 0 } to { opacity: 1 } }

  .cpm-sheet {
    background: #fff;
    border-radius: 20px 20px 0 0;
    width: 100%; max-width: 700px;
    max-height: 92vh;
    display: flex; flex-direction: column;
    overflow: hidden;
    animation: cpmSlideUp .28s cubic-bezier(.22,1,.36,1);
    box-shadow: 0 -8px 40px rgba(0,0,0,0.18);
  }
  @keyframes cpmSlideUp { from { transform: translateY(60px); opacity:0 } to { transform: translateY(0); opacity:1 } }

  .cpm-header {
    padding: 18px 20px 14px;
    border-bottom: 2px solid #e5e7eb;
    display: flex; align-items: flex-start; justify-content: space-between; gap: 12px;
    flex-shrink: 0;
    background: #fff;
  }

  .cpm-body {
    overflow-y: auto;
    flex: 1;
    padding: 16px 16px 24px;
    -webkit-overflow-scrolling: touch;
    background: #f4f6fb;
  }
  .cpm-body::-webkit-scrollbar { width: 4px; }
  .cpm-body::-webkit-scrollbar-track { background: transparent; }
  .cpm-body::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 99px; }

  /* ── Excel-style table ── */
  .cpm-excel-wrap {
    border: 2px solid #374151;
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  }

  .cpm-table {
    width: 100%;
    border-collapse: collapse;
    font-family: 'Manrope', 'Segoe UI', sans-serif;
  }

  .cpm-table thead tr {
    background: #1a1a2e;
  }
  .cpm-table thead th {
    padding: 11px 14px;
    text-align: left;
    font-size: 10px; font-weight: 700;
    color: #e5e7eb;
    text-transform: uppercase; letter-spacing: 0.8px;
    white-space: nowrap;
    border-right: 1px solid rgba(255,255,255,0.12);
  }
  .cpm-table thead th:last-child { border-right: none; }

  .cpm-table tbody tr {
    border-bottom: 1.5px solid #d1d5db;
    transition: background .12s;
  }
  .cpm-table tbody tr:last-child { border-bottom: none; }
  .cpm-table tbody tr:hover { background: #f0f4ff; }

  .cpm-table tbody tr.cpm-current {
    background: linear-gradient(90deg, #eff6ff 0%, #f0fdf4 100%);
  }
  .cpm-table tbody tr.cpm-current:hover {
    background: linear-gradient(90deg, #dbeafe 0%, #dcfce7 100%);
  }

  .cpm-table tbody td {
    padding: 12px 14px;
    font-size: 12px; color: #374151;
    vertical-align: middle;
    border-right: 1.5px solid #d1d5db;
  }
  .cpm-table tbody td:last-child { border-right: none; }

  /* Alternating row shade */
  .cpm-table tbody tr:nth-child(even):not(.cpm-current) {
    background: #f8fafc;
  }
  .cpm-table tbody tr:nth-child(even):not(.cpm-current):hover {
    background: #f0f4ff;
  }

  .cpm-progress-wrap {
    margin: 10px 0 0;
    background: #e5e7eb;
    border-radius: 99px; height: 6px; overflow: hidden;
  }
  .cpm-progress-fill {
    height: 100%; border-radius: 99px;
    background: linear-gradient(90deg, #059669, #3b82f6, #f59e0b);
    transition: width .8s cubic-bezier(.4,0,.2,1);
  }
  .cpm-progress-labels {
    display: flex; justify-content: space-between;
    margin: 4px 0 0;
    font-size: 10px; color: #9ca3af; font-weight: 600;
  }

  .cpm-close {
    width: 30px; height: 30px; border-radius: 50%;
    background: #f3f4f6; border: none;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; flex-shrink: 0;
    transition: background .15s;
    font-size: 14px; color: #6b7280;
  }
  .cpm-close:hover { background: #e5e7eb; color: #374151; }

  .cpm-empty {
    text-align: center; padding: 48px 24px;
    color: #9ca3af; font-size: 14px;
  }

  @media (min-width: 640px) {
    .cpm-overlay { align-items: center; padding: 16px; }
    .cpm-sheet { border-radius: 16px; max-height: 88vh; }
    .cpm-table thead th { font-size: 11px; }
    .cpm-table tbody td { font-size: 13px; }
  }
`;

const fmt = (v) => {
  if (!v) return null;
  const n = Number(v);
  if (n >= 100000) return `₹${(n / 100000).toFixed(n % 100000 === 0 ? 0 : 1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`;
  return `₹${n}`;
};

export default function CareerPathModal({ open, onClose, employeeGrade, deptBands = [], department }) {
  const overlayRef = useRef(null);

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const deptName     = department || "";
  const currentLevel = employeeGrade?.grade_id?.level || "";

  const levels = [...deptBands]
    .filter(b => b.department_name === deptName)
    .sort((a, b) => {
      const na = parseInt((a.grade_level || "L0").replace("L", ""));
      const nb = parseInt((b.grade_level || "L0").replace("L", ""));
      return na - nb;
    });

  const totalLevels  = levels.length;
  const currentIndex = levels.findIndex(b => b.grade_level === currentLevel);
  const progressPct  = totalLevels > 1
    ? Math.round(((currentIndex + 1) / totalLevels) * 100)
    : 0;

  return (
    <>
      <style>{MODAL_STYLES}</style>

      <div className="cpm-overlay" ref={overlayRef} onClick={handleOverlayClick}>
        <div className="cpm-sheet" role="dialog" aria-modal="true">

          {/* ── Header ── */}
          <div className="cpm-header">
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                <span style={{ fontSize: 18 }}>🏢</span>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#1a1d2e" }}>
                  {deptName || "Career Growth Plan"}
                </h3>
                <span style={{
                  background: "#f0f4ff", color: "#4f8ef7",
                  border: "1px solid #c7d2fe",
                  borderRadius: 6, padding: "2px 8px",
                  fontSize: 10, fontWeight: 700
                }}>
                  {totalLevels} Levels
                </span>
              </div>

              {currentLevel && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                  <span style={{ fontSize: 11, color: "#6b7280" }}>Your level:</span>
                  <span style={{
                    background: "#1a1a2e", color: "#fff",
                    borderRadius: 5, padding: "2px 8px",
                    fontSize: 11, fontWeight: 800, letterSpacing: "0.4px"
                  }}>
                    {currentLevel}
                  </span>
                  {currentIndex >= 0 && levels[currentIndex]?.posting && (
                    <span style={{ fontSize: 11, color: "#374151", fontWeight: 600 }}>
                      · {levels[currentIndex].posting}
                    </span>
                  )}
                </div>
              )}

              {totalLevels > 0 && currentIndex >= 0 && (
                <>
                  <div className="cpm-progress-wrap">
                    <div className="cpm-progress-fill" style={{ width: `${progressPct}%` }} />
                  </div>
                  <div className="cpm-progress-labels">
                    <span>{currentLevel} · Level {currentIndex + 1} of {totalLevels}</span>
                    <span>{progressPct}% of career path</span>
                  </div>
                </>
              )}
            </div>

            <button className="cpm-close" onClick={onClose} aria-label="Close">✕</button>
          </div>

          {/* ── Body ── */}
          <div className="cpm-body">
            {levels.length === 0 ? (
              <div className="cpm-empty">
                <div style={{ fontSize: 36, marginBottom: 10 }}>📋</div>
                <p style={{ margin: 0, fontWeight: 600 }}>No career path data found</p>
                <p style={{ margin: "4px 0 0", fontSize: 12, color: "#b0b8c9" }}>
                  HR hasn't configured salary bands for {deptName || "this department"} yet.
                </p>
              </div>
            ) : (
              <div className="cpm-excel-wrap">
                <table className="cpm-table">
                  <thead>
                    <tr>
                      <th style={{ width: 80 }}>Grade</th>
                      <th>Posting</th>
                      <th>Scale A</th>
                      <th>Scale B</th>
                      <th>Scale C</th>
                      <th style={{ whiteSpace: "nowrap" }}>Years in Role</th>
                      <th style={{ whiteSpace: "nowrap" }}>Promotion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {levels.map((band, i) => {
                      const lvl       = band.grade_level || `L${i + 1}`;
                      const posting   = band.posting || "—";
                      const yrs       = band.years_in_role || "—";
                      const promo     = band.promotion_timeline || "—";
                      const isCurrent = lvl === currentLevel;
                      const isPast    = currentIndex >= 0 && i < currentIndex;

                      return (
                        <tr key={band._id || i} className={isCurrent ? "cpm-current" : ""}>

                          {/* Grade */}
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <div style={{
                                width: 9, height: 9, borderRadius: "50%", flexShrink: 0,
                                background: isCurrent ? "#3b82f6" : isPast ? "#d1d5db" : "#e5e7eb",
                                border: isCurrent ? "2px solid #2563eb" : "2px solid #d1d5db",
                                boxShadow: isCurrent ? "0 0 0 3px #dbeafe" : "none",
                              }} />
                              <span style={{
                                background: isCurrent ? "#1a1a2e" : "#f3f4f6",
                                color: isCurrent ? "#fff" : "#6b7280",
                                borderRadius: 5, padding: "3px 8px",
                                fontSize: 11, fontWeight: 800,
                                fontFamily: "'JetBrains Mono','Courier New',monospace",
                              }}>
                                {lvl}
                              </span>
                              {isCurrent && (
                                <span style={{
                                  fontSize: 8, background: "#3b82f6", color: "#fff",
                                  borderRadius: 4, padding: "1px 5px",
                                  fontWeight: 700,
                                }}>YOU</span>
                              )}
                            </div>
                          </td>

                          {/* Posting */}
                          <td style={{ fontWeight: isCurrent ? 700 : 500, color: isCurrent ? "#1a1d2e" : "#374151" }}>
                            {posting}
                          </td>

                          {/* Scale A */}
                          <td>
                            {band.salary_band_min ? (
                              <span style={{
                                display: "inline-block",
                                background: "#ecfdf5", color: "#059669",
                                border: "1px solid #6ee7b7",
                                borderRadius: 5, padding: "2px 8px",
                                fontSize: 11, fontWeight: 700,
                                fontFamily: "'JetBrains Mono','Courier New',monospace",
                              }}>
                                {fmt(band.salary_band_min)}
                              </span>
                            ) : <span style={{ color: "#d1d5db" }}>—</span>}
                          </td>

                          {/* Scale B */}
                          <td>
                            {band.salary_band_mid ? (
                              <span style={{
                                display: "inline-block",
                                background: "#eff6ff", color: "#2563eb",
                                border: "1px solid #93c5fd",
                                borderRadius: 5, padding: "2px 8px",
                                fontSize: 11, fontWeight: 700,
                                fontFamily: "'JetBrains Mono','Courier New',monospace",
                              }}>
                                {fmt(band.salary_band_mid)}
                              </span>
                            ) : <span style={{ color: "#d1d5db" }}>—</span>}
                          </td>

                          {/* Scale C */}
                          <td>
                            {band.salary_band_max ? (
                              <span style={{
                                display: "inline-block",
                                background: "#fff7ed", color: "#d97706",
                                border: "1px solid #fcd34d",
                                borderRadius: 5, padding: "2px 8px",
                                fontSize: 11, fontWeight: 700,
                                fontFamily: "'JetBrains Mono','Courier New',monospace",
                              }}>
                                {fmt(band.salary_band_max)}
                              </span>
                            ) : <span style={{ color: "#d1d5db" }}>—</span>}
                          </td>

                          {/* Years in Role */}
                          <td style={{ fontSize: 11, color: "#6b7280", whiteSpace: "nowrap" }}>
                            {yrs}
                          </td>

                          {/* Promotion */}
                          <td>
                            {promo !== "—" ? (
                              <span style={{
                                background: "#f0fdf4", color: "#059669",
                                border: "1px solid #6ee7b7",
                                borderRadius: 6, padding: "2px 8px",
                                fontSize: 10, fontWeight: 600,
                                whiteSpace: "nowrap", display: "inline-block"
                              }}>
                                ⏱ {promo}
                              </span>
                            ) : (
                              <span style={{ color: "#d1d5db", fontSize: 12 }}>—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Legend */}
            {levels.length > 0 && (
              <div style={{
                marginTop: 12, display: "flex", gap: 12, flexWrap: "wrap",
                padding: "10px 12px",
                background: "#fff", borderRadius: 8,
                border: "1px solid #e5e7eb",
                fontSize: 10, color: "#6b7280", fontWeight: 600,
              }}>
                <span>📌 Legend:</span>
                <span style={{ color: "#059669" }}>■ Scale A = Entry/Min</span>
                <span style={{ color: "#2563eb" }}>■ Scale B = Target/Mid</span>
                <span style={{ color: "#d97706" }}>■ Scale C = Max</span>
                <span style={{ color: "#3b82f6" }}>● = Your current level</span>
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
}