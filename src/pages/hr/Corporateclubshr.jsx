import { useState, useEffect } from "react";
import axios from "axios";
import {
  Cpu, Dumbbell, Palette, Users, Calendar, Star,
  Plus, Edit2, Trash2, Check, X, Clock, RefreshCw,
  UserCheck, UserX, Award, BarChart2, ChevronDown,
  ChevronUp, Download
} from "lucide-react";
import * as XLSX from "xlsx";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const CLUB_CONFIG = {
  tech: {
    key: "tech", label: "Tech Club", sublabel: "Innovation & Learning",
    icon: <Cpu size={20}/>, color: "#3b82f6", bg: "#eff6ff", border: "#bfdbfe",
  },
  fitness: {
    key: "fitness", label: "Fitness Club", sublabel: "Health & Wellness",
    icon: <Dumbbell size={20}/>, color: "#10b981", bg: "#ecfdf5", border: "#6ee7b7",
  },
  creativity: {
    key: "creativity", label: "Creativity Club", sublabel: "Art, Music & Culture",
    icon: <Palette size={20}/>, color: "#8b5cf6", bg: "#f5f3ff", border: "#ddd6fe",
  },
};

const EVENT_STATUS = {
  upcoming:  { label: "Upcoming",  color: "#3b82f6", bg: "#eff6ff" },
  ongoing:   { label: "Ongoing",   color: "#f59e0b", bg: "#fffbeb" },
  completed: { label: "Completed", color: "#10b981", bg: "#ecfdf5" },
  cancelled: { label: "Cancelled", color: "#ef4444", bg: "#fef2f2" },
};

const MEMBER_STATUS = {
  pending:  { label: "Pending",  color: "#f59e0b", bg: "#fffbeb" },
  approved: { label: "Approved", color: "#10b981", bg: "#ecfdf5" },
  rejected: { label: "Rejected", color: "#ef4444", bg: "#fef2f2" },
};

