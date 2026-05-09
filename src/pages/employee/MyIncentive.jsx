import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import EmployeeLayout from "./EmployeeLayout";
import {
  Sparkles, TrendingUp, Clock, CheckCircle, DollarSign,
  ChevronDown, ChevronUp, Award, Target, BarChart2, Gift
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

// ── Helpers ───────────────────────────────────────────────────────────────────
function isKpiPlan(plan) {
  if (!plan?.plan_type) return false;
  return plan.plan_type === "kpi_linked" || plan.plan_type === "kpi-linked";
}

function formatPeriod(cycleStr) {
  if (!cycleStr) return "—";
  if (!/^\d{4}-\d{2}$/.test(cycleStr)) return cycleStr;
  const [year, month] = cycleStr.split("-");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[parseInt(month, 10) - 1]} ${year}`;
}

function standaloneLabel(plan) {
  if (!plan) return "—";
  if (plan.standalone_payout_type === "percentage")
    return `${plan.standalone_payout_value}% of Salary`;
  return `₹${Number(plan.standalone_payout_value || 0).toLocaleString("en-IN")} Fixed`;
}

function metricLabel(plan) {
  if (!plan) return "Manual";
  if (plan.standalone_metric === "custom") return plan.standalone_metric_label || "Custom";
  if (plan.standalone_metric === "attendance") return "Attendance %";
  return "Manual Entry";
}

// ── Per-KPI incentive calculator (mirrors HR side) ────────────────────────────
function calcKpiIncentive(plan, kpiBreakdown = [], salary = 0) {
  const normalize = (s) => (s || "").toLowerCase().trim();
  const kpiConfigs = plan?.kpi_configs || [];
  if (!kpiConfigs.length) return { rows: [], total: 0 };

  let total = 0;
  const rows = kpiConfigs.map(cfg => {

    // ── ADMISSION KPI: program-wise slab ──
    if (cfg.is_admission_kpi) {
      const programTargets = cfg.program_targets || [];
      const programSlabs = cfg.program_slabs || [];
      let admissionTotal = 0;
      const programDetails = [];

      programTargets.forEach(pt => {
        const progActual = kpiBreakdown.find(k =>
          normalize(k.kpi_name) === normalize(cfg.kpi_name) &&
          (k.program_id === pt.program_id || normalize(k.program_name) === normalize(pt.program_name))
        );
        const actualAdmissions = progActual?.actual_value ?? 0;
        const programTarget = Number(pt.target) || 0;
        const achPct = programTarget > 0
          ? Math.min(Math.round((Number(actualAdmissions) / programTarget) * 100), 100)
          : 0;

        const progSlabEntry = programSlabs.find(ps => ps.program_id === pt.program_id);
        const slabs = progSlabEntry?.slabs || [];
        const slab = slabs.find(s => achPct >= s.min_score && achPct <= s.max_score);

        let amt = 0;
        let slabDesc = "No Slab";
        if (slab && slab.type !== "none" && slab.value > 0) {
          if (slab.type === "target_percentage") {
            amt = Math.round((slab.value / 100) * programTarget);
          } else if (slab.type === "percentage") {
            amt = Math.round((slab.value / 100) * salary);
          } else {
            amt = slab.value;
          }
          slabDesc = `${slab.min_score}–${slab.max_score}% → ₹${amt.toLocaleString("en-IN")}`;
        } else if (slab) {
          slabDesc = `${slab.min_score}–${slab.max_score}% → No Bonus`;
        }

        admissionTotal += amt;
        const achColor = achPct >= 90 ? "#16a34a" : achPct >= 70 ? "#6366f1" : achPct >= 50 ? "#d97706" : "#dc2626";
        programDetails.push({ program_name: pt.program_name, target: programTarget, actual: actualAdmissions, achPct, achColor, slabDesc, amt });
      });

      total += admissionTotal;
      return {
        kpi_name: cfg.kpi_name,
        weight: cfg.weight,
        is_admission_kpi: true,
        programDetails,
        amt: admissionTotal,
      };
    }

    // ── NORMAL KPI ──
    const kpiData = kpiBreakdown.find(k => normalize(k.kpi_name) === normalize(cfg.kpi_name));
    let achPct = 0;
    if (kpiData) {
      if (kpiData.target && Number(kpiData.target) > 0 && kpiData.actual_value != null) {
        achPct = Math.min(Math.round((Number(kpiData.actual_value) / Number(kpiData.target)) * 100), 100);
      } else if (kpiData.pct_achieved != null) {
        achPct = Math.round(kpiData.pct_achieved);
      } else {
        achPct = Math.round(kpiData.actual_value || 0);
      }
    }

    const slab = (cfg.slabs || []).find(s => achPct >= s.min_score && achPct <= s.max_score);
    let amt = 0;
    let slabDesc = "No Bonus";
    if (slab && slab.type !== "none" && slab.value > 0) {
      if (slab.type === "target_percentage") {
        amt = Math.round((slab.value / 100) * Number(cfg.target));
        slabDesc = `${slab.value}% of Target`;
      } else if (slab.type === "percentage") {
        amt = Math.round((slab.value / 100) * salary);
        slabDesc = `${slab.value}% of Salary`;
      } else {
        amt = slab.value;
        slabDesc = `₹${Number(slab.value).toLocaleString("en-IN")} Fixed`;
      }
      total += amt;
    }

    const achColor = achPct >= 90 ? "#16a34a" : achPct >= 70 ? "#6366f1" : achPct >= 50 ? "#d97706" : "#dc2626";
    return {
      kpi_name: cfg.kpi_name, weight: cfg.weight,
      is_admission_kpi: false,
      target: kpiData?.target ?? cfg.target,
      actual: kpiData?.actual_value,
      unit: kpiData?.unit || "",
      achPct, achColor, slabs: cfg.slabs || [], slab, slabDesc, amt,
    };
  });

  return { rows, total };
}

const STATUS_META = {
  pending: { label: "Pending Approval", color: "#d97706", bg: "#fffbeb", icon: <Clock size={13} /> },
  approved: { label: "Approved", color: "#16a34a", bg: "#f0fdf4", icon: <CheckCircle size={13} /> },
  paid: { label: "Paid ✓", color: "#2563eb", bg: "#eff6ff", icon: <DollarSign size={13} /> },
};

// ── Timeline step component ───────────────────────────────────────────────────
function TimelineStep({ done, active, label, sublabel, color }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
      <div style={{
        width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
        background: done ? color : active ? `${color}22` : "#f3f4f6",
        border: `2px solid ${done || active ? color : "#e5e7eb"}`,
        transition: "all 0.3s",
      }}>
        {done
          ? <CheckCircle size={16} color="#fff" />
          : <div style={{ width: 8, height: 8, borderRadius: "50%", background: active ? color : "#d1d5db" }} />}
      </div>
      <p style={{ margin: "6px 0 0", fontSize: 11, fontWeight: 700, color: done || active ? color : "#9ca3af", textAlign: "center" }}>{label}</p>
      {sublabel && <p style={{ margin: "2px 0 0", fontSize: 10, color: "#9ca3af", textAlign: "center" }}>{sublabel}</p>}
    </div>
  );
}

function TimelineLine({ done, color }) {
  return (
    <div style={{ flex: 1, height: 2, background: done ? color : "#e5e7eb", marginTop: 15, transition: "background 0.3s", maxWidth: 60 }} />
  );
}

// ════════════════════════════════════════════════════════════════════════════
export default function MyIncentive() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    const empId = localStorage.getItem("employeeId");
    if (!empId) { setError("Session expired. Please login again."); setLoading(false); return; }
    fetchMyIncentives(empId);
  }, []);

  const fetchMyIncentives = async (empId) => {
    try {
      const res = await axios.get(`${API_BASE}/api/incentive-results/employee/${empId}`);
      setResults(res.data?.data || res.data || []);
    } catch {
      setError("Failed to load incentive data.");
    } finally {
      setLoading(false);
    }
  };

  const summary = useMemo(() => {
    const total = results.reduce((s, r) => s + (r.calculated_amount || 0), 0);
    const paid = results.filter(r => r.status === "paid").reduce((s, r) => s + (r.calculated_amount || 0), 0);
    const pending = results.filter(r => r.status === "pending").length;
    const approved = results.filter(r => r.status === "approved").length;
    return { total, paid, pending, approved };
  }, [results]);

  const latest = results[0] || null;

  // ── Loading ──
  if (loading) return (
    <EmployeeLayout>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", flexDirection: "column", gap: 12, fontFamily: "'Sora',sans-serif" }}>
        <div style={{ width: 36, height: 36, border: "4px solid #e5e7eb", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
        <p style={{ color: "#9ca3af", fontSize: 14 }}>Loading your incentives...</p>
      </div>
    </EmployeeLayout>
  );

  // ── Error ──
  if (error) return (
    <EmployeeLayout>
      <div style={{ textAlign: "center", padding: 80, fontFamily: "'Sora',sans-serif" }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
        <p style={{ color: "#dc2626", fontWeight: 600 }}>{error}</p>
      </div>
    </EmployeeLayout>
  );

  return (
    <EmployeeLayout>
      <div style={{ padding: "24px 20px", fontFamily: "'Sora',sans-serif", minHeight: "100vh", background: "#f4f6fb", maxWidth: 960, margin: "0 auto" }}>
        <style>{`
          @keyframes spin    { to { transform:rotate(360deg); } }
          @keyframes fadeUp  { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
          .inc-card { animation: fadeUp 0.35s ease both; }
          .hist-row:hover { background: #f8faff !important; }
          @media (max-width:600px) {
            .inc-stats { grid-template-columns: 1fr 1fr !important; }
            .inc-hero  { flex-direction: column !important; align-items: flex-start !important; }
            .kpi-row   { grid-template-columns: 1fr !important; }
          }
        `}</style>

        {/* ── Page Header ── */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Sparkles size={20} color="#fff" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#1a1a2e" }}>My Incentive</h2>
              <p style={{ margin: 0, fontSize: 12, color: "#9ca3af" }}>Performance-based incentive history & payout status</p>
            </div>
          </div>
        </div>

        {/* ── Empty State ── */}
        {results.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 20px", background: "#fff", borderRadius: 16, border: "1px solid #e5e7eb" }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>🎯</div>
            <p style={{ fontWeight: 700, fontSize: 16, color: "#1a1a2e", margin: "0 0 8px" }}>No Incentive Records Yet</p>
            <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>
              Once your KPI review is completed and an incentive plan is assigned, your results will appear here.
            </p>
          </div>
        ) : (
          <>
            {/* ══════════════════════════════════════════════════════════════
                HERO CARD — Latest Record
            ══════════════════════════════════════════════════════════════ */}
            {latest && (() => {
              const isKpi = isKpiPlan(latest.plan_id);
              const sm = STATUS_META[latest.status] || STATUS_META.pending;
              const score = Math.round(latest.performance_score || 0);
              const bonus = latest.completion_bonus || 0;
              const total = latest.calculated_amount || 0;
              const base = total - bonus;
              const scoreColor = score >= 90 ? "#4ade80" : score >= 75 ? "#818cf8" : score >= 60 ? "#fbbf24" : "#f87171";

              // KPI breakdown for hero
              const { rows: kpiRows } = isKpi
                ? calcKpiIncentive(latest.plan_id, latest.kpi_breakdown || [], latest.salary || 0)
                : { rows: [] };

              const hasBreakdown = kpiRows.length > 0;

              return (
                <div className="inc-card" style={{ background: "linear-gradient(135deg,#1a1a2e 0%,#16213e 60%,#0f3460 100%)", borderRadius: 20, padding: 24, marginBottom: 20, color: "#fff", position: "relative", overflow: "hidden" }}>
                  {/* BG glow */}
                  <div style={{ position: "absolute", top: -60, right: -60, width: 200, height: 200, background: "radial-gradient(circle,rgba(99,102,241,0.3),transparent 70%)", pointerEvents: "none" }} />
                  <div style={{ position: "absolute", bottom: -40, left: -40, width: 150, height: 150, background: "radial-gradient(circle,rgba(139,92,246,0.2),transparent 70%)", pointerEvents: "none" }} />

                  {/* Badge */}
                  <div style={{ marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 12px", borderRadius: 20, background: isKpi ? "rgba(124,58,237,0.25)" : "rgba(217,119,6,0.25)", color: isKpi ? "#c4b5fd" : "#fcd34d", border: `1px solid ${isKpi ? "rgba(124,58,237,0.4)" : "rgba(217,119,6,0.4)"}` }}>
                      {isKpi ? "🔗 KPI-Linked Plan" : "📋 Standalone Plan"}
                    </span>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Latest Period</span>
                  </div>

                  <div className="inc-hero" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20, position: "relative" }}>
                    {/* Left: score + info */}
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: "0 0 4px", fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.8px" }}>Period</p>
                      <p style={{ margin: "0 0 16px", fontSize: 18, fontWeight: 800 }}>
                        {formatPeriod(latest.cycle_period)}
                        <span style={{ marginLeft: 10, fontSize: 11, background: "rgba(255,255,255,0.1)", padding: "2px 10px", borderRadius: 20, fontWeight: 600 }}>
                          {latest.plan_id?.period_type || latest.cycle || "Monthly"}
                        </span>
                      </p>

                      {/* KPI Score bar */}
                      {isKpi && (
                        <div style={{ marginBottom: 16 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>Overall KPI Score</span>
                            <span style={{ fontSize: 14, fontWeight: 800, color: scoreColor }}>{score}%</span>
                          </div>
                          <div style={{ background: "rgba(255,255,255,0.12)", borderRadius: 99, height: 10, overflow: "hidden" }}>
                            <div style={{ width: `${score}%`, height: "100%", background: `linear-gradient(90deg,${scoreColor},${scoreColor}99)`, borderRadius: 99, transition: "width 0.8s cubic-bezier(.4,0,.2,1)" }} />
                          </div>
                        </div>
                      )}

                      {/* Standalone info */}
                      {!isKpi && (
                        <div style={{ marginBottom: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
                          <div style={{ background: "rgba(255,255,255,0.07)", borderRadius: 8, padding: "8px 14px", border: "1px solid rgba(255,255,255,0.1)" }}>
                            <p style={{ margin: "0 0 2px", fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: 600, textTransform: "uppercase" }}>Metric</p>
                            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#fcd34d" }}>{metricLabel(latest.plan_id)}</p>
                          </div>
                          <div style={{ background: "rgba(255,255,255,0.07)", borderRadius: 8, padding: "8px 14px", border: "1px solid rgba(255,255,255,0.1)" }}>
                            <p style={{ margin: "0 0 2px", fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: 600, textTransform: "uppercase" }}>Payout Rule</p>
                            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#86efac" }}>{standaloneLabel(latest.plan_id)}</p>
                          </div>
                        </div>
                      )}

                      {/* Status badge */}
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: sm.bg, color: sm.color, fontWeight: 700, padding: "5px 14px", borderRadius: 20, fontSize: 12 }}>
                        {sm.icon} {sm.label}
                      </span>

                      {/* KPI mini breakdown in hero */}
                      {isKpi && hasBreakdown && (
                        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 6 }}>
                          {kpiRows.map((row, ri) => (
                            <div key={ri} style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.05)", borderRadius: 8, padding: "7px 12px", border: "1px solid rgba(255,255,255,0.08)" }}>
                              <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.7)", flex: 1, minWidth: 120 }}>{row.kpi_name}</span>
                              <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 99, height: 5, width: 80, overflow: "hidden" }}>
                                <div style={{ width: `${row.achPct}%`, height: "100%", background: row.achColor, borderRadius: 99 }} />
                              </div>
                              <span style={{ fontSize: 12, fontWeight: 800, color: row.achColor, minWidth: 36 }}>{row.achPct}%</span>
                              <span style={{ fontSize: 11, fontWeight: 700, color: row.amt > 0 ? "#4ade80" : "rgba(255,255,255,0.3)" }}>
                                {row.amt > 0 ? `₹${row.amt.toLocaleString("en-IN")}` : "—"}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* No breakdown warning */}
                      {isKpi && !hasBreakdown && (
                        <div style={{ marginTop: 12, padding: "8px 12px", background: "rgba(251,191,36,0.1)", borderRadius: 8, border: "1px solid rgba(251,191,36,0.2)" }}>
                          <p style={{ margin: 0, fontSize: 11, color: "#fbbf24" }}>⚠ KPI breakdown pending sync — HR will update soon</p>
                        </div>
                      )}
                    </div>

                    {/* Right: Payout box */}
                    <div style={{ textAlign: "center", background: "rgba(255,255,255,0.07)", borderRadius: 18, padding: "20px 24px", border: "1px solid rgba(255,255,255,0.1)", flexShrink: 0, minWidth: 160 }}>
                      <p style={{ margin: "0 0 4px", fontSize: 10, color: "rgba(255,255,255,0.5)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.8px" }}>Total Incentive</p>
                      <p style={{ margin: 0, fontSize: 30, fontWeight: 900, color: total > 0 ? "#4ade80" : "rgba(255,255,255,0.25)", letterSpacing: "-1px" }}>
                        {total > 0 ? `₹${total.toLocaleString("en-IN")}` : "—"}
                      </p>
                      {bonus > 0 && (
                        <div style={{ marginTop: 10, borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 10 }}>
                          <p style={{ margin: "0 0 2px", fontSize: 10, color: "rgba(255,255,255,0.4)" }}>Base: ₹{base.toLocaleString("en-IN")}</p>
                          <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#fcd34d" }}>🏆 +₹{bonus.toLocaleString("en-IN")} Bonus</p>
                        </div>
                      )}
                      {latest.plan_id?.name && (
                        <p style={{ margin: "8px 0 0", fontSize: 10, color: "rgba(255,255,255,0.3)", lineHeight: 1.3 }}>{latest.plan_id.name}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* ── Summary Stats ── */}
            <div className="inc-stats" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
              {[
                { label: "Total Earned", value: `₹${summary.total.toLocaleString("en-IN")}`, color: "#6366f1", bg: "#f5f3ff", icon: <BarChart2 size={18} color="#6366f1" /> },
                { label: "Amount Paid", value: `₹${summary.paid.toLocaleString("en-IN")}`, color: "#16a34a", bg: "#f0fdf4", icon: <CheckCircle size={18} color="#16a34a" /> },
                { label: "Approved", value: summary.approved, color: "#d97706", bg: "#fffbeb", icon: <Award size={18} color="#d97706" /> },
                { label: "Pending", value: summary.pending, color: "#ea580c", bg: "#fff7ed", icon: <Clock size={18} color="#ea580c" /> },
              ].map((s, i) => (
                <div key={i} className="inc-card" style={{ background: "#fff", borderRadius: 12, padding: "14px 16px", border: "1px solid #e5e7eb", animationDelay: `${i * 0.06}s`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <p style={{ margin: "0 0 4px", fontSize: 10, color: "#9ca3af", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.label}</p>
                    <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</p>
                  </div>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>{s.icon}</div>
                </div>
              ))}
            </div>

            {/* ══════════════════════════════════════════════════════════════
                HISTORY LIST
            ══════════════════════════════════════════════════════════════ */}
            <div className="inc-card" style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", overflow: "hidden", animationDelay: "0.18s" }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #f3f4f6", display: "flex", alignItems: "center", gap: 8 }}>
                <TrendingUp size={16} color="#6366f1" />
                <p style={{ margin: 0, fontWeight: 800, fontSize: 15, color: "#1a1a2e" }}>Incentive History</p>
                <span style={{ marginLeft: "auto", fontSize: 12, color: "#9ca3af" }}>{results.length} record{results.length !== 1 ? "s" : ""}</span>
              </div>

              {results.map((r, i) => {
                const isKpi = isKpiPlan(r.plan_id);
                const sm = STATUS_META[r.status] || STATUS_META.pending;
                const score = Math.round(r.performance_score || 0);
                const total = r.calculated_amount || 0;
                const bonus = r.completion_bonus || 0;
                const base = total - bonus;
                const isExp = expanded === r._id;
                const scoreColor = score >= 90 ? "#16a34a" : score >= 75 ? "#6366f1" : score >= 60 ? "#d97706" : "#dc2626";

                // Per-KPI rows
                const { rows: kpiRows } = isKpi
                  ? calcKpiIncentive(r.plan_id, r.kpi_breakdown || [], r.salary || 0)
                  : { rows: [] };

                const hasBreakdown = kpiRows.length > 0;

                return (
                  <div key={r._id}>
                    {/* ── Row ── */}
                    <div
                      className="hist-row"
                      onClick={() => setExpanded(isExp ? null : r._id)}
                      style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 20px", borderBottom: isExp ? "none" : "1px solid #f9fafb", cursor: "pointer", background: isExp ? "#fafbff" : i % 2 === 0 ? "#fff" : "#fdfdfd", transition: "background 0.15s" }}
                    >
                      {/* Period */}
                      <div style={{ minWidth: 80 }}>
                        <span style={{ background: "#f3f4f6", padding: "3px 10px", borderRadius: 6, fontWeight: 700, fontSize: 12, color: "#374151" }}>
                          {formatPeriod(r.cycle_period)}
                        </span>
                      </div>

                      {/* Plan type */}
                      <div style={{ minWidth: 90 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: isKpi ? "#ede9fe" : "#fef9c3", color: isKpi ? "#7c3aed" : "#a16207" }}>
                          {isKpi ? "🔗 KPI" : "📋 Standalone"}
                        </span>
                      </div>

                      {/* Score / metric */}
                      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8 }}>
                        {isKpi ? (
                          <>
                            <span style={{ fontWeight: 800, fontSize: 15, color: scoreColor, minWidth: 40 }}>{score}%</span>
                            <div style={{ flex: 1, background: "#f3f4f6", borderRadius: 99, height: 6, overflow: "hidden", maxWidth: 100 }}>
                              <div style={{ width: `${score}%`, height: "100%", background: scoreColor, borderRadius: 99 }} />
                            </div>
                          </>
                        ) : (
                          <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 600 }}>{metricLabel(r.plan_id)}</span>
                        )}
                      </div>

                      {/* Bonus badge */}
                      {bonus > 0 && (
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 10px", borderRadius: 20, background: "#fef9c3", color: "#92400e" }}>
                          🏆 +₹{bonus.toLocaleString("en-IN")}
                        </span>
                      )}

                      {/* Amount */}
                      <div style={{ minWidth: 100, textAlign: "right" }}>
                        <p style={{ margin: 0, fontWeight: 800, fontSize: 16, color: total > 0 ? "#16a34a" : "#9ca3af" }}>
                          {total > 0 ? `₹${total.toLocaleString("en-IN")}` : "—"}
                        </p>
                      </div>

                      {/* Status */}
                      <div style={{ minWidth: 120 }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: sm.bg, color: sm.color, fontWeight: 700, padding: "4px 10px", borderRadius: 20, fontSize: 11 }}>
                          {sm.icon} {sm.label}
                        </span>
                      </div>

                      <div style={{ color: "#9ca3af" }}>
                        {isExp ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </div>

                    {/* ═══════════════════════════════════════════════════
                        EXPANDED DETAIL
                    ═══════════════════════════════════════════════════ */}
                    {isExp && (
                      <div style={{ padding: "20px 24px", background: "#f8fafc", borderBottom: "1px solid #f3f4f6" }}>

                        {/* ── 1. Approval Timeline ── */}
                        <div style={{ background: "#fff", borderRadius: 12, padding: "16px 20px", border: "1px solid #e5e7eb", marginBottom: 16 }}>
                          <p style={{ margin: "0 0 16px", fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>📋 Approval Status</p>
                          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "center" }}>
                            <TimelineStep done={true} active={false} label="Calculated" sublabel="By System" color="#6366f1" />
                            <TimelineLine done={r.status === "approved" || r.status === "paid"} color="#16a34a" />
                            <TimelineStep done={r.status === "approved" || r.status === "paid"} active={r.status === "pending"} label="HR Approved" sublabel={r.status === "approved" || r.status === "paid" ? "✓ Done" : "Awaiting"} color="#16a34a" />
                            <TimelineLine done={r.status === "paid"} color="#2563eb" />
                            <TimelineStep done={r.status === "paid"} active={r.status === "approved"} label="Paid" sublabel={r.status === "paid" ? "✓ Done" : "Pending"} color="#2563eb" />
                          </div>

                          {r.status === "pending" && (
                            <div style={{ marginTop: 14, padding: "10px 14px", background: "#fffbeb", borderRadius: 8, border: "1px solid #fde68a" }}>
                              <p style={{ margin: 0, fontSize: 12, color: "#92400e", fontWeight: 600 }}>⏳ Your incentive is under HR review. You'll be notified once approved.</p>
                            </div>
                          )}
                          {r.status === "approved" && (
                            <div style={{ marginTop: 14, padding: "10px 14px", background: "#f0fdf4", borderRadius: 8, border: "1px solid #86efac" }}>
                              <p style={{ margin: 0, fontSize: 12, color: "#15803d", fontWeight: 600 }}>✅ Approved! Payment will be processed in the next payroll cycle.</p>
                            </div>
                          )}
                          {r.status === "paid" && (
                            <div style={{ marginTop: 14, padding: "10px 14px", background: "#eff6ff", borderRadius: 8, border: "1px solid #bfdbfe" }}>
                              <p style={{ margin: 0, fontSize: 12, color: "#1d4ed8", fontWeight: 600 }}>💸 Paid! ₹{total.toLocaleString("en-IN")} has been credited to your account.</p>
                            </div>
                          )}
                        </div>

                        {/* ── 2. Payout Summary ── */}
                        <div style={{ background: "#fff", borderRadius: 12, padding: "16px 20px", border: "1px solid #e5e7eb", marginBottom: 16 }}>
                          <p style={{ margin: "0 0 14px", fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>💰 Payout Summary</p>
                          <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
                            <div style={{ background: "#f8fafc", borderRadius: 10, padding: "12px 18px", border: "1px solid #e5e7eb", textAlign: "center" }}>
                              <p style={{ margin: "0 0 4px", fontSize: 10, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase" }}>Base Payout</p>
                              <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: base > 0 ? "#374151" : "#9ca3af" }}>
                                {base > 0 ? `₹${base.toLocaleString("en-IN")}` : "—"}
                              </p>
                            </div>

                            {bonus > 0 && (
                              <>
                                <span style={{ fontSize: 20, color: "#d1d5db", fontWeight: 300 }}>+</span>
                                <div style={{ background: "#fef9c3", borderRadius: 10, padding: "12px 18px", border: "1px solid #fde68a", textAlign: "center" }}>
                                  <p style={{ margin: "0 0 4px", fontSize: 10, color: "#92400e", fontWeight: 700, textTransform: "uppercase" }}>🏆 All-KPI Bonus</p>
                                  <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#92400e" }}>₹{bonus.toLocaleString("en-IN")}</p>
                                  {r.completion_bonus_label && (
                                    <p style={{ margin: "2px 0 0", fontSize: 10, color: "#b45309" }}>{r.completion_bonus_label}</p>
                                  )}
                                </div>
                                <span style={{ fontSize: 20, color: "#d1d5db", fontWeight: 300 }}>=</span>
                              </>
                            )}

                            <div style={{ background: total > 0 ? "#f0fdf4" : "#f8fafc", borderRadius: 10, padding: "12px 18px", border: `1px solid ${total > 0 ? "#86efac" : "#e5e7eb"}`, textAlign: "center" }}>
                              <p style={{ margin: "0 0 4px", fontSize: 10, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase" }}>Total</p>
                              <p style={{ margin: 0, fontSize: 22, fontWeight: 900, color: total > 0 ? "#16a34a" : "#9ca3af" }}>
                                {total > 0 ? `₹${total.toLocaleString("en-IN")}` : "—"}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* ── 3. KPI Breakdown Table (only if kpi_breakdown exists) ── */}
                        {isKpi && hasBreakdown && (
                          <div style={{ background: "#fff", borderRadius: 12, padding: "16px 20px", border: "1px solid #e5e7eb", marginBottom: 16 }}>
                            <p style={{ margin: "0 0 14px", fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>🎯 KPI Achievement & Incentive</p>
                            <div style={{ overflowX: "auto" }}>
                              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                                <thead>
                                  <tr style={{ background: "#f8fafc" }}>
                                    {["KPI", "Target", "Actual", "Achievement", "Slab", "Incentive"].map(h => (
                                      <th key={h} style={{ padding: "9px 12px", textAlign: "left", fontWeight: 700, color: "#6b7280", borderBottom: "1px solid #e5e7eb", whiteSpace: "nowrap", fontSize: 11, textTransform: "uppercase" }}>{h}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {kpiRows.map((row, ri) => (
                                    row.is_admission_kpi ? (
                                      // ── Admission KPI: program-wise rows ──
                                      <>
                                        {/* Header row */}
                                        <tr key={`adm-header-${ri}`} style={{ background: "#f0f9ff", borderBottom: "1px solid #bae6fd" }}>
                                          <td colSpan={6} style={{ padding: "10px 12px" }}>
                                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                <span style={{ fontSize: 10, background: "#e0f2fe", color: "#0369a1", padding: "2px 8px", borderRadius: 99, fontWeight: 700, border: "1px solid #bae6fd" }}>🎓</span>
                                                <span style={{ fontWeight: 800, fontSize: 13, color: "#0369a1" }}>{row.kpi_name}</span>
                                                <span style={{ fontSize: 10, background: "#eef2ff", color: "#4f46e5", padding: "1px 6px", borderRadius: 10, fontWeight: 600 }}>{row.weight}%</span>
                                              </div>
                                              <span style={{ fontWeight: 800, color: row.amt > 0 ? "#16a34a" : "#9ca3af", fontSize: 14 }}>
                                                {row.amt > 0 ? `₹${row.amt.toLocaleString("en-IN")}` : "—"}
                                              </span>
                                            </div>
                                          </td>
                                        </tr>
                                        {/* Per-program rows */}
                                        {row.programDetails.map((pd, pdi) => (
                                          <tr key={`adm-${ri}-${pdi}`} style={{ borderBottom: "1px solid #f3f4f6", background: "#fafeff" }}>
                                            <td style={{ padding: "9px 12px 9px 24px", fontWeight: 600, color: "#0369a1", fontSize: 12 }}>
                                              📚 {pd.program_name}
                                            </td>
                                            <td style={{ padding: "9px 12px", color: "#6b7280", fontSize: 12 }}>{pd.target}</td>
                                            <td style={{ padding: "9px 12px", fontWeight: 700, color: pd.achColor, fontSize: 13 }}>{pd.actual}</td>
                                            <td style={{ padding: "9px 12px" }}>
                                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                <div style={{ background: "#f3f4f6", borderRadius: 99, height: 7, width: 70, overflow: "hidden" }}>
                                                  <div style={{ width: `${pd.achPct}%`, height: "100%", background: pd.achColor, borderRadius: 99 }} />
                                                </div>
                                                <span style={{ fontWeight: 800, color: pd.achColor, fontSize: 13 }}>{pd.achPct}%</span>
                                              </div>
                                            </td>
                                            <td style={{ padding: "9px 12px" }}>
                                              <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 5, fontWeight: 600, background: pd.amt > 0 ? "#eef2ff" : "#f3f4f6", color: pd.amt > 0 ? "#4f46e5" : "#9ca3af" }}>
                                                {pd.slabDesc}
                                              </span>
                                            </td>
                                            <td style={{ padding: "9px 12px", fontWeight: 800, color: pd.amt > 0 ? "#16a34a" : "#9ca3af", fontSize: 14 }}>
                                              {pd.amt > 0 ? `₹${pd.amt.toLocaleString("en-IN")}` : "—"}
                                            </td>
                                          </tr>
                                        ))}
                                        {/* Admission subtotal */}
                                        <tr style={{ background: "#e0f2fe", borderBottom: "1px solid #bae6fd" }}>
                                          <td colSpan={5} style={{ padding: "8px 12px", fontWeight: 700, color: "#0369a1", fontSize: 12 }}>
                                            🎓 {row.kpi_name} Total
                                          </td>
                                          <td style={{ padding: "8px 12px", fontWeight: 800, color: row.amt > 0 ? "#0369a1" : "#9ca3af", fontSize: 14 }}>
                                            {row.amt > 0 ? `₹${row.amt.toLocaleString("en-IN")}` : "—"}
                                          </td>
                                        </tr>
                                      </>
                                    ) : (
                                      // ── Normal KPI row ──
                                      <tr key={ri} style={{ borderBottom: "1px solid #f3f4f6" }}>
                                        <td style={{ padding: "11px 12px", fontWeight: 700, color: "#1f2937", fontSize: 13 }}>
                                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                            <Target size={13} color="#6366f1" />
                                            {row.kpi_name}
                                            <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 10, background: "#eef2ff", color: "#4f46e5", fontWeight: 600 }}>{row.weight}%</span>
                                          </div>
                                        </td>
                                        <td style={{ padding: "11px 12px", color: "#6b7280", fontSize: 12 }}>{row.target} {row.unit}</td>
                                        <td style={{ padding: "11px 12px", fontWeight: 700, color: row.achColor, fontSize: 13 }}>
                                          {row.actual != null ? `${row.actual} ${row.unit}` : "—"}
                                        </td>
                                        <td style={{ padding: "11px 12px" }}>
                                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                            <div style={{ background: "#f3f4f6", borderRadius: 99, height: 7, width: 70, overflow: "hidden" }}>
                                              <div style={{ width: `${row.achPct}%`, height: "100%", background: row.achColor, borderRadius: 99 }} />
                                            </div>
                                            <span style={{ fontWeight: 800, color: row.achColor, fontSize: 13 }}>{row.achPct}%</span>
                                          </div>
                                        </td>
                                        <td style={{ padding: "11px 12px" }}>
                                          {row.slab ? (
                                            <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 5, fontWeight: 600, background: row.amt > 0 ? "#eef2ff" : "#f3f4f6", color: row.amt > 0 ? "#4f46e5" : "#9ca3af" }}>
                                              {row.slab.min_score}–{row.slab.max_score}% · {row.slabDesc}
                                            </span>
                                          ) : (
                                            <span style={{ fontSize: 11, color: "#9ca3af" }}>No slab match</span>
                                          )}
                                        </td>
                                        <td style={{ padding: "11px 12px", fontWeight: 800, color: row.amt > 0 ? "#16a34a" : "#9ca3af", fontSize: 14 }}>
                                          {row.amt > 0 ? `₹${row.amt.toLocaleString("en-IN")}` : "—"}
                                        </td>
                                      </tr>
                                    )
                                  ))}
                                  {/* Total row */}
                                  <tr style={{ background: "#f0fdf4", borderTop: "2px solid #86efac" }}>
                                    <td colSpan={5} style={{ padding: "11px 12px", fontWeight: 700, color: "#15803d", fontSize: 13 }}>
                                      {bonus > 0 ? "KPI Base Total" : "Total Incentive"}
                                    </td>
                                    <td style={{ padding: "11px 12px", fontWeight: 900, color: "#16a34a", fontSize: 16 }}>
                                      ₹{base.toLocaleString("en-IN")}
                                    </td>
                                  </tr>
                                  {bonus > 0 && (
                                    <tr style={{ background: "#fef9c3", borderTop: "1px solid #fde68a" }}>
                                      <td colSpan={5} style={{ padding: "11px 12px", fontWeight: 700, color: "#92400e", fontSize: 13 }}>
                                        🏆 All-KPI Completion Bonus
                                      </td>
                                      <td style={{ padding: "11px 12px", fontWeight: 900, color: "#92400e", fontSize: 16 }}>
                                        +₹{bonus.toLocaleString("en-IN")}
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {/* ── 4. Slab Structure ── */}
                        {isKpi && (r.plan_id?.kpi_configs || []).length > 0 && (
                          <div style={{ background: "#fff", borderRadius: 12, padding: "16px 20px", border: "1px solid #e5e7eb", marginBottom: 16 }}>
                            <p style={{ margin: "0 0 14px", fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>📊 Slab Structure</p>
                            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                              {r.plan_id.kpi_configs.map((cfg, ci) => (
                                (cfg.slabs?.length > 0 || cfg.is_admission_kpi) && (
                                  <div key={ci}>
                                    <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 700, color: "#374151" }}>
                                      <Target size={12} color="#6366f1" style={{ marginRight: 4 }} />
                                      {cfg.kpi_name} <span style={{ color: "#9ca3af", fontWeight: 400 }}>(target: {cfg.target})</span>
                                    </p>
                                    {cfg.is_admission_kpi ? (
                                      // ── Admission KPI: program-wise slabs ──
                                      (cfg.program_slabs || []).map((ps, psi) => (
                                        <div key={psi} style={{ marginBottom: 10 }}>
                                          <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 700, color: "#0369a1" }}>
                                            📚 {ps.program_name}
                                          </p>
                                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                            {ps.slabs.map((slab, si) => {
                                              const isMatched = kpiRows
                                                .find(row => row.kpi_name === cfg.kpi_name)
                                                ?.programDetails?.find(pd => pd.program_name === ps.program_name)
                                                ?.slabDesc?.includes(`${slab.min_score}–${slab.max_score}`);
                                              return (
                                                <div key={si} style={{
                                                  padding: "6px 12px", borderRadius: 8, fontSize: 11, fontWeight: 600,
                                                  border: isMatched ? "2px solid #0369a1" : "1px solid #bae6fd",
                                                  background: isMatched ? "#e0f2fe" : "#f0f9ff",
                                                  color: isMatched ? "#0369a1" : "#374151",
                                                }}>
                                                  {slab.min_score}–{slab.max_score}%:&nbsp;
                                                  {slab.type === "none" ? "No Bonus"
                                                    : slab.type === "target_percentage" ? `${slab.value}% of Target`
                                                    : `₹${Number(slab.value).toLocaleString("en-IN")}`}
                                                  {isMatched && <span style={{ marginLeft: 4 }}>← You</span>}
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      ))
                                    ) : (
                                      // ── Normal KPI slabs ──
                                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                        {cfg.slabs.map((slab, si) => {
                                          const isMatched = kpiRows.find(row =>
                                            (row.kpi_name || "").toLowerCase().trim() === (cfg.kpi_name || "").toLowerCase().trim()
                                          )?.slab === slab;
                                          return (
                                            <div key={si} style={{
                                              padding: "6px 12px", borderRadius: 8, fontSize: 11, fontWeight: 600,
                                              border: isMatched ? "2px solid #6366f1" : "1px solid #e5e7eb",
                                              background: isMatched ? "#eef2ff" : slab.type === "none" ? "#f3f4f6" : "#fff",
                                              color: isMatched ? "#4f46e5" : slab.type === "none" ? "#9ca3af" : "#374151",
                                            }}>
                                              {slab.min_score}–{slab.max_score}%:&nbsp;
                                              {slab.type === "none" ? "No Bonus"
                                                : slab.type === "target_percentage" ? `${slab.value}% of Target`
                                                  : slab.type === "percentage" ? `${slab.value}% of Salary`
                                                    : `₹${Number(slab.value).toLocaleString("en-IN")}`}
                                              {isMatched && <span style={{ marginLeft: 4 }}>← You</span>}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                )
                              ))}
                            </div>
                          </div>
                        )}

                        {/* ── 5. All-KPI Bonus rule ── */}
                        {isKpi && r.plan_id?.completion_reward_type && r.plan_id.completion_reward_type !== "none" && (
                          <div style={{ background: bonus > 0 ? "#f0fdf4" : "#fff", borderRadius: 12, padding: "14px 18px", border: `1.5px solid ${bonus > 0 ? "#86efac" : "#e5e7eb"}` }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                              <Gift size={16} color={bonus > 0 ? "#16a34a" : "#9ca3af"} />
                              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: bonus > 0 ? "#15803d" : "#374151" }}>
                                All-KPI Bonus:{" "}
                                {r.plan_id.completion_reward_type === "fixed"
                                  ? `₹${Number(r.plan_id.completion_reward_value).toLocaleString("en-IN")}`
                                  : `${r.plan_id.completion_reward_value}% of Salary`}
                                {r.plan_id.completion_reward_label ? ` · ${r.plan_id.completion_reward_label}` : ""}
                              </p>
                              <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 20, background: bonus > 0 ? "#dcfce7" : "#f3f4f6", color: bonus > 0 ? "#16a34a" : "#9ca3af" }}>
                                {bonus > 0 ? "✅ Earned" : "Not Earned"}
                              </span>
                            </div>
                            <p style={{ margin: 0, fontSize: 11, color: "#6b7280" }}>
                              {bonus > 0 ? "🎉 You achieved ≥ 100% on all KPIs this period!" : "Achieve ≥ 100% on ALL KPIs to earn this bonus."}
                            </p>
                          </div>
                        )}

                        {/* ── Standalone detail ── */}
                        {!isKpi && (
                          <div style={{ background: "#fffbeb", borderRadius: 12, padding: "14px 18px", border: "1px solid #fde68a" }}>
                            <p style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 700, color: "#92400e", textTransform: "uppercase" }}>📋 Standalone Plan Details</p>
                            <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                              {[
                                { label: "Metric", value: metricLabel(r.plan_id) },
                                { label: "Payout Rule", value: standaloneLabel(r.plan_id) },
                                { label: "Your Payout", value: total > 0 ? `₹${total.toLocaleString("en-IN")}` : "Pending HR entry" },
                              ].map(d => (
                                <div key={d.label}>
                                  <p style={{ margin: "0 0 2px", fontSize: 10, color: "#b45309", fontWeight: 600, textTransform: "uppercase" }}>{d.label}</p>
                                  <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#92400e" }}>{d.value}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                      </div>
                    )}
                  </div>
                );
              })}

              <p style={{ textAlign: "center", padding: "12px 0", fontSize: 12, color: "#9ca3af", margin: 0, borderTop: "1px solid #f3f4f6" }}>
                {results.length} record{results.length !== 1 ? "s" : ""} · Click any row to see full details
              </p>
            </div>
          </>
        )}
      </div>
    </EmployeeLayout>
  );
}