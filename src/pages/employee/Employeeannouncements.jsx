// EmployeeAnnouncements.jsx — Beautiful Employee Announcement Feed
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import EmployeeLayout from "./EmployeeLayout";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const TYPE_CONFIG = {
  general:     { color:"#6b7280", bg:"#f3f4f6", label:"General" },
  urgent:      { color:"#dc2626", bg:"#fef2f2", label:"Urgent",      glow:"rgba(220,38,38,0.15)" },
  event:       { color:"#7c3aed", bg:"#f5f3ff", label:"Event",       glow:"rgba(124,58,237,0.12)" },
  policy:      { color:"#0369a1", bg:"#f0f9ff", label:"Policy" },
  achievement: { color:"#d97706", bg:"#fffbeb", label:"Achievement",  glow:"rgba(217,119,6,0.12)" },
  holiday:     { color:"#16a34a", bg:"#f0fdf4", label:"Holiday",     glow:"rgba(22,163,74,0.12)" },
};

export default function EmployeeAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [unreadCount, setUnreadCount]     = useState(0);
  const [activeFilter, setActiveFilter]   = useState("all");
  const [expandedId, setExpandedId]       = useState(null);
  const [employee, setEmployee]           = useState(null);
  const [isMobile, setIsMobile]           = useState(window.innerWidth < 768);
  const observerRef                       = useRef(null);

  const employeeId = localStorage.getItem("employeeId");

  useEffect(() => {
    const r = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", r);
    return () => window.removeEventListener("resize", r);
  }, []);

  useEffect(() => {
    fetchEmployee();
    fetchAnnouncements();
  }, []);

  const fetchEmployee = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/employee/me/${employeeId}`);
      setEmployee(res.data);
    } catch {}
  };

  const fetchAnnouncements = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/announcements/employee/${employeeId}`);
      if (res.data.success) {
        setAnnouncements(res.data.data || []);
        setUnreadCount(res.data.unread_count || 0);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const markRead = async (id) => {
    const ann = announcements.find(a => a._id === id);
    if (!ann || ann.is_read) return;
    try {
      await axios.put(`${API_BASE}/api/announcements/${id}/read`, { employee_id: employeeId });
      setAnnouncements(prev => prev.map(a =>
        a._id === id ? { ...a, is_read: true, read_at: new Date().toISOString() } : a
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {}
  };

  const handleExpand = (id) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      markRead(id);
    }
  };

  const markAllRead = async () => {
    const unread = announcements.filter(a => !a.is_read);
    for (const a of unread) {
      try {
        await axios.put(`${API_BASE}/api/announcements/${a._id}/read`, { employee_id: employeeId });
      } catch {}
    }
    setAnnouncements(prev => prev.map(a => ({ ...a, is_read: true })));
    setUnreadCount(0);
  };

  const fmtDate = (d) => {
    if (!d) return "";
    const date = new Date(d);
    const now   = new Date();
    const diff  = Math.floor((now - date) / 1000);
    if (diff < 60)     return "Just now";
    if (diff < 3600)   return `${Math.floor(diff/60)}m ago`;
    if (diff < 86400)  return `${Math.floor(diff/3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff/86400)}d ago`;
    return date.toLocaleDateString("en-IN", { day:"numeric", month:"short" });
  };

  const filtered = activeFilter === "all"
    ? announcements
    : activeFilter === "unread"
    ? announcements.filter(a => !a.is_read)
    : announcements.filter(a => a.type === activeFilter);

  const pinned  = filtered.filter(a => a.is_pinned);
  const regular = filtered.filter(a => !a.is_pinned);

  return (
    <EmployeeLayout>
      <style>{`
        @keyframes slideDown { from { opacity:0; transform:translateY(-12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn    { from { opacity:0; } to { opacity:1; } }
        @keyframes shimmer   { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        @keyframes urgentPulse { 0%,100%{box-shadow:0 0 0 0 rgba(220,38,38,0.4)} 50%{box-shadow:0 0 0 8px rgba(220,38,38,0)} }
        @keyframes badgePop  { 0%{transform:scale(0)} 70%{transform:scale(1.15)} 100%{transform:scale(1)} }

        .ann-item {
          transition: all 0.25s cubic-bezier(0.4,0,0.2,1);
          cursor: pointer;
        }
        .ann-item:hover { transform: translateX(3px); }
        .ann-item.urgent-item { animation: urgentPulse 2.5s infinite; }
        .unread-dot { animation: badgePop 0.4s cubic-bezier(0.34,1.56,0.64,1); }
        .filter-btn { transition: all 0.15s; cursor: pointer; white-space: nowrap; }
        .filter-btn:hover { transform: translateY(-1px); }
        .shimmer-line {
          background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          border-radius: 6px;
        }
        .content-expand {
          animation: slideDown 0.25s ease;
          overflow: hidden;
        }
        .read-badge {
          transition: all 0.3s;
        }
      `}</style>

      {/* Sticky Header */}
      <header style={{ background:"#fff", borderBottom:"1px solid #e5e7eb", padding: isMobile?"14px 16px":"16px 28px", position:"sticky", top:0, zIndex:50, boxShadow:"0 2px 8px rgba(0,0,0,0.06)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:12 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ position:"relative" }}>
              <div style={{ width:42, height:42, borderRadius:12, background:"linear-gradient(135deg,#2563eb,#7c3aed)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, color:"#fff", fontWeight:800 }}>
                A
              </div>
              {unreadCount > 0 && (
                <div className="unread-dot" style={{ position:"absolute", top:-5, right:-5, background:"#dc2626", color:"#fff", borderRadius:"50%", minWidth:20, height:20, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:800, border:"2px solid #fff", padding:"0 4px" }}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </div>
              )}
            </div>
            <div>
              <h1 style={{ margin:0, fontSize: isMobile?16:19, fontWeight:800, color:"#1a1a2e" }}>Announcements</h1>
              <p style={{ margin:0, fontSize:12, color:"#6b7280" }}>
                {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
              </p>
            </div>
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllRead}
              style={{ background:"#eff6ff", color:"#2563eb", border:"1.5px solid #bfdbfe", borderRadius:8, padding:"8px 14px", fontWeight:700, fontSize:12, cursor:"pointer" }}>
              Mark all read
            </button>
          )}
        </div>
      </header>

      <div style={{ padding: isMobile?"12px":"24px 28px", background:"#f4f6fb", minHeight:"100vh" }}>

        {/* Filter Bar */}
        <div style={{ display:"flex", gap:8, marginBottom:20, overflowX:"auto", paddingBottom:4, scrollbarWidth:"none" }}>
          {[
            { id:"all",         label:`All (${announcements.length})` },
            { id:"unread",      label:`Unread (${unreadCount})` },
            { id:"urgent",      label:"Urgent" },
            { id:"event",       label:"Events" },
            { id:"achievement", label:"Wins" },
            { id:"holiday",     label:"Holiday" },
            { id:"policy",      label:"Policy" },
          ].map(f => (
            <button key={f.id} className="filter-btn" onClick={() => setActiveFilter(f.id)}
              style={{ padding:"8px 14px", borderRadius:99, fontSize:12, fontWeight:700, border:`1.5px solid ${activeFilter===f.id?"#2563eb":"#e5e7eb"}`, background: activeFilter===f.id?"#2563eb":"#fff", color: activeFilter===f.id?"#fff":"#6b7280", display:"flex", alignItems:"center", gap:5, flexShrink:0 }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Loading Skeleton */}
        {loading && (
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {[1,2,3].map(i => (
              <div key={i} style={{ background:"#fff", borderRadius:14, padding:20, border:"1px solid #e5e7eb" }}>
                <div style={{ display:"flex", gap:14, alignItems:"flex-start" }}>
                  <div className="shimmer-line" style={{ width:44,height:44,borderRadius:12,flexShrink:0 }}/>
                  <div style={{ flex:1 }}>
                    <div className="shimmer-line" style={{ height:16,width:"70%",marginBottom:8 }}/>
                    <div className="shimmer-line" style={{ height:12,width:"45%",marginBottom:12 }}/>
                    <div className="shimmer-line" style={{ height:12,width:"90%" }}/>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div style={{ background:"#fff", borderRadius:16, padding:"60px 20px", textAlign:"center", border:"1px solid #e5e7eb" }}>
            <h3 style={{ color:"#1f2937", marginBottom:8 }}>
              {activeFilter==="unread" ? "All caught up!" : "No announcements"}
            </h3>
            <p style={{ color:"#6b7280", fontSize:14 }}>
              {activeFilter==="unread" ? "You've read all announcements." : "No announcements in this category yet."}
            </p>
          </div>
        )}

        {/* Pinned Section */}
        {!loading && pinned.length > 0 && (
          <div style={{ marginBottom:20 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
              <span style={{ fontSize:13, fontWeight:800, color:"#2563eb", textTransform:"uppercase", letterSpacing:"0.5px" }}>Pinned</span>
              <div style={{ flex:1, height:1, background:"#bfdbfe" }}/>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {pinned.map(a => (
                <AnnouncementCard key={a._id} ann={a} expanded={expandedId===a._id}
                  onExpand={handleExpand} fmtDate={fmtDate} isMobile={isMobile}/>
              ))}
            </div>
          </div>
        )}

        {/* Regular Announcements */}
        {!loading && regular.length > 0 && (
          <div>
            {pinned.length > 0 && (
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
                <span style={{ fontSize:13, fontWeight:800, color:"#6b7280", textTransform:"uppercase", letterSpacing:"0.5px" }}>Latest</span>
                <div style={{ flex:1, height:1, background:"#e5e7eb" }}/>
              </div>
            )}
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {regular.map(a => (
                <AnnouncementCard key={a._id} ann={a} expanded={expandedId===a._id}
                  onExpand={handleExpand} fmtDate={fmtDate} isMobile={isMobile}/>
              ))}
            </div>
          </div>
        )}
      </div>
    </EmployeeLayout>
  );
}

/* -- Single Announcement Card -- */
function AnnouncementCard({ ann, expanded, onExpand, fmtDate, isMobile }) {
  const cfg = TYPE_CONFIG[ann.type] || TYPE_CONFIG.general;

  return (
    <div
      className={`ann-item${ann.type==="urgent" && !ann.is_read ? " urgent-item" : ""}`}
      onClick={() => onExpand(ann._id)}
      style={{
        background: "#fff",
        borderRadius: 14,
        border: `1.5px solid ${ann.is_pinned ? "#2563eb44" : ann.is_read ? "#e5e7eb" : cfg.color+"44"}`,
        boxShadow: expanded
          ? `0 8px 24px ${cfg.glow || "rgba(0,0,0,0.08)"}`
          : ann.is_read ? "none" : `0 2px 8px ${cfg.glow || "rgba(0,0,0,0.06)"}`,
        overflow: "hidden",
        animation: "fadeIn 0.3s ease",
      }}
    >
      {/* Unread accent line */}
      {!ann.is_read && (
        <div style={{ height: 3, background: `linear-gradient(90deg, ${cfg.color}, ${cfg.color}88)` }}/>
      )}

      <div style={{ padding: isMobile ? "14px" : "18px 20px" }}>
        <div style={{ display:"flex", gap: isMobile?10:14, alignItems:"flex-start" }}>

          {/* Icon */}
          <div style={{
            width: isMobile?40:48, height: isMobile?40:48, borderRadius:12,
            background: cfg.bg, display:"flex", alignItems:"center", justifyContent:"center",
            fontSize: isMobile?13:14, fontWeight:800, color: cfg.color, flexShrink:0,
            boxShadow: `0 2px 8px ${cfg.glow||"rgba(0,0,0,0.08)"}`,
            border: `1px solid ${cfg.color}22`,
            textTransform: "uppercase",
          }}>
            {cfg.label.slice(0, 2)}
          </div>

          {/* Content */}
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8, marginBottom:4 }}>
              <div style={{ flex:1, minWidth:0 }}>
                {/* Type + Priority badges */}
                <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginBottom:5 }}>
                  <span style={{ fontSize:10, fontWeight:700, background:cfg.bg, color:cfg.color, padding:"2px 8px", borderRadius:99, border:`1px solid ${cfg.color}33` }}>
                    {cfg.label}
                  </span>
                  {ann.priority === "high" && (
                    <span style={{ fontSize:10, fontWeight:700, background:"#fef2f2", color:"#dc2626", padding:"2px 8px", borderRadius:99 }}>
                      High Priority
                    </span>
                  )}
                  {ann.is_pinned && (
                    <span style={{ fontSize:10, fontWeight:700, background:"#eff6ff", color:"#2563eb", padding:"2px 8px", borderRadius:99 }}>
                      Pinned
                    </span>
                  )}
                </div>

                <h3 style={{ margin:0, fontSize: isMobile?14:15, fontWeight:800, color:"#1a1a2e", lineHeight:1.3 }}>
                  {ann.title}
                </h3>
              </div>

              {/* Read status + time */}
              <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4, flexShrink:0 }}>
                <span className="read-badge" style={{
                  fontSize:10, fontWeight:700, padding:"3px 9px", borderRadius:99,
                  background: ann.is_read ? "#f0fdf4" : cfg.bg,
                  color: ann.is_read ? "#16a34a" : cfg.color,
                  border: `1px solid ${ann.is_read?"#bbf7d0":cfg.color+"44"}`
                }}>
                  {ann.is_read ? "Read" : "New"}
                </span>
                <span style={{ fontSize:11, color:"#9ca3af" }}>{fmtDate(ann.createdAt)}</span>
              </div>
            </div>

            {/* Preview text (collapsed) */}
            {!expanded && (
              <p style={{ margin:0, fontSize:13, color:"#6b7280", lineHeight:1.6, overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>
                {ann.content}
              </p>
            )}

            {/* Posted by */}
            <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:6 }}>
              <div style={{ width:18, height:18, borderRadius:"50%", background:cfg.color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, color:"#fff", fontWeight:800 }}>
                {ann.created_by?.name?.charAt(0) || "H"}
              </div>
              <span style={{ fontSize:11, color:"#9ca3af" }}>
                {ann.created_by?.name || "HR Team"} · {ann.created_by?.designation || "HR"}
              </span>
            </div>
          </div>
        </div>

        {/* Expanded content */}
        {expanded && (
          <div className="content-expand" style={{ marginTop:16, paddingTop:16, borderTop:`1px solid ${cfg.color}22` }}>
            {/* Full content */}
            <div style={{ background:cfg.bg, borderRadius:10, padding:"14px 16px", marginBottom:14, borderLeft:`3px solid ${cfg.color}` }}>
              <p style={{ margin:0, fontSize:14, color:"#1f2937", lineHeight:1.8, whiteSpace:"pre-wrap", wordBreak:"break-word" }}>
                {ann.content}
              </p>
            </div>

            {/* Attachments */}
            {ann.attachments?.length > 0 && (
              <div style={{ marginBottom:12 }}>
                <p style={{ margin:"0 0 8px", fontSize:12, fontWeight:700, color:"#374151" }}>Attachments</p>
                <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                  {ann.attachments.map((att, i) => (
                    <a key={i} href={att.url} target="_blank" rel="noreferrer"
                      style={{ padding:"6px 14px", background:"#eff6ff", border:"1px solid #bfdbfe", borderRadius:8, fontSize:12, fontWeight:600, color:"#2563eb", textDecoration:"none" }}>
                      {att.name}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Meta footer */}
            <div style={{ display:"flex", justifyContent:"space-between", flexWrap:"wrap", gap:8 }}>
              <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
                <span style={{ fontSize:12, color:"#9ca3af" }}>
                  {new Date(ann.createdAt).toLocaleDateString("en-IN", { day:"numeric", month:"long", year:"numeric" })}
                </span>
                {ann.expires_at && (
                  <span style={{ fontSize:12, color:"#f59e0b" }}>
                    Expires {new Date(ann.expires_at).toLocaleDateString("en-IN", { day:"numeric", month:"short" })}
                  </span>
                )}
              </div>
              {ann.is_read && ann.read_at && (
                <span style={{ fontSize:11, color:"#16a34a", fontWeight:600 }}>
                  You read this {fmtDate(ann.read_at)}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Expand/collapse hint */}
        <div style={{ display:"flex", justifyContent:"center", marginTop:8 }}>
          <div style={{ fontSize:11, color: cfg.color, fontWeight:600, display:"flex", alignItems:"center", gap:3, opacity:0.7 }}>
            {expanded ? "Show less" : "Read more"}
          </div>
        </div>
      </div>
    </div>
  );
}