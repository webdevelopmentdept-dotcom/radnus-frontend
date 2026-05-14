// HRAnnouncements.jsx — Full HR Announcement Management
import { useEffect, useState } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const TYPES = [
  { value: "general",     label: "General",     color: "#6b7280", bg: "#f3f4f6" },
  { value: "urgent",      label: "Urgent",      color: "#dc2626", bg: "#fef2f2" },
  { value: "event",       label: "Event",       color: "#7c3aed", bg: "#f5f3ff" },
  { value: "policy",      label: "Policy",      color: "#0369a1", bg: "#f0f9ff" },
  { value: "achievement", label: "Achievement", color: "#d97706", bg: "#fffbeb" },
  { value: "holiday",     label: "Holiday",     color: "#16a34a", bg: "#f0fdf4" },
];

const PRIORITIES = [
  { value: "low",    label: "Low",    color: "#6b7280" },
  { value: "medium", label: "Medium", color: "#d97706" },
  { value: "high",   label: "High",   color: "#dc2626" },
];

const TARGET_OPTIONS = [
  { value: "all",        label: "Everyone" },
  { value: "department", label: "Department" },
  { value: "role",       label: "By Role" },
  { value: "individual", label: "Individual" },
];

const defaultForm = {
  title: "", content: "", type: "general", priority: "medium",
  target: "all", target_departments: [], target_roles: [],
  target_employees: [], is_pinned: false, expires_at: "", emoji: "", attachments: []
};

