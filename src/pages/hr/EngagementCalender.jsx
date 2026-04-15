import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { Plus, Edit2, Trash2, RefreshCw, Download, Calendar, X, Save } from "lucide-react";
import * as XLSX from "xlsx";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const CATEGORIES = [
  "Fun & Celebration",
  "Learning & Knowledge Sharing",
  "Health & Wellness",
  "CSR & Social Responsibility",
  "Team Outings & Offsites",
  "Annual Mega Events"
];

const FREQUENCIES = ["Monthly","Bi-Monthly","Quarterly","Bi-Annual","Yearly"];

const CATEGORY_COLORS = {
  "Fun & Celebration":            { color:"#f59e0b", bg:"#fffbeb", border:"#fde68a" },
  "Learning & Knowledge Sharing": { color:"#3b82f6", bg:"#eff6ff", border:"#bfdbfe" },
  "Health & Wellness":            { color:"#10b981", bg:"#ecfdf5", border:"#6ee7b7" },
  "CSR & Social Responsibility":  { color:"#8b5cf6", bg:"#f5f3ff", border:"#c4b5fd" },
  "Team Outings & Offsites":      { color:"#ef4444", bg:"#fef2f2", border:"#fecaca" },
  "Annual Mega Events":           { color:"#1a1a2e", bg:"#f3f4f6", border:"#d1d5db" },
};

const STATUS_CFG = {
  upcoming:  { label:"Upcoming",  color:"#3b82f6", bg:"#eff6ff" },
  ongoing:   { label:"Ongoing",   color:"#f59e0b", bg:"#fffbeb" },
  completed: { label:"Completed", color:"#10b981", bg:"#ecfdf5" },
};

const MONTH_EMOJIS = {
  January:"🎯", February:"🤝", March:"📚", April:"🧘",
  May:"💡", June:"🙏", July:"🏆", August:"🇮🇳",
  September:"👑", October:"🎉", November:"🎮", December:"⭐"
};

const inp = { width:"100%", padding:"9px 12px", border:"1px solid #d1d5db", borderRadius:8, fontSize:13, color:"#1a1a2e", background:"#fff", boxSizing:"border-box", outline:"none" };
const lbl = { display:"block", fontSize:11, fontWeight:700, color:"#374151", marginBottom:5, textTransform:"uppercase", letterSpacing:"0.04em" };

const blankForm = {
  month:"January", month_number:1, theme:"", event_highlights:[""],
  owner_department:"HR", category:"Fun & Celebration",
  frequency:"Monthly", status:"upcoming", budget:0, notes:""
};

const STYLES = `
  .ec-page { padding: 28px 32px; }
  .ec-stats { grid-template-columns: repeat(4,1fr); }
  .ec-grid  { grid-template-columns: repeat(3,1fr); }
  .ec-form-grid { grid-template-columns: 1fr 1fr; }
  @media (max-width: 1024px) {
    .ec-grid { grid-template-columns: repeat(2,1fr) !important; }
    .ec-stats { grid-template-columns: repeat(2,1fr) !important; }
  }
  @media (max-width: 768px) {
    .ec-page { padding: 16px; }
    .ec-grid  { grid-template-columns: 1fr !important; }
    .ec-stats { grid-template-columns: repeat(2,1fr) !important; }
    .ec-form-grid { grid-template-columns: 1fr !important; }
  }
`;

