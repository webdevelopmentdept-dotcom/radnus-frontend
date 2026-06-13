import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { Download, Users, TrendingUp, CheckCircle, DollarSign, RefreshCw } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const inputStyle = {
  width: "100%", padding: "9px 12px", border: "1px solid #d1d5db",
  borderRadius: 8, fontSize: 13, color: "#1a1a2e", background: "#fff",
  boxSizing: "border-box", outline: "none",
};
const labelStyle = { display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 6 };

// ── Core slab calculator ──────────────────────────────────────────────────────
function calcIncentive(plan, finalScore, salary = 0, kpiBreakdown = []) {
  if (!plan) return { amount: 0, slabLabel: "No Plan Matched", kpiDetails: [] };

  // ── STANDALONE ──
  if (plan.plan_type === "standalone") {
    const score = Math.round(finalScore || 0);
    const slab  = (plan.slabs || []).find(s => score >= s.min_score && score <= s.max_score);
    if (!slab || slab.type === "none") return { amount: 0, slabLabel: `${score}% → No Bonus`, kpiDetails: [] };
    const amount = slab.type === "percentage"
      ? Math.round((slab.value / 100) * salary)
      : slab.value;
    return { amount, slabLabel: `${score}% → ₹${amount.toLocaleString("en-IN")}`, kpiDetails: [] };
  }

  // ── KPI-LINKED ──
  const kpiConfigs = plan.kpi_configs || [];
  if (!kpiConfigs.length) return { amount: 0, slabLabel: "No KPI configs", kpiDetails: [] };

  const normalize = (s) => (s || "").toLowerCase().trim();

  let totalAmount = 0;
  const labels    = [];
  const kpiDetails = []; // ← structured data for UI rendering

  kpiConfigs.forEach(cfg => {
    const kpiData = (kpiBreakdown || []).find(
      k => normalize(k.kpi_name) === normalize(cfg.kpi_name)
    );

    // ── ADMISSION KPI: per-program slab calculation ──────────────────────────
    if (cfg.is_admission_kpi) {
      const programSlabs   = cfg.program_slabs   || [];
      const programTargets = cfg.program_targets || [];

      let admissionTotal = 0;
      const programDetails = [];

      programTargets.forEach(pt => {
        // Find actual admissions for this program from kpi_breakdown
        // kpi_breakdown entries for admission KPIs should have program_id or program_name
        const progActual = (kpiBreakdown || []).find(k =>
          normalize(k.kpi_name) === normalize(cfg.kpi_name) &&
          (k.program_id === pt.program_id || normalize(k.program_name) === normalize(pt.program_name))
        );

        // Fallback: if no per-program breakdown, try matching by kpi_name only (old data)
        const actualAdmissions = progActual?.actual_value ??
          (programTargets.length === 1 ? kpiData?.actual_value : 0) ?? 0;

        const programTarget = Number(pt.target) || 0;
        const achPct = programTarget > 0
          ? Math.min(Math.round((Number(actualAdmissions) / programTarget) * 100), 100)
          : 0;

        // Find matching slab for this program
        const progSlabEntry = programSlabs.find(ps => ps.program_id === pt.program_id);
        const slabs         = progSlabEntry?.slabs || [];
        const slab          = slabs.find(s => achPct >= s.min_score && achPct <= s.max_score);

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
        } else if (slab && slab.type === "none") {
          slabDesc = `${slab.min_score}–${slab.max_score}% → No Bonus`;
        }

        admissionTotal += amt;
        programDetails.push({
          program_id:   pt.program_id,
          program_name: pt.program_name,
          target:       programTarget,
          actual:       actualAdmissions,
          achPct,
          slabDesc,
          amount:       amt,
        });
      });

      totalAmount += admissionTotal;
      labels.push(`${cfg.kpi_name}: ₹${admissionTotal.toLocaleString("en-IN")} (${programTargets.length} programs)`);
      kpiDetails.push({
        kpi_name:        cfg.kpi_name,
        is_admission_kpi: true,
        weight:          cfg.weight,
        amount:          admissionTotal,
        programDetails,
      });
      return;
    }

    // ── NORMAL KPI ───────────────────────────────────────────────────────────
    let kpiScore = 0;
    if (kpiData) {
      if (kpiData.target && Number(kpiData.target) > 0 && kpiData.actual_value != null) {
        kpiScore = Math.min(
          Math.round((Number(kpiData.actual_value) / Number(kpiData.target)) * 100),
          100
        );
      } else if (kpiData.pct_achieved != null) {
        kpiScore = Math.round(kpiData.pct_achieved);
      } else {
        kpiScore = Math.round(kpiData.actual_value || 0);
      }
    }

    const slab = (cfg.slabs || []).find(
      s => kpiScore >= s.min_score && kpiScore <= s.max_score
    );

    let amt = 0;
    if (slab && slab.type !== "none" && slab.value > 0) {
      if (slab.type === "target_percentage") {
        amt = Math.round((slab.value / 100) * Number(cfg.target));
      } else if (slab.type === "percentage") {
        amt = Math.round((slab.value / 100) * salary);
      } else {
        amt = slab.value;
      }
      totalAmount += amt;
      labels.push(`${cfg.kpi_name}: ${kpiScore}% → ₹${amt.toLocaleString("en-IN")}`);
    } else {
      labels.push(`${cfg.kpi_name}: ${kpiScore}% → No Bonus`);
    }

    kpiDetails.push({
      kpi_name:        cfg.kpi_name,
      is_admission_kpi: false,
      weight:          cfg.weight,
      target:          kpiData?.target ?? cfg.target,
      actual:          kpiData?.actual_value,
      achPct:          kpiScore,
      amount:          amt,
      slabDesc:        slab
        ? slab.type === "none"
          ? "No Bonus"
          : `${slab.min_score}–${slab.max_score}%`
        : "No Slab",
    });
  });

  // ── Completion reward ──
  const allPerfect = kpiConfigs.every(cfg => {
    if (cfg.is_admission_kpi) {
      // For admission KPIs, check if all programs hit 100%
      const programTargets = cfg.program_targets || [];
      return programTargets.every(pt => {
        const progActual = (kpiBreakdown || []).find(k =>
          normalize(k.kpi_name) === normalize(cfg.kpi_name) &&
          (k.program_id === pt.program_id || normalize(k.program_name) === normalize(pt.program_name))
        );
        if (!progActual) return false;
        return Number(progActual.actual_value) >= Number(pt.target);
      });
    }
    const kpiData = (kpiBreakdown || []).find(
      k => normalize(k.kpi_name) === normalize(cfg.kpi_name)
    );
    if (!kpiData) return false;
    if (kpiData.target && Number(kpiData.target) > 0) {
      return (Number(kpiData.actual_value) / Number(kpiData.target)) >= 1;
    }
    return false;
  });

  if (allPerfect && plan.completion_reward_type && plan.completion_reward_type !== "none") {
    const bonus = plan.completion_reward_type === "percentage"
      ? Math.round((plan.completion_reward_value / 100) * salary)
      : plan.completion_reward_value;
    totalAmount += bonus;
    labels.push(`🏆 All-KPI Bonus: ₹${bonus.toLocaleString("en-IN")}`);
  }

  return {
    amount:     totalAmount,
    slabLabel:  labels.join(" | ") || "No slabs matched",
    kpiDetails,
  };
}

