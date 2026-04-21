import { useState, useEffect } from "react";
import axios from "axios";
import {
  Cpu, Dumbbell, Palette, Users, Calendar, Star, X,
  Check, CheckCircle2, XCircle, Clock, Info,
  UserPlus, UserMinus, BarChart2, Sparkles, CalendarDays,
  RefreshCw
} from "lucide-react";
import EmployeeLayout from "./EmployeeLayout";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const CLUB_CONFIG = {
  tech: {
    key: "tech", label: "Tech Club", sublabel: "Innovation & Learning",
    icon: <Cpu size={22}/>, iconSm: <Cpu size={15}/>,
    color: "#3b82f6", bg: "#eff6ff", border: "#bfdbfe",
    desc: "Explore emerging technologies, share ideas, and develop innovative internal projects alongside fellow tech enthusiasts.",
    activities: ["Tech Talk Thursdays","Internal Hackathons","Coding Challenges","Product Brainstorming","Learning Sessions"],
    owner: "Tech Evangelist (Senior Team)",
    highlight: "Monthly Tech Talk Thursdays + Annual Hackathon",
  },
  fitness: {
    key: "fitness", label: "Fitness Club", sublabel: "Health & Wellness",
    icon: <Dumbbell size={22}/>, iconSm: <Dumbbell size={15}/>,
    color: "#10b981", bg: "#ecfdf5", border: "#6ee7b7",
    desc: "Promote physical and mental well-being through group fitness, wellness challenges, and health initiatives.",
    activities: ["Morning Yoga","Zumba Sessions","Step Count Challenge","Cycling Challenge","Radnus Fit Week","Gym Collaboration"],
    owner: "Employee Wellness Coordinator (HR)",
    highlight: "Weekly Yoga/Zumba + Annual Radnus Fit Week",
  },
  creativity: {
    key: "creativity", label: "Creativity Club", sublabel: "Art, Music & Culture",
    icon: <Palette size={22}/>, iconSm: <Palette size={15}/>,
    color: "#8b5cf6", bg: "#f5f3ff", border: "#ddd6fe",
    desc: "Express yourself through arts, music, and creative outlets. Boost morale and reduce stress through creative activities.",
    activities: ["Creative Hour (Open Mic)","Art Display","Music Jam","Office Décor Contest","Cultural Celebration","Employee Magazine","Radnus Fest"],
    owner: "Culture & Engagement Dept (HR)",
    highlight: "Monthly Creative Hour + Radnus Fest",
  },
};

const EVENT_STATUS = {
  upcoming:  { label: "Upcoming",  color: "#3b82f6", bg: "#eff6ff" },
  ongoing:   { label: "Ongoing",   color: "#f59e0b", bg: "#fffbeb" },
  completed: { label: "Completed", color: "#10b981", bg: "#ecfdf5" },
  cancelled: { label: "Cancelled", color: "#ef4444", bg: "#fef2f2" },
};

