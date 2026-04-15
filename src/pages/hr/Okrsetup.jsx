// pages/hr/dashboard/performance/OkrSetup.jsx
// Fixes: correct API endpoint, weight field per KR, auto weight distribute

import { useState, useEffect } from "react";
import axios from "axios";
import {
  Plus, Trash2, ChevronDown, ChevronUp,
  Target, Link2, AlertCircle,
  Edit2, Save, X, RefreshCw, Layers
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const FONT = "'Segoe UI', sans-serif";
const labelStyle = { display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 6 };
const inputStyle = {
  width: "100%", padding: "9px 12px", border: "1px solid #d1d5db",
  borderRadius: 8, fontSize: 13, color: "#1a1a2e", background: "#fff",
  boxSizing: "border-box", outline: "none", fontFamily: FONT,
};
const selectStyle = { ...inputStyle };

const QUARTERS = ["Q1", "Q2", "Q3", "Q4"];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1];
const UNITS = ["", "%", "₹", "$", "units", "calls", "days", "hrs", "leads", "sales", "tickets", "score"];

const STYLES = `
  .okrs-page { padding: 28px 32px; }
  .okrs-header { flex-direction: row; align-items: flex-start; }
  .okrs-form-grid { grid-template-columns: 1fr 1fr; }
  .okrs-kr-grid { grid-template-columns: 1fr 1fr 1fr 1fr; }
  .okrs-weight-bar { height: 8px; border-radius: 99px; background: #e5e7eb; overflow: hidden; margin-top: 6px; }
  .okrs-weight-fill { height: 100%; border-radius: 99px; transition: width .4s ease; }

  @media (max-width: 900px) {
    .okrs-kr-grid { grid-template-columns: 1fr 1fr !important; }
  }
  @media (max-width: 768px) {
    .okrs-page { padding: 14px; }
    .okrs-header { flex-direction: column !important; gap: 10px; }
    .okrs-header-btn { width: 100%; justify-content: center; }
    .okrs-form-grid { grid-template-columns: 1fr !important; }
    .okrs-kr-grid { grid-template-columns: 1fr !important; }
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  .okrs-obj-card { animation: fadeIn 0.25s ease; }

  .okrs-btn-primary {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 10px 20px; background: #1a1a2e; color: #fff;
    border: none; border-radius: 9px; font-weight: 700; font-size: 13px;
    cursor: pointer; font-family: ${FONT}; transition: background .15s; white-space: nowrap;
  }
  .okrs-btn-primary:hover { background: #2d2d4e; }
  .okrs-btn-primary:disabled { background: #9ca3af; cursor: not-allowed; }

  .okrs-btn-blue {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 8px 16px; background: #2563eb; color: #fff;
    border: none; border-radius: 8px; font-weight: 700; font-size: 13px;
    cursor: pointer; font-family: ${FONT}; transition: background .15s; white-space: nowrap;
  }
  .okrs-btn-blue:hover { background: #1d4ed8; }
  .okrs-btn-blue:disabled { background: #93c5fd; cursor: not-allowed; }

  .okrs-btn-ghost {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 7px 14px; background: transparent; border: 1.5px solid #e5e7eb; color: #6b7280;
    border-radius: 8px; font-weight: 600; font-size: 13px;
    cursor: pointer; font-family: ${FONT}; transition: all .15s; white-space: nowrap;
  }
  .okrs-btn-ghost:hover { border-color: #2563eb; color: #2563eb; }

  .okrs-btn-danger {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 5px 10px; background: #fff1f2; border: 1px solid #fecdd3; color: #e11d48;
    border-radius: 7px; font-weight: 600; font-size: 12px;
    cursor: pointer; font-family: ${FONT}; transition: all .15s;
  }
  .okrs-btn-danger:hover { background: #ffe4e6; }
  .okrs-kr-row { border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; background: #f8fafc; margin-bottom: 10px; }
  .okrs-kr-row:hover { border-color: #bfdbfe; }
  .okrs-inp:focus { border-color: #2563eb !important; }
`;

// ── Helpers ──────────────────────────────────────────────────────────────────
const blankOkr = () => ({
  title: "", description: "", department: "",
  quarter: "Q2", year: CURRENT_YEAR, status: "active",
  key_results: [],
});

