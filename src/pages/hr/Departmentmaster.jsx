import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  Building2, Plus, Search, RefreshCw, Pencil, Trash2,
  X, Users, Hash, ToggleLeft, ToggleRight,
  AlertTriangle, CheckCircle2, XCircle, Layers, Download,
  EyeOff, ChevronUp, ChevronDown, Zap, ChevronRight,
  Briefcase, PlusCircle, Tag
} from "lucide-react";
import * as XLSX from "xlsx";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const COLORS = ["#2563eb","#7c3aed","#d97706","#059669","#dc2626","#db2777","#0891b2","#65a30d","#ea580c","#4f46e5"];
const getColor = (name = "") => COLORS[(name.charCodeAt(0) || 0) % COLORS.length];

const LEVELS = ["Junior", "Mid", "Senior", "Lead", "Manager"];
const LEVEL_COLORS = {
  Junior:  { bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0" },
  Mid:     { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
  Senior:  { bg: "#faf5ff", color: "#7c3aed", border: "#ddd6fe" },
  Lead:    { bg: "#fff7ed", color: "#c2410c", border: "#fed7aa" },
  Manager: { bg: "#fdf2f8", color: "#be185d", border: "#fbcfe8" },
};

const labelStyle = {
  display: "block", fontSize: 11, fontWeight: 700, color: "#6b7280",
  marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.06em"
};
const errStyle = { margin: "4px 0 0", fontSize: 11, color: "#ef4444" };

function generateAutoCode(name, existingDepts, currentId = null) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "";
  const initials = words.map(w => w[0].toUpperCase()).join("");
  let num = 1;
  while (
    existingDepts.some(d =>
      d.code === `${initials}-${String(num).padStart(3, "0")}` && d._id !== currentId
    )
  ) { num++; }
  return `${initials}-${String(num).padStart(3, "0")}`;
}

// ─── Dept Form Modal ──────────────────────────────────────────────────────────
function DeptFormModal({ dept, onClose, onSave, depts = [] }) {
  const isEdit = !!dept?._id;
  const [form, setForm] = useState({
    name:   dept?.name   || "",
    code:   dept?.code   || "",
    head:   dept?.head   || "",
    status: dept?.status ?? "active",
  });
  const [designations, setDesignations] = useState(
    dept?.designations?.map(d => ({ ...d, _tempId: Math.random() })) || []
  );
  const [newDesig, setNewDesig]       = useState({ title: "", level: "Mid" });
  const [newDesigErr, setNewDesigErr] = useState("");
  const [saving, setSaving]           = useState(false);
  const [errors, setErrors]           = useState({});
  const [codeEdited, setCodeEdited]   = useState(isEdit);

  const handleNameChange = (e) => {
    const name = e.target.value;
    setErrors(v => ({ ...v, name: "" }));
    if (!codeEdited && !isEdit) {
      setForm(f => ({ ...f, name, code: generateAutoCode(name, depts) }));
    } else {
      setForm(f => ({ ...f, name }));
    }
  };

  const handleCodeChange = (e) => {
    setCodeEdited(true);
    setErrors(v => ({ ...v, code: "" }));
    setForm(f => ({ ...f, code: e.target.value.toUpperCase() }));
  };

  const handleRegenCode = () => {
    if (!form.name.trim()) return;
    setForm(f => ({ ...f, code: generateAutoCode(form.name, depts, dept?._id) }));
    setCodeEdited(false);
    setErrors(v => ({ ...v, code: "" }));
  };

  const handleAddDesig = () => {
    if (!newDesig.title.trim()) { setNewDesigErr("Title is required"); return; }
    if (designations.some(d => d.title.toLowerCase() === newDesig.title.trim().toLowerCase())) {
      setNewDesigErr("Already added"); return;
    }
    setDesignations(prev => [...prev, { ...newDesig, title: newDesig.title.trim(), status: "active", _tempId: Math.random() }]);
    setNewDesig({ title: "", level: "Mid" });
    setNewDesigErr("");
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Department name is required";
    if (!form.code.trim()) e.code = "Department code is required";
    return e;
  };

  const handle = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    await onSave({ ...form, designations });
    setSaving(false);
  };

  const inp = (key) => ({
    width: "100%", padding: "9px 12px",
    background: errors[key] ? "#fef2f2" : "#fff",
    border: `1.5px solid ${errors[key] ? "#fca5a5" : "#e5e7eb"}`,
    borderRadius: 8, color: "#111827", fontSize: 13,
    outline: "none", boxSizing: "border-box", fontFamily: "inherit",
    transition: "border-color .15s",
  });

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.55)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, backdropFilter: "blur(4px)" }}>
      <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 560, boxShadow: "0 24px 64px rgba(0,0,0,.18)", border: "1px solid #e5e7eb", overflow: "hidden" }}>

        {/* Header */}
        <div style={{ padding: "18px 24px 14px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <p style={{ margin: 0, fontWeight: 800, color: "#0f172a", fontSize: 15, letterSpacing: "-0.01em" }}>
              {isEdit ? "Edit Department" : "New Department"}
            </p>
            <p style={{ margin: "2px 0 0", fontSize: 11, color: "#9ca3af" }}>
              {isEdit ? "Update department details & roles" : "Department code auto-generates from name"}
            </p>
          </div>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 7, background: "#f3f4f6", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280" }}>
            <X size={13}/>
          </button>
        </div>

        <div style={{ padding: "20px 24px", overflowY: "auto", maxHeight: "68vh", display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Name + Code */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>Name <span style={{ color: "#ef4444" }}>*</span></label>
              <input value={form.name} onChange={handleNameChange} placeholder="e.g. Human Resources" style={inp("name")}/>
              {errors.name && <p style={errStyle}>{errors.name}</p>}
            </div>
            <div>
              <label style={{ ...labelStyle, display: "flex", justifyContent: "space-between" }}>
                <span>Code <span style={{ color: "#ef4444" }}>*</span></span>
                {!isEdit && (
                  <button onClick={handleRegenCode}
                    style={{ display: "inline-flex", alignItems: "center", gap: 3, background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 5, padding: "2px 7px", color: "#2563eb", fontSize: 10, fontWeight: 700, cursor: "pointer", textTransform: "none", letterSpacing: 0 }}>
                    <Zap size={8}/> Auto
                  </button>
                )}
              </label>
              <input value={form.code} onChange={handleCodeChange} placeholder="HR-001"
                style={{ ...inp("code"), fontFamily: "monospace", background: !codeEdited && !isEdit && form.code ? "#f0fdf4" : errors.code ? "#fef2f2" : "#fff", borderColor: !codeEdited && !isEdit && form.code ? "#86efac" : errors.code ? "#fca5a5" : "#e5e7eb" }}/>
              {errors.code && <p style={errStyle}>{errors.code}</p>}
            </div>
          </div>

          {/* Head */}
          <div>
            <label style={labelStyle}>Department Head</label>
            <input value={form.head} onChange={e => setForm(f => ({ ...f, head: e.target.value }))} placeholder="e.g. Priya Sharma" style={inp("head")}/>
          </div>

          {/* Designations */}
          <div style={{ border: "1.5px solid #e0e7ff", borderRadius: 10, overflow: "hidden" }}>
            <div style={{ background: "#f8f9ff", padding: "9px 14px", display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid #e0e7ff" }}>
              <Briefcase size={12} color="#4f46e5"/>
              <span style={{ fontSize: 11, fontWeight: 800, color: "#4338ca", textTransform: "uppercase", letterSpacing: "0.06em" }}>Roles & Designations</span>
              <span style={{ marginLeft: "auto", background: "#e0e7ff", color: "#4338ca", borderRadius: 20, padding: "1px 8px", fontSize: 10, fontWeight: 700 }}>{designations.length}</span>
            </div>
            <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
              {designations.map(desig => {
                const lc = LEVEL_COLORS[desig.level] || LEVEL_COLORS.Mid;
                return (
                  <div key={desig._tempId} style={{ display: "flex", alignItems: "center", gap: 8, background: "#fafafa", border: "1px solid #f0f0f0", borderRadius: 8, padding: "8px 10px" }}>
                    <Tag size={11} color={lc.color} style={{ flexShrink: 0 }}/>
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "#111827" }}>{desig.title}</span>
                    <select value={desig.level} onChange={e => setDesignations(prev => prev.map(d => d._tempId === desig._tempId ? { ...d, level: e.target.value } : d))}
                      style={{ padding: "3px 8px", border: `1px solid ${lc.border}`, borderRadius: 6, background: lc.bg, color: lc.color, fontSize: 11, fontWeight: 700, cursor: "pointer", outline: "none" }}>
                      {LEVELS.map(l => <option key={l}>{l}</option>)}
                    </select>
                    <button onClick={() => setDesignations(prev => prev.filter(d => d._tempId !== desig._tempId))}
                      style={{ width: 22, height: 22, border: "none", background: "#fef2f2", borderRadius: 5, color: "#dc2626", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <X size={10}/>
                    </button>
                  </div>
                );
              })}

              <div style={{ display: "flex", gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <input value={newDesig.title}
                    onChange={e => { setNewDesig(v => ({ ...v, title: e.target.value })); setNewDesigErr(""); }}
                    onKeyDown={e => e.key === "Enter" && handleAddDesig()}
                    placeholder="e.g. Software Engineer"
                    style={{ width: "100%", padding: "8px 10px", border: `1.5px solid ${newDesigErr ? "#fca5a5" : "#e5e7eb"}`, borderRadius: 8, fontSize: 13, background: newDesigErr ? "#fef2f2" : "#fff", outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}/>
                  {newDesigErr && <p style={errStyle}>{newDesigErr}</p>}
                </div>
                <select value={newDesig.level} onChange={e => setNewDesig(v => ({ ...v, level: e.target.value }))}
                  style={{ padding: "8px 10px", border: "1.5px solid #e5e7eb", borderRadius: 8, fontSize: 13, background: "#fff", outline: "none", fontFamily: "inherit", minWidth: 96 }}>
                  {LEVELS.map(l => <option key={l}>{l}</option>)}
                </select>
                <button onClick={handleAddDesig}
                  style={{ padding: "8px 14px", background: "#4f46e5", border: "none", borderRadius: 8, color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>
                  <Plus size={12}/> Add
                </button>
              </div>

              {designations.length === 0 && (
                <p style={{ margin: 0, fontSize: 12, color: "#c4b5fd", textAlign: "center", padding: "4px 0" }}>
                  No roles added yet
                </p>
              )}
            </div>
          </div>

          {/* Status */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f9fafb", borderRadius: 9, padding: "11px 14px", border: "1.5px solid #e5e7eb" }}>
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: "#111827" }}>Status</p>
              <p style={{ margin: 0, fontSize: 11, color: "#9ca3af" }}>Active departments appear in all module dropdowns</p>
            </div>
            <button onClick={() => setForm(f => ({ ...f, status: f.status === "active" ? "inactive" : "active" }))}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 13px", border: "none", borderRadius: 8, background: form.status === "active" ? "#ecfdf5" : "#fef2f2", color: form.status === "active" ? "#059669" : "#dc2626", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
              {form.status === "active" ? <ToggleRight size={15}/> : <ToggleLeft size={15}/>}
              {form.status === "active" ? "Active" : "Inactive"}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "14px 24px 20px", borderTop: "1px solid #f3f4f6", display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "10px", background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 9, color: "#6b7280", fontWeight: 600, cursor: "pointer", fontSize: 13 }}>Cancel</button>
          <button onClick={handle} disabled={saving}
            style={{ flex: 2, padding: "10px", background: saving ? "#93c5fd" : "#2563eb", border: "none", borderRadius: 9, color: "#fff", fontWeight: 700, fontSize: 14, cursor: saving ? "not-allowed" : "pointer", letterSpacing: "-0.01em" }}>
            {saving ? "Saving…" : isEdit ? "Update Department" : "Create Department"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Designation Inline Form ──────────────────────────────────────────────────
function DesignationForm({ onSave, onCancel, existing = null }) {
  const [title,  setTitle]  = useState(existing?.title  || "");
  const [level,  setLevel]  = useState(existing?.level  || "Mid");
  const [status, setStatus] = useState(existing?.status || "active");
  const [err,    setErr]    = useState("");
  const [saving, setSaving] = useState(false);

  const handle = async () => {
    if (!title.trim()) { setErr("Title is required"); return; }
    setSaving(true);
    await onSave({ title: title.trim(), level, status });
    setSaving(false);
  };

  return (
    <div style={{ background: "#f8faff", border: "1.5px solid #bfdbfe", borderRadius: 10, padding: "12px 14px", marginTop: 8 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 130px 110px", gap: 8, alignItems: "flex-end" }}>
        <div>
          <label style={labelStyle}>Designation Title *</label>
          <input value={title} onChange={e => { setTitle(e.target.value); setErr(""); }} placeholder="e.g. Software Engineer"
            style={{ width: "100%", padding: "8px 10px", border: `1.5px solid ${err ? "#fca5a5" : "#e5e7eb"}`, borderRadius: 7, fontSize: 13, background: err ? "#fef2f2" : "#fff", boxSizing: "border-box", outline: "none", fontFamily: "inherit" }}/>
          {err && <p style={errStyle}>{err}</p>}
        </div>
        <div>
          <label style={labelStyle}>Level</label>
          <select value={level} onChange={e => setLevel(e.target.value)}
            style={{ width: "100%", padding: "8px 10px", border: "1.5px solid #e5e7eb", borderRadius: 7, fontSize: 13, background: "#fff", outline: "none", fontFamily: "inherit" }}>
            {LEVELS.map(l => <option key={l}>{l}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Status</label>
          <select value={status} onChange={e => setStatus(e.target.value)}
            style={{ width: "100%", padding: "8px 10px", border: "1.5px solid #e5e7eb", borderRadius: 7, fontSize: 13, background: "#fff", outline: "none", fontFamily: "inherit" }}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <button onClick={handle} disabled={saving}
          style={{ padding: "7px 18px", background: saving ? "#93c5fd" : "#2563eb", border: "none", borderRadius: 7, color: "#fff", fontWeight: 700, fontSize: 12, cursor: saving ? "not-allowed" : "pointer" }}>
          {saving ? "Saving…" : existing ? "Update" : "Add Role"}
        </button>
        <button onClick={onCancel}
          style={{ padding: "7px 14px", background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 7, color: "#6b7280", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Designations Panel ───────────────────────────────────────────────────────
function DesignationsPanel({ dept, onRefresh, showMsg }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editDesigId, setEditDesigId] = useState(null);
  const [deletingId,  setDeletingId]  = useState(null);
  const designations = dept.designations || [];

  const handleAdd = async (data) => {
    try {
      await axios.post(`${API_BASE}/api/departments/${dept._id}/designations`, data);
      showMsg("Designation added"); setShowAddForm(false); onRefresh();
    } catch (err) { showMsg(err?.response?.data?.message || "Failed to add", "error"); }
  };

  const handleUpdate = async (desigId, data) => {
    try {
      await axios.put(`${API_BASE}/api/departments/${dept._id}/designations/${desigId}`, data);
      showMsg("Designation updated"); setEditDesigId(null); onRefresh();
    } catch (err) { showMsg(err?.response?.data?.message || "Failed to update", "error"); }
  };

  const handleDelete = async (desigId) => {
    if (!window.confirm("Delete this designation?")) return;
    setDeletingId(desigId);
    try {
      await axios.delete(`${API_BASE}/api/departments/${dept._id}/designations/${desigId}`);
      showMsg("Designation deleted"); onRefresh();
    } catch { showMsg("Delete failed", "error"); }
    setDeletingId(null);
  };

  return (
    <div style={{ padding: "16px 24px 20px 60px", background: "#fbfcff", borderTop: "1px solid #eef0f6" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <Briefcase size={12} color="#6366f1"/>
          <span style={{ fontSize: 11, fontWeight: 800, color: "#4f46e5", textTransform: "uppercase", letterSpacing: "0.07em" }}>
            {dept.name} — Roles
          </span>
          <span style={{ background: "#e0e7ff", color: "#4338ca", borderRadius: 20, padding: "1px 8px", fontSize: 10, fontWeight: 700 }}>
            {designations.length}
          </span>
        </div>
        {!showAddForm && (
          <button onClick={() => { setShowAddForm(true); setEditDesigId(null); }}
            style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", background: "#2563eb", border: "none", borderRadius: 7, color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
            <PlusCircle size={11}/> Add Role
          </button>
        )}
      </div>

      {showAddForm && <DesignationForm onSave={handleAdd} onCancel={() => setShowAddForm(false)}/>}

      {designations.length === 0 && !showAddForm ? (
        <div style={{ textAlign: "center", padding: "20px 0", color: "#c4b5fd" }}>
          <Briefcase size={22} style={{ marginBottom: 6, opacity: 0.4 }}/>
          <p style={{ margin: 0, fontSize: 12, color: "#9ca3af" }}>No roles yet. Click "Add Role" to create one.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: showAddForm ? 10 : 0 }}>
          {designations.map(desig => {
            const lc = LEVEL_COLORS[desig.level] || LEVEL_COLORS.Mid;
            const isEditing = editDesigId === desig._id?.toString();
            return (
              <div key={desig._id}>
                {isEditing ? (
                  <DesignationForm existing={desig} onSave={data => handleUpdate(desig._id, data)} onCancel={() => setEditDesigId(null)}/>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: 12, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 9, padding: "10px 14px", maxWidth: 700, transition: "border-color .15s" }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = "#bfdbfe"}
                    onMouseLeave={e => e.currentTarget.style.borderColor = "#e5e7eb"}>
                    <div style={{ width: 28, height: 28, borderRadius: 7, background: lc.bg, border: `1px solid ${lc.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Tag size={12} color={lc.color}/>
                    </div>
                    <span style={{ fontWeight: 700, fontSize: 13, color: "#111827", flex: 1 }}>{desig.title}</span>
                    <span style={{ background: lc.bg, color: lc.color, border: `1px solid ${lc.border}`, borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>{desig.level}</span>
                    <span style={{ background: desig.status === "active" ? "#ecfdf5" : "#f3f4f6", color: desig.status === "active" ? "#059669" : "#9ca3af", border: `1px solid ${desig.status === "active" ? "#6ee7b7" : "#e5e7eb"}`, borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>
                      {desig.status === "active" ? "Active" : "Inactive"}
                    </span>
                    <div style={{ display: "flex", gap: 5 }}>
                      <button onClick={() => { setEditDesigId(desig._id?.toString()); setShowAddForm(false); }}
                        style={{ padding: "4px 10px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 6, color: "#2563eb", fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 3 }}>
                        <Pencil size={10}/> Edit
                      </button>
                      <button onClick={() => handleDelete(desig._id)} disabled={deletingId === desig._id?.toString()}
                        style={{ padding: "4px 8px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 6, color: "#dc2626", cursor: "pointer", display: "flex", alignItems: "center" }}>
                        <Trash2 size={11}/>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Delete Choice Modal ──────────────────────────────────────────────────────
function DeleteChoiceModal({ dept, employeeCount, onClose, onDelete, onMarkInactive }) {
  const hasEmployees = employeeCount > 0;
  const [acting, setActing] = useState(null);
  const handleDelete   = async () => { setActing("delete");   await onDelete();      setActing(null); };
  const handleInactive = async () => { setActing("inactive"); await onMarkInactive(); setActing(null); };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.55)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, backdropFilter: "blur(4px)" }}>
      <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 430, boxShadow: "0 24px 64px rgba(0,0,0,.18)", border: "1px solid #e5e7eb", overflow: "hidden" }}>
        <div style={{ background: "#fef2f2", padding: "16px 20px", borderBottom: "1px solid #fecaca", display: "flex", gap: 11, alignItems: "flex-start" }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Trash2 size={16} color="#dc2626"/>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontWeight: 800, fontSize: 14, color: "#0f172a" }}>Remove Department</p>
            <p style={{ margin: 0, fontSize: 12, color: "#6b7280", marginTop: 2 }}>Choose action for <strong>"{dept.name}"</strong></p>
          </div>
          <button onClick={onClose} style={{ background: "#fee2e2", border: "none", borderRadius: 7, width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#dc2626", flexShrink: 0 }}>
            <X size={12}/>
          </button>
        </div>
        <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
          {hasEmployees && (
            <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: "9px 12px", display: "flex", gap: 8 }}>
              <AlertTriangle size={13} color="#f59e0b" style={{ flexShrink: 0, marginTop: 1 }}/>
              <p style={{ margin: 0, fontSize: 12, color: "#92400e", lineHeight: 1.5 }}>
                <strong>{employeeCount} active employee{employeeCount > 1 ? "s" : ""}</strong> linked. Deleting will unlink them.
              </p>
            </div>
          )}

          {[
            {
              key: "inactive", icon: <EyeOff size={14} color="#f59e0b"/>, bg: "#fffbeb",
              title: "Mark as Inactive", badge: "RECOMMENDED",
              desc: "Hides from all dropdowns but preserves all historical data.",
              btnLabel: dept.status === "inactive" ? "Already Inactive" : acting === "inactive" ? "Updating…" : "Mark Inactive",
              disabled: acting === "inactive" || dept.status === "inactive",
              onClick: handleInactive, btnColor: "#92400e", btnBg: "#fffbeb", btnBorder: "#fde68a",
            },
            {
              key: "delete", icon: <Trash2 size={14} color="#ef4444"/>, bg: "#fef2f2",
              title: "Delete Permanently", badge: null,
              desc: `Removes this department forever. Cannot be undone.${hasEmployees ? " Employees will be unlinked." : ""}`,
              btnLabel: acting === "delete" ? "Deleting…" : "Delete Permanently",
              disabled: acting === "delete",
              onClick: handleDelete, btnColor: "#dc2626", btnBg: "#fef2f2", btnBorder: "#fecaca",
            },
          ].map(opt => (
            <div key={opt.key}
              style={{ border: "1.5px solid #e5e7eb", borderRadius: 11, padding: "14px 15px", background: "#fff", transition: "border-color .15s, background .15s", cursor: "default" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = opt.key === "delete" ? "#ef4444" : "#f59e0b"; e.currentTarget.style.background = opt.bg; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.background = "#fff"; }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: opt.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>{opt.icon}</div>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: "#111827" }}>{opt.title}</p>
                </div>
                {opt.badge && <span style={{ background: "#ecfdf5", color: "#059669", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, border: "1px solid #6ee7b7" }}>{opt.badge}</span>}
              </div>
              <p style={{ margin: "0 0 10px 36px", fontSize: 12, color: "#6b7280", lineHeight: 1.5 }}>{opt.desc}</p>
              <button onClick={opt.onClick} disabled={opt.disabled}
                style={{ marginLeft: 36, padding: "6px 14px", background: opt.btnBg, border: `1px solid ${opt.btnBorder}`, borderRadius: 7, color: opt.btnColor, fontWeight: 700, fontSize: 12, cursor: opt.disabled ? "not-allowed" : "pointer", display: "inline-flex", alignItems: "center", gap: 5, opacity: opt.disabled ? 0.6 : 1 }}>
                {opt.key === "delete" ? <Trash2 size={11}/> : <EyeOff size={11}/>}
                {opt.btnLabel}
              </button>
            </div>
          ))}

          <button onClick={onClose} style={{ padding: "9px", background: "#f9fafb", border: "1.5px solid #e5e7eb", borderRadius: 9, color: "#6b7280", fontWeight: 600, cursor: "pointer", fontSize: 13 }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function DepartmentMaster() {
  const [depts, setDepts]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState("");
  const [filterStatus, setFilter]       = useState("all");
  const [showForm, setShowForm]         = useState(false);
  const [editDept, setEditDept]         = useState(null);
  const [actionDept, setActionDept]     = useState(null);
  const [toast, setToast]               = useState(null);
  const [sortField, setSortField]       = useState("name");
  const [sortDir, setSortDir]           = useState("asc");
  const [expandedDept, setExpandedDept] = useState(null);

  useEffect(() => { fetchDepts(); }, []);

  const fetchDepts = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/departments`);
      setDepts(res.data.data || res.data || []);
    } catch { showMsg("Failed to load departments", "error"); }
    finally { setLoading(false); }
  };

  const showMsg = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };

  const handleSave = async (form) => {
    try {
      if (editDept?._id) {
        await axios.put(`${API_BASE}/api/departments/${editDept._id}`, form);
        await axios.put(`${API_BASE}/api/departments/${editDept._id}/designations/replace-all`, {
          designations: form.designations || []
        });
        showMsg("Department updated successfully");
      } else {
        await axios.post(`${API_BASE}/api/departments`, form);
        showMsg("Department created successfully");
      }
      setShowForm(false); setEditDept(null); fetchDepts();
    } catch (err) { showMsg(err?.response?.data?.message || "Save failed", "error"); }
  };

  const openDeleteModal = async (dept) => {
    try {
      const res = await axios.get(`${API_BASE}/api/departments/${dept._id}/employee-count`);
      setActionDept({ dept, employeeCount: res.data.count || 0 });
    } catch { setActionDept({ dept, employeeCount: 0 }); }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API_BASE}/api/departments/${actionDept.dept._id}`);
      showMsg("Department deleted permanently");
      setActionDept(null); fetchDepts();
    } catch (err) { showMsg(err?.response?.data?.message || "Delete failed", "error"); }
  };

  const handleMarkInactive = async () => {
    try {
      await axios.patch(`${API_BASE}/api/departments/${actionDept.dept._id}/status`, { status: "inactive" });
      showMsg("Department marked as inactive");
      setActionDept(null); fetchDepts();
    } catch { showMsg("Update failed", "error"); }
  };

  const handleToggleStatus = async (dept) => {
    try {
      const s = dept.status === "active" ? "inactive" : "active";
      await axios.patch(`${API_BASE}/api/departments/${dept._id}/status`, { status: s });
      showMsg(`Marked as ${s}`); fetchDepts();
    } catch { showMsg("Status update failed", "error"); }
  };

  const exportExcel = () => {
    const rows = filtered.map((d, i) => ({
      "#": i + 1, "Department": d.name, "Code": d.code,
      "Head": d.head || "—", "Employees": d.employeeCount ?? 0,
      "Status": d.status,
      "Roles": (d.designations || []).map(x => `${x.title} (${x.level})`).join(", ") || "—",
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Departments");
    XLSX.writeFile(wb, `Departments_${Date.now()}.xlsx`);
  };

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };

  const SortIcon = ({ field }) =>
    sortField !== field
      ? <ChevronDown size={11} color="#d1d5db"/>
      : sortDir === "asc" ? <ChevronUp size={11} color="#2563eb"/> : <ChevronDown size={11} color="#2563eb"/>;

  const filtered = useMemo(() => {
    let d = [...depts];
    if (filterStatus !== "all") d = d.filter(x => x.status === filterStatus);
    if (search.trim()) {
      const q = search.toLowerCase();
      d = d.filter(x =>
        x.name?.toLowerCase().includes(q) || x.code?.toLowerCase().includes(q) ||
        x.head?.toLowerCase().includes(q) ||
        x.designations?.some(dg => dg.title.toLowerCase().includes(q))
      );
    }
    d.sort((a, b) => {
      let av = a[sortField] || "", bv = b[sortField] || "";
      if (sortField === "employeeCount") { av = a.employeeCount || 0; bv = b.employeeCount || 0; }
      const cmp = typeof av === "number" ? av - bv : av.toString().localeCompare(bv.toString());
      return sortDir === "asc" ? cmp : -cmp;
    });
    return d;
  }, [depts, filterStatus, search, sortField, sortDir]);

  const stats = useMemo(() => ({
    total:    depts.length,
    active:   depts.filter(d => d.status === "active").length,
    inactive: depts.filter(d => d.status === "inactive").length,
    totalEmp: depts.reduce((s, d) => s + (d.employeeCount || 0), 0),
  }), [depts]);

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 32, height: 32, border: "3px solid #e5e7eb", borderTopColor: "#2563eb", borderRadius: "50%", animation: "spin .8s linear infinite", margin: "0 auto 10px" }}/>
        <p style={{ color: "#9ca3af", fontSize: 13 }}>Loading…</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );

  const STAT_CARDS = [
    { label: "Departments",     value: stats.total,    icon: <Layers size={16}/>,      color: "#2563eb", bg: "#eff6ff",  border: "#bfdbfe" },
    { label: "Active",          value: stats.active,   icon: <ToggleRight size={16}/>, color: "#059669", bg: "#ecfdf5",  border: "#6ee7b7" },
    { label: "Inactive",        value: stats.inactive, icon: <ToggleLeft size={16}/>,  color: "#d97706", bg: "#fffbeb",  border: "#fde68a" },
    { label: "Total Employees", value: stats.totalEmp, icon: <Users size={16}/>,       color: "#7c3aed", bg: "#faf5ff",  border: "#ddd6fe" },
  ];

  const TH_COLS = [
    { key: "name",          label: "Department",  w: 200 },
    { key: "code",          label: "Code",        w: 110 },
    { key: "head",          label: "Head",        w: 160 },
    { key: "employeeCount", label: "Headcount",   w: 110 },
    { key: "designations",  label: "Roles",       w: 130, noSort: true },
    { key: "status",        label: "Status",      w: 115 },
    { key: "actions",       label: "",            w: 110, noSort: true },
  ];

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", minHeight: "100vh", background: "#f3f4f6", color: "#111827" }}>
      <style>{`
        @keyframes spin   { to { transform: rotate(360deg) } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
        .dept-row { transition: background .12s; }
        .dept-row:hover { background: #f8faff !important; }
        .sort-th { cursor: pointer; user-select: none; }
        .sort-th:hover { background: #f0f4ff !important; }
        .btn-action { transition: opacity .12s; }
        .btn-action:hover { opacity: .78; }
        input:focus, select:focus, textarea:focus {
          border-color: #2563eb !important;
          box-shadow: 0 0 0 3px rgba(37,99,235,.09) !important;
        }
        ::-webkit-scrollbar { width: 5px; height: 5px }
        ::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 3px }
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", top: 18, right: 18, zIndex: 9999, background: toast.type === "error" ? "#ef4444" : "#10b981", color: "#fff", padding: "11px 16px", borderRadius: 10, fontWeight: 600, fontSize: 13, boxShadow: "0 8px 28px rgba(0,0,0,.18)", animation: "fadeUp .22s ease", display: "flex", alignItems: "center", gap: 7 }}>
          {toast.type === "error" ? <XCircle size={14}/> : <CheckCircle2 size={14}/>}
          {toast.msg}
        </div>
      )}

      {showForm && (
        <DeptFormModal dept={editDept} onClose={() => { setShowForm(false); setEditDept(null); }} onSave={handleSave} depts={depts}/>
      )}
      {actionDept && (
        <DeleteChoiceModal dept={actionDept.dept} employeeCount={actionDept.employeeCount} onClose={() => setActionDept(null)} onDelete={handleDelete} onMarkInactive={handleMarkInactive}/>
      )}

      {/* Top Bar */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "0 28px", height: 56, display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 100, gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: "#eff6ff", border: "1px solid #bfdbfe", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Building2 size={16} color="#2563eb"/>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" }}>Department Master</p>
            <p style={{ margin: 0, fontSize: 11, color: "#9ca3af" }}>Manage departments & roles across all modules</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={exportExcel}
            style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 13px", background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 8, color: "#6b7280", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>
            <Download size={12}/> Export
          </button>
          <button onClick={() => { setEditDept(null); setShowForm(true); }}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 16px", background: "#2563eb", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer", color: "#fff", letterSpacing: "-0.01em" }}>
            <Plus size={14}/> Add Department
          </button>
        </div>
      </div>

      <div style={{ padding: "22px 28px", maxWidth: 1280, margin: "0 auto" }}>

        {/* Stat Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
          {STAT_CARDS.map((s, i) => (
            <div key={i} style={{ background: "#fff", borderRadius: 11, padding: "16px 20px", border: `1px solid ${s.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", animation: "fadeUp .22s ease both", animationDelay: `${i * 0.04}s` }}>
              <div>
                <p style={{ margin: "0 0 3px", fontSize: 11, color: "#9ca3af", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</p>
                <p style={{ margin: 0, fontSize: 28, fontWeight: 900, color: s.color, letterSpacing: "-0.03em" }}>{s.value}</p>
              </div>
              <div style={{ width: 40, height: 40, borderRadius: 9, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", color: s.color }}>{s.icon}</div>
            </div>
          ))}
        </div>

        {/* Filter Bar */}
        <div style={{ background: "#fff", borderRadius: 10, padding: "10px 14px", border: "1px solid #e5e7eb", marginBottom: 14, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, flex: 1, minWidth: 220, background: "#f9fafb", borderRadius: 8, padding: "7px 11px", border: "1.5px solid #e5e7eb" }}>
            <Search size={13} color="#9ca3af"/>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search name, code, head, roles…"
              style={{ background: "none", border: "none", color: "#111827", fontSize: 13, outline: "none", width: "100%" }}/>
            {search && (
              <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 0, display: "flex" }}>
                <X size={13}/>
              </button>
            )}
          </div>
          <div style={{ display: "flex", background: "#f9fafb", borderRadius: 8, border: "1.5px solid #e5e7eb", overflow: "hidden" }}>
            {[["all","All"],["active","Active"],["inactive","Inactive"]].map(([val, lbl]) => (
              <button key={val} onClick={() => setFilter(val)}
                style={{ padding: "7px 15px", border: "none", background: filterStatus === val ? "#2563eb" : "transparent", color: filterStatus === val ? "#fff" : "#6b7280", fontWeight: 700, fontSize: 12, cursor: "pointer", transition: "all .15s" }}>
                {lbl}
              </button>
            ))}
          </div>
          <button onClick={fetchDepts}
            style={{ padding: "7px 11px", background: "#f9fafb", border: "1.5px solid #e5e7eb", borderRadius: 8, color: "#6b7280", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}>
            <RefreshCw size={12}/> Refresh
          </button>
          <span style={{ fontSize: 12, color: "#9ca3af", fontWeight: 600 }}>{filtered.length} dept{filtered.length !== 1 ? "s" : ""}</span>
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb" }}>
            <Building2 size={38} color="#e5e7eb" style={{ marginBottom: 10 }}/>
            <p style={{ color: "#6b7280", fontWeight: 700, fontSize: 14, margin: "0 0 4px" }}>
              {search || filterStatus !== "all" ? "No departments match your filter" : "No departments yet"}
            </p>
            <p style={{ color: "#9ca3af", fontSize: 13, margin: 0 }}>Click "Add Department" to get started.</p>
          </div>
        ) : (
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 760 }}>
              <thead>
                <tr style={{ background: "#f8f9fb" }}>
                  {TH_COLS.map(h => (
                    <th key={h.key}
                      onClick={h.noSort ? undefined : () => handleSort(h.key)}
                      className={h.noSort ? "" : "sort-th"}
                      style={{ padding: "10px 16px", textAlign: "left", fontWeight: 700, color: "#6b7280", borderBottom: "1px solid #e5e7eb", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap", width: h.w || undefined, background: "#f8f9fb" }}>
                      {h.label && (
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          {h.label}{!h.noSort && <SortIcon field={h.key}/>}
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((dept) => {
                  const clr = getColor(dept.name);
                  const isExpanded = expandedDept === dept._id;
                  const desigCount = (dept.designations || []).length;
                  return (
                    <>
                      <tr key={dept._id} className="dept-row"
                        style={{ borderBottom: isExpanded ? "none" : "1px solid #f3f4f6" }}>

                        {/* Department */}
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ width: 32, height: 32, borderRadius: 8, background: `${clr}12`, border: `1px solid ${clr}25`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              <Building2 size={14} color={clr}/>
                            </div>
                            <span style={{ fontWeight: 700, color: "#0f172a", fontSize: 13 }}>{dept.name}</span>
                          </div>
                        </td>

                        {/* Code */}
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{ background: "#f3f4f6", color: "#374151", padding: "3px 9px", borderRadius: 6, fontSize: 12, fontWeight: 700, fontFamily: "monospace", display: "inline-flex", alignItems: "center", gap: 3 }}>
                            <Hash size={9}/>{dept.code || "—"}
                          </span>
                        </td>

                        {/* Head */}
                        <td style={{ padding: "12px 16px" }}>
                          {dept.head ? (
                            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                              <div style={{ width: 24, height: 24, borderRadius: "50%", background: `${clr}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: clr, flexShrink: 0 }}>
                                {dept.head.charAt(0).toUpperCase()}
                              </div>
                              <span style={{ fontSize: 13, color: "#374151" }}>{dept.head}</span>
                            </div>
                          ) : <span style={{ color: "#d1d5db", fontSize: 12 }}>Not assigned</span>}
                        </td>

                        {/* Headcount */}
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#f5f3ff", color: "#7c3aed", padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700, border: "1px solid #ddd6fe" }}>
                            <Users size={10}/>{dept.employeeCount ?? 0}
                          </span>
                        </td>

                        {/* Roles */}
                        <td style={{ padding: "12px 16px" }}>
                          <button onClick={() => setExpandedDept(isExpanded ? null : dept._id)}
                            style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 11px", background: isExpanded ? "#e0e7ff" : "#f5f3ff", border: `1px solid ${isExpanded ? "#a5b4fc" : "#ddd6fe"}`, borderRadius: 20, color: isExpanded ? "#4338ca" : "#6d28d9", fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "all .15s" }}>
                            <Briefcase size={10}/>
                            {desigCount} role{desigCount !== 1 ? "s" : ""}
                            <ChevronRight size={10} style={{ transform: isExpanded ? "rotate(90deg)" : "none", transition: "transform .2s" }}/>
                          </button>
                        </td>

                        {/* Status */}
                        <td style={{ padding: "12px 16px" }}>
                          <button onClick={() => handleToggleStatus(dept)} className="btn-action"
                            style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", background: dept.status === "active" ? "#ecfdf5" : "#f3f4f6", border: `1px solid ${dept.status === "active" ? "#6ee7b7" : "#e5e7eb"}`, borderRadius: 20, color: dept.status === "active" ? "#059669" : "#9ca3af", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                            {dept.status === "active" ? <ToggleRight size={13}/> : <ToggleLeft size={13}/>}
                            {dept.status === "active" ? "Active" : "Inactive"}
                          </button>
                        </td>

                        {/* Actions */}
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ display: "flex", gap: 5 }}>
                            <button className="btn-action" onClick={() => { setEditDept(dept); setShowForm(true); }}
                              style={{ padding: "5px 10px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 7, color: "#2563eb", fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 3 }}>
                              <Pencil size={10}/> Edit
                            </button>
                            <button className="btn-action" onClick={() => openDeleteModal(dept)}
                              style={{ padding: "5px 8px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 7, color: "#dc2626", cursor: "pointer", display: "flex", alignItems: "center" }}>
                              <Trash2 size={11}/>
                            </button>
                          </div>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr key={`${dept._id}-desig`} style={{ borderBottom: "1px solid #e5e7eb" }}>
                          <td colSpan={7} style={{ padding: 0 }}>
                            <DesignationsPanel dept={dept} onRefresh={fetchDepts} showMsg={showMsg}/>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}