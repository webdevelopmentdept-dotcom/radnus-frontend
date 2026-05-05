import { useState, useEffect } from "react";
import axios from "axios";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  PlusSignIcon, Delete02Icon, PencilEdit01Icon,
  CheckmarkCircle01Icon, Building04Icon,
} from "@hugeicons/core-free-icons";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const inputStyle = {
  width: "100%", padding: "9px 12px", border: "1px solid #d1d5db",
  borderRadius: 8, fontSize: 13, color: "#1a1a2e", background: "#fff",
  boxSizing: "border-box", outline: "none",
};
const labelStyle = {
  display: "block", fontSize: 12, fontWeight: 700,
  color: "#374151", marginBottom: 6,
};

const DEFAULT_SLABS = [
  { min_score: 0,  max_score: 50,  type: "none",       value: 0 },
  { min_score: 51, max_score: 75,  type: "fixed",      value: 2000 },
  { min_score: 76, max_score: 90,  type: "fixed",      value: 5000 },
  { min_score: 91, max_score: 100, type: "percentage", value: 10  },
];

const EMPTY_FORM = {
  name: "", department: "", cycle: "Monthly",
  plan_type: "kpi_linked",
  kpi_template_id: "",
  slabs: DEFAULT_SLABS,
  // Standalone-specific fields
  standalone_payout_type:   "fixed",   // "fixed" | "percentage"
  standalone_payout_value:  0,
  standalone_metric:        "manual",  // "manual" | "attendance" | "custom"
  standalone_metric_label:  "",        // shown when metric = "custom"
};

const DEPT_COLORS = {
  Sales:       { color: "#2563eb", bg: "#eff6ff" },
  Engineering: { color: "#7c3aed", bg: "#f5f3ff" },
  Marketing:   { color: "#d97706", bg: "#fffbeb" },
  HR:          { color: "#16a34a", bg: "#f0fdf4" },
  Finance:     { color: "#ea580c", bg: "#fff7ed" },
  Operations:  { color: "#0891b2", bg: "#ecfeff" },
};
const getColor = (dept) => DEPT_COLORS[dept] || { color: "#6b7280", bg: "#f3f4f6" };

// ── Slab validator ──────────────────────────────────────────────────────────
function validateSlabs(slabs) {
  const errors = [];
  slabs.forEach((s, i) => {
    if (s.min_score > s.max_score)
      errors.push(`Slab ${i + 1}: Min > Max`);
    if (s.type !== "none" && s.value <= 0)
      errors.push(`Slab ${i + 1}: Value must be > 0`);
  });
  // check overlaps
  for (let i = 0; i < slabs.length; i++) {
    for (let j = i + 1; j < slabs.length; j++) {
      if (slabs[i].max_score >= slabs[j].min_score && slabs[i].min_score <= slabs[j].max_score)
        errors.push(`Slabs ${i + 1} & ${j + 1} overlap`);
    }
  }
  return errors;
}