const blankKr = () => ({
  title: "", target: "", unit: "%", weight: 100,
  linked_kpi_item_id: "", current_value: 0, progress_pct: 0,
});

// Auto equal weight distribute
const distributeWeights = (krs) => {
  if (!krs.length) return krs;
  const equal = Math.floor(100 / krs.length);
  const rem   = 100 - equal * krs.length;
  return krs.map((kr, i) => ({ ...kr, weight: i === 0 ? equal + rem : equal }));
};

const totalWeight = (krs) => krs.reduce((s, k) => s + (parseFloat(k.weight) || 0), 0);

// ── Toast ────────────────────────────────────────────────────────────────────
function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div style={{
      position: "fixed", top: 20, right: 16, zIndex: 9999,
      background: toast.type === "error" ? "#ef4444" : "#16a34a",
      color: "#fff", padding: "12px 20px", borderRadius: 8,
      boxShadow: "0 4px 20px rgba(0,0,0,.15)", fontWeight: 600,
      fontSize: 14, maxWidth: "calc(100vw - 32px)", fontFamily: FONT,
    }}>
      {toast.msg}
    </div>
  );
}

// ── Mini progress bar ────────────────────────────────────────────────────────
function MiniBar({ pct, color }) {
  return (
    <div style={{ background: "#e5e7eb", borderRadius: 99, height: 5, overflow: "hidden", marginTop: 4 }}>
      <div style={{ width: `${Math.min(pct, 100)}%`, height: "100%", background: color, borderRadius: 99, transition: "width .6s ease" }} />
    </div>
  );
}

// ── Weight indicator ─────────────────────────────────────────────────────────
function WeightBar({ krs }) {
  const total = totalWeight(krs);
  const isOk  = Math.round(total) === 100;
  const color = isOk ? "#16a34a" : total > 100 ? "#dc2626" : "#d97706";
  return (
    <div style={{ background: isOk ? "#f0fdf4" : total > 100 ? "#fef2f2" : "#fffbeb", border: `1px solid ${isOk ? "#bbf7d0" : total > 100 ? "#fecaca" : "#fde68a"}`, borderRadius: 10, padding: "10px 16px", marginBottom: 12, display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color }}>Weight Total: {total}%</span>
          <span style={{ fontSize: 11, color: "#6b7280" }}>{isOk ? "✅ Perfect" : total > 100 ? "❌ Over 100%" : `⚠️ Need ${100 - total}% more`}</span>
        </div>
        <div className="okrs-weight-bar">
          <div className="okrs-weight-fill" style={{ width: `${Math.min(total, 100)}%`, background: color }} />
        </div>
      </div>
      <button
        onClick={() => {/* handled by parent via prop */}}
        style={{ display: "none" }}
      />
    </div>
  );
}

