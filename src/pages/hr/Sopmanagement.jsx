import { useState, useEffect, useMemo, useRef } from "react";
import axios from "axios";
import {
  FileText, Plus, Search, RefreshCw, Pencil, Trash2,
  X, ToggleLeft, ToggleRight, CheckCircle2, XCircle,
  Download, ChevronUp, ChevronDown, Building2, Tag,
  Layers, AlertTriangle, EyeOff, BookOpen, Upload,
  Filter, FileCheck
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const COLORS = ["#2563eb","#7c3aed","#d97706","#059669","#dc2626","#db2777","#0891b2","#65a30d","#ea580c","#4f46e5"];
const getColor = (name = "") => COLORS[(name.charCodeAt(0) || 0) % COLORS.length];

const labelStyle = {
  display: "block", fontSize: 11, fontWeight: 700, color: "#6b7280",
  marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.06em"
};
const errStyle = { margin: "4px 0 0", fontSize: 11, color: "#ef4444" };

// ─── SOP Form Modal ───────────────────────────────────────────────────────────
function SOPFormModal({ sop, departments, onClose, onSave }) {
  const isEdit = !!sop?._id;
  const fileRef = useRef();

  const [form, setForm] = useState({
    title:       sop?.title       || "",
    department:  sop?.department  || "",
    designation: sop?.designation || "",
    status:      sop?.status      ?? "active",
  });
  const [file,        setFile]        = useState(null);
  const [errors,      setErrors]      = useState({});
  const [saving,      setSaving]      = useState(false);
  const [designations, setDesignations] = useState([]);

  // When department changes → load its active designations
  useEffect(() => {
    if (!form.department) { setDesignations([]); return; }
    const found = departments.find(d => d.name === form.department);
    if (found) {
      setDesignations((found.designations || []).filter(d => d.status === "active"));
    } else {
      setDesignations([]);
    }
    setForm(f => ({ ...f, designation: "" }));
  }, [form.department, departments]);

  const inp = (key) => ({
    width: "100%", padding: "9px 12px",
    background: errors[key] ? "#fef2f2" : "#fff",
    border: `1.5px solid ${errors[key] ? "#fca5a5" : "#e5e7eb"}`,
    borderRadius: 8, color: "#111827", fontSize: 13,
    outline: "none", boxSizing: "border-box", fontFamily: "inherit",
    transition: "border-color .15s",
  });

  const validate = () => {
    const e = {};
    if (!form.title.trim())      e.title      = "Title is required";
    if (!form.department.trim()) e.department  = "Department is required";
    if (!isEdit && !file)        e.file        = "Please upload a .doc or .docx file";
    return e;
  };

  const handle = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);

    const fd = new FormData();
    fd.append("title",       form.title.trim());
    fd.append("department",  form.department.trim());
    fd.append("designation", form.designation?.trim() || "");
    fd.append("status",      form.status);
    if (file) fd.append("file", file);

    await onSave(fd, isEdit ? sop._id : null);
    setSaving(false);
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(15,23,42,.55)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:16, backdropFilter:"blur(4px)" }}>
      <div style={{ background:"#fff", borderRadius:16, width:"100%", maxWidth:520, boxShadow:"0 24px 64px rgba(0,0,0,.18)", border:"1px solid #e5e7eb", overflow:"hidden" }}>

        {/* Header */}
        <div style={{ padding:"18px 24px 14px", borderBottom:"1px solid #f3f4f6", display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <div>
            <p style={{ margin:0, fontWeight:800, color:"#0f172a", fontSize:15, letterSpacing:"-0.01em" }}>
              {isEdit ? "Edit SOP" : "New SOP"}
            </p>
            <p style={{ margin:"2px 0 0", fontSize:11, color:"#9ca3af" }}>
              {isEdit ? "Update SOP details or replace file" : "Assign to a department and optionally a specific role"}
            </p>
          </div>
          <button onClick={onClose} style={{ width:28, height:28, borderRadius:7, background:"#f3f4f6", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#6b7280" }}>
            <X size={13}/>
          </button>
        </div>

        <div style={{ padding:"20px 24px", overflowY:"auto", maxHeight:"68vh", display:"flex", flexDirection:"column", gap:14 }}>

          {/* Title */}
          <div>
            <label style={labelStyle}>SOP Title <span style={{ color:"#ef4444" }}>*</span></label>
            <input value={form.title} onChange={e => { setForm(f => ({ ...f, title: e.target.value })); setErrors(v => ({ ...v, title:"" })); }}
              placeholder="e.g. Monthly Account Closing Procedure"
              style={inp("title")}/>
            {errors.title && <p style={errStyle}>{errors.title}</p>}
          </div>

          {/* Department */}
          <div>
            <label style={labelStyle}>Department <span style={{ color:"#ef4444" }}>*</span></label>
            <select value={form.department}
              onChange={e => { setForm(f => ({ ...f, department: e.target.value })); setErrors(v => ({ ...v, department:"" })); }}
              style={{ ...inp("department"), cursor:"pointer" }}>
              <option value="">Select Department</option>
              {departments
                .filter(d => !d.status || d.status === "active")
                .map(d => (
                  <option key={d._id} value={d.name}>{d.name}</option>
                ))}
            </select>
            {errors.department && <p style={errStyle}>{errors.department}</p>}
          </div>

          {/* Designation */}
          <div>
            <label style={labelStyle}>
              Designation
              <span style={{ marginLeft:6, background:"#eff6ff", color:"#2563eb", borderRadius:4, padding:"1px 6px", fontSize:10, fontWeight:700, border:"1px solid #bfdbfe" }}>
                Optional — leave blank for all roles
              </span>
            </label>
            {form.department && designations.length > 0 ? (
              <select value={form.designation}
                onChange={e => setForm(f => ({ ...f, designation: e.target.value }))}
                style={{ ...inp("designation"), cursor:"pointer" }}>
                <option value="">All roles in this department</option>
                {designations.map(dg => (
                  <option key={dg._id || dg.title} value={dg.title}>{dg.title}</option>
                ))}
              </select>
            ) : (
              <input value={form.designation}
                onChange={e => setForm(f => ({ ...f, designation: e.target.value }))}
                placeholder={form.department ? "No active roles — type manually (optional)" : "Select a department first"}
                disabled={!form.department}
                style={{ ...inp("designation"), background: !form.department ? "#f9fafb" : "#fff", color: !form.department ? "#9ca3af" : "#111827" }}/>
            )}
            <p style={{ margin:"4px 0 0", fontSize:11, color:"#9ca3af" }}>
              If blank → shown to ALL roles in the selected department
            </p>
          </div>

          {/* File Upload */}
          <div>
            <label style={labelStyle}>
              {isEdit ? "Replace File (optional)" : "Upload File"} {!isEdit && <span style={{ color:"#ef4444" }}>*</span>}
            </label>
            <div
              onClick={() => fileRef.current?.click()}
              style={{ border:`2px dashed ${errors.file ? "#fca5a5" : file ? "#86efac" : "#e5e7eb"}`, borderRadius:10, padding:"16px 20px", textAlign:"center", cursor:"pointer", background: file ? "#f0fdf4" : errors.file ? "#fef2f2" : "#fafafa", transition:"all .15s" }}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if(f) { setFile(f); setErrors(v => ({ ...v, file:"" })); } }}>
              <input ref={fileRef} type="file" accept=".doc,.docx" style={{ display:"none" }}
                onChange={e => { const f = e.target.files[0]; if(f) { setFile(f); setErrors(v => ({ ...v, file:"" })); } }}/>
              {file ? (
                <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                  <FileCheck size={16} color="#059669"/>
                  <span style={{ fontSize:13, fontWeight:700, color:"#059669" }}>{file.name}</span>
                  <button onClick={e => { e.stopPropagation(); setFile(null); }}
                    style={{ background:"#fee2e2", border:"none", borderRadius:5, width:20, height:20, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"#dc2626" }}>
                    <X size={10}/>
                  </button>
                </div>
              ) : (
                <>
                  <Upload size={18} color="#9ca3af" style={{ marginBottom:6 }}/>
                  <p style={{ margin:0, fontSize:13, color:"#6b7280", fontWeight:600 }}>Click or drag & drop your file here</p>
                  <p style={{ margin:"3px 0 0", fontSize:11, color:"#9ca3af" }}>.doc or .docx only · Max 10MB</p>
                  {isEdit && sop?.fileName && (
                    <p style={{ margin:"6px 0 0", fontSize:11, color:"#2563eb" }}>Current: {sop.fileName}</p>
                  )}
                </>
              )}
            </div>
            {errors.file && <p style={errStyle}>{errors.file}</p>}
          </div>

          {/* Status */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", background:"#f9fafb", borderRadius:9, padding:"11px 14px", border:"1.5px solid #e5e7eb" }}>
            <div>
              <p style={{ margin:0, fontWeight:700, fontSize:13, color:"#111827" }}>Status</p>
              <p style={{ margin:0, fontSize:11, color:"#9ca3af" }}>Inactive SOPs are hidden from employees</p>
            </div>
            <button onClick={() => setForm(f => ({ ...f, status: f.status === "active" ? "inactive" : "active" }))}
              style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 13px", border:"none", borderRadius:8, background: form.status === "active" ? "#ecfdf5" : "#fef2f2", color: form.status === "active" ? "#059669" : "#dc2626", fontWeight:700, fontSize:12, cursor:"pointer" }}>
              {form.status === "active" ? <ToggleRight size={15}/> : <ToggleLeft size={15}/>}
              {form.status === "active" ? "Active" : "Inactive"}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding:"14px 24px 20px", borderTop:"1px solid #f3f4f6", display:"flex", gap:10 }}>
          <button onClick={onClose} style={{ flex:1, padding:"10px", background:"#fff", border:"1.5px solid #e5e7eb", borderRadius:9, color:"#6b7280", fontWeight:600, cursor:"pointer", fontSize:13 }}>Cancel</button>
          <button onClick={handle} disabled={saving}
            style={{ flex:2, padding:"10px", background: saving ? "#93c5fd" : "#2563eb", border:"none", borderRadius:9, color:"#fff", fontWeight:700, fontSize:14, cursor: saving ? "not-allowed" : "pointer", letterSpacing:"-0.01em" }}>
            {saving ? "Saving…" : isEdit ? "Update SOP" : "Create SOP"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────
function DeleteModal({ sop, onClose, onDelete }) {
  const [deleting, setDeleting] = useState(false);
  const handle = async () => { setDeleting(true); await onDelete(); setDeleting(false); };
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(15,23,42,.55)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:16, backdropFilter:"blur(4px)" }}>
      <div style={{ background:"#fff", borderRadius:16, width:"100%", maxWidth:400, boxShadow:"0 24px 64px rgba(0,0,0,.18)", border:"1px solid #e5e7eb", overflow:"hidden" }}>
        <div style={{ background:"#fef2f2", padding:"16px 20px", borderBottom:"1px solid #fecaca", display:"flex", gap:11, alignItems:"flex-start" }}>
          <div style={{ width:36, height:36, borderRadius:"50%", background:"#fee2e2", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <Trash2 size={16} color="#dc2626"/>
          </div>
          <div style={{ flex:1 }}>
            <p style={{ margin:0, fontWeight:800, fontSize:14, color:"#0f172a" }}>Delete SOP</p>
            <p style={{ margin:"2px 0 0", fontSize:12, color:"#6b7280" }}>This will permanently delete <strong>"{sop.title}"</strong> and its file.</p>
          </div>
          <button onClick={onClose} style={{ background:"#fee2e2", border:"none", borderRadius:7, width:26, height:26, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"#dc2626" }}>
            <X size={12}/>
          </button>
        </div>
        <div style={{ padding:"16px 20px", display:"flex", gap:10 }}>
          <button onClick={onClose} style={{ flex:1, padding:"9px", background:"#f9fafb", border:"1.5px solid #e5e7eb", borderRadius:9, color:"#6b7280", fontWeight:600, cursor:"pointer", fontSize:13 }}>Cancel</button>
          <button onClick={handle} disabled={deleting}
            style={{ flex:1, padding:"9px", background: deleting ? "#fca5a5" : "#dc2626", border:"none", borderRadius:9, color:"#fff", fontWeight:700, fontSize:13, cursor: deleting ? "not-allowed" : "pointer" }}>
            {deleting ? "Deleting…" : "Delete Permanently"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function SOPManagement() {
  const [sops,        setSops]        = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState("");
  const [filterDept,  setFilterDept]  = useState("all");
  const [filterStatus,setFilterStatus]= useState("all");
  const [showForm,    setShowForm]    = useState(false);
  const [editSop,     setEditSop]     = useState(null);
  const [deleteSop,   setDeleteSop]   = useState(null);
  const [toast,       setToast]       = useState(null);
  const [sortField,   setSortField]   = useState("createdAt");
  const [sortDir,     setSortDir]     = useState("desc");

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);

    // ── Fetch departments separately — must never fail silently ──
    try {
      const deptRes = await axios.get(`${API_BASE}/api/departments`);
      setDepartments(deptRes.data.data || deptRes.data || []);
    } catch {
      showMsg("Failed to load departments", "error");
    }

    // ── Fetch SOPs separately — ok if route not ready yet ──
    try {
      const sopRes = await axios.get(`${API_BASE}/api/sops`);
      setSops(sopRes.data.data || sopRes.data || []);
    } catch {
      setSops([]); // silently empty — SOP route may not exist yet
    }

    setLoading(false);
  };

  const showMsg = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };

  const handleSave = async (formData, id = null) => {
    try {
      if (id) {
        await axios.put(`${API_BASE}/api/sops/${id}`, formData, { headers: { "Content-Type": "multipart/form-data" } });
        showMsg("SOP updated successfully");
      } else {
        await axios.post(`${API_BASE}/api/sops`, formData, { headers: { "Content-Type": "multipart/form-data" } });
        showMsg("SOP created successfully");
      }
      setShowForm(false); setEditSop(null); fetchAll();
    } catch (err) { showMsg(err?.response?.data?.message || "Save failed", "error"); }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API_BASE}/api/sops/${deleteSop._id}`);
      showMsg("SOP deleted permanently");
      setDeleteSop(null); fetchAll();
    } catch { showMsg("Delete failed", "error"); }
  };

  const handleToggleStatus = async (sop) => {
    try {
      const s = sop.status === "active" ? "inactive" : "active";
      await axios.patch(`${API_BASE}/api/sops/${sop._id}/status`, { status: s });
      showMsg(`SOP marked ${s}`); fetchAll();
    } catch { showMsg("Status update failed", "error"); }
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
    let d = [...sops];
    if (filterStatus !== "all") d = d.filter(x => x.status === filterStatus);
    if (filterDept   !== "all") d = d.filter(x => x.department === filterDept);
    if (search.trim()) {
      const q = search.toLowerCase();
      d = d.filter(x =>
        x.title?.toLowerCase().includes(q) ||
        x.department?.toLowerCase().includes(q) ||
        x.designation?.toLowerCase().includes(q) ||
        x.fileName?.toLowerCase().includes(q)
      );
    }
    d.sort((a, b) => {
      let av = a[sortField] || "", bv = b[sortField] || "";
      const cmp = av.toString().localeCompare(bv.toString());
      return sortDir === "asc" ? cmp : -cmp;
    });
    return d;
  }, [sops, filterStatus, filterDept, search, sortField, sortDir]);

  const stats = useMemo(() => ({
    total:    sops.length,
    active:   sops.filter(s => s.status === "active").length,
    inactive: sops.filter(s => s.status === "inactive").length,
    deptLevel: sops.filter(s => !s.designation).length,
    roleLevel: sops.filter(s => !!s.designation).length,
  }), [sops]);

  const uniqueDepts = useMemo(() => [...new Set(sops.map(s => s.department))].sort(), [sops]);

  if (loading) return (
    <div style={{ display:"flex", justifyContent:"center", alignItems:"center", height:"60vh" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ width:32, height:32, border:"3px solid #e5e7eb", borderTopColor:"#2563eb", borderRadius:"50%", animation:"spin .8s linear infinite", margin:"0 auto 10px" }}/>
        <p style={{ color:"#9ca3af", fontSize:13 }}>Loading…</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );

  const STAT_CARDS = [
    { label:"Total SOPs",       value:stats.total,     icon:<BookOpen size={16}/>,   color:"#2563eb", bg:"#eff6ff",  border:"#bfdbfe" },
    { label:"Active",           value:stats.active,    icon:<ToggleRight size={16}/>, color:"#059669", bg:"#ecfdf5",  border:"#6ee7b7" },
    { label:"Dept-Level SOPs",  value:stats.deptLevel, icon:<Building2 size={16}/>,  color:"#7c3aed", bg:"#faf5ff",  border:"#ddd6fe" },
    { label:"Role-Level SOPs",  value:stats.roleLevel, icon:<Tag size={16}/>,        color:"#d97706", bg:"#fffbeb",  border:"#fde68a" },
  ];

  const TH_COLS = [
    { key:"title",       label:"SOP Title",   w:260 },
    { key:"department",  label:"Department",  w:190 },
    { key:"designation", label:"Role",        w:160 },
    { key:"fileName",    label:"File",        w:180 },
    { key:"status",      label:"Status",      w:115 },
    { key:"actions",     label:"",            w:130, noSort:true },
  ];

  return (
    <div style={{ fontFamily:"'Segoe UI', system-ui, sans-serif", minHeight:"100vh", background:"#f3f4f6", color:"#111827" }}>
      <style>{`
        @keyframes spin   { to { transform: rotate(360deg) } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
        .sop-row { transition: background .12s; }
        .sop-row:hover { background: #f8faff !important; }
        .sort-th { cursor: pointer; user-select: none; }
        .sort-th:hover { background: #f0f4ff !important; }
        .btn-act { transition: opacity .12s; }
        .btn-act:hover { opacity: .78; }
        input:focus, select:focus { border-color: #2563eb !important; box-shadow: 0 0 0 3px rgba(37,99,235,.09) !important; }
        ::-webkit-scrollbar { width:5px; height:5px }
        ::-webkit-scrollbar-thumb { background:#d1d5db; border-radius:3px }
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position:"fixed", top:18, right:18, zIndex:9999, background: toast.type === "error" ? "#ef4444" : "#10b981", color:"#fff", padding:"11px 16px", borderRadius:10, fontWeight:600, fontSize:13, boxShadow:"0 8px 28px rgba(0,0,0,.18)", animation:"fadeUp .22s ease", display:"flex", alignItems:"center", gap:7 }}>
          {toast.type === "error" ? <XCircle size={14}/> : <CheckCircle2 size={14}/>}
          {toast.msg}
        </div>
      )}

      {showForm && (
        <SOPFormModal
          sop={editSop}
          departments={departments}
          onClose={() => { setShowForm(false); setEditSop(null); }}
          onSave={handleSave}
        />
      )}
      {deleteSop && (
        <DeleteModal sop={deleteSop} onClose={() => setDeleteSop(null)} onDelete={handleDelete}/>
      )}

      {/* Top Bar */}
      <div style={{ background:"#fff", borderBottom:"1px solid #e5e7eb", padding:"0 28px", height:56, display:"flex", justifyContent:"space-between", alignItems:"center", position:"sticky", top:0, zIndex:100, gap:12 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:34, height:34, borderRadius:9, background:"#eff6ff", border:"1px solid #bfdbfe", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <FileText size={16} color="#2563eb"/>
          </div>
          <div>
            <p style={{ margin:0, fontSize:14, fontWeight:800, color:"#0f172a", letterSpacing:"-0.02em" }}>SOP Management</p>
            <p style={{ margin:0, fontSize:11, color:"#9ca3af" }}>Manage standard operating procedures by department & role</p>
          </div>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={() => { setEditSop(null); setShowForm(true); }}
            style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 16px", background:"#2563eb", border:"none", borderRadius:8, fontWeight:700, fontSize:13, cursor:"pointer", color:"#fff", letterSpacing:"-0.01em" }}>
            <Plus size={14}/> Add SOP
          </button>
        </div>
      </div>

      <div style={{ padding:"22px 28px", maxWidth:1280, margin:"0 auto" }}>

        {/* Stat Cards */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:20 }}>
          {STAT_CARDS.map((s, i) => (
            <div key={i} style={{ background:"#fff", borderRadius:11, padding:"16px 20px", border:`1px solid ${s.border}`, display:"flex", justifyContent:"space-between", alignItems:"center", animation:"fadeUp .22s ease both", animationDelay:`${i * 0.04}s` }}>
              <div>
                <p style={{ margin:"0 0 3px", fontSize:11, color:"#9ca3af", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em" }}>{s.label}</p>
                <p style={{ margin:0, fontSize:28, fontWeight:900, color:s.color, letterSpacing:"-0.03em" }}>{s.value}</p>
              </div>
              <div style={{ width:40, height:40, borderRadius:9, background:s.bg, display:"flex", alignItems:"center", justifyContent:"center", color:s.color }}>{s.icon}</div>
            </div>
          ))}
        </div>

        {/* Filter Bar */}
        <div style={{ background:"#fff", borderRadius:10, padding:"10px 14px", border:"1px solid #e5e7eb", marginBottom:14, display:"flex", gap:10, flexWrap:"wrap", alignItems:"center" }}>
          {/* Search */}
          <div style={{ display:"flex", alignItems:"center", gap:7, flex:1, minWidth:220, background:"#f9fafb", borderRadius:8, padding:"7px 11px", border:"1.5px solid #e5e7eb" }}>
            <Search size={13} color="#9ca3af"/>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search title, department, role, file…"
              style={{ background:"none", border:"none", color:"#111827", fontSize:13, outline:"none", width:"100%" }}/>
            {search && (
              <button onClick={() => setSearch("")} style={{ background:"none", border:"none", cursor:"pointer", color:"#9ca3af", padding:0, display:"flex" }}>
                <X size={13}/>
              </button>
            )}
          </div>

          {/* Dept filter */}
          <div style={{ display:"flex", alignItems:"center", gap:6, background:"#f9fafb", borderRadius:8, padding:"7px 11px", border:"1.5px solid #e5e7eb" }}>
            <Filter size={12} color="#9ca3af"/>
            <select value={filterDept} onChange={e => setFilterDept(e.target.value)}
              style={{ background:"none", border:"none", color:"#374151", fontSize:13, outline:"none", cursor:"pointer", fontFamily:"inherit" }}>
              <option value="all">All Departments</option>
              {uniqueDepts.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          {/* Status filter */}
          <div style={{ display:"flex", background:"#f9fafb", borderRadius:8, border:"1.5px solid #e5e7eb", overflow:"hidden" }}>
            {[["all","All"],["active","Active"],["inactive","Inactive"]].map(([val, lbl]) => (
              <button key={val} onClick={() => setFilterStatus(val)}
                style={{ padding:"7px 15px", border:"none", background: filterStatus === val ? "#2563eb" : "transparent", color: filterStatus === val ? "#fff" : "#6b7280", fontWeight:700, fontSize:12, cursor:"pointer", transition:"all .15s" }}>
                {lbl}
              </button>
            ))}
          </div>

          <button onClick={fetchAll}
            style={{ padding:"7px 11px", background:"#f9fafb", border:"1.5px solid #e5e7eb", borderRadius:8, color:"#6b7280", cursor:"pointer", display:"flex", alignItems:"center", gap:4, fontSize:12 }}>
            <RefreshCw size={12}/> Refresh
          </button>
          <span style={{ fontSize:12, color:"#9ca3af", fontWeight:600 }}>{filtered.length} SOP{filtered.length !== 1 ? "s" : ""}</span>
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <div style={{ textAlign:"center", padding:"60px 0", background:"#fff", borderRadius:12, border:"1px solid #e5e7eb" }}>
            <FileText size={38} color="#e5e7eb" style={{ marginBottom:10 }}/>
            <p style={{ color:"#6b7280", fontWeight:700, fontSize:14, margin:"0 0 4px" }}>
              {search || filterStatus !== "all" || filterDept !== "all" ? "No SOPs match your filter" : "No SOPs yet"}
            </p>
            <p style={{ color:"#9ca3af", fontSize:13, margin:0 }}>Click "Add SOP" to create your first one.</p>
          </div>
        ) : (
          <div style={{ background:"#fff", borderRadius:12, border:"1px solid #e5e7eb", overflow:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13, minWidth:820 }}>
              <thead>
                <tr style={{ background:"#f8f9fb" }}>
                  {TH_COLS.map(h => (
                    <th key={h.key}
                      onClick={h.noSort ? undefined : () => handleSort(h.key)}
                      className={h.noSort ? "" : "sort-th"}
                      style={{ padding:"10px 16px", textAlign:"left", fontWeight:700, color:"#6b7280", borderBottom:"1px solid #e5e7eb", fontSize:11, textTransform:"uppercase", letterSpacing:"0.06em", whiteSpace:"nowrap", width:h.w || undefined, background:"#f8f9fb" }}>
                      {h.label && (
                        <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                          {h.label}{!h.noSort && <SortIcon field={h.key}/>}
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(sop => {
                  const clr = getColor(sop.department);
                  return (
                    <tr key={sop._id} className="sop-row" style={{ borderBottom:"1px solid #f3f4f6" }}>

                      {/* Title */}
                      <td style={{ padding:"12px 16px" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                          <div style={{ width:32, height:32, borderRadius:8, background:`${clr}12`, border:`1px solid ${clr}25`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                            <FileText size={14} color={clr}/>
                          </div>
                          <span style={{ fontWeight:700, color:"#0f172a", fontSize:13 }}>{sop.title}</span>
                        </div>
                      </td>

                      {/* Department */}
                      <td style={{ padding:"12px 16px" }}>
                        <span style={{ display:"inline-flex", alignItems:"center", gap:5, background:`${clr}10`, color:clr, padding:"4px 10px", borderRadius:20, fontSize:12, fontWeight:700, border:`1px solid ${clr}25` }}>
                          <Building2 size={10}/>{sop.department}
                        </span>
                      </td>

                      {/* Role */}
                      <td style={{ padding:"12px 16px" }}>
                        {sop.designation ? (
                          <span style={{ display:"inline-flex", alignItems:"center", gap:5, background:"#eff6ff", color:"#2563eb", padding:"4px 10px", borderRadius:20, fontSize:12, fontWeight:700, border:"1px solid #bfdbfe" }}>
                            <Tag size={10}/>{sop.designation}
                          </span>
                        ) : (
                          <span style={{ display:"inline-flex", alignItems:"center", gap:5, background:"#f0fdf4", color:"#059669", padding:"4px 10px", borderRadius:20, fontSize:12, fontWeight:700, border:"1px solid #bbf7d0" }}>
                            <Layers size={10}/>All Roles
                          </span>
                        )}
                      </td>

                      {/* File */}
                      <td style={{ padding:"12px 16px" }}>
                        <a href={`${API_BASE}/api/sops/download/${sop.fileUrl}`} target="_blank" rel="noreferrer"
                          style={{ display:"inline-flex", alignItems:"center", gap:5, background:"#f8f9fb", border:"1px solid #e5e7eb", borderRadius:7, padding:"5px 10px", color:"#374151", fontSize:12, fontWeight:600, textDecoration:"none", maxWidth:160 }}
                          title={sop.fileName}>
                          <Download size={11} color="#6b7280"/>
                          <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:120 }}>{sop.fileName}</span>
                        </a>
                      </td>

                      {/* Status */}
                      <td style={{ padding:"12px 16px" }}>
                        <button onClick={() => handleToggleStatus(sop)} className="btn-act"
                          style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"4px 10px", background: sop.status === "active" ? "#ecfdf5" : "#f3f4f6", border:`1px solid ${sop.status === "active" ? "#6ee7b7" : "#e5e7eb"}`, borderRadius:20, color: sop.status === "active" ? "#059669" : "#9ca3af", fontSize:11, fontWeight:700, cursor:"pointer" }}>
                          {sop.status === "active" ? <ToggleRight size={13}/> : <ToggleLeft size={13}/>}
                          {sop.status === "active" ? "Active" : "Inactive"}
                        </button>
                      </td>

                      {/* Actions */}
                      <td style={{ padding:"12px 16px" }}>
                        <div style={{ display:"flex", gap:5 }}>
                          <button className="btn-act" onClick={() => { setEditSop(sop); setShowForm(true); }}
                            style={{ padding:"5px 10px", background:"#eff6ff", border:"1px solid #bfdbfe", borderRadius:7, color:"#2563eb", fontSize:11, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:3 }}>
                            <Pencil size={10}/> Edit
                          </button>
                          <button className="btn-act" onClick={() => setDeleteSop(sop)}
                            style={{ padding:"5px 8px", background:"#fef2f2", border:"1px solid #fecaca", borderRadius:7, color:"#dc2626", cursor:"pointer", display:"flex", alignItems:"center" }}>
                            <Trash2 size={11}/>
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
      </div>
    </div>
  );
}