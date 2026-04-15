// DepartmentMaster.jsx — Radnus Department Management
// Auto-generate dept code from name initials + running number

import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  Building2, Plus, Search, RefreshCw, Pencil, Trash2,
  X, Users, Hash, ToggleLeft, ToggleRight,
  AlertTriangle, CheckCircle2, XCircle, Layers, Download,
  Info, EyeOff, ChevronUp, ChevronDown, Zap
} from "lucide-react";
import * as XLSX from "xlsx";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const labelStyle = {
  display:"block", fontSize:11, fontWeight:700, color:"#6b7280",
  marginBottom:5, textTransform:"uppercase", letterSpacing:"0.05em"
};
const errStyle = { margin:"4px 0 0", fontSize:11, color:"#ef4444" };
const COLORS = ["#3b82f6","#8b5cf6","#f59e0b","#10b981","#ef4444","#ec4899","#06b6d4","#84cc16","#f97316","#6366f1"];
const getColor = (name="") => COLORS[(name.charCodeAt(0)||0) % COLORS.length];

// ─── Auto Code Generator ──────────────────────────────────────────────────────
function generateAutoCode(name, existingDepts, currentId = null) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "";
  const initials = words.map(w => w[0].toUpperCase()).join("");
  let num = 1;
  while (
    existingDepts.some(d =>
      d.code === `${initials}-${String(num).padStart(3, "0")}` &&
      d._id !== currentId
    )
  ) { num++; }
  return `${initials}-${String(num).padStart(3, "0")}`;
}

