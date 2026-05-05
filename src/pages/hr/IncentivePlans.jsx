import { useState, useEffect } from "react";
import axios from "axios";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  PlusSignIcon, Delete02Icon, PencilEdit01Icon,
  CheckmarkCircle01Icon, Building04Icon, Target01Icon,
  Calendar01Icon, Award01Icon,
} from "@hugeicons/core-free-icons";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

// ── Styles ───────────────────────────────────────────────────────────────────
const inp = {
  width: "100%", padding: "9px 12px", border: "1.5px solid #e2e8f0",
  borderRadius: 8, fontSize: 13, color: "#1e293b", background: "#fff",
  boxSizing: "border-box", outline: "none", fontFamily: "inherit",
  transition: "border-color 0.15s",
};
const lbl = {
  display: "block", fontSize: 11, fontWeight: 700,
  color: "#64748b", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em",
};

// ── Constants ─────────────────────────────────────────────────────────────────
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1];

const VALUE_TYPES = [
  { value: "count",      label: "Count"       },
  { value: "percentage", label: "Percentage %" },
  { value: "amount",     label: "Amount ₹"    },
  { value: "rating",     label: "Rating"      },
];
const OPERATORS = [
  { value: ">=", label: "≥ (At least)"  },
  { value: ">",  label: "> (More than)" },
  { value: "=",  label: "= (Exactly)"   },
  { value: "<=", label: "≤ (At most)"   },
  { value: "<",  label: "< (Less than)" },
];

const EMPTY_KPI_CONFIG = (kpi_name, weight) => ({
  kpi_name,
  weight,
  target:     "",
  value_type: "count",
  operator:   ">=",
  rule_label: "",
  slabs:      [],
});

const EMPTY_FORM = {
  name:       "",
  department: "",
  plan_type:  "kpi_linked",
  period_type:    "Monthly",
  period_month:   new Date().getMonth() + 1,
  period_quarter: "Q1",
  period_half:    "H1",
  period_year:    CURRENT_YEAR,
  kpi_template_id: "",
  selected_kpis:   [],
  kpi_configs:     [],
  completion_reward_type:  "none",
  completion_reward_value: 0,
  completion_reward_label: "",
  standalone_payout_type:   "fixed",
  standalone_payout_value:  0,
  standalone_metric:        "manual",
  standalone_metric_label:  "",
  slabs: [],
};

const DEPT_COLORS = {
  Sales:       { color: "#2563eb", bg: "#eff6ff" },
  Engineering: { color: "#7c3aed", bg: "#f5f3ff" },
  Marketing:   { color: "#d97706", bg: "#fffbeb" },
  HR:          { color: "#16a34a", bg: "#f0fdf4" },
  Finance:     { color: "#ea580c", bg: "#fff7ed" },
  Operations:  { color: "#0891b2", bg: "#ecfeff" },
};
const getColor = (d) => DEPT_COLORS[d] || { color: "#6b7280", bg: "#f3f4f6" };

// ── Helpers ───────────────────────────────────────────────────────────────────
function buildRuleLabel(cfg) {
  if (!cfg.target) return "";
  const opLabel = OPERATORS.find(o => o.value === cfg.operator)?.label?.split(" ")[0] || cfg.operator;
  const unit = cfg.value_type === "percentage" ? "%" : cfg.value_type === "amount" ? "₹" : cfg.value_type === "rating" ? "/10" : " units";
  return `${opLabel} ${cfg.target}${unit}`;
}

function periodLabel(f) {
  const y = f.period_year;
  switch (f.period_type) {
    case "Monthly":     return `${MONTHS[(f.period_month||1)-1].slice(0,3)} ${y}`;
    case "Quarterly":   return `${f.period_quarter} ${y}`;
    case "Half-Yearly": return `${f.period_half} ${y}`;
    case "Yearly":      return `FY ${y}`;
    default:            return `${y}`;
  }
}

function validateSlabs(slabs) {
  const errors = [];
  slabs.forEach((s, i) => {
    if (s.min_score > s.max_score) errors.push(`Slab ${i+1}: Min > Max`);
    if (s.type !== "none" && s.value <= 0) errors.push(`Slab ${i+1}: Value must be > 0`);
  });
  for (let i = 0; i < slabs.length; i++)
    for (let j = i+1; j < slabs.length; j++)
      if (slabs[i].max_score >= slabs[j].min_score && slabs[i].min_score <= slabs[j].max_score)
        errors.push(`Slabs ${i+1} & ${j+1} overlap`);
  return errors;
}