export default function MyClubs() {
  // ✅ FIX: support both key names — "employeeId" (main app) and "employee_id" (legacy)
  const employeeId =
    localStorage.getItem("employeeId") ||
    localStorage.getItem("employee_id") || "";

  const [employee,      setEmployee]      = useState(null);
  const [myMemberships, setMyMemberships] = useState({});
  const [allEvents,     setAllEvents]     = useState({});
  const [myPoints,      setMyPoints]      = useState({});
  const [loading,       setLoading]       = useState(true);
  const [refreshing,    setRefreshing]    = useState(false);
  const [activeClub,    setActiveClub]    = useState(null);
  const [joiningClub,   setJoiningClub]   = useState(null);
  const [toast,         setToast]         = useState(null);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const empRes = await axios.get(`${API_BASE}/api/employee/me/${employeeId}`).catch(() => ({ data: null }));
      if (empRes.data) setEmployee(empRes.data);

      const clubKeys = Object.keys(CLUB_CONFIG);

      const results = await Promise.all(
        clubKeys.map(key => Promise.all([
          // ✅ FIX: membership check — pass employeeId correctly
          axios.get(`${API_BASE}/api/clubs/${key}/my-membership?employee_id=${employeeId}`)
            .catch(() => ({ data: { data: null } })),

          // ✅ Events — same endpoint HR uses, all employees can see
          axios.get(`${API_BASE}/api/clubs/${key}/events`)
            .catch(() => ({ data: { data: [] } })),

          // ✅ FIX: points — filter by this employee on backend
          axios.get(`${API_BASE}/api/clubs/${key}/points/my?employee_id=${employeeId}`)
            .catch(() => ({ data: { data: [] } })),
        ]))
      );

      const memberships = {}, events = {}, points = {};
      clubKeys.forEach((key, i) => {
        memberships[key] = results[i][0].data.data;
        events[key]      = results[i][1].data.data || [];
        points[key]      = results[i][2].data.data || [];
      });

      setMyMemberships(memberships);
      setAllEvents(events);
      setMyPoints(points);
    } catch { showMsg("Failed to load clubs", "error"); }
    finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const showMsg = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleJoin = async (clubKey) => {
    if (!employeeId) return showMsg("Session expired. Please login again.", "error");
    setJoiningClub(clubKey);
    try {
      await axios.post(`${API_BASE}/api/clubs/${clubKey}/members`, {
        employee_id: employeeId,
      });
      showMsg("Join request sent! Waiting for HR approval. 🎉");
      fetchAll(true);
    } catch (err) {
      showMsg(err?.response?.data?.message || "Failed to join", "error");
    } finally { setJoiningClub(null); }
  };

  const handleLeave = async (clubKey) => {
    if (!window.confirm(`Leave ${CLUB_CONFIG[clubKey].label}?`)) return;
    try {
      const mem = myMemberships[clubKey];
      await axios.delete(`${API_BASE}/api/clubs/${clubKey}/members/${mem._id}`);
      showMsg("You have left the club.");
      fetchAll(true);
    } catch { showMsg("Failed", "error"); }
  };

  const totalPoints      = Object.values(myPoints).reduce((s, arr) => s + arr.reduce((ss, p) => ss+(p.points||0), 0), 0);
  const activeClubsCount = Object.values(myMemberships).filter(m => m?.status === "approved").length;
  const pendingCount     = Object.values(myMemberships).filter(m => m?.status === "pending").length;

  // ✅ Show all upcoming/ongoing events regardless of membership
  const allUpcoming = Object.entries(allEvents)
    .flatMap(([key, evs]) =>
      evs.filter(e => e.status === "upcoming" || e.status === "ongoing")
         .map(e => ({ ...e, clubKey: key }))
    )
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  if (loading) return (
    <EmployeeLayout employee={null}>
      <div style={{ display:"flex", justifyContent:"center", alignItems:"center", height:"60vh" }}>
        <div style={{ textAlign:"center" }}>
          <div style={{ width:34, height:34, border:"3px solid #e5e7eb", borderTopColor:"#3b82f6", borderRadius:"50%", animation:"spin .8s linear infinite", margin:"0 auto 10px" }}/>
          <p style={{ color:"#9ca3af", fontSize:13 }}>Loading your clubs...</p>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      </div>
    </EmployeeLayout>
  );

  return (
    <EmployeeLayout employee={employee}>
      <div style={{ fontFamily:"'Segoe UI',sans-serif", minHeight:"100vh", background:"#f3f4f6" }}>
        <style>{`
          @keyframes spin{to{transform:rotate(360deg)}}
          @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
          .club-card{transition:box-shadow .2s,transform .15s}
          .club-card:hover{box-shadow:0 6px 20px rgba(0,0,0,.1)!important;transform:translateY(-2px)}
          .ev-row:hover{background:#f9fafb!important}
          @media(max-width:768px){
            .mc-stats{grid-template-columns:1fr 1fr!important}
            .mc-cards{grid-template-columns:1fr!important}
            .mc-detail-grid{grid-template-columns:1fr!important}
            .mc-header{padding:12px 14px!important}
            .mc-body{padding:14px!important}
          }
        `}</style>

        {/* Toast */}
        {toast && (
          <div style={{ position:"fixed", top:18, right:16, left:16, zIndex:9999, background:toast.type==="error"?"#ef4444":"#10b981", color:"#fff", padding:"11px 16px", borderRadius:9, fontWeight:600, fontSize:13, boxShadow:"0 8px 24px rgba(0,0,0,.15)", display:"flex", alignItems:"center", gap:7, textAlign:"center", justifyContent:"center" }}>
            {toast.type==="error" ? <XCircle size={14}/> : <CheckCircle2 size={14}/>}{toast.msg}
          </div>
        )}

        {/* Header */}
        <div className="mc-header" style={{ background:"#fff", borderBottom:"1px solid #e5e7eb", padding:"15px 28px", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12, position:"sticky", top:0, zIndex:100 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:"linear-gradient(135deg,#3b82f6,#8b5cf6)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Sparkles size={18} color="#fff"/>
            </div>
            <div>
              <h1 style={{ margin:0, fontSize:17, fontWeight:800, color:"#111827" }}>My Corporate Clubs</h1>
              <p style={{ margin:0, fontSize:11, color:"#9ca3af" }}>Radnus Policy 3.32 · Explore, Join & Participate</p>
            </div>
          </div>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            {/* ✅ FIX: Manual refresh so employee can check if HR approved */}
            <button onClick={() => fetchAll(true)} disabled={refreshing}
              style={{ display:"flex", alignItems:"center", gap:5, padding:"7px 13px", background:"#f3f4f6", border:"1px solid #e5e7eb", borderRadius:8, color:"#6b7280", fontWeight:600, fontSize:12, cursor:"pointer" }}>
              <RefreshCw size={12} style={{ animation:refreshing?"spin .8s linear infinite":"none" }}/> {refreshing?"Refreshing...":"Refresh"}
            </button>
            {activeClub && (
              <button onClick={() => setActiveClub(null)} style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 14px", background:"#f3f4f6", border:"1px solid #e5e7eb", borderRadius:8, color:"#6b7280", fontWeight:600, fontSize:13, cursor:"pointer" }}>
                <X size={13}/> Back to All Clubs
              </button>
            )}
          </div>
        </div>

        <div className="mc-body" style={{ padding:"22px 28px", maxWidth:1200, margin:"0 auto" }}>

          {/* Stats */}
          <div className="mc-stats" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:20 }}>
            {[
              { label:"Clubs Joined",     value:activeClubsCount, icon:<Users size={17}/>,  color:"#3b82f6", bg:"#eff6ff" },
              { label:"My Total Points",  value:totalPoints,      icon:<Star size={17}/>,   color:"#f59e0b", bg:"#fffbeb" },
              { label:"Pending Requests", value:pendingCount,     icon:<Clock size={17}/>,  color:"#8b5cf6", bg:"#f5f3ff" },
            ].map((s,i) => (
              <div key={i} style={{ background:"#fff", borderRadius:12, padding:"15px 18px", border:"1px solid #e5e7eb", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div>
                  <p style={{ margin:"0 0 3px", fontSize:11, color:"#9ca3af", fontWeight:600, textTransform:"uppercase" }}>{s.label}</p>
                  <p style={{ margin:0, fontSize:26, fontWeight:900, color:s.color }}>{s.value}</p>
                </div>
                <div style={{ width:40, height:40, borderRadius:10, background:s.bg, display:"flex", alignItems:"center", justifyContent:"center", color:s.color }}>{s.icon}</div>
              </div>
            ))}
          </div>

          {/* ✅ FIX: Show pending approval notice so employee knows to wait */}
          {pendingCount > 0 && (
            <div style={{ background:"#fffbeb", borderRadius:10, border:"1px solid #fde68a", padding:"11px 15px", marginBottom:16, display:"flex", gap:9, alignItems:"center" }}>
              <Clock size={14} color="#f59e0b" style={{ flexShrink:0 }}/>
              <p style={{ margin:0, fontSize:12, color:"#92400e", lineHeight:1.5 }}>
                You have <strong>{pendingCount} pending club request{pendingCount>1?"s":""}</strong>. HR will review and approve shortly. Click <strong>Refresh</strong> to check the latest status.
              </p>
            </div>
          )}

          {/* Info Banner */}
          <div style={{ background:"#eff6ff", borderRadius:10, border:"1px solid #bfdbfe", padding:"11px 15px", marginBottom:20, display:"flex", gap:9, alignItems:"center" }}>
            <Info size={14} color="#3b82f6" style={{ flexShrink:0 }}/>
            <p style={{ margin:0, fontSize:12, color:"#1e40af", lineHeight:1.5 }}>
              <strong>Club participation points</strong> are linked to your Employee Engagement Score and count toward <strong>Awards & Recognition</strong> nominations.
            </p>
          </div>

          {/* ── OVERVIEW ── */}
          {!activeClub && (
            <>
              <div className="mc-cards" style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:16, marginBottom:24 }}>
                {Object.values(CLUB_CONFIG).map(cfg => {
                  const mem         = myMemberships[cfg.key];
                  const status      = mem?.status;
                  const myPts       = myPoints[cfg.key]?.reduce((s,p)=>s+(p.points||0),0) || 0;
                  const upcomingCnt = (allEvents[cfg.key]||[]).filter(e=>e.status==="upcoming"||e.status==="ongoing").length;

                  return (
                    <div key={cfg.key} className="club-card" style={{ background:"#fff", borderRadius:14, border:`1.5px solid ${status==="approved"?cfg.color+"44":"#e5e7eb"}`, overflow:"hidden", boxShadow:"0 2px 8px rgba(0,0,0,.06)" }}>
                      <div style={{ height:5, background:`linear-gradient(90deg,${cfg.color},${cfg.color}77)` }}/>
                      <div style={{ padding:"18px" }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:11 }}>
                            <div style={{ width:44, height:44, borderRadius:12, background:cfg.bg, display:"flex", alignItems:"center", justifyContent:"center", color:cfg.color, border:`1px solid ${cfg.border}` }}>
                              {cfg.icon}
                            </div>
                            <div>
                              <p style={{ margin:0, fontWeight:800, fontSize:15, color:"#111827" }}>{cfg.label}</p>
                              <p style={{ margin:0, fontSize:11, color:"#9ca3af" }}>{cfg.sublabel}</p>
                            </div>
                          </div>
                          {/* ✅ Status badges */}
                          {status==="approved" && <span style={{ background:cfg.bg, color:cfg.color, padding:"4px 10px", borderRadius:20, fontSize:11, fontWeight:700, border:`1px solid ${cfg.border}`, display:"flex", alignItems:"center", gap:4, flexShrink:0 }}><Check size={11}/>Joined</span>}
                          {status==="pending"  && <span style={{ background:"#fffbeb", color:"#92400e", padding:"4px 10px", borderRadius:20, fontSize:11, fontWeight:700, border:"1px solid #fde68a", display:"flex", alignItems:"center", gap:4, flexShrink:0 }}><Clock size={11}/>Pending</span>}
                          {status==="rejected" && <span style={{ background:"#fef2f2", color:"#dc2626", padding:"4px 10px", borderRadius:20, fontSize:11, fontWeight:700, border:"1px solid #fecaca", flexShrink:0 }}>Rejected</span>}
                        </div>

                        <p style={{ margin:"0 0 12px", fontSize:12, color:"#6b7280", lineHeight:1.6 }}>{cfg.desc}</p>

                        <div style={{ display:"flex", gap:8, marginBottom:12, flexWrap:"wrap" }}>
                          <span style={{ background:"#f3f4f6", color:"#374151", padding:"4px 10px", borderRadius:20, fontSize:11, fontWeight:600, display:"flex", alignItems:"center", gap:4 }}>
                            <Calendar size={11}/> {upcomingCnt} upcoming
                          </span>
                          {status==="approved" && (
                            <span style={{ background:cfg.bg, color:cfg.color, padding:"4px 10px", borderRadius:20, fontSize:11, fontWeight:700, border:`1px solid ${cfg.border}`, display:"flex", alignItems:"center", gap:4 }}>
                              <Star size={11}/> {myPts} pts earned
                            </span>
                          )}
                        </div>

                        <div style={{ background:"#f9fafb", borderRadius:8, padding:"8px 11px", marginBottom:14, borderLeft:`3px solid ${cfg.color}` }}>
                          <p style={{ margin:0, fontSize:11, color:"#6b7280", lineHeight:1.5 }}>{cfg.highlight}</p>
                        </div>

                        <div style={{ display:"flex", gap:8 }}>
                          <button onClick={() => setActiveClub(cfg.key)} style={{ flex:1, padding:"8px 12px", background:cfg.bg, border:`1px solid ${cfg.border}`, borderRadius:8, color:cfg.color, fontWeight:700, fontSize:12, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}>
                            <BarChart2 size={13}/> View Details
                          </button>
                          {/* ✅ FIX: only show Join if no membership record at all */}
                          {!status && (
                            <button onClick={() => handleJoin(cfg.key)} disabled={joiningClub===cfg.key}
                              style={{ flex:1, padding:"8px 12px", background:cfg.color, border:"none", borderRadius:8, color:"#fff", fontWeight:700, fontSize:12, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:5, opacity:joiningClub===cfg.key?.6:1 }}>
                              <UserPlus size={13}/> {joiningClub===cfg.key?"Joining...":"Join Club"}
                            </button>
                          )}
                          {status==="pending" && (
                            <button disabled style={{ flex:1, padding:"8px 12px", background:"#f9fafb", border:"1px solid #e5e7eb", borderRadius:8, color:"#9ca3af", fontWeight:600, fontSize:12, cursor:"not-allowed" }}>
                              Awaiting Approval
                            </button>
                          )}
                          {status==="rejected" && (
                            <button onClick={() => handleJoin(cfg.key)} style={{ flex:1, padding:"8px 12px", background:"#fff", border:`1px solid ${cfg.color}`, borderRadius:8, color:cfg.color, fontWeight:700, fontSize:12, cursor:"pointer" }}>
                              Request Again
                            </button>
                          )}
                          {status==="approved" && (
                            <button onClick={() => handleLeave(cfg.key)} style={{ padding:"8px 12px", background:"#fef2f2", border:"1px solid #fecaca", borderRadius:8, color:"#dc2626", fontWeight:600, fontSize:12, cursor:"pointer", display:"flex", alignItems:"center", gap:4 }}>
                              <UserMinus size={12}/> Leave
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* All Upcoming Events */}
              {allUpcoming.length > 0 && (
                <div style={{ background:"#fff", borderRadius:12, border:"1px solid #e5e7eb", padding:"18px 20px" }}>
                  <p style={{ margin:"0 0 14px", fontWeight:800, fontSize:14, color:"#111827", display:"flex", alignItems:"center", gap:7 }}>
                    <Calendar size={15} color="#8b5cf6"/> All Upcoming Events
                  </p>
                  <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                    {allUpcoming.slice(0,8).map(ev => {
                      const cfg      = CLUB_CONFIG[ev.clubKey];
                      const st       = EVENT_STATUS[ev.status]||EVENT_STATUS.upcoming;
                      const isMember = myMemberships[ev.clubKey]?.status==="approved";
                      return (
                        <div key={ev._id} className="ev-row" style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 12px", borderRadius:9, border:"1px solid #f3f4f6", transition:"background .12s", flexWrap:"wrap" }}>
                          <div style={{ width:36, height:36, borderRadius:9, background:cfg.bg, display:"flex", alignItems:"center", justifyContent:"center", color:cfg.color, flexShrink:0, border:`1px solid ${cfg.border}` }}>
                            {cfg.iconSm}
                          </div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <p style={{ margin:0, fontWeight:700, fontSize:13, color:"#111827" }}>{ev.title}</p>
                            <p style={{ margin:0, fontSize:11, color:"#9ca3af" }}>
                              {cfg.label} · {ev.date ? new Date(ev.date).toLocaleDateString("en-IN",{day:"numeric",month:"short"}) : ""} · {ev.venue||"Venue TBD"}
                            </p>
                          </div>
                          <span style={{ background:st.bg, color:st.color, padding:"3px 8px", borderRadius:20, fontSize:11, fontWeight:700, flexShrink:0 }}>{st.label}</span>
                          <span style={{ background:cfg.bg, color:cfg.color, padding:"3px 9px", borderRadius:20, fontSize:11, fontWeight:700, flexShrink:0, border:`1px solid ${cfg.border}`, display:"flex", alignItems:"center", gap:3 }}>
                            <Star size={10}/>+{ev.points_awarded}
                          </span>
                          {/* ✅ Show join only if not a member yet */}
                          {!myMemberships[ev.clubKey] && (
                            <button onClick={() => handleJoin(ev.clubKey)} style={{ padding:"4px 10px", background:cfg.color, border:"none", borderRadius:7, color:"#fff", fontSize:11, fontWeight:700, cursor:"pointer", flexShrink:0 }}>Join</button>
                          )}
                          {myMemberships[ev.clubKey]?.status==="pending" && (
                            <span style={{ padding:"4px 10px", background:"#fffbeb", border:"1px solid #fde68a", borderRadius:7, color:"#92400e", fontSize:11, fontWeight:600, flexShrink:0 }}>Pending</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── DETAIL VIEW ── */}
          {activeClub && (() => {
            const cfg    = CLUB_CONFIG[activeClub];
            const mem    = myMemberships[activeClub];
            const status = mem?.status;
            const events = allEvents[activeClub] || [];
            const pts    = myPoints[activeClub] || [];
            const myTotal = pts.reduce((s,p) => s+(p.points||0), 0);

            return (
              <div>
                {/* Club Header */}
                <div style={{ background:"#fff", borderRadius:14, border:`1.5px solid ${cfg.border}`, padding:"20px", marginBottom:20, display:"flex", gap:16, alignItems:"flex-start", flexWrap:"wrap" }}>
                  <div style={{ width:56, height:56, borderRadius:14, background:cfg.bg, display:"flex", alignItems:"center", justifyContent:"center", color:cfg.color, border:`1.5px solid ${cfg.border}`, flexShrink:0 }}>
                    {cfg.icon}
                  </div>
                  <div style={{ flex:1, minWidth:200 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4, flexWrap:"wrap" }}>
                      <p style={{ margin:0, fontWeight:800, fontSize:18, color:"#111827" }}>{cfg.label}</p>
                      {status==="approved" && <span style={{ background:cfg.bg, color:cfg.color, padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:700, border:`1px solid ${cfg.border}`, display:"flex", alignItems:"center", gap:4 }}><Check size={11}/>Joined</span>}
                      {status==="pending"  && <span style={{ background:"#fffbeb", color:"#92400e", padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:700, border:"1px solid #fde68a", display:"flex", alignItems:"center", gap:4 }}><Clock size={11}/>Pending Approval</span>}
                      {status==="rejected" && <span style={{ background:"#fef2f2", color:"#dc2626", padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:700, border:"1px solid #fecaca" }}>Rejected</span>}
                    </div>
                    <p style={{ margin:"0 0 10px", fontSize:13, color:"#6b7280", lineHeight:1.6 }}>{cfg.desc}</p>
                    <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                      {cfg.activities.map(a => (
                        <span key={a} style={{ background:cfg.bg, color:cfg.color, padding:"3px 9px", borderRadius:20, fontSize:11, fontWeight:600, border:`1px solid ${cfg.border}` }}>{a}</span>
                      ))}
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:8, flexShrink:0 }}>
                    {!status && (
                      <button onClick={() => handleJoin(activeClub)} disabled={joiningClub===activeClub}
                        style={{ padding:"9px 18px", background:cfg.color, border:"none", borderRadius:9, color:"#fff", fontWeight:700, fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}>
                        <UserPlus size={14}/>{joiningClub===activeClub?"Joining...":"Join Club"}
                      </button>
                    )}
                    {status==="approved" && (
                      <button onClick={() => handleLeave(activeClub)} style={{ padding:"9px 14px", background:"#fef2f2", border:"1px solid #fecaca", borderRadius:9, color:"#dc2626", fontWeight:700, fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", gap:5 }}>
                        <UserMinus size={13}/>Leave
                      </button>
                    )}
                  </div>
                </div>

                <div className="mc-detail-grid" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                  {/* My Points */}
                  <div style={{ background:"#fff", borderRadius:12, border:"1px solid #e5e7eb", padding:"18px 20px" }}>
                    <p style={{ margin:"0 0 14px", fontWeight:800, fontSize:14, color:"#111827", display:"flex", alignItems:"center", gap:7 }}>
                      <Star size={15} color={cfg.color}/> My Participation Points
                    </p>
                    <div style={{ textAlign:"center", padding:"16px 0", borderBottom:"1px solid #f3f4f6", marginBottom:14 }}>
                      <p style={{ margin:0, fontSize:42, fontWeight:900, color:cfg.color }}>{myTotal}</p>
                      <p style={{ margin:0, fontSize:13, color:"#9ca3af" }}>total points earned</p>
                    </div>
                    {pts.length === 0 ? (
                      <div style={{ textAlign:"center", padding:"10px 0" }}>
                        <p style={{ color:"#9ca3af", fontSize:13 }}>
                          {status==="approved"
                            ? "Attend events to earn points!"
                            : status==="pending"
                              ? "Your join request is under review. Points will show once approved."
                              : "Join the club to start earning points!"}
                        </p>
                      </div>
                    ) : (
                      <div style={{ display:"flex", flexDirection:"column", gap:8, maxHeight:250, overflowY:"auto" }}>
                        {[...pts].reverse().map((p,i) => (
                          <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderBottom:"1px solid #f3f4f6" }}>
                            <div>
                              <p style={{ margin:0, fontSize:12, fontWeight:700, color:"#111827" }}>{p.activity_type}</p>
                              <p style={{ margin:0, fontSize:11, color:"#9ca3af" }}>{p.reason||""}</p>
                            </div>
                            <span style={{ fontWeight:800, color:cfg.color, fontSize:14 }}>+{p.points}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Events */}
                  <div style={{ background:"#fff", borderRadius:12, border:"1px solid #e5e7eb", padding:"18px 20px" }}>
                    <p style={{ margin:"0 0 14px", fontWeight:800, fontSize:14, color:"#111827", display:"flex", alignItems:"center", gap:7 }}>
                      <Calendar size={15} color="#8b5cf6"/> Events
                    </p>
                    {events.length === 0 ? (
                      <p style={{ color:"#9ca3af", fontSize:13, textAlign:"center", padding:"20px 0" }}>No events scheduled yet.</p>
                    ) : (
                      <div style={{ display:"flex", flexDirection:"column", gap:10, maxHeight:360, overflowY:"auto" }}>
                        {events.map(ev => {
                          const st = EVENT_STATUS[ev.status]||EVENT_STATUS.upcoming;
                          return (
                            <div key={ev._id} style={{ padding:"12px", background:"#f9fafb", borderRadius:10, border:"1px solid #e5e7eb" }}>
                              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6 }}>
                                <p style={{ margin:0, fontWeight:700, fontSize:13, color:"#111827", flex:1, marginRight:8 }}>{ev.title}</p>
                                <span style={{ background:st.bg, color:st.color, padding:"2px 8px", borderRadius:20, fontSize:10, fontWeight:700, flexShrink:0 }}>{st.label}</span>
                              </div>
                              <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                                <span style={{ fontSize:11, color:"#6b7280", display:"flex", alignItems:"center", gap:4 }}>
                                  <CalendarDays size={10}/>{ev.date ? new Date(ev.date).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}) : "TBD"}
                                </span>
                                {ev.venue && <span style={{ fontSize:11, color:"#6b7280" }}>{ev.venue}</span>}
                                <span style={{ fontSize:11, color:cfg.color, fontWeight:700, display:"flex", alignItems:"center", gap:3 }}>
                                  <Star size={10}/>+{ev.points_awarded} pts
                                </span>
                              </div>
                              {ev.description && <p style={{ margin:"6px 0 0", fontSize:11, color:"#9ca3af", lineHeight:1.4 }}>{ev.description}</p>}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </EmployeeLayout>
  );
}