// ─── Dept Form Modal ──────────────────────────────────────────────────────────
function DeptFormModal({ dept, onClose, onSave, depts = [] }) {
  const isEdit = !!dept?._id;
  const [form, setForm] = useState({
    name:        dept?.name        || "",
    code:        dept?.code        || "",
    head:        dept?.head        || "",
    description: dept?.description || "",
    status:      dept?.status      ?? "active",
  });
  const [saving, setSaving]   = useState(false);
  const [errors, setErrors]   = useState({});
  const [codeEdited, setCodeEdited] = useState(isEdit); // if user manually edits code, stop auto

  const handleNameChange = (e) => {
    const name = e.target.value;
    setErrors(v => ({ ...v, name: "" }));
    if (!codeEdited && !isEdit) {
      const autoCode = generateAutoCode(name, depts);
      setForm(f => ({ ...f, name, code: autoCode }));
    } else {
      setForm(f => ({ ...f, name }));
    }
  };

  const handleCodeChange = (e) => {
    const code = e.target.value.toUpperCase();
    setCodeEdited(true);
    setErrors(v => ({ ...v, code: "" }));
    setForm(f => ({ ...f, code }));
  };

  const handleRegenCode = () => {
    if (!form.name.trim()) return;
    const autoCode = generateAutoCode(form.name, depts, dept?._id);
    setForm(f => ({ ...f, code: autoCode }));
    setCodeEdited(false);
    setErrors(v => ({ ...v, code: "" }));
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
    await onSave(form);
    setSaving(false);
  };

  const inputStyle = (key) => ({
    width:"100%", padding:"9px 11px",
    background: errors[key] ? "#fef2f2" : "#f9fafb",
    border:`1px solid ${errors[key] ? "#fca5a5" : "#e5e7eb"}`,
    borderRadius:8, color:"#111827", fontSize:13,
    outline:"none", boxSizing:"border-box", fontFamily:"inherit",
  });

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(15,23,42,.45)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:16, overflowY:"auto" }}>
      <div style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:16, width:"100%", maxWidth:540, boxShadow:"0 20px 60px rgba(0,0,0,.15)", margin:"auto" }}>

        {/* Header */}
        <div style={{ background:"#f9fafb", padding:"16px 22px", borderRadius:"16px 16px 0 0", borderBottom:"1px solid #e5e7eb", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ display:"flex", alignItems:"center", gap:9 }}>
            <div style={{ width:34, height:34, borderRadius:9, background:"#eff6ff", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Building2 size={16} color="#3b82f6"/>
            </div>
            <div>
              <p style={{ margin:0, fontWeight:800, color:"#111827", fontSize:14 }}>{isEdit ? "Edit Department" : "Add Department"}</p>
              <p style={{ margin:0, fontSize:11, color:"#9ca3af" }}>{isEdit ? "Update department details" : "Code auto-generates from name"}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background:"#e5e7eb", border:"none", borderRadius:7, width:28, height:28, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"#6b7280" }}>
            <X size={14}/>
          </button>
        </div>

        <div style={{ padding:"20px 22px", display:"flex", flexDirection:"column", gap:14 }}>

          {/* Name + Code row */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>

            {/* Department Name */}
            <div>
              <label style={labelStyle}>Department Name <span style={{ color:"#ef4444" }}>*</span></label>
              <input
                value={form.name}
                onChange={handleNameChange}
                placeholder="e.g. Human Resources"
                style={inputStyle("name")}
              />
              {errors.name && <p style={errStyle}>{errors.name}</p>}
            </div>

            {/* Department Code — auto + regen button */}
            <div>
              <label style={{ ...labelStyle, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span>Department Code <span style={{ color:"#ef4444" }}>*</span></span>
                {!isEdit && (
                  <button
                    onClick={handleRegenCode}
                    title="Re-generate code from name"
                    style={{ display:"inline-flex", alignItems:"center", gap:3, background:"#eff6ff", border:"1px solid #bfdbfe", borderRadius:5, padding:"2px 7px", color:"#3b82f6", fontSize:10, fontWeight:700, cursor:"pointer", textTransform:"none", letterSpacing:0 }}>
                    <Zap size={9}/> Auto
                  </button>
                )}
              </label>
              <input
                value={form.code}
                onChange={handleCodeChange}
                placeholder="e.g. HR-001"
                style={{
                  ...inputStyle("code"),
                  fontFamily:"monospace",
                  background: !codeEdited && !isEdit ? "#f0fdf4" : errors.code ? "#fef2f2" : "#f9fafb",
                  borderColor: !codeEdited && !isEdit ? "#86efac" : errors.code ? "#fca5a5" : "#e5e7eb",
                }}
              />
              {!codeEdited && !isEdit && form.code && (
                <p style={{ margin:"4px 0 0", fontSize:10, color:"#16a34a", display:"flex", alignItems:"center", gap:3 }}>
                  <Zap size={9}/> Auto-generated · you can edit
                </p>
              )}
              {errors.code && <p style={errStyle}>{errors.code}</p>}
            </div>
          </div>

          {/* Head */}
          <div>
            <label style={labelStyle}>Department Head</label>
            <input value={form.head} onChange={e => setForm(f => ({ ...f, head: e.target.value }))}
              placeholder="e.g. Priya Sharma" style={inputStyle("head")}/>
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle}>Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Brief description of this department's responsibilities..."
              style={{ ...inputStyle("description"), minHeight:68, resize:"vertical" }}/>
          </div>

          {/* Status */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", background:"#f9fafb", borderRadius:9, padding:"11px 14px", border:"1px solid #e5e7eb" }}>
            <div>
              <p style={{ margin:0, fontWeight:700, fontSize:13, color:"#111827" }}>Status</p>
              <p style={{ margin:0, fontSize:11, color:"#9ca3af" }}>Active departments appear in all module dropdowns</p>
            </div>
            <button onClick={() => setForm(f => ({ ...f, status: f.status === "active" ? "inactive" : "active" }))}
              style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 12px", border:"none", borderRadius:7, background: form.status === "active" ? "#ecfdf5" : "#fef2f2", color: form.status === "active" ? "#059669" : "#dc2626", fontWeight:700, fontSize:12, cursor:"pointer" }}>
              {form.status === "active" ? <ToggleRight size={16}/> : <ToggleLeft size={16}/>}
              {form.status === "active" ? "Active" : "Inactive"}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding:"0 22px 20px", display:"flex", gap:10 }}>
          <button onClick={onClose} style={{ flex:1, padding:"10px", background:"#fff", border:"1px solid #e5e7eb", borderRadius:9, color:"#6b7280", fontWeight:600, cursor:"pointer", fontSize:13 }}>Cancel</button>
          <button onClick={handle} disabled={saving}
            style={{ flex:2, padding:"10px", background: saving ? "#93c5fd" : "#3b82f6", border:"none", borderRadius:9, color:"#fff", fontWeight:700, fontSize:14, cursor: saving ? "not-allowed" : "pointer" }}>
            {saving ? "Saving..." : isEdit ? "Update Department" : "Create Department"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete / Inactive Choice Modal ──────────────────────────────────────────
function DeleteChoiceModal({ dept, employeeCount, onClose, onDelete, onMarkInactive }) {
  const hasEmployees = employeeCount > 0;
  const [acting, setActing] = useState(null);

  const handleDelete = async () => {
    setActing("delete");
    await onDelete();
    setActing(null);
  };

  const handleInactive = async () => {
    setActing("inactive");
    await onMarkInactive();
    setActing(null);
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(15,23,42,.45)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
      <div style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:16, width:"100%", maxWidth:440, boxShadow:"0 20px 60px rgba(0,0,0,.15)", overflow:"hidden" }}>

        <div style={{ background:"#fef2f2", padding:"16px 20px", borderBottom:"1px solid #fecaca", display:"flex", gap:11, alignItems:"flex-start" }}>
          <div style={{ width:38, height:38, borderRadius:"50%", background:"#fee2e2", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <Trash2 size={17} color="#dc2626"/>
          </div>
          <div style={{ flex:1 }}>
            <p style={{ margin:0, fontWeight:800, fontSize:14, color:"#111827" }}>Remove Department</p>
            <p style={{ margin:0, fontSize:12, color:"#6b7280", marginTop:2 }}>
              Choose what to do with <strong>"{dept.name}"</strong>
            </p>
          </div>
          <button onClick={onClose} style={{ background:"#fee2e2", border:"none", borderRadius:7, width:26, height:26, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"#dc2626", flexShrink:0 }}>
            <X size={13}/>
          </button>
        </div>

        <div style={{ padding:"16px 20px", display:"flex", flexDirection:"column", gap:10 }}>

          {hasEmployees && (
            <div style={{ background:"#fffbeb", border:"1px solid #fde68a", borderRadius:8, padding:"9px 12px", display:"flex", gap:8, alignItems:"flex-start" }}>
              <AlertTriangle size={13} color="#f59e0b" style={{ flexShrink:0, marginTop:1 }}/>
              <p style={{ margin:0, fontSize:12, color:"#92400e", lineHeight:1.5 }}>
                This department has <strong>{employeeCount} active employee{employeeCount > 1 ? "s" : ""}</strong>. Deleting will unlink them from this department.
              </p>
            </div>
          )}

          {/* Mark Inactive */}
          <div style={{ border:"2px solid #e5e7eb", borderRadius:11, padding:"14px 15px", background:"#fff" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#3b82f6"; e.currentTarget.style.background = "#f8fbff"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.background = "#fff"; }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ width:30, height:30, borderRadius:8, background:"#fffbeb", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <EyeOff size={14} color="#f59e0b"/>
                </div>
                <p style={{ margin:0, fontWeight:700, fontSize:13, color:"#111827" }}>Mark as Inactive</p>
              </div>
              <span style={{ background:"#ecfdf5", color:"#059669", fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:20, border:"1px solid #6ee7b7" }}>RECOMMENDED</span>
            </div>
            <p style={{ margin:"0 0 10px 38px", fontSize:12, color:"#6b7280", lineHeight:1.5 }}>
              Hides from all dropdowns but keeps historical data safe. Can be reactivated anytime.
            </p>
            <button onClick={handleInactive} disabled={acting === "inactive" || dept.status === "inactive"}
              style={{ marginLeft:38, padding:"6px 14px", background: dept.status === "inactive" ? "#f3f4f6" : "#fffbeb", border:`1px solid ${dept.status === "inactive" ? "#e5e7eb" : "#fde68a"}`, borderRadius:7, color: dept.status === "inactive" ? "#9ca3af" : "#92400e", fontWeight:700, fontSize:12, cursor: dept.status === "inactive" ? "not-allowed" : "pointer", display:"inline-flex", alignItems:"center", gap:5 }}>
              <EyeOff size={11}/>
              {acting === "inactive" ? "Updating..." : dept.status === "inactive" ? "Already Inactive" : "Mark Inactive"}
            </button>
          </div>

          {/* Delete Permanently */}
          <div style={{ border:"2px solid #e5e7eb", borderRadius:11, padding:"14px 15px", background:"#fff" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#ef4444"; e.currentTarget.style.background = "#fffafa"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.background = "#fff"; }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
              <div style={{ width:30, height:30, borderRadius:8, background:"#fef2f2", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <Trash2 size={14} color="#ef4444"/>
              </div>
              <p style={{ margin:0, fontWeight:700, fontSize:13, color:"#111827" }}>Delete Permanently</p>
            </div>
            <p style={{ margin:"0 0 10px 38px", fontSize:12, color:"#6b7280", lineHeight:1.5 }}>
              Removes this department forever. Cannot be undone.
              {hasEmployees && <span style={{ color:"#ef4444" }}> Employees will be unlinked.</span>}
            </p>
            <button onClick={handleDelete} disabled={acting === "delete"}
              style={{ marginLeft:38, padding:"6px 14px", background:"#fef2f2", border:"1px solid #fecaca", borderRadius:7, color:"#dc2626", fontWeight:700, fontSize:12, cursor: acting === "delete" ? "not-allowed" : "pointer", display:"inline-flex", alignItems:"center", gap:5 }}>
              <Trash2 size={11}/>
              {acting === "delete" ? "Deleting..." : "Delete Permanently"}
            </button>
          </div>

          <button onClick={onClose} style={{ padding:"9px", background:"#f9fafb", border:"1px solid #e5e7eb", borderRadius:9, color:"#6b7280", fontWeight:600, cursor:"pointer", fontSize:13 }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function DepartmentMaster() {
  const [depts, setDepts]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [filterStatus, setFilter]   = useState("all");
  const [showForm, setShowForm]     = useState(false);
  const [editDept, setEditDept]     = useState(null);
  const [actionDept, setActionDept] = useState(null);
  const [toast, setToast]           = useState(null);
  const [sortField, setSortField]   = useState("name");
  const [sortDir, setSortDir]       = useState("asc");

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
      await axios.patch(`${API_BASE}/api/departments/${actionDept.dept._id}/status`, { status:"inactive" });
      showMsg("Department marked as inactive");
      setActionDept(null); fetchDepts();
    } catch { showMsg("Update failed", "error"); }
  };

  const handleToggleStatus = async (dept) => {
    try {
      const s = dept.status === "active" ? "inactive" : "active";
      await axios.patch(`${API_BASE}/api/departments/${dept._id}/status`, { status: s });
      showMsg(`Marked as ${s}`);
      fetchDepts();
    } catch { showMsg("Status update failed", "error"); }
  };

  const exportExcel = () => {
    const rows = filtered.map((d, i) => ({
      "#": i + 1, "Department Name": d.name, "Code": d.code,
      "Department Head": d.head || "—", "Employees": d.employeeCount ?? 0,
      "Status": d.status, "Description": d.description || "—",
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Departments");
    XLSX.writeFile(wb, `Departments_${Date.now()}.xlsx`);
  };

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ChevronDown size={11} color="#d1d5db"/>;
    return sortDir === "asc" ? <ChevronUp size={11} color="#3b82f6"/> : <ChevronDown size={11} color="#3b82f6"/>;
  };

  const filtered = useMemo(() => {
    let d = [...depts];
    if (filterStatus !== "all") d = d.filter(x => x.status === filterStatus);
    if (search.trim()) {
      const q = search.toLowerCase();
      d = d.filter(x =>
        x.name?.toLowerCase().includes(q) || x.code?.toLowerCase().includes(q) ||
        x.head?.toLowerCase().includes(q) || x.description?.toLowerCase().includes(q)
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
    <div style={{ display:"flex", justifyContent:"center", alignItems:"center", height:"60vh", background:"#f3f4f6" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ width:34, height:34, border:"3px solid #e5e7eb", borderTopColor:"#3b82f6", borderRadius:"50%", animation:"spin .8s linear infinite", margin:"0 auto 10px" }}/>
        <p style={{ color:"#9ca3af", fontSize:13 }}>Loading departments...</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );

  return (
    <div style={{ fontFamily:"'Segoe UI',sans-serif", minHeight:"100vh", background:"#f3f4f6", color:"#111827" }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .dept-row:hover{background:#f9fafb!important}
        .action-btn:hover{opacity:.8}
        .sort-th{cursor:pointer;user-select:none}
        .sort-th:hover{background:#f0f4f8!important}
        input:focus,select:focus,textarea:focus{border-color:#3b82f6!important;box-shadow:0 0 0 3px rgba(59,130,246,.08)!important}
        ::-webkit-scrollbar{width:5px;height:5px}
        ::-webkit-scrollbar-thumb{background:#d1d5db;border-radius:3px}
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position:"fixed", top:18, right:16, zIndex:9999, background: toast.type === "error" ? "#ef4444" : "#10b981", color:"#fff", padding:"11px 16px", borderRadius:9, fontWeight:600, fontSize:13, boxShadow:"0 8px 24px rgba(0,0,0,.15)", animation:"fadeUp .25s ease", display:"flex", alignItems:"center", gap:7 }}>
          {toast.type === "error" ? <XCircle size={14}/> : <CheckCircle2 size={14}/>}
          {toast.msg}
        </div>
      )}

      {/* Modals */}
      {showForm && (
        <DeptFormModal
          dept={editDept}
          onClose={() => { setShowForm(false); setEditDept(null); }}
          onSave={handleSave}
          depts={depts}
        />
      )}
      {actionDept && (
        <DeleteChoiceModal
          dept={actionDept.dept}
          employeeCount={actionDept.employeeCount}
          onClose={() => setActionDept(null)}
          onDelete={handleDelete}
          onMarkInactive={handleMarkInactive}
        />
      )}

      {/* Header */}
      <div style={{ background:"#fff", borderBottom:"1px solid #e5e7eb", padding:"15px 28px", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12, position:"sticky", top:0, zIndex:100 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:"linear-gradient(135deg,#3b82f6,#8b5cf6)", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Building2 size={18} color="#fff"/>
          </div>
          <div>
            <h1 style={{ margin:0, fontSize:17, fontWeight:800, color:"#111827", letterSpacing:"-0.01em" }}>Department Master</h1>
            <p style={{ margin:0, fontSize:11, color:"#9ca3af" }}>Manage departments · used across all modules</p>
          </div>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={exportExcel} style={{ display:"flex", alignItems:"center", gap:5, padding:"8px 13px", background:"#fff", border:"1px solid #e5e7eb", borderRadius:8, color:"#6b7280", fontWeight:600, fontSize:12, cursor:"pointer" }}>
            <Download size={13}/> Export
          </button>
          <button onClick={() => { setEditDept(null); setShowForm(true); }}
            style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 16px", background:"#3b82f6", border:"none", borderRadius:8, fontWeight:700, fontSize:13, cursor:"pointer", color:"#fff" }}>
            <Plus size={14}/> Add Department
          </button>
        </div>
      </div>

      <div style={{ padding:"24px 28px", maxWidth:1300, margin:"0 auto" }}>

        {/* Stats */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:13, marginBottom:22 }}>
          {[
            { label:"Total Departments", value:stats.total,    icon:<Layers size={18}/>,       color:"#3b82f6", bg:"#eff6ff" },
            { label:"Active",            value:stats.active,   icon:<ToggleRight size={18}/>,  color:"#10b981", bg:"#ecfdf5" },
            { label:"Inactive",          value:stats.inactive, icon:<ToggleLeft size={18}/>,   color:"#f59e0b", bg:"#fffbeb" },
            { label:"Total Employees",   value:stats.totalEmp, icon:<Users size={18}/>,         color:"#8b5cf6", bg:"#f5f3ff" },
          ].map((s, i) => (
            <div key={i} style={{ background:"#fff", borderRadius:12, padding:"16px 20px", border:"1px solid #e5e7eb", display:"flex", justifyContent:"space-between", alignItems:"center", animation:"fadeUp .25s ease both", animationDelay:`${i * 0.05}s` }}>
              <div>
                <p style={{ margin:"0 0 4px", fontSize:11, color:"#9ca3af", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em" }}>{s.label}</p>
                <p style={{ margin:0, fontSize:26, fontWeight:900, color:s.color }}>{s.value}</p>
              </div>
              <div style={{ width:42, height:42, borderRadius:10, background:s.bg, display:"flex", alignItems:"center", justifyContent:"center", color:s.color }}>{s.icon}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ background:"#fff", borderRadius:10, padding:"12px 14px", border:"1px solid #e5e7eb", marginBottom:14, display:"flex", gap:10, flexWrap:"wrap", alignItems:"center" }}>
          <div style={{ display:"flex", alignItems:"center", gap:7, flex:1, minWidth:200, background:"#f9fafb", borderRadius:8, padding:"7px 11px", border:"1px solid #e5e7eb" }}>
            <Search size={13} color="#9ca3af"/>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, code, head, description..."
              style={{ background:"none", border:"none", color:"#111827", fontSize:13, outline:"none", width:"100%" }}/>
            {search && (
              <button onClick={() => setSearch("")} style={{ background:"none", border:"none", cursor:"pointer", color:"#9ca3af", padding:0, display:"flex" }}>
                <X size={13}/>
              </button>
            )}
          </div>
          <div style={{ display:"flex", background:"#f9fafb", borderRadius:8, border:"1px solid #e5e7eb", overflow:"hidden" }}>
            {[["all","All"],["active","Active"],["inactive","Inactive"]].map(([val, lbl]) => (
              <button key={val} onClick={() => setFilter(val)}
                style={{ padding:"7px 14px", border:"none", background: filterStatus === val ? "#3b82f6" : "transparent", color: filterStatus === val ? "#fff" : "#6b7280", fontWeight:600, fontSize:12, cursor:"pointer", transition:"all .15s" }}>
                {lbl}
              </button>
            ))}
          </div>
          <button onClick={fetchDepts} style={{ padding:"8px 11px", background:"#f9fafb", border:"1px solid #e5e7eb", borderRadius:8, color:"#6b7280", cursor:"pointer", display:"flex", alignItems:"center", gap:4, fontSize:12 }}>
            <RefreshCw size={12}/> Refresh
          </button>
          <span style={{ fontSize:12, color:"#9ca3af" }}>{filtered.length} dept{filtered.length !== 1 ? "s" : ""}</span>
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <div style={{ textAlign:"center", padding:"60px 0", background:"#fff", borderRadius:12, border:"1px solid #e5e7eb" }}>
            <div style={{ display:"flex", justifyContent:"center", marginBottom:12, color:"#d1d5db" }}><Building2 size={40}/></div>
            <p style={{ color:"#6b7280", fontWeight:600, fontSize:15 }}>{search || filterStatus !== "all" ? "No departments match your filter" : "No departments yet"}</p>
            <p style={{ color:"#9ca3af", fontSize:13 }}>Click "Add Department" to get started.</p>
          </div>
        ) : (
          <div style={{ background:"#fff", borderRadius:12, border:"1px solid #e5e7eb", overflow:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13, minWidth:820 }}>
              <thead>
                <tr style={{ background:"#f9fafb" }}>
                  {[
                    { key:"name",          label:"Department", w:210 },
                    { key:"code",          label:"Code",       w:115 },
                    { key:"head",          label:"Head",       w:160 },
                    { key:"employeeCount", label:"Employees",  w:110 },
                    { key:"status",        label:"Status",     w:120 },
                    { key:"description",   label:"Description",w:null },
                    { key:"actions",       label:"Actions",    w:110, noSort:true },
                  ].map(h => (
                    <th key={h.key} onClick={h.noSort ? undefined : () => handleSort(h.key)}
                      className={h.noSort ? "" : "sort-th"}
                      style={{ padding:"11px 16px", textAlign:"left", fontWeight:700, color:"#6b7280", borderBottom:"1px solid #e5e7eb", fontSize:11, textTransform:"uppercase", letterSpacing:"0.05em", whiteSpace:"nowrap", width:h.w || undefined, background:"#f9fafb" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:4 }}>{h.label}{!h.noSort && <SortIcon field={h.key}/>}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((dept) => {
                  const clr = getColor(dept.name);
                  return (
                    <tr key={dept._id} className="dept-row" style={{ borderBottom:"1px solid #f3f4f6", transition:"background .12s" }}>

                      <td style={{ padding:"12px 16px" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                          <div style={{ width:34, height:34, borderRadius:9, background:`${clr}12`, border:`1px solid ${clr}30`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                            <Building2 size={15} color={clr}/>
                          </div>
                          <p style={{ margin:0, fontWeight:700, color:"#111827", fontSize:13 }}>{dept.name}</p>
                        </div>
                      </td>

                      <td style={{ padding:"12px 16px" }}>
                        <span style={{ background:"#f3f4f6", color:"#374151", padding:"3px 9px", borderRadius:6, fontSize:12, fontWeight:700, fontFamily:"monospace", display:"inline-flex", alignItems:"center", gap:4 }}>
                          <Hash size={10}/>{dept.code || "—"}
                        </span>
                      </td>

                      <td style={{ padding:"12px 16px" }}>
                        {dept.head ? (
                          <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                            <div style={{ width:26, height:26, borderRadius:"50%", background:`${clr}15`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:clr, flexShrink:0 }}>
                              {dept.head.charAt(0).toUpperCase()}
                            </div>
                            <span style={{ fontSize:13, color:"#374151" }}>{dept.head}</span>
                          </div>
                        ) : (
                          <span style={{ color:"#d1d5db", fontSize:12 }}>Not assigned</span>
                        )}
                      </td>

                      <td style={{ padding:"12px 16px" }}>
                        <span style={{ display:"inline-flex", alignItems:"center", gap:5, background:"#f5f3ff", color:"#7c3aed", padding:"4px 10px", borderRadius:20, fontSize:12, fontWeight:700, border:"1px solid #ddd6fe" }}>
                          <Users size={11}/>{dept.employeeCount ?? 0}
                        </span>
                      </td>

                      <td style={{ padding:"12px 16px" }}>
                        <button onClick={() => handleToggleStatus(dept)} className="action-btn"
                          style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"4px 10px", background: dept.status === "active" ? "#ecfdf5" : "#f3f4f6", border:`1px solid ${dept.status === "active" ? "#6ee7b7" : "#e5e7eb"}`, borderRadius:20, color: dept.status === "active" ? "#059669" : "#9ca3af", fontSize:11, fontWeight:700, cursor:"pointer" }}>
                          {dept.status === "active" ? <ToggleRight size={13}/> : <ToggleLeft size={13}/>}
                          {dept.status === "active" ? "Active" : "Inactive"}
                        </button>
                      </td>

                      <td style={{ padding:"12px 16px" }}>
                        <p style={{ margin:0, fontSize:12, color:"#9ca3af", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", maxWidth:200 }}>
                          {dept.description || <span style={{ color:"#d1d5db" }}>—</span>}
                        </p>
                      </td>

                      <td style={{ padding:"12px 16px" }}>
                        <div style={{ display:"flex", gap:6 }}>
                          <button className="action-btn" onClick={() => { setEditDept(dept); setShowForm(true); }}
                            style={{ padding:"5px 10px", background:"#eff6ff", border:"1px solid #bfdbfe", borderRadius:7, color:"#3b82f6", fontSize:11, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:4 }}>
                            <Pencil size={11}/> Edit
                          </button>
                          <button className="action-btn" onClick={() => openDeleteModal(dept)}
                            style={{ padding:"5px 8px", background:"#fef2f2", border:"1px solid #fecaca", borderRadius:7, color:"#dc2626", cursor:"pointer", display:"flex", alignItems:"center" }}>
                            <Trash2 size={12}/>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Info */}
        <div style={{ marginTop:14, background:"#eff6ff", borderRadius:10, border:"1px solid #bfdbfe", padding:"11px 15px", display:"flex", gap:9, alignItems:"flex-start" }}>
          <Info size={14} color="#3b82f6" style={{ flexShrink:0, marginTop:1 }}/>
          <p style={{ margin:0, fontSize:12, color:"#1e40af", lineHeight:1.6 }}>
            <strong>Tip:</strong> Department Code is auto-generated from name initials (e.g. "Human Resources" → HR-001). You can manually edit the code anytime. Click <strong>⚡ Auto</strong> to regenerate. Active departments appear in employee forms, awards, payroll and all other modules.
          </p>
        </div>

      </div>
    </div>
  );
}