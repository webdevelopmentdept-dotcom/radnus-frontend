import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import EmployeeLayout from "./EmployeeLayout";
import {
  Sparkles, TrendingUp, Clock, CheckCircle, DollarSign,
  ChevronDown, ChevronUp, Award, Target, BarChart2, Gift,
  ArrowRight, Wallet, CalendarDays, BadgeCheck, Hourglass
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

function isKpiPlan(plan) {
  if (!plan) return false;
  if (typeof plan === "string") return false;
  const pt = (plan.plan_type || "").toLowerCase().trim();
  return pt === "kpi_linked" || pt === "kpi-linked" || pt === "kpi";
}

function formatPeriod(cycleStr) {
  if (!cycleStr) return "—";
  if (!/^\d{4}-\d{2}$/.test(cycleStr)) return cycleStr;
  const [year, month] = cycleStr.split("-");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
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

function calcKpiIncentive(plan, kpiBreakdown = [], salary = 0) {
  const normalize = (s) => (s || "").toLowerCase().trim();
  const kpiConfigs = plan?.kpi_configs || [];
  if (!kpiConfigs.length) return { rows: [], total: 0 };
  let total = 0;
  const rows = kpiConfigs.map(cfg => {
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
        const achPct = programTarget > 0 ? Math.min(Math.round((Number(actualAdmissions) / programTarget) * 100), 100) : 0;
        const progSlabEntry = programSlabs.find(ps => ps.program_id === pt.program_id);
        const slabs = progSlabEntry?.slabs || [];
        const slab = slabs.find(s => achPct >= s.min_score && achPct <= s.max_score);
        let amt = 0; let slabDesc = "No Slab";
        if (slab && slab.type !== "none" && slab.value > 0) {
          if (slab.type === "target_percentage") amt = Math.round((slab.value / 100) * programTarget);
          else if (slab.type === "percentage") amt = Math.round((slab.value / 100) * salary);
          else amt = slab.value;
          slabDesc = `${slab.min_score}–${slab.max_score}% → ₹${amt.toLocaleString("en-IN")}`;
        } else if (slab) slabDesc = `${slab.min_score}–${slab.max_score}% → No Bonus`;
        admissionTotal += amt;
        const achColor = achPct >= 90 ? "#16a34a" : achPct >= 70 ? "#6366f1" : achPct >= 50 ? "#d97706" : "#dc2626";
        programDetails.push({ program_name: pt.program_name, target: programTarget, actual: actualAdmissions, achPct, achColor, slabDesc, amt });
      });
      total += admissionTotal;
      return { kpi_name: cfg.kpi_name, weight: cfg.weight, is_admission_kpi: true, programDetails, amt: admissionTotal };
    }
    const kpiData = kpiBreakdown.find(k => normalize(k.kpi_name) === normalize(cfg.kpi_name));
    let achPct = 0;
    if (kpiData) {
      if (kpiData.target && Number(kpiData.target) > 0 && kpiData.actual_value != null)
        achPct = Math.min(Math.round((Number(kpiData.actual_value) / Number(kpiData.target)) * 100), 100);
      else if (kpiData.pct_achieved != null) achPct = Math.round(kpiData.pct_achieved);
      else achPct = Math.round(kpiData.actual_value || 0);
    }
    const slab = (cfg.slabs || []).find(s => achPct >= s.min_score && achPct <= s.max_score);
    let amt = 0; let slabDesc = "No Bonus";
    if (slab && slab.type !== "none" && slab.value > 0) {
      if (slab.type === "target_percentage") { amt = Math.round((slab.value / 100) * Number(cfg.target)); slabDesc = `${slab.value}% of Target`; }
      else if (slab.type === "percentage") { amt = Math.round((slab.value / 100) * salary); slabDesc = `${slab.value}% of Salary`; }
      else { amt = slab.value; slabDesc = `₹${Number(slab.value).toLocaleString("en-IN")} Fixed`; }
      total += amt;
    }
    const achColor = achPct >= 90 ? "#16a34a" : achPct >= 70 ? "#6366f1" : achPct >= 50 ? "#d97706" : "#dc2626";
    return { kpi_name: cfg.kpi_name, weight: cfg.weight, is_admission_kpi: false, target: kpiData?.target ?? cfg.target, actual: kpiData?.actual_value, unit: kpiData?.unit || "", achPct, achColor, slabs: cfg.slabs || [], slab, slabDesc, amt };
  });
  return { rows, total };
}

