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
  const slabs = plan.standalone_slabs || [];
  if (slabs.length > 0) {
    // Show the first slab's rule as a summary (or "Multiple slabs" if more than one)
    if (slabs.length === 1) {
      const s = slabs[0];
      if (s.payout_type === "per_unit") return `₹${Number(s.payout_value).toLocaleString("en-IN")} / unit`;
      if (s.payout_type === "fixed") return `₹${Number(s.payout_value).toLocaleString("en-IN")} Fixed`;
      if (s.payout_type === "percent_of_salary") return `${s.payout_value}% of Salary`;
      if (s.payout_type === "percent_of_achieved") return `${s.payout_value}% of Achieved`;
    }
    return "Slab-based";
  }
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

// ── AddSaleEntry — cumulative entries + edit/delete + manual final submit ────
function AddSaleEntry({ resultId, onUpdate }) {
  const [entries, setEntries]     = useState([]);
  const [total, setTotal]         = useState(0);
  const [matchedSlab, setMatched] = useState(null);
  const [estimated, setEstimated] = useState(0);
  const [locked, setLocked]       = useState(false);
  const [lockDate, setLockDate]   = useState(null);
  const [loading, setLoading]     = useState(true);

  const [amount, setAmount] = useState("");
  const [note, setNote]     = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editAmount, setEditAmount] = useState("");
  const [editNote, setEditNote]     = useState("");
  const [finalSubmitting, setFinalSubmitting] = useState(false);

  const fetchEntries = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/incentive-results/${resultId}/entries`);
      const d = res.data?.data || {};
      setEntries(d.entries || []);
      setTotal(d.total_achieved || 0);
      setEstimated(d.estimated_amount || 0);
      setLocked(!!d.period_locked);
      setLockDate(d.lock_date || null);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchEntries(); }, [resultId]);

  const handleAdd = async () => {
    if (!amount || Number(amount) <= 0) { setErr("Enter a valid amount"); return; }
    setErr(""); setSubmitting(true);
    try {
      await axios.post(`${API_BASE}/api/incentive-results/${resultId}/add-entry`, { amount, note });
      setAmount(""); setNote("");
      await fetchEntries();
      onUpdate?.();
    } catch (e) {
      setErr(e.response?.data?.message || "Failed to add entry");
    } finally { setSubmitting(false); }
  };

  const startEdit = (e) => {
    setEditingId(e._id);
    setEditAmount(String(e.amount));
    setEditNote(e.note || "");
  };

  const cancelEdit = () => { setEditingId(null); setEditAmount(""); setEditNote(""); };

  const saveEdit = async (entryId) => {
    if (!editAmount || Number(editAmount) <= 0) return;
    try {
      await axios.put(`${API_BASE}/api/incentive-results/${resultId}/entries/${entryId}`, {
        amount: editAmount, note: editNote,
      });
      cancelEdit();
      await fetchEntries();
      onUpdate?.();
    } catch (e) {
      setErr(e.response?.data?.message || "Failed to update entry");
    }
  };

  const handleDelete = async (entryId) => {
    if (!window.confirm("Remove this entry?")) return;
    try {
      await axios.delete(`${API_BASE}/api/incentive-results/${resultId}/entries/${entryId}`);
      await fetchEntries();
      onUpdate?.();
    } catch (e) {
      setErr(e.response?.data?.message || "Failed to remove entry");
    }
  };

  const handleFinalSubmit = async () => {
    if (entries.length === 0) { setErr("Add at least one entry before submitting"); return; }
    if (!window.confirm(`Submit total ${total.toLocaleString("en-IN")} for HR review? You won't be able to edit entries after this.`)) return;
    setFinalSubmitting(true);
    try {
      await axios.post(`${API_BASE}/api/incentive-results/${resultId}/final-submit`);
      await fetchEntries();
      onUpdate?.();
    } catch (e) {
      setErr(e.response?.data?.message || "Submit failed");
    } finally { setFinalSubmitting(false); }
  };

  if (loading) return <p style={{ fontSize: 12, color: "#9ca3af" }}>Loading entries…</p>;

  return (
    <div style={{ background: "#f8fafc", borderRadius: 12, padding: "16px 20px", border: "1px solid #e5e7eb" }}>
      <p style={{ margin: "0 0 14px", fontWeight: 700, fontSize: 13, color: "#374151" }}>🎯 Log your achievements for this period</p>

      {/* Running total */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
        <div style={{ background: "#eef2ff", borderRadius: 10, padding: "10px 14px", border: "1px solid #c7d2fe", flex: 1, minWidth: 130 }}>
          <p style={{ margin: "0 0 2px", fontSize: 10, color: "#4f46e5", fontWeight: 700, textTransform: "uppercase" }}>Total So Far</p>
          <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#4f46e5" }}>{total.toLocaleString("en-IN")}</p>
        </div>
        <div style={{ background: "#f0fdf4", borderRadius: 10, padding: "10px 14px", border: "1px solid #86efac", flex: 1, minWidth: 130 }}>
          <p style={{ margin: "0 0 2px", fontSize: 10, color: "#15803d", fontWeight: 700, textTransform: "uppercase" }}>Estimated Payout</p>
          <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#15803d" }}>₹{estimated.toLocaleString("en-IN")}</p>
        </div>
      </div>

      {/* Past entries — each with its OWN matched slab + payout */}
      {entries.length > 0 && (
        <div style={{ marginBottom: 14, border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden" }}>
          {entries.map((e, i) => (
            <div key={e._id || i} style={{ padding: "8px 12px", borderBottom: i < entries.length - 1 ? "1px solid #f3f4f6" : "none", background: "#fff" }}>
              {editingId === e._id ? (
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <input type="number" value={editAmount} onChange={ev => setEditAmount(ev.target.value)}
                    style={{ width: 100, padding: "5px 8px", border: "1.5px solid #6366f1", borderRadius: 6, fontSize: 12, outline: "none" }} />
                  <input value={editNote} onChange={ev => setEditNote(ev.target.value)} placeholder="Note"
                    style={{ flex: 1, minWidth: 100, padding: "5px 8px", border: "1.5px solid #e5e7eb", borderRadius: 6, fontSize: 12, outline: "none" }} />
                  <button onClick={() => saveEdit(e._id)} style={{ background: "#f0fdf4", color: "#16a34a", border: "none", borderRadius: 6, padding: "5px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>✓ Save</button>
                  <button onClick={cancelEdit} style={{ background: "#f3f4f6", color: "#6b7280", border: "none", borderRadius: 6, padding: "5px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>✕ Cancel</button>
                </div>
              ) : (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#1f2937" }}>{Number(e.amount).toLocaleString("en-IN")}</span>
                    {e.note && <span style={{ fontSize: 11, color: "#9ca3af", marginLeft: 8 }}>{e.note}</span>}
                    {e.added_by === "hr" && <span style={{ fontSize: 10, marginLeft: 8, background: "#fef9c3", color: "#a16207", padding: "1px 6px", borderRadius: 10, fontWeight: 700 }}>HR</span>}
                    {/* 🆕 per-entry matched slab + payout */}
                    <div style={{ marginTop: 2 }}>
                      {e.matched_slab ? (
                        <span style={{ fontSize: 11, color: "#16a34a", fontWeight: 700 }}>
                          → ₹{Number(e.payout || 0).toLocaleString("en-IN")}
                        </span>
                      ) : (
                        <span style={{ fontSize: 11, color: "#dc2626" }}>No matching slab</span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 11, color: "#9ca3af" }}>{new Date(e.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                    {!locked && (
                      <>
                        <button onClick={() => startEdit(e)} style={{ background: "#eff6ff", border: "none", borderRadius: 5, padding: "3px 7px", cursor: "pointer", fontSize: 11, color: "#2563eb", fontWeight: 700 }}>✎</button>
                        <button onClick={() => handleDelete(e._id)} style={{ background: "#fef2f2", border: "none", borderRadius: 5, padding: "3px 7px", cursor: "pointer", fontSize: 11, color: "#dc2626", fontWeight: 700 }}>✕</button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add form / locked message / final submit */}
      {locked ? (
        <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: "10px 14px" }}>
          <p style={{ margin: 0, fontSize: 12, color: "#92400e", fontWeight: 700 }}>
            🔒 Submitted — now with HR for review.
          </p>
          <p style={{ margin: "3px 0 0", fontSize: 11, color: "#b45309" }}>Need a correction? Contact HR.</p>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end", marginBottom: 12 }}>
            <div style={{ flex: 1, minWidth: 130 }}>
              <p style={{ margin: "0 0 5px", fontSize: 11, fontWeight: 600, color: "#6b7280" }}>Amount <span style={{ color: "#dc2626" }}>*</span></p>
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="e.g. 100000" style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #e5e7eb", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
            </div>
            <div style={{ flex: 2, minWidth: 160 }}>
              <p style={{ margin: "0 0 5px", fontSize: 11, fontWeight: 600, color: "#6b7280" }}>Note (optional)</p>
              <input value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. Client X deal" style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #e5e7eb", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
            </div>
            <button onClick={handleAdd} disabled={submitting} style={{ padding: "8px 20px", background: submitting ? "#a5b4fc" : "#6366f1", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: submitting ? "not-allowed" : "pointer", whiteSpace: "nowrap" }}>
              {submitting ? "Adding..." : "+ Add Entry"}
            </button>
          </div>

          {err && <p style={{ margin: "0 0 10px", fontSize: 11, color: "#dc2626" }}>{err}</p>}

          {/* 🆕 Manual Final Submit */}
          <div style={{ borderTop: "1px dashed #e5e7eb", paddingTop: 12, display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={handleFinalSubmit}
              disabled={finalSubmitting || entries.length === 0}
              style={{ padding: "9px 22px", background: finalSubmitting || entries.length === 0 ? "#d1d5db" : "#16a34a", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: finalSubmitting || entries.length === 0 ? "not-allowed" : "pointer" }}
            >
              {finalSubmitting ? "Submitting..." : "✅ Final Submit to HR"}
            </button>
          </div>
        </>
      )}
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
        return (
          <>
            <div style={{ background: "#fffbeb", borderRadius: 12, padding: "14px 16px", border: "1px solid #fde68a", marginBottom: 10 }}>
  <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: "#92400e", textTransform: "uppercase" }}>Standalone Plan Details</p>
  {r.plan_id?.description && (
    <p style={{ margin: "0 0 10px", fontSize: 12, color: "#78350f", fontWeight: 500, lineHeight: 1.4 }}>
      {r.plan_id.description}
    </p>
  )}
  <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
    {[
      { label: "Metric", value: metricLabel(r.plan_id) },
      { label: "Payout Rule", value: standaloneLabel(r.plan_id) },
      ...(r.employee_submitted_value != null ? [{ label: "Achieved Value", value: Number(r.employee_submitted_value).toLocaleString("en-IN") }] : []),
      { label: "Your Payout", value: total > 0 ? `₹${total.toLocaleString("en-IN")}` : "Pending HR entry" },
    ].map(d => (
      <div key={d.label}>
        <p style={{ margin: "0 0 2px", fontSize: 10, color: "#b45309", fontWeight: 600, textTransform: "uppercase" }}>{d.label}</p>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#92400e" }}>{d.value}</p>
      </div>
    ))}
  </div>

  {r.hr_review_note && (
    <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px dashed #fde68a" }}>
      <p style={{ margin: "0 0 2px", fontSize: 10, color: "#b45309", fontWeight: 600, textTransform: "uppercase" }}>Your Note</p>
      <p style={{ margin: 0, fontSize: 13, color: "#78350f" }}>{r.hr_review_note}</p>
    </div>
  )}

  {r.hr_review_remark && (
    <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px dashed #fde68a" }}>
      <p style={{ margin: "0 0 2px", fontSize: 10, color: "#15803d", fontWeight: 600, textTransform: "uppercase" }}>HR Remark</p>
      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#15803d" }}>{r.hr_review_remark}</p>
    </div>
  )}
</div>
            {slabs.length > 0 && (
              <div style={{ background: "#fff", borderRadius: 12, padding: "14px 16px", border: "1px solid #eee", marginBottom: 10 }}>
                <p style={{ margin: "0 0 12px", fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase" }}>Slab Structure</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
               {slabs.map((slab, si) => {
  const payoutText =
    slab.payout_type === "fixed"            ? `₹${Number(slab.payout_value).toLocaleString("en-IN")}` :
    slab.payout_type === "per_unit"          ? `₹${Number(slab.payout_value).toLocaleString("en-IN")} / unit` :
    slab.payout_type === "percent_of_salary" ? `${slab.payout_value}% of Salary` :
    `${slab.payout_value}%`; // percent_of_achieved
  return (
    <div key={si} style={{ padding: "6px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: "#f0fdf4", border: "1px solid #86efac", color: "#15803d" }}>
      {Number(slab.min_target).toLocaleString("en-IN")} → {slab.max_target === 0 ? "∞" : Number(slab.max_target).toLocaleString("en-IN")} : {payoutText}
    </div>
  );
})}
                </div>
              </div>
            )}
            {r.status === "pending" && (
              <AddSaleEntry
                resultId={r._id}
                onUpdate={() => { const empId = localStorage.getItem("employeeId"); fetchMyIncentives(empId); }}
              />
            )}
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