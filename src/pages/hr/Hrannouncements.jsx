// HRAnnouncements.jsx — Full HR panel with image upload
import { useEffect, useState, useRef } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const TYPES = [
  { value: "general",     label: "General",     emoji: "📢", color: "#6b7280", bg: "#f3f4f6" },
  { value: "urgent",      label: "Urgent",      emoji: "🚨", color: "#dc2626", bg: "#fef2f2" },
  { value: "event",       label: "Event",       emoji: "🎉", color: "#7c3aed", bg: "#f5f3ff" },
  { value: "policy",      label: "Policy",      emoji: "📋", color: "#0369a1", bg: "#f0f9ff" },
  { value: "achievement", label: "Achievement", emoji: "🏆", color: "#d97706", bg: "#fffbeb" },
  { value: "holiday",     label: "Holiday",     emoji: "🌴", color: "#16a34a", bg: "#f0fdf4" },
];
const PRIORITIES = [
  { value: "low",    label: "Low",    color: "#6b7280" },
  { value: "medium", label: "Medium", color: "#d97706" },
  { value: "high",   label: "High",   color: "#dc2626" },
];
const TARGET_OPTIONS = [
  { value: "all",        label: "Everyone",   emoji: "🌐" },
  { value: "department", label: "Department", emoji: "🏢" },
  { value: "role",       label: "By Role",    emoji: "👤" },
  { value: "individual", label: "Individual", emoji: "🎯" },
];

const defaultForm = {
  title: "", content: "", type: "general", priority: "medium",
  target: "all", target_departments: [], target_roles: [],
  target_employees: [], is_pinned: false, expires_at: "", emoji: "",
  images: []  // ✅ [{ url: base64, caption: "", filename: "" }]
};