const inp = { width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 13, color: "#1a1a2e", background: "#fff", boxSizing: "border-box", outline: "none" };
const lbl = { display: "block", fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.04em" };

const blankEvent  = { title: "", description: "", date: "", venue: "", points_awarded: 10, status: "upcoming", max_participants: "" };
const blankPoints = { employee_id: "", activity_type: "Event Participation", points: 10, reason: "" };

const STYLES = `
  .cc-page { padding: 28px 32px; }
  .cc-tabs { display: flex; gap: 4px; background: #fff; border-radius: 10px; padding: 4px; border: 1px solid #e5e7eb; margin-bottom: 20px; }
  .cc-tab  { padding: 8px 18px; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 13px; transition: all .15s; background: transparent; color: #6b7280; white-space: nowrap; flex-shrink: 0; }
  .cc-tab.active { background: #1a1a2e; color: #fff; }
  .cc-grid      { grid-template-columns: repeat(3,1fr); }
  .cc-form-grid { grid-template-columns: 1fr 1fr; }
  @media (max-width: 1024px) {
    .cc-grid { grid-template-columns: 1fr 1fr !important; }
  }
  @media (max-width: 768px) {
    .cc-page { padding: 14px; }
    .cc-grid { grid-template-columns: 1fr !important; }
    .cc-form-grid { grid-template-columns: 1fr !important; }
    .cc-tabs { overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; width: 100%; }
    .cc-tabs::-webkit-scrollbar { display: none; }
  }
  @keyframes spin { to { transform: rotate(360deg); } }
`;

export default function CorporateClubs() {
  const [activeClub, setActiveClub]     = useState("tech");
  const [activeTab,  setActiveTab]      = useState("overview");
  const [clubStats,  setClubStats]      = useState({});
  const [members,    setMembers]        = useState([]);
  const [events,     setEvents]         = useState([]);
  const [pointsLog,  setPointsLog]      = useState([]);
  const [employees,  setEmployees]      = useState([]);
  const [loading,    setLoading]        = useState(true);
  const [saving,     setSaving]         = useState(false);
  const [toast,      setToast]          = useState(null);

  const [showEventForm,  setShowEventForm]  = useState(false);
  const [showPointsForm, setShowPointsForm] = useState(false);
  const [editEvent,      setEditEvent]      = useState(null);
  const [deleteId,       setDeleteId]       = useState(null);
  const [deleteType,     setDeleteType]     = useState(null);

  const [eventForm,  setEventForm]  = useState(blankEvent);
  const [pointsForm, setPointsForm] = useState(blankPoints);

  useEffect(() => { fetchAll(); }, [activeClub]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [mRes, eRes, pRes, statsRes, empRes] = await Promise.all([
        axios.get(`${API_BASE}/api/clubs/${activeClub}/members`),
        axios.get(`${API_BASE}/api/clubs/${activeClub}/events`),
        axios.get(`${API_BASE}/api/clubs/${activeClub}/points`),
        axios.get(`${API_BASE}/api/clubs/${activeClub}/summary`).catch(() => ({ data: { data: {} } })),
        axios.get(`${API_BASE}/api/hr/employees`),
      ]);
      setMembers(mRes.data.data || []);
      setEvents(eRes.data.data  || []);
      setPointsLog(pRes.data.data || []);
      setClubStats(prev => ({ ...prev, [activeClub]: statsRes.data.data || {} }));
      if (empRes.data) {
        const active = Array.isArray(empRes.data) ? empRes.data.filter(e => e.status === "active") : [];
        setEmployees(active);
      }
    } catch { showMsg("Failed to load", "error"); }
    finally { setLoading(false); }
  };

  const showMsg = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Member Actions ──────────────────────────────────────────────
  const handleMemberStatus = async (memberId, status) => {
    try {
      await axios.patch(`${API_BASE}/api/clubs/${activeClub}/members/${memberId}/status`, { status });
      showMsg(`Member ${status}!`);
      fetchAll();
    } catch { showMsg("Failed", "error"); }
  };

  const handleRemoveMember = async (memberId) => {
    try {
      await axios.delete(`${API_BASE}/api/clubs/${activeClub}/members/${memberId}`);
      showMsg("Member removed");
      fetchAll();
    } catch { showMsg("Failed", "error"); }
    setDeleteId(null);
  };

  // ── Event Actions ───────────────────────────────────────────────
  const openCreateEvent = () => {
    setEventForm(blankEvent); setEditEvent(null);
    setShowEventForm(true);   setActiveTab("events");
  };
  const openEditEvent = (ev) => {
    setEventForm({
      title: ev.title, description: ev.description || "",
      date: ev.date?.slice(0,10) || "", venue: ev.venue || "",
      points_awarded: ev.points_awarded || 10, status: ev.status,
      max_participants: ev.max_participants || ""
    });
    setEditEvent(ev._id); setShowEventForm(true);
  };

  const handleSaveEvent = async () => {
    if (!eventForm.title.trim()) return showMsg("Title required", "error");
    setSaving(true);
    try {
      if (editEvent) {
        await axios.put(`${API_BASE}/api/clubs/${activeClub}/events/${editEvent}`, eventForm);
        showMsg("Event updated ✅");
      } else {
        await axios.post(`${API_BASE}/api/clubs/${activeClub}/events`, eventForm);
        showMsg("Event created! 🎉");
      }
      setShowEventForm(false); setEditEvent(null);
      setEventForm(blankEvent); fetchAll();
    } catch (err) { showMsg(err?.response?.data?.message || "Save failed", "error"); }
    finally { setSaving(false); }
  };

  const handleDeleteEvent = async () => {
    try {
      await axios.delete(`${API_BASE}/api/clubs/${activeClub}/events/${deleteId}`);
      showMsg("Event deleted"); fetchAll();
    } catch { showMsg("Failed", "error"); }
    setDeleteId(null); setDeleteType(null);
  };

  const handleEventStatus = async (eventId, status) => {
    try {
      await axios.patch(`${API_BASE}/api/clubs/${activeClub}/events/${eventId}/status`, { status });
      showMsg("Status updated"); fetchAll();
    } catch { showMsg("Failed", "error"); }
  };

  // ── Points Actions ──────────────────────────────────────────────
  const handleAwardPoints = async () => {
    if (!pointsForm.employee_id || !pointsForm.points)
      return showMsg("Employee and points required", "error");
    setSaving(true);
    try {
      await axios.post(`${API_BASE}/api/clubs/${activeClub}/points`, {
        ...pointsForm,
        // ✅ FIX: send club_type so employee-side /points/my can filter by club
        club_type: activeClub,
      });
      showMsg("Points awarded! ⭐");
      setShowPointsForm(false); setPointsForm(blankPoints); fetchAll();
    } catch (err) { showMsg(err?.response?.data?.message || "Failed", "error"); }
    finally { setSaving(false); }
  };

  const handleDeletePoints = async () => {
    try {
      await axios.delete(`${API_BASE}/api/clubs/${activeClub}/points/${deleteId}`);
      showMsg("Points deleted"); fetchAll();
    } catch { showMsg("Failed", "error"); }
    setDeleteId(null); setDeleteType(null);
  };

  // ── Export ──────────────────────────────────────────────────────
  const exportMembers = () => {
    const rows = members.map((m, i) => ({
      "#": i+1,
      "Name":         m.employee_id?.name || "—",
      "Dept":         m.employee_id?.department || "—",
      "Status":       MEMBER_STATUS[m.status]?.label,
      "Joined":       m.joined_at ? new Date(m.joined_at).toLocaleDateString("en-IN") : "—",
      "Total Points": pointsLog.filter(p =>
        (p.employee_id?._id || p.employee_id) === (m.employee_id?._id || m.employee_id)
      ).reduce((s,p) => s+(p.points||0), 0),
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Members");
    XLSX.writeFile(wb, `${activeClub}_members.xlsx`);
  };

  const cfg      = CLUB_CONFIG[activeClub];
  const stats    = clubStats[activeClub] || {};
  const pending  = members.filter(m => m.status === "pending");
  const approved = members.filter(m => m.status === "approved");

  return (
    <div className="cc-page" style={{ fontFamily: "'Segoe UI',sans-serif", minHeight: "100vh", background: "#f4f6fb" }}>
      <style>{STYLES}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", top: 20, right: 16, zIndex: 9999, background: toast.type === "error" ? "#ef4444" : "#10b981", color: "#fff", padding: "12px 20px", borderRadius: 8, fontWeight: 600, fontSize: 14, boxShadow: "0 4px 16px rgba(0,0,0,.15)" }}>
          {toast.msg}
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteId && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 14, padding: 28, maxWidth: 360, width: "100%", textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🗑️</div>
            <h3 style={{ margin: "0 0 8px", color: "#1a1a2e" }}>Confirm Delete?</h3>
            <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 20 }}>This cannot be undone.</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => { setDeleteId(null); setDeleteType(null); }} style={{ flex:1, padding:"10px 0", border:"1px solid #e5e7eb", borderRadius:8, background:"#fff", fontWeight:600, cursor:"pointer" }}>Cancel</button>
              <button onClick={() => deleteType==="event" ? handleDeleteEvent() : deleteType==="points" ? handleDeletePoints() : handleRemoveMember()}
                style={{ flex:1, padding:"10px 0", border:"none", borderRadius:8, background:"#ef4444", color:"#fff", fontWeight:700, cursor:"pointer" }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24, gap:12, flexWrap:"wrap" }}>
        <div>
          <h2 style={{ margin:0, fontSize:22, fontWeight:800, color:"#1a1a2e" }}>🏆 Corporate Clubs — HR Management</h2>
          <p style={{ margin:"4px 0 0", color:"#6b7280", fontSize:14 }}>Manage members, events, and points for all clubs</p>
        </div>
        <button onClick={fetchAll} style={{ display:"flex", alignItems:"center", gap:6, padding:"9px 14px", background:"#fff", border:"1px solid #e5e7eb", borderRadius:8, fontWeight:600, fontSize:13, cursor:"pointer", color:"#374151" }}>
          <RefreshCw size={14}/> Refresh
        </button>
      </div>

      {/* Club Selector */}
      <div style={{ display:"flex", gap:12, marginBottom:24, flexWrap:"wrap" }}>
        {Object.values(CLUB_CONFIG).map(c => (
          <button key={c.key} onClick={() => { setActiveClub(c.key); setActiveTab("overview"); }}
            style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 20px", border:`2px solid ${activeClub===c.key ? c.color : "#e5e7eb"}`, borderRadius:10, background:activeClub===c.key ? c.bg : "#fff", color:activeClub===c.key ? c.color : "#6b7280", fontWeight:700, fontSize:13, cursor:"pointer", transition:"all .15s" }}>
            {c.icon} {c.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign:"center", padding:60 }}>
          <div style={{ width:36, height:36, border:"4px solid #e5e7eb", borderTopColor:cfg.color, borderRadius:"50%", animation:"spin 0.8s linear infinite", margin:"0 auto 12px" }}/>
          <p style={{ color:"#6b7280" }}>Loading {cfg.label} data...</p>
        </div>
      ) : (
        <>
          {/* Stats Row */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:24 }}>
            {[
              { label:"Total Members",    value:approved.length,    color:cfg.color,  bg:cfg.bg },
              { label:"Pending Requests", value:pending.length,     color:"#f59e0b",  bg:"#fffbeb" },
              { label:"Total Events",     value:events.length,      color:"#8b5cf6",  bg:"#f5f3ff" },
              { label:"Points Awarded",   value:pointsLog.reduce((s,p)=>s+(p.points||0),0), color:"#10b981", bg:"#ecfdf5" },
            ].map((s,i) => (
              <div key={i} style={{ background:"#fff", borderRadius:12, padding:"16px 20px", border:"1px solid #e5e7eb", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div>
                  <p style={{ margin:"0 0 4px", fontSize:11, color:"#6b7280", fontWeight:700, textTransform:"uppercase" }}>{s.label}</p>
                  <p style={{ margin:0, fontSize:26, fontWeight:900, color:s.color }}>{s.value}</p>
                </div>
                <div style={{ width:44, height:44, borderRadius:10, background:s.bg, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  {[<Users size={20} color={s.color}/>, <Clock size={20} color={s.color}/>, <Calendar size={20} color={s.color}/>, <Star size={20} color={s.color}/>][i]}
                </div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="cc-tabs">
            {[
              { id:"overview", label:"Overview" },
              { id:"members",  label:`Members (${pending.length > 0 ? `${pending.length} pending` : approved.length})` },
              { id:"events",   label:`Events (${events.length})` },
              { id:"points",   label:"Points" },
            ].map(t => (
              <button key={t.id} className={`cc-tab ${activeTab===t.id?"active":""}`} onClick={() => setActiveTab(t.id)}>
                {t.label}
              </button>
            ))}
          </div>

          {/* ── OVERVIEW TAB ── */}
          {activeTab === "overview" && (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
              {/* Pending Approvals */}
              <div style={{ background:"#fff", borderRadius:14, border:"1px solid #e5e7eb", overflow:"hidden" }}>
                <div style={{ padding:"14px 18px", borderBottom:"1px solid #f3f4f6", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <h3 style={{ margin:0, fontSize:14, fontWeight:700, color:"#1a1a2e" }}>⏳ Pending Approvals ({pending.length})</h3>
                </div>
                {pending.length === 0 ? (
                  <p style={{ textAlign:"center", color:"#9ca3af", padding:"30px 0", fontSize:13 }}>No pending requests</p>
                ) : (
                  <div style={{ padding:"12px 18px" }}>
                    {pending.map(m => (
                      <div key={m._id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:"1px solid #f3f4f6" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                          <div style={{ width:34, height:34, borderRadius:"50%", background:cfg.bg, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, color:cfg.color, fontSize:13 }}>
                            {m.employee_id?.name?.charAt(0)||"?"}
                          </div>
                          <div>
                            <p style={{ margin:0, fontWeight:700, fontSize:13, color:"#1a1a2e" }}>{m.employee_id?.name||"—"}</p>
                            <p style={{ margin:0, fontSize:11, color:"#9ca3af" }}>{m.employee_id?.department||"—"}</p>
                          </div>
                        </div>
                        <div style={{ display:"flex", gap:6 }}>
                          <button onClick={() => handleMemberStatus(m._id,"approved")} style={{ padding:"5px 12px", background:"#ecfdf5", border:"1px solid #6ee7b7", borderRadius:7, color:"#10b981", fontSize:12, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", gap:4 }}>
                            <Check size={11}/> Approve
                          </button>
                          <button onClick={() => handleMemberStatus(m._id,"rejected")} style={{ padding:"5px 10px", background:"#fef2f2", border:"1px solid #fecaca", borderRadius:7, color:"#ef4444", fontSize:12, fontWeight:600, cursor:"pointer" }}>
                            <X size={11}/>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Upcoming Events */}
              <div style={{ background:"#fff", borderRadius:14, border:"1px solid #e5e7eb", overflow:"hidden" }}>
                <div style={{ padding:"14px 18px", borderBottom:"1px solid #f3f4f6", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <h3 style={{ margin:0, fontSize:14, fontWeight:700, color:"#1a1a2e" }}>📅 Upcoming Events</h3>
                  <button onClick={openCreateEvent} style={{ display:"flex", alignItems:"center", gap:5, padding:"6px 12px", background:cfg.color, border:"none", borderRadius:7, color:"#fff", fontSize:12, fontWeight:600, cursor:"pointer" }}>
                    <Plus size={12}/> Add
                  </button>
                </div>
                {events.filter(e => e.status==="upcoming"||e.status==="ongoing").length === 0 ? (
                  <p style={{ textAlign:"center", color:"#9ca3af", padding:"30px 0", fontSize:13 }}>No upcoming events</p>
                ) : (
                  <div style={{ padding:"12px 18px" }}>
                    {events.filter(e=>e.status==="upcoming"||e.status==="ongoing").slice(0,4).map(ev => {
                      const st = EVENT_STATUS[ev.status];
                      return (
                        <div key={ev._id} style={{ padding:"10px 0", borderBottom:"1px solid #f3f4f6" }}>
                          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                            <p style={{ margin:0, fontWeight:700, fontSize:13, color:"#1a1a2e" }}>{ev.title}</p>
                            <span style={{ background:st.bg, color:st.color, padding:"2px 8px", borderRadius:20, fontSize:10, fontWeight:700 }}>{st.label}</span>
                          </div>
                          <p style={{ margin:"3px 0 0", fontSize:11, color:"#9ca3af" }}>
                            {ev.date ? new Date(ev.date).toLocaleDateString("en-IN",{day:"numeric",month:"short"}) : "TBD"} · {ev.venue||"Venue TBD"} · +{ev.points_awarded} pts
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Top Members */}
              <div style={{ background:"#fff", borderRadius:14, border:"1px solid #e5e7eb", overflow:"hidden", gridColumn:"1/-1" }}>
                <div style={{ padding:"14px 18px", borderBottom:"1px solid #f3f4f6" }}>
                  <h3 style={{ margin:0, fontSize:14, fontWeight:700, color:"#1a1a2e" }}>🏅 Top Members by Points</h3>
                </div>
                <div style={{ padding:"14px 18px", display:"flex", gap:12, flexWrap:"wrap" }}>
                  {(() => {
                    const ptsByEmp = {};
                    pointsLog.forEach(p => {
                      const id   = p.employee_id?._id || p.employee_id;
                      const name = p.employee_id?.name || "Unknown";
                      if (!ptsByEmp[id]) ptsByEmp[id] = { name, pts:0 };
                      ptsByEmp[id].pts += p.points||0;
                    });
                    return Object.values(ptsByEmp).sort((a,b)=>b.pts-a.pts).slice(0,5).map((e,i) => (
                      <div key={i} style={{ background:cfg.bg, border:`1px solid ${cfg.border}`, borderRadius:10, padding:"12px 16px", textAlign:"center", minWidth:100 }}>
                        <p style={{ margin:"0 0 4px", fontSize:20 }}>{["🥇","🥈","🥉","4️⃣","5️⃣"][i]}</p>
                        <p style={{ margin:"0 0 2px", fontWeight:700, fontSize:12, color:"#1a1a2e" }}>{e.name.split(" ")[0]}</p>
                        <p style={{ margin:0, fontWeight:900, fontSize:16, color:cfg.color }}>{e.pts} pts</p>
                      </div>
                    ));
                  })()}
                  {pointsLog.length===0 && <p style={{ color:"#9ca3af", fontSize:13 }}>No points awarded yet</p>}
                </div>
              </div>
            </div>
          )}

          {/* ── MEMBERS TAB ── */}
          {activeTab === "members" && (
            <div style={{ background:"#fff", borderRadius:14, border:"1px solid #e5e7eb", overflow:"hidden" }}>
              <div style={{ padding:"14px 20px", borderBottom:"1px solid #f3f4f6", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:8 }}>
                <h3 style={{ margin:0, fontSize:14, fontWeight:700, color:"#1a1a2e" }}>All Members ({members.length})</h3>
                <button onClick={exportMembers} style={{ display:"flex", alignItems:"center", gap:5, padding:"7px 14px", background:"#fff", border:"1px solid #e5e7eb", borderRadius:7, fontSize:12, fontWeight:600, cursor:"pointer", color:"#374151" }}>
                  <Download size={13}/> Export
                </button>
              </div>
              {members.length === 0 ? (
                <p style={{ textAlign:"center", color:"#9ca3af", padding:"40px 0", fontSize:13 }}>No members yet</p>
              ) : (
                <div style={{ overflowX:"auto" }}>
                  <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                    <thead>
                      <tr style={{ background:"#f8fafc" }}>
                        {["#","Employee","Department","Status","Joined","Points","Actions"].map(h => (
                          <th key={h} style={{ padding:"12px 16px", textAlign:"left", fontWeight:700, color:"#374151", borderBottom:"2px solid #e5e7eb", whiteSpace:"nowrap" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {members.map((m,i) => {
                        const st  = MEMBER_STATUS[m.status];
                        const pts = pointsLog.filter(p =>
                          (p.employee_id?._id||p.employee_id)===(m.employee_id?._id||m.employee_id)
                        ).reduce((s,p)=>s+(p.points||0),0);
                        return (
                          <tr key={m._id} style={{ borderBottom:"1px solid #f3f4f6", background:i%2===0?"#fff":"#fafafa" }}>
                            <td style={{ padding:"12px 16px", color:"#9ca3af", fontWeight:600 }}>{i+1}</td>
                            <td style={{ padding:"12px 16px" }}>
                              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                                <div style={{ width:32, height:32, borderRadius:"50%", background:cfg.bg, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, color:cfg.color, fontSize:12 }}>
                                  {m.employee_id?.name?.charAt(0)||"?"}
                                </div>
                                <div>
                                  <p style={{ margin:0, fontWeight:700, color:"#1a1a2e" }}>{m.employee_id?.name||"—"}</p>
                                  <p style={{ margin:0, fontSize:11, color:"#9ca3af" }}>{m.employee_id?.email||""}</p>
                                </div>
                              </div>
                            </td>
                            <td style={{ padding:"12px 16px", color:"#374151" }}>{m.employee_id?.department||"—"}</td>
                            <td style={{ padding:"12px 16px" }}>
                              <span style={{ background:st.bg, color:st.color, padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:700 }}>{st.label}</span>
                            </td>
                            <td style={{ padding:"12px 16px", color:"#6b7280", fontSize:12 }}>
                              {m.joined_at ? new Date(m.joined_at).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}) : "—"}
                            </td>
                            <td style={{ padding:"12px 16px", fontWeight:700, color:cfg.color }}>{pts} pts</td>
                            <td style={{ padding:"12px 16px" }}>
                              <div style={{ display:"flex", gap:5 }}>
                                {m.status==="pending" && (
                                  <>
                                    <button onClick={() => handleMemberStatus(m._id,"approved")} style={{ padding:"4px 10px", background:"#ecfdf5", border:"1px solid #6ee7b7", borderRadius:6, color:"#10b981", fontSize:11, fontWeight:600, cursor:"pointer" }}>Approve</button>
                                    <button onClick={() => handleMemberStatus(m._id,"rejected")} style={{ padding:"4px 10px", background:"#fef2f2", border:"1px solid #fecaca", borderRadius:6, color:"#ef4444", fontSize:11, fontWeight:600, cursor:"pointer" }}>Reject</button>
                                  </>
                                )}
                                <button onClick={() => { setDeleteId(m._id); setDeleteType("member"); }} style={{ padding:"4px 10px", background:"#fef2f2", border:"1px solid #fecaca", borderRadius:6, color:"#ef4444", fontSize:11, fontWeight:600, cursor:"pointer" }}>Remove</button>
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
          )}

          {/* ── EVENTS TAB ── */}
          {activeTab === "events" && (
            <>
              {showEventForm && (
                <div style={{ background:"#fff", borderRadius:14, border:"1px solid #e5e7eb", marginBottom:20, overflow:"hidden" }}>
                  <div style={{ background:"#1a1a2e", padding:"14px 20px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <span style={{ color:"#fff", fontWeight:700, fontSize:14 }}>{editEvent ? "Edit Event" : "Create New Event"}</span>
                    <button onClick={() => { setShowEventForm(false); setEditEvent(null); }} style={{ background:"rgba(255,255,255,.1)", border:"none", borderRadius:6, padding:"4px 10px", color:"#d1d5db", cursor:"pointer" }}>✕</button>
                  </div>
                  <div style={{ padding:20 }}>
                    <div className="cc-form-grid" style={{ display:"grid", gap:14, marginBottom:14 }}>
                      <div><label style={lbl}>Title *</label><input style={inp} value={eventForm.title} onChange={e=>setEventForm(f=>({...f,title:e.target.value}))} placeholder="Event title"/></div>
                      <div><label style={lbl}>Date</label><input type="date" style={inp} value={eventForm.date} onChange={e=>setEventForm(f=>({...f,date:e.target.value}))}/></div>
                      <div><label style={lbl}>Venue</label><input style={inp} value={eventForm.venue} onChange={e=>setEventForm(f=>({...f,venue:e.target.value}))} placeholder="e.g. Conference Hall"/></div>
                      <div><label style={lbl}>Points Awarded</label><input type="number" style={inp} value={eventForm.points_awarded} onChange={e=>setEventForm(f=>({...f,points_awarded:Number(e.target.value)}))}/></div>
                      <div><label style={lbl}>Max Participants</label><input type="number" style={inp} value={eventForm.max_participants} onChange={e=>setEventForm(f=>({...f,max_participants:e.target.value}))} placeholder="Leave blank for unlimited"/></div>
                      <div><label style={lbl}>Status</label>
                        <select style={inp} value={eventForm.status} onChange={e=>setEventForm(f=>({...f,status:e.target.value}))}>
                          {Object.entries(EVENT_STATUS).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
                        </select>
                      </div>
                    </div>
                    <div style={{ marginBottom:16 }}>
                      <label style={lbl}>Description</label>
                      <textarea style={{...inp,minHeight:60,resize:"vertical"}} value={eventForm.description} onChange={e=>setEventForm(f=>({...f,description:e.target.value}))} placeholder="Event details..."/>
                    </div>
                    <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
                      <button onClick={() => { setShowEventForm(false); setEditEvent(null); }} style={{ padding:"9px 20px", border:"1px solid #e5e7eb", borderRadius:8, background:"#fff", color:"#374151", fontWeight:600, cursor:"pointer" }}>Cancel</button>
                      <button onClick={handleSaveEvent} disabled={saving} style={{ padding:"9px 24px", border:"none", borderRadius:8, background:saving?"#93c5fd":cfg.color, color:"#fff", fontWeight:700, cursor:saving?"not-allowed":"pointer" }}>
                        {saving ? "Saving..." : editEvent ? "Update Event" : "Create Event"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div style={{ background:"#fff", borderRadius:14, border:"1px solid #e5e7eb", overflow:"hidden" }}>
                <div style={{ padding:"14px 20px", borderBottom:"1px solid #f3f4f6", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <h3 style={{ margin:0, fontSize:14, fontWeight:700, color:"#1a1a2e" }}>All Events ({events.length})</h3>
                  {!showEventForm && (
                    <button onClick={openCreateEvent} style={{ display:"flex", alignItems:"center", gap:5, padding:"8px 16px", background:cfg.color, border:"none", borderRadius:8, color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer" }}>
                      <Plus size={13}/> Create Event
                    </button>
                  )}
                </div>
                {events.length===0 ? (
                  <p style={{ textAlign:"center", color:"#9ca3af", padding:"40px 0", fontSize:13 }}>No events yet. Create one!</p>
                ) : (
                  <div style={{ overflowX:"auto" }}>
                    <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                      <thead>
                        <tr style={{ background:"#f8fafc" }}>
                          {["Title","Date","Venue","Points","Participants","Status","Actions"].map(h=>(
                            <th key={h} style={{ padding:"12px 16px", textAlign:"left", fontWeight:700, color:"#374151", borderBottom:"2px solid #e5e7eb", whiteSpace:"nowrap" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {events.map((ev,i) => {
                          const st = EVENT_STATUS[ev.status];
                          return (
                            <tr key={ev._id} style={{ borderBottom:"1px solid #f3f4f6", background:i%2===0?"#fff":"#fafafa" }}>
                              <td style={{ padding:"12px 16px", fontWeight:700, color:"#1a1a2e" }}>{ev.title}</td>
                              <td style={{ padding:"12px 16px", color:"#6b7280" }}>{ev.date ? new Date(ev.date).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}) : "TBD"}</td>
                              <td style={{ padding:"12px 16px", color:"#374151" }}>{ev.venue||"—"}</td>
                              <td style={{ padding:"12px 16px", fontWeight:700, color:cfg.color }}>+{ev.points_awarded}</td>
                              <td style={{ padding:"12px 16px", color:"#374151" }}>{ev.max_participants||"Unlimited"}</td>
                              <td style={{ padding:"12px 16px" }}>
                                <select value={ev.status} onChange={e=>handleEventStatus(ev._id,e.target.value)}
                                  style={{ padding:"4px 8px", border:`1px solid ${st.color}44`, borderRadius:6, background:st.bg, color:st.color, fontSize:11, fontWeight:700, cursor:"pointer", outline:"none" }}>
                                  {Object.entries(EVENT_STATUS).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
                                </select>
                              </td>
                              <td style={{ padding:"12px 16px" }}>
                                <div style={{ display:"flex", gap:5 }}>
                                  <button onClick={() => openEditEvent(ev)} style={{ padding:"4px 10px", background:"#eff6ff", border:"1px solid #bfdbfe", borderRadius:6, color:"#2563eb", fontSize:11, fontWeight:600, cursor:"pointer" }}>Edit</button>
                                  <button onClick={() => { setDeleteId(ev._id); setDeleteType("event"); }} style={{ padding:"4px 10px", background:"#fef2f2", border:"1px solid #fecaca", borderRadius:6, color:"#ef4444", fontSize:11, fontWeight:600, cursor:"pointer" }}>Delete</button>
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
            </>
          )}

          {/* ── POINTS TAB ── */}
          {activeTab === "points" && (
            <>
              {showPointsForm && (
                <div style={{ background:"#fff", borderRadius:14, border:"1px solid #e5e7eb", marginBottom:20, overflow:"hidden" }}>
                  <div style={{ background:"#1a1a2e", padding:"14px 20px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <span style={{ color:"#fff", fontWeight:700, fontSize:14 }}>⭐ Award Points</span>
                    <button onClick={() => setShowPointsForm(false)} style={{ background:"rgba(255,255,255,.1)", border:"none", borderRadius:6, padding:"4px 10px", color:"#d1d5db", cursor:"pointer" }}>✕</button>
                  </div>
                  <div style={{ padding:20 }}>
                    <div className="cc-form-grid" style={{ display:"grid", gap:14, marginBottom:14 }}>
                      <div>
                        <label style={lbl}>Employee * (Approved Members Only)</label>
                        <select style={inp} value={pointsForm.employee_id} onChange={e=>setPointsForm(f=>({...f,employee_id:e.target.value}))}>
                          <option value="">-- Select Employee --</option>
                          {approved.map(m => (
                            <option key={m.employee_id?._id} value={m.employee_id?._id}>
                              {m.employee_id?.name} — {m.employee_id?.department}
                            </option>
                          ))}
                        </select>
                        <p style={{ margin:"4px 0 0", fontSize:11, color:"#9ca3af" }}>Only approved club members shown</p>
                      </div>
                      <div>
                        <label style={lbl}>Activity Type</label>
                        <select style={inp} value={pointsForm.activity_type} onChange={e=>setPointsForm(f=>({...f,activity_type:e.target.value}))}>
                          {["Event Participation","Event Win","Volunteering","Content Creation","Attendance","Special Recognition"].map(a=><option key={a} value={a}>{a}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={lbl}>Points *</label>
                        <input type="number" style={inp} value={pointsForm.points} onChange={e=>setPointsForm(f=>({...f,points:Number(e.target.value)}))} min="1"/>
                      </div>
                      <div>
                        <label style={lbl}>Reason</label>
                        <input style={inp} value={pointsForm.reason} onChange={e=>setPointsForm(f=>({...f,reason:e.target.value}))} placeholder="e.g. Won Hackathon 2026"/>
                      </div>
                    </div>
                    <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
                      <button onClick={() => setShowPointsForm(false)} style={{ padding:"9px 20px", border:"1px solid #e5e7eb", borderRadius:8, background:"#fff", color:"#374151", fontWeight:600, cursor:"pointer" }}>Cancel</button>
                      <button onClick={handleAwardPoints} disabled={saving} style={{ padding:"9px 24px", border:"none", borderRadius:8, background:saving?"#93c5fd":cfg.color, color:"#fff", fontWeight:700, cursor:saving?"not-allowed":"pointer" }}>
                        {saving ? "Awarding..." : "Award Points ⭐"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div style={{ background:"#fff", borderRadius:14, border:"1px solid #e5e7eb", overflow:"hidden" }}>
                <div style={{ padding:"14px 20px", borderBottom:"1px solid #f3f4f6", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <h3 style={{ margin:0, fontSize:14, fontWeight:700, color:"#1a1a2e" }}>Points Log ({pointsLog.length})</h3>
                  {!showPointsForm && (
                    <button onClick={() => setShowPointsForm(true)} style={{ display:"flex", alignItems:"center", gap:5, padding:"8px 16px", background:cfg.color, border:"none", borderRadius:8, color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer" }}>
                      <Plus size={13}/> Award Points
                    </button>
                  )}
                </div>
                {pointsLog.length===0 ? (
                  <p style={{ textAlign:"center", color:"#9ca3af", padding:"40px 0", fontSize:13 }}>No points awarded yet</p>
                ) : (
                  <div style={{ overflowX:"auto" }}>
                    <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                      <thead>
                        <tr style={{ background:"#f8fafc" }}>
                          {["Employee","Activity","Points","Reason","Date","Action"].map(h=>(
                            <th key={h} style={{ padding:"12px 16px", textAlign:"left", fontWeight:700, color:"#374151", borderBottom:"2px solid #e5e7eb", whiteSpace:"nowrap" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {[...pointsLog].reverse().map((p,i) => (
                          <tr key={p._id} style={{ borderBottom:"1px solid #f3f4f6", background:i%2===0?"#fff":"#fafafa" }}>
                            <td style={{ padding:"12px 16px" }}>
                              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                                <div style={{ width:30, height:30, borderRadius:"50%", background:cfg.bg, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, color:cfg.color, fontSize:12 }}>
                                  {p.employee_id?.name?.charAt(0)||"?"}
                                </div>
                                <div>
                                  <p style={{ margin:0, fontWeight:700, color:"#1a1a2e" }}>{p.employee_id?.name||"—"}</p>
                                  <p style={{ margin:0, fontSize:11, color:"#9ca3af" }}>{p.employee_id?.department||""}</p>
                                </div>
                              </div>
                            </td>
                            <td style={{ padding:"12px 16px", color:"#374151" }}>{p.activity_type}</td>
                            <td style={{ padding:"12px 16px", fontWeight:900, color:cfg.color, fontSize:15 }}>+{p.points}</td>
                            <td style={{ padding:"12px 16px", color:"#6b7280" }}>{p.reason||"—"}</td>
                            <td style={{ padding:"12px 16px", color:"#6b7280", fontSize:12 }}>
                              {p.awarded_at ? new Date(p.awarded_at).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}) : "—"}
                            </td>
                            <td style={{ padding:"12px 16px" }}>
                              <button onClick={() => { setDeleteId(p._id); setDeleteType("points"); }} style={{ padding:"4px 10px", background:"#fef2f2", border:"1px solid #fecaca", borderRadius:6, color:"#ef4444", fontSize:11, fontWeight:600, cursor:"pointer" }}>Delete</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}