const STATUS_META = {
  pending:  { label: "Pending",  color: "#d97706", bg: "#fffbeb" },
  approved: { label: "Approved", color: "#16a34a", bg: "#f0fdf4" },
  paid:     { label: "Paid",     color: "#2563eb", bg: "#eff6ff" },
};

export default function IncentiveResults() {
  const [results,     setResults]     = useState([]);
  const [plans,       setPlans]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [toast,       setToast]       = useState(null);
  const [bulkBusy,    setBulkBusy]    = useState(false);
  const [recalcIds,   setRecalcIds]   = useState(new Set());
  const [expandedRow, setExpandedRow] = useState(null);
  const [activeTab, setActiveTab] = useState("results");

  // filters
  const [fStatus, setFStatus] = useState("All");
  const [fDept,   setFDept]   = useState("All");
  const [fPeriod, setFPeriod] = useState("All");

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [rRes, pRes] = await Promise.all([
        axios.get(`${API_BASE}/api/incentive-results`),
        axios.get(`${API_BASE}/api/incentive-plans`),
      ]);
      setResults(rRes.data?.data || rRes.data || []);
      setPlans(pRes.data?.data   || pRes.data || []);
    } catch { showToast("Failed to load", "error"); }
    finally   { setLoading(false); }
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3000);
  };

  // ── Recalculate ───────────────────────────────────────────────────────────
  const recalculate = async (result) => {
  const resultId   = result._id;
  const employeeId = result.employee_id?._id || result.employee_id;
  const period     = result.cycle_period;

  if (!employeeId || !period) {
    showToast("Missing employee or period info", "error"); return;
  }

  setRecalcIds(prev => new Set(prev).add(resultId));

  try {
    const reviewRes = await axios.get(`${API_BASE}/api/performance-reviews/${employeeId}`);
    const reviews   = reviewRes.data?.data || [];

    if (!reviews.length) {
      showToast("No performance reviews found", "error"); return;
    }

    const toMonthYear = (p = "") => {
      if (isNaN(p[0])) return p.trim().toLowerCase();
      const [year, month] = p.split("-");
      if (!year || !month) return p.trim().toLowerCase();
      return new Date(parseInt(year), parseInt(month) - 1, 1)
        .toLocaleString("en-US", { month: "long", year: "numeric" }).toLowerCase();
    };

    const matched = reviews.filter(rv => toMonthYear(rv.period) === toMonthYear(period));
    if (!matched.length) {
      const available = [...new Set(reviews.map(rv => rv.period))].join(", ");
      showToast(`No review for "${period}". Available: ${available}`, "error"); return;
    }

    const sorted  = [...matched].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    const best    = sorted.find(rv => rv.status === "finalized") || sorted[0];
    const latestScore     = best?.final_score ?? 0;
    const latestBreakdown = best?.kpi_breakdown || [];

    if (latestScore === 0) {
      showToast("Review score is 0 — finalize the review first", "error"); return;
    }

    // ✅ FIX: Daily logs-இல் இருந்து program-wise actuals fetch பண்ணு
    let enrichedBreakdown = [...latestBreakdown];
    try {
      const assignRes = await axios.get(`${API_BASE}/api/kpi-assignments/${employeeId}`);
      if (assignRes.data.success && assignRes.data.data) {
        const assignmentId = assignRes.data.data._id;
        const logsRes = await axios.get(`${API_BASE}/api/daily-logs/${employeeId}/${assignmentId}`);
        const allLogs = logsRes.data.data || [];

        // Program-wise totals build பண்ணு
        const programTotals = {}; // { kpi_item_id: { program_id: total } }
        allLogs.forEach(log => {
          if (log.program_values && Object.keys(log.program_values).length > 0) {
            if (!programTotals[log.kpi_item_id]) programTotals[log.kpi_item_id] = {};
            Object.entries(log.program_values).forEach(([progId, val]) => {
              programTotals[log.kpi_item_id][progId] = 
                (programTotals[log.kpi_item_id][progId] || 0) + (Number(val) || 0);
            });
          }
        });

        // kpi_items from assignment to get program_targets
        const kpiItems = assignRes.data.data.template_id?.kpi_items || [];

        // enrichedBreakdown-ல் admission KPI-க்கு program entries add பண்ணு
        const additionalEntries = [];
        kpiItems.forEach(kpiItem => {
          if (kpiItem.is_admission_kpi && kpiItem.program_targets?.length > 0) {
            const progTotals = programTotals[kpiItem._id] || {};
            kpiItem.program_targets.forEach(pt => {
              additionalEntries.push({
                kpi_name:     kpiItem.kpi_name,
                program_id:   pt.program_id,
                program_name: pt.program_name,
                actual_value: progTotals[pt.program_id] || 0,
                target:       pt.target,
              });
            });
          }
        });

        if (additionalEntries.length > 0) {
          enrichedBreakdown = [...latestBreakdown, ...additionalEntries];
        }
      }
    } catch (logErr) {
      console.warn("Could not fetch daily logs for program actuals:", logErr);
      // Fallback: latestBreakdown மட்டும் use பண்ணு
    }

    const plan = plans.find(p => p._id === (result.plan_id?._id || result.plan_id));
    const { amount } = calcIncentive(plan, latestScore, result.salary || 0, enrichedBreakdown);

    await axios.put(`${API_BASE}/api/incentive-results/${resultId}`, {
      performance_score: latestScore,
      kpi_breakdown:     enrichedBreakdown,
      calculated_amount: amount,
    });

    showToast(`Recalculated ✅ Score: ${Math.round(latestScore)}% → ₹${amount.toLocaleString("en-IN")}`);
    fetchAll();

  } catch (err) {
    console.error("Recalculate error:", err);
    showToast("Recalculate failed", "error");
  } finally {
    setRecalcIds(prev => { const s = new Set(prev); s.delete(resultId); return s; });
  }
};

  const depts   = useMemo(() => ["All", ...new Set(results.map(r => r.employee_id?.department).filter(Boolean))], [results]);
  const periods = useMemo(() => ["All", ...new Set(results.map(r => r.cycle_period).filter(Boolean))].sort((a, b) => b.localeCompare(a)), [results]);

  const filtered = useMemo(() => results.filter(r => {
    if (fStatus !== "All" && r.status !== fStatus.toLowerCase()) return false;
    if (fDept   !== "All" && r.employee_id?.department !== fDept) return false;
    if (fPeriod !== "All" && r.cycle_period !== fPeriod)          return false;
    return true;
  }), [results, fStatus, fDept, fPeriod]);

  const getCalc = (r) => {
    const plan = plans.find(p => p._id === (r.plan_id?._id || r.plan_id));
    return calcIncentive(plan, r.performance_score, r.salary, r.kpi_breakdown || []);
  };

  const stats = useMemo(() => {
    const amt  = (r) => r.calculated_amount ?? getCalc(r).amount;
    const total    = filtered.reduce((s, r) => s + amt(r), 0);
    const approved = filtered.filter(r => r.status === "approved").reduce((s, r) => s + amt(r), 0);
    return {
      total, approved,
      pending: filtered.filter(r => r.status === "pending").length,
      paid:    filtered.filter(r => r.status === "paid").length,
    };
  }, [filtered, plans]);

  const updateStatus = async (id, status) => {
    try {
      await axios.put(`${API_BASE}/api/incentive-results/${id}`, { status });
      showToast(`Marked as ${status} ✅`); fetchAll();
    } catch { showToast("Update failed", "error"); }
  };

  const bulkApprove = async () => {
    const ids = filtered.filter(r => r.status === "pending").map(r => r._id);
    if (!ids.length) { showToast("No pending items", "error"); return; }
    setBulkBusy(true);
    try {
      await Promise.all(ids.map(id => axios.put(`${API_BASE}/api/incentive-results/${id}`, { status: "approved" })));
      showToast(`${ids.length} approved ✅`); fetchAll();
    } catch { showToast("Bulk approve failed", "error"); }
    finally { setBulkBusy(false); }
  };

  const exportExcel = () => {
    const rows = filtered.map((r, i) => {
      const plan = plans.find(p => p._id === (r.plan_id?._id || r.plan_id));
      const { amount } = calcIncentive(plan, r.performance_score, r.salary, r.kpi_breakdown || []);
      return {
        "#": i + 1,
        "Employee":        r.employee_id?.name || "—",
        "Department":      r.employee_id?.department || "—",
        "Period":          r.cycle_period || "—",
        "Plan":            plan?.name || "—",
        "Final Score (%)": r.performance_score ?? 0,
        "Incentive (₹)":   r.calculated_amount ?? amount,
        "Status":          r.status || "pending",
      };
    });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Incentive Results");
    XLSX.writeFile(wb, `Incentive_${new Date().toLocaleDateString("en-IN").replace(/\//g, "-")}.xlsx`);
    showToast("Downloaded ✅");
  };

  return (
    <div style={{ padding: "28px 32px", fontFamily: "'Segoe UI',sans-serif", minHeight: "100vh", background: "#f4f6fb" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(4px); } to { opacity:1; transform:translateY(0); } }
        .recalc-btn:hover { background: #fef3c7 !important; color: #b45309 !important; }
        .row-expandable:hover { background: #fafbff !important; cursor: pointer; }
      `}</style>

      {toast && (
        <div style={{ position: "fixed", top: 20, right: 16, zIndex: 9999, background: toast.type === "error" ? "#ff4d4f" : "#52c41a", color: "#fff", padding: "12px 20px", borderRadius: 8, fontWeight: 500, fontSize: 14, animation: "fadeIn 0.2s ease", boxShadow: "0 4px 16px rgba(0,0,0,0.15)" }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#1a1a2e" }}>Results & Payout</h2>
          {/* Tab Bar */}
<div style={{ display: "flex", gap: 4, background: "#f1f5f9", borderRadius: 10, padding: 4, marginBottom: 24, width: "fit-content" }}>
  {[
    { key: "results", label: "📊 Results & Payout" },
    { key: "reviews", label: "⏳ HR Review Requests" },
  ].map(tab => (
    <button
      key={tab.key}
      onClick={() => setActiveTab(tab.key)}
      style={{
        padding: "8px 20px", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer",
        background: activeTab === tab.key ? "#fff" : "transparent",
        color: activeTab === tab.key ? "#1d4ed8" : "#6b7280",
        boxShadow: activeTab === tab.key ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
        transition: "all 0.15s",
      }}
    >
      {tab.label}
    </button>
  ))}
</div>
          <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 14 }}>
            KPI-based incentives — recalc to sync latest review scores
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button onClick={bulkApprove} disabled={bulkBusy} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", background: "#16a34a", color: "#fff", border: "none", borderRadius: 9, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
            <CheckCircle size={15} /> {bulkBusy ? "Approving..." : "Bulk Approve Pending"}
          </button>
          <button onClick={exportExcel} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", background: "#1d4ed8", color: "#fff", border: "none", borderRadius: 9, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
            <Download size={15} /> Export Excel
          </button>
        </div>
      </div>

          
    {activeTab === "reviews" && <HRReviewQueue onRefresh={fetchAll} />}
      {activeTab === "results" && (
        <>
          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 16, marginBottom: 24 }}>
            {[
              { label: "Total Payout",    value: `₹${stats.total.toLocaleString("en-IN")}`,    color: "#1d4ed8", icon: <DollarSign size={20} color="#1d4ed8" /> },
              { label: "Approved Amount", value: `₹${stats.approved.toLocaleString("en-IN")}`, color: "#16a34a", icon: <TrendingUp size={20} color="#16a34a" /> },
              { label: "Pending",         value: stats.pending,                                  color: "#d97706", icon: <Users size={20} color="#d97706" /> },
              { label: "Paid",            value: stats.paid,                                     color: "#2563eb", icon: <CheckCircle size={20} color="#2563eb" /> },
            ].map(s => (
              <div key={s.label} style={{ background: "#fff", borderRadius: 12, padding: "16px 20px", border: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ margin: "0 0 4px", fontSize: 11, color: "#6b7280", fontWeight: 700, textTransform: "uppercase" }}>{s.label}</p>
                  <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</p>
                </div>
                {s.icon}
              </div>
            ))}
          </div>

          {/* Filters */}
          <div style={{ background: "#fff", borderRadius: 14, padding: "16px 20px", border: "1px solid #e5e7eb", marginBottom: 20, display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-end" }}>
            {[
              { label: "Status",     val: fStatus, set: setFStatus, opts: ["All", "Pending", "Approved", "Paid"] },
              { label: "Department", val: fDept,   set: setFDept,   opts: depts },
              { label: "Period",     val: fPeriod, set: setFPeriod, opts: periods },
            ].map(f => (
              <div key={f.label} style={{ minWidth: 150 }}>
                <label style={labelStyle}>{f.label}</label>
                <select value={f.val} onChange={e => f.set(e.target.value)} style={inputStyle}>
                  {f.opts.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
            ))}
            {(fStatus !== "All" || fDept !== "All" || fPeriod !== "All") && (
              <button onClick={() => { setFStatus("All"); setFDept("All"); setFPeriod("All"); }}
                style={{ background: "none", border: "none", color: "#2563eb", fontWeight: 600, fontSize: 13, cursor: "pointer", marginBottom: 2 }}>
                ✕ Clear
              </button>
            )}
          </div>

          {/* Table */}
          {loading ? (
            <div style={{ textAlign: "center", padding: 80, color: "#6b7280" }}>
              <div style={{ width: 36, height: 36, border: "4px solid #e5e7eb", borderTopColor: "#1d4ed8", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
              Loading results...
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: 80, background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", color: "#9ca3af" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>💰</div>
              <p style={{ fontWeight: 700 }}>No results found</p>
              <p style={{ fontSize: 13 }}>Results are auto-generated when KPI reviews are completed</p>
            </div>
          ) : (
            <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                  <thead>
                    <tr style={{ background: "#f8fafc" }}>
                      {["#", "Employee", "Dept", "Period", "Plan", "Score", "Incentive", "KPI Breakdown", "Status", "Action"].map(h => (
                        <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontWeight: 700, color: "#374151", borderBottom: "2px solid #e5e7eb", whiteSpace: "nowrap", fontSize: 13 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r, i) => {
                      const plan = plans.find(p => p._id === (r.plan_id?._id || r.plan_id));
                      const { amount, slabLabel, kpiDetails } = calcIncentive(plan, r.performance_score, r.salary, r.kpi_breakdown || []);
                      const finalAmt   = r.calculated_amount ?? amount;
                      const sm         = STATUS_META[r.status] || STATUS_META.pending;
                      const score      = Math.round(r.performance_score || 0);
                      const scoreColor = score >= 90 ? "#16a34a" : score >= 75 ? "#2563eb" : score >= 60 ? "#d97706" : "#dc2626";
                      const isBusy     = recalcIds.has(r._id);
                      const isExpanded = expandedRow === r._id;
                      const hasBreakdown = (r.kpi_breakdown || []).length > 0 || kpiDetails.length > 0;

                      return (
                        <>
                          <tr
                            key={r._id}
                            className="row-expandable"
                            onClick={() => hasBreakdown && setExpandedRow(isExpanded ? null : r._id)}
                            style={{ borderBottom: isExpanded ? "none" : "1px solid #f3f4f6", background: i % 2 === 0 ? "#fff" : "#fafafa" }}
                          >
                            <td style={{ padding: "12px 16px", color: "#9ca3af", fontWeight: 600 }}>{i + 1}</td>
                            <td style={{ padding: "12px 16px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "#2563eb", fontSize: 13, flexShrink: 0 }}>
                                  {r.employee_id?.name?.charAt(0) || "?"}
                                </div>
                                <div>
                                  <p style={{ margin: 0, fontWeight: 700, color: "#1a1a2e", fontSize: 13 }}>{r.employee_id?.name || "—"}</p>
                                  <p style={{ margin: 0, fontSize: 11, color: "#6b7280" }}>{r.employee_id?.designation || ""}</p>
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: "12px 16px", fontSize: 13, color: "#374151" }}>{r.employee_id?.department || "—"}</td>
                            <td style={{ padding: "12px 16px" }}>
                              <span style={{ background: "#f3f4f6", padding: "3px 8px", borderRadius: 5, fontWeight: 600, fontSize: 12 }}>{r.cycle_period || "—"}</span>
                            </td>
                            <td style={{ padding: "12px 16px", fontSize: 12, color: "#6b7280" }}>{plan?.name || "—"}</td>
                            <td style={{ padding: "12px 16px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <span style={{ fontWeight: 800, fontSize: 16, color: scoreColor }}>{score}%</span>
                                <div style={{ width: 50, background: "#f3f4f6", borderRadius: 99, height: 6, overflow: "hidden" }}>
                                  <div style={{ width: `${score}%`, height: "100%", background: scoreColor, borderRadius: 99 }} />
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: "12px 16px" }}>
                              <p style={{ margin: 0, fontWeight: 800, fontSize: 16, color: finalAmt > 0 ? "#16a34a" : "#9ca3af" }}>
                                {finalAmt > 0 ? `₹${finalAmt.toLocaleString("en-IN")}` : "—"}
                              </p>
                            </td>
                            <td style={{ padding: "12px 16px", fontSize: 11, color: "#9ca3af", maxWidth: 220 }}>
                              {hasBreakdown ? (
                                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                                  {slabLabel.split(" | ").map((l, idx) => (
                                    <span key={idx} style={{ color: l.includes("No Bonus") ? "#9ca3af" : "#374151", fontWeight: l.includes("No Bonus") ? 400 : 600 }}>{l}</span>
                                  ))}
                                  <span style={{ color: "#a5b4fc", fontSize: 10, marginTop: 2 }}>
                                    {isExpanded ? "▲ hide details" : "▼ view details"}
                                  </span>
                                </div>
                              ) : (
                                <span style={{ color: "#fbbf24", fontWeight: 600, fontSize: 11 }}>⚠ Click Recalc</span>
                              )}
                            </td>
                            <td style={{ padding: "12px 16px" }}>
                              <span style={{ background: sm.bg, color: sm.color, fontWeight: 700, padding: "4px 10px", borderRadius: 20, fontSize: 12 }}>{sm.label}</span>
                            </td>
                            <td style={{ padding: "12px 16px" }} onClick={e => e.stopPropagation()}>
                              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                                {r.status !== "paid" && (
                                  <button
                                    className="recalc-btn"
                                    onClick={() => recalculate(r)}
                                    disabled={isBusy}
                                    style={{ display: "flex", alignItems: "center", gap: 4, background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 6, padding: "5px 10px", fontSize: 12, fontWeight: 700, color: "#d97706", cursor: isBusy ? "not-allowed" : "pointer", opacity: isBusy ? 0.7 : 1 }}
                                  >
                                    <RefreshCw size={12} style={{ animation: isBusy ? "spin 0.8s linear infinite" : "none" }} />
                                    {isBusy ? "..." : "Recalc"}
                                  </button>
                                )}
                                {r.status === "pending" && (
                                  <button onClick={() => updateStatus(r._id, "approved")}
                                    style={{ background: "#f0fdf4", border: "none", borderRadius: 6, padding: "5px 12px", fontSize: 12, fontWeight: 700, color: "#16a34a", cursor: "pointer" }}>
                                    Approve
                                  </button>
                                )}
                                {r.status === "approved" && (
                                  <button onClick={() => updateStatus(r._id, "paid")}
                                    style={{ background: "#eff6ff", border: "none", borderRadius: 6, padding: "5px 12px", fontSize: 12, fontWeight: 700, color: "#1d4ed8", cursor: "pointer" }}>
                                    Mark Paid
                                  </button>
                                )}
                                {r.status === "paid" && (
                                  <span style={{ fontSize: 13, color: "#16a34a", fontWeight: 700 }}>✓ Paid</span>
                                )}
                              </div>
                            </td>
                          </tr>

                          {isExpanded && hasBreakdown && (
                            <tr key={`${r._id}-exp`}>
                              <td colSpan={10} style={{ padding: "0 16px 16px", background: "#f8fafc", borderBottom: "1px solid #f3f4f6" }}>
                                <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb", overflow: "hidden", marginTop: 4 }}>
                                  <div style={{ padding: "10px 16px", background: "#f1f5f9", borderBottom: "1px solid #e5e7eb" }}>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>📊 Per-KPI Incentive Breakdown</span>
                                  </div>
                                  {kpiDetails.map((kd, kdIdx) => (
                                    kd.is_admission_kpi ? (
                                      <div key={kdIdx} style={{ borderBottom: kdIdx < kpiDetails.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                                        <div style={{ padding: "10px 16px", background: "#f0f9ff", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #bae6fd" }}>
                                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                            <span style={{ fontSize: 12, fontWeight: 800, color: "#0369a1" }}>🎓 {kd.kpi_name}</span>
                                            <span style={{ fontSize: 10, background: "#e0f2fe", color: "#0369a1", padding: "2px 8px", borderRadius: 99, fontWeight: 700, border: "1px solid #bae6fd" }}>
                                              Admission KPI · Weight {kd.weight}%
                                            </span>
                                          </div>
                                          <span style={{ fontSize: 13, fontWeight: 800, color: kd.amount > 0 ? "#16a34a" : "#9ca3af" }}>
                                            {kd.amount > 0 ? `₹${kd.amount.toLocaleString("en-IN")}` : "—"}
                                          </span>
                                        </div>
                                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                                          <thead>
                                            <tr style={{ background: "#f8fafc" }}>
                                              {["Program", "Target", "Actual Admissions", "Achievement %", "Slab Matched", "Incentive"].map(h => (
                                                <th key={h} style={{ padding: "8px 14px", textAlign: "left", fontWeight: 700, color: "#6b7280", borderBottom: "1px solid #e5e7eb", whiteSpace: "nowrap", fontSize: 11 }}>{h}</th>
                                              ))}
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {kd.programDetails.map((pd, pdi) => {
                                              const achColor = pd.achPct >= 90 ? "#16a34a" : pd.achPct >= 70 ? "#2563eb" : pd.achPct >= 50 ? "#d97706" : "#dc2626";
                                              return (
                                                <tr key={pdi} style={{ borderBottom: "1px solid #f3f4f6" }}>
                                                  <td style={{ padding: "9px 14px", fontWeight: 700, color: "#0369a1" }}>
                                                    <span style={{ background: "#f0f9ff", border: "1px solid #bae6fd", padding: "2px 8px", borderRadius: 5, fontSize: 12 }}>
                                                      📚 {pd.program_name}
                                                    </span>
                                                  </td>
                                                  <td style={{ padding: "9px 14px", color: "#6b7280", fontWeight: 600 }}>{pd.target}</td>
                                                  <td style={{ padding: "9px 14px", fontWeight: 700, color: achColor }}>{pd.actual}</td>
                                                  <td style={{ padding: "9px 14px" }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                      <div style={{ background: "#f3f4f6", borderRadius: 99, height: 6, width: 60, overflow: "hidden" }}>
                                                        <div style={{ width: `${pd.achPct}%`, height: "100%", background: achColor, borderRadius: 99 }} />
                                                      </div>
                                                      <span style={{ fontWeight: 700, color: achColor, fontSize: 12 }}>{pd.achPct}%</span>
                                                    </div>
                                                  </td>
                                                  <td style={{ padding: "9px 14px" }}>
                                                    <span style={{ background: pd.amount > 0 ? "#eef2ff" : "#f3f4f6", color: pd.amount > 0 ? "#4f46e5" : "#9ca3af", fontWeight: 600, padding: "3px 8px", borderRadius: 5, fontSize: 11 }}>
                                                      {pd.slabDesc}
                                                    </span>
                                                  </td>
                                                  <td style={{ padding: "9px 14px", fontWeight: 800, color: pd.amount > 0 ? "#16a34a" : "#9ca3af", fontSize: 13 }}>
                                                    {pd.amount > 0 ? `₹${pd.amount.toLocaleString("en-IN")}` : "—"}
                                                  </td>
                                                </tr>
                                              );
                                            })}
                                            <tr style={{ background: "#f0f9ff", borderTop: "1.5px solid #bae6fd" }}>
                                              <td colSpan={5} style={{ padding: "8px 14px", fontWeight: 700, color: "#0369a1", fontSize: 12 }}>
                                                🎓 {kd.kpi_name} Total
                                              </td>
                                              <td style={{ padding: "8px 14px", fontWeight: 800, color: kd.amount > 0 ? "#0369a1" : "#9ca3af", fontSize: 14 }}>
                                                {kd.amount > 0 ? `₹${kd.amount.toLocaleString("en-IN")}` : "—"}
                                              </td>
                                            </tr>
                                          </tbody>
                                        </table>
                                      </div>
                                    ) : (
                                      <table key={kdIdx} style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                                        {kdIdx === 0 && (
                                          <thead>
                                            <tr style={{ background: "#f8fafc" }}>
                                              {["KPI Name", "Target", "Actual", "Achievement %", "Slab Matched", "Incentive"].map(h => (
                                                <th key={h} style={{ padding: "9px 14px", textAlign: "left", fontWeight: 700, color: "#6b7280", borderBottom: "1px solid #e5e7eb", whiteSpace: "nowrap", fontSize: 12 }}>{h}</th>
                                              ))}
                                            </tr>
                                          </thead>
                                        )}
                                        <tbody>
                                          <tr style={{ borderBottom: "1px solid #f3f4f6" }}>
                                            <td style={{ padding: "10px 14px", fontWeight: 600, color: "#1f2937" }}>{kd.kpi_name}</td>
                                            <td style={{ padding: "10px 14px", color: "#6b7280" }}>{kd.target}</td>
                                            <td style={{ padding: "10px 14px", fontWeight: 700, color: kd.achPct >= 75 ? "#16a34a" : "#dc2626" }}>{kd.actual}</td>
                                            <td style={{ padding: "10px 14px" }}>
                                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                <div style={{ background: "#f3f4f6", borderRadius: 99, height: 6, width: 70, overflow: "hidden" }}>
                                                  <div style={{ width: `${kd.achPct}%`, height: "100%", background: kd.achPct >= 75 ? "#16a34a" : "#dc2626", borderRadius: 99 }} />
                                                </div>
                                                <span style={{ fontWeight: 700, color: kd.achPct >= 75 ? "#16a34a" : "#dc2626", fontSize: 12 }}>{kd.achPct}%</span>
                                              </div>
                                            </td>
                                            <td style={{ padding: "10px 14px" }}>
                                              <span style={{ background: kd.amount > 0 ? "#eef2ff" : "#f3f4f6", color: kd.amount > 0 ? "#4f46e5" : "#9ca3af", fontWeight: 600, padding: "3px 8px", borderRadius: 5, fontSize: 11 }}>{kd.slabDesc}</span>
                                            </td>
                                            <td style={{ padding: "10px 14px", fontWeight: 800, color: kd.amount > 0 ? "#16a34a" : "#9ca3af", fontSize: 14 }}>
                                              {kd.amount > 0 ? `₹${kd.amount.toLocaleString("en-IN")}` : "—"}
                                            </td>
                                          </tr>
                                        </tbody>
                                      </table>
                                    )
                                  ))}
                                  <div style={{ background: "#f0fdf4", borderTop: "2px solid #86efac", padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <span style={{ fontWeight: 700, color: "#15803d", fontSize: 13 }}>💰 Total Incentive</span>
                                    <span style={{ fontWeight: 800, color: "#16a34a", fontSize: 18 }}>
                                      ₹{finalAmt.toLocaleString("en-IN")}
                                    </span>
                                  </div>
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
              <p style={{ textAlign: "center", padding: "12px 0", fontSize: 13, color: "#9ca3af", margin: 0, borderTop: "1px solid #f3f4f6" }}>
                Showing {filtered.length} of {results.length} results
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── HR Review Queue Component ─────────────────────────────────────────────────
function HRReviewQueue({ onRefresh }) {
  const [reviews,  setReviews]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [remarks,  setRemarks]  = useState({});   // { [id]: string }
  const [amounts,  setAmounts]  = useState({});   // { [id]: string }
  const [busy,     setBusy]     = useState({});   // { [id]: bool }
  const [toast,    setToast]    = useState(null);

  useEffect(() => { fetchReviews(); }, []);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/incentive-results/pending-reviews`);
      const data = res.data?.data || [];
      setReviews(data);
      // Auto-fill suggested amounts
      const autoAmts = {};
      data.forEach(r => {
        const slabs  = r.plan_id?.standalone_slabs || [];
        const achVal = r.employee_submitted_value  || 0;
        const matched = slabs.find(s =>
          achVal >= s.min_target && (s.max_target === 0 || achVal <= s.max_target)
        );
        if (matched) {
          autoAmts[r._id] = matched.payout_type === "fixed"
            ? String(matched.payout_value)
            : String(Math.round((matched.payout_value / 100) * (r.salary || 0)));
        }
      });
      setAmounts(autoAmts);
    } catch { showT("Failed to load reviews", "error"); }
    finally { setLoading(false); }
  };

  const showT = (msg, type = "success") => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3000);
  };

  const handleApprove = async (id) => {
    setBusy(b => ({ ...b, [id]: true }));
    try {
      await axios.post(`${API_BASE}/api/incentive-results/${id}/hr-approve`, {
        calculated_amount: amounts[id] || 0,
        remark: remarks[id] || "",
      });
      showT("Approved ✅");
      fetchReviews();
      onRefresh?.();
    } catch { showT("Approve failed", "error"); }
    finally { setBusy(b => ({ ...b, [id]: false })); }
  };

  const handleReject = async (id) => {
    setBusy(b => ({ ...b, [id]: true }));
    try {
      await axios.post(`${API_BASE}/api/incentive-results/${id}/hr-reject`, {
        remark: remarks[id] || "",
      });
      showT("Rejected");
      fetchReviews();
    } catch { showT("Reject failed", "error"); }
    finally { setBusy(b => ({ ...b, [id]: false })); }
  };

  if (loading) return <div style={{ textAlign: "center", padding: 60, color: "#6b7280" }}>Loading reviews...</div>;

  return (
    <div>
      {toast && (
        <div style={{ position: "fixed", top: 20, right: 16, zIndex: 9999, background: toast.type === "error" ? "#ff4d4f" : "#52c41a", color: "#fff", padding: "12px 20px", borderRadius: 8, fontWeight: 500, fontSize: 14 }}>
          {toast.msg}
        </div>
      )}

      {reviews.length === 0 ? (
        <div style={{ textAlign: "center", padding: 80, background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", color: "#9ca3af" }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>✅</div>
          <p style={{ fontWeight: 700, fontSize: 15 }}>No pending reviews</p>
          <p style={{ fontSize: 13 }}>Employee-submitted target achievements will appear here</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {reviews.map(r => {
            const slabs   = r.plan_id?.standalone_slabs || [];
            const achVal  = r.employee_submitted_value || 0;
            const matched = slabs.find(s =>
              achVal >= s.min_target && (s.max_target === 0 || achVal <= s.max_target)
            );

            return (
              <div key={r._id} style={{ background: "#fff", borderRadius: 12, padding: "18px 20px", border: "1px solid #e5e7eb" }}>
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: 800, fontSize: 15, color: "#1a1a2e" }}>{r.employee_id?.name}</p>
                    <p style={{ margin: "3px 0 0", fontSize: 12, color: "#6b7280" }}>
                      {r.employee_id?.department} · {r.cycle_period} · {r.plan_id?.name}
                    </p>
                  </div>
                  <span style={{ fontSize: 11, background: "#fffbeb", color: "#d97706", padding: "3px 12px", borderRadius: 20, fontWeight: 700, border: "1px solid #fde68a" }}>
                    ⏳ Pending Review
                  </span>
                </div>

                {/* Employee data */}
                <div style={{ background: "#f8fafc", borderRadius: 8, padding: "10px 14px", marginBottom: 14, display: "flex", gap: 24, flexWrap: "wrap" }}>
                  <div>
                    <p style={{ margin: "0 0 2px", fontSize: 10, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase" }}>Achieved Value</p>
                    <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#1a1a2e" }}>{achVal.toLocaleString("en-IN")}</p>
                  </div>
                  {r.hr_review_note && (
                    <div>
                      <p style={{ margin: "0 0 2px", fontSize: 10, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase" }}>Employee Note</p>
                      <p style={{ margin: 0, fontSize: 13, color: "#374151" }}>{r.hr_review_note}</p>
                    </div>
                  )}
                  {matched && (
                    <div>
                      <p style={{ margin: "0 0 2px", fontSize: 10, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase" }}>Matched Slab</p>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#16a34a" }}>
                        {matched.min_target.toLocaleString("en-IN")} → {matched.max_target === 0 ? "∞" : matched.max_target.toLocaleString("en-IN")}
                        {" · "}
                        {matched.payout_type === "fixed"
                          ? `₹${Number(matched.payout_value).toLocaleString("en-IN")}`
                          : `${matched.payout_value}%`}
                      </p>
                    </div>
                  )}
                </div>

                {/* Approve form */}
                <div style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}>
                  <div>
                    <p style={{ margin: "0 0 5px", fontSize: 11, fontWeight: 600, color: "#6b7280" }}>Approve Amount (₹)</p>
                    <input
                      type="number"
                      value={amounts[r._id] || ""}
                      onChange={e => setAmounts(a => ({ ...a, [r._id]: e.target.value }))}
                      style={{ padding: "8px 12px", border: "1.5px solid #e5e7eb", borderRadius: 8, fontSize: 13, width: 150, outline: "none" }}
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: 160 }}>
                    <p style={{ margin: "0 0 5px", fontSize: 11, fontWeight: 600, color: "#6b7280" }}>Remark (optional)</p>
                    <input
                      value={remarks[r._id] || ""}
                      onChange={e => setRemarks(rm => ({ ...rm, [r._id]: e.target.value }))}
                      placeholder="e.g. Verified with CRM data"
                      style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #e5e7eb", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }}
                    />
                  </div>
                  <button
                    onClick={() => handleApprove(r._id)}
                    disabled={busy[r._id]}
                    style={{ padding: "8px 20px", background: busy[r._id] ? "#86efac" : "#16a34a", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer" }}
                  >
                    ✅ Approve
                  </button>
                  <button
                    onClick={() => handleReject(r._id)}
                    disabled={busy[r._id]}
                    style={{ padding: "8px 16px", background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer" }}
                  >
                    ✕ Reject
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}