// ── Payout calculator ───────────────────────────────────────────────────────
function calcPayout(slabs, score, salary = 50000) {
  const s = Math.round(score);
  const slab = slabs.find(sl => s >= sl.min_score && s <= sl.max_score);
  if (!slab || slab.type === "none") return { amount: 0, label: "No Bonus" };
  const amount = slab.type === "percentage"
    ? Math.round((slab.value / 100) * salary)
    : slab.value;
  return {
    amount,
    label: slab.type === "percentage"
      ? `${slab.value}% of ₹${salary.toLocaleString("en-IN")} = ₹${amount.toLocaleString("en-IN")}`
      : `₹${amount.toLocaleString("en-IN")} (Fixed)`,
  };
}

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
  const [slabErrors,   setSlabErrors]   = useState([]);
  // Simulator
  const [simScore,     setSimScore]     = useState(80);
  const [simSalary,    setSimSalary]    = useState(50000);
  const [showSim,      setShowSim]      = useState(false);

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
      setDepts(list.map((x) => (typeof x === "string" ? x : x.name)));
      if (k.data?.success) setKpiTemplates(k.data.data || []);
    } catch { showToast("Failed to load", "error"); }
    finally   { setLoading(false); }
  };

  const filteredTemplates = kpiTemplates.filter(
    t => !form.department || t.department === form.department
  );

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const updateSlab = (i, field, val) => {
    const slabs = [...form.slabs];
    slabs[i] = { ...slabs[i], [field]: field === "type" ? val : Number(val) };
    setForm({ ...form, slabs });
    setSlabErrors(validateSlabs(slabs));
  };

  const addSlab = () => {
    const last = form.slabs[form.slabs.length - 1];
    const newMin = last ? last.max_score + 1 : 0;
    setForm({ ...form, slabs: [...form.slabs, { min_score: newMin, max_score: Math.min(newMin + 10, 100), type: "fixed", value: 0 }] });
  };

  const removeSlab = (i) => {
    const slabs = form.slabs.filter((_, idx) => idx !== i);
    setForm({ ...form, slabs });
    setSlabErrors(validateSlabs(slabs));
  };

  const openCreate = () => {
    setForm(EMPTY_FORM); setEditId(null); setShowForm(true);
    setSlabErrors([]); setShowSim(false);
  };

  const openEdit = (p) => {
    setForm({
      name:                   p.name,
      department:             p.department,
      cycle:                  p.cycle,
      plan_type:              p.plan_type ?? "standalone",
      kpi_template_id:        p.kpi_template_id?._id || p.kpi_template_id || "",
      slabs:                  p.slabs?.length ? p.slabs : DEFAULT_SLABS,
      standalone_payout_type:  p.standalone_payout_type  || "fixed",
      standalone_payout_value: p.standalone_payout_value || 0,
      standalone_metric:       p.standalone_metric       || "manual",
      standalone_metric_label: p.standalone_metric_label || "",
    });
    setEditId(p._id);
    setShowForm(true);
    setSlabErrors([]);
    setShowSim(false);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.department) {
      showToast("Name & department required", "error"); return;
    }
    if (form.plan_type === "kpi_linked" && !form.kpi_template_id) {
      showToast("Please select a KPI template", "error"); return;
    }
    if (form.plan_type === "kpi_linked") {
      const errs = validateSlabs(form.slabs);
      if (errs.length) { showToast(errs[0], "error"); return; }
    }
    if (form.plan_type === "standalone" && form.standalone_payout_value <= 0) {
      showToast("Payout value must be > 0 for standalone plan", "error"); return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        kpi_template_id:        form.plan_type === "standalone" ? null : form.kpi_template_id,
        standalone_payout_type:  form.plan_type === "standalone" ? form.standalone_payout_type  : null,
        standalone_payout_value: form.plan_type === "standalone" ? form.standalone_payout_value : null,
        standalone_metric:       form.plan_type === "standalone" ? form.standalone_metric       : null,
        standalone_metric_label: form.plan_type === "standalone" ? form.standalone_metric_label : null,
        // For standalone, still save slabs array but empty so results engine doesn't use them
        slabs: form.plan_type === "standalone" ? [] : form.slabs,
      };

      if (editId) await axios.put(`${API_BASE}/api/incentive-plans/${editId}`, payload);
      else        await axios.post(`${API_BASE}/api/incentive-plans`, payload);
      showToast(editId ? "Updated ✅" : "Created ✅");
      setShowForm(false); fetchAll();
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

  const selectedTemplate = kpiTemplates.find(t => t._id === form.kpi_template_id);
  const simResult = form.plan_type === "kpi_linked"
    ? calcPayout(form.slabs, simScore, simSalary)
    : { amount: form.standalone_payout_type === "percentage" ? Math.round((form.standalone_payout_value / 100) * simSalary) : form.standalone_payout_value, label: form.standalone_payout_type === "percentage" ? `${form.standalone_payout_value}% of ₹${simSalary.toLocaleString("en-IN")}` : `₹${Number(form.standalone_payout_value).toLocaleString("en-IN")} (Fixed)` };

  return (
    <div style={{ padding: "28px 32px", fontFamily: "'Segoe UI',sans-serif", minHeight: "100vh", background: "#f4f6fb" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        .plan-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.08); transform: translateY(-1px); transition: all 0.15s; }
        .plan-card { transition: all 0.15s; }
        .slab-row { animation: fadeIn 0.15s ease; }
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", top: 20, right: 16, zIndex: 9999, background: toast.type === "error" ? "#ff4d4f" : "#52c41a", color: "#fff", padding: "12px 20px", borderRadius: 8, fontWeight: 500, fontSize: 14, boxShadow: "0 4px 16px rgba(0,0,0,0.15)", animation: "fadeIn 0.2s ease" }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#1a1a2e" }}>Incentive Plans</h2>
          <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 14 }}>
            Department-wise slab rules — KPI-linked or standalone
          </p>
        </div>
        <button onClick={openCreate} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", background: "#1d4ed8", color: "#fff", border: "none", borderRadius: 9, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
          <HugeiconsIcon icon={PlusSignIcon} size={16} color="#fff" strokeWidth={2} />
          New Plan
        </button>
      </div>

      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Total Plans",  value: plans.length,                                       color: "#2563eb" },
          { label: "KPI-Linked",   value: plans.filter(p => p.plan_type === "kpi_linked").length, color: "#7c3aed" },
          { label: "Standalone",   value: plans.filter(p => p.plan_type === "standalone").length,  color: "#d97706" },
          { label: "Departments",  value: [...new Set(plans.map(p => p.department))].length,       color: "#16a34a" },
        ].map(s => (
          <div key={s.label} style={{ background: "#fff", borderRadius: 12, padding: "16px 20px", border: "1px solid #e5e7eb" }}>
            <p style={{ margin: "0 0 4px", fontSize: 11, color: "#6b7280", fontWeight: 700, textTransform: "uppercase" }}>{s.label}</p>
            <p style={{ margin: 0, fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Plan Cards */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 80, color: "#6b7280" }}>
          <div style={{ width: 36, height: 36, border: "4px solid #e5e7eb", borderTopColor: "#1d4ed8", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
          Loading plans...
        </div>
      ) : plans.length === 0 ? (
        <div style={{ textAlign: "center", padding: 80, background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", color: "#9ca3af" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
          <p style={{ fontWeight: 700, fontSize: 16, margin: "0 0 6px" }}>No plans yet</p>
          <p style={{ fontSize: 13, margin: 0 }}>Click "New Plan" to define your first department incentive rule</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(340px,1fr))", gap: 16 }}>
          {plans.map(plan => {
            const { color, bg } = getColor(plan.department);
            const isKpiLinked = plan.plan_type === "kpi_linked";
            return (
              <div key={plan._id} className="plan-card" style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", overflow: "hidden" }}>

                {/* Card top */}
                <div style={{ padding: "16px 20px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <HugeiconsIcon icon={Building04Icon} size={20} color={color} strokeWidth={1.8} />
                    </div>
                    <div>
                      <p style={{ margin: 0, fontWeight: 800, fontSize: 15, color: "#1a1a2e" }}>{plan.name}</p>
                      <p style={{ margin: "3px 0 0", fontSize: 12 }}>
                        <span style={{ background: bg, color, fontWeight: 700, padding: "1px 8px", borderRadius: 5, fontSize: 11 }}>{plan.department}</span>
                        {" · "}
                        <span style={{ color: "#9ca3af" }}>{plan.cycle}</span>
                      </p>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
                      background: isKpiLinked ? "#ede9fe" : "#fef9c3",
                      color: isKpiLinked ? "#7c3aed" : "#a16207",
                    }}>
                      {isKpiLinked ? "🔗 KPI-Linked" : "📋 Standalone"}
                    </span>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => openEdit(plan)} style={{ background: "#eff6ff", border: "none", borderRadius: 7, padding: "6px 10px", cursor: "pointer" }}>
                        <HugeiconsIcon icon={PencilEdit01Icon} size={14} color="#2563eb" strokeWidth={2} />
                      </button>
                      <button onClick={() => handleDelete(plan._id)} style={{ background: "#fef2f2", border: "none", borderRadius: 7, padding: "6px 10px", cursor: "pointer" }}>
                        <HugeiconsIcon icon={Delete02Icon} size={14} color="#dc2626" strokeWidth={2} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* KPI Template info */}
                {isKpiLinked && plan.kpi_template_id && (
                  <div style={{ padding: "10px 20px", background: "#f5f3ff", borderBottom: "1px solid #ede9fe" }}>
                    <p style={{ margin: 0, fontSize: 12, color: "#7c3aed", fontWeight: 700 }}>
                      🎯 {plan.kpi_template_id?.template_name || plan.kpi_template_id}
                      <span style={{ fontWeight: 400, color: "#a78bfa", marginLeft: 6 }}>
                        ({plan.kpi_template_id?.role || ""})
                      </span>
                    </p>
                  </div>
                )}

                {/* Standalone config info */}
                {!isKpiLinked && plan.standalone_payout_value > 0 && (
                  <div style={{ padding: "10px 20px", background: "#fffbeb", borderBottom: "1px solid #fef3c7" }}>
                    <p style={{ margin: 0, fontSize: 12, color: "#92400e", fontWeight: 700 }}>
                      💰 Payout:{" "}
                      {plan.standalone_payout_type === "percentage"
                        ? `${plan.standalone_payout_value}% of Salary`
                        : `₹${Number(plan.standalone_payout_value).toLocaleString("en-IN")} Fixed`}
                      {" · "}
                      <span style={{ fontWeight: 400, color: "#b45309" }}>
                        Metric: {plan.standalone_metric === "custom" ? plan.standalone_metric_label : plan.standalone_metric || "manual"}
                      </span>
                    </p>
                  </div>
                )}

                {/* Slabs (KPI-linked only) */}
                {isKpiLinked && (
                  <div style={{ padding: "14px 20px" }}>
                    <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Incentive Slabs
                    </p>
                    {(plan.slabs || []).map((slab, i) => {
                      const sc = slab.type === "none" ? "#9ca3af" : slab.type === "percentage" ? "#16a34a" : "#d97706";
                      return (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: i < plan.slabs.length - 1 ? "1px dashed #f3f4f6" : "none" }}>
                          <span style={{ fontSize: 12, color: "#374151", fontWeight: 600 }}>
                            Score {slab.min_score}% – {slab.max_score}%
                          </span>
                          <span style={{ fontSize: 12, fontWeight: 800, color: sc }}>
                            {slab.type === "none" ? "No Bonus"
                              : slab.type === "percentage" ? `+${slab.value}% of Salary`
                              : `₹${Number(slab.value).toLocaleString("en-IN")}`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Standalone: no slabs, show a clean message */}
                {!isKpiLinked && (
                  <div style={{ padding: "14px 20px" }}>
                    <p style={{ margin: 0, fontSize: 12, color: "#9ca3af", fontStyle: "italic" }}>
                      Standalone plan — payout based on manager/HR manual input
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── MODAL ── */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 640, maxHeight: "92vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>

            {/* Modal header */}
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "#fff", zIndex: 1 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#1a1a2e" }}>
                  {editId ? "Edit Plan" : "New Incentive Plan"}
                </h3>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "#6b7280" }}>
                  Score slab → payout rules for a department
                </p>
              </div>
              <button onClick={() => setShowForm(false)} style={{ background: "#f3f4f6", border: "none", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontWeight: 700, fontSize: 13, color: "#374151" }}>✕</button>
            </div>

            <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 18 }}>

              {/* Plan Type Toggle */}
              <div>
                <label style={labelStyle}>Plan Type *</label>
                <div style={{ display: "flex", gap: 10 }}>
                  {[
                    { val: "kpi_linked", label: "🔗 KPI-Linked", desc: "Incentive triggers from KPI score slabs" },
                    { val: "standalone", label: "📋 Standalone",  desc: "Fixed/% payout — manual or attendance-based" },
                  ].map(opt => (
                    <div
                      key={opt.val}
                      onClick={() => setForm(f => ({ ...f, plan_type: opt.val, kpi_template_id: "" }))}
                      style={{
                        flex: 1, padding: "12px 14px", borderRadius: 10, cursor: "pointer",
                        border: form.plan_type === opt.val ? "2px solid #7c3aed" : "2px solid #e5e7eb",
                        background: form.plan_type === opt.val ? "#f5f3ff" : "#fafafa",
                        transition: "all 0.15s",
                      }}
                    >
                      <p style={{ margin: "0 0 3px", fontWeight: 700, fontSize: 13, color: form.plan_type === opt.val ? "#7c3aed" : "#374151" }}>{opt.label}</p>
                      <p style={{ margin: 0, fontSize: 11, color: "#9ca3af" }}>{opt.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Name */}
              <div>
                <label style={labelStyle}>Plan Name *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Sales Monthly Incentive" style={inputStyle} />
              </div>

              {/* Dept + Cycle */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label style={labelStyle}>Department *</label>
                  <select value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value, kpi_template_id: "" }))} style={inputStyle}>
                    <option value="">Select...</option>
                    {depts.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Cycle</label>
                  <select value={form.cycle} onChange={e => setForm({ ...form, cycle: e.target.value })} style={inputStyle}>
                    <option>Monthly</option>
                    <option>Quarterly</option>
                    <option>Half-Yearly</option>
                    <option>Yearly</option>
                  </select>
                </div>
              </div>

              {/* ── KPI-LINKED FIELDS ── */}
              {form.plan_type === "kpi_linked" && (<>

                {/* KPI Template */}
                <div>
                  <label style={labelStyle}>KPI Template *</label>
                  <select
                    value={form.kpi_template_id}
                    onChange={e => setForm({ ...form, kpi_template_id: e.target.value })}
                    style={inputStyle}
                    disabled={!form.department}
                  >
                    <option value="">
                      {!form.department
                        ? "Select department first"
                        : filteredTemplates.length === 0
                          ? "No templates for this department"
                          : "Select KPI Template"}
                    </option>
                    {filteredTemplates.map(t => (
                      <option key={t._id} value={t._id}>
                        {t.template_name} — {t.role}
                      </option>
                    ))}
                  </select>

                  {/* Template Preview */}
                  {selectedTemplate && (
                    <div style={{ marginTop: 10, background: "#f5f3ff", border: "1px solid #ede9fe", borderRadius: 10, padding: 14 }}>
                      <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 700, color: "#7c3aed" }}>
                        🎯 {selectedTemplate.template_name} — {selectedTemplate.kpi_items?.length} KPIs
                      </p>
                      {selectedTemplate.kpi_items?.map((item, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: "1px solid #ede9fe", fontSize: 12 }}>
                          <span style={{ color: "#374151", fontWeight: 500 }}>{item.kpi_name}</span>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ width: 60, height: 5, background: "#e5e7eb", borderRadius: 99, overflow: "hidden" }}>
                              <div style={{ width: `${item.weight}%`, height: "100%", background: "#7c3aed", borderRadius: 99 }} />
                            </div>
                            <span style={{ color: "#7c3aed", fontWeight: 700, minWidth: 30 }}>{item.weight}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Score Slabs */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <label style={{ ...labelStyle, margin: 0 }}>Score → Payout Slabs</label>
                    <button onClick={addSlab} style={{ background: "#eff6ff", border: "none", borderRadius: 7, padding: "5px 12px", fontSize: 12, fontWeight: 700, color: "#1d4ed8", cursor: "pointer" }}>
                      + Add Slab
                    </button>
                  </div>

                  {slabErrors.length > 0 && (
                    <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "8px 12px", marginBottom: 10 }}>
                      {slabErrors.map((e, i) => (
                        <p key={i} style={{ margin: "2px 0", fontSize: 12, color: "#dc2626", fontWeight: 600 }}>⚠ {e}</p>
                      ))}
                    </div>
                  )}

                  <div style={{ display: "grid", gridTemplateColumns: "70px 70px 115px 1fr 32px", gap: 8, marginBottom: 6 }}>
                    {["Min %", "Max %", "Type", "Amount / %", ""].map(h => (
                      <span key={h} style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase" }}>{h}</span>
                    ))}
                  </div>

                  {form.slabs.map((slab, i) => (
                    <div key={i} className="slab-row" style={{ display: "grid", gridTemplateColumns: "70px 70px 115px 1fr 32px", gap: 8, marginBottom: 8, alignItems: "center" }}>
                      <input type="number" min="0" max="100" value={slab.min_score}
                        onChange={e => updateSlab(i, "min_score", e.target.value)}
                        style={{ ...inputStyle, padding: "7px 8px", fontSize: 12 }} />
                      <input type="number" min="0" max="100" value={slab.max_score}
                        onChange={e => updateSlab(i, "max_score", e.target.value)}
                        style={{ ...inputStyle, padding: "7px 8px", fontSize: 12 }} />
                      <select value={slab.type} onChange={e => updateSlab(i, "type", e.target.value)}
                        style={{ ...inputStyle, padding: "7px 8px", fontSize: 12 }}>
                        <option value="none">No Bonus</option>
                        <option value="fixed">Fixed ₹</option>
                        <option value="percentage">% Salary</option>
                      </select>
                      <input type="number" min="0" value={slab.value}
                        disabled={slab.type === "none"}
                        onChange={e => updateSlab(i, "value", e.target.value)}
                        placeholder={slab.type === "percentage" ? "e.g. 5" : "e.g. 3000"}
                        style={{ ...inputStyle, padding: "7px 8px", fontSize: 12, background: slab.type === "none" ? "#f9fafb" : "#fff", color: slab.type === "none" ? "#9ca3af" : "#1a1a2e" }} />
                      <button onClick={() => removeSlab(i)} style={{ background: "#fef2f2", border: "none", borderRadius: 7, padding: "7px", cursor: "pointer" }}>
                        <HugeiconsIcon icon={Delete02Icon} size={14} color="#dc2626" strokeWidth={2} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Payout Simulator */}
                <div style={{ background: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
                  <button
                    onClick={() => setShowSim(!showSim)}
                    style={{ width: "100%", padding: "12px 16px", background: "none", border: "none", textAlign: "left", cursor: "pointer", fontWeight: 700, fontSize: 13, color: "#1d4ed8", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                  >
                    🧮 Payout Simulator
                    <span style={{ fontSize: 12, color: "#9ca3af" }}>{showSim ? "▲ Hide" : "▼ Show"}</span>
                  </button>
                  {showSim && (
                    <div style={{ padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <div>
                          <label style={labelStyle}>Test Score: <strong style={{ color: "#1d4ed8" }}>{simScore}%</strong></label>
                          <input type="range" min="0" max="100" value={simScore} onChange={e => setSimScore(Number(e.target.value))} style={{ width: "100%" }} />
                        </div>
                        <div>
                          <label style={labelStyle}>Monthly Salary (₹)</label>
                          <input type="number" value={simSalary} onChange={e => setSimSalary(Number(e.target.value))} style={{ ...inputStyle, padding: "7px 10px", fontSize: 12 }} />
                        </div>
                      </div>
                      <div style={{ background: simResult.amount > 0 ? "#f0fdf4" : "#f9fafb", border: `1px solid ${simResult.amount > 0 ? "#86efac" : "#e5e7eb"}`, borderRadius: 9, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 13, color: "#374151", fontWeight: 600 }}>Score {simScore}% → Payout</span>
                        <div style={{ textAlign: "right" }}>
                          <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: simResult.amount > 0 ? "#16a34a" : "#9ca3af" }}>
                            {simResult.amount > 0 ? `₹${simResult.amount.toLocaleString("en-IN")}` : "No Bonus"}
                          </p>
                          <p style={{ margin: 0, fontSize: 11, color: "#6b7280" }}>{simResult.label}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

              </>)}

              {/* ── STANDALONE FIELDS ── */}
              {form.plan_type === "standalone" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

                  {/* Info banner */}
                  <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, padding: "12px 16px" }}>
                    <p style={{ margin: 0, fontSize: 13, color: "#92400e", fontWeight: 600 }}>📋 Standalone Plan</p>
                    <p style={{ margin: "4px 0 0", fontSize: 12, color: "#b45309" }}>
                      Payout is not linked to KPI score. HR/manager enters results manually for each cycle.
                    </p>
                  </div>

                  {/* Metric type */}
                  <div>
                    <label style={labelStyle}>Metric / Trigger</label>
                    <select value={form.standalone_metric} onChange={e => setForm({ ...form, standalone_metric: e.target.value })} style={inputStyle}>
                      <option value="manual">Manual Entry (HR sets score each cycle)</option>
                      <option value="attendance">Attendance % (auto from attendance data)</option>
                      <option value="custom">Custom Metric</option>
                    </select>
                    {form.standalone_metric === "custom" && (
                      <input
                        value={form.standalone_metric_label}
                        onChange={e => setForm({ ...form, standalone_metric_label: e.target.value })}
                        placeholder="e.g. Client Satisfaction Score, Project Delivery Rate..."
                        style={{ ...inputStyle, marginTop: 8 }}
                      />
                    )}
                  </div>

                  {/* Payout type + value */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    <div>
                      <label style={labelStyle}>Payout Type *</label>
                      <select value={form.standalone_payout_type} onChange={e => setForm({ ...form, standalone_payout_type: e.target.value })} style={inputStyle}>
                        <option value="fixed">Fixed Amount (₹)</option>
                        <option value="percentage">Percentage of Salary (%)</option>
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>
                        {form.standalone_payout_type === "fixed" ? "Payout Amount (₹) *" : "Payout Percentage (%) *"}
                      </label>
                      <input
                        type="number" min="0"
                        value={form.standalone_payout_value}
                        onChange={e => setForm({ ...form, standalone_payout_value: Number(e.target.value) })}
                        placeholder={form.standalone_payout_type === "fixed" ? "e.g. 5000" : "e.g. 8"}
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  {/* Quick preview */}
                  {form.standalone_payout_value > 0 && (
                    <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 9, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 13, color: "#374151", fontWeight: 600 }}>Each eligible employee receives</span>
                      <span style={{ fontSize: 18, fontWeight: 800, color: "#16a34a" }}>
                        {form.standalone_payout_type === "fixed"
                          ? `₹${Number(form.standalone_payout_value).toLocaleString("en-IN")}`
                          : `${form.standalone_payout_value}% of salary`}
                      </span>
                    </div>
                  )}

                  {/* Note about no slabs */}
                  <div style={{ background: "#f8fafc", borderRadius: 9, padding: "10px 14px", border: "1px solid #e5e7eb" }}>
                    <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>
                      💡 <strong>No score slabs</strong> needed for standalone plans. In Results & Payout, HR manually enters whether each employee qualifies (Yes/No) per cycle.
                    </p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 4 }}>
                <button onClick={() => setShowForm(false)} style={{ padding: "10px 20px", background: "#f3f4f6", border: "none", borderRadius: 9, fontWeight: 700, fontSize: 14, cursor: "pointer", color: "#374151" }}>
                  Cancel
                </button>
                <button onClick={handleSave} disabled={saving} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 24px", background: saving ? "#93c5fd" : "#1d4ed8", color: "#fff", border: "none", borderRadius: 9, fontWeight: 700, fontSize: 14, cursor: saving ? "not-allowed" : "pointer" }}>
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