// ── SubmitReviewBox ───────────────────────────────────────────────────────────
function SubmitReviewBox({ alreadyRequested, submittedValue, reviewNote, reviewRemark, onSubmit, slabs }) {
  const [val, setVal] = useState("");
  const [note, setNote] = useState("");
  const [selectedSlab, setSelectedSlab] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const isValid = val && note.trim() && (slabs.length === 0 || selectedSlab !== null);

  const handleClick = async () => {
    if (!isValid) return;
    setSubmitting(true);
    await onSubmit(val, note, selectedSlab);
    setSubmitting(false);
  };

  if (alreadyRequested) {
    return (
      <div style={{ background: "#f0fdf4", borderRadius: 12, padding: "14px 18px", border: "1px solid #86efac" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20 }}>⏳</span>
          <div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: "#15803d" }}>Review Requested — Waiting for HR</p>
            <p style={{ margin: "2px 0 0", fontSize: 11, color: "#6b7280" }}>
              Submitted value: <strong>{Number(submittedValue || 0).toLocaleString("en-IN")}</strong>
              {reviewNote ? ` · Note: ${reviewNote}` : ""}
            </p>
            {reviewRemark && <p style={{ margin: "4px 0 0", fontSize: 11, color: "#dc2626", fontWeight: 600 }}>HR Remark: {reviewRemark}</p>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "#f8fafc", borderRadius: 12, padding: "16px 20px", border: "1px solid #e5e7eb" }}>
      <p style={{ margin: "0 0 14px", fontWeight: 700, fontSize: 13, color: "#374151" }}>🎯 Achieved your target? Submit to HR for review</p>
      {slabs.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 700, color: "#6b7280" }}>Which slab did you achieve? <span style={{ color: "#dc2626" }}>*</span></p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {slabs.map((slab, si) => {
              const isSelected = selectedSlab === si;
              const rangeLabel = slab.max_target === 0 ? `${Number(slab.min_target).toLocaleString("en-IN")} → ∞` : `${Number(slab.min_target).toLocaleString("en-IN")} → ${Number(slab.max_target).toLocaleString("en-IN")}`;
              const payoutLabel = slab.payout_type === "fixed" ? `₹${Number(slab.payout_value).toLocaleString("en-IN")}` : `${slab.payout_value}%`;
              return (
                <button key={si} onClick={() => setSelectedSlab(isSelected ? null : si)} style={{ padding: "8px 14px", borderRadius: 10, border: isSelected ? "2px solid #6366f1" : "1.5px solid #e5e7eb", background: isSelected ? "#eef2ff" : "#fff", color: isSelected ? "#4f46e5" : "#374151", fontWeight: isSelected ? 800 : 600, fontSize: 12, cursor: "pointer", transition: "all 0.15s", textAlign: "left" }}>
                  <span style={{ display: "block", fontSize: 11, color: isSelected ? "#6366f1" : "#9ca3af", marginBottom: 2 }}>{rangeLabel}</span>
                  <span style={{ fontSize: 13 }}>{payoutLabel}</span>
                  {isSelected && <span style={{ marginLeft: 6, fontSize: 11 }}>✓</span>}
                </button>
              );
            })}
          </div>
          {selectedSlab === null && <p style={{ margin: "6px 0 0", fontSize: 11, color: "#dc2626" }}>* Please select a slab</p>}
        </div>
      )}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
        <div style={{ flex: 1, minWidth: 130 }}>
          <p style={{ margin: "0 0 5px", fontSize: 11, fontWeight: 600, color: "#6b7280" }}>Achieved Value <span style={{ color: "#dc2626" }}>*</span></p>
          <input type="number" value={val} onChange={e => setVal(e.target.value)} placeholder="e.g. 150000" style={{ width: "100%", padding: "8px 12px", border: `1.5px solid ${!val ? "#fca5a5" : "#e5e7eb"}`, borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
        </div>
        <div style={{ flex: 2, minWidth: 160 }}>
          <p style={{ margin: "0 0 5px", fontSize: 11, fontWeight: 600, color: "#6b7280" }}>Note <span style={{ color: "#dc2626" }}>*</span></p>
          <input value={note} onChange={e => setNote(e.target.value)} placeholder="Supporting info..." style={{ width: "100%", padding: "8px 12px", border: `1.5px solid ${!note.trim() ? "#fca5a5" : "#e5e7eb"}`, borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
        </div>
        <button onClick={handleClick} disabled={!isValid || submitting} style={{ padding: "8px 20px", background: !isValid || submitting ? "#a5b4fc" : "#6366f1", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: !isValid || submitting ? "not-allowed" : "pointer", whiteSpace: "nowrap" }}>
          {submitting ? "Sending..." : "Submit to HR"}
        </button>
      </div>
    </div>
  );
}

// ── Expanded Detail Panel ─────────────────────────────────────────────────────
function ExpandedDetail({ r, fetchMyIncentives }) {
  const isKpi = isKpiPlan(r.plan_id);
  const total = r.calculated_amount || 0;
  const bonus = r.completion_bonus || 0;
  const base = total - bonus;
  const { rows: kpiRows } = isKpi ? calcKpiIncentive(r.plan_id, r.kpi_breakdown || [], r.salary || 0) : { rows: [] };
  const hasBreakdown = kpiRows.length > 0;

  const steps = [
    { label: "Calculated", sub: "System", done: true, color: "#6366f1" },
    { label: "HR Approved", sub: r.status === "approved" || r.status === "paid" ? "Done" : "Awaiting", done: r.status === "approved" || r.status === "paid", active: r.status === "pending", color: "#16a34a" },
    { label: "Paid", sub: r.status === "paid" ? "Done" : "Pending", done: r.status === "paid", active: r.status === "approved", color: "#2563eb" },
  ];

  return (
    <div style={{ padding: "0 12px 16px", background: "#f8fafc" }}>
      {/* Timeline */}
      <div style={{ background: "#fff", borderRadius: 12, padding: "14px 16px", border: "1px solid #eee", marginBottom: 10 }}>
        <p style={{ margin: "0 0 14px", fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em" }}>Approval Progress</p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0 }}>
          {steps.map((s, i) => (
            <>
              <div key={s.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 60 }}>
                <div style={{ width: 30, height: 30, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: s.done ? s.color : s.active ? `${s.color}18` : "#f3f4f6", border: `2px solid ${s.done || s.active ? s.color : "#e5e7eb"}` }}>
                  {s.done ? <CheckCircle size={14} color="#fff" /> : <div style={{ width: 7, height: 7, borderRadius: "50%", background: s.active ? s.color : "#d1d5db" }} />}
                </div>
                <p style={{ margin: "4px 0 0", fontSize: 10, fontWeight: 700, color: s.done || s.active ? s.color : "#9ca3af", textAlign: "center" }}>{s.label}</p>
                <p style={{ margin: "1px 0 0", fontSize: 9, color: "#9ca3af", textAlign: "center" }}>{s.sub}</p>
              </div>
              {i < steps.length - 1 && <div key={`line-${i}`} style={{ flex: 1, height: 2, background: steps[i + 1].done ? steps[i + 1].color : "#e5e7eb", marginBottom: 24 }} />}
            </>
          ))}
        </div>
        {r.status === "pending" && <div style={{ marginTop: 10, padding: "8px 12px", background: "#fffbeb", borderRadius: 8, border: "1px solid #fde68a" }}><p style={{ margin: 0, fontSize: 12, color: "#92400e", fontWeight: 600 }}>⏳ Under HR review — you'll be notified once approved.</p></div>}
        {r.status === "approved" && <div style={{ marginTop: 10, padding: "8px 12px", background: "#f0fdf4", borderRadius: 8, border: "1px solid #86efac" }}><p style={{ margin: 0, fontSize: 12, color: "#15803d", fontWeight: 600 }}>✅ Approved! Payment will be processed in the next payroll cycle.</p></div>}
        {r.status === "paid" && <div style={{ marginTop: 10, padding: "8px 12px", background: "#eff6ff", borderRadius: 8, border: "1px solid #bfdbfe" }}><p style={{ margin: 0, fontSize: 12, color: "#1d4ed8", fontWeight: 600 }}>💸 Paid! ₹{total.toLocaleString("en-IN")} has been credited.</p></div>}
      </div>

      {/* Payout summary */}
      <div style={{ background: "#fff", borderRadius: 12, padding: "14px 16px", border: "1px solid #eee", marginBottom: 10 }}>
        <p style={{ margin: "0 0 12px", fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em" }}>Payout Breakdown</p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ background: "#f8fafc", borderRadius: 10, padding: "10px 14px", border: "1px solid #e5e7eb", textAlign: "center", minWidth: 90, flex: 1 }}>
            <p style={{ margin: "0 0 3px", fontSize: 10, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase" }}>Base Payout</p>
            <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: base > 0 ? "#374151" : "#9ca3af" }}>{base > 0 ? `₹${base.toLocaleString("en-IN")}` : "—"}</p>
          </div>
          {bonus > 0 && <>
            <span style={{ fontSize: 16, color: "#d1d5db" }}>+</span>
            <div style={{ background: "#fef9c3", borderRadius: 10, padding: "10px 14px", border: "1px solid #fde68a", textAlign: "center", minWidth: 90, flex: 1 }}>
              <p style={{ margin: "0 0 3px", fontSize: 10, color: "#92400e", fontWeight: 700, textTransform: "uppercase" }}>🏆 Bonus</p>
              <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#92400e" }}>₹{bonus.toLocaleString("en-IN")}</p>
            </div>
            <span style={{ fontSize: 16, color: "#d1d5db" }}>=</span>
          </>}
          <div style={{ background: total > 0 ? "#f0fdf4" : "#f8fafc", borderRadius: 10, padding: "10px 14px", border: `1px solid ${total > 0 ? "#86efac" : "#e5e7eb"}`, textAlign: "center", minWidth: 90, flex: 1 }}>
            <p style={{ margin: "0 0 3px", fontSize: 10, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase" }}>Total</p>
            <p style={{ margin: 0, fontSize: 20, fontWeight: 900, color: total > 0 ? "#16a34a" : "#9ca3af" }}>{total > 0 ? `₹${total.toLocaleString("en-IN")}` : "—"}</p>
          </div>
        </div>
      </div>

      {/* KPI Breakdown table */}
      {isKpi && hasBreakdown && (
        <div style={{ background: "#fff", borderRadius: 12, padding: "14px 16px", border: "1px solid #eee", marginBottom: 10 }}>
          <p style={{ margin: "0 0 12px", fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em" }}>KPI Achievement</p>
          <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
            <table style={{ width: "100%", minWidth: 480, borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  {["KPI", "Target", "Actual", "Achievement", "Slab", "Incentive"].map(h => (
                    <th key={h} style={{ padding: "9px 10px", textAlign: "left", fontWeight: 700, color: "#6b7280", borderBottom: "1px solid #e5e7eb", whiteSpace: "nowrap", fontSize: 11, textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {kpiRows.map((row, ri) => row.is_admission_kpi ? (
                  <>
                    <tr key={`ah-${ri}`} style={{ background: "#f0f9ff", borderBottom: "1px solid #bae6fd" }}>
                      <td colSpan={6} style={{ padding: "10px 10px" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 12, fontWeight: 800, color: "#0369a1" }}>🎓 {row.kpi_name}</span>
                            <span style={{ fontSize: 10, background: "#eef2ff", color: "#4f46e5", padding: "1px 6px", borderRadius: 10, fontWeight: 600 }}>{row.weight}%</span>
                          </div>
                          <span style={{ fontWeight: 800, color: row.amt > 0 ? "#16a34a" : "#9ca3af", fontSize: 14 }}>{row.amt > 0 ? `₹${row.amt.toLocaleString("en-IN")}` : "—"}</span>
                        </div>
                      </td>
                    </tr>
                    {row.programDetails.map((pd, pdi) => (
                      <tr key={`ap-${ri}-${pdi}`} style={{ borderBottom: "1px solid #f3f4f6", background: "#fafeff" }}>
                        <td style={{ padding: "9px 10px 9px 20px", fontWeight: 600, color: "#0369a1", fontSize: 12 }}>📚 {pd.program_name}</td>
                        <td style={{ padding: "9px 10px", color: "#6b7280", fontSize: 12 }}>{pd.target}</td>
                        <td style={{ padding: "9px 10px", fontWeight: 700, color: pd.achColor, fontSize: 13 }}>{pd.actual}</td>
                        <td style={{ padding: "9px 10px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <div style={{ background: "#f3f4f6", borderRadius: 99, height: 7, width: 50, overflow: "hidden" }}><div style={{ width: `${pd.achPct}%`, height: "100%", background: pd.achColor, borderRadius: 99 }} /></div>
                            <span style={{ fontWeight: 800, color: pd.achColor, fontSize: 12 }}>{pd.achPct}%</span>
                          </div>
                        </td>
                        <td style={{ padding: "9px 10px" }}><span style={{ fontSize: 11, padding: "2px 6px", borderRadius: 5, fontWeight: 600, background: pd.amt > 0 ? "#eef2ff" : "#f3f4f6", color: pd.amt > 0 ? "#4f46e5" : "#9ca3af" }}>{pd.slabDesc}</span></td>
                        <td style={{ padding: "9px 10px", fontWeight: 800, color: pd.amt > 0 ? "#16a34a" : "#9ca3af", fontSize: 14 }}>{pd.amt > 0 ? `₹${pd.amt.toLocaleString("en-IN")}` : "—"}</td>
                      </tr>
                    ))}
                    <tr style={{ background: "#e0f2fe", borderBottom: "1px solid #bae6fd" }}>
                      <td colSpan={5} style={{ padding: "8px 10px", fontWeight: 700, color: "#0369a1", fontSize: 12 }}>🎓 {row.kpi_name} Total</td>
                      <td style={{ padding: "8px 10px", fontWeight: 800, color: row.amt > 0 ? "#0369a1" : "#9ca3af", fontSize: 14 }}>{row.amt > 0 ? `₹${row.amt.toLocaleString("en-IN")}` : "—"}</td>
                    </tr>
                  </>
                ) : (
                  <tr key={ri} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "11px 10px", fontWeight: 700, color: "#1f2937", fontSize: 13 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Target size={13} color="#6366f1" />
                        {row.kpi_name}
                        <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 10, background: "#eef2ff", color: "#4f46e5", fontWeight: 600 }}>{row.weight}%</span>
                      </div>
                    </td>
                    <td style={{ padding: "11px 10px", color: "#6b7280", fontSize: 12 }}>{row.target} {row.unit}</td>
                    <td style={{ padding: "11px 10px", fontWeight: 700, color: row.achColor, fontSize: 13 }}>{row.actual != null ? `${row.actual} ${row.unit}` : "—"}</td>
                    <td style={{ padding: "11px 10px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ background: "#f3f4f6", borderRadius: 99, height: 7, width: 50, overflow: "hidden" }}><div style={{ width: `${row.achPct}%`, height: "100%", background: row.achColor, borderRadius: 99 }} /></div>
                        <span style={{ fontWeight: 800, color: row.achColor, fontSize: 12 }}>{row.achPct}%</span>
                      </div>
                    </td>
                    <td style={{ padding: "11px 10px" }}>
                      {row.slab ? <span style={{ fontSize: 11, padding: "2px 6px", borderRadius: 5, fontWeight: 600, background: row.amt > 0 ? "#eef2ff" : "#f3f4f6", color: row.amt > 0 ? "#4f46e5" : "#9ca3af" }}>{row.slab.min_score}–{row.slab.max_score}% · {row.slabDesc}</span> : <span style={{ fontSize: 11, color: "#9ca3af" }}>No slab match</span>}
                    </td>
                    <td style={{ padding: "11px 10px", fontWeight: 800, color: row.amt > 0 ? "#16a34a" : "#9ca3af", fontSize: 14 }}>{row.amt > 0 ? `₹${row.amt.toLocaleString("en-IN")}` : "—"}</td>
                  </tr>
                ))}
                <tr style={{ background: "#f0fdf4", borderTop: "2px solid #86efac" }}>
                  <td colSpan={5} style={{ padding: "11px 10px", fontWeight: 700, color: "#15803d", fontSize: 13 }}>{bonus > 0 ? "KPI Base Total" : "Total Incentive"}</td>
                  <td style={{ padding: "11px 10px", fontWeight: 900, color: "#16a34a", fontSize: 16 }}>₹{base.toLocaleString("en-IN")}</td>
                </tr>
                {bonus > 0 && (
                  <tr style={{ background: "#fef9c3", borderTop: "1px solid #fde68a" }}>
                    <td colSpan={5} style={{ padding: "11px 10px", fontWeight: 700, color: "#92400e", fontSize: 13 }}>🏆 All-KPI Completion Bonus</td>
                    <td style={{ padding: "11px 10px", fontWeight: 900, color: "#92400e", fontSize: 16 }}>+₹{bonus.toLocaleString("en-IN")}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Standalone detail */}
      {!isKpi && (() => {
        const slabs = r.plan_id?.standalone_slabs || [];
        const alreadyRequested = r.hr_review_requested;
        const handleSubmitReview = async (achievedVal, note, selectedSlabIndex) => {
          try {
            const slabList = r.plan_id?.standalone_slabs || [];
            const selectedSlab = selectedSlabIndex !== null ? slabList[selectedSlabIndex] : null;
            await axios.post(`${API_BASE}/api/incentive-results/${r._id}/request-review`, { achieved_value: achievedVal, note, selected_slab: selectedSlab ?? undefined });
            const empId = localStorage.getItem("employeeId");
            fetchMyIncentives(empId);
          } catch (err) { alert(err.response?.data?.message || "Submit failed"); }
        };
        return (
          <>
            <div style={{ background: "#fffbeb", borderRadius: 12, padding: "14px 16px", border: "1px solid #fde68a", marginBottom: 10 }}>
              <p style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 700, color: "#92400e", textTransform: "uppercase" }}>Standalone Plan Details</p>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                {[{ label: "Metric", value: metricLabel(r.plan_id) }, { label: "Payout Rule", value: standaloneLabel(r.plan_id) }, { label: "Your Payout", value: total > 0 ? `₹${total.toLocaleString("en-IN")}` : "Pending HR entry" }].map(d => (
                  <div key={d.label}>
                    <p style={{ margin: "0 0 2px", fontSize: 10, color: "#b45309", fontWeight: 600, textTransform: "uppercase" }}>{d.label}</p>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#92400e" }}>{d.value}</p>
                  </div>
                ))}
              </div>
            </div>
            {slabs.length > 0 && (
              <div style={{ background: "#fff", borderRadius: 12, padding: "14px 16px", border: "1px solid #eee", marginBottom: 10 }}>
                <p style={{ margin: "0 0 12px", fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase" }}>Slab Structure</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {slabs.map((slab, si) => (
                    <div key={si} style={{ padding: "6px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: "#f0fdf4", border: "1px solid #86efac", color: "#15803d" }}>
                      {Number(slab.min_target).toLocaleString("en-IN")} → {slab.max_target === 0 ? "∞" : Number(slab.max_target).toLocaleString("en-IN")} : {slab.payout_type === "fixed" ? `₹${Number(slab.payout_value).toLocaleString("en-IN")}` : `${slab.payout_value}%`}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {r.status === "pending" && <SubmitReviewBox alreadyRequested={alreadyRequested} submittedValue={r.employee_submitted_value} reviewNote={r.hr_review_note} reviewRemark={r.hr_review_remark} slabs={r.plan_id?.standalone_slabs || []} onSubmit={handleSubmitReview} />}
          </>
        );
      })()}
    </div>
  );
}

// ── IncentiveCard ─────────────────────────────────────────────────────────────
function IncentiveCard({ r, expanded, onToggle, fetchMyIncentives }) {
  const isKpi = isKpiPlan(r.plan_id);
  const total = r.calculated_amount || 0;
  const bonus = r.completion_bonus || 0;
  const score = Math.round(r.performance_score || 0);
  const scoreColor = score >= 90 ? "#16a34a" : score >= 75 ? "#6366f1" : score >= 60 ? "#d97706" : "#dc2626";
  const isExp = expanded === r._id;

  const statusConfig = {
    pending:  { label: "Pending", bg: "#fffbeb", color: "#d97706", dot: "#f59e0b" },
    approved: { label: "Approved", bg: "#f0fdf4", color: "#16a34a", dot: "#22c55e" },
    paid:     { label: "Paid",    bg: "#eff6ff", color: "#2563eb", dot: "#3b82f6" },
  };
  const sc = statusConfig[r.status] || statusConfig.pending;

  return (
    <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", overflow: "hidden", marginBottom: 10 }}>
      {/* Card header — clickable */}
      <div onClick={() => onToggle(r._id)} style={{ padding: "14px 14px", cursor: "pointer" }}>
        {/* Row 1: icon + info + chevron (status moved to row2) */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, background: isKpi ? "#eef2ff" : "#fffbeb", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            {isKpi ? <BarChart2 size={17} color="#6366f1" /> : <Target size={17} color="#d97706" />}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2, flexWrap: "wrap" }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: "#1a1a2e" }}>{formatPeriod(r.cycle_period)}</span>
              <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 20, background: isKpi ? "#eef2ff" : "#fef9c3", color: isKpi ? "#6366f1" : "#92400e" }}>
                {isKpi ? "KPI-Linked" : "Standalone"}
              </span>
            </div>
            <div style={{ fontSize: 11, color: "#9ca3af", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {r.plan_id?.name || "—"} · {r.cycle || "Monthly"}
            </div>
          </div>
          <div style={{ color: "#9ca3af", flexShrink: 0 }}>{isExp ? <ChevronUp size={15} /> : <ChevronDown size={15} />}</div>
        </div>

        {/* Row 2: score/metric LEFT  |  amount + status RIGHT */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, paddingLeft: 48 }}>
          <div style={{ minWidth: 0 }}>
            {isKpi ? (
              <><span style={{ fontSize: 15, fontWeight: 900, color: scoreColor }}>{score}%</span><span style={{ fontSize: 10, color: "#9ca3af", marginLeft: 3 }}>KPI</span></>
            ) : (
              <span style={{ fontSize: 11, fontWeight: 700, color: "#374151" }}>{metricLabel(r.plan_id)}</span>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 16, fontWeight: 900, color: total > 0 ? "#16a34a" : "#9ca3af", lineHeight: 1.1 }}>
                {total > 0 ? `₹${total.toLocaleString("en-IN")}` : "—"}
              </div>
              {bonus > 0 && <div style={{ fontSize: 10, color: "#d97706", fontWeight: 700 }}>+₹{bonus.toLocaleString("en-IN")} bonus</div>}
            </div>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: sc.bg, color: sc.color, fontWeight: 700, padding: "4px 9px", borderRadius: 20, fontSize: 11, whiteSpace: "nowrap" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: sc.dot, display: "inline-block" }} />
              {sc.label}
            </span>
          </div>
        </div>
      </div>

      {/* Expanded */}
      {isExp && <ExpandedDetail r={r} fetchMyIncentives={fetchMyIncentives} />}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
export default function MyIncentive() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [activeTab, setActiveTab] = useState("pending");

  useEffect(() => {
    const empId = localStorage.getItem("employeeId");
    if (!empId) { setError("Session expired. Please login again."); setLoading(false); return; }
    fetchMyIncentives(empId);
  }, []);

  const fetchMyIncentives = async (empId) => {
    try {
      const res = await axios.get(`${API_BASE}/api/incentive-results/employee/${empId}`);
      let data = res.data?.data || res.data || [];
      const enriched = await Promise.all(data.map(async (r) => {
        if (typeof r.plan_id === "string") {
          try {
            const p = await axios.get(`${API_BASE}/api/incentive-plans/${r.plan_id}`);
            r.plan_id = p.data?.data || p.data || r.plan_id;
          } catch (e) {}
        }
        return r;
      }));
      setResults(enriched);
    } catch {
      setError("Failed to load incentive data.");
    } finally {
      setLoading(false);
    }
  };

  const summary = useMemo(() => {
    const totalEarned = results.reduce((s, r) => s + (r.calculated_amount || 0), 0);
    const totalPaid   = results.filter(r => r.status === "paid").reduce((s, r) => s + (r.calculated_amount || 0), 0);
    const pending     = results.filter(r => r.status === "pending");
    const approved    = results.filter(r => r.status === "approved");
    const paid        = results.filter(r => r.status === "paid");
    return { totalEarned, totalPaid, pending, approved, paid };
  }, [results]);

  const pendingList   = results.filter(r => r.status === "pending");
  const completedList = results.filter(r => r.status === "approved" || r.status === "paid");

  const handleToggle = (id) => setExpanded(prev => prev === id ? null : id);

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
      <div style={{ padding: "20px 14px", fontFamily: "'Sora',sans-serif", minHeight: "100vh", background: "#f4f6fb", maxWidth: 980, margin: "0 auto" }}>
        <style>{`
          @keyframes spin   { to { transform:rotate(360deg); } }
          @keyframes fadeUp { from { opacity:0;transform:translateY(10px);} to {opacity:1;transform:translateY(0);} }
          .fade-up { animation: fadeUp 0.3s ease both; }

          /* ── Responsive overrides ── */
          @media (min-width: 600px) {
            .incentive-summary-grid { grid-template-columns: repeat(4, 1fr) !important; }
            .incentive-page-wrap    { padding: 28px 24px !important; }
          }
          @media (max-width: 599px) {
            .incentive-summary-grid { grid-template-columns: repeat(2, 1fr) !important; }
            .incentive-tab-bar      { width: 100% !important; box-sizing: border-box; }
            .incentive-tab-bar button { flex: 1 !important; justify-content: center !important; padding: 8px 6px !important; font-size: 12px !important; }
          }
        `}</style>

        {/* ── Top header ── */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Sparkles size={20} color="#fff" />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#1a1a2e" }}>My Incentive</h2>
                <p style={{ margin: 0, fontSize: 12, color: "#9ca3af" }}>Track your performance-based incentives & payouts</p>
              </div>
            </div>
          </div>
        </div>

        {results.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 20px", background: "#fff", borderRadius: 16, border: "1px solid #e5e7eb" }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>🎯</div>
            <p style={{ fontWeight: 700, fontSize: 16, color: "#1a1a2e", margin: "0 0 8px" }}>No Incentive Records Yet</p>
            <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>Once your KPI review is completed and an incentive plan is assigned, your results will appear here.</p>
          </div>
        ) : (
          <>
            {/* ── Summary strip ── */}
            <div className="fade-up incentive-summary-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10, marginBottom: 20 }}>
              {[
                { label: "Total Earned",   value: `₹${summary.totalEarned.toLocaleString("en-IN")}`, color: "#6366f1", bg: "#f5f3ff", icon: <Wallet size={18} color="#6366f1" /> },
                { label: "Amount Paid",    value: `₹${summary.totalPaid.toLocaleString("en-IN")}`,   color: "#16a34a", bg: "#f0fdf4", icon: <BadgeCheck size={18} color="#16a34a" /> },
                { label: "Approved",       value: summary.approved.length,                            color: "#0ea5e9", bg: "#f0f9ff", icon: <CheckCircle size={18} color="#0ea5e9" /> },
                { label: "Pending",        value: summary.pending.length,                             color: "#f59e0b", bg: "#fffbeb", icon: <Hourglass size={18} color="#f59e0b" /> },
              ].map((s, i) => (
                <div key={i} className="fade-up" style={{ background: "#fff", borderRadius: 12, padding: "12px 14px", border: "1px solid #e5e7eb", animationDelay: `${i * 0.05}s`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <p style={{ margin: "0 0 4px", fontSize: 10, color: "#9ca3af", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.label}</p>
                    <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: s.color }}>{s.value}</p>
                  </div>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>{s.icon}</div>
                </div>
              ))}
            </div>

            {/* ── Tab bar ── */}
            <div className="incentive-tab-bar" style={{ display: "flex", gap: 2, background: "#fff", borderRadius: 12, padding: 4, border: "1px solid #e5e7eb", marginBottom: 16, width: "100%" }}>
              {[
                { key: "pending",   label: "Pending",   count: pendingList.length,   dot: "#f59e0b" },
                { key: "completed", label: "Completed", count: completedList.length, dot: "#16a34a" },
              ].map(tab => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 18px", border: "none", borderRadius: 9, fontWeight: 700, fontSize: 13, cursor: "pointer", background: activeTab === tab.key ? "#6366f1" : "transparent", color: activeTab === tab.key ? "#fff" : "#6b7280", transition: "all 0.15s" }}>
                  {tab.label}
                  <span style={{ background: activeTab === tab.key ? "rgba(255,255,255,0.25)" : "#f3f4f6", color: activeTab === tab.key ? "#fff" : "#6b7280", borderRadius: 20, padding: "1px 8px", fontSize: 11, fontWeight: 800 }}>{tab.count}</span>
                </button>
              ))}
            </div>

            {/* ── Tab content ── */}
            {activeTab === "pending" && (
              <div className="fade-up">
                {pendingList.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "60px 20px", background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb" }}>
                    <div style={{ width: 56, height: 56, borderRadius: 16, background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                      <CheckCircle size={28} color="#16a34a" />
                    </div>
                    <p style={{ fontWeight: 700, fontSize: 15, color: "#1a1a2e", margin: "0 0 6px" }}>All caught up!</p>
                    <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>No pending incentives at the moment.</p>
                  </div>
                ) : (
                  <>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                      <Hourglass size={14} color="#f59e0b" />
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>{pendingList.length} pending incentive{pendingList.length !== 1 ? "s" : ""}</span>
                      <span style={{ fontSize: 12, color: "#9ca3af" }}>— awaiting HR approval</span>
                    </div>
                    {pendingList.map(r => <IncentiveCard key={r._id} r={r} expanded={expanded} onToggle={handleToggle} fetchMyIncentives={fetchMyIncentives} />)}
                  </>
                )}
              </div>
            )}

            {activeTab === "completed" && (
              <div className="fade-up">
                {completedList.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "60px 20px", background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb" }}>
                    <div style={{ width: 56, height: 56, borderRadius: 16, background: "#f5f3ff", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                      <TrendingUp size={28} color="#6366f1" />
                    </div>
                    <p style={{ fontWeight: 700, fontSize: 15, color: "#1a1a2e", margin: "0 0 6px" }}>No completed records yet</p>
                    <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>Approved and paid incentives will appear here.</p>
                  </div>
                ) : (
                  <>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                      <BadgeCheck size={14} color="#16a34a" />
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>{completedList.length} completed record{completedList.length !== 1 ? "s" : ""}</span>
                      <span style={{ fontSize: 12, color: "#9ca3af" }}>— approved & paid</span>
                    </div>
                    {completedList.map(r => <IncentiveCard key={r._id} r={r} expanded={expanded} onToggle={handleToggle} fetchMyIncentives={fetchMyIncentives} />)}
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </EmployeeLayout>
  );
}