// ── KR Row in form ───────────────────────────────────────────────────────────
function KrRow({ kr, idx, total, kpiItems, templates, onChange, onRemove }) {
  return (
    <div className="okrs-kr-row">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 800, color: "#1a1a2e" }}>KR {idx + 1}</span>
        <button onClick={() => onRemove(idx)} className="okrs-btn-danger">
          <Trash2 size={11} /> Remove
        </button>
      </div>

      {/* Title */}
      <div style={{ marginBottom: 10 }}>
        <label style={labelStyle}>KR Title *</label>
        <input className="okrs-inp" style={inputStyle}
          placeholder="e.g. Achieve ₹10L monthly revenue"
          value={kr.title} onChange={e => onChange(idx, "title", e.target.value)} />
      </div>

      {/* Target / Unit / Weight / Link */}
      <div className="okrs-kr-grid" style={{ display: "grid", gap: 10 }}>
        <div>
          <label style={labelStyle}>Target *</label>
          <input className="okrs-inp" style={inputStyle} type="number" min="0"
            placeholder="100"
            value={kr.target} onChange={e => onChange(idx, "target", e.target.value)} />
        </div>

        <div>
          <label style={labelStyle}>Unit</label>
          <select className="okrs-inp" style={selectStyle}
            value={kr.unit} onChange={e => onChange(idx, "unit", e.target.value)}>
            {UNITS.map(u => <option key={u} value={u}>{u || "— none —"}</option>)}
          </select>
        </div>

        <div>
          <label style={labelStyle}>
            Weight % *
            <span style={{ color: "#9ca3af", fontWeight: 400, fontSize: 11 }}> (total must = 100)</span>
          </label>
          <input className="okrs-inp" style={{ ...inputStyle, borderColor: Math.round(total) === 100 ? "#d1d5db" : total > 100 ? "#fca5a5" : "#fcd34d" }}
            type="number" min="1" max="100"
            value={kr.weight} onChange={e => onChange(idx, "weight", e.target.value)} />
        </div>

        <div>
          <label style={labelStyle}>
            Link KPI Item
            <span style={{ color: "#9ca3af", fontWeight: 400 }}> (optional)</span>
          </label>
          <select className="okrs-inp" style={selectStyle}
            value={kr.linked_kpi_item_id} onChange={e => onChange(idx, "linked_kpi_item_id", e.target.value)}>
            <option value="">— No KPI link —</option>
            {templates.map(tpl => (
              <optgroup key={tpl._id} label={`${tpl.template_name} (${tpl.department})`}>
                {(tpl.kpi_items || []).map(item => (
                  <option key={item._id} value={item._id}>
                    {item.kpi_name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

// ── OKR Card (list view) ─────────────────────────────────────────────────────
function ObjCard({ obj, templates, onEdit, onDelete, saving }) {
  const [open, setOpen] = useState(false);
  const krs = obj.key_results || [];
  const score = obj.objective_score || 0;
  const color = score >= 75 ? "#16a34a" : score >= 50 ? "#2563eb" : score >= 25 ? "#d97706" : "#dc2626";

  // Flatten for lookup
  const allItems = [];
  templates.forEach(t => (t.kpi_items || []).forEach(i => allItems.push({ ...i, template_name: t.template_name })));

  return (
    <div className="okrs-obj-card" style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", overflow: "hidden" }}>
      {/* Dark header */}
      <div style={{ background: "#1a1a2e", padding: "16px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, color: "#fff", fontWeight: 800, fontSize: 15, wordBreak: "break-word" }}>{obj.title}</p>
            <p style={{ margin: "4px 0 0", color: "#9ca3af", fontSize: 12 }}>
              {obj.department} · {obj.quarter} {obj.year}
              <span style={{ marginLeft: 8, background: obj.status === "active" ? "#16a34a22" : "#6b728022", color: obj.status === "active" ? "#86efac" : "#9ca3af", padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700 }}>
                {obj.status === "active" ? "● Active" : obj.status === "draft" ? "○ Draft" : "✕ Archived"}
              </span>
            </p>
          </div>
          <div style={{ display: "flex", gap: 6, flexShrink: 0, alignItems: "center" }}>
            <span style={{ fontSize: 20, fontWeight: 900, color }}>{score}%</span>
            <button onClick={() => onEdit(obj)} style={{ background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.15)", borderRadius: 7, padding: "5px 10px", color: "#d1d5db", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
              <Edit2 size={12} /> Edit
            </button>
            <button onClick={() => onDelete(obj._id)} className="okrs-btn-danger" style={{ background: "rgba(239,68,68,.15)", border: "1px solid rgba(239,68,68,.25)", color: "#fca5a5" }} disabled={saving}>
              <Trash2 size={12} />
            </button>
          </div>
        </div>
        <div style={{ marginTop: 10, background: "rgba(255,255,255,.1)", borderRadius: 99, height: 6, overflow: "hidden" }}>
          <div style={{ width: `${score}%`, height: "100%", background: color, borderRadius: 99 }} />
        </div>
        {obj.description && <p style={{ margin: "8px 0 0", color: "#9ca3af", fontSize: 12, lineHeight: 1.5 }}>{obj.description}</p>}
      </div>

      {/* KRs */}
      <div style={{ padding: "14px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Key Results ({krs.length})
          </span>
          {krs.length > 2 && (
            <button onClick={() => setOpen(o => !o)} style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280", fontSize: 12, display: "flex", alignItems: "center", gap: 3 }}>
              {open ? <><ChevronUp size={13} /> Less</> : <><ChevronDown size={13} /> +{krs.length - 2} more</>}
            </button>
          )}
        </div>

        {krs.slice(0, open ? krs.length : 2).map((kr, i) => {
          const pct = kr.progress_pct || 0;
          const c   = pct >= 75 ? "#16a34a" : pct >= 50 ? "#2563eb" : pct >= 25 ? "#d97706" : "#dc2626";
          const linked = allItems.find(it => String(it._id) === String(kr.linked_kpi_item_id));
          return (
            <div key={i} style={{ marginBottom: 8, padding: "10px 12px", background: "#f8fafc", borderRadius: 9, border: "1px solid #e5e7eb" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 3 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#1f2937", flex: 1 }}>{kr.title}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: c, flexShrink: 0 }}>
                  {kr.current_value ?? 0}/{kr.target} {kr.unit}
                </span>
              </div>
              <MiniBar pct={pct} color={c} />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                {linked
                  ? <span style={{ fontSize: 10, color: "#2563eb", fontWeight: 600, display: "flex", alignItems: "center", gap: 3 }}><Link2 size={9} /> {linked.kpi_name}</span>
                  : <span style={{ fontSize: 10, color: "#9ca3af" }}>No KPI linked</span>}
                <span style={{ fontSize: 10, color: "#9ca3af" }}>{kr.weight}% weight · {pct}%</span>
              </div>
            </div>
          );
        })}
        {krs.length === 0 && (
          <p style={{ fontSize: 12, color: "#9ca3af", textAlign: "center", padding: "10px 0" }}>No key results — click Edit to add KRs</p>
        )}
      </div>
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────
function EmptyState({ onNew }) {
  return (
    <div style={{ background: "#fff", borderRadius: 14, padding: "60px 24px", textAlign: "center", border: "1px solid #e5e7eb" }}>
      <div style={{ fontSize: 52, marginBottom: 14 }}>🎯</div>
      <h3 style={{ margin: "0 0 8px", color: "#1f2937", fontSize: 18, fontWeight: 800 }}>No OKRs Created Yet</h3>
      <p style={{ margin: "0 0 20px", color: "#6b7280", fontSize: 14, lineHeight: 1.6, maxWidth: 420, marginInline: "auto" }}>
        Create your first Objective with Key Results. Link KRs to KPI items so progress updates automatically when employees submit actuals.
      </p>
      <button className="okrs-btn-blue" onClick={onNew} style={{ fontSize: 14, padding: "11px 24px" }}>
        <Plus size={16} /> Create First OKR
      </button>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function OkrSetup() {
  const [objectives,   setObjectives]   = useState([]);
  const [templates,    setTemplates]    = useState([]); // KPI templates from /api/okr/templates/all
  const [departments,  setDepartments]  = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [toast,        setToast]        = useState(null);
  const [showForm,     setShowForm]     = useState(false);
  const [editId,       setEditId]       = useState(null);
  const [form,         setForm]         = useState(blankOkr());
  const [filterDept,   setFilterDept]   = useState("All");
  const [filterQ,      setFilterQ]      = useState("All");

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [okrRes, tplRes] = await Promise.all([
        axios.get(`${API_BASE}/api/okr`),
        axios.get(`${API_BASE}/api/okr/templates/all`), // ✅ correct endpoint
      ]);

      if (okrRes.data.success) setObjectives(okrRes.data.data || []);

      if (tplRes.data.success) {
        const tpls = tplRes.data.data || [];
        setTemplates(tpls);
        // Extract unique departments from templates
        const depts = [...new Set(tpls.map(t => t.department).filter(Boolean))].sort();
        setDepartments(depts);
      }
    } catch { showToast("Failed to load data", "error"); }
    finally { setLoading(false); }
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Form helpers ─────────────────────────────────────────────────────────────
  const openCreate = () => {
    setForm(blankOkr()); setEditId(null); setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openEdit = (obj) => {
    setForm({
      title:       obj.title,
      description: obj.description || "",
      department:  obj.department,
      quarter:     obj.quarter,
      year:        obj.year,
      status:      obj.status || "active",
      key_results: (obj.key_results || []).map(kr => ({
        title:              kr.title,
        target:             kr.target,
        unit:               kr.unit || "%",
        weight:             kr.weight || 0,
        linked_kpi_item_id: kr.linked_kpi_item_id || "",
        current_value:      kr.current_value || 0,
        progress_pct:       kr.progress_pct  || 0,
      })),
    });
    setEditId(obj._id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const closeForm = () => { setShowForm(false); setEditId(null); setForm(blankOkr()); };
  const setField  = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const addKr = () => setForm(f => {
    const updated = distributeWeights([...f.key_results, blankKr()]);
    return { ...f, key_results: updated };
  });

  const removeKr = (i) => setForm(f => {
    const updated = distributeWeights(f.key_results.filter((_, idx) => idx !== i));
    return { ...f, key_results: updated };
  });

  const updateKr = (i, key, val) => setForm(f => {
    const krs = [...f.key_results];
    krs[i] = { ...krs[i], [key]: val };
    return { ...f, key_results: krs };
  });

  const autoBalance = () => setForm(f => ({ ...f, key_results: distributeWeights(f.key_results) }));

  // ── Save ─────────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.title.trim())      return showToast("Objective title is required", "error");
    if (!form.department.trim()) return showToast("Department is required", "error");
    if (!form.key_results.length) return showToast("Add at least one Key Result", "error");
    for (const kr of form.key_results) {
      if (!kr.title.trim()) return showToast("All KR titles are required", "error");
      if (!kr.target)       return showToast("All KR targets are required", "error");
    }
    const wt = Math.round(totalWeight(form.key_results));
    if (wt !== 100) return showToast(`KR weights must sum to 100%. Now: ${wt}% — click "Auto Balance"`, "error");

    setSaving(true);
    try {
      if (editId) {
        await axios.put(`${API_BASE}/api/okr/${editId}`, form);
        showToast("OKR updated successfully ✅");
      } else {
        await axios.post(`${API_BASE}/api/okr`, form);
        showToast("OKR created successfully 🎯");
      }
      closeForm();
      fetchAll();
    } catch (err) {
      showToast(err?.response?.data?.message || "Save failed", "error");
    } finally { setSaving(false); }
  };

  // ── Delete ────────────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm("Archive this OKR? It won't be visible in the dashboard.")) return;
    setSaving(true);
    try {
      await axios.delete(`${API_BASE}/api/okr/${id}`);
      showToast("OKR archived");
      fetchAll();
    } catch { showToast("Archive failed", "error"); }
    finally { setSaving(false); }
  };

  const filtered = objectives.filter(o =>
    (filterDept === "All" || o.department === filterDept) &&
    (filterQ    === "All" || o.quarter    === filterQ)
  );

  const wt = totalWeight(form.key_results);

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 36, height: 36, border: "4px solid #e5e7eb", borderTopColor: "#2563eb", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
        <p style={{ color: "#6b7280", fontSize: 14 }}>Loading OKR Setup...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );

  return (
    <div className="okrs-page" style={{ fontFamily: FONT, minHeight: "100vh", background: "#f4f6fb" }}>
      <style>{STYLES}</style>
      <Toast toast={toast} />

      {/* ── Header ── */}
      <div className="okrs-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#1a1a2e" }}>OKR Setup</h2>
          <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 14 }}>
            Create objectives → Add key results (weights = 100%) → Link KPI items
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="okrs-btn-ghost" onClick={fetchAll} style={{ padding: "9px 14px" }}>
            <RefreshCw size={14} /> Refresh
          </button>
          {!showForm && (
            <button className="okrs-btn-primary okrs-header-btn" onClick={openCreate}>
              <Plus size={15} /> New OKR
            </button>
          )}
        </div>
      </div>

      {/* ── Info Banner ── */}
      <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 12, padding: "12px 18px", marginBottom: 20, display: "flex", gap: 10, alignItems: "flex-start" }}>
        <span style={{ fontSize: 16, flexShrink: 0 }}>💡</span>
        <p style={{ margin: 0, fontSize: 13, color: "#1e40af", lineHeight: 1.5 }}>
          <strong>How it works:</strong> Create an Objective → Add Key Results with targets and weights (must total 100%) → Optionally link each KR to a KPI item.
          When employees submit KPI actuals, linked KR progress updates automatically in the OKR Dashboard.
        </p>
      </div>

      {/* ══════════════════════
          CREATE / EDIT FORM
      ══════════════════════ */}
      {showForm && (
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e5e7eb", marginBottom: 24, overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,.07)" }}>
          {/* Form header */}
          <div style={{ background: "#1a1a2e", padding: "16px 22px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Target size={18} color="#93c5fd" />
              <span style={{ color: "#fff", fontWeight: 800, fontSize: 15 }}>
                {editId ? "Edit Objective" : "Create New Objective"}
              </span>
            </div>
            <button onClick={closeForm} style={{ background: "rgba(255,255,255,.1)", border: "none", borderRadius: 7, padding: "5px 12px", color: "#d1d5db", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontSize: 13 }}>
              <X size={13} /> Cancel
            </button>
          </div>

          <div style={{ padding: "22px" }}>
            {/* Objective title */}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Objective Title *</label>
              <input className="okrs-inp" style={{ ...inputStyle, fontSize: 14, fontWeight: 600 }}
                placeholder="e.g. Improve Customer Satisfaction in Q2"
                value={form.title} onChange={e => setField("title", e.target.value)} />
            </div>

            {/* Description */}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Description <span style={{ color: "#9ca3af", fontWeight: 400 }}>(optional)</span></label>
              <textarea className="okrs-inp" style={{ ...inputStyle, minHeight: 68, resize: "vertical", lineHeight: 1.5 }}
                placeholder="What does success look like for this objective?"
                value={form.description} onChange={e => setField("description", e.target.value)} />
            </div>

            {/* Dept / Status / Quarter / Year */}
            <div className="okrs-form-grid" style={{ display: "grid", gap: 14, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>Department *</label>
                {departments.length > 0 ? (
                  <select className="okrs-inp" style={selectStyle}
                    value={form.department} onChange={e => setField("department", e.target.value)}>
                    <option value="">— Select Department —</option>
                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                ) : (
                  <input className="okrs-inp" style={inputStyle}
                    placeholder="e.g. Sales"
                    value={form.department} onChange={e => setField("department", e.target.value)} />
                )}
              </div>
              <div>
                <label style={labelStyle}>Status</label>
                <select className="okrs-inp" style={selectStyle}
                  value={form.status} onChange={e => setField("status", e.target.value)}>
                  <option value="active">● Active</option>
                  <option value="draft">○ Draft</option>
                  <option value="archived">✕ Archived</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Quarter *</label>
                <select className="okrs-inp" style={selectStyle}
                  value={form.quarter} onChange={e => setField("quarter", e.target.value)}>
                  {QUARTERS.map(q => <option key={q} value={q}>{q}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Year *</label>
                <select className="okrs-inp" style={selectStyle}
                  value={form.year} onChange={e => setField("year", Number(e.target.value))}>
                  {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>

            {/* Divider */}
            <div style={{ borderTop: "2px dashed #e5e7eb", margin: "20px 0" }} />

            {/* Key Results header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
              <div>
                <p style={{ margin: 0, fontWeight: 800, fontSize: 14, color: "#1a1a2e" }}>Key Results</p>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "#6b7280" }}>
                  All weights must add up to <strong>100%</strong>. Use "Auto Balance" for equal split.
                </p>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {form.key_results.length > 0 && (
                  <button className="okrs-btn-ghost" onClick={autoBalance} style={{ fontSize: 12, padding: "6px 12px" }}>
                    ⚖️ Auto Balance
                  </button>
                )}
                <button className="okrs-btn-ghost" onClick={addKr} style={{ fontSize: 12, padding: "6px 12px" }}>
                  <Plus size={13} /> Add KR
                </button>
              </div>
            </div>

            {/* Weight bar */}
            {form.key_results.length > 0 && <WeightBar krs={form.key_results} />}

            {/* KR rows */}
            {form.key_results.length === 0 ? (
              <div style={{ textAlign: "center", padding: "28px 0", border: "2px dashed #e5e7eb", borderRadius: 10, marginBottom: 14 }}>
                <Layers size={28} color="#d1d5db" style={{ display: "block", margin: "0 auto 8px" }} />
                <p style={{ margin: 0, color: "#9ca3af", fontSize: 13 }}>No Key Results yet. Click "Add KR" to get started.</p>
              </div>
            ) : (
              form.key_results.map((kr, i) => (
                <KrRow key={i} kr={kr} idx={i} total={wt}
                  kpiItems={[]} templates={templates}
                  onChange={updateKr} onRemove={removeKr} />
              ))
            )}

            {/* Actions */}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20, paddingTop: 20, borderTop: "1px solid #f3f4f6" }}>
              <button className="okrs-btn-ghost" onClick={closeForm}>Cancel</button>
              <button className="okrs-btn-blue" onClick={handleSave} disabled={saving} style={{ minWidth: 140 }}>
                {saving
                  ? <><RefreshCw size={13} style={{ animation: "spin .6s linear infinite" }} /> Saving…</>
                  : <><Save size={13} /> {editId ? "Update OKR" : "Create OKR"}</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════
          STATS + FILTERS + LIST
      ══════════════════════ */}
      {/* Stats pills */}
      {objectives.length > 0 && (
        <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
          {[
            { label: "Total",    value: objectives.length,                                    color: "#2563eb", bg: "#eff6ff" },
            { label: "Active",   value: objectives.filter(o => o.status === "active").length,  color: "#16a34a", bg: "#f0fdf4" },
            { label: "Draft",    value: objectives.filter(o => o.status === "draft").length,   color: "#d97706", bg: "#fffbeb" },
            { label: "Archived", value: objectives.filter(o => o.status === "archived").length,color: "#6b7280", bg: "#f3f4f6" },
          ].map((s, i) => (
            <div key={i} style={{ background: s.bg, border: `1px solid ${s.color}22`, borderRadius: 10, padding: "8px 16px", display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 18, fontWeight: 900, color: s.color }}>{s.value}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: s.color, textTransform: "uppercase", letterSpacing: "0.4px" }}>{s.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      {objectives.length > 0 && (
        <div style={{ background: "#fff", borderRadius: 12, padding: "14px 18px", border: "1px solid #e5e7eb", marginBottom: 18, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ flex: 1, minWidth: 140 }}>
            <label style={labelStyle}>Department</label>
            <select style={selectStyle} value={filterDept} onChange={e => setFilterDept(e.target.value)}>
              <option value="All">All Departments</option>
              {[...new Set(objectives.map(o => o.department))].sort().map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 120 }}>
            <label style={labelStyle}>Quarter</label>
            <select style={selectStyle} value={filterQ} onChange={e => setFilterQ(e.target.value)}>
              <option value="All">All Quarters</option>
              {QUARTERS.map(q => <option key={q} value={q}>{q}</option>)}
            </select>
          </div>
          {(filterDept !== "All" || filterQ !== "All") && (
            <button className="okrs-btn-ghost" onClick={() => { setFilterDept("All"); setFilterQ("All"); }} style={{ alignSelf: "flex-end" }}>
              ✕ Clear ({filtered.length} showing)
            </button>
          )}
        </div>
      )}

      {/* OKR List */}
      {objectives.length === 0 ? (
        <EmptyState onNew={openCreate} />
      ) : filtered.length === 0 ? (
        <div style={{ background: "#fff", borderRadius: 14, padding: "40px", textAlign: "center", border: "1px solid #e5e7eb" }}>
          <AlertCircle size={32} color="#d1d5db" style={{ display: "block", margin: "0 auto 10px" }} />
          <p style={{ color: "#6b7280", fontWeight: 600 }}>No OKRs match these filters</p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          {filtered.map(obj => (
            <ObjCard key={obj._id} obj={obj} templates={templates}
              onEdit={openEdit} onDelete={handleDelete} saving={saving} />
          ))}
        </div>
      )}

      {/* Bottom CTA */}
      {objectives.length > 0 && !showForm && (
        <div style={{ textAlign: "center", marginTop: 24 }}>
          <button className="okrs-btn-primary" onClick={openCreate} style={{ fontSize: 14, padding: "11px 28px" }}>
            <Plus size={15} /> Create Another OKR
          </button>
        </div>
      )}
    </div>
  );
}