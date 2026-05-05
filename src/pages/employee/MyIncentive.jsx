import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import EmployeeLayout from "./EmployeeLayout";
import { Sparkles, TrendingUp, Clock, CheckCircle, DollarSign, ChevronDown, ChevronUp, Award } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

// ── Safe KPI type check (handles "kpi_linked" and "kpi-linked") ───────────────
function isKpiPlan(plan) {
  if (!plan?.plan_type) return false;
  return plan.plan_type === "kpi_linked" || plan.plan_type === "kpi-linked";
}

// ── Format "2026-05" → "May 2026" ─────────────────────────────────────────────
function formatPeriod(cycleStr) {
  if (!cycleStr) return "—";
  // Already a nice label (e.g. "May 2026")
  if (!/^\d{4}-\d{2}$/.test(cycleStr)) return cycleStr;
  const [year, month] = cycleStr.split("-");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[parseInt(month, 10) - 1]} ${year}`;
}

// ── Standalone payout label ───────────────────────────────────────────────────
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

// ── Period label from plan fields ─────────────────────────────────────────────
function getPeriodLabel(plan) {
  if (!plan) return "—";
  const y = plan.period_year || "";
  switch (plan.period_type) {
    case "Monthly":     return `${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][(plan.period_month||1)-1]} ${y}`;
    case "Quarterly":   return `${plan.period_quarter || "Q1"} ${y}`;
    case "Half-Yearly": return `${plan.period_half || "H1"} ${y}`;
    case "Yearly":      return `FY ${y}`;
    default:            return y;
  }
}

const STATUS_META = {
  pending:  { label: "Pending Approval", color: "#d97706", bg: "#fffbeb", icon: <Clock size={14} /> },
  approved: { label: "Approved",         color: "#16a34a", bg: "#f0fdf4", icon: <CheckCircle size={14} /> },
  paid:     { label: "Paid ✓",           color: "#2563eb", bg: "#eff6ff", icon: <DollarSign size={14} /> },
};

export default function MyIncentive() {
  const [results,  setResults]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
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
    const total    = results.reduce((s, r) => s + (r.calculated_amount || 0), 0);
    const paid     = results.filter(r => r.status === "paid").reduce((s, r) => s + (r.calculated_amount || 0), 0);
    const pending  = results.filter(r => r.status === "pending").length;
    const approved = results.filter(r => r.status === "approved").length;
    return { total, paid, pending, approved };
  }, [results]);

  const latest = results[0] || null;

  if (loading) return (
    <EmployeeLayout>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"60vh", flexDirection:"column", gap:12, fontFamily:"'Sora',sans-serif" }}>
        <div style={{ width:36, height:36, border:"4px solid #e5e7eb", borderTopColor:"#6366f1", borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
        <p style={{ color:"#9ca3af", fontSize:14 }}>Loading your incentives...</p>
      </div>
    </EmployeeLayout>
  );

  if (error) return (
    <EmployeeLayout>
      <div style={{ textAlign:"center", padding:80, fontFamily:"'Sora',sans-serif" }}>
        <div style={{ fontSize:40, marginBottom:12 }}>⚠️</div>
        <p style={{ color:"#dc2626", fontWeight:600 }}>{error}</p>
      </div>
    </EmployeeLayout>
  );

  return (
    <EmployeeLayout>
      <div style={{ padding:"24px 20px", fontFamily:"'Sora',sans-serif", minHeight:"100vh", background:"#f4f6fb", maxWidth:900, margin:"0 auto" }}>
        <style>{`
          @keyframes spin { to { transform:rotate(360deg); } }
          @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
          .inc-card { animation: fadeUp 0.35s ease both; }
          @media (max-width:600px) {
            .inc-stats { grid-template-columns: 1fr 1fr !important; }
            .inc-hero  { flex-direction: column !important; align-items: flex-start !important; }
          }
        `}</style>

        {/* Header */}
        <div style={{ marginBottom:24 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
            <div style={{ width:38, height:38, borderRadius:10, background:"linear-gradient(135deg,#6366f1,#8b5cf6)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Sparkles size={18} color="#fff" />
            </div>
            <div>
              <h2 style={{ margin:0, fontSize:20, fontWeight:800, color:"#1a1a2e" }}>My Incentive</h2>
              <p style={{ margin:0, fontSize:12, color:"#9ca3af" }}>Performance-based incentive history & status</p>
            </div>
          </div>
        </div>

        {results.length === 0 ? (
          <div style={{ textAlign:"center", padding:"80px 20px", background:"#fff", borderRadius:16, border:"1px solid #e5e7eb" }}>
            <div style={{ fontSize:52, marginBottom:16 }}>🎯</div>
            <p style={{ fontWeight:700, fontSize:16, color:"#1a1a2e", margin:"0 0 8px" }}>No Incentive Records Yet</p>
            <p style={{ fontSize:13, color:"#9ca3af", margin:0 }}>
              Once your KPI review is completed and an incentive plan is assigned, your results will appear here.
            </p>
          </div>
        ) : (
          <>
            {/* ── Hero Card (latest record) ── */}
            {latest && (() => {
              const isKpi      = isKpiPlan(latest.plan_id);           // ← fixed
              const sm         = STATUS_META[latest.status] || STATUS_META.pending;
              const score      = Math.round(latest.performance_score || 0);
              const baseAmount = (latest.calculated_amount || 0) - (latest.completion_bonus || 0);
              const bonus      = latest.completion_bonus || 0;
              const total      = latest.calculated_amount || 0;
              const scoreColor = score >= 90 ? "#16a34a" : score >= 75 ? "#6366f1" : score >= 60 ? "#d97706" : "#dc2626";

              return (
                <div className="inc-card" style={{ background:"linear-gradient(135deg,#1a1a2e 0%,#16213e 60%,#0f3460 100%)", borderRadius:18, padding:24, marginBottom:20, color:"#fff", position:"relative", overflow:"hidden" }}>
                  <div style={{ position:"absolute", top:-40, right:-40, width:160, height:160, background:"radial-gradient(circle,rgba(99,102,241,0.35),transparent 70%)", pointerEvents:"none" }} />

                  {/* Plan type badge */}
                  <div style={{ marginBottom:14 }}>
                    <span style={{ fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:20,
                      background: isKpi ? "rgba(124,58,237,0.25)" : "rgba(217,119,6,0.25)",
                      color:      isKpi ? "#c4b5fd" : "#fcd34d",
                      border:    `1px solid ${isKpi ? "rgba(124,58,237,0.4)" : "rgba(217,119,6,0.4)"}` }}>
                      {isKpi ? "🔗 KPI-Linked" : "📋 Standalone"}
                    </span>
                  </div>

                  <div className="inc-hero" style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:16, position:"relative" }}>
                    <div style={{ flex:1 }}>
                      <p style={{ margin:"0 0 4px", fontSize:11, color:"rgba(255,255,255,0.5)", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.8px" }}>Current Period</p>
                      <p style={{ margin:"0 0 14px", fontSize:18, fontWeight:800 }}>
                        {formatPeriod(latest.cycle_period)}           {/* ← nicely formatted */}
                        <span style={{ marginLeft:10, fontSize:11, background:"rgba(255,255,255,0.1)", padding:"2px 10px", borderRadius:20, fontWeight:600 }}>
                          {latest.plan_id?.period_type || latest.cycle || "—"}
                        </span>
                      </p>

                      {/* KPI score bar */}
                      {isKpi && (
                        <div style={{ marginBottom:16 }}>
                          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                            <span style={{ fontSize:12, color:"rgba(255,255,255,0.6)" }}>Overall KPI Score</span>
                            <span style={{ fontSize:13, fontWeight:800, color:scoreColor }}>{score}%</span>
                          </div>
                          <div style={{ background:"rgba(255,255,255,0.12)", borderRadius:99, height:8, overflow:"hidden" }}>
                            <div style={{ width:`${score}%`, height:"100%", background:`linear-gradient(90deg,${scoreColor},${scoreColor}aa)`, borderRadius:99, transition:"width 0.8s cubic-bezier(.4,0,.2,1)" }} />
                          </div>
                        </div>
                      )}

                      {/* Standalone info */}
                      {!isKpi && (
                        <div style={{ marginBottom:16, display:"flex", gap:10, flexWrap:"wrap" }}>
                          <div style={{ background:"rgba(255,255,255,0.07)", borderRadius:8, padding:"8px 14px", border:"1px solid rgba(255,255,255,0.1)" }}>
                            <p style={{ margin:"0 0 2px", fontSize:10, color:"rgba(255,255,255,0.4)", fontWeight:600, textTransform:"uppercase" }}>Metric</p>
                            <p style={{ margin:0, fontSize:13, fontWeight:700, color:"#fcd34d" }}>{metricLabel(latest.plan_id)}</p>
                          </div>
                          <div style={{ background:"rgba(255,255,255,0.07)", borderRadius:8, padding:"8px 14px", border:"1px solid rgba(255,255,255,0.1)" }}>
                            <p style={{ margin:"0 0 2px", fontSize:10, color:"rgba(255,255,255,0.4)", fontWeight:600, textTransform:"uppercase" }}>Payout Rule</p>
                            <p style={{ margin:0, fontSize:13, fontWeight:700, color:"#86efac" }}>{standaloneLabel(latest.plan_id)}</p>
                          </div>
                        </div>
                      )}

                      <span style={{ display:"inline-flex", alignItems:"center", gap:6, background:sm.bg, color:sm.color, fontWeight:700, padding:"5px 14px", borderRadius:20, fontSize:12 }}>
                        {sm.icon} {sm.label}
                      </span>
                    </div>

                    {/* Payout box */}
                    <div style={{ textAlign:"center", background:"rgba(255,255,255,0.07)", borderRadius:16, padding:"18px 24px", border:"1px solid rgba(255,255,255,0.1)", flexShrink:0 }}>
                      <p style={{ margin:"0 0 4px", fontSize:10, color:"rgba(255,255,255,0.5)", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.8px" }}>Total Incentive</p>
                      <p style={{ margin:0, fontSize:28, fontWeight:900, color: total > 0 ? "#4ade80" : "rgba(255,255,255,0.3)" }}>
                        {total > 0 ? `₹${total.toLocaleString("en-IN")}` : "—"}
                      </p>
                      {bonus > 0 && (
                        <div style={{ marginTop:8, borderTop:"1px solid rgba(255,255,255,0.1)", paddingTop:8 }}>
                          <p style={{ margin:"0 0 2px", fontSize:10, color:"rgba(255,255,255,0.4)" }}>
                            Base: ₹{baseAmount.toLocaleString("en-IN")}
                          </p>
                          <p style={{ margin:0, fontSize:11, fontWeight:700, color:"#fcd34d" }}>
                            🏆 +₹{bonus.toLocaleString("en-IN")} All-KPI Bonus
                          </p>
                        </div>
                      )}
                      {latest.plan_id?.name && (
                        <p style={{ margin:"6px 0 0", fontSize:10, color:"rgba(255,255,255,0.4)" }}>{latest.plan_id.name}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Summary Stats */}
            <div className="inc-stats" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:20 }}>
              {[
                { label:"Total Earned", value:`₹${summary.total.toLocaleString("en-IN")}`, color:"#6366f1", bg:"#f5f3ff" },
                { label:"Amount Paid",  value:`₹${summary.paid.toLocaleString("en-IN")}`,  color:"#16a34a", bg:"#f0fdf4" },
                { label:"Approved",     value:summary.approved,                              color:"#d97706", bg:"#fffbeb" },
                { label:"Pending",      value:summary.pending,                               color:"#ea580c", bg:"#fff7ed" },
              ].map((s, i) => (
                <div key={i} className="inc-card" style={{ background:"#fff", borderRadius:12, padding:"14px 16px", border:"1px solid #e5e7eb", animationDelay:`${i * 0.06}s` }}>
                  <p style={{ margin:"0 0 4px", fontSize:10, color:"#9ca3af", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.05em" }}>{s.label}</p>
                  <p style={{ margin:0, fontSize:20, fontWeight:800, color:s.color }}>{s.value}</p>
                </div>
              ))}
            </div>

            {/* History List */}
            <div className="inc-card" style={{ background:"#fff", borderRadius:14, border:"1px solid #e5e7eb", overflow:"hidden", animationDelay:"0.18s" }}>
              <div style={{ padding:"16px 20px", borderBottom:"1px solid #f3f4f6", display:"flex", alignItems:"center", gap:8 }}>
                <TrendingUp size={16} color="#6366f1" />
                <p style={{ margin:0, fontWeight:800, fontSize:15, color:"#1a1a2e" }}>Incentive History</p>
              </div>

              {results.map((r, i) => {
                const isKpi      = isKpiPlan(r.plan_id);              // ← fixed
                const sm         = STATUS_META[r.status] || STATUS_META.pending;
                const score      = Math.round(r.performance_score || 0);
                const total      = r.calculated_amount || 0;
                const bonus      = r.completion_bonus || 0;
                const base       = total - bonus;
                const isExp      = expanded === r._id;
                const scoreColor = score >= 90 ? "#16a34a" : score >= 75 ? "#6366f1" : score >= 60 ? "#d97706" : "#dc2626";

                return (
                  <div key={r._id}>
                    {/* Row */}
                    <div
                      onClick={() => setExpanded(isExp ? null : r._id)}
                      style={{ display:"flex", alignItems:"center", gap:16, padding:"14px 20px", borderBottom:"1px solid #f9fafb", cursor:"pointer", background: isExp ? "#fafafa" : i%2===0 ? "#fff" : "#fdfdfd", transition:"background 0.15s" }}
                    >
                      {/* Period */}
                      <div style={{ minWidth:90 }}>
                        <span style={{ background:"#f3f4f6", padding:"3px 10px", borderRadius:6, fontWeight:700, fontSize:12, color:"#374151" }}>
                          {formatPeriod(r.cycle_period)}               {/* ← nicely formatted */}
                        </span>
                      </div>

                      {/* Plan type badge */}
                      <div style={{ minWidth:90 }}>
                        <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:20,
                          background: isKpi ? "#ede9fe" : "#fef9c3",
                          color:      isKpi ? "#7c3aed" : "#a16207" }}>
                          {isKpi ? "🔗 KPI" : "📋 Standalone"}
                        </span>
                      </div>

                      {/* Score / metric */}
                      <div style={{ flex:1, display:"flex", alignItems:"center", gap:8 }}>
                        {isKpi ? (
                          <>
                            <span style={{ fontWeight:800, fontSize:15, color:scoreColor, minWidth:36 }}>{score}%</span>
                            <div style={{ flex:1, background:"#f3f4f6", borderRadius:99, height:6, overflow:"hidden", maxWidth:120 }}>
                              <div style={{ width:`${score}%`, height:"100%", background:scoreColor, borderRadius:99 }} />
                            </div>
                          </>
                        ) : (
                          <span style={{ fontSize:12, color:"#6b7280", fontWeight:600 }}>{metricLabel(r.plan_id)}</span>
                        )}
                      </div>

                      {/* Bonus badge */}
                      {bonus > 0 && (
                        <div style={{ minWidth:80 }}>
                          <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:20, background:"#fef9c3", color:"#92400e" }}>
                            🏆 +₹{bonus.toLocaleString("en-IN")}
                          </span>
                        </div>
                      )}

                      {/* Amount */}
                      <div style={{ minWidth:100, textAlign:"right" }}>
                        <p style={{ margin:0, fontWeight:800, fontSize:16, color: total > 0 ? "#16a34a" : "#9ca3af" }}>
                          {total > 0 ? `₹${total.toLocaleString("en-IN")}` : "—"}
                        </p>
                      </div>

                      {/* Status */}
                      <div style={{ minWidth:110 }}>
                        <span style={{ display:"inline-flex", alignItems:"center", gap:5, background:sm.bg, color:sm.color, fontWeight:700, padding:"4px 10px", borderRadius:20, fontSize:11 }}>
                          {sm.icon} {sm.label}
                        </span>
                      </div>

                      <div style={{ color:"#9ca3af" }}>
                        {isExp ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </div>

                    {/* ── Expanded Detail ── */}
                    {isExp && (
                      <div style={{ padding:"16px 24px", background:"#f8fafc", borderBottom:"1px solid #f3f4f6" }}>

                        {/* Basic info grid */}
                        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))", gap:12, marginBottom:14 }}>
                          {[
                            { label:"Plan Name",  value: r.plan_id?.name || "—" },
                            { label:"Plan Type",  value: isKpi ? "KPI-Linked" : "Standalone" },
                            { label:"Period",     value: formatPeriod(r.cycle_period) },  
                            { label:"Cycle",      value: r.plan_id?.period_type || r.cycle || "—" },
                            { label:"Department", value: r.employee_id?.department || "—" },
                            { label:"Updated",    value: r.updatedAt ? new Date(r.updatedAt).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" }) : "—" },
                          ].map(d => (
                            <div key={d.label} style={{ background:"#fff", borderRadius:10, padding:"10px 14px", border:"1px solid #e5e7eb" }}>
                              <p style={{ margin:"0 0 3px", fontSize:10, color:"#9ca3af", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.05em" }}>{d.label}</p>
                              <p style={{ margin:0, fontSize:13, fontWeight:700, color:"#1a1a2e" }}>{d.value}</p>
                            </div>
                          ))}
                        </div>

                        {/* ── KPI-Linked: per-KPI breakdown ── */}
                        {isKpi && (
                          <>
                            {/* Payout breakdown */}
                            <div style={{ background:"#fff", borderRadius:10, padding:"14px 16px", border:"1px solid #e5e7eb", marginBottom:12 }}>
                              <p style={{ margin:"0 0 10px", fontSize:11, fontWeight:700, color:"#6b7280", textTransform:"uppercase" }}>💰 Payout Breakdown</p>
                              <div style={{ display:"flex", gap:16, flexWrap:"wrap", alignItems:"center" }}>
                                <div>
                                  <p style={{ margin:"0 0 2px", fontSize:10, color:"#9ca3af", fontWeight:600, textTransform:"uppercase" }}>Base Payout</p>
                                  <p style={{ margin:0, fontSize:16, fontWeight:800, color: base > 0 ? "#16a34a" : "#9ca3af" }}>
                                    {base > 0 ? `₹${base.toLocaleString("en-IN")}` : "—"}
                                  </p>
                                </div>
                                {bonus > 0 && (
                                  <>
                                    <div style={{ fontSize:18, color:"#d1d5db" }}>+</div>
                                    <div style={{ background:"#fef9c3", borderRadius:8, padding:"8px 14px", border:"1px solid #fde68a" }}>
                                      <p style={{ margin:"0 0 2px", fontSize:10, color:"#92400e", fontWeight:700, textTransform:"uppercase" }}>🏆 All-KPI Bonus</p>
                                      <p style={{ margin:0, fontSize:16, fontWeight:800, color:"#92400e" }}>₹{bonus.toLocaleString("en-IN")}</p>
                                      {r.completion_bonus_label && (
                                        <p style={{ margin:"2px 0 0", fontSize:10, color:"#b45309" }}>{r.completion_bonus_label}</p>
                                      )}
                                    </div>
                                    <div style={{ fontSize:18, color:"#d1d5db" }}>=</div>
                                    <div>
                                      <p style={{ margin:"0 0 2px", fontSize:10, color:"#9ca3af", fontWeight:600, textTransform:"uppercase" }}>Total</p>
                                      <p style={{ margin:0, fontSize:20, fontWeight:900, color:"#16a34a" }}>₹{total.toLocaleString("en-IN")}</p>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Per-KPI config table */}
                            {(r.plan_id?.kpi_configs || []).length > 0 && (
                              <div style={{ background:"#fff", borderRadius:10, padding:"14px 16px", border:"1px solid #e5e7eb", marginBottom:12 }}>
                                <p style={{ margin:"0 0 12px", fontSize:11, fontWeight:700, color:"#6b7280", textTransform:"uppercase" }}>🎯 KPI Targets in This Plan</p>
                                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                                  {(r.plan_id.kpi_configs).map((cfg, ci) => (
                                    <div key={ci} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 14px", borderRadius:8, background:"#f8fafc", border:"1px solid #e5e7eb" }}>
                                      <div>
                                        <p style={{ margin:"0 0 2px", fontSize:13, fontWeight:700, color:"#1a1a2e" }}>{cfg.kpi_name}</p>
                                        <p style={{ margin:0, fontSize:11, color:"#6b7280" }}>
                                          Target: <strong>{cfg.target}</strong> {cfg.value_type} &nbsp;·&nbsp; Rule: {cfg.rule_label || "—"}
                                        </p>
                                      </div>
                                      <div style={{ textAlign:"right" }}>
                                        <span style={{ fontSize:11, fontWeight:700, padding:"2px 10px", borderRadius:20, background:"#eef2ff", color:"#4f46e5" }}>
                                          Weight: {cfg.weight}%
                                        </span>
                                        {cfg.slabs?.length > 0 && (
                                          <div style={{ marginTop:6, display:"flex", gap:6, flexWrap:"wrap", justifyContent:"flex-end" }}>
                                            {cfg.slabs.map((slab, si) => (
                                              <span key={si} style={{ fontSize:10, padding:"1px 8px", borderRadius:5, fontWeight:600,
                                                background: slab.type === "none" ? "#f3f4f6" : slab.type === "percentage" ? "#f0fdf4" : "#fffbeb",
                                                color:      slab.type === "none" ? "#9ca3af" : slab.type === "percentage" ? "#16a34a" : "#d97706" }}>
                                                {slab.min_score}–{slab.max_score}%:&nbsp;
                                                {slab.type === "none" ? "No bonus" : slab.type === "percentage" ? `+${slab.value}% salary` : `₹${Number(slab.value).toLocaleString("en-IN")}`}
                                              </span>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Completion reward rule */}
                            {r.plan_id?.completion_reward_type && r.plan_id.completion_reward_type !== "none" && (
                              <div style={{ background: bonus > 0 ? "#f0fdf4" : "#fff", borderRadius:10, padding:"12px 16px", border:`1.5px solid ${bonus > 0 ? "#86efac" : "#e5e7eb"}` }}>
                                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                                  <Award size={16} color={bonus > 0 ? "#16a34a" : "#9ca3af"} />
                                  <p style={{ margin:0, fontSize:12, fontWeight:700, color: bonus > 0 ? "#15803d" : "#6b7280" }}>
                                    All-KPI Completion Bonus:{" "}
                                    {r.plan_id.completion_reward_type === "fixed"
                                      ? `₹${Number(r.plan_id.completion_reward_value).toLocaleString("en-IN")}`
                                      : `${r.plan_id.completion_reward_value}% of Salary`}
                                    {r.plan_id.completion_reward_label ? ` · ${r.plan_id.completion_reward_label}` : ""}
                                  </p>
                                  <span style={{ marginLeft:"auto", fontSize:11, fontWeight:700, padding:"2px 10px", borderRadius:20,
                                    background: bonus > 0 ? "#dcfce7" : "#f3f4f6",
                                    color:      bonus > 0 ? "#16a34a" : "#9ca3af" }}>
                                    {bonus > 0 ? "✅ Earned" : "Not Earned"}
                                  </span>
                                </div>
                                <p style={{ margin:"6px 0 0 24px", fontSize:11, color:"#6b7280" }}>
                                  {bonus > 0
                                    ? "You achieved ≥ 100% on all KPIs this period 🎉"
                                    : "Achieve ≥ 100% on ALL KPIs in the plan to earn this bonus."}
                                </p>
                              </div>
                            )}
                          </>
                        )}

                        {/* ── Standalone detail ── */}
                        {!isKpi && (
                          <div style={{ background:"#fffbeb", borderRadius:10, padding:"14px 16px", border:"1px solid #fde68a" }}>
                            <p style={{ margin:"0 0 10px", fontSize:11, fontWeight:700, color:"#92400e", textTransform:"uppercase" }}>📋 Standalone Plan Details</p>
                            <div style={{ display:"flex", gap:16, flexWrap:"wrap" }}>
                              <div>
                                <p style={{ margin:"0 0 2px", fontSize:10, color:"#b45309", fontWeight:600, textTransform:"uppercase" }}>Metric Used</p>
                                <p style={{ margin:0, fontSize:14, fontWeight:800, color:"#92400e" }}>{metricLabel(r.plan_id)}</p>
                              </div>
                              <div>
                                <p style={{ margin:"0 0 2px", fontSize:10, color:"#b45309", fontWeight:600, textTransform:"uppercase" }}>Payout Rule</p>
                                <p style={{ margin:0, fontSize:14, fontWeight:800, color:"#92400e" }}>{standaloneLabel(r.plan_id)}</p>
                              </div>
                              <div>
                                <p style={{ margin:"0 0 2px", fontSize:10, color:"#b45309", fontWeight:600, textTransform:"uppercase" }}>Your Payout</p>
                                <p style={{ margin:0, fontSize:14, fontWeight:800, color: total > 0 ? "#16a34a" : "#9ca3af" }}>
                                  {total > 0 ? `₹${total.toLocaleString("en-IN")}` : "Pending HR entry"}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                      </div>
                    )}
                  </div>
                );
              })}

              <p style={{ textAlign:"center", padding:"12px 0", fontSize:12, color:"#9ca3af", margin:0, borderTop:"1px solid #f3f4f6" }}>
                {results.length} record{results.length !== 1 ? "s" : ""} found
              </p>
            </div>
          </>
        )}
      </div>
    </EmployeeLayout>
  );
}