import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { Download, TrendingUp, Users, Award, BarChart2, Building2, User, Globe, AlertTriangle } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const getRatingInfo = (score) => {
  if (score >= 90) return { label: "Outstanding", color: "#16a34a", bg: "#f0fdf4" };
  if (score >= 75) return { label: "Exceeds Expectations", color: "#2563eb", bg: "#eff6ff" };
  if (score >= 60) return { label: "Meets Expectations", color: "#d97706", bg: "#fffbeb" };
  if (score >= 45) return { label: "Needs Improvement", color: "#ea580c", bg: "#fff7ed" };
  return { label: "Unsatisfactory", color: "#dc2626", bg: "#fef2f2" };
};

const RATING_OPTIONS = [
  "All Ratings", "Outstanding", "Exceeds Expectations",
  "Meets Expectations", "Needs Improvement", "Unsatisfactory",
];

const labelStyle = { display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 6 };
const inputStyle = {
  width: "100%", padding: "9px 12px", border: "1px solid #d1d5db",
  borderRadius: 8, fontSize: 13, color: "#1a1a2e", background: "#fff",
  boxSizing: "border-box", outline: "none",
};

const STYLES = `
  .rp-page { padding: 28px 32px; }
  .rp-header { flex-direction: row; align-items: flex-start; }
  .rp-export-btn { white-space: nowrap; }
  .rp-view-toggle { width: fit-content; flex-wrap: nowrap; }
  .rp-view-btn { padding: 9px 20px; font-size: 13px; }

  .sc-4 { grid-template-columns: repeat(4, 1fr) !important; }
  .sc-5 { grid-template-columns: repeat(5, 1fr) !important; }

  .rp-filter-grid { grid-template-columns: 2fr 1fr 1fr 1fr 1fr; }

  .rp-table-wrap        { display: block  !important; }
  .rp-card-list         { display: none   !important; }
  .rp-dept-header       { grid-template-columns: 40px 1fr 140px 140px 140px 140px 120px; }
  .rp-member-table-wrap { display: block  !important; }
  .rp-member-cards      { display: none   !important; }
  .rp-overall-panels    { grid-template-columns: 1fr 1fr; }

  .gap-panels           { grid-template-columns: 1fr 1fr; }
  .gap-kpi-table-wrap   { display: block !important; }
  .gap-kpi-card-list    { display: none !important; }

  @media (max-width: 768px) {
    .rp-page { padding: 16px; }
    .rp-header { flex-direction: column !important; gap: 12px; }
    .rp-export-btn { width: 100%; justify-content: center; }
    .rp-view-toggle { width: 100% !important; overflow-x: auto; }
    .rp-view-btn { white-space: nowrap; font-size: 12px !important; padding: 7px 12px !important; }

    .sc-4 { grid-template-columns: repeat(2, 1fr) !important; }
    .sc-5 { grid-template-columns: repeat(2, 1fr) !important; }
    .rp-filter-grid { grid-template-columns: 1fr !important; }

    .rp-table-wrap        { display: none  !important; }
    .rp-card-list         { display: flex  !important; flex-direction: column; gap: 12px; padding: 12px 16px; }

    .rp-dept-header       { grid-template-columns: 1fr !important; gap: 10px !important; }
    .rp-member-table-wrap { display: none  !important; }
    .rp-member-cards      { display: flex  !important; flex-direction: column; gap: 10px; padding: 12px 16px; }

    .rp-overall-panels    { grid-template-columns: 1fr !important; }
    .gap-panels           { grid-template-columns: 1fr !important; }
    .gap-kpi-table-wrap   { display: none !important; }
    .gap-kpi-card-list    { display: flex !important; flex-direction: column; gap: 10px; }
  }

  @media (max-width: 480px) {
    .sc-4 { grid-template-columns: 1fr !important; }
    .sc-5 { grid-template-columns: 1fr !important; }
  }
`;