export default function HRAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [showModal, setShowModal]         = useState(false);
  const [editingId, setEditingId]         = useState(null);
  const [form, setForm]                   = useState(defaultForm);
  const [saving, setSaving]               = useState(false);
  const [toast, setToast]                 = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [filterType, setFilterType]       = useState("all");
  const [stats, setStats]                 = useState(null);
  const [departments, setDepartments]     = useState([]);
  const [viewReaders, setViewReaders]     = useState(null);
  const [isMobile, setIsMobile]           = useState(window.innerWidth < 768);

  const hrId = localStorage.getItem("employeeId") || localStorage.getItem("hrId");

  useEffect(() => {
    const r = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", r);
    return () => window.removeEventListener("resize", r);
  }, []);

  useEffect(() => {
    fetchAll();
    fetchStats();
    fetchDepts();
  }, []);

  const fetchAll = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/announcements/all`);
      if (res.data.success) setAnnouncements(res.data.data);
    } catch (e) { showToast("Failed to load", "error"); }
    finally { setLoading(false); }
  };

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/announcements/stats`);
      if (res.data.success) setStats(res.data.data);
    } catch {}
  };

  const fetchDepts = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/departments`);
      const all = res.data.data || res.data || [];
      setDepartments(all.filter(d => d.status === "active"));
    } catch {}
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const openCreate = () => {
    setForm(defaultForm);
    setEditingId(null);
    setShowModal(true);
  };

  const openEdit = (a) => {
    setForm({
      title:              a.title,
      content:            a.content,
      type:               a.type,
      priority:           a.priority,
      target:             a.target,
      target_departments: a.target_departments || [],
      target_roles:       a.target_roles       || [],
      target_employees:   a.target_employees   || [],
      is_pinned:          a.is_pinned,
      expires_at:         a.expires_at ? a.expires_at.substring(0, 10) : "",
      emoji:              a.emoji || "",
      attachments:        a.attachments || []
    });
    setEditingId(a._id);
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.content.trim())
      return showToast("Title and content required", "error");
    setSaving(true);
    try {
      const payload = { ...form, created_by: hrId };
      const res = editingId
        ? await axios.put(`${API_BASE}/api/announcements/${editingId}`, payload)
        : await axios.post(`${API_BASE}/api/announcements`, payload);
      if (res.data.success) {
        showToast(editingId ? "Updated!" : "Announcement posted!");
        setShowModal(false);
        fetchAll(); fetchStats();
      }
    } catch (e) {
      showToast(e.response?.data?.message || "Error", "error");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_BASE}/api/announcements/${id}`);
      showToast("Deleted");
      fetchAll(); fetchStats();
    } catch { showToast("Delete failed", "error"); }
    setDeleteConfirm(null);
  };

  const handlePin = async (id) => {
    try {
      await axios.put(`${API_BASE}/api/announcements/${id}/pin`);
      fetchAll();
    } catch {}
  };

  const handleToggleActive = async (a) => {
    try {
      await axios.put(`${API_BASE}/api/announcements/${a._id}`, { is_active: !a.is_active });
      fetchAll();
      showToast(a.is_active ? "Deactivated" : "Activated");
    } catch {}
  };

  const filtered = filterType === "all"
    ? announcements
    : announcements.filter(a => a.type === filterType);

  const getType = (v) => TYPES.find(t => t.value === v) || TYPES[0];
  const getPriority = (v) => PRIORITIES.find(p => p.value === v) || PRIORITIES[1];

  const fmtDate = (d) => d
    ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : "—";

  const inp = {
    width: "100%", padding: "10px 12px", border: "1.5px solid #e5e7eb",
    borderRadius: 9, fontSize: 13, color: "#1a1a2e", background: "#fff",
    boxSizing: "border-box", outline: "none", fontFamily: "inherit"
  };

  return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif", background: "#f0f2f8", minHeight: "100vh" }}>
      <style>{`
        @keyframes slideIn { from { opacity:0; transform:translateY(-10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn  { from { opacity:0; } to { opacity:1; } }
        @keyframes pulse   { 0%,100%{ transform:scale(1); } 50%{ transform:scale(1.05); } }
        .ann-card { transition: all 0.2s; }
        .ann-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.1) !important; }
        .ann-action-btn { transition: all 0.15s; opacity: 0.7; }
        .ann-action-btn:hover { opacity: 1; transform: scale(1.1); }
        .filter-chip { transition: all 0.15s; cursor: pointer; }
        .filter-chip:hover { transform: translateY(-1px); }
        .stat-card { transition: all 0.2s; }
        .stat-card:hover { transform: translateY(-3px); }
        .toggle-switch { position:relative; width:44px; height:24px; cursor:pointer; }
        .toggle-switch input { opacity:0; width:0; height:0; position:absolute; }
        .toggle-slider { position:absolute; inset:0; background:#d1d5db; border-radius:99px; transition:0.3s; }
        .toggle-slider:before { content:""; position:absolute; width:18px; height:18px; left:3px; bottom:3px; background:#fff; border-radius:50%; transition:0.3s; }
        input:checked + .toggle-slider { background:#2563eb; }
        input:checked + .toggle-slider:before { transform:translateX(20px); }
        .read-bar { height:6px; background:#e5e7eb; border-radius:99px; overflow:hidden; }
        .read-bar-fill { height:100%; border-radius:99px; transition:width 0.6s ease; }
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position:"fixed", top:16, right:16, zIndex:9999, background: toast.type==="error"?"#dc2626":"#16a34a", color:"#fff", padding:"12px 20px", borderRadius:10, boxShadow:"0 8px 24px rgba(0,0,0,0.2)", fontWeight:600, fontSize:14, animation:"slideIn 0.3s ease", display:"flex", alignItems:"center", gap:8 }}>
          {toast.type === "error" ? "Error" : "Success"} — {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ background:"#fff", borderBottom:"1px solid #e5e7eb", padding: isMobile ? "16px" : "20px 32px", position:"sticky", top:0, zIndex:50, boxShadow:"0 2px 8px rgba(0,0,0,0.06)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:12 }}>
          <div>
            <h1 style={{ margin:0, fontSize: isMobile ? 18 : 22, fontWeight:800, color:"#1a1a2e" }}>
              Announcements
            </h1>
            <p style={{ margin:"3px 0 0", color:"#6b7280", fontSize:13 }}>Create and manage company announcements</p>
          </div>
          <button onClick={openCreate}
            style={{ background:"linear-gradient(135deg,#2563eb,#1d4ed8)", color:"#fff", border:"none", borderRadius:10, padding: isMobile ? "10px 16px" : "11px 24px", fontWeight:700, fontSize:14, cursor:"pointer", display:"flex", alignItems:"center", gap:8, boxShadow:"0 4px 14px rgba(37,99,235,0.4)", whiteSpace:"nowrap" }}>
            + New Announcement
          </button>
        </div>
      </div>

      <div style={{ padding: isMobile ? "14px" : "28px 32px" }}>

        {/* Stats Row */}
        {stats && (
          <div style={{ display:"grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(4,1fr)", gap:14, marginBottom:24 }}>
            {[
              { label:"Total",  value:stats.total,  color:"#2563eb", bg:"#eff6ff" },
              { label:"Active", value:stats.active, color:"#16a34a", bg:"#f0fdf4" },
              { label:"Pinned", value:stats.pinned, color:"#7c3aed", bg:"#f5f3ff" },
              { label:"Urgent", value:stats.urgent, color:"#dc2626", bg:"#fef2f2" },
            ].map((s, i) => (
              <div key={i} className="stat-card" style={{ background:s.bg, borderRadius:12, padding:"16px 18px", border:`1px solid ${s.color}22`, cursor:"default" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div>
                    <p style={{ margin:0, fontSize:11, color:s.color, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.5px" }}>{s.label}</p>
                    <p style={{ margin:"4px 0 0", fontSize:28, fontWeight:900, color:s.color, lineHeight:1 }}>{s.value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Filter chips */}
        <div style={{ display:"flex", gap:8, marginBottom:20, flexWrap:"wrap" }}>
          <div onClick={() => setFilterType("all")} className="filter-chip"
            style={{ padding:"7px 16px", borderRadius:99, fontSize:12, fontWeight:700, background: filterType==="all"?"#2563eb":"#fff", color: filterType==="all"?"#fff":"#6b7280", border:`1.5px solid ${filterType==="all"?"#2563eb":"#e5e7eb"}` }}>
            All ({announcements.length})
          </div>
          {TYPES.map(t => {
            const count = announcements.filter(a => a.type === t.value).length;
            if (!count) return null;
            return (
              <div key={t.value} onClick={() => setFilterType(t.value)} className="filter-chip"
                style={{ padding:"7px 14px", borderRadius:99, fontSize:12, fontWeight:700, background: filterType===t.value ? t.color : "#fff", color: filterType===t.value?"#fff":t.color, border:`1.5px solid ${t.color}` }}>
                {t.label} ({count})
              </div>
            );
          })}
        </div>

        {/* Announcements list */}
        {loading ? (
          <div style={{ textAlign:"center", padding:60, color:"#6b7280" }}>
            <p>Loading announcements...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ background:"#fff", borderRadius:16, padding:"60px 20px", textAlign:"center", border:"1px solid #e5e7eb" }}>
            <h3 style={{ color:"#1f2937", marginBottom:8 }}>No announcements yet</h3>
            <p style={{ color:"#6b7280", marginBottom:20 }}>Create your first announcement to inform your team</p>
            <button onClick={openCreate} style={{ background:"#2563eb", color:"#fff", border:"none", borderRadius:8, padding:"10px 24px", fontWeight:700, cursor:"pointer" }}>
              Create Announcement
            </button>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            {filtered.map((a) => {
              const typeInfo = getType(a.type);
              const priInfo  = getPriority(a.priority);
              const isExpired = a.is_expired;
              return (
                <div key={a._id} className="ann-card"
                  style={{ background:"#fff", borderRadius:14, border:`1px solid ${a.is_pinned?"#2563eb33":"#e5e7eb"}`, boxShadow: a.is_pinned?"0 4px 16px rgba(37,99,235,0.1)":"0 2px 8px rgba(0,0,0,0.05)", overflow:"hidden", opacity: a.is_active?1:0.6 }}>

                  {/* Pinned bar */}
                  {a.is_pinned && (
                    <div style={{ background:"linear-gradient(90deg,#2563eb,#3b82f6)", height:3 }}/>
                  )}

                  <div style={{ padding: isMobile ? "14px" : "20px 24px" }}>
                    {/* Top row */}
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12, marginBottom:12 }}>
                      <div style={{ flex:1, minWidth:0 }}>
                        {/* Badges row */}
                        <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:8, alignItems:"center" }}>
                          <span style={{ background:typeInfo.bg, color:typeInfo.color, padding:"3px 10px", borderRadius:99, fontSize:11, fontWeight:700 }}>
                            {typeInfo.label}
                          </span>
                          <span style={{ background:`${priInfo.color}15`, color:priInfo.color, padding:"3px 10px", borderRadius:99, fontSize:11, fontWeight:700 }}>
                            {priInfo.label} Priority
                          </span>
                          {a.is_pinned && <span style={{ background:"#eff6ff", color:"#2563eb", padding:"3px 10px", borderRadius:99, fontSize:11, fontWeight:700 }}>Pinned</span>}
                          {!a.is_active && <span style={{ background:"#f3f4f6", color:"#9ca3af", padding:"3px 10px", borderRadius:99, fontSize:11, fontWeight:700 }}>Inactive</span>}
                          {isExpired && <span style={{ background:"#fef2f2", color:"#dc2626", padding:"3px 10px", borderRadius:99, fontSize:11, fontWeight:700 }}>Expired</span>}
                        </div>
                        <h3 style={{ margin:0, fontSize: isMobile?15:17, fontWeight:800, color:"#1a1a2e", lineHeight:1.3 }}>
                          {a.title}
                        </h3>
                        <p style={{ margin:"6px 0 0", fontSize:13, color:"#6b7280", lineHeight:1.6, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>
                          {a.content}
                        </p>
                      </div>

                      {/* Action buttons */}
                      <div style={{ display:"flex", gap:6, flexShrink:0 }}>
                        <button onClick={() => handlePin(a._id)} className="ann-action-btn"
                          style={{ background: a.is_pinned?"#eff6ff":"#f3f4f6", border:"none", borderRadius:8, width:34, height:34, cursor:"pointer", fontSize:13, fontWeight:700, color: a.is_pinned?"#2563eb":"#6b7280", display:"flex", alignItems:"center", justifyContent:"center" }}
                          title={a.is_pinned?"Unpin":"Pin"}>
                          Pin
                        </button>
                        <button onClick={() => openEdit(a)} className="ann-action-btn"
                          style={{ background:"#f0f9ff", border:"none", borderRadius:8, width:34, height:34, cursor:"pointer", fontSize:13, fontWeight:700, color:"#0369a1", display:"flex", alignItems:"center", justifyContent:"center" }}
                          title="Edit">
                          Edit
                        </button>
                        <button onClick={() => setDeleteConfirm(a._id)} className="ann-action-btn"
                          style={{ background:"#fef2f2", border:"none", borderRadius:8, width:34, height:34, cursor:"pointer", fontSize:13, fontWeight:700, color:"#dc2626", display:"flex", alignItems:"center", justifyContent:"center" }}
                          title="Delete">
                          Del
                        </button>
                      </div>
                    </div>

                    {/* Bottom row — meta + read stats */}
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:10, paddingTop:12, borderTop:"1px solid #f3f4f6" }}>
                      <div style={{ display:"flex", gap:14, flexWrap:"wrap" }}>
                        <span style={{ fontSize:12, color:"#9ca3af" }}>
                          By: {a.created_by?.name || "HR"}
                        </span>
                        <span style={{ fontSize:12, color:"#9ca3af" }}>
                          {fmtDate(a.createdAt)}
                        </span>
                        <span style={{ fontSize:12, color:"#9ca3af" }}>
                          {TARGET_OPTIONS.find(t => t.value === a.target)?.label || a.target}
                        </span>
                        {a.expires_at && (
                          <span style={{ fontSize:12, color: isExpired?"#dc2626":"#9ca3af" }}>
                            Expires {fmtDate(a.expires_at)}
                          </span>
                        )}
                      </div>

                      {/* Read progress */}
                      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                        <div style={{ width: isMobile?80:120 }}>
                          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                            <span style={{ fontSize:11, color:"#6b7280" }}>Read</span>
                            <span style={{ fontSize:11, fontWeight:700, color:"#2563eb" }}>{a.read_percentage || 0}%</span>
                          </div>
                          <div className="read-bar">
                            <div className="read-bar-fill" style={{ width:`${a.read_percentage||0}%`, background:"#2563eb" }}/>
                          </div>
                          <p style={{ margin:"3px 0 0", fontSize:10, color:"#9ca3af" }}>{a.read_count} reads</p>
                        </div>
                        {/* Active toggle */}
                        <label className="toggle-switch" title={a.is_active?"Deactivate":"Activate"}>
                          <input type="checkbox" checked={a.is_active} onChange={() => handleToggleActive(a)}/>
                          <span className="toggle-slider"/>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CREATE/EDIT MODAL */}
      {showModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:16, animation:"fadeIn 0.2s ease" }}>
          <div style={{ background:"#fff", borderRadius:16, width:"100%", maxWidth:620, maxHeight:"92vh", overflowY:"auto", boxShadow:"0 24px 64px rgba(0,0,0,0.2)", animation:"slideIn 0.25s ease" }}>

            {/* Modal Header */}
            <div style={{ background:"linear-gradient(135deg,#1a1a2e,#2563eb)", padding:"20px 24px", borderRadius:"16px 16px 0 0", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <h3 style={{ margin:0, color:"#fff", fontSize:18, fontWeight:800 }}>
                  {editingId ? "Edit Announcement" : "New Announcement"}
                </h3>
                <p style={{ margin:"3px 0 0", color:"#93c5fd", fontSize:12 }}>
                  {editingId ? "Update your announcement" : "Broadcast to your team"}
                </p>
              </div>
              <button onClick={() => setShowModal(false)}
                style={{ background:"rgba(255,255,255,0.15)", border:"none", color:"#fff", borderRadius:8, width:34, height:34, cursor:"pointer", fontSize:18, display:"flex", alignItems:"center", justifyContent:"center" }}>
                X
              </button>
            </div>

            <div style={{ padding:24 }}>
              {/* Title */}
              <div style={{ marginBottom:16 }}>
                <label style={{ display:"block", fontSize:12, fontWeight:700, color:"#374151", marginBottom:6 }}>Title *</label>
                <input value={form.title} onChange={e => setForm(f=>({...f,title:e.target.value}))}
                  placeholder="Announcement title..." style={{ ...inp }}/>
              </div>

              {/* Content */}
              <div style={{ marginBottom:16 }}>
                <label style={{ display:"block", fontSize:12, fontWeight:700, color:"#374151", marginBottom:6 }}>Content *</label>
                <textarea value={form.content} onChange={e => setForm(f=>({...f,content:e.target.value}))}
                  placeholder="Write your announcement here... Be clear and concise."
                  rows={5} style={{ ...inp, resize:"vertical", lineHeight:1.6 }}/>
              </div>

              {/* Type + Priority */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:16 }}>
                <div>
                  <label style={{ display:"block", fontSize:12, fontWeight:700, color:"#374151", marginBottom:6 }}>Type</label>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
                    {TYPES.map(t => (
                      <div key={t.value} onClick={() => setForm(f=>({...f,type:t.value}))}
                        style={{ padding:"8px 10px", borderRadius:8, border:`2px solid ${form.type===t.value?t.color:"#e5e7eb"}`, background: form.type===t.value?t.bg:"#fff", cursor:"pointer", display:"flex", alignItems:"center", gap:6, transition:"all 0.15s" }}>
                        <span style={{ fontSize:11, fontWeight:700, color: form.type===t.value?t.color:"#374151" }}>{t.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{ display:"block", fontSize:12, fontWeight:700, color:"#374151", marginBottom:6 }}>Priority</label>
                  <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                    {PRIORITIES.map(p => (
                      <div key={p.value} onClick={() => setForm(f=>({...f,priority:p.value}))}
                        style={{ padding:"10px 14px", borderRadius:8, border:`2px solid ${form.priority===p.value?p.color:"#e5e7eb"}`, background: form.priority===p.value?`${p.color}10`:"#fff", cursor:"pointer", display:"flex", alignItems:"center", gap:8, transition:"all 0.15s" }}>
                        <div style={{ width:10, height:10, borderRadius:"50%", background:p.color }}/>
                        <span style={{ fontSize:13, fontWeight:700, color: form.priority===p.value?p.color:"#374151" }}>{p.label}</span>
                      </div>
                    ))}
                  </div>

                  {/* Pinned toggle */}
                  <div onClick={() => setForm(f=>({...f,is_pinned:!f.is_pinned}))}
                    style={{ marginTop:10, padding:"10px 14px", borderRadius:8, border:`2px solid ${form.is_pinned?"#2563eb":"#e5e7eb"}`, background: form.is_pinned?"#eff6ff":"#fff", cursor:"pointer", display:"flex", alignItems:"center", gap:8, transition:"all 0.15s" }}>
                    <span style={{ fontSize:13, fontWeight:700, color: form.is_pinned?"#2563eb":"#374151" }}>
                      {form.is_pinned ? "Pinned to top" : "Pin to top"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Target Audience */}
              <div style={{ marginBottom:16 }}>
                <label style={{ display:"block", fontSize:12, fontWeight:700, color:"#374151", marginBottom:6 }}>Target Audience</label>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:6 }}>
                  {TARGET_OPTIONS.map(t => (
                    <div key={t.value} onClick={() => setForm(f=>({...f,target:t.value}))}
                      style={{ padding:"10px 14px", borderRadius:8, border:`2px solid ${form.target===t.value?"#2563eb":"#e5e7eb"}`, background: form.target===t.value?"#eff6ff":"#fff", cursor:"pointer", display:"flex", alignItems:"center", gap:8, transition:"all 0.15s" }}>
                      <span style={{ fontSize:13, fontWeight:700, color: form.target===t.value?"#2563eb":"#374151" }}>{t.label}</span>
                    </div>
                  ))}
                </div>

                {/* Department selector */}
                {form.target === "department" && (
                  <div style={{ marginTop:10, padding:12, background:"#f8fafc", borderRadius:8, border:"1px solid #e5e7eb" }}>
                    <p style={{ margin:"0 0 8px", fontSize:12, fontWeight:700, color:"#374151" }}>Select Departments</p>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                      {departments.map(d => {
                        const selected = form.target_departments.includes(d.name);
                        return (
                          <span key={d._id} onClick={() => setForm(f => ({
                            ...f,
                            target_departments: selected
                              ? f.target_departments.filter(x => x !== d.name)
                              : [...f.target_departments, d.name]
                          }))}
                            style={{ padding:"5px 12px", borderRadius:99, fontSize:12, fontWeight:600, cursor:"pointer", background: selected?"#2563eb":"#fff", color: selected?"#fff":"#374151", border:`1.5px solid ${selected?"#2563eb":"#d1d5db"}`, transition:"all 0.15s" }}>
                            {selected ? "✓ " : ""}{d.name}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Expiry date */}
              <div style={{ marginBottom:20 }}>
                <label style={{ display:"block", fontSize:12, fontWeight:700, color:"#374151", marginBottom:6 }}>Expiry Date (Optional)</label>
                <input type="date" value={form.expires_at} onChange={e => setForm(f=>({...f,expires_at:e.target.value}))}
                  style={{ ...inp, maxWidth:200 }}/>
                <p style={{ margin:"4px 0 0", fontSize:11, color:"#9ca3af" }}>Leave empty for no expiry</p>
              </div>

              {/* Footer buttons */}
              <div style={{ display:"flex", gap:12, justifyContent:"flex-end" }}>
                <button onClick={() => setShowModal(false)}
                  style={{ padding:"10px 24px", border:"1.5px solid #e5e7eb", borderRadius:9, background:"#fff", color:"#374151", fontWeight:600, cursor:"pointer", fontSize:14 }}>
                  Cancel
                </button>
                <button onClick={handleSubmit} disabled={saving}
                  style={{ padding:"10px 28px", border:"none", borderRadius:9, background: saving?"#93c5fd":"linear-gradient(135deg,#2563eb,#1d4ed8)", color:"#fff", fontWeight:700, cursor: saving?"not-allowed":"pointer", fontSize:14, boxShadow:"0 4px 14px rgba(37,99,235,0.35)" }}>
                  {saving ? "Posting..." : editingId ? "Update" : "Post Announcement"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
          <div style={{ background:"#fff", borderRadius:14, padding:28, maxWidth:340, width:"100%", textAlign:"center", boxShadow:"0 24px 64px rgba(0,0,0,0.2)", animation:"slideIn 0.2s ease" }}>
            <h3 style={{ margin:"0 0 8px", color:"#1a1a2e", fontSize:18 }}>Delete Announcement?</h3>
            <p style={{ color:"#6b7280", fontSize:14, marginBottom:20 }}>This cannot be undone.</p>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={() => setDeleteConfirm(null)}
                style={{ flex:1, padding:"10px 0", border:"1.5px solid #e5e7eb", borderRadius:9, background:"#fff", fontWeight:600, cursor:"pointer", fontSize:14 }}>
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteConfirm)}
                style={{ flex:1, padding:"10px 0", border:"none", borderRadius:9, background:"#dc2626", color:"#fff", fontWeight:700, cursor:"pointer", fontSize:14 }}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}