// ════════════════════════════════════════════════════════════════════════════
export default function IncentivePlans() {
  const [plans,        setPlans]        = useState([]);
  const [depts,        setDepts]        = useState([]);
  const [kpiTemplates, setKpiTemplates] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [showForm,     setShowForm]     = useState(false);
  const [editId,       setEditId]       = useState(null);
  const [form,         setForm]         = useState(EMPTY_FORM);
  const [saving,       setSaving]       = useState(false);
  const [toast,        setToast]        = useState(null);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [p, d, k] = await Promise.all([
        axios.get(`${API_BASE}/api/incentive-plans`),
        axios.get(`${API_BASE}/api/departments`),
        axios.get(`${API_BASE}/api/kpi-templates`),
      ]);
      setPlans(p.data?.data || p.data || []);
      const list = d.data?.data || d.data || [];
      setDepts(list.map(x => typeof x === "string" ? x : x.name));
      if (k.data?.success) setKpiTemplates(k.data.data || []);
    } catch { showToast("Failed to load data", "error"); }
    finally   { setLoading(false); }
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const filteredTemplates = kpiTemplates.filter(t => !form.department || t.department === form.department);
  const selectedTemplate  = kpiTemplates.find(t => t._id === form.kpi_template_id);

  // ── KPI checkbox toggle ───────────────────────────────────────────────────
  const toggleKpi = (kpiItem) => {
    const name = kpiItem.kpi_name;
    const isSelected = form.selected_kpis.includes(name);
    if (isSelected) {
      setForm(f => ({
        ...f,
        selected_kpis: f.selected_kpis.filter(k => k !== name),
        kpi_configs:   f.kpi_configs.filter(c => c.kpi_name !== name),
      }));
    } else {
      setForm(f => ({
        ...f,
        selected_kpis: [...f.selected_kpis, name],
        kpi_configs:   [...f.kpi_configs, EMPTY_KPI_CONFIG(name, kpiItem.weight)],
      }));
    }
  };

  const updateKpiConfig = (kpiName, field, val) => {
    setForm(f => ({
      ...f,
      kpi_configs: f.kpi_configs.map(c => {
        if (c.kpi_name !== kpiName) return c;
        const updated = { ...c, [field]: val };
        updated.rule_label = buildRuleLabel(updated);
        return updated;
      }),
    }));
  };

  const addSlabToKpi = (kpiName) => {
    setForm(f => ({
      ...f,
      kpi_configs: f.kpi_configs.map(c => {
        if (c.kpi_name !== kpiName) return c;
        const last   = c.slabs[c.slabs.length - 1];
        const newMin = last ? last.max_score + 1 : 0;
        return { ...c, slabs: [...c.slabs, { min_score: newMin, max_score: Math.min(newMin + 10, 100), type: "fixed", value: 0 }] };
      }),
    }));
  };

  const updateKpiSlab = (kpiName, slabIdx, field, val) => {
    setForm(f => ({
      ...f,
      kpi_configs: f.kpi_configs.map(c => {
        if (c.kpi_name !== kpiName) return c;
        const slabs = [...c.slabs];
        slabs[slabIdx] = { ...slabs[slabIdx], [field]: field === "type" ? val : Number(val) };
        return { ...c, slabs };
      }),
    }));
  };

  const removeKpiSlab = (kpiName, slabIdx) => {
    setForm(f => ({
      ...f,
      kpi_configs: f.kpi_configs.map(c => {
        if (c.kpi_name !== kpiName) return c;
        return { ...c, slabs: c.slabs.filter((_, i) => i !== slabIdx) };
      }),
    }));
  };

  const handleTemplateChange = (templateId) => {
    setForm(f => ({ ...f, kpi_template_id: templateId, selected_kpis: [], kpi_configs: [] }));
  };

  const openCreate = () => { setForm(EMPTY_FORM); setEditId(null); setShowForm(true); };

  const openEdit = (p) => {
    const configs = p.kpi_configs || [];
    setForm({
      name:        p.name,
      department:  p.department,
      plan_type:   p.plan_type ?? "kpi_linked",
      period_type:    p.period_type    || "Monthly",
      period_month:   p.period_month   || new Date().getMonth() + 1,
      period_quarter: p.period_quarter || "Q1",
      period_half:    p.period_half    || "H1",
      period_year:    p.period_year    || CURRENT_YEAR,
      kpi_template_id: p.kpi_template_id?._id || p.kpi_template_id || "",
      selected_kpis:   configs.map(c => c.kpi_name),
      kpi_configs:     configs,
      completion_reward_type:  p.completion_reward_type  || "none",
      completion_reward_value: p.completion_reward_value || 0,
      completion_reward_label: p.completion_reward_label || "",
      standalone_payout_type:   p.standalone_payout_type  || "fixed",
      standalone_payout_value:  p.standalone_payout_value || 0,
      standalone_metric:        p.standalone_metric       || "manual",
      standalone_metric_label:  p.standalone_metric_label || "",
      slabs: p.slabs || [],
    });
    setEditId(p._id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.department) {
      showToast("Plan name & department are required", "error"); return;
    }
    if (form.plan_type === "kpi_linked") {
      if (!form.kpi_template_id) { showToast("Please select a KPI template", "error"); return; }
      if (form.kpi_configs.length === 0) { showToast("Select at least one KPI", "error"); return; }
      for (const cfg of form.kpi_configs) {
        const errs = validateSlabs(cfg.slabs);
        if (errs.length) { showToast(`${cfg.kpi_name}: ${errs[0]}`, "error"); return; }
      }
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name, department: form.department, plan_type: form.plan_type,
        period_type:    form.period_type,
        period_month:   form.period_type === "Monthly"     ? form.period_month   : null,
        period_quarter: form.period_type === "Quarterly"   ? form.period_quarter : null,
        period_half:    form.period_type === "Half-Yearly" ? form.period_half    : null,
        period_year:    form.period_year,
        ...(form.plan_type === "kpi_linked" ? {
          kpi_template_id:         form.kpi_template_id,
          kpi_configs:             form.kpi_configs,
          completion_reward_type:  form.completion_reward_type,
          completion_reward_value: form.completion_reward_value,
          completion_reward_label: form.completion_reward_label,
        } : {
          standalone_metric:       form.standalone_metric,
          standalone_metric_label: form.standalone_metric_label,
          standalone_payout_type:  form.standalone_payout_type,
          standalone_payout_value: form.standalone_payout_value,
          slabs: form.slabs,
        }),
      };
      if (editId) await axios.put(`${API_BASE}/api/incentive-plans/${editId}`, payload);
      else        await axios.post(`${API_BASE}/api/incentive-plans`, payload);
      showToast(editId ? "Plan updated ✅" : "Plan created ✅");
      setShowForm(false);
      fetchAll();
    } catch { showToast("Save failed", "error"); }
    finally   { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this plan?")) return;
    try {
      await axios.delete(`${API_BASE}/api/incentive-plans/${id}`);
      showToast("Deleted ✅"); fetchAll();
    } catch { showToast("Delete failed", "error"); }
  };

  const totalWeight = form.kpi_configs.reduce((s, c) => s + (c.weight || 0), 0);

  // ── How many total KPIs exist in the selected template ────────────────────
  const totalTemplateKpis = selectedTemplate?.kpi_items?.length || 0;

  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div style={{ padding: "28px 32px", fontFamily: "'Segoe UI',sans-serif", minHeight: "100vh", background: "#f4f6fb" }}>
      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes fadeIn  { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideIn { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
        .plan-card { transition: all 0.15s; }
        .plan-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.08); transform: translateY(-1px); }
        .kpi-card  { transition: all 0.15s; }
        input:focus, select:focus { border-color: #6366f1 !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
        .checkbox-kpi { cursor:pointer; user-select:none; }
        .checkbox-kpi:hover { background: #f8fafc; }
        .slab-row { animation: slideIn 0.15s ease; }
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position:"fixed", top:20, right:20, zIndex:9999, background: toast.type==="error" ? "#ef4444" : "#22c55e", color:"#fff", padding:"12px 20px", borderRadius:10, fontWeight:600, fontSize:14, boxShadow:"0 8px 24px rgba(0,0,0,0.15)", animation:"fadeIn 0.2s ease" }}>
          {toast.msg}
        </div>
      )}

      {/* Page Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24, flexWrap:"wrap", gap:12 }}>
        <div>
          <h2 style={{ margin:0, fontSize:22, fontWeight:800, color:"#1e293b" }}>Incentive Plans</h2>
          <p style={{ margin:"4px 0 0", color:"#64748b", fontSize:14 }}>Configure KPI-linked or standalone incentive rules per department</p>
        </div>
        <button onClick={openCreate} style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 20px", background:"#4f46e5", color:"#fff", border:"none", borderRadius:10, fontWeight:700, fontSize:14, cursor:"pointer", boxShadow:"0 2px 8px rgba(79,70,229,0.3)" }}>
          <HugeiconsIcon icon={PlusSignIcon} size={16} color="#fff" strokeWidth={2.5} />
          New Plan
        </button>
      </div>

      {/* Summary Cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))", gap:14, marginBottom:24 }}>
        {[
          { label:"Total Plans", value:plans.length,                                        color:"#4f46e5" },
          { label:"KPI-Linked",  value:plans.filter(p=>p.plan_type==="kpi_linked").length,  color:"#7c3aed" },
          { label:"Standalone",  value:plans.filter(p=>p.plan_type==="standalone").length,  color:"#d97706" },
          { label:"Departments", value:[...new Set(plans.map(p=>p.department))].length,     color:"#16a34a" },
        ].map(s => (
          <div key={s.label} style={{ background:"#fff", borderRadius:12, padding:"16px 20px", border:"1px solid #e2e8f0" }}>
            <p style={{ margin:"0 0 4px", fontSize:11, color:"#94a3b8", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.05em" }}>{s.label}</p>
            <p style={{ margin:0, fontSize:26, fontWeight:800, color:s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Plan Cards */}
      {loading ? (
        <div style={{ textAlign:"center", padding:80, color:"#64748b" }}>
          <div style={{ width:36, height:36, border:"4px solid #e2e8f0", borderTopColor:"#4f46e5", borderRadius:"50%", animation:"spin 0.8s linear infinite", margin:"0 auto 12px" }} />
          Loading plans...
        </div>
      ) : plans.length === 0 ? (
        <div style={{ textAlign:"center", padding:80, background:"#fff", borderRadius:14, border:"1px solid #e2e8f0", color:"#94a3b8" }}>
          <div style={{ fontSize:48, marginBottom:12 }}>📋</div>
          <p style={{ fontWeight:700, fontSize:16, margin:"0 0 6px", color:"#475569" }}>No plans yet</p>
          <p style={{ fontSize:13, margin:0 }}>Click "New Plan" to define your first department incentive rule</p>
        </div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))", gap:16 }}>
          {plans.map(plan => {
            const { color, bg } = getColor(plan.department);
            const isKpi  = plan.plan_type === "kpi_linked";
            const period = periodLabel(plan);
            return (
              <div key={plan._id} className="plan-card" style={{ background:"#fff", borderRadius:14, border:"1px solid #e2e8f0", overflow:"hidden" }}>
                <div style={{ padding:"16px 20px", borderBottom:"1px solid #f1f5f9", display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <div style={{ width:40, height:40, borderRadius:10, background:bg, display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <HugeiconsIcon icon={Building04Icon} size={20} color={color} strokeWidth={1.8} />
                    </div>
                    <div>
                      <p style={{ margin:0, fontWeight:800, fontSize:15, color:"#1e293b" }}>{plan.name}</p>
                      <p style={{ margin:"3px 0 0", fontSize:12, display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
                        <span style={{ background:bg, color, fontWeight:700, padding:"1px 8px", borderRadius:5, fontSize:11 }}>{plan.department}</span>
                        <span style={{ color:"#94a3b8", display:"flex", alignItems:"center", gap:3 }}>
                          <HugeiconsIcon icon={Calendar01Icon} size={11} color="#94a3b8" strokeWidth={2} />
                          {period}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:6 }}>
                    <span style={{ fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:20, background:isKpi?"#ede9fe":"#fef9c3", color:isKpi?"#7c3aed":"#a16207" }}>
                      {isKpi ? "🔗 KPI-Linked" : "📋 Standalone"}
                    </span>
                    <div style={{ display:"flex", gap:6 }}>
                      <button onClick={() => openEdit(plan)} style={{ background:"#eff6ff", border:"none", borderRadius:7, padding:"6px 10px", cursor:"pointer" }}>
                        <HugeiconsIcon icon={PencilEdit01Icon} size={14} color="#2563eb" strokeWidth={2} />
                      </button>
                      <button onClick={() => handleDelete(plan._id)} style={{ background:"#fef2f2", border:"none", borderRadius:7, padding:"6px 10px", cursor:"pointer" }}>
                        <HugeiconsIcon icon={Delete02Icon} size={14} color="#dc2626" strokeWidth={2} />
                      </button>
                    </div>
                  </div>
                </div>

                {isKpi && (
                  <div style={{ padding:"12px 20px" }}>
                    {plan.kpi_template_id && (
                      <p style={{ margin:"0 0 8px", fontSize:12, color:"#7c3aed", fontWeight:700 }}>
                        🎯 {plan.kpi_template_id?.template_name} · {plan.kpi_configs?.length || 0} KPIs configured
                      </p>
                    )}
                    {(plan.kpi_configs || []).slice(0, 3).map((cfg, i) => (
                      <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"4px 0", borderBottom:"1px dashed #f1f5f9", fontSize:12 }}>
                        <span style={{ color:"#475569", fontWeight:500 }}>{cfg.kpi_name}</span>
                        <span style={{ color:"#64748b" }}>{cfg.rule_label || "—"}</span>
                      </div>
                    ))}
                    {plan.kpi_configs?.length > 3 && (
                      <p style={{ margin:"6px 0 0", fontSize:11, color:"#94a3b8" }}>+{plan.kpi_configs.length - 3} more KPIs</p>
                    )}
                    {/* ── UPDATED card badge: shows ALL KPIs wording ── */}
                    {plan.completion_reward_type !== "none" && (
                      <div style={{ marginTop:8, background:"#fef9c3", borderRadius:7, padding:"6px 10px", fontSize:12, fontWeight:700, color:"#92400e" }}>
                        🏆 All-KPI Bonus: {plan.completion_reward_type === "fixed"
                          ? `₹${Number(plan.completion_reward_value).toLocaleString("en-IN")}`
                          : `${plan.completion_reward_value}% of Salary`}
                        {plan.completion_reward_label ? ` · ${plan.completion_reward_label}` : ""}
                      </div>
                    )}
                  </div>
                )}

                {!isKpi && (
                  <div style={{ padding:"12px 20px" }}>
                    <p style={{ margin:0, fontSize:12, color:"#92400e", fontWeight:700 }}>
                      💰 {plan.standalone_payout_type === "percentage"
                        ? `${plan.standalone_payout_value}% of Salary`
                        : `₹${Number(plan.standalone_payout_value).toLocaleString("en-IN")} Fixed`}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL
          ══════════════════════════════════════════════════════════════════════ */}
      {showForm && (
        <div style={{ position:"fixed", inset:0, background:"rgba(15,23,42,0.55)", zIndex:2000, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
          <div style={{ background:"#fff", borderRadius:18, width:"100%", maxWidth:700, maxHeight:"93vh", overflowY:"auto", boxShadow:"0 24px 64px rgba(0,0,0,0.22)", animation:"fadeIn 0.2s ease" }}>

            {/* Modal Header */}
            <div style={{ padding:"20px 26px", borderBottom:"1px solid #f1f5f9", display:"flex", justifyContent:"space-between", alignItems:"center", position:"sticky", top:0, background:"#fff", zIndex:10, borderRadius:"18px 18px 0 0" }}>
              <div>
                <h3 style={{ margin:0, fontSize:17, fontWeight:800, color:"#1e293b" }}>
                  {editId ? "Edit Incentive Plan" : "New Incentive Plan"}
                </h3>
                <p style={{ margin:"2px 0 0", fontSize:12, color:"#94a3b8" }}>Configure KPI targets, slabs & rewards</p>
              </div>
              <button onClick={() => setShowForm(false)} style={{ background:"#f1f5f9", border:"none", borderRadius:8, padding:"6px 14px", cursor:"pointer", fontWeight:700, fontSize:14, color:"#475569" }}>✕</button>
            </div>

            <div style={{ padding:"22px 26px", display:"flex", flexDirection:"column", gap:24 }}>

              {/* STEP 1: Basic Info */}
              <Section step={1} title="Basic Information" icon="📝">
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                  <div style={{ gridColumn:"1/-1" }}>
                    <label style={lbl}>Plan Name *</label>
                    <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                      placeholder="e.g. Sales Q1 2025 Incentive" style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Department *</label>
                    <select value={form.department}
                      onChange={e => setForm(f => ({ ...f, department: e.target.value, kpi_template_id:"", selected_kpis:[], kpi_configs:[] }))}
                      style={inp}>
                      <option value="">Select department...</option>
                      {depts.map(d => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={lbl}>Plan Type *</label>
                    <div style={{ display:"flex", gap:8 }}>
                      {[{ val:"kpi_linked", label:"🔗 KPI-Linked" }, { val:"standalone", label:"📋 Standalone" }].map(opt => (
                        <div key={opt.val} onClick={() => setForm(f => ({ ...f, plan_type: opt.val }))}
                          style={{ flex:1, padding:"9px 12px", borderRadius:9, cursor:"pointer", textAlign:"center", fontSize:13, fontWeight:700, transition:"all 0.15s",
                            border:   form.plan_type===opt.val ? "2px solid #4f46e5" : "2px solid #e2e8f0",
                            background: form.plan_type===opt.val ? "#eef2ff" : "#fafafa",
                            color:    form.plan_type===opt.val ? "#4f46e5" : "#64748b" }}>
                          {opt.label}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Section>

              {/* STEP 2: Time Period */}
              <Section step={2} title="Time Period" icon="📅">
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))", gap:12 }}>
                  <div>
                    <label style={lbl}>Period Type</label>
                    <select value={form.period_type} onChange={e => setForm({ ...form, period_type: e.target.value })} style={inp}>
                      <option>Monthly</option><option>Quarterly</option><option>Half-Yearly</option><option>Yearly</option>
                    </select>
                  </div>
                  {form.period_type === "Monthly" && (
                    <div>
                      <label style={lbl}>Month</label>
                      <select value={form.period_month} onChange={e => setForm({ ...form, period_month: Number(e.target.value) })} style={inp}>
                        {MONTHS.map((m,i) => <option key={m} value={i+1}>{m}</option>)}
                      </select>
                    </div>
                  )}
                  {form.period_type === "Quarterly" && (
                    <div>
                      <label style={lbl}>Quarter</label>
                      <select value={form.period_quarter} onChange={e => setForm({ ...form, period_quarter: e.target.value })} style={inp}>
                        {["Q1","Q2","Q3","Q4"].map(q => <option key={q}>{q}</option>)}
                      </select>
                    </div>
                  )}
                  {form.period_type === "Half-Yearly" && (
                    <div>
                      <label style={lbl}>Half</label>
                      <select value={form.period_half} onChange={e => setForm({ ...form, period_half: e.target.value })} style={inp}>
                        <option>H1</option><option>H2</option>
                      </select>
                    </div>
                  )}
                  <div>
                    <label style={lbl}>Year</label>
                    <select value={form.period_year} onChange={e => setForm({ ...form, period_year: Number(e.target.value) })} style={inp}>
                      {YEARS.map(y => <option key={y}>{y}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ marginTop:10, display:"inline-flex", alignItems:"center", gap:6, background:"#eef2ff", borderRadius:20, padding:"5px 14px", fontSize:13, fontWeight:700, color:"#4f46e5" }}>
                  <HugeiconsIcon icon={Calendar01Icon} size={14} color="#4f46e5" strokeWidth={2} />
                  Period: {periodLabel(form)}
                </div>
              </Section>

              {/* KPI-LINKED STEPS */}
              {form.plan_type === "kpi_linked" && (<>

                {/* STEP 3: Select KPIs */}
                <Section step={3} title="Select KPIs" icon="🎯">
                  <div style={{ marginBottom:14 }}>
                    <label style={lbl}>KPI Template *</label>
                    <select value={form.kpi_template_id} onChange={e => handleTemplateChange(e.target.value)} style={inp} disabled={!form.department}>
                      <option value="">{!form.department ? "Select department first" : filteredTemplates.length === 0 ? "No templates for this department" : "Choose a KPI template..."}</option>
                      {filteredTemplates.map(t => <option key={t._id} value={t._id}>{t.template_name} — {t.role}</option>)}
                    </select>
                  </div>

                  {selectedTemplate && (<>
                    <p style={{ margin:"0 0 10px", fontSize:12, color:"#64748b" }}>
                      Check the KPIs you want to include in this incentive plan:
                    </p>
                    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                      {selectedTemplate.kpi_items?.map(item => {
                        const isChecked = form.selected_kpis.includes(item.kpi_name);
                        return (
                          <div key={item.kpi_name} className="checkbox-kpi" onClick={() => toggleKpi(item)}
                            style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 14px", borderRadius:10, transition:"all 0.15s",
                              border:     isChecked ? "2px solid #4f46e5" : "2px solid #e2e8f0",
                              background: isChecked ? "#eef2ff" : "#fafafa" }}>
                            <div style={{ width:20, height:20, borderRadius:5, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.15s",
                              border:     isChecked ? "2px solid #4f46e5" : "2px solid #cbd5e1",
                              background: isChecked ? "#4f46e5" : "#fff" }}>
                              {isChecked && <span style={{ color:"#fff", fontSize:12, fontWeight:800 }}>✓</span>}
                            </div>
                            <span style={{ flex:1, fontSize:13, fontWeight: isChecked ? 700 : 500, color: isChecked ? "#3730a3" : "#475569" }}>
                              {item.kpi_name}
                            </span>
                            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                              <div style={{ width:60, height:5, background:"#e2e8f0", borderRadius:99, overflow:"hidden" }}>
                                <div style={{ width:`${item.weight}%`, height:"100%", borderRadius:99, background: isChecked ? "#4f46e5" : "#94a3b8", transition:"background 0.15s" }} />
                              </div>
                              <span style={{ fontSize:12, fontWeight:700, minWidth:32, color: isChecked ? "#4f46e5" : "#94a3b8" }}>{item.weight}%</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {form.selected_kpis.length > 0 && (
                      <div style={{ marginTop:12, padding:"10px 14px", borderRadius:9, display:"flex", justifyContent:"space-between", alignItems:"center",
                        background: totalWeight === 100 ? "#f0fdf4" : "#fff7ed",
                        border:     `1px solid ${totalWeight === 100 ? "#86efac" : "#fed7aa"}` }}>
                        <span style={{ fontSize:12, fontWeight:600, color: totalWeight === 100 ? "#15803d" : "#c2410c" }}>
                          {totalWeight === 100 ? "✅ Weight total is 100%" : `⚠ Selected weight total: ${totalWeight}%`}
                        </span>
                        <span style={{ fontSize:12, color:"#64748b" }}>
                          {form.selected_kpis.length} / {totalTemplateKpis} KPIs selected
                        </span>
                      </div>
                    )}
                  </>)}
                </Section>

                {/* STEP 4: Configure Each KPI */}
                {form.kpi_configs.length > 0 && (
                  <Section step={4} title="Configure Each KPI" icon="⚙️">
                    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                      {form.kpi_configs.map(cfg => {
                        const slabErrors = validateSlabs(cfg.slabs);
                        return (
                          <div key={cfg.kpi_name} className="kpi-card" style={{ border:"1.5px solid #e2e8f0", borderRadius:12, overflow:"hidden" }}>
                            <div style={{ padding:"12px 16px", background:"#f8fafc", borderBottom:"1px solid #e2e8f0", display:"flex", alignItems:"center", gap:8 }}>
                              <HugeiconsIcon icon={Target01Icon} size={16} color="#4f46e5" strokeWidth={2} />
                              <span style={{ fontWeight:800, fontSize:14, color:"#1e293b" }}>{cfg.kpi_name}</span>
                              <span style={{ fontSize:11, padding:"2px 8px", background:"#eef2ff", color:"#4f46e5", borderRadius:20, fontWeight:700 }}>Weight: {cfg.weight}%</span>
                            </div>
                            <div style={{ padding:"14px 16px", display:"flex", flexDirection:"column", gap:12 }}>
                              <div style={{ display:"grid", gridTemplateColumns:"1fr 140px 150px", gap:10 }}>
                                <div>
                                  <label style={lbl}>Target Value *</label>
                                  <input value={cfg.target} onChange={e => updateKpiConfig(cfg.kpi_name, "target", e.target.value)} placeholder="e.g. 120" style={inp} />
                                </div>
                                <div>
                                  <label style={lbl}>Value Type</label>
                                  <select value={cfg.value_type} onChange={e => updateKpiConfig(cfg.kpi_name, "value_type", e.target.value)} style={inp}>
                                    {VALUE_TYPES.map(vt => <option key={vt.value} value={vt.value}>{vt.label}</option>)}
                                  </select>
                                </div>
                                <div>
                                  <label style={lbl}>Operator</label>
                                  <select value={cfg.operator} onChange={e => updateKpiConfig(cfg.kpi_name, "operator", e.target.value)} style={inp}>
                                    {OPERATORS.map(op => <option key={op.value} value={op.value}>{op.label}</option>)}
                                  </select>
                                </div>
                              </div>
                              {cfg.rule_label && (
                                <div style={{ padding:"8px 12px", background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:8, fontSize:12, fontWeight:700, color:"#15803d" }}>
                                  📌 Rule: Achieve <strong>{cfg.kpi_name}</strong> {cfg.rule_label}
                                </div>
                              )}
                              <div>
                                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                                  <label style={{ ...lbl, margin:0 }}>Score → Payout Slabs</label>
                                  <button onClick={() => addSlabToKpi(cfg.kpi_name)}
                                    style={{ background:"#eef2ff", border:"none", borderRadius:7, padding:"5px 12px", fontSize:11, fontWeight:700, color:"#4f46e5", cursor:"pointer" }}>
                                    + Add Slab
                                  </button>
                                </div>
                                {slabErrors.length > 0 && (
                                  <div style={{ background:"#fef2f2", border:"1px solid #fecaca", borderRadius:7, padding:"7px 12px", marginBottom:8 }}>
                                    {slabErrors.map((e,i) => <p key={i} style={{ margin:"2px 0", fontSize:11, color:"#dc2626", fontWeight:600 }}>⚠ {e}</p>)}
                                  </div>
                                )}
                                {cfg.slabs.length === 0 ? (
                                  <p style={{ fontSize:12, color:"#94a3b8", fontStyle:"italic", margin:0 }}>No slabs yet — click "+ Add Slab" to define score ranges and payouts</p>
                                ) : (
                                  <>
                                    <div style={{ display:"grid", gridTemplateColumns:"65px 65px 110px 1fr 32px", gap:8, marginBottom:6 }}>
                                      {["Min %","Max %","Type","Amount / %",""].map(h => (
                                        <span key={h} style={{ fontSize:10, fontWeight:700, color:"#94a3b8", textTransform:"uppercase" }}>{h}</span>
                                      ))}
                                    </div>
                                    {cfg.slabs.map((slab, si) => (
                                      <div key={si} className="slab-row" style={{ display:"grid", gridTemplateColumns:"65px 65px 110px 1fr 32px", gap:8, marginBottom:7, alignItems:"center" }}>
                                        <input type="number" min="0" max="100" value={slab.min_score} onChange={e => updateKpiSlab(cfg.kpi_name, si, "min_score", e.target.value)} style={{ ...inp, padding:"7px 8px", fontSize:12 }} />
                                        <input type="number" min="0" max="100" value={slab.max_score} onChange={e => updateKpiSlab(cfg.kpi_name, si, "max_score", e.target.value)} style={{ ...inp, padding:"7px 8px", fontSize:12 }} />
                                        <select value={slab.type} onChange={e => updateKpiSlab(cfg.kpi_name, si, "type", e.target.value)} style={{ ...inp, padding:"7px 8px", fontSize:12 }}>
                                          <option value="none">No Bonus</option>
                                          <option value="fixed">Fixed ₹</option>
                                          <option value="percentage">% Salary</option>
                                        </select>
                                        <input type="number" min="0" value={slab.value} disabled={slab.type === "none"}
                                          onChange={e => updateKpiSlab(cfg.kpi_name, si, "value", e.target.value)}
                                          placeholder={slab.type === "percentage" ? "e.g. 5" : "e.g. 3000"}
                                          style={{ ...inp, padding:"7px 8px", fontSize:12, background: slab.type==="none" ? "#f8fafc" : "#fff", color: slab.type==="none" ? "#94a3b8" : "#1e293b" }} />
                                        <button onClick={() => removeKpiSlab(cfg.kpi_name, si)}
                                          style={{ background:"#fef2f2", border:"none", borderRadius:7, padding:"7px", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                                          <HugeiconsIcon icon={Delete02Icon} size={13} color="#dc2626" strokeWidth={2} />
                                        </button>
                                      </div>
                                    ))}
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Section>
                )}

                {/* ── STEP 5: Completion Reward ── UPDATED SECTION ── */}
                {form.kpi_configs.length > 0 && (
                  <Section step={5} title="Completion Reward" icon="🏆">

                    <div style={{ background:"#fffbeb", border:"1px solid #fde68a", borderRadius:10, padding:"12px 14px", marginBottom:14 }}>
                      <p style={{ margin:0, fontSize:13, color:"#92400e", fontWeight:600 }}>
                        🎯 If an employee achieves <strong>100%</strong> across <strong>ALL KPIs</strong>, award this bonus reward:
                      </p>
                    </div>

                    {/* Reward inputs */}
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
                      <div>
                        <label style={lbl}>Reward Type</label>
                        <select value={form.completion_reward_type}
                          onChange={e => setForm({ ...form, completion_reward_type: e.target.value })} style={inp}>
                          <option value="none">No Reward</option>
                          <option value="fixed">Fixed Amount ₹</option>
                          <option value="percentage">% of Salary</option>
                        </select>
                      </div>
                      {form.completion_reward_type !== "none" && (<>
                        <div>
                          <label style={lbl}>{form.completion_reward_type === "fixed" ? "Amount (₹)" : "Percentage (%)"}</label>
                          <input type="number" min="0"
                            value={form.completion_reward_value}
                            onChange={e => setForm({ ...form, completion_reward_value: Number(e.target.value) })}
                            placeholder={form.completion_reward_type === "fixed" ? "e.g. 10000" : "e.g. 5"}
                            style={inp} />
                        </div>
                        <div>
                          <label style={lbl}>Reward Label</label>
                          <input value={form.completion_reward_label}
                            onChange={e => setForm({ ...form, completion_reward_label: e.target.value })}
                            placeholder="e.g. Star Performer Bonus" style={inp} />
                        </div>
                      </>)}
                    </div>

                    {form.completion_reward_type !== "none" && form.completion_reward_value > 0 && (
                      <div style={{ marginTop:12, padding:"10px 14px", background:"#f0fdf4", border:"1px solid #86efac", borderRadius:9, display:"flex", alignItems:"center", gap:10 }}>
                        <HugeiconsIcon icon={Award01Icon} size={18} color="#16a34a" strokeWidth={2} />
                        <span style={{ fontSize:13, fontWeight:700, color:"#15803d" }}>
                          {form.completion_reward_label || "Completion Bonus"}:{" "}
                          {form.completion_reward_type === "fixed"
                            ? `₹${Number(form.completion_reward_value).toLocaleString("en-IN")}`
                            : `${form.completion_reward_value}% of salary`}
                          {" "}· awarded when ALL KPIs score ≥ 100%
                        </span>
                      </div>
                    )}
                  </Section>
                )}

              </>)}

              {/* STANDALONE */}
              {form.plan_type === "standalone" && (
                <Section step={3} title="Payout Configuration" icon="💰">
                  <div style={{ background:"#fffbeb", border:"1px solid #fde68a", borderRadius:10, padding:"12px 14px", marginBottom:14 }}>
                    <p style={{ margin:0, fontSize:13, color:"#92400e", fontWeight:600 }}>📋 Standalone Plan</p>
                    <p style={{ margin:"4px 0 0", fontSize:12, color:"#b45309" }}>Payout is not linked to KPI scores. HR enters results manually each cycle.</p>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14 }}>
                    <div>
                      <label style={lbl}>Metric / Trigger</label>
                      <select value={form.standalone_metric} onChange={e => setForm({ ...form, standalone_metric: e.target.value })} style={inp}>
                        <option value="manual">Manual Entry</option>
                        <option value="attendance">Attendance %</option>
                        <option value="custom">Custom Metric</option>
                      </select>
                    </div>
                    {form.standalone_metric === "custom" && (
                      <div>
                        <label style={lbl}>Custom Metric Name</label>
                        <input value={form.standalone_metric_label} onChange={e => setForm({ ...form, standalone_metric_label: e.target.value })} placeholder="e.g. Client Satisfaction Score" style={inp} />
                      </div>
                    )}
                    <div>
                      <label style={lbl}>Payout Type *</label>
                      <select value={form.standalone_payout_type} onChange={e => setForm({ ...form, standalone_payout_type: e.target.value })} style={inp}>
                        <option value="fixed">Fixed Amount (₹)</option>
                        <option value="percentage">% of Salary</option>
                      </select>
                    </div>
                    <div>
                      <label style={lbl}>{form.standalone_payout_type === "fixed" ? "Amount (₹) *" : "Percentage (%) *"}</label>
                      <input type="number" min="0" value={form.standalone_payout_value}
                        onChange={e => setForm({ ...form, standalone_payout_value: Number(e.target.value) })}
                        placeholder={form.standalone_payout_type === "fixed" ? "e.g. 5000" : "e.g. 8"} style={inp} />
                    </div>
                  </div>
                  {form.standalone_payout_value > 0 && (
                    <div style={{ padding:"10px 14px", background:"#f0fdf4", border:"1px solid #86efac", borderRadius:9, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <span style={{ fontSize:13, color:"#374151", fontWeight:600 }}>Each eligible employee receives</span>
                      <span style={{ fontSize:17, fontWeight:800, color:"#16a34a" }}>
                        {form.standalone_payout_type === "fixed"
                          ? `₹${Number(form.standalone_payout_value).toLocaleString("en-IN")}`
                          : `${form.standalone_payout_value}% of salary`}
                      </span>
                    </div>
                  )}
                </Section>
              )}

              {/* Actions */}
              <div style={{ display:"flex", gap:10, justifyContent:"flex-end", borderTop:"1px solid #f1f5f9", paddingTop:16 }}>
                <button onClick={() => setShowForm(false)} style={{ padding:"10px 20px", background:"#f1f5f9", border:"none", borderRadius:9, fontWeight:700, fontSize:14, cursor:"pointer", color:"#475569" }}>
                  Cancel
                </button>
                <button onClick={handleSave} disabled={saving} style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 24px", color:"#fff", border:"none", borderRadius:9, fontWeight:700, fontSize:14, boxShadow:"0 2px 8px rgba(79,70,229,0.3)",
                  background: saving ? "#a5b4fc" : "#4f46e5", cursor: saving ? "not-allowed" : "pointer" }}>
                  <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} color="#fff" strokeWidth={2} />
                  {saving ? "Saving..." : editId ? "Update Plan" : "Create Plan"}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Section wrapper ───────────────────────────────────────────────────────────
function Section({ step, title, icon, children }) {
  return (
    <div style={{ border:"1.5px solid #e2e8f0", borderRadius:14, overflow:"hidden" }}>
      <div style={{ padding:"12px 18px", background:"#f8fafc", borderBottom:"1.5px solid #e2e8f0", display:"flex", alignItems:"center", gap:10 }}>
        <div style={{ width:24, height:24, borderRadius:"50%", background:"#4f46e5", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:800, color:"#fff", flexShrink:0 }}>
          {step}
        </div>
        <span style={{ fontSize:14, fontWeight:800, color:"#1e293b" }}>{icon} {title}</span>
      </div>
      <div style={{ padding:"16px 18px" }}>{children}</div>
    </div>
  );
}