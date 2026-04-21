import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import EmployeeLayout from "./EmployeeLayout";
import { Sparkles, TrendingUp, Clock, CheckCircle, DollarSign, ChevronDown, ChevronUp } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

function calcIncentive(plan, finalScore, salary = 0) {
  if (!plan) return { amount: 0, slabLabel: "No Plan Assigned" };
  const score = Math.round(finalScore || 0);
  const slab  = (plan.slabs || []).find(s => score >= s.min_score && score <= s.max_score);
  if (!slab || slab.type === "none") return { amount: 0, slabLabel: `${score}% → No Bonus` };
  const amount = slab.type === "percentage"
    ? Math.round((slab.value / 100) * salary)
    : slab.value;
  return {
    amount,
    slabLabel: `${score}% → ${slab.type === "percentage"
      ? `${slab.value}% of salary`
      : `₹${Number(slab.value).toLocaleString("en-IN")}`}`,
  };
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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", flexDirection: "column", gap: 12, fontFamily: "'Sora',sans-serif" }}>
        <div style={{ width: 36, height: 36, border: "4px solid #e5e7eb", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
        <p style={{ color: "#9ca3af", fontSize: 14 }}>Loading your incentives...</p>
      </div>
    </EmployeeLayout>
  );

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
      <div style={{ padding: "24px 20px", fontFamily: "'Sora',sans-serif", minHeight: "100vh", background: "#f4f6fb", maxWidth: 900, margin: "0 auto" }}>
        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes fadeUp {
            from { opacity: 0; transform: translateY(16px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          .inc-card { animation: fadeUp 0.35s ease both; }
          @media (max-width: 600px) {
            .inc-stats { grid-template-columns: 1fr 1fr !important; }
            .inc-hero  { flex-direction: column !important; align-items: flex-start !important; }
          }
        `}</style>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Sparkles size={18} color="#fff" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#1a1a2e" }}>My Incentive</h2>
              <p style={{ margin: 0, fontSize: 12, color: "#9ca3af" }}>Performance-based incentive history & status</p>
            </div>
          </div>
        </div>

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
            {/* Hero Card */}
            {latest && (() => {
              const sm     = STATUS_META[latest.status] || STATUS_META.pending;
              const score  = Math.round(latest.performance_score || 0);
              const amount = latest.calculated_amount || 0;
              const scoreColor = score >= 90 ? "#16a34a" : score >= 75 ? "#6366f1" : score >= 60 ? "#d97706" : "#dc2626";
              return (
                <div className="inc-card" style={{ background: "linear-gradient(135deg,#1a1a2e 0%,#16213e 60%,#0f3460 100%)", borderRadius: 18, padding: "24px", marginBottom: 20, color: "#fff", position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", top: -40, right: -40, width: 160, height: 160, background: "radial-gradient(circle,rgba(99,102,241,0.35),transparent 70%)", pointerEvents: "none" }} />
                  <div className="inc-hero" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, position: "relative" }}>
                    <div>
                      <p style={{ margin: "0 0 4px", fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.8px" }}>Current Period</p>
                      <p style={{ margin: "0 0 12px", fontSize: 18, fontWeight: 800 }}>
                        {latest.cycle_period || "—"}
                        <span style={{ marginLeft: 10, fontSize: 11, background: "rgba(255,255,255,0.1)", padding: "2px 10px", borderRadius: 20, fontWeight: 600 }}>
                          {latest.plan_id?.cycle || latest.cycle || "—"}
                        </span>
                      </p>
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>KPI Score</span>
                          <span style={{ fontSize: 13, fontWeight: 800, color: scoreColor }}>{score}%</span>
                        </div>
                        <div style={{ background: "rgba(255,255,255,0.12)", borderRadius: 99, height: 8, overflow: "hidden" }}>
                          <div style={{ width: `${score}%`, height: "100%", background: `linear-gradient(90deg,${scoreColor},${scoreColor}aa)`, borderRadius: 99, transition: "width 0.8s cubic-bezier(.4,0,.2,1)" }} />
                        </div>
                      </div>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: sm.bg, color: sm.color, fontWeight: 700, padding: "5px 14px", borderRadius: 20, fontSize: 12 }}>
                        {sm.icon} {sm.label}
                      </span>
                    </div>
                    <div style={{ textAlign: "center", background: "rgba(255,255,255,0.07)", borderRadius: 16, padding: "18px 24px", border: "1px solid rgba(255,255,255,0.1)", flexShrink: 0 }}>
                      <p style={{ margin: "0 0 4px", fontSize: 10, color: "rgba(255,255,255,0.5)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.8px" }}>Incentive</p>
                      <p style={{ margin: 0, fontSize: 28, fontWeight: 900, color: amount > 0 ? "#4ade80" : "rgba(255,255,255,0.3)" }}>
                        {amount > 0 ? `₹${amount.toLocaleString("en-IN")}` : "—"}
                      </p>
                      {latest.plan_id?.name && (
                        <p style={{ margin: "6px 0 0", fontSize: 10, color: "rgba(255,255,255,0.4)" }}>{latest.plan_id.name}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Summary Stats */}
            <div className="inc-stats" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
              {[
                { label: "Total Earned", value: `₹${summary.total.toLocaleString("en-IN")}`, color: "#6366f1", bg: "#f5f3ff" },
                { label: "Amount Paid",  value: `₹${summary.paid.toLocaleString("en-IN")}`,  color: "#16a34a", bg: "#f0fdf4" },
                { label: "Approved",     value: summary.approved,                              color: "#d97706", bg: "#fffbeb" },
                { label: "Pending",      value: summary.pending,                               color: "#ea580c", bg: "#fff7ed" },
              ].map((s, i) => (
                <div key={i} className="inc-card" style={{ background: "#fff", borderRadius: 12, padding: "14px 16px", border: "1px solid #e5e7eb", animationDelay: `${i * 0.06}s` }}>
                  <p style={{ margin: "0 0 4px", fontSize: 10, color: "#9ca3af", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.label}</p>
                  <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</p>
                </div>
              ))}
            </div>

            {/* History Table */}
            <div className="inc-card" style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", overflow: "hidden", animationDelay: "0.18s" }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #f3f4f6", display: "flex", alignItems: "center", gap: 8 }}>
                <TrendingUp size={16} color="#6366f1" />
                <p style={{ margin: 0, fontWeight: 800, fontSize: 15, color: "#1a1a2e" }}>Incentive History</p>
              </div>

              {results.map((r, i) => {
                const sm         = STATUS_META[r.status] || STATUS_META.pending;
                const score      = Math.round(r.performance_score || 0);
                const amount     = r.calculated_amount || 0;
                const isExp      = expanded === r._id;
                const scoreColor = score >= 90 ? "#16a34a" : score >= 75 ? "#6366f1" : score >= 60 ? "#d97706" : "#dc2626";

                return (
                  <div key={r._id}>
                    <div
                      onClick={() => setExpanded(isExp ? null : r._id)}
                      style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 20px", borderBottom: "1px solid #f9fafb", cursor: "pointer", background: isExp ? "#fafafa" : i % 2 === 0 ? "#fff" : "#fdfdfd", transition: "background 0.15s" }}
                    >
                      <div style={{ minWidth: 90 }}>
                        <span style={{ background: "#f3f4f6", padding: "3px 10px", borderRadius: 6, fontWeight: 700, fontSize: 12, color: "#374151" }}>
                          {r.cycle_period || "—"}
                        </span>
                      </div>
                      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontWeight: 800, fontSize: 15, color: scoreColor, minWidth: 36 }}>{score}%</span>
                        <div style={{ flex: 1, background: "#f3f4f6", borderRadius: 99, height: 6, overflow: "hidden", maxWidth: 120 }}>
                          <div style={{ width: `${score}%`, height: "100%", background: scoreColor, borderRadius: 99 }} />
                        </div>
                      </div>
                      <div style={{ minWidth: 100, textAlign: "right" }}>
                        <p style={{ margin: 0, fontWeight: 800, fontSize: 16, color: amount > 0 ? "#16a34a" : "#9ca3af" }}>
                          {amount > 0 ? `₹${amount.toLocaleString("en-IN")}` : "—"}
                        </p>
                      </div>
                      <div style={{ minWidth: 110 }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: sm.bg, color: sm.color, fontWeight: 700, padding: "4px 10px", borderRadius: 20, fontSize: 11 }}>
                          {sm.icon} {sm.label}
                        </span>
                      </div>
                      <div style={{ color: "#9ca3af" }}>
                        {isExp ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </div>

                    {isExp && (
                      <div style={{ padding: "16px 24px", background: "#f8fafc", borderBottom: "1px solid #f3f4f6" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 14 }}>
                          {[
                            { label: "Plan Name",  value: r.plan_id?.name || "—" },
                            { label: "Department", value: r.employee_id?.department || "—" },
                            { label: "Cycle",      value: r.plan_id?.cycle || r.cycle || "—" },
                            { label: "Slab Match", value: calcIncentive(r.plan_id, r.performance_score, r.salary).slabLabel },
                            { label: "Period",     value: r.cycle_period || "—" },
                            { label: "Updated",    value: r.updatedAt ? new Date(r.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—" },
                          ].map(d => (
                            <div key={d.label} style={{ background: "#fff", borderRadius: 10, padding: "10px 14px", border: "1px solid #e5e7eb" }}>
                              <p style={{ margin: "0 0 3px", fontSize: 10, color: "#9ca3af", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{d.label}</p>
                              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#1a1a2e" }}>{d.value}</p>
                            </div>
                          ))}
                        </div>

                        {r.plan_id?.slabs && (
                          <div style={{ marginTop: 14, background: "#fff", borderRadius: 10, padding: "12px 16px", border: "1px solid #e5e7eb" }}>
                            <p style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                              Your Plan Slabs
                            </p>
                            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                              {r.plan_id.slabs.map((slab, si) => {
                                const isMatch = score >= slab.min_score && score <= slab.max_score;
                                const sc = slab.type === "none" ? "#9ca3af" : slab.type === "percentage" ? "#16a34a" : "#d97706";
                                return (
                                  <div key={si} style={{ padding: "6px 12px", borderRadius: 8, border: `1.5px solid ${isMatch ? sc : "#e5e7eb"}`, background: isMatch ? `${sc}11` : "#fafafa" }}>
                                    <p style={{ margin: "0 0 2px", fontSize: 11, color: "#6b7280", fontWeight: 600 }}>
                                      {slab.min_score}% – {slab.max_score}%
                                    </p>
                                    <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: sc }}>
                                      {slab.type === "none" ? "No Bonus" : slab.type === "percentage" ? `+${slab.value}% salary` : `₹${Number(slab.value).toLocaleString("en-IN")}`}
                                    </p>
                                    {isMatch && <p style={{ margin: "2px 0 0", fontSize: 9, color: sc, fontWeight: 700 }}>✓ YOUR SLAB</p>}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              <p style={{ textAlign: "center", padding: "12px 0", fontSize: 12, color: "#9ca3af", margin: 0, borderTop: "1px solid #f3f4f6" }}>
                {results.length} record{results.length !== 1 ? "s" : ""} found
              </p>
            </div>
          </>
        )}
      </div>
    </EmployeeLayout>
  );
}