export default function EngagementCalendar() {
  const [events, setEvents]       = useState([]);
  const [summary, setSummary]     = useState(null);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [toast, setToast]         = useState(null);
  const [showForm, setShowForm]   = useState(false);
  const [editId, setEditId]       = useState(null);
  const [deleteId, setDeleteId]   = useState(null);
  const [form, setForm]           = useState(blankForm);
  const [view, setView]           = useState("grid"); // grid | list
  const [filterCat, setFilterCat] = useState("All");
  const [filterSt,  setFilterSt]  = useState("All");

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [eRes, sRes] = await Promise.all([
        axios.get(`${API_BASE}/api/engagement`),
        axios.get(`${API_BASE}/api/engagement/summary`),
      ]);
      if (eRes.data.success) setEvents(eRes.data.data);
      if (sRes.data.success) setSummary(sRes.data.data);
    } catch { showMsg("Failed to load", "error"); }
    finally { setLoading(false); }
  };

  const showMsg = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Form helpers ─────────────────────────────────────────────────────────
  const openCreate = () => {
    setForm(blankForm); setEditId(null); setShowForm(true);
  };

  const openEdit = (item) => {
    setForm({
      month: item.month, month_number: item.month_number,
      theme: item.theme,
      event_highlights: item.event_highlights.length ? item.event_highlights : [""],
      owner_department: item.owner_department || "",
      category: item.category, frequency: item.frequency,
      status: item.status, budget: item.budget || 0, notes: item.notes || ""
    });
    setEditId(item._id);
    setShowForm(true);
  };

  const closeForm = () => { setShowForm(false); setEditId(null); setForm(blankForm); };

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const addHighlight    = () => setForm(f => ({ ...f, event_highlights: [...f.event_highlights, ""] }));
  const removeHighlight = (i) => setForm(f => ({ ...f, event_highlights: f.event_highlights.filter((_,idx) => idx !== i) }));
  const updateHighlight = (i, v) => setForm(f => {
    const arr = [...f.event_highlights]; arr[i] = v;
    return { ...f, event_highlights: arr };
  });

  const handleSave = async () => {
    if (!form.theme.trim()) return showMsg("Theme is required", "error");
    setSaving(true);
    try {
      const payload = { ...form, event_highlights: form.event_highlights.filter(h => h.trim()) };
      if (editId) {
        await axios.put(`${API_BASE}/api/engagement/${editId}`, payload);
        showMsg("Updated successfully ✅");
      } else {
        await axios.post(`${API_BASE}/api/engagement`, payload);
        showMsg("Event created! 🎉");
      }
      closeForm(); fetchAll();
    } catch (err) {
      showMsg(err?.response?.data?.message || "Save failed", "error");
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await axios.delete(`${API_BASE}/api/engagement/${deleteId}`);
      showMsg("Deleted ✓"); setDeleteId(null); fetchAll();
    } catch { showMsg("Delete failed", "error"); }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await axios.patch(`${API_BASE}/api/engagement/${id}/status`, { status });
      showMsg("Status updated ✓"); fetchAll();
    } catch { showMsg("Failed", "error"); }
  };

  const handleSeed = async () => {
    if (!window.confirm("This will reset all data to the default 12 months. Continue?")) return;
    try {
      await axios.post(`${API_BASE}/api/engagement/seed/init`);
      showMsg("Seeded 12 months data! 🌱"); fetchAll();
    } catch { showMsg("Seed failed", "error"); }
  };

  const exportExcel = () => {
    const rows = filtered.map((e,i) => ({
      "#": i+1, "Month": e.month, "Theme": e.theme,
      "Events": e.event_highlights.join(", "),
      "Owner": e.owner_department, "Category": e.category,
      "Frequency": e.frequency, "Status": STATUS_CFG[e.status]?.label,
      "Budget": e.budget, "Notes": e.notes
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Engagement Calendar");
    XLSX.writeFile(wb, `Radnus_Engagement_Calendar_${new Date().getFullYear()}.xlsx`);
  };

  const filtered = useMemo(() => {
    let d = [...events];
    if (filterCat !== "All") d = d.filter(e => e.category === filterCat);
    if (filterSt  !== "All") d = d.filter(e => e.status   === filterSt);
    return d;
  }, [events, filterCat, filterSt]);

  if (loading) return (
    <div style={{ display:"flex", justifyContent:"center", alignItems:"center", height:"60vh" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ width:36, height:36, border:"4px solid #e5e7eb", borderTopColor:"#2563eb", borderRadius:"50%", animation:"spin 0.8s linear infinite", margin:"0 auto 12px" }}/>
        <p style={{ color:"#6b7280" }}>Loading calendar...</p>
        <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
      </div>
    </div>
  );

  return (
    <div className="ec-page" style={{ fontFamily:"'Segoe UI',sans-serif", minHeight:"100vh", background:"#f4f6fb" }}>
      <style>{STYLES}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position:"fixed", top:20, right:16, zIndex:9999, background:toast.type==="error"?"#ef4444":"#10b981", color:"#fff", padding:"12px 20px", borderRadius:8, fontWeight:600, fontSize:14, boxShadow:"0 4px 16px rgba(0,0,0,.15)", maxWidth:"calc(100vw - 32px)" }}>
          {toast.msg}
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
          <div style={{ background:"#fff", borderRadius:14, padding:28, maxWidth:360, width:"100%", textAlign:"center" }}>
            <div style={{ fontSize:36, marginBottom:12 }}>🗑️</div>
            <h3 style={{ margin:"0 0 8px", color:"#1a1a2e" }}>Delete this event?</h3>
            <p style={{ color:"#6b7280", fontSize:14, marginBottom:20 }}>This cannot be undone.</p>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={() => setDeleteId(null)} style={{ flex:1, padding:"10px 0", border:"1px solid #e5e7eb", borderRadius:8, background:"#fff", fontWeight:600, cursor:"pointer" }}>Cancel</button>
              <button onClick={handleDelete} style={{ flex:1, padding:"10px 0", border:"none", borderRadius:8, background:"#ef4444", color:"#fff", fontWeight:700, cursor:"pointer" }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24, gap:12, flexWrap:"wrap" }}>
        <div>
          <h2 style={{ margin:0, fontSize:22, fontWeight:800, color:"#1a1a2e" }}>📅 Employee Engagement Calendar</h2>
          <p style={{ margin:"4px 0 0", color:"#6b7280", fontSize:14 }}>Radnus Annual Engagement Plan · Monthly Themes & Events</p>
        </div>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          <button onClick={handleSeed} style={{ display:"flex", alignItems:"center", gap:6, padding:"9px 14px", background:"#fff", border:"1px solid #e5e7eb", borderRadius:8, fontWeight:600, fontSize:13, cursor:"pointer", color:"#374151" }}>
            🌱 Seed Data
          </button>
          <button onClick={() => setView(v => v === "grid" ? "list" : "grid")} style={{ display:"flex", alignItems:"center", gap:6, padding:"9px 14px", background:"#fff", border:"1px solid #e5e7eb", borderRadius:8, fontWeight:600, fontSize:13, cursor:"pointer", color:"#374151" }}>
            {view === "grid" ? "📋 List View" : "📅 Grid View"}
          </button>
          <button onClick={fetchAll} style={{ display:"flex", alignItems:"center", gap:6, padding:"9px 14px", background:"#fff", border:"1px solid #e5e7eb", borderRadius:8, fontWeight:600, fontSize:13, cursor:"pointer", color:"#374151" }}>
            <RefreshCw size={14}/> Refresh
          </button>
          <button onClick={exportExcel} style={{ display:"flex", alignItems:"center", gap:6, padding:"9px 14px", background:"#fff", border:"1px solid #e5e7eb", borderRadius:8, fontWeight:600, fontSize:13, cursor:"pointer", color:"#374151" }}>
            <Download size={14}/> Export
          </button>
          <button onClick={openCreate} style={{ display:"flex", alignItems:"center", gap:6, padding:"10px 20px", background:"#1a1a2e", color:"#fff", border:"none", borderRadius:9, fontWeight:700, fontSize:14, cursor:"pointer" }}>
            <Plus size={15}/> Add Event
          </button>
        </div>
      </div>

      {/* Stats */}
      {summary && (
        <div className="ec-stats" style={{ display:"grid", gap:14, marginBottom:24 }}>
          {[
            { label:"Total Events",  value:summary.total,     color:"#1a1a2e", bg:"#f3f4f6" },
            { label:"Upcoming",      value:summary.upcoming,  color:"#3b82f6", bg:"#eff6ff" },
            { label:"Ongoing",       value:summary.ongoing,   color:"#f59e0b", bg:"#fffbeb" },
            { label:"Completed",     value:summary.completed, color:"#10b981", bg:"#ecfdf5" },
          ].map((s,i) => (
            <div key={i} style={{ background:"#fff", borderRadius:12, padding:"16px 20px", border:"1px solid #e5e7eb", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <p style={{ margin:"0 0 4px", fontSize:11, color:"#6b7280", fontWeight:700, textTransform:"uppercase" }}>{s.label}</p>
                <p style={{ margin:0, fontSize:28, fontWeight:900, color:s.color }}>{s.value}</p>
              </div>
              <div style={{ width:44, height:44, borderRadius:10, background:s.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22 }}>
                {["📅","⏳","🔥","✅"][i]}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Category Legend */}
      <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:20 }}>
        {Object.entries(CATEGORY_COLORS).map(([cat, cfg]) => (
          <span key={cat} onClick={() => setFilterCat(filterCat === cat ? "All" : cat)}
            style={{ background: filterCat === cat ? cfg.color : cfg.bg, color: filterCat === cat ? "#fff" : cfg.color, border:`1px solid ${cfg.border}`, borderRadius:20, padding:"5px 12px", fontSize:12, fontWeight:600, cursor:"pointer", transition:"all .15s" }}>
            {cat}
          </span>
        ))}
        {filterCat !== "All" && (
          <span onClick={() => setFilterCat("All")} style={{ background:"#f3f4f6", color:"#6b7280", border:"1px solid #e5e7eb", borderRadius:20, padding:"5px 12px", fontSize:12, fontWeight:600, cursor:"pointer" }}>
            ✕ Clear
          </span>
        )}
      </div>

      {/* Status Filter */}
      <div style={{ display:"flex", gap:8, marginBottom:20, flexWrap:"wrap" }}>
        {["All","upcoming","ongoing","completed"].map(s => (
          <button key={s} onClick={() => setFilterSt(s)}
            style={{ padding:"6px 16px", border:"1px solid", borderColor: filterSt===s ? "#1a1a2e" : "#e5e7eb", borderRadius:8, background: filterSt===s ? "#1a1a2e" : "#fff", color: filterSt===s ? "#fff" : "#374151", fontSize:13, fontWeight:600, cursor:"pointer", textTransform:"capitalize" }}>
            {s === "All" ? "All Status" : STATUS_CFG[s]?.label}
          </button>
        ))}
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <div style={{ background:"#fff", borderRadius:16, border:"1px solid #e5e7eb", marginBottom:24, overflow:"hidden", boxShadow:"0 4px 24px rgba(0,0,0,.07)" }}>
          <div style={{ background:"#1a1a2e", padding:"16px 22px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <Calendar size={18} color="#93c5fd"/>
              <span style={{ color:"#fff", fontWeight:800, fontSize:15 }}>{editId ? "Edit Event" : "Add New Event"}</span>
            </div>
            <button onClick={closeForm} style={{ background:"rgba(255,255,255,.1)", border:"none", borderRadius:7, padding:"5px 12px", color:"#d1d5db", cursor:"pointer", display:"flex", alignItems:"center", gap:5, fontSize:13 }}>
              <X size={13}/> Cancel
            </button>
          </div>

          <div style={{ padding:22 }}>
            <div className="ec-form-grid" style={{ display:"grid", gap:14, marginBottom:14 }}>
              <div>
                <label style={lbl}>Month *</label>
                <select style={inp} value={form.month} onChange={e => { const idx = MONTHS.indexOf(e.target.value)+1; setF("month", e.target.value); setF("month_number", idx); }}>
                  {MONTHS.map((m,i) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Theme *</label>
                <input style={inp} value={form.theme} onChange={e => setF("theme", e.target.value)} placeholder="e.g. Learning & Growth Month"/>
              </div>
              <div>
                <label style={lbl}>Owner Department</label>
                <input style={inp} value={form.owner_department} onChange={e => setF("owner_department", e.target.value)} placeholder="e.g. HR + Admin"/>
              </div>
              <div>
                <label style={lbl}>Category</label>
                <select style={inp} value={form.category} onChange={e => setF("category", e.target.value)}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Frequency</label>
                <select style={inp} value={form.frequency} onChange={e => setF("frequency", e.target.value)}>
                  {FREQUENCIES.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Status</label>
                <select style={inp} value={form.status} onChange={e => setF("status", e.target.value)}>
                  <option value="upcoming">Upcoming</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div>
                <label style={lbl}>Budget (₹)</label>
                <input type="number" style={inp} value={form.budget} onChange={e => setF("budget", Number(e.target.value))} placeholder="0"/>
              </div>
              <div>
                <label style={lbl}>Notes</label>
                <input style={inp} value={form.notes} onChange={e => setF("notes", e.target.value)} placeholder="Any special notes..."/>
              </div>
            </div>

            {/* Event Highlights */}
            <div style={{ marginBottom:16 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                <label style={lbl}>Event Highlights</label>
                <button onClick={addHighlight} style={{ display:"flex", alignItems:"center", gap:4, padding:"5px 12px", background:"#eff6ff", border:"1px solid #bfdbfe", borderRadius:7, color:"#2563eb", fontSize:12, fontWeight:600, cursor:"pointer" }}>
                  <Plus size={12}/> Add
                </button>
              </div>
              {form.event_highlights.map((h, i) => (
                <div key={i} style={{ display:"flex", gap:8, marginBottom:8 }}>
                  <input style={{ ...inp, flex:1 }} value={h} onChange={e => updateHighlight(i, e.target.value)} placeholder={`Event ${i+1}...`}/>
                  {form.event_highlights.length > 1 && (
                    <button onClick={() => removeHighlight(i)} style={{ padding:"0 12px", background:"#fef2f2", border:"1px solid #fecaca", borderRadius:7, color:"#ef4444", cursor:"pointer", fontSize:16 }}>✕</button>
                  )}
                </div>
              ))}
            </div>

            <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
              <button onClick={closeForm} style={{ padding:"10px 24px", border:"1px solid #e5e7eb", borderRadius:8, background:"#fff", color:"#374151", fontWeight:600, cursor:"pointer" }}>Cancel</button>
              <button onClick={handleSave} disabled={saving} style={{ display:"flex", alignItems:"center", gap:6, padding:"10px 28px", border:"none", borderRadius:8, background:saving?"#93c5fd":"#1a1a2e", color:"#fff", fontWeight:700, fontSize:14, cursor:saving?"not-allowed":"pointer" }}>
                {saving ? <><RefreshCw size={13} style={{ animation:"spin .6s linear infinite" }}/> Saving...</> : <><Save size={13}/> {editId ? "Update" : "Create"}</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grid View */}
      {view === "grid" && (
        <div className="ec-grid" style={{ display:"grid", gap:16 }}>
          {filtered.map(item => {
            const catCfg = CATEGORY_COLORS[item.category] || CATEGORY_COLORS["Fun & Celebration"];
            const stCfg  = STATUS_CFG[item.status];
            return (
              <div key={item._id} style={{ background:"#fff", borderRadius:14, border:`1px solid ${catCfg.border}`, overflow:"hidden", transition:"transform .15s", cursor:"default" }}
                onMouseEnter={e => e.currentTarget.style.transform="translateY(-2px)"}
                onMouseLeave={e => e.currentTarget.style.transform="translateY(0)"}>

                {/* Card Header */}
                <div style={{ background:catCfg.color, padding:"14px 18px" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8 }}>
                    <div>
                      <p style={{ margin:0, color:"#fff", fontWeight:900, fontSize:22 }}>{MONTH_EMOJIS[item.month] || "📅"}</p>
                      <p style={{ margin:"4px 0 0", color:"#fff", fontWeight:800, fontSize:15 }}>{item.month}</p>
                    </div>
                    <span style={{ background:"rgba(255,255,255,.25)", color:"#fff", padding:"4px 10px", borderRadius:20, fontSize:11, fontWeight:700 }}>
                      {stCfg?.label}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div style={{ padding:"14px 18px" }}>
                  <p style={{ margin:"0 0 8px", fontWeight:800, fontSize:14, color:"#1a1a2e" }}>{item.theme}</p>
                  <p style={{ margin:"0 0 10px", fontSize:11, color:catCfg.color, fontWeight:700, textTransform:"uppercase" }}>{item.category}</p>

                  {/* Event highlights */}
                  <div style={{ marginBottom:12 }}>
                    {item.event_highlights.slice(0,3).map((h,i) => (
                      <div key={i} style={{ display:"flex", gap:6, marginBottom:4, fontSize:12, color:"#374151" }}>
                        <span style={{ color:catCfg.color, fontWeight:700, flexShrink:0 }}>•</span>
                        <span>{h}</span>
                      </div>
                    ))}
                    {item.event_highlights.length > 3 && (
                      <p style={{ margin:"4px 0 0", fontSize:11, color:"#9ca3af" }}>+{item.event_highlights.length - 3} more events</p>
                    )}
                  </div>

                  {/* Meta */}
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                    <span style={{ fontSize:11, color:"#6b7280", background:"#f3f4f6", padding:"3px 8px", borderRadius:6 }}>{item.frequency}</span>
                    <span style={{ fontSize:11, color:"#6b7280" }}>{item.owner_department}</span>
                  </div>

                  {/* Status change */}
                  <select
                    value={item.status}
                    onChange={e => handleStatusChange(item._id, e.target.value)}
                    style={{ ...inp, fontSize:12, marginBottom:10, background:stCfg?.bg, color:stCfg?.color, fontWeight:700, border:`1px solid ${stCfg?.color}44` }}>
                    <option value="upcoming">⏳ Upcoming</option>
                    <option value="ongoing">🔥 Ongoing</option>
                    <option value="completed">✅ Completed</option>
                  </select>

                  {/* Actions */}
                  <div style={{ display:"flex", gap:8 }}>
                    <button onClick={() => openEdit(item)} style={{ flex:1, padding:"7px 0", background:"#eff6ff", border:"1px solid #bfdbfe", borderRadius:7, color:"#2563eb", fontSize:12, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:4 }}>
                      <Edit2 size={12}/> Edit
                    </button>
                    <button onClick={() => setDeleteId(item._id)} style={{ flex:1, padding:"7px 0", background:"#fef2f2", border:"1px solid #fecaca", borderRadius:7, color:"#ef4444", fontSize:12, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:4 }}>
                      <Trash2 size={12}/> Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {view === "list" && (
        <div style={{ background:"#fff", borderRadius:14, border:"1px solid #e5e7eb", overflow:"hidden" }}>
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
              <thead>
                <tr style={{ background:"#f8fafc" }}>
                  {["Month","Theme","Events","Owner","Category","Frequency","Status","Actions"].map(h => (
                    <th key={h} style={{ padding:"12px 16px", textAlign:"left", fontWeight:700, color:"#374151", borderBottom:"2px solid #e5e7eb", whiteSpace:"nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, i) => {
                  const catCfg = CATEGORY_COLORS[item.category] || {};
                  const stCfg  = STATUS_CFG[item.status];
                  return (
                    <tr key={item._id} style={{ borderBottom:"1px solid #f3f4f6", background:i%2===0?"#fff":"#fafafa" }}>
                      <td style={{ padding:"13px 16px" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <span style={{ fontSize:20 }}>{MONTH_EMOJIS[item.month]}</span>
                          <span style={{ fontWeight:700, color:"#1a1a2e" }}>{item.month}</span>
                        </div>
                      </td>
                      <td style={{ padding:"13px 16px", fontWeight:600, color:"#374151", maxWidth:180 }}>{item.theme}</td>
                      <td style={{ padding:"13px 16px", color:"#6b7280", fontSize:12, maxWidth:200 }}>
                        {item.event_highlights.slice(0,2).join(", ")}
                        {item.event_highlights.length > 2 && ` +${item.event_highlights.length-2}`}
                      </td>
                      <td style={{ padding:"13px 16px", color:"#6b7280", fontSize:12, whiteSpace:"nowrap" }}>{item.owner_department}</td>
                      <td style={{ padding:"13px 16px" }}>
                        <span style={{ background:catCfg.bg, color:catCfg.color, border:`1px solid ${catCfg.border}`, padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:700, whiteSpace:"nowrap" }}>
                          {item.category}
                        </span>
                      </td>
                      <td style={{ padding:"13px 16px", color:"#6b7280", fontSize:12 }}>{item.frequency}</td>
                      <td style={{ padding:"13px 16px" }}>
                        <span style={{ background:stCfg?.bg, color:stCfg?.color, padding:"4px 12px", borderRadius:20, fontSize:11, fontWeight:700 }}>{stCfg?.label}</span>
                      </td>
                      <td style={{ padding:"13px 16px" }}>
                        <div style={{ display:"flex", gap:6 }}>
                          <button onClick={() => openEdit(item)} style={{ padding:"5px 10px", background:"#eff6ff", border:"1px solid #bfdbfe", borderRadius:6, color:"#2563eb", fontSize:11, fontWeight:600, cursor:"pointer" }}>Edit</button>
                          <button onClick={() => setDeleteId(item._id)} style={{ padding:"5px 10px", background:"#fef2f2", border:"1px solid #fecaca", borderRadius:6, color:"#ef4444", fontSize:11, fontWeight:600, cursor:"pointer" }}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {filtered.length === 0 && !loading && (
        <div style={{ background:"#fff", borderRadius:14, padding:"60px 0", textAlign:"center", border:"1px solid #e5e7eb" }}>
          <div style={{ fontSize:40, marginBottom:10 }}>📅</div>
          <p style={{ color:"#6b7280", fontWeight:600 }}>No events found</p>
          <p style={{ color:"#9ca3af", fontSize:13 }}>Click "Seed Data" to load default 12 months or "Add Event" to create</p>
        </div>
      )}

      {/* Info boxes */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginTop:24 }}>
        <div style={{ background:"#fff", borderRadius:14, border:"1px solid #e5e7eb", padding:"18px 20px" }}>
          <p style={{ margin:"0 0 12px", fontWeight:800, fontSize:14, color:"#1a1a2e" }}>👥 Execution & Roles</p>
          {[
            { role:"HR Manager",          resp:"Design and coordinate monthly calendar; communicate via email & LMS" },
            { role:"Department Heads",    resp:"Ensure team participation and event feedback" },
            { role:"Engagement Committee",resp:"1 representative per department to help plan and execute" },
            { role:"CEO / CPO",           resp:"Approve budgets and attend flagship events" },
          ].map((r,i) => (
            <div key={i} style={{ display:"flex", gap:12, padding:"8px 0", borderBottom:i<3?"1px solid #f3f4f6":"none", fontSize:13 }}>
              <span style={{ color:"#1a1a2e", fontWeight:700, minWidth:150, flexShrink:0 }}>{r.role}</span>
              <span style={{ color:"#6b7280" }}>{r.resp}</span>
            </div>
          ))}
        </div>

        <div style={{ background:"#fff", borderRadius:14, border:"1px solid #e5e7eb", padding:"18px 20px" }}>
          <p style={{ margin:"0 0 12px", fontWeight:800, fontSize:14, color:"#1a1a2e" }}>🏆 Recognition & Rewards</p>
          {[
            "\"Best Engaged Team of the Month\" certificate & team lunch",
            "Participation badges & digital shout-outs on the Radnus portal",
            "\"Event Volunteer of the Month\" recognition for coordinators",
          ].map((r,i) => (
            <div key={i} style={{ display:"flex", gap:8, marginBottom:10, fontSize:13, color:"#374151" }}>
              <span style={{ color:"#f59e0b", fontWeight:700, flexShrink:0 }}>🎖</span>
              <span>{r}</span>
            </div>
          ))}
          <p style={{ margin:"12px 0 8px", fontWeight:800, fontSize:13, color:"#1a1a2e" }}>🌟 Expected Impact</p>
          {[
            "Enhanced employee morale, retention, and collaboration",
            "Creation of a happy, inclusive, and innovative workplace",
            "Stronger alignment with Radnus values — Care, Innovation, Integrity, Excellence, Speed",
          ].map((r,i) => (
            <div key={i} style={{ display:"flex", gap:8, marginBottom:8, fontSize:12, color:"#374151" }}>
              <span style={{ color:"#10b981", fontWeight:700, flexShrink:0 }}>•</span>
              <span>{r}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}