// ─── compress image to base64 ─────────────────────────────────────────────────
function compressImage(file, maxW = 1200, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let w = img.width, h = img.height;
        if (w > maxW) { h = Math.round((h * maxW) / w); w = maxW; }
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

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
  const [uploadingImg, setUploadingImg]   = useState(false);
  const [lightbox, setLightbox]           = useState(null); // { url, caption }
  const [isMobile, setIsMobile]           = useState(window.innerWidth < 768);
  const fileInputRef                      = useRef(null);

  const hrId = localStorage.getItem("employeeId") || localStorage.getItem("hrId");

  useEffect(() => {
    const r = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", r);
    return () => window.removeEventListener("resize", r);
  }, []);

  useEffect(() => { fetchAll(); fetchStats(); fetchDepts(); }, []);

  const fetchAll = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/announcements/all`);
      if (res.data.success) setAnnouncements(res.data.data);
    } catch { showToast("Failed to load", "error"); }
    finally { setLoading(false); }
  };
  const fetchStats = async () => {
    try { const r = await axios.get(`${API_BASE}/api/announcements/stats`); if (r.data.success) setStats(r.data.data); } catch {}
  };
  const fetchDepts = async () => {
    try { const r = await axios.get(`${API_BASE}/api/departments`); setDepartments((r.data.data || r.data || []).filter(d => d.status === "active")); } catch {}
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Image upload handler ──────────────────────────────────────────────────
  const handleImageFiles = async (files) => {
    if (!files?.length) return;
    const remaining = 5 - form.images.length;
    if (remaining <= 0) return showToast("Max 5 images allowed", "error");
    setUploadingImg(true);
    try {
      const toProcess = Array.from(files).slice(0, remaining);
      const results = await Promise.all(
        toProcess.map(async (file) => {
          if (!file.type.startsWith("image/")) return null;
          const url = await compressImage(file);
          return { url, caption: "", filename: file.name };
        })
      );
      const valid = results.filter(Boolean);
      setForm(f => ({ ...f, images: [...f.images, ...valid] }));
    } catch { showToast("Image upload failed", "error"); }
    finally { setUploadingImg(false); }
  };

  const removeImage = (idx) => {
    setForm(f => ({ ...f, images: f.images.filter((_, i) => i !== idx) }));
  };
  const updateCaption = (idx, caption) => {
    setForm(f => {
      const imgs = [...f.images];
      imgs[idx] = { ...imgs[idx], caption };
      return { ...f, images: imgs };
    });
  };

  // ── Drag & drop ───────────────────────────────────────────────────────────
  const [dragOver, setDragOver] = useState(false);
  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    handleImageFiles(e.dataTransfer.files);
  };

  const openCreate = () => { setForm(defaultForm); setEditingId(null); setShowModal(true); };
  const openEdit = (a) => {
    setForm({
      title: a.title, content: a.content, type: a.type,
      priority: a.priority, target: a.target,
      target_departments: a.target_departments || [],
      target_roles: a.target_roles || [],
      target_employees: a.target_employees || [],
      is_pinned: a.is_pinned,
      expires_at: a.expires_at ? a.expires_at.substring(0, 10) : "",
      emoji: a.emoji || "",
      images: a.images || []
    });
    setEditingId(a._id); setShowModal(true);
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
        showToast(editingId ? "Updated!" : "📢 Posted!");
        setShowModal(false); fetchAll(); fetchStats();
      }
    } catch (e) { showToast(e.response?.data?.message || "Error", "error"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try { await axios.delete(`${API_BASE}/api/announcements/${id}`); showToast("Deleted"); fetchAll(); fetchStats(); }
    catch { showToast("Delete failed", "error"); }
    setDeleteConfirm(null);
  };
  const handlePin = async (id) => { try { await axios.put(`${API_BASE}/api/announcements/${id}/pin`); fetchAll(); } catch {} };
  const handleToggleActive = async (a) => {
    try { await axios.put(`${API_BASE}/api/announcements/${a._id}`, { is_active: !a.is_active }); fetchAll(); showToast(a.is_active ? "Deactivated" : "Activated"); } catch {}
  };

  const filtered = filterType === "all" ? announcements : announcements.filter(a => a.type === filterType);
  const getType  = (v) => TYPES.find(t => t.value === v) || TYPES[0];
  const fmtDate  = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";

  const inp = { width: "100%", padding: "10px 12px", border: "1.5px solid #e5e7eb", borderRadius: 9, fontSize: 13, color: "#1a1a2e", background: "#fff", boxSizing: "border-box", outline: "none", fontFamily: "inherit" };

  return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif", background: "#f0f2f8", minHeight: "100vh" }}>
      <style>{`
        @keyframes slideIn { from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn  { from{opacity:0}to{opacity:1} }
        @keyframes pulse   { 0%,100%{transform:scale(1)}50%{transform:scale(1.04)} }
        @keyframes spin    { to{transform:rotate(360deg)} }
        .ann-card:hover { transform:translateY(-2px); box-shadow:0 8px 24px rgba(0,0,0,0.10) !important; }
        .ann-card { transition:all 0.2s; }
        .img-thumb { cursor:pointer; transition:transform 0.2s,box-shadow 0.2s; border-radius:10px; overflow:hidden; }
        .img-thumb:hover { transform:scale(1.03); box-shadow:0 6px 18px rgba(0,0,0,0.18); }
        .drop-zone { transition:all 0.2s; }
        .drop-zone.drag { border-color:#2563eb!important; background:#eff6ff!important; }
        .toggle-switch{position:relative;width:44px;height:24px;cursor:pointer}
        .toggle-switch input{opacity:0;width:0;height:0;position:absolute}
        .toggle-slider{position:absolute;inset:0;background:#d1d5db;border-radius:99px;transition:.3s}
        .toggle-slider:before{content:"";position:absolute;width:18px;height:18px;left:3px;bottom:3px;background:#fff;border-radius:50%;transition:.3s;box-shadow:0 1px 4px rgba(0,0,0,.2)}
        input:checked+.toggle-slider{background:#2563eb}
        input:checked+.toggle-slider:before{transform:translateX(20px)}
        .read-bar{height:6px;background:#e5e7eb;border-radius:99px;overflow:hidden}
        .read-bar-fill{height:100%;border-radius:99px;transition:width .6s ease}
        .lightbox-bg{position:fixed;inset:0;background:rgba(0,0,0,.92);z-index:2000;display:flex;align-items:center;justify-content:center;animation:fadeIn .2s ease;cursor:pointer}
        .lightbox-img{max-width:92vw;max-height:88vh;border-radius:12px;box-shadow:0 24px 64px rgba(0,0,0,.6);cursor:default}
        .filter-chip{cursor:pointer;transition:all .15s;white-space:nowrap}
        .filter-chip:hover{transform:translateY(-1px)}
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position:"fixed",top:16,right:16,zIndex:9999,background:toast.type==="error"?"#dc2626":"#16a34a",color:"#fff",padding:"12px 20px",borderRadius:10,boxShadow:"0 8px 24px rgba(0,0,0,.2)",fontWeight:600,fontSize:14,animation:"slideIn .3s ease",display:"flex",alignItems:"center",gap:8 }}>
          {toast.type==="error"?"❌":"✅"} {toast.msg}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div className="lightbox-bg" onClick={() => setLightbox(null)}>
          <div onClick={e => e.stopPropagation()} style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:12 }}>
            <img src={lightbox.url} alt={lightbox.caption} className="lightbox-img"/>
            {lightbox.caption && <p style={{ color:"#e2e8f0",fontSize:14,fontWeight:500 }}>{lightbox.caption}</p>}
            <button onClick={() => setLightbox(null)} style={{ background:"rgba(255,255,255,.15)",border:"none",color:"#fff",borderRadius:8,padding:"8px 20px",cursor:"pointer",fontWeight:600 }}>✕ Close</button>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ background:"#fff",borderBottom:"1px solid #e5e7eb",padding:isMobile?"14px 16px":"18px 32px",position:"sticky",top:0,zIndex:50,boxShadow:"0 2px 8px rgba(0,0,0,.06)" }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",gap:12 }}>
          <div>
            <h1 style={{ margin:0,fontSize:isMobile?17:22,fontWeight:800,color:"#1a1a2e" }}>📢 Announcements</h1>
            <p style={{ margin:"3px 0 0",color:"#6b7280",fontSize:13 }}>Broadcast updates with images to your team</p>
          </div>
          <button onClick={openCreate} style={{ background:"linear-gradient(135deg,#2563eb,#1d4ed8)",color:"#fff",border:"none",borderRadius:10,padding:isMobile?"10px 14px":"11px 22px",fontWeight:700,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",gap:8,boxShadow:"0 4px 14px rgba(37,99,235,.4)",whiteSpace:"nowrap" }}>
            ✦ New Post
          </button>
        </div>
      </div>

      <div style={{ padding:isMobile?"12px":"24px 32px" }}>

        {/* Stats */}
        {stats && (
          <div style={{ display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(4,1fr)",gap:12,marginBottom:22 }}>
            {[
              { label:"Total",  value:stats.total,  emoji:"📊", color:"#2563eb", bg:"#eff6ff" },
              { label:"Active", value:stats.active, emoji:"✅", color:"#16a34a", bg:"#f0fdf4" },
              { label:"Pinned", value:stats.pinned, emoji:"📌", color:"#7c3aed", bg:"#f5f3ff" },
              { label:"Urgent", value:stats.urgent, emoji:"🚨", color:"#dc2626", bg:"#fef2f2" },
            ].map((s,i) => (
              <div key={i} style={{ background:s.bg,borderRadius:12,padding:"14px 16px",border:`1px solid ${s.color}22` }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                  <div>
                    <p style={{ margin:0,fontSize:10,color:s.color,fontWeight:700,textTransform:"uppercase",letterSpacing:".5px" }}>{s.label}</p>
                    <p style={{ margin:"4px 0 0",fontSize:26,fontWeight:900,color:s.color,lineHeight:1 }}>{s.value}</p>
                  </div>
                  <span style={{ fontSize:26 }}>{s.emoji}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div style={{ display:"flex",gap:8,marginBottom:18,flexWrap:"wrap" }}>
          <div className="filter-chip" onClick={() => setFilterType("all")} style={{ padding:"7px 14px",borderRadius:99,fontSize:12,fontWeight:700,background:filterType==="all"?"#2563eb":"#fff",color:filterType==="all"?"#fff":"#6b7280",border:`1.5px solid ${filterType==="all"?"#2563eb":"#e5e7eb"}` }}>
            All ({announcements.length})
          </div>
          {TYPES.map(t => {
            const count = announcements.filter(a => a.type === t.value).length;
            if (!count) return null;
            return (
              <div key={t.value} className="filter-chip" onClick={() => setFilterType(t.value)}
                style={{ padding:"7px 12px",borderRadius:99,fontSize:12,fontWeight:700,background:filterType===t.value?t.color:"#fff",color:filterType===t.value?"#fff":t.color,border:`1.5px solid ${t.color}`,display:"flex",alignItems:"center",gap:4 }}>
                {t.emoji} {t.label} ({count})
              </div>
            );
          })}
        </div>

        {/* List */}
        {loading ? (
          <div style={{ textAlign:"center",padding:60,color:"#6b7280" }}><div style={{ fontSize:40,animation:"pulse 1.5s infinite" }}>📢</div><p style={{ marginTop:12 }}>Loading...</p></div>
        ) : filtered.length === 0 ? (
          <div style={{ background:"#fff",borderRadius:16,padding:"60px 20px",textAlign:"center",border:"1px solid #e5e7eb" }}>
            <div style={{ fontSize:48,marginBottom:12 }}>📭</div>
            <h3 style={{ color:"#1f2937",marginBottom:8 }}>No announcements yet</h3>
            <button onClick={openCreate} style={{ background:"#2563eb",color:"#fff",border:"none",borderRadius:8,padding:"10px 24px",fontWeight:700,cursor:"pointer",marginTop:8 }}>Create First Post</button>
          </div>
        ) : (
          <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
            {filtered.map(a => {
              const typeInfo = getType(a.type);
              const isExpired = a.is_expired;
              return (
                <div key={a._id} className="ann-card" style={{ background:"#fff",borderRadius:14,border:`1px solid ${a.is_pinned?"#2563eb33":"#e5e7eb"}`,boxShadow:a.is_pinned?"0 4px 16px rgba(37,99,235,.1)":"0 2px 8px rgba(0,0,0,.05)",overflow:"hidden",opacity:a.is_active?1:0.6 }}>
                  {a.is_pinned && <div style={{ background:"linear-gradient(90deg,#2563eb,#3b82f6)",height:3 }}/>}

                  <div style={{ padding:isMobile?"14px":"18px 22px" }}>
                    {/* Top */}
                    <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,marginBottom:10 }}>
                      <div style={{ flex:1,minWidth:0 }}>
                        <div style={{ display:"flex",flexWrap:"wrap",gap:5,marginBottom:7,alignItems:"center" }}>
                          <span style={{ background:typeInfo.bg,color:typeInfo.color,padding:"3px 10px",borderRadius:99,fontSize:11,fontWeight:700 }}>{typeInfo.emoji} {typeInfo.label}</span>
                          {a.priority==="high" && <span style={{ background:"#fef2f2",color:"#dc2626",padding:"3px 9px",borderRadius:99,fontSize:11,fontWeight:700 }}>🔥 High</span>}
                          {a.is_pinned && <span style={{ background:"#eff6ff",color:"#2563eb",padding:"3px 9px",borderRadius:99,fontSize:11,fontWeight:700 }}>📌 Pinned</span>}
                          {isExpired && <span style={{ background:"#fef2f2",color:"#dc2626",padding:"3px 9px",borderRadius:99,fontSize:11,fontWeight:700 }}>Expired</span>}
                          {a.images?.length > 0 && <span style={{ background:"#f0fdf4",color:"#16a34a",padding:"3px 9px",borderRadius:99,fontSize:11,fontWeight:700 }}>🖼 {a.images.length} image{a.images.length>1?"s":""}</span>}
                        </div>
                        <h3 style={{ margin:0,fontSize:isMobile?14:16,fontWeight:800,color:"#1a1a2e",lineHeight:1.3 }}>
                          {a.emoji && <span style={{ marginRight:5 }}>{a.emoji}</span>}
                          {a.title}
                        </h3>
                        <p style={{ margin:"5px 0 0",fontSize:13,color:"#6b7280",lineHeight:1.6,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden" }}>{a.content}</p>
                      </div>
                      <div style={{ display:"flex",gap:5,flexShrink:0 }}>
                        <button onClick={() => handlePin(a._id)} style={{ background:a.is_pinned?"#eff6ff":"#f3f4f6",border:"none",borderRadius:8,width:32,height:32,cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center" }} title={a.is_pinned?"Unpin":"Pin"}>📌</button>
                        <button onClick={() => openEdit(a)} style={{ background:"#f0f9ff",border:"none",borderRadius:8,width:32,height:32,cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center" }}>✏️</button>
                        <button onClick={() => setDeleteConfirm(a._id)} style={{ background:"#fef2f2",border:"none",borderRadius:8,width:32,height:32,cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center" }}>🗑️</button>
                      </div>
                    </div>

                    {/* Image preview thumbnails */}
                    {a.images?.length > 0 && (
                      <div style={{ display:"flex",gap:8,marginBottom:12,flexWrap:"wrap" }}>
                        {a.images.map((img, ii) => (
                          <div key={ii} className="img-thumb" onClick={() => setLightbox(img)}
                            style={{ width:isMobile?72:90,height:isMobile?72:90,flexShrink:0,position:"relative",borderRadius:10,overflow:"hidden",border:"1px solid #e5e7eb" }}>
                            <img src={img.url} alt={img.caption||"img"} style={{ width:"100%",height:"100%",objectFit:"cover" }}/>
                            {ii === 3 && a.images.length > 4 && (
                              <div style={{ position:"absolute",inset:0,background:"rgba(0,0,0,.55)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:16 }}>
                                +{a.images.length - 4}
                              </div>
                            )}
                          </div>
                        )).slice(0,4)}
                      </div>
                    )}

                    {/* Bottom meta */}
                    <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10,paddingTop:10,borderTop:"1px solid #f3f4f6" }}>
                      <div style={{ display:"flex",gap:12,flexWrap:"wrap",alignItems:"center" }}>
                        <span style={{ fontSize:12,color:"#9ca3af" }}>👤 {a.created_by?.name||"HR"}</span>
                        <span style={{ fontSize:12,color:"#9ca3af" }}>🕐 {fmtDate(a.createdAt)}</span>
                        <span style={{ fontSize:12,color:"#9ca3af" }}>❤️ {a.like_count||0}</span>
                      </div>
                      <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                        <div style={{ width:100 }}>
                          <div style={{ display:"flex",justifyContent:"space-between",marginBottom:3 }}>
                            <span style={{ fontSize:11,color:"#6b7280" }}>Read</span>
                            <span style={{ fontSize:11,fontWeight:700,color:"#2563eb" }}>{a.read_percentage||0}%</span>
                          </div>
                          <div className="read-bar"><div className="read-bar-fill" style={{ width:`${a.read_percentage||0}%`,background:"#2563eb" }}/></div>
                          <p style={{ margin:"2px 0 0",fontSize:10,color:"#9ca3af" }}>{a.read_count} reads</p>
                        </div>
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

      {/* ═══ CREATE/EDIT MODAL ═══ */}
      {showModal && (
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.55)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:12,animation:"fadeIn .2s ease" }}>
          <div style={{ background:"#fff",borderRadius:16,width:"100%",maxWidth:660,maxHeight:"94vh",overflowY:"auto",boxShadow:"0 24px 64px rgba(0,0,0,.2)",animation:"slideIn .25s ease" }}>

            {/* Modal header */}
            <div style={{ background:"linear-gradient(135deg,#1a1a2e,#2563eb)",padding:"18px 22px",borderRadius:"16px 16px 0 0",display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,zIndex:10 }}>
              <div>
                <h3 style={{ margin:0,color:"#fff",fontSize:17,fontWeight:800 }}>{editingId?"✏️ Edit":"✦ New"} Announcement</h3>
                <p style={{ margin:"2px 0 0",color:"#93c5fd",fontSize:12 }}>Post updates with images</p>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background:"rgba(255,255,255,.15)",border:"none",color:"#fff",borderRadius:8,width:32,height:32,cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center" }}>✕</button>
            </div>

            <div style={{ padding:22 }}>

              {/* Emoji + Title */}
              <div style={{ marginBottom:14 }}>
                <label style={{ display:"block",fontSize:12,fontWeight:700,color:"#374151",marginBottom:5 }}>Title *</label>
                <div style={{ display:"flex",gap:8 }}>
                  <input value={form.emoji} onChange={e => setForm(f=>({...f,emoji:e.target.value}))} placeholder="😊" style={{ ...inp,width:50,textAlign:"center",fontSize:20,padding:"8px 4px" }}/>
                  <input value={form.title} onChange={e => setForm(f=>({...f,title:e.target.value}))} placeholder="Announcement title..." style={{ ...inp,flex:1 }}/>
                </div>
              </div>

              {/* Content */}
              <div style={{ marginBottom:14 }}>
                <label style={{ display:"block",fontSize:12,fontWeight:700,color:"#374151",marginBottom:5 }}>Content *</label>
                <textarea value={form.content} onChange={e => setForm(f=>({...f,content:e.target.value}))}
                  placeholder="Write your announcement..." rows={4} style={{ ...inp,resize:"vertical",lineHeight:1.6 }}/>
              </div>

              {/* ✅ IMAGE UPLOAD SECTION */}
              <div style={{ marginBottom:16 }}>
                <label style={{ display:"block",fontSize:12,fontWeight:700,color:"#374151",marginBottom:5 }}>
                  Images (optional — max 5)
                </label>

                {/* Drop zone */}
                <div
                  className={`drop-zone ${dragOver?"drag":""}`}
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  style={{ border:`2px dashed ${dragOver?"#2563eb":"#d1d5db"}`,borderRadius:12,padding:"22px 16px",textAlign:"center",cursor:"pointer",background:dragOver?"#eff6ff":"#f8fafc",marginBottom:12 }}>
                  <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display:"none" }}
                    onChange={e => handleImageFiles(e.target.files)}/>
                  {uploadingImg ? (
                    <div style={{ display:"flex",alignItems:"center",justifyContent:"center",gap:10,color:"#2563eb" }}>
                      <div style={{ width:20,height:20,border:"3px solid #bfdbfe",borderTopColor:"#2563eb",borderRadius:"50%",animation:"spin .8s linear infinite" }}/>
                      Processing images...
                    </div>
                  ) : (
                    <>
                      <div style={{ fontSize:32,marginBottom:8 }}>🖼️</div>
                      <p style={{ margin:0,fontSize:13,fontWeight:600,color:"#374151" }}>Click or drag images here</p>
                      <p style={{ margin:"4px 0 0",fontSize:11,color:"#9ca3af" }}>JPG, PNG, GIF · Max 5 images · Auto-compressed</p>
                    </>
                  )}
                </div>

                {/* Image previews with caption inputs */}
                {form.images.length > 0 && (
                  <div style={{ display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(3,1fr)",gap:10 }}>
                    {form.images.map((img, ii) => (
                      <div key={ii} style={{ position:"relative",borderRadius:10,overflow:"hidden",border:"1px solid #e5e7eb",background:"#f8fafc" }}>
                        <div style={{ position:"relative",paddingBottom:"60%",background:"#000" }}>
                          <img src={img.url} alt="" style={{ position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover" }}/>
                          <button onClick={() => removeImage(ii)}
                            style={{ position:"absolute",top:5,right:5,background:"rgba(0,0,0,.65)",border:"none",color:"#fff",borderRadius:"50%",width:22,height:22,cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700 }}>
                            ✕
                          </button>
                          <div style={{ position:"absolute",bottom:4,left:5,background:"rgba(0,0,0,.55)",color:"#fff",fontSize:9,fontWeight:700,padding:"2px 6px",borderRadius:4 }}>
                            {ii+1}/{form.images.length}
                          </div>
                        </div>
                        <input value={img.caption} onChange={e => updateCaption(ii, e.target.value)}
                          placeholder="Caption (optional)" style={{ width:"100%",padding:"6px 8px",border:"none",borderTop:"1px solid #e5e7eb",fontSize:11,outline:"none",boxSizing:"border-box",background:"#fff" }}/>
                      </div>
                    ))}
                    {/* Add more slot */}
                    {form.images.length < 5 && (
                      <div onClick={() => fileInputRef.current?.click()}
                        style={{ borderRadius:10,border:"2px dashed #d1d5db",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",cursor:"pointer",minHeight:100,gap:6,background:"#f9fafb" }}>
                        <span style={{ fontSize:24 }}>➕</span>
                        <span style={{ fontSize:11,color:"#9ca3af",fontWeight:600 }}>Add more</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Type + Priority */}
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14 }}>
                <div>
                  <label style={{ display:"block",fontSize:12,fontWeight:700,color:"#374151",marginBottom:5 }}>Type</label>
                  <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:5 }}>
                    {TYPES.map(t => (
                      <div key={t.value} onClick={() => setForm(f=>({...f,type:t.value}))}
                        style={{ padding:"7px 10px",borderRadius:8,border:`2px solid ${form.type===t.value?t.color:"#e5e7eb"}`,background:form.type===t.value?t.bg:"#fff",cursor:"pointer",display:"flex",alignItems:"center",gap:5,transition:"all .15s" }}>
                        <span style={{ fontSize:13 }}>{t.emoji}</span>
                        <span style={{ fontSize:11,fontWeight:700,color:form.type===t.value?t.color:"#374151" }}>{t.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{ display:"block",fontSize:12,fontWeight:700,color:"#374151",marginBottom:5 }}>Priority</label>
                  <div style={{ display:"flex",flexDirection:"column",gap:5 }}>
                    {PRIORITIES.map(p => (
                      <div key={p.value} onClick={() => setForm(f=>({...f,priority:p.value}))}
                        style={{ padding:"8px 12px",borderRadius:8,border:`2px solid ${form.priority===p.value?p.color:"#e5e7eb"}`,background:form.priority===p.value?`${p.color}10`:"#fff",cursor:"pointer",display:"flex",alignItems:"center",gap:7,transition:"all .15s" }}>
                        <div style={{ width:9,height:9,borderRadius:"50%",background:p.color }}/>
                        <span style={{ fontSize:12,fontWeight:700,color:form.priority===p.value?p.color:"#374151" }}>{p.label}</span>
                      </div>
                    ))}
                  </div>
                  <div onClick={() => setForm(f=>({...f,is_pinned:!f.is_pinned}))}
                    style={{ marginTop:6,padding:"8px 12px",borderRadius:8,border:`2px solid ${form.is_pinned?"#2563eb":"#e5e7eb"}`,background:form.is_pinned?"#eff6ff":"#fff",cursor:"pointer",display:"flex",alignItems:"center",gap:7,transition:"all .15s" }}>
                    <span>📌</span>
                    <span style={{ fontSize:12,fontWeight:700,color:form.is_pinned?"#2563eb":"#374151" }}>{form.is_pinned?"Pinned":"Pin to top"}</span>
                  </div>
                </div>
              </div>

              {/* Target */}
              <div style={{ marginBottom:14 }}>
                <label style={{ display:"block",fontSize:12,fontWeight:700,color:"#374151",marginBottom:5 }}>Audience</label>
                <div style={{ display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:6 }}>
                  {TARGET_OPTIONS.map(t => (
                    <div key={t.value} onClick={() => setForm(f=>({...f,target:t.value}))}
                      style={{ padding:"9px 12px",borderRadius:8,border:`2px solid ${form.target===t.value?"#2563eb":"#e5e7eb"}`,background:form.target===t.value?"#eff6ff":"#fff",cursor:"pointer",display:"flex",alignItems:"center",gap:7,transition:"all .15s" }}>
                      <span style={{ fontSize:16 }}>{t.emoji}</span>
                      <span style={{ fontSize:12,fontWeight:700,color:form.target===t.value?"#2563eb":"#374151" }}>{t.label}</span>
                    </div>
                  ))}
                </div>
                {form.target==="department" && departments.length > 0 && (
                  <div style={{ marginTop:10,padding:12,background:"#f8fafc",borderRadius:8,border:"1px solid #e5e7eb" }}>
                    <p style={{ margin:"0 0 8px",fontSize:12,fontWeight:700,color:"#374151" }}>Select Departments</p>
                    <div style={{ display:"flex",flexWrap:"wrap",gap:6 }}>
                      {departments.map(d => {
                        const sel = form.target_departments.includes(d.name);
                        return (
                          <span key={d._id} onClick={() => setForm(f=>({ ...f, target_departments: sel ? f.target_departments.filter(x=>x!==d.name) : [...f.target_departments,d.name] }))}
                            style={{ padding:"5px 12px",borderRadius:99,fontSize:12,fontWeight:600,cursor:"pointer",background:sel?"#2563eb":"#fff",color:sel?"#fff":"#374151",border:`1.5px solid ${sel?"#2563eb":"#d1d5db"}` }}>
                            {sel?"✓ ":""}{d.name}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Expiry */}
              <div style={{ marginBottom:20 }}>
                <label style={{ display:"block",fontSize:12,fontWeight:700,color:"#374151",marginBottom:5 }}>Expiry Date (optional)</label>
                <input type="date" value={form.expires_at} onChange={e=>setForm(f=>({...f,expires_at:e.target.value}))} style={{ ...inp,maxWidth:200 }}/>
              </div>

              {/* Footer */}
              <div style={{ display:"flex",gap:10,justifyContent:"flex-end" }}>
                <button onClick={() => setShowModal(false)} style={{ padding:"10px 22px",border:"1.5px solid #e5e7eb",borderRadius:9,background:"#fff",color:"#374151",fontWeight:600,cursor:"pointer",fontSize:13 }}>Cancel</button>
                <button onClick={handleSubmit} disabled={saving}
                  style={{ padding:"10px 26px",border:"none",borderRadius:9,background:saving?"#93c5fd":"linear-gradient(135deg,#2563eb,#1d4ed8)",color:"#fff",fontWeight:700,cursor:saving?"not-allowed":"pointer",fontSize:13,boxShadow:"0 4px 14px rgba(37,99,235,.35)",display:"flex",alignItems:"center",gap:8 }}>
                  {saving?<><div style={{ width:14,height:14,border:"2px solid #fff8",borderTopColor:"#fff",borderRadius:"50%",animation:"spin .8s linear infinite" }}/>Posting...</>:`${editingId?"✓ Update":"📢 Post"}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.5)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16 }}>
          <div style={{ background:"#fff",borderRadius:14,padding:28,maxWidth:320,width:"100%",textAlign:"center",boxShadow:"0 24px 64px rgba(0,0,0,.2)" }}>
            <div style={{ fontSize:44,marginBottom:12 }}>🗑️</div>
            <h3 style={{ margin:"0 0 8px",color:"#1a1a2e" }}>Delete Announcement?</h3>
            <p style={{ color:"#6b7280",fontSize:14,marginBottom:20 }}>All images and data will be removed.</p>
            <div style={{ display:"flex",gap:10 }}>
              <button onClick={() => setDeleteConfirm(null)} style={{ flex:1,padding:"10px 0",border:"1.5px solid #e5e7eb",borderRadius:9,background:"#fff",fontWeight:600,cursor:"pointer" }}>Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} style={{ flex:1,padding:"10px 0",border:"none",borderRadius:9,background:"#dc2626",color:"#fff",fontWeight:700,cursor:"pointer" }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}