function StatCards({ items }) {
  const cls = items.length === 5 ? "sc-5" : "sc-4";
  return (
    <div className={cls} style={{ display: "grid", gap: 16, marginBottom: 24 }}>
      {items.map((s, i) => (
        <div key={i} style={{ background: "#fff", borderRadius: 12, padding: "16px 20px", border: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ margin: "0 0 4px", fontSize: 11, color: "#6b7280", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.label}</p>
            <p style={{ margin: 0, fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</p>
            {s.sub && <p style={{ margin: "2px 0 0", fontSize: 12, color: "#9ca3af" }}>{s.sub}</p>}
          </div>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>{s.icon}</div>
        </div>
      ))}
    </div>
  );
}

function RatingDistribution({ counts, total }) {
  if (!total) return null;
  return (
    <div style={{ background: "#fff", borderRadius: 14, padding: "18px 24px", border: "1px solid #e5e7eb", marginBottom: 20 }}>
      <p style={{ margin: "0 0 14px", fontWeight: 700, fontSize: 14, color: "#1a1a2e" }}>Rating Distribution</p>
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        {RATING_OPTIONS.slice(1).map(rating => {
          const score = rating === "Outstanding" ? 95 : rating === "Exceeds Expectations" ? 80 : rating === "Meets Expectations" ? 65 : rating === "Needs Improvement" ? 50 : 30;
          const { color } = getRatingInfo(score);
          const count = counts[rating] || 0;
          const pct = total ? Math.round((count / total) * 100) : 0;
          return (
            <div key={rating} style={{ flex: 1, minWidth: 120 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{rating}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color }}>{count}</span>
              </div>
              <div style={{ background: "#f3f4f6", borderRadius: 99, height: 6, overflow: "hidden" }}>
                <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 99, transition: "width 0.5s" }} />
              </div>
              <p style={{ margin: "3px 0 0", fontSize: 11, color: "#9ca3af", textAlign: "right" }}>{pct}%</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── GAP ANALYSIS VIEW ─────────────────────────────────────────────────────────
function GapAnalysisView({ reviews }) {
  const [filterPeriod, setFilterPeriod] = useState("All");
  const [filterDept, setFilterDept] = useState("All");
  const [gapThreshold, setGapThreshold] = useState(15);

  const periods = useMemo(() => ["All", ...[...new Set(reviews.map(r => r.period).filter(Boolean))].sort((a, b) => b.localeCompare(a))], [reviews]);
  const departments = useMemo(() => ["All", ...[...new Set(reviews.map(r => r.employee_id?.department).filter(Boolean))].sort()], [reviews]);

  const filtered = useMemo(() => {
    let data = [...reviews];
    if (filterPeriod !== "All") data = data.filter(r => r.period === filterPeriod);
    if (filterDept !== "All") data = data.filter(r => r.employee_id?.department === filterDept);
    return data;
  }, [reviews, filterPeriod, filterDept]);

  // Per-employee gap: target_score (100) vs final_score
  const employeeGaps = useMemo(() => {
    return filtered.map(r => {
      const targetScore = 100;
      const actualScore = r.final_score || 0;
      const selfScore = r.self_score || 0;
      const gap = targetScore - actualScore;
      const selfVsHr = selfScore - actualScore; // positive = employee overestimated
      return { ...r, gap, selfVsHr, targetScore };
    }).sort((a, b) => b.gap - a.gap);
  }, [filtered]);

  // KPI-level gap aggregated across all reviews
  const kpiGaps = useMemo(() => {
    const map = {};
    filtered.forEach(r => {
      (r.kpi_breakdown || []).forEach(kpi => {
        const name = kpi.kpi_name;
        if (!map[name]) map[name] = { name, totalTarget: 0, totalActual: 0, count: 0, unit: kpi.unit || "" };
        map[name].totalTarget += kpi.target || 0;
        map[name].totalActual += kpi.actual_value || 0;
        map[name].count += 1;
      });
    });
    return Object.values(map).map(k => {
      const avgTarget = k.totalTarget / k.count;
      const avgActual = k.totalActual / k.count;
      const achPct = avgTarget ? Math.min(Math.round((avgActual / avgTarget) * 100), 100) : 0;
      const gapPct = 100 - achPct;
      return { ...k, avgTarget: Math.round(avgTarget * 10) / 10, avgActual: Math.round(avgActual * 10) / 10, achPct, gapPct };
    }).sort((a, b) => b.gapPct - a.gapPct);
  }, [filtered]);

  // Department-level gap
  const deptGaps = useMemo(() => {
    const map = {};
    filtered.forEach(r => {
      const dept = r.employee_id?.department || "Unknown";
      if (!map[dept]) map[dept] = { dept, totalScore: 0, count: 0 };
      map[dept].totalScore += r.final_score || 0;
      map[dept].count += 1;
    });
    return Object.values(map).map(d => {
      const avg = Math.round(d.totalScore / d.count);
      const gap = 100 - avg;
      return { ...d, avg, gap };
    }).sort((a, b) => b.gap - a.gap);
  }, [filtered]);

  const atRisk = employeeGaps.filter(e => e.gap >= gapThreshold);
  const avgGap = employeeGaps.length ? Math.round(employeeGaps.reduce((s, e) => s + e.gap, 0) / employeeGaps.length) : 0;
  const maxGap = employeeGaps.length ? Math.max(...employeeGaps.map(e => e.gap)) : 0;
  const worstKpi = kpiGaps[0];

  const getGapColor = (gap) => {
    if (gap <= 10) return "#16a34a";
    if (gap <= 25) return "#d97706";
    if (gap <= 40) return "#ea580c";
    return "#dc2626";
  };

  return (
    <>
      {/* Summary Cards */}
      <StatCards items={[
        { label: "Total Reviewed", value: filtered.length, icon: <Users size={20} color="#2563eb" />, color: "#2563eb", bg: "#eff6ff" },
        { label: "Avg Gap", value: `${avgGap}%`, icon: <BarChart2 size={20} color={getGapColor(avgGap)} />, color: getGapColor(avgGap), bg: avgGap <= 10 ? "#f0fdf4" : avgGap <= 25 ? "#fffbeb" : "#fef2f2", sub: "Target vs Actual" },
        { label: "Max Gap", value: `${maxGap}%`, icon: <TrendingUp size={20} color="#dc2626" />, color: "#dc2626", bg: "#fef2f2" },
        { label: "At-Risk Employees", value: atRisk.length, icon: <AlertTriangle size={20} color="#ea580c" />, color: "#ea580c", bg: "#fff7ed", sub: `Gap ≥ ${gapThreshold}%` },
      ]} />

      {/* Filters */}
      <div style={{ background: "#fff", borderRadius: 14, padding: "16px 20px", border: "1px solid #e5e7eb", marginBottom: 20, display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-end" }}>
        <div style={{ minWidth: 160 }}>
          <label style={labelStyle}>Period</label>
          <select value={filterPeriod} onChange={e => setFilterPeriod(e.target.value)} style={inputStyle}>
            {periods.map(p => <option key={p}>{p}</option>)}
          </select>
        </div>
        <div style={{ minWidth: 160 }}>
          <label style={labelStyle}>Department</label>
          <select value={filterDept} onChange={e => setFilterDept(e.target.value)} style={inputStyle}>
            {departments.map(d => <option key={d}>{d}</option>)}
          </select>
        </div>
        <div style={{ minWidth: 180 }}>
          <label style={labelStyle}>At-Risk Threshold: <strong style={{ color: "#ea580c" }}>Gap ≥ {gapThreshold}%</strong></label>
          <input type="range" min={5} max={50} step={5} value={gapThreshold} onChange={e => setGapThreshold(Number(e.target.value))}
            style={{ width: "100%", accentColor: "#ea580c" }} />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: "#9ca3af", background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb" }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>📊</div>
          <p style={{ fontWeight: 600 }}>No data for selected filters</p>
        </div>
      ) : (
        <>
          {/* Top Panels: Department Gap + Worst KPIs */}
          <div className="gap-panels" style={{ display: "grid", gap: 20, marginBottom: 20 }}>
            {/* Department Gap */}
            <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #f3f4f6" }}>
                <p style={{ margin: 0, fontWeight: 800, fontSize: 15, color: "#1a1a2e" }}>🏢 Department Performance Gap</p>
                <p style={{ margin: "4px 0 0", fontSize: 12, color: "#6b7280" }}>Lower avg = higher gap from target (100%)</p>
              </div>
              <div style={{ padding: "16px 20px" }}>
                {deptGaps.map((d, i) => {
                  const gapColor = getGapColor(d.gap);
                  const { color: scoreColor } = getRatingInfo(d.avg);
                  return (
                    <div key={d.dept} style={{ marginBottom: i < deptGaps.length - 1 ? 16 : 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, alignItems: "center" }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>{d.dept}</span>
                        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: scoreColor }}>{d.avg}%</span>
                          <span style={{ background: "#fef2f2", color: gapColor, fontWeight: 800, fontSize: 12, padding: "2px 8px", borderRadius: 6 }}>↓{d.gap}% gap</span>
                        </div>
                      </div>
                      <div style={{ background: "#f3f4f6", borderRadius: 99, height: 10, overflow: "hidden", position: "relative" }}>
                        <div style={{ width: `${d.avg}%`, height: "100%", background: scoreColor, borderRadius: 99, transition: "width 0.5s" }} />
                        {/* Gap indicator */}
                        <div style={{ position: "absolute", right: 0, top: 0, width: `${d.gap}%`, height: "100%", background: `${gapColor}22`, borderLeft: `2px dashed ${gapColor}` }} />
                      </div>
                      <p style={{ margin: "4px 0 0", fontSize: 11, color: "#9ca3af" }}>{d.count} employee{d.count !== 1 ? "s" : ""}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* KPI Gap Leaderboard */}
            <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #f3f4f6" }}>
                <p style={{ margin: 0, fontWeight: 800, fontSize: 15, color: "#1a1a2e" }}>📉 KPI Gap Analysis</p>
                <p style={{ margin: "4px 0 0", fontSize: 12, color: "#6b7280" }}>Aggregated across all employees — sorted by gap</p>
              </div>
              <div style={{ padding: "16px 20px" }}>
                {kpiGaps.map((kpi, i) => {
                  const gapColor = getGapColor(kpi.gapPct);
                  const achColor = kpi.achPct >= 90 ? "#16a34a" : kpi.achPct >= 75 ? "#2563eb" : kpi.achPct >= 50 ? "#d97706" : "#dc2626";
                  return (
                    <div key={kpi.name} style={{ marginBottom: i < kpiGaps.length - 1 ? 14 : 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, alignItems: "flex-start", gap: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#1f2937", flex: 1 }}>{kpi.name}</span>
                        <div style={{ display: "flex", gap: 6, flexShrink: 0, alignItems: "center" }}>
                          <span style={{ fontSize: 11, color: "#6b7280" }}>Avg: {kpi.avgActual}/{kpi.avgTarget} {kpi.unit}</span>
                          <span style={{ background: "#fef2f2", color: gapColor, fontWeight: 800, fontSize: 12, padding: "2px 8px", borderRadius: 6 }}>↓{kpi.gapPct}%</span>
                        </div>
                      </div>
                      <div style={{ background: "#f3f4f6", borderRadius: 99, height: 8, overflow: "hidden" }}>
                        <div style={{ width: `${kpi.achPct}%`, height: "100%", background: achColor, borderRadius: 99, transition: "width 0.5s" }} />
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
                        <span style={{ fontSize: 11, color: achColor, fontWeight: 600 }}>{kpi.achPct}% achieved</span>
                        <span style={{ fontSize: 11, color: "#9ca3af" }}>{kpi.count} reviews</span>
                      </div>
                    </div>
                  );
                })}
                {kpiGaps.length === 0 && <p style={{ color: "#9ca3af", textAlign: "center", padding: "20px 0", fontSize: 13 }}>No KPI data</p>}
              </div>
            </div>
          </div>

          {/* At-Risk Employees */}
          {atRisk.length > 0 && (
            <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #fca5a5", marginBottom: 20, overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #fca5a5", background: "#fef2f2", display: "flex", alignItems: "center", gap: 10 }}>
                <AlertTriangle size={18} color="#dc2626" />
                <div>
                  <p style={{ margin: 0, fontWeight: 800, fontSize: 15, color: "#dc2626" }}>⚠️ At-Risk Employees (Gap ≥ {gapThreshold}%)</p>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: "#6b7280" }}>{atRisk.length} employee{atRisk.length !== 1 ? "s" : ""} need immediate attention</p>
                </div>
              </div>

              {/* Desktop Table */}
              <div className="gap-kpi-table-wrap" style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                  <thead>
                    <tr style={{ background: "#f8fafc" }}>
                      {["Employee", "Dept", "Period", "Final Score", "Self Score", "HR Gap", "Self vs HR", "Action Needed"].map(h => (
                        <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontWeight: 700, color: "#374151", borderBottom: "2px solid #e5e7eb", whiteSpace: "nowrap", fontSize: 13 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {atRisk.map((r, i) => {
                      const { label, color, bg } = getRatingInfo(r.final_score || 0);
                      const gapColor = getGapColor(r.gap);
                      const selfVsHrColor = r.selfVsHr > 10 ? "#ea580c" : r.selfVsHr < -10 ? "#2563eb" : "#16a34a";
                      const action = r.gap >= 40 ? "Urgent Coaching" : r.gap >= 25 ? "Performance Plan" : "Monitor Closely";
                      const actionColor = r.gap >= 40 ? "#dc2626" : r.gap >= 25 ? "#ea580c" : "#d97706";
                      return (
                        <tr key={r._id} style={{ borderBottom: "1px solid #f3f4f6", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                          <td style={{ padding: "12px 16px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <div style={{ width: 32, height: 32, borderRadius: "50%", background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color, fontSize: 13 }}>{r.employee_id?.name?.charAt(0) || "?"}</div>
                              <div>
                                <p style={{ margin: 0, fontWeight: 700, color: "#1a1a2e", fontSize: 13 }}>{r.employee_id?.name || "—"}</p>
                                <p style={{ margin: 0, fontSize: 11, color: "#6b7280" }}>{r.employee_id?.designation || ""}</p>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: "12px 16px", color: "#374151", fontSize: 13 }}>{r.employee_id?.department || "—"}</td>
                          <td style={{ padding: "12px 16px" }}><span style={{ background: "#f3f4f6", padding: "3px 8px", borderRadius: 5, fontWeight: 600, fontSize: 12 }}>{r.period}</span></td>
                          <td style={{ padding: "12px 16px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{ fontWeight: 800, color, fontSize: 16 }}>{r.final_score ?? "—"}%</span>
                            </div>
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <span style={{ fontWeight: 700, color: "#2563eb", fontSize: 14 }}>{r.self_score ?? "—"}%</span>
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <span style={{ fontWeight: 800, color: gapColor, fontSize: 16 }}>↓{r.gap}%</span>
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <span style={{ fontWeight: 700, color: selfVsHrColor, fontSize: 13 }}>
                              {r.selfVsHr > 0 ? `+${r.selfVsHr}% overrated` : r.selfVsHr < 0 ? `${r.selfVsHr}% underrated` : "Accurate"}
                            </span>
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <span style={{ background: `${actionColor}15`, color: actionColor, fontWeight: 700, padding: "4px 10px", borderRadius: 6, fontSize: 12 }}>{action}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="gap-kpi-card-list" style={{ padding: "12px 16px" }}>
                {atRisk.map(r => {
                  const { label, color, bg } = getRatingInfo(r.final_score || 0);
                  const gapColor = getGapColor(r.gap);
                  const action = r.gap >= 40 ? "Urgent Coaching" : r.gap >= 25 ? "Performance Plan" : "Monitor Closely";
                  return (
                    <div key={r._id} style={{ border: "1px solid #fca5a5", borderRadius: 10, padding: "14px", background: "#fff" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 34, height: 34, borderRadius: "50%", background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color, fontSize: 13 }}>{r.employee_id?.name?.charAt(0) || "?"}</div>
                          <div>
                            <p style={{ margin: 0, fontWeight: 700, color: "#1a1a2e", fontSize: 14 }}>{r.employee_id?.name || "—"}</p>
                            <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>{r.employee_id?.department}</p>
                          </div>
                        </div>
                        <span style={{ fontWeight: 900, color: gapColor, fontSize: 18 }}>↓{r.gap}%</span>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 12px", fontSize: 13, marginBottom: 8 }}>
                        <div><span style={{ color: "#9ca3af", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Final Score</span><p style={{ margin: "2px 0 0", fontWeight: 800, color, fontSize: 15 }}>{r.final_score}%</p></div>
                        <div><span style={{ color: "#9ca3af", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Self Score</span><p style={{ margin: "2px 0 0", fontWeight: 800, color: "#2563eb", fontSize: 15 }}>{r.self_score ?? "—"}%</p></div>
                        <div><span style={{ color: "#9ca3af", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Period</span><p style={{ margin: "2px 0 0" }}><span style={{ background: "#f3f4f6", padding: "2px 8px", borderRadius: 5, fontWeight: 600, fontSize: 12 }}>{r.period}</span></p></div>
                        <div><span style={{ color: "#9ca3af", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Action</span><p style={{ margin: "2px 0 0", color: "#ea580c", fontWeight: 700, fontSize: 12 }}>{action}</p></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* All Employees Gap Table */}
          <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #f3f4f6" }}>
              <p style={{ margin: 0, fontWeight: 800, fontSize: 15, color: "#1a1a2e" }}>👥 All Employees — Gap Overview</p>
              <p style={{ margin: "4px 0 0", fontSize: 12, color: "#6b7280" }}>Sorted by gap (highest first)</p>
            </div>
            <div className="gap-kpi-table-wrap" style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    {["#", "Employee", "Dept", "Period", "Target", "Final Score", "Gap", "Self Score", "Self vs HR", "KPI Gaps"].map(h => (
                      <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontWeight: 700, color: "#374151", borderBottom: "2px solid #e5e7eb", whiteSpace: "nowrap", fontSize: 13 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {employeeGaps.map((r, i) => {
                    const { label, color, bg } = getRatingInfo(r.final_score || 0);
                    const gapColor = getGapColor(r.gap);
                    const selfVsHrColor = r.selfVsHr > 10 ? "#ea580c" : r.selfVsHr < -5 ? "#2563eb" : "#16a34a";

                    // KPI-level gaps for this employee
                    const kpiGapList = (r.kpi_breakdown || []).map(kpi => {
                      const achPct = kpi.target ? Math.min(Math.round((kpi.actual_value / kpi.target) * 100), 100) : 0;
                      return { name: kpi.kpi_name, gap: 100 - achPct };
                    }).filter(k => k.gap > 0).sort((a, b) => b.gap - a.gap).slice(0, 2);

                    return (
                      <tr key={r._id} style={{ borderBottom: "1px solid #f3f4f6", background: r.gap >= gapThreshold ? "#fff7ed" : i % 2 === 0 ? "#fff" : "#fafafa" }}>
                        <td style={{ padding: "12px 16px", color: "#9ca3af", fontWeight: 600 }}>{i + 1}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ width: 30, height: 30, borderRadius: "50%", background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color, fontSize: 12 }}>{r.employee_id?.name?.charAt(0) || "?"}</div>
                            <div>
                              <p style={{ margin: 0, fontWeight: 700, color: "#1a1a2e", fontSize: 13 }}>{r.employee_id?.name || "—"}</p>
                              <p style={{ margin: 0, fontSize: 11, color: "#6b7280" }}>{r.employee_id?.designation || ""}</p>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: 13, color: "#374151" }}>{r.employee_id?.department || "—"}</td>
                        <td style={{ padding: "12px 16px" }}><span style={{ background: "#f3f4f6", padding: "3px 8px", borderRadius: 5, fontWeight: 600, fontSize: 12 }}>{r.period}</span></td>
                        <td style={{ padding: "12px 16px", fontWeight: 700, color: "#6b7280" }}>100%</td>
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontWeight: 900, color, fontSize: 16 }}>{r.final_score ?? "—"}%</span>
                            <div style={{ flex: 1, background: "#f3f4f6", borderRadius: 99, height: 6, overflow: "hidden", minWidth: 60 }}>
                              <div style={{ width: `${r.final_score || 0}%`, height: "100%", background: color, borderRadius: 99 }} />
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontWeight: 800, color: gapColor, fontSize: 16 }}>↓{r.gap}%</span>
                            {r.gap >= gapThreshold && <span style={{ fontSize: 14 }}>⚠️</span>}
                          </div>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{ fontWeight: 700, color: "#2563eb" }}>{r.self_score ?? "—"}%</span>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{ fontWeight: 700, color: selfVsHrColor, fontSize: 12 }}>
                            {r.selfVsHr > 0 ? `+${r.selfVsHr}% over` : r.selfVsHr < 0 ? `${r.selfVsHr}% under` : "Match"}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                            {kpiGapList.map((k, ki) => (
                              <span key={ki} style={{ fontSize: 11, color: getGapColor(k.gap), fontWeight: 600 }}>
                                {k.name.length > 16 ? k.name.slice(0, 16) + "…" : k.name}: ↓{k.gap}%
                              </span>
                            ))}
                            {kpiGapList.length === 0 && <span style={{ fontSize: 11, color: "#16a34a", fontWeight: 600 }}>✓ On Target</span>}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards for all-employee gap */}
            <div className="gap-kpi-card-list" style={{ padding: "12px 16px" }}>
              {employeeGaps.map((r, i) => {
                const { color, bg } = getRatingInfo(r.final_score || 0);
                const gapColor = getGapColor(r.gap);
                return (
                  <div key={r._id} style={{ border: `1px solid ${r.gap >= gapThreshold ? "#fca5a5" : "#e5e7eb"}`, borderRadius: 10, padding: "14px", background: r.gap >= gapThreshold ? "#fff7ed" : "#fff" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 32, height: 32, borderRadius: "50%", background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color, fontSize: 12 }}>{r.employee_id?.name?.charAt(0) || "?"}</div>
                        <div>
                          <p style={{ margin: 0, fontWeight: 700, color: "#1a1a2e", fontSize: 13 }}>{r.employee_id?.name || "—"}</p>
                          <p style={{ margin: 0, fontSize: 11, color: "#6b7280" }}>{r.employee_id?.department}</p>
                        </div>
                      </div>
                      <span style={{ fontWeight: 900, color: gapColor, fontSize: 17 }}>↓{r.gap}% {r.gap >= gapThreshold ? "⚠️" : ""}</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "4px 8px", fontSize: 12 }}>
                      <div><span style={{ color: "#9ca3af", fontSize: 10, fontWeight: 600 }}>FINAL</span><p style={{ margin: "1px 0 0", fontWeight: 800, color }}>{r.final_score}%</p></div>
                      <div><span style={{ color: "#9ca3af", fontSize: 10, fontWeight: 600 }}>SELF</span><p style={{ margin: "1px 0 0", fontWeight: 800, color: "#2563eb" }}>{r.self_score ?? "—"}%</p></div>
                      <div><span style={{ color: "#9ca3af", fontSize: 10, fontWeight: 600 }}>PERIOD</span><p style={{ margin: "1px 0 0", fontWeight: 600, color: "#374151" }}>{r.period}</p></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </>
  );
}

// ── INDIVIDUAL VIEW ───────────────────────────────────────────────────────────
function IndividualView({ reviews }) {
  const [filterDept, setFilterDept] = useState("All");
  const [filterPeriod, setFilterPeriod] = useState("All");
  const [filterRating, setFilterRating] = useState("All Ratings");
  const [searchName, setSearchName] = useState("");
  const [sortBy, setSortBy] = useState("score_desc");
  const [expandedRow, setExpandedRow] = useState(null);

  const departments = useMemo(() => ["All", ...[...new Set(reviews.map(r => r.employee_id?.department).filter(Boolean))].sort()], [reviews]);
  const periods = useMemo(() => ["All", ...[...new Set(reviews.map(r => r.period).filter(Boolean))].sort((a, b) => b.localeCompare(a))], [reviews]);

  const filtered = useMemo(() => {
    let data = [...reviews];
    if (filterDept !== "All") data = data.filter(r => r.employee_id?.department === filterDept);
    if (filterPeriod !== "All") data = data.filter(r => r.period === filterPeriod);
    if (filterRating !== "All Ratings") data = data.filter(r => r.rating === filterRating);
    if (searchName.trim()) data = data.filter(r => r.employee_id?.name?.toLowerCase().includes(searchName.toLowerCase()));
    data.sort((a, b) => {
      if (sortBy === "score_desc") return (b.final_score || 0) - (a.final_score || 0);
      if (sortBy === "score_asc")  return (a.final_score || 0) - (b.final_score || 0);
      if (sortBy === "name")       return (a.employee_id?.name || "").localeCompare(b.employee_id?.name || "");
      if (sortBy === "date")       return new Date(b.createdAt) - new Date(a.createdAt);
      return 0;
    });
    return data;
  }, [reviews, filterDept, filterPeriod, filterRating, searchName, sortBy]);

  const stats = useMemo(() => {
    if (!filtered.length) return { avg: 0, top: 0, counts: {} };
    const scores = filtered.map(r => r.final_score || 0);
    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    const counts = {};
    RATING_OPTIONS.slice(1).forEach(r => { counts[r] = 0; });
    filtered.forEach(r => { if (r.rating) counts[r.rating] = (counts[r.rating] || 0) + 1; });
    return { avg, top: Math.max(...scores), counts };
  }, [filtered]);

  const clearFilters = () => { setFilterDept("All"); setFilterPeriod("All"); setFilterRating("All Ratings"); setSearchName(""); };
  const hasFilters = filterDept !== "All" || filterPeriod !== "All" || filterRating !== "All Ratings" || searchName;

  return (
    <>
      <StatCards items={[
        { label: "Total Reviews", value: filtered.length, icon: <Users size={20} color="#2563eb" />, color: "#2563eb", bg: "#eff6ff" },
        { label: "Avg Score", value: `${stats.avg}%`, icon: <BarChart2 size={20} color="#d97706" />, color: "#d97706", bg: "#fffbeb" },
        { label: "Top Score", value: filtered.length ? `${stats.top}%` : "—", icon: <TrendingUp size={20} color="#16a34a" />, color: "#16a34a", bg: "#f0fdf4" },
        { label: "Outstanding", value: stats.counts["Outstanding"] || 0, icon: <Award size={20} color="#7c3aed" />, color: "#7c3aed", bg: "#f5f3ff" },
      ]} />
      <RatingDistribution counts={stats.counts} total={filtered.length} />

      <div style={{ background: "#fff", borderRadius: 14, padding: "16px 20px", border: "1px solid #e5e7eb", marginBottom: 20 }}>
        <div className="rp-filter-grid" style={{ display: "grid", gap: 14, alignItems: "end" }}>
          <div>
            <label style={labelStyle}>Search Employee</label>
            <input type="text" value={searchName} onChange={e => setSearchName(e.target.value)} placeholder="Search by name..." style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Department</label>
            <select value={filterDept} onChange={e => setFilterDept(e.target.value)} style={inputStyle}>{departments.map(d => <option key={d}>{d}</option>)}</select>
          </div>
          <div>
            <label style={labelStyle}>Period</label>
            <select value={filterPeriod} onChange={e => setFilterPeriod(e.target.value)} style={inputStyle}>{periods.map(p => <option key={p}>{p}</option>)}</select>
          </div>
          <div>
            <label style={labelStyle}>Rating</label>
            <select value={filterRating} onChange={e => setFilterRating(e.target.value)} style={inputStyle}>{RATING_OPTIONS.map(r => <option key={r}>{r}</option>)}</select>
          </div>
          <div>
            <label style={labelStyle}>Sort By</label>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={inputStyle}>
              <option value="score_desc">Score: High → Low</option>
              <option value="score_asc">Score: Low → High</option>
              <option value="name">Name A–Z</option>
              <option value="date">Latest First</option>
            </select>
          </div>
        </div>
        {hasFilters && <button onClick={clearFilters} style={{ marginTop: 10, background: "none", border: "none", color: "#2563eb", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>✕ Clear Filters</button>}
      </div>

      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", overflow: "hidden" }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "56px 0" }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>📊</div>
            <p style={{ color: "#6b7280", fontWeight: 600 }}>No reports found</p>
          </div>
        ) : (
          <>
            <div className="rp-table-wrap" style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    {["#", "Employee", "Department", "Period", "Final Score", "Rating", "KPI Breakdown", "Reviewed On", ""].map(h => (
                      <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontWeight: 700, color: "#374151", borderBottom: "2px solid #e5e7eb", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r, i) => {
                    const { label, color, bg } = getRatingInfo(r.final_score || 0);
                    const isExpanded = expandedRow === r._id;
                    return (
                      <>
                        <tr key={r._id} style={{ borderBottom: "1px solid #f3f4f6", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                          <td style={{ padding: "14px 16px", color: "#9ca3af", fontWeight: 600 }}>{i + 1}</td>
                          <td style={{ padding: "14px 16px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <div style={{ width: 36, height: 36, borderRadius: "50%", background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color, fontSize: 14 }}>{r.employee_id?.name?.charAt(0) || "?"}</div>
                              <div>
                                <p style={{ margin: 0, fontWeight: 700, color: "#1a1a2e" }}>{r.employee_id?.name || "—"}</p>
                                <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>{r.employee_id?.designation || ""}</p>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: "14px 16px", color: "#374151" }}>{r.employee_id?.department || "—"}</td>
                          <td style={{ padding: "14px 16px" }}><span style={{ background: "#f3f4f6", padding: "4px 10px", borderRadius: 6, fontWeight: 600, fontSize: 13 }}>{r.period}</span></td>
                          <td style={{ padding: "14px 16px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <span style={{ fontWeight: 900, fontSize: 18, color, minWidth: 44 }}>{r.final_score ?? "—"}%</span>
                              <div style={{ flex: 1, background: "#f3f4f6", borderRadius: 99, height: 7, overflow: "hidden", minWidth: 80 }}>
                                <div style={{ width: `${r.final_score || 0}%`, height: "100%", background: color, borderRadius: 99 }} />
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: "14px 16px" }}><span style={{ background: bg, color, fontWeight: 700, padding: "5px 12px", borderRadius: 20, fontSize: 12 }}>{label}</span></td>
                          <td style={{ padding: "14px 16px", color: "#374151", fontSize: 13 }}>{r.kpi_breakdown?.length || 0} KPIs</td>
                          <td style={{ padding: "14px 16px", color: "#6b7280", fontSize: 13 }}>{r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}</td>
                          <td style={{ padding: "14px 16px" }}>
                            <button onClick={() => setExpandedRow(isExpanded ? null : r._id)} style={{ background: isExpanded ? "#f3f4f6" : "#eff6ff", border: "none", borderRadius: 7, padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", color: isExpanded ? "#374151" : "#2563eb" }}>
                              {isExpanded ? "▲ Hide" : "▼ Details"}
                            </button>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr key={`${r._id}-exp`}>
                            <td colSpan={9} style={{ padding: "0 16px 16px", background: "#f8fafc" }}>
                              <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb", overflow: "hidden", marginTop: 8 }}>
                                <div style={{ overflowX: "auto" }}>
                                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                                    <thead>
                                      <tr style={{ background: "#f1f5f9" }}>
                                        {["KPI Name", "Target", "Self Report", "Actual", "Achievement", "Gap", "Weight", "Score"].map(h => (
                                          <th key={h} style={{ padding: "9px 14px", textAlign: "left", fontWeight: 700, color: "#6b7280", borderBottom: "1px solid #e5e7eb", whiteSpace: "nowrap" }}>{h}</th>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {(r.kpi_breakdown || []).map((kpi, ki) => {
                                        const achPct = kpi.target ? Math.min(Math.round((kpi.actual_value / kpi.target) * 100), 100) : 0;
                                        const gapPct = 100 - achPct;
                                        const achColor = achPct >= 100 ? "#16a34a" : achPct >= 75 ? "#2563eb" : achPct >= 50 ? "#d97706" : "#dc2626";
                                        const gapColor = gapPct <= 10 ? "#16a34a" : gapPct <= 25 ? "#d97706" : "#dc2626";
                                        const totalW = r.kpi_breakdown.reduce((s, k) => s + (k.weight || 0), 0);
                                        const w = totalW === 0 ? (100 / r.kpi_breakdown.length) : (kpi.weight || 0);
                                        const kpiScore = Math.round(achPct * (w / 100));
                                        return (
                                          <tr key={ki} style={{ borderBottom: "1px solid #f3f4f6" }}>
                                            <td style={{ padding: "10px 14px", fontWeight: 600, color: "#1f2937" }}>{kpi.kpi_name}</td>
                                            <td style={{ padding: "10px 14px", color: "#6b7280" }}>{kpi.target} {kpi.unit}</td>
                                            <td style={{ padding: "10px 14px", color: "#6b7280" }}>{kpi.self_value ?? "—"} {kpi.unit}</td>
                                            <td style={{ padding: "10px 14px", fontWeight: 700, color: achColor }}>{kpi.actual_value ?? "—"} {kpi.unit}</td>
                                            <td style={{ padding: "10px 14px" }}>
                                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                <div style={{ background: "#f3f4f6", borderRadius: 99, height: 6, width: 80, overflow: "hidden" }}>
                                                  <div style={{ width: `${achPct}%`, height: "100%", background: achColor, borderRadius: 99 }} />
                                                </div>
                                                <span style={{ fontWeight: 700, color: achColor, fontSize: 12 }}>{achPct}%</span>
                                              </div>
                                            </td>
                                            <td style={{ padding: "10px 14px" }}>
                                              <span style={{ fontWeight: 800, color: gapColor, fontSize: 13 }}>↓{gapPct}%</span>
                                            </td>
                                            <td style={{ padding: "10px 14px", color: "#6b7280" }}>{kpi.weight}%</td>
                                            <td style={{ padding: "10px 14px", fontWeight: 700, color: achColor }}>{kpiScore}pts</td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                                {r.hr_comment && (
                                  <div style={{ padding: "12px 16px", borderTop: "1px solid #e5e7eb", background: "#fafafa" }}>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: "#6b7280" }}>HR COMMENT: </span>
                                    <span style={{ fontSize: 13, color: "#374151" }}>{r.hr_comment}</span>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="rp-card-list">
              {filtered.map((r) => {
                const { label, color, bg } = getRatingInfo(r.final_score || 0);
                return (
                  <div key={r._id} style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: "14px 16px", background: "#fff" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: "50%", background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color, fontSize: 14, flexShrink: 0 }}>{r.employee_id?.name?.charAt(0) || "?"}</div>
                        <div>
                          <p style={{ margin: 0, fontWeight: 700, color: "#1a1a2e", fontSize: 14 }}>{r.employee_id?.name || "—"}</p>
                          <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>{r.employee_id?.designation || ""} · {r.employee_id?.department || ""}</p>
                        </div>
                      </div>
                      <span style={{ background: bg, color, fontWeight: 700, padding: "4px 10px", borderRadius: 20, fontSize: 11, flexShrink: 0 }}>{label}</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 12px", fontSize: 13, marginBottom: 8 }}>
                      <div><span style={{ color: "#9ca3af", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Period</span><p style={{ margin: "2px 0 0" }}><span style={{ background: "#f3f4f6", padding: "2px 8px", borderRadius: 5, fontWeight: 600, fontSize: 12 }}>{r.period}</span></p></div>
                      <div><span style={{ color: "#9ca3af", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Final Score</span><p style={{ margin: "2px 0 0", fontWeight: 900, color, fontSize: 16 }}>{r.final_score ?? "—"}%</p></div>
                      <div><span style={{ color: "#9ca3af", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>KPI Breakdown</span><p style={{ margin: "2px 0 0", color: "#374151" }}>{r.kpi_breakdown?.length || 0} KPIs</p></div>
                      <div><span style={{ color: "#9ca3af", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Reviewed On</span><p style={{ margin: "2px 0 0", color: "#6b7280", fontSize: 12 }}>{r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}</p></div>
                    </div>
                    {r.hr_comment && <div style={{ padding: "8px 10px", background: "#fafafa", borderRadius: 7, border: "1px solid #e5e7eb", fontSize: 12, color: "#374151" }}><span style={{ fontWeight: 700, color: "#6b7280" }}>HR: </span>{r.hr_comment}</div>}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
      {filtered.length > 0 && <p style={{ textAlign: "center", marginTop: 14, fontSize: 13, color: "#9ca3af" }}>Showing {filtered.length} of {reviews.length} reviews</p>}
    </>
  );
}

// ── TEAM VIEW ─────────────────────────────────────────────────────────────────
function TeamView({ reviews }) {
  const [filterPeriod, setFilterPeriod] = useState("All");
  const [expandedDept, setExpandedDept] = useState(null);

  const periods = useMemo(() => ["All", ...[...new Set(reviews.map(r => r.period).filter(Boolean))].sort((a, b) => b.localeCompare(a))], [reviews]);
  const filtered = useMemo(() => filterPeriod === "All" ? reviews : reviews.filter(r => r.period === filterPeriod), [reviews, filterPeriod]);

  const deptData = useMemo(() => {
    const map = {};
    filtered.forEach(r => {
      const dept = r.employee_id?.department || "Unknown";
      if (!map[dept]) map[dept] = { dept, reviews: [], totalScore: 0 };
      map[dept].reviews.push(r);
      map[dept].totalScore += r.final_score || 0;
    });
    return Object.values(map).map(d => {
      const scores = d.reviews.map(r => r.final_score || 0);
      const avg = Math.round(d.totalScore / d.reviews.length);
      const counts = {};
      RATING_OPTIONS.slice(1).forEach(r => { counts[r] = 0; });
      d.reviews.forEach(r => { if (r.rating) counts[r.rating]++; });
      return { ...d, avg, top: Math.max(...scores), bottom: Math.min(...scores), employeeCount: d.reviews.length, counts };
    }).sort((a, b) => b.avg - a.avg);
  }, [filtered]);

  const overallAvg = deptData.length ? Math.round(deptData.reduce((s, d) => s + d.avg, 0) / deptData.length) : 0;
  const bestDept = deptData[0];

  return (
    <>
      <StatCards items={[
        { label: "Total Departments", value: deptData.length, icon: <Building2 size={20} color="#2563eb" />, color: "#2563eb", bg: "#eff6ff" },
        { label: "Total Employees", value: filtered.length, icon: <Users size={20} color="#7c3aed" />, color: "#7c3aed", bg: "#f5f3ff" },
        { label: "Company Avg Score", value: `${overallAvg}%`, icon: <BarChart2 size={20} color="#d97706" />, color: "#d97706", bg: "#fffbeb" },
        { label: "Best Dept", value: bestDept?.dept || "—", icon: <Award size={20} color="#16a34a" />, color: "#16a34a", bg: "#f0fdf4", sub: bestDept ? `${bestDept.avg}% avg` : "" },
      ]} />

      <div style={{ background: "#fff", borderRadius: 14, padding: "16px 20px", border: "1px solid #e5e7eb", marginBottom: 20, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <div style={{ minWidth: 200 }}>
          <label style={labelStyle}>Period</label>
          <select value={filterPeriod} onChange={e => setFilterPeriod(e.target.value)} style={inputStyle}>{periods.map(p => <option key={p}>{p}</option>)}</select>
        </div>
        <div style={{ marginTop: 18, fontSize: 13, color: "#6b7280" }}>Showing aggregated data for <strong>{deptData.length}</strong> departments</div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {deptData.map((dept, i) => {
          const { color, bg } = getRatingInfo(dept.avg);
          const isExpanded = expandedDept === dept.dept;
          return (
            <div key={dept.dept} style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", overflow: "hidden" }}>
              <div className="rp-dept-header" style={{ display: "grid", alignItems: "center", padding: "16px 20px", gap: 16, cursor: "pointer" }}
                onClick={() => setExpandedDept(isExpanded ? null : dept.dept)}>
                <div style={{ fontWeight: 800, color: "#9ca3af", fontSize: 15 }}>#{i + 1}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 10, background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Building2 size={20} color={color} /></div>
                  <div>
                    <p style={{ margin: 0, fontWeight: 800, fontSize: 15, color: "#1a1a2e" }}>{dept.dept}</p>
                    <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>{dept.employeeCount} employee{dept.employeeCount !== 1 ? "s" : ""}</p>
                  </div>
                </div>
                <div>
                  <p style={{ margin: "0 0 4px", fontSize: 11, color: "#9ca3af", fontWeight: 600 }}>AVG SCORE</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontWeight: 800, fontSize: 18, color }}>{dept.avg}%</span>
                    <div style={{ flex: 1, background: "#f3f4f6", borderRadius: 99, height: 6, overflow: "hidden", minWidth: 60 }}>
                      <div style={{ width: `${dept.avg}%`, background: color, height: "100%", borderRadius: 99 }} />
                    </div>
                  </div>
                </div>
                <div><p style={{ margin: "0 0 4px", fontSize: 11, color: "#9ca3af", fontWeight: 600 }}>TOP</p><span style={{ fontWeight: 700, color: "#16a34a", fontSize: 15 }}>{dept.top}%</span></div>
                <div><p style={{ margin: "0 0 4px", fontSize: 11, color: "#9ca3af", fontWeight: 600 }}>LOWEST</p><span style={{ fontWeight: 700, color: "#dc2626", fontSize: 15 }}>{dept.bottom}%</span></div>
                <div><p style={{ margin: "0 0 4px", fontSize: 11, color: "#9ca3af", fontWeight: 600 }}>OUTSTANDING</p><span style={{ fontWeight: 700, color: "#7c3aed", fontSize: 15 }}>{dept.counts["Outstanding"] || 0}</span></div>
                <button style={{ background: isExpanded ? "#f3f4f6" : "#eff6ff", border: "none", borderRadius: 7, padding: "7px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", color: isExpanded ? "#374151" : "#2563eb", justifySelf: "end" }}>
                  {isExpanded ? "▲ Collapse" : "▼ Members"}
                </button>
              </div>
              <div style={{ padding: "0 20px 14px", display: "flex", gap: 8 }}>
                {RATING_OPTIONS.slice(1).map(r => {
                  const s = r === "Outstanding" ? 95 : r === "Exceeds Expectations" ? 80 : r === "Meets Expectations" ? 65 : r === "Needs Improvement" ? 50 : 30;
                  const { color: c } = getRatingInfo(s);
                  const cnt = dept.counts[r] || 0;
                  const pct = dept.employeeCount ? Math.round((cnt / dept.employeeCount) * 100) : 0;
                  return <div key={r} title={`${r}: ${cnt}`} style={{ flex: pct || 1, height: 4, background: cnt ? c : "#f3f4f6", borderRadius: 99 }} />;
                })}
              </div>
              {isExpanded && (
                <div style={{ borderTop: "1px solid #f3f4f6", background: "#f8fafc" }}>
                  <div className="rp-member-table-wrap" style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                      <thead>
                        <tr style={{ background: "#f1f5f9" }}>
                          {["Employee", "Designation", "Period", "Score", "Rating", "Reviewed On"].map(h => (
                            <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontWeight: 700, color: "#6b7280", borderBottom: "1px solid #e5e7eb", whiteSpace: "nowrap" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {dept.reviews.sort((a, b) => (b.final_score || 0) - (a.final_score || 0)).map((r, ri) => {
                          const { color: rc, bg: rb, label: rl } = getRatingInfo(r.final_score || 0);
                          return (
                            <tr key={r._id} style={{ borderBottom: "1px solid #f3f4f6", background: ri % 2 === 0 ? "#fff" : "#fafafa" }}>
                              <td style={{ padding: "10px 16px", fontWeight: 700, color: "#1a1a2e" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: rb, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: rc, fontSize: 12 }}>{r.employee_id?.name?.charAt(0) || "?"}</div>
                                  {r.employee_id?.name || "—"}
                                </div>
                              </td>
                              <td style={{ padding: "10px 16px", color: "#6b7280" }}>{r.employee_id?.designation || "—"}</td>
                              <td style={{ padding: "10px 16px" }}><span style={{ background: "#f3f4f6", padding: "3px 8px", borderRadius: 6, fontWeight: 600, fontSize: 12 }}>{r.period}</span></td>
                              <td style={{ padding: "10px 16px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                  <span style={{ fontWeight: 800, color: rc }}>{r.final_score ?? "—"}%</span>
                                  <div style={{ background: "#f3f4f6", borderRadius: 99, height: 5, width: 60, overflow: "hidden" }}>
                                    <div style={{ width: `${r.final_score || 0}%`, height: "100%", background: rc, borderRadius: 99 }} />
                                  </div>
                                </div>
                              </td>
                              <td style={{ padding: "10px 16px" }}><span style={{ background: rb, color: rc, fontWeight: 700, padding: "3px 10px", borderRadius: 20, fontSize: 11 }}>{rl}</span></td>
                              <td style={{ padding: "10px 16px", color: "#6b7280" }}>{r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="rp-member-cards">
                    {dept.reviews.sort((a, b) => (b.final_score || 0) - (a.final_score || 0)).map(r => {
                      const { color: rc, bg: rb, label: rl } = getRatingInfo(r.final_score || 0);
                      return (
                        <div key={r._id} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "12px 14px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <div style={{ width: 30, height: 30, borderRadius: "50%", background: rb, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: rc, fontSize: 12 }}>{r.employee_id?.name?.charAt(0) || "?"}</div>
                              <div>
                                <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: "#1a1a2e" }}>{r.employee_id?.name || "—"}</p>
                                <p style={{ margin: 0, fontSize: 11, color: "#6b7280" }}>{r.employee_id?.designation || "—"}</p>
                              </div>
                            </div>
                            <span style={{ fontWeight: 900, color: rc, fontSize: 16 }}>{r.final_score ?? "—"}%</span>
                          </div>
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <span style={{ background: "#f3f4f6", padding: "2px 8px", borderRadius: 5, fontWeight: 600, fontSize: 11 }}>{r.period}</span>
                            <span style={{ background: rb, color: rc, fontWeight: 700, padding: "2px 8px", borderRadius: 20, fontSize: 11 }}>{rl}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

// ── OVERALL VIEW ──────────────────────────────────────────────────────────────
function OverallView({ reviews }) {
  const [filterPeriod, setFilterPeriod] = useState("All");
  const periods = useMemo(() => ["All", ...[...new Set(reviews.map(r => r.period).filter(Boolean))].sort((a, b) => b.localeCompare(a))], [reviews]);
  const filtered = useMemo(() => filterPeriod === "All" ? reviews : reviews.filter(r => r.period === filterPeriod), [reviews, filterPeriod]);

  const stats = useMemo(() => {
    if (!filtered.length) return { avg: 0, top: 0, bottom: 0, counts: {}, byPeriod: [], topEmployees: [], deptAvgs: [] };
    const scores = filtered.map(r => r.final_score || 0);
    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    const counts = {};
    RATING_OPTIONS.slice(1).forEach(r => { counts[r] = 0; });
    filtered.forEach(r => { if (r.rating) counts[r.rating]++; });
    const topEmployees = [...filtered].sort((a, b) => (b.final_score || 0) - (a.final_score || 0)).slice(0, 5);
    const periodMap = {};
    filtered.forEach(r => { if (!periodMap[r.period]) periodMap[r.period] = { total: 0, count: 0 }; periodMap[r.period].total += r.final_score || 0; periodMap[r.period].count++; });
    const byPeriod = Object.entries(periodMap).map(([period, v]) => ({ period, avg: Math.round(v.total / v.count) })).sort((a, b) => a.period.localeCompare(b.period));
    const deptMap = {};
    filtered.forEach(r => { const d = r.employee_id?.department || "Unknown"; if (!deptMap[d]) deptMap[d] = { total: 0, count: 0 }; deptMap[d].total += r.final_score || 0; deptMap[d].count++; });
    const deptAvgs = Object.entries(deptMap).map(([dept, v]) => ({ dept, avg: Math.round(v.total / v.count), count: v.count })).sort((a, b) => b.avg - a.avg);
    return { avg, top: Math.max(...scores), bottom: Math.min(...scores), counts, topEmployees, byPeriod, deptAvgs };
  }, [filtered]);

  const { color: avgColor, bg: avgBg } = getRatingInfo(stats.avg);

  return (
    <>
      <StatCards items={[
        { label: "Total Reviews", value: filtered.length, icon: <Users size={20} color="#2563eb" />, color: "#2563eb", bg: "#eff6ff" },
        { label: "Company Avg", value: `${stats.avg}%`, icon: <BarChart2 size={20} color={avgColor} />, color: avgColor, bg: avgBg, sub: getRatingInfo(stats.avg).label },
        { label: "Highest Score", value: filtered.length ? `${stats.top}%` : "—", icon: <TrendingUp size={20} color="#16a34a" />, color: "#16a34a", bg: "#f0fdf4" },
        { label: "Lowest Score", value: filtered.length ? `${stats.bottom}%` : "—", icon: <TrendingUp size={20} color="#dc2626" />, color: "#dc2626", bg: "#fef2f2" },
        { label: "Outstanding", value: stats.counts["Outstanding"] || 0, icon: <Award size={20} color="#7c3aed" />, color: "#7c3aed", bg: "#f5f3ff" },
      ]} />
      <RatingDistribution counts={stats.counts} total={filtered.length} />
      <div style={{ background: "#fff", borderRadius: 14, padding: "16px 20px", border: "1px solid #e5e7eb", marginBottom: 20 }}>
        <div style={{ minWidth: 200 }}>
          <label style={labelStyle}>Period</label>
          <select value={filterPeriod} onChange={e => setFilterPeriod(e.target.value)} style={inputStyle}>{periods.map(p => <option key={p}>{p}</option>)}</select>
        </div>
      </div>
      <div className="rp-overall-panels" style={{ display: "grid", gap: 20, marginBottom: 20 }}>
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #f3f4f6" }}><p style={{ margin: 0, fontWeight: 800, fontSize: 15, color: "#1a1a2e" }}>🏆 Top Performers</p></div>
          <div>
            {stats.topEmployees.map((r, i) => {
              const { color, bg } = getRatingInfo(r.final_score || 0);
              return (
                <div key={r._id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 20px", borderBottom: i < 4 ? "1px solid #f9fafb" : "none" }}>
                  <span style={{ fontSize: 18 }}>{["🥇","🥈","🥉","4️⃣","5️⃣"][i]}</span>
                  <div style={{ width: 34, height: 34, borderRadius: "50%", background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color, fontSize: 13 }}>{r.employee_id?.name?.charAt(0) || "?"}</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontWeight: 700, color: "#1a1a2e", fontSize: 13 }}>{r.employee_id?.name || "—"}</p>
                    <p style={{ margin: 0, fontSize: 11, color: "#9ca3af" }}>{r.employee_id?.department} · {r.period}</p>
                  </div>
                  <span style={{ fontWeight: 900, color, fontSize: 16 }}>{r.final_score}%</span>
                </div>
              );
            })}
            {stats.topEmployees.length === 0 && <p style={{ padding: "20px", color: "#9ca3af", textAlign: "center", fontSize: 13 }}>No data</p>}
          </div>
        </div>
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #f3f4f6" }}><p style={{ margin: 0, fontWeight: 800, fontSize: 15, color: "#1a1a2e" }}>🏢 Department Comparison</p></div>
          <div style={{ padding: "16px 20px" }}>
            {stats.deptAvgs.map((d, i) => {
              const { color } = getRatingInfo(d.avg);
              return (
                <div key={d.dept} style={{ marginBottom: i < stats.deptAvgs.length - 1 ? 14 : 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{d.dept}</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color }}>{d.avg}% <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 400 }}>({d.count} emp)</span></span>
                  </div>
                  <div style={{ background: "#f3f4f6", borderRadius: 99, height: 8, overflow: "hidden" }}>
                    <div style={{ width: `${d.avg}%`, height: "100%", background: color, borderRadius: 99, transition: "width 0.5s" }} />
                  </div>
                </div>
              );
            })}
            {stats.deptAvgs.length === 0 && <p style={{ color: "#9ca3af", textAlign: "center", fontSize: 13 }}>No data</p>}
          </div>
        </div>
      </div>
      {stats.byPeriod.length > 1 && (
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", padding: "18px 24px" }}>
          <p style={{ margin: "0 0 16px", fontWeight: 800, fontSize: 15, color: "#1a1a2e" }}>📈 Score Trend by Period</p>
          <div style={{ display: "flex", gap: 16, alignItems: "flex-end", height: 120, overflowX: "auto" }}>
            {stats.byPeriod.map(p => {
              const { color, bg } = getRatingInfo(p.avg);
              const barH = Math.round((p.avg / 100) * 100);
              return (
                <div key={p.period} style={{ flex: 1, minWidth: 60, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color }}>{p.avg}%</span>
                  <div style={{ width: "100%", background: bg, borderRadius: "6px 6px 0 0", height: `${barH}px`, minHeight: 8 }}>
                    <div style={{ width: "100%", background: color, borderRadius: "6px 6px 0 0", height: "100%" }} />
                  </div>
                  <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600, textAlign: "center", whiteSpace: "nowrap" }}>{p.period}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function PerformanceReports() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [activeView, setActiveView] = useState("individual");

  useEffect(() => { fetchReports(); }, []);

  const fetchReports = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/self-assessment/performance-reviews/all`);
      if (res.data.success) setReviews(res.data.data);
    } catch { showToast("Failed to load reports", "error"); }
    finally { setLoading(false); }
  };

  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const exportToExcel = () => {
    const rows = reviews.map((r, i) => ({
      "#": i + 1,
      "Employee Name": r.employee_id?.name || "—",
      "Designation":   r.employee_id?.designation || "—",
      "Department":    r.employee_id?.department || "—",
      "Email":         r.employee_id?.email || "—",
      "Period":        r.period || "—",
      "Self Score (%)":  r.self_score ?? "—",
      "Final Score (%)": r.final_score ?? "—",
      "Gap (%)": r.final_score != null ? 100 - r.final_score : "—",
      "Rating":        r.rating || "—",
      "HR Comment":    r.hr_comment || "—",
      "Reviewed On":   r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-IN") : "—"
    }));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [{ wch: 4 }, { wch: 22 }, { wch: 20 }, { wch: 16 }, { wch: 28 }, { wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 10 }, { wch: 22 }, { wch: 40 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(wb, ws, "Performance Summary");
    XLSX.writeFile(wb, `Performance_Report_${new Date().toLocaleDateString("en-IN").replace(/\//g, "-")}.xlsx`);
    showToast("Excel report downloaded! ✅");
  };

  const VIEWS = [
    { key: "individual", label: "Individual",   icon: <User size={15} /> },
    { key: "team",       label: "Team / Dept",  icon: <Building2 size={15} /> },
    { key: "overall",    label: "Overall",      icon: <Globe size={15} /> },
    { key: "gap",        label: "Gap Analysis", icon: <AlertTriangle size={15} /> },
  ];

  return (
    <div className="rp-page" style={{ fontFamily: "'Segoe UI', sans-serif", minHeight: "100vh", background: "#f4f6fb" }}>
      <style>{STYLES}</style>

      {toast && (
        <div style={{ position: "fixed", top: 20, right: 16, zIndex: 9999, background: toast.type === "error" ? "#ff4d4f" : "#52c41a", color: "#fff", padding: "12px 20px", borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.15)", fontWeight: 500, fontSize: 14, maxWidth: "calc(100vw - 32px)" }}>
          {toast.msg}
        </div>
      )}

      <div className="rp-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#1a1a2e" }}>Performance Reports</h2>
          <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 14 }}>View and export employee performance scores across all periods</p>
        </div>
        <button className="rp-export-btn" onClick={exportToExcel} disabled={!reviews.length} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", background: reviews.length ? "#16a34a" : "#d1fae5", color: "#fff", border: "none", borderRadius: 9, fontWeight: 700, fontSize: 14, cursor: reviews.length ? "pointer" : "not-allowed" }}>
          <Download size={16} />Export to Excel ({reviews.length})
        </button>
      </div>

      <div className="rp-view-toggle" style={{ display: "flex", gap: 8, marginBottom: 24, background: "#fff", padding: 6, borderRadius: 14, border: "1px solid #e5e7eb" }}>
        {VIEWS.map(v => (
          <button key={v.key} className="rp-view-btn" onClick={() => setActiveView(v.key)} style={{ display: "flex", alignItems: "center", gap: 8, borderRadius: 10, border: "none", cursor: "pointer", fontWeight: 700, background: activeView === v.key ? (v.key === "gap" ? "#ea580c" : "#1a1a2e") : "transparent", color: activeView === v.key ? "#fff" : "#6b7280", transition: "all 0.18s" }}>
            {v.icon}{v.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 80, color: "#6b7280" }}>
          <div style={{ width: 36, height: 36, border: "4px solid #e5e7eb", borderTopColor: "#2563eb", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          Loading reports...
        </div>
      ) : (
        <>
          {activeView === "individual" && <IndividualView reviews={reviews} />}
          {activeView === "team"       && <TeamView reviews={reviews} />}
          {activeView === "overall"    && <OverallView reviews={reviews} />}
          {activeView === "gap"        && <GapAnalysisView reviews={reviews} />}
        </>
      )}
    </div>
  );
}