// AwardsDashboard.jsx — Radnus Recognition & Awards
// Light theme matching app UI + Lucide icons (no emojis)

import { useState, useEffect, useMemo, useRef } from "react";
import axios from "axios";
import {
  Award, Star, Lightbulb, Plus, Download, Trophy,
  Zap, TrendingUp, Users, ChevronRight, X, Check,
  Flame, Crown, Medal, Gift, BarChart2, Clock,
  ThumbsUp, Heart, Sparkles, RefreshCw, Search,
  ArrowUpRight, CheckCircle2, XCircle, AlertCircle,
  Megaphone, UserCheck, Briefcase, Target, Layers,
  CircleDot, BadgeCheck, Banknote, CalendarDays,
  ShieldCheck, ListChecks, Gauge, Info
} from "lucide-react";
import * as XLSX from "xlsx";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

// ─── Config ──────────────────────────────────────────────────────────────────
const AWARD_CONFIG = {
  spot: {
    label: "Spot Award", sublabel: "Instant Recognition",
    icon: <Zap size={15}/>,
    color: "#f59e0b", lightBg: "#fffbeb", border: "#fde68a",
    darkAccent: "#92400e", cash: "₹500–₹1,000",
    freq: "Anytime", points: 10,
    eligibility: "All employees", nomination: "Dept Head / Team Lead / HR",
  },
  monthly_star: {
    label: "Monthly Star", sublabel: "Consistent Performer",
    icon: <Star size={15}/>,
    color: "#3b82f6", lightBg: "#eff6ff", border: "#bfdbfe",
    darkAccent: "#1e40af", cash: "₹3,000 + Certificate",
    freq: "Monthly", points: 30,
    eligibility: "Min 3 months service", nomination: "Manager + Peer + HR",
  },
  innovation: {
    label: "Innovation Champion", sublabel: "Quarterly Excellence",
    icon: <Lightbulb size={15}/>,
    color: "#8b5cf6", lightBg: "#f5f3ff", border: "#ddd6fe",
    darkAccent: "#6d28d9", cash: "₹5,000–₹10,000 + Certificate",
    freq: "Quarterly", points: 50,
    eligibility: "All employees / teams", nomination: "Self / Dept Head",
  },
};

const STATUS_CONFIG = {
  nominated:      { label: "Nominated",      color: "#6b7280", bg: "#f3f4f6", icon: <CircleDot size={11}/>, step: 1 },
  dept_validated: { label: "Dept Validated", color: "#f59e0b", bg: "#fffbeb", icon: <UserCheck size={11}/>, step: 2 },
  hr_approved:    { label: "HR Approved",    color: "#3b82f6", bg: "#eff6ff", icon: <ShieldCheck size={11}/>, step: 3 },
  announced:      { label: "Announced",      color: "#10b981", bg: "#ecfdf5", icon: <Megaphone size={11}/>, step: 4 },
  rejected:       { label: "Rejected",       color: "#ef4444", bg: "#fef2f2", icon: <XCircle size={11}/>, step: 0 },
};

const PROCESS_STEPS = [
  { label: "Nominated",      icon: <Plus size={11}/> },
  { label: "Dept Validated", icon: <Check size={11}/> },
  { label: "HR Approved",    icon: <ThumbsUp size={11}/> },
  { label: "Announced",      icon: <Trophy size={11}/> },
];

const TABS = [
  { id: "nominations", label: "Nominations",  icon: <Award size={14}/> },
  { id: "leaderboard", label: "Leaderboard",   icon: <Crown size={14}/> },
  { id: "wall",        label: "Wall of Fame",  icon: <Sparkles size={14}/> },
  { id: "analytics",   label: "Analytics",     icon: <BarChart2 size={14}/> },
];

// ─── Confetti ────────────────────────────────────────────────────────────────
function Confetti({ active }) {
  const canvasRef = useRef(null);
  const animRef   = useRef(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    const pieces = Array.from({ length: 120 }, () => ({
      x: Math.random() * canvas.width,
      y: -10,
      r: Math.random() * 6 + 4,
      tiltAngle: 0,
      tiltAngleInc: (Math.random() * 0.07) + 0.05,
      tilt: Math.random() * 10 - 10,
      color: ["#f59e0b","#3b82f6","#8b5cf6","#10b981","#ef4444","#ec4899"][Math.floor(Math.random()*6)],
      speed: Math.random() * 3 + 2,
    }));

    let frame = 0;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pieces.forEach(p => {
        p.tiltAngle += p.tiltAngleInc;
        p.y += p.speed;
        p.tilt = Math.sin(p.tiltAngle) * 12;
        ctx.beginPath();
        ctx.lineWidth = p.r;
        ctx.strokeStyle = p.color;
        ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
        ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
        ctx.stroke();
      });
      frame++;
      if (frame < 180) animRef.current = requestAnimationFrame(draw);
      else ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [active]);

  if (!active) return null;
  return (
    <canvas ref={canvasRef} style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:9998 }}/>
  );
}

// ─── Score Ring ───────────────────────────────────────────────────────────────
function ScoreRing({ points, size = 56, color = "#3b82f6" }) {
  const max = 200;
  const pct = Math.min((points / max) * 100, 100);
  const r   = (size - 8) / 2;
  const c   = 2 * Math.PI * r;
  return (
    <div style={{ position:"relative", width:size, height:size, flexShrink:0 }}>
      <svg width={size} height={size} style={{ transform:"rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={7}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={7}
          strokeDasharray={c} strokeDashoffset={c - (pct/100)*c} strokeLinecap="round"
          style={{ transition:"stroke-dashoffset 1s ease" }}/>
      </svg>
      <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
        <span style={{ fontSize:size*0.22, fontWeight:900, color }}>{points}</span>
      </div>
    </div>
  );
}

// ─── Mini Bar ─────────────────────────────────────────────────────────────────
function MiniBar({ pct, color }) {
  return (
    <div style={{ background:"#e5e7eb", borderRadius:99, height:5, overflow:"hidden", marginTop:4 }}>
      <div style={{ width:`${Math.min(pct,100)}%`, height:"100%", background:color, borderRadius:99, transition:"width .8s ease" }}/>
    </div>
  );
}

// ─── Quick Spot Modal ─────────────────────────────────────────────────────────
function QuickSpotModal({ employees, onClose, onSave }) {
  const [empId, setEmpId]   = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const handle = async () => {
    if (!empId || !reason) return;
    setSaving(true);
    await onSave({ award_type:"spot", employee_id:empId, reason, cash_amount:500, nomination_source:"hr" });
    setSaving(false);
    onClose();
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(15,23,42,.45)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
      <div style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:16, width:"100%", maxWidth:460, padding:28, boxShadow:"0 20px 60px rgba(0,0,0,.15)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:40, height:40, borderRadius:12, background:"#fffbeb", border:"1px solid #fde68a", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Zap size={20} color="#f59e0b"/>
            </div>
            <div>
              <p style={{ margin:0, color:"#111827", fontWeight:800, fontSize:15 }}>Quick Spot Award</p>
              <p style={{ margin:0, color:"#6b7280", fontSize:12 }}>Recognize instantly · ₹500</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background:"#f3f4f6", border:"none", borderRadius:8, width:32, height:32, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"#6b7280" }}>
            <X size={15}/>
          </button>
        </div>
        <div style={{ marginBottom:14 }}>
          <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#6b7280", marginBottom:6, textTransform:"uppercase", letterSpacing:"0.05em" }}>Select Employee</label>
          <select value={empId} onChange={e=>setEmpId(e.target.value)}
            style={{ width:"100%", padding:"10px 12px", background:"#f9fafb", border:"1px solid #e5e7eb", borderRadius:9, color:"#111827", fontSize:13, outline:"none" }}>
            <option value="">-- Choose --</option>
            {employees.map(e => <option key={e._id} value={e._id}>{e.name} — {e.department}</option>)}
          </select>
        </div>
        <div style={{ marginBottom:20 }}>
          <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#6b7280", marginBottom:6, textTransform:"uppercase", letterSpacing:"0.05em" }}>Why are they awesome?</label>
          <textarea value={reason} onChange={e=>setReason(e.target.value)}
            placeholder="e.g. Resolved a critical bug at midnight, saving the product launch!"
            style={{ width:"100%", padding:"10px 12px", background:"#f9fafb", border:"1px solid #e5e7eb", borderRadius:9, color:"#111827", fontSize:13, outline:"none", minHeight:80, resize:"vertical", boxSizing:"border-box", fontFamily:"inherit" }}/>
        </div>
        <button onClick={handle} disabled={saving || !empId || !reason}
          style={{ width:"100%", padding:"12px", background:(!empId||!reason||saving)?"#e5e7eb":"#f59e0b", border:"none", borderRadius:10, color:(!empId||!reason)?"#9ca3af":"#fff", fontWeight:700, fontSize:14, cursor:(!empId||!reason||saving)?"not-allowed":"pointer", transition:"all .2s" }}>
          {saving ? "Sending..." : "Award Now"}
        </button>
      </div>
    </div>
  );
}

// ─── Nomination Form ──────────────────────────────────────────────────────────
function NominationForm({ employees, onClose, onSave }) {
  const [form, setForm] = useState({
    award_type:"monthly_star", employee_id:"", nomination_source:"manager",
    period:"", reason:"", achievement_details:"", cash_amount:3000,
  });
  const [saving, setSaving] = useState(false);
  const cfg = AWARD_CONFIG[form.award_type];

  const handle = async () => {
    if (!form.employee_id || !form.reason) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
    onClose();
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(15,23,42,.45)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:16, overflowY:"auto" }}>
      <div style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:16, width:"100%", maxWidth:580, boxShadow:"0 20px 60px rgba(0,0,0,.15)", maxHeight:"90vh", overflowY:"auto" }}>
        <div style={{ background:"#f9fafb", padding:"18px 24px", borderRadius:"16px 16px 0 0", display:"flex", justifyContent:"space-between", alignItems:"center", position:"sticky", top:0, zIndex:1, borderBottom:"1px solid #e5e7eb" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <Trophy size={18} color="#3b82f6"/>
            <p style={{ margin:0, color:"#111827", fontWeight:800, fontSize:15 }}>Nominate Employee</p>
          </div>
          <button onClick={onClose} style={{ background:"#e5e7eb", border:"none", borderRadius:8, width:30, height:30, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"#6b7280" }}>
            <X size={14}/>
          </button>
        </div>
        <div style={{ padding:24 }}>
          {/* Award type */}
          <div style={{ marginBottom:18 }}>
            <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#6b7280", marginBottom:8, textTransform:"uppercase", letterSpacing:"0.05em" }}>Award Category</label>
            <div style={{ display:"flex", gap:8 }}>
              {Object.entries(AWARD_CONFIG).map(([k,v]) => (
                <button key={k} onClick={() => setForm(f=>({...f, award_type:k, cash_amount: k==="spot"?500:k==="monthly_star"?3000:5000}))}
                  style={{ flex:1, padding:"10px 6px", border:`2px solid ${form.award_type===k?v.color:"#e5e7eb"}`, borderRadius:10, background: form.award_type===k?v.lightBg:"#fff", color: form.award_type===k?v.color:"#6b7280", fontWeight:700, fontSize:12, cursor:"pointer", transition:"all .2s", textAlign:"center" }}>
                  <div style={{ display:"flex", justifyContent:"center", marginBottom:4, color: form.award_type===k?v.color:"#9ca3af" }}>{v.icon}</div>
                  <div style={{ fontSize:11 }}>{v.label}</div>
                </button>
              ))}
            </div>
            <div style={{ marginTop:8, padding:"8px 12px", background:"#f9fafb", borderRadius:8, display:"flex", justifyContent:"space-between", fontSize:11, color:"#6b7280", border:"1px solid #e5e7eb" }}>
              <span style={{ display:"flex", alignItems:"center", gap:4 }}><Banknote size={12}/> {cfg.cash}</span>
              <span style={{ display:"flex", alignItems:"center", gap:4 }}><CalendarDays size={12}/> {cfg.freq}</span>
              <span style={{ display:"flex", alignItems:"center", gap:4 }}><Target size={12}/> +{cfg.points} pts</span>
            </div>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
            <div>
              <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#6b7280", marginBottom:6, textTransform:"uppercase", letterSpacing:"0.05em" }}>Employee *</label>
              <select value={form.employee_id} onChange={e=>setForm(f=>({...f,employee_id:e.target.value}))}
                style={{ width:"100%", padding:"9px 11px", background:"#f9fafb", border:"1px solid #e5e7eb", borderRadius:8, color:"#111827", fontSize:13, outline:"none" }}>
                <option value="">-- Select --</option>
                {employees.map(e => <option key={e._id} value={e._id}>{e.name} ({e.department})</option>)}
              </select>
            </div>
            <div>
              <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#6b7280", marginBottom:6, textTransform:"uppercase", letterSpacing:"0.05em" }}>Period</label>
              <input value={form.period} onChange={e=>setForm(f=>({...f,period:e.target.value}))}
                placeholder="e.g. March 2026"
                style={{ width:"100%", padding:"9px 11px", background:"#f9fafb", border:"1px solid #e5e7eb", borderRadius:8, color:"#111827", fontSize:13, outline:"none", boxSizing:"border-box" }}/>
            </div>
            <div>
              <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#6b7280", marginBottom:6, textTransform:"uppercase", letterSpacing:"0.05em" }}>Nominated By</label>
              <select value={form.nomination_source} onChange={e=>setForm(f=>({...f,nomination_source:e.target.value}))}
                style={{ width:"100%", padding:"9px 11px", background:"#f9fafb", border:"1px solid #e5e7eb", borderRadius:8, color:"#111827", fontSize:13, outline:"none" }}>
                <option value="manager">Manager</option>
                <option value="dept_head">Department Head</option>
                <option value="peer">Peer</option>
                <option value="self">Self</option>
                <option value="hr">HR</option>
              </select>
            </div>
            <div>
              <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#6b7280", marginBottom:6, textTransform:"uppercase", letterSpacing:"0.05em" }}>Cash Amount (₹)</label>
              <input type="number" value={form.cash_amount} onChange={e=>setForm(f=>({...f,cash_amount:Number(e.target.value)}))}
                style={{ width:"100%", padding:"9px 11px", background:"#f9fafb", border:"1px solid #e5e7eb", borderRadius:8, color:"#111827", fontSize:13, outline:"none", boxSizing:"border-box" }}/>
            </div>
          </div>

          <div style={{ marginBottom:12 }}>
            <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#6b7280", marginBottom:6, textTransform:"uppercase", letterSpacing:"0.05em" }}>Reason *</label>
            <textarea value={form.reason} onChange={e=>setForm(f=>({...f,reason:e.target.value}))}
              placeholder="Why does this employee deserve this award?"
              style={{ width:"100%", padding:"9px 11px", background:"#f9fafb", border:"1px solid #e5e7eb", borderRadius:8, color:"#111827", fontSize:13, outline:"none", minHeight:70, resize:"vertical", boxSizing:"border-box", fontFamily:"inherit" }}/>
          </div>
          <div style={{ marginBottom:20 }}>
            <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#6b7280", marginBottom:6, textTransform:"uppercase", letterSpacing:"0.05em" }}>Achievement Details</label>
            <textarea value={form.achievement_details} onChange={e=>setForm(f=>({...f,achievement_details:e.target.value}))}
              placeholder="Specific examples, metrics, impact..."
              style={{ width:"100%", padding:"9px 11px", background:"#f9fafb", border:"1px solid #e5e7eb", borderRadius:8, color:"#111827", fontSize:13, outline:"none", minHeight:60, resize:"vertical", boxSizing:"border-box", fontFamily:"inherit" }}/>
          </div>

          <div style={{ display:"flex", gap:10 }}>
            <button onClick={onClose} style={{ flex:1, padding:"11px", background:"#fff", border:"1px solid #e5e7eb", borderRadius:10, color:"#6b7280", fontWeight:600, cursor:"pointer", fontSize:13 }}>Cancel</button>
            <button onClick={handle} disabled={saving || !form.employee_id || !form.reason}
              style={{ flex:2, padding:"11px", background:(!form.employee_id||!form.reason||saving)?"#e5e7eb":"#3b82f6", border:"none", borderRadius:10, color:(!form.employee_id||!form.reason)?"#9ca3af":"#fff", fontWeight:700, fontSize:14, cursor:(!form.employee_id||!form.reason||saving)?"not-allowed":"pointer" }}>
              {saving ? "Submitting..." : "Submit Nomination"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AwardsDashboard() {
  const [awards, setAwards]             = useState([]);
  const [employees, setEmployees]       = useState([]);
  const [summary, setSummary]           = useState(null);
  const [loading, setLoading]           = useState(true);
  const [activeTab, setActiveTab]       = useState("nominations");
  const [showForm, setShowForm]         = useState(false);
  const [showQuick, setShowQuick]       = useState(false);
  const [confetti, setConfetti]         = useState(false);
  const [toast, setToast]               = useState(null);
  const [filterType, setFilterType]     = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [search, setSearch]             = useState("");

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [awRes, empRes, sumRes] = await Promise.all([
        axios.get(`${API_BASE}/api/employee-awards`),
        axios.get(`${API_BASE}/api/hr/approved`),
        axios.get(`${API_BASE}/api/employee-awards/summary`),
      ]);
      if (awRes.data.success)  setAwards(awRes.data.data);
      if (empRes.data)         setEmployees(empRes.data);
      if (sumRes.data.success) setSummary(sumRes.data.data);
    } catch { showToastMsg("Failed to load", "error"); }
    finally { setLoading(false); }
  };

  const showToastMsg = (msg, type="success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleSave = async (formData) => {
    try {
      await axios.post(`${API_BASE}/api/employee-awards`, formData);
      showToastMsg("Nomination submitted!");
      fetchAll();
    } catch (err) { showToastMsg(err?.response?.data?.message || "Failed", "error"); }
  };

  const handleStatus = async (id, status) => {
    try {
      await axios.patch(`${API_BASE}/api/employee-awards/${id}/status`, { status });
      if (status === "announced") {
        setConfetti(true);
        setTimeout(() => setConfetti(false), 4000);
        showToastMsg("Award Announced! Congratulations!");
      } else {
        showToastMsg("Status updated");
      }
      fetchAll();
    } catch { showToastMsg("Update failed", "error"); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this nomination?")) return;
    try {
      await axios.delete(`${API_BASE}/api/employee-awards/${id}`);
      showToastMsg("Deleted");
      fetchAll();
    } catch { showToastMsg("Failed", "error"); }
  };

  // Leaderboard
  const leaderboard = useMemo(() => {
    const map = {};
    awards.filter(a => a.status === "announced").forEach(a => {
      const id   = a.employee_id?._id;
      const name = a.employee_id?.name;
      const dept = a.employee_id?.department;
      if (!id) return;
      if (!map[id]) map[id] = { id, name, dept, points:0, awards:[], totalCash:0 };
      map[id].points    += AWARD_CONFIG[a.award_type]?.points || 0;
      map[id].totalCash += a.cash_amount || 0;
      map[id].awards.push(a.award_type);
    });
    return Object.values(map).sort((a,b) => b.points - a.points).slice(0,10);
  }, [awards]);

  // Wall of Fame
  const wallOfFame = useMemo(() =>
    awards.filter(a => a.status === "announced").slice(0, 12), [awards]);

  // Analytics
  const analytics = useMemo(() => {
    const byType = { spot:0, monthly_star:0, innovation:0 };
    awards.forEach(a => {
      byType[a.award_type] = (byType[a.award_type] || 0) + 1;
    });
    return { byType };
  }, [awards]);

  // Filtered nominations
  const filtered = useMemo(() => {
    let d = [...awards];
    if (filterType   !== "All") d = d.filter(a => a.award_type === filterType);
    if (filterStatus !== "All") d = d.filter(a => a.status     === filterStatus);
    if (search.trim()) d = d.filter(a => a.employee_id?.name?.toLowerCase().includes(search.toLowerCase()));
    return d;
  }, [awards, filterType, filterStatus, search]);

  const exportExcel = () => {
    const rows = filtered.map((a,i) => ({
      "#": i+1, "Employee": a.employee_id?.name, "Department": a.employee_id?.department,
      "Award": AWARD_CONFIG[a.award_type]?.label, "Period": a.period,
      "Reason": a.reason, "Cash (₹)": a.cash_amount,
      "Status": STATUS_CONFIG[a.status]?.label,
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Awards");
    XLSX.writeFile(wb, `Awards_${Date.now()}.xlsx`);
  };

  if (loading) return (
    <div style={{ display:"flex", justifyContent:"center", alignItems:"center", height:"100vh", background:"#f9fafb" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ width:36, height:36, border:"3px solid #e5e7eb", borderTopColor:"#3b82f6", borderRadius:"50%", animation:"spin .8s linear infinite", margin:"0 auto 12px" }}/>
        <p style={{ color:"#6b7280", fontSize:14 }}>Loading Recognition Hub...</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );

  return (
    <div style={{ fontFamily:"'Segoe UI',sans-serif", minHeight:"100vh", background:"#f3f4f6", color:"#111827" }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        .aw-card{animation:fadeUp .3s ease both}
        .aw-row:hover{background:#f9fafb !important}
        .aw-tab:hover{background:#f3f4f6}
        .aw-action:hover{opacity:.85}
        @media(max-width:768px){
          .aw-stats{grid-template-columns:repeat(2,1fr)!important}
          .aw-table{display:none!important}
          .aw-cards{display:flex!important}
          .lb-grid{grid-template-columns:1fr!important}
          .wof-grid{grid-template-columns:repeat(2,1fr)!important}
        }
        @media(max-width:480px){
          .aw-stats{grid-template-columns:1fr!important}
          .wof-grid{grid-template-columns:1fr!important}
        }
        ::-webkit-scrollbar{width:5px;height:5px}
        ::-webkit-scrollbar-track{background:#f3f4f6}
        ::-webkit-scrollbar-thumb{background:#d1d5db;border-radius:3px}
        select,input,textarea{transition:border-color .15s}
        select:focus,input:focus,textarea:focus{border-color:#3b82f6 !important}
      `}</style>

      <Confetti active={confetti}/>

      {/* Toast */}
      {toast && (
        <div style={{ position:"fixed", top:18, right:16, zIndex:9999, background: toast.type==="error"?"#ef4444":"#10b981", color:"#fff", padding:"12px 18px", borderRadius:10, fontWeight:600, fontSize:13, boxShadow:"0 8px 24px rgba(0,0,0,.15)", animation:"fadeUp .25s ease", display:"flex", alignItems:"center", gap:8 }}>
          {toast.type==="error" ? <XCircle size={15}/> : <CheckCircle2 size={15}/>}
          {toast.msg}
        </div>
      )}

      {showQuick && <QuickSpotModal employees={employees} onClose={()=>setShowQuick(false)} onSave={async(d)=>{await handleSave(d);setShowQuick(false);}}/>}
      {showForm  && <NominationForm employees={employees} onClose={()=>setShowForm(false)}  onSave={async(d)=>{await handleSave(d);setShowForm(false);}}/>}

      {/* ── Header ── */}
      <div style={{ background:"#fff", borderBottom:"1px solid #e5e7eb", padding:"16px 28px", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12, position:"sticky", top:0, zIndex:100 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:"linear-gradient(135deg,#3b82f6,#8b5cf6)", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Trophy size={18} color="#fff"/>
          </div>
          <div>
            <h1 style={{ margin:0, fontSize:17, fontWeight:800, color:"#111827", letterSpacing:"-0.01em" }}>Recognition Hub</h1>
            <p style={{ margin:0, fontSize:11, color:"#9ca3af" }}>Radnus Policy 3.27 — Spot · Star · Innovation</p>
          </div>
        </div>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          <button onClick={exportExcel}
            style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 14px", background:"#fff", border:"1px solid #e5e7eb", borderRadius:8, fontWeight:600, fontSize:12, cursor:"pointer", color:"#6b7280" }}>
            <Download size={13}/> Export
          </button>
          <button onClick={()=>setShowQuick(true)}
            style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 16px", background:"#f59e0b", border:"none", borderRadius:8, fontWeight:700, fontSize:13, cursor:"pointer", color:"#fff" }}>
            <Zap size={13}/> Quick Spot
          </button>
          <button onClick={()=>setShowForm(true)}
            style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 16px", background:"#3b82f6", border:"none", borderRadius:8, fontWeight:700, fontSize:13, cursor:"pointer", color:"#fff" }}>
            <Plus size={13}/> Nominate
          </button>
        </div>
      </div>

      <div style={{ padding:"24px 28px", maxWidth:1400, margin:"0 auto" }}>

        {/* ── Summary Stats ── */}
        {summary && (
          <div className="aw-stats" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:24 }}>
            {[
              { label:"Total Nominations", value:summary.total,        icon:<Award size={18}/>,     color:"#3b82f6", bg:"#eff6ff" },
              { label:"Spot Awards",        value:summary.spot,         icon:<Zap size={18}/>,       color:"#f59e0b", bg:"#fffbeb" },
              { label:"Monthly Stars",      value:summary.monthly_star, icon:<Star size={18}/>,      color:"#3b82f6", bg:"#eff6ff" },
              { label:"Innovation",         value:summary.innovation,   icon:<Lightbulb size={18}/>, color:"#8b5cf6", bg:"#f5f3ff" },
            ].map((s,i) => (
              <div key={i} className="aw-card" style={{ background:"#fff", borderRadius:12, padding:"18px 20px", border:"1px solid #e5e7eb", animationDelay:`${i*0.05}s` }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                  <div>
                    <p style={{ margin:"0 0 6px", fontSize:11, color:"#9ca3af", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em" }}>{s.label}</p>
                    <p style={{ margin:0, fontSize:28, fontWeight:900, color:s.color }}>{s.value}</p>
                  </div>
                  <div style={{ width:40, height:40, borderRadius:10, background:s.bg, display:"flex", alignItems:"center", justifyContent:"center", color:s.color }}>
                    {s.icon}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Tabs ── */}
        <div style={{ display:"flex", gap:2, background:"#fff", borderRadius:10, padding:4, border:"1px solid #e5e7eb", marginBottom:24, width:"fit-content", flexWrap:"wrap" }}>
          {TABS.map(tab => (
            <button key={tab.id} onClick={()=>setActiveTab(tab.id)} className="aw-tab"
              style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 18px", border:"none", borderRadius:7, cursor:"pointer", fontWeight:600, fontSize:13, background: activeTab===tab.id?"#3b82f6":"transparent", color: activeTab===tab.id?"#fff":"#6b7280", transition:"all .2s", whiteSpace:"nowrap" }}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* ════════ TAB: NOMINATIONS ════════ */}
        {activeTab === "nominations" && (
          <>
            {/* Award type info cards */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:12, marginBottom:20 }}>
              {Object.entries(AWARD_CONFIG).map(([k,v]) => (
                <div key={k} style={{ background:"#fff", borderRadius:12, border:`1px solid ${v.border}`, overflow:"hidden" }}>
                  <div style={{ background:v.lightBg, padding:"12px 16px", display:"flex", alignItems:"center", gap:8, borderBottom:`1px solid ${v.border}` }}>
                    <div style={{ color:v.color }}>{v.icon}</div>
                    <div>
                      <p style={{ margin:0, color:v.color, fontWeight:800, fontSize:13 }}>{v.label}</p>
                      <p style={{ margin:0, color:"#9ca3af", fontSize:11 }}>{v.sublabel}</p>
                    </div>
                  </div>
                  <div style={{ padding:"10px 16px" }}>
                    {[
                      [<Banknote size={11}/>, v.cash],
                      [<CalendarDays size={11}/>, v.freq],
                      [<Target size={11}/>, `+${v.points} pts`]
                    ].map(([ic,tx],i)=>(
                      <div key={i} style={{ display:"flex", gap:6, alignItems:"center", marginBottom:4, fontSize:12, color:"#6b7280" }}>
                        <span style={{ color:"#9ca3af" }}>{ic}</span><span>{tx}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Filters */}
            <div style={{ background:"#fff", borderRadius:10, padding:"12px 14px", border:"1px solid #e5e7eb", marginBottom:14, display:"flex", gap:10, flexWrap:"wrap", alignItems:"center" }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, flex:1, minWidth:180, background:"#f9fafb", borderRadius:8, padding:"7px 12px", border:"1px solid #e5e7eb" }}>
                <Search size={13} color="#9ca3af"/>
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search employee..."
                  style={{ background:"none", border:"none", color:"#111827", fontSize:13, outline:"none", width:"100%" }}/>
              </div>
              {[
                { val:filterType, set:setFilterType, opts:[["All","All Types"],...Object.entries(AWARD_CONFIG).map(([k,v])=>[k,v.label])] },
                { val:filterStatus, set:setFilterStatus, opts:[["All","All Status"],...Object.entries(STATUS_CONFIG).map(([k,v])=>[k,v.label])] },
              ].map((f,i) => (
                <select key={i} value={f.val} onChange={e=>f.set(e.target.value)}
                  style={{ padding:"8px 12px", background:"#f9fafb", border:"1px solid #e5e7eb", borderRadius:8, color:"#374151", fontSize:13, outline:"none" }}>
                  {f.opts.map(([k,l])=><option key={k} value={k}>{l}</option>)}
                </select>
              ))}
              <button onClick={fetchAll} style={{ padding:"8px 12px", background:"#f9fafb", border:"1px solid #e5e7eb", borderRadius:8, color:"#6b7280", cursor:"pointer", display:"flex", alignItems:"center", gap:4, fontSize:12 }}>
                <RefreshCw size={12}/> Refresh
              </button>
              <span style={{ fontSize:12, color:"#9ca3af" }}>{filtered.length} records</span>
            </div>

            {/* Table */}
            {filtered.length === 0 ? (
              <div style={{ textAlign:"center", padding:"60px 0", background:"#fff", borderRadius:12, border:"1px solid #e5e7eb" }}>
                <div style={{ display:"flex", justifyContent:"center", marginBottom:12, color:"#d1d5db" }}>
                  <Trophy size={40}/>
                </div>
                <p style={{ color:"#6b7280", fontWeight:600, fontSize:15 }}>No nominations yet</p>
                <p style={{ color:"#9ca3af", fontSize:13 }}>Click "Nominate" or "Quick Spot" to recognize someone!</p>
              </div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="aw-table" style={{ background:"#fff", borderRadius:12, border:"1px solid #e5e7eb", overflow:"hidden" }}>
                  <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                    <thead>
                      <tr style={{ background:"#f9fafb" }}>
                        {["Employee","Award","Period","Reason","Cash","Progress","Actions"].map(h=>(
                          <th key={h} style={{ padding:"11px 16px", textAlign:"left", fontWeight:700, color:"#6b7280", borderBottom:"1px solid #e5e7eb", whiteSpace:"nowrap", fontSize:11, textTransform:"uppercase", letterSpacing:"0.05em" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((a) => {
                        const cfg = AWARD_CONFIG[a.award_type];
                        const st  = STATUS_CONFIG[a.status];
                        const step = st?.step || 0;
                        return (
                          <tr key={a._id} className="aw-row" style={{ borderBottom:"1px solid #f3f4f6", transition:"background .15s" }}>
                            <td style={{ padding:"12px 16px" }}>
                              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                                <div style={{ width:34, height:34, borderRadius:"50%", background:cfg.lightBg, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, color:cfg.color, fontSize:14, flexShrink:0, border:`1px solid ${cfg.border}` }}>
                                  {a.employee_id?.name?.charAt(0)||"?"}
                                </div>
                                <div>
                                  <p style={{ margin:0, fontWeight:700, color:"#111827", fontSize:13 }}>{a.employee_id?.name}</p>
                                  <p style={{ margin:0, fontSize:11, color:"#9ca3af" }}>{a.employee_id?.department}</p>
                                </div>
                              </div>
                            </td>
                            <td style={{ padding:"12px 16px" }}>
                              <span style={{ background:cfg.lightBg, color:cfg.color, padding:"4px 10px", borderRadius:20, fontSize:11, fontWeight:700, whiteSpace:"nowrap", display:"inline-flex", alignItems:"center", gap:4, border:`1px solid ${cfg.border}` }}>
                                {cfg.icon} {cfg.label}
                              </span>
                            </td>
                            <td style={{ padding:"12px 16px" }}>
                              <span style={{ background:"#f3f4f6", color:"#6b7280", padding:"3px 8px", borderRadius:6, fontSize:11, fontWeight:600 }}>{a.period||"—"}</span>
                            </td>
                            <td style={{ padding:"12px 16px", maxWidth:180 }}>
                              <p style={{ margin:0, fontSize:12, color:"#6b7280", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", maxWidth:160 }}>{a.reason}</p>
                            </td>
                            <td style={{ padding:"12px 16px", fontWeight:700, color:"#10b981", fontSize:13 }}>
                              ₹{a.cash_amount?.toLocaleString("en-IN")}
                            </td>
                            <td style={{ padding:"12px 16px", minWidth:140 }}>
                              <div style={{ display:"flex", gap:3, alignItems:"center" }}>
                                {PROCESS_STEPS.map((ps,pi) => (
                                  <div key={pi} style={{ display:"flex", alignItems:"center" }}>
                                    <div style={{ width:20, height:20, borderRadius:"50%", background: pi < step ? "#10b981" : "#e5e7eb", display:"flex", alignItems:"center", justifyContent:"center", color: pi < step ? "#fff":"#9ca3af", fontSize:9 }}>
                                      {pi < step ? <Check size={9}/> : pi+1}
                                    </div>
                                    {pi < 3 && <div style={{ width:10, height:1, background: pi < step-1 ? "#10b981":"#e5e7eb" }}/>}
                                  </div>
                                ))}
                              </div>
                              <p style={{ margin:"3px 0 0", fontSize:10, color:st.color, display:"flex", alignItems:"center", gap:3 }}>{st.icon} {st.label}</p>
                            </td>
                            <td style={{ padding:"12px 16px" }}>
                              <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                                {a.status==="nominated" && (
                                  <button className="aw-action" onClick={()=>handleStatus(a._id,"dept_validated")} style={{ padding:"4px 10px", background:"#fffbeb", border:"1px solid #fde68a", borderRadius:6, color:"#92400e", fontSize:11, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:4 }}>
                                    <UserCheck size={11}/> Validate
                                  </button>
                                )}
                                {a.status==="dept_validated" && (
                                  <button className="aw-action" onClick={()=>handleStatus(a._id,"hr_approved")} style={{ padding:"4px 10px", background:"#eff6ff", border:"1px solid #bfdbfe", borderRadius:6, color:"#1e40af", fontSize:11, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:4 }}>
                                    <ShieldCheck size={11}/> Approve
                                  </button>
                                )}
                                {a.status==="hr_approved" && (
                                  <button className="aw-action" onClick={()=>handleStatus(a._id,"announced")} style={{ padding:"4px 10px", background:"#10b981", border:"none", borderRadius:6, color:"#fff", fontSize:11, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:4 }}>
                                    <Megaphone size={11}/> Announce
                                  </button>
                                )}
                                {!["announced","rejected"].includes(a.status) && (
                                  <button className="aw-action" onClick={()=>handleStatus(a._id,"rejected")} style={{ padding:"4px 8px", background:"#fef2f2", border:"1px solid #fecaca", borderRadius:6, color:"#dc2626", fontSize:11, fontWeight:700, cursor:"pointer" }}>
                                    <X size={11}/>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="aw-cards" style={{ display:"none", flexDirection:"column", gap:10 }}>
                  {filtered.map(a => {
                    const cfg = AWARD_CONFIG[a.award_type];
                    const st  = STATUS_CONFIG[a.status];
                    return (
                      <div key={a._id} style={{ background:"#fff", borderRadius:12, border:"1px solid #e5e7eb", padding:"14px 16px" }}>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                            <div style={{ width:36, height:36, borderRadius:"50%", background:cfg.lightBg, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, color:cfg.color, fontSize:15 }}>
                              {a.employee_id?.name?.charAt(0)||"?"}
                            </div>
                            <div>
                              <p style={{ margin:0, fontWeight:700, color:"#111827" }}>{a.employee_id?.name}</p>
                              <p style={{ margin:0, fontSize:11, color:"#9ca3af" }}>{a.employee_id?.department}</p>
                            </div>
                          </div>
                          <span style={{ background:cfg.lightBg, color:cfg.color, padding:"4px 10px", borderRadius:20, fontSize:11, fontWeight:700, height:"fit-content", display:"flex", alignItems:"center", gap:4 }}>{cfg.icon} {cfg.label}</span>
                        </div>
                        <p style={{ margin:"0 0 10px", fontSize:12, color:"#6b7280" }}>{a.reason}</p>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                          <span style={{ color:"#10b981", fontWeight:700 }}>₹{a.cash_amount?.toLocaleString("en-IN")}</span>
                          <span style={{ background:st.bg, color:st.color, padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:700, display:"flex", alignItems:"center", gap:4 }}>{st.icon} {st.label}</span>
                        </div>
                        <div style={{ display:"flex", gap:6 }}>
                          {a.status==="nominated" && <button onClick={()=>handleStatus(a._id,"dept_validated")} style={{ flex:1, padding:"7px", background:"#fffbeb", border:"1px solid #fde68a", borderRadius:8, color:"#92400e", fontWeight:700, cursor:"pointer", fontSize:12 }}>Validate</button>}
                          {a.status==="dept_validated" && <button onClick={()=>handleStatus(a._id,"hr_approved")} style={{ flex:1, padding:"7px", background:"#eff6ff", border:"1px solid #bfdbfe", borderRadius:8, color:"#1e40af", fontWeight:700, cursor:"pointer", fontSize:12 }}>Approve</button>}
                          {a.status==="hr_approved" && <button onClick={()=>handleStatus(a._id,"announced")} style={{ flex:1, padding:"7px", background:"#10b981", border:"none", borderRadius:8, color:"#fff", fontWeight:700, cursor:"pointer", fontSize:12 }}>Announce</button>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </>
        )}

        {/* ════════ TAB: LEADERBOARD ════════ */}
        {activeTab === "leaderboard" && (
          <div>
            <div style={{ background:"#fff", borderRadius:12, border:"1px solid #e5e7eb", padding:"18px 22px", marginBottom:18 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                <Crown size={18} color="#f59e0b"/>
                <p style={{ margin:0, fontWeight:800, fontSize:15, color:"#111827" }}>Recognition Leaderboard</p>
              </div>
              <p style={{ margin:0, fontSize:12, color:"#9ca3af", display:"flex", alignItems:"center", gap:10 }}>
                <span style={{ display:"flex", alignItems:"center", gap:4 }}><Zap size={11} color="#f59e0b"/> Spot = 10 pts</span>
                <span style={{ display:"flex", alignItems:"center", gap:4 }}><Star size={11} color="#3b82f6"/> Monthly Star = 30 pts</span>
                <span style={{ display:"flex", alignItems:"center", gap:4 }}><Lightbulb size={11} color="#8b5cf6"/> Innovation = 50 pts</span>
              </p>
            </div>

            {leaderboard.length === 0 ? (
              <div style={{ textAlign:"center", padding:"60px 0", background:"#fff", borderRadius:12, border:"1px solid #e5e7eb" }}>
                <p style={{ color:"#6b7280", fontSize:15 }}>No announced awards yet. Start recognizing people!</p>
              </div>
            ) : (
              <div className="lb-grid" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                {leaderboard.map((emp, i) => {
                  const rankColor = i===0?"#f59e0b":i===1?"#6b7280":i===2?"#b45309":"#3b82f6";
                  const isTop3    = i < 3;
                  return (
                    <div key={emp.id} className="aw-card" style={{ background:"#fff", borderRadius:12, border:`1.5px solid ${isTop3?rankColor+"44":"#e5e7eb"}`, padding:"16px 20px", display:"flex", alignItems:"center", gap:16, animationDelay:`${i*0.05}s` }}>
                      {/* Rank */}
                      <div style={{ flexShrink:0, textAlign:"center" }}>
                        <div style={{ width:38, height:38, borderRadius:"50%", background: isTop3?`${rankColor}15`:"#f3f4f6", display:"flex", alignItems:"center", justifyContent:"center", border:`1.5px solid ${isTop3?rankColor:"#e5e7eb"}` }}>
                          {i===0 ? <Medal size={18} color="#f59e0b"/> : i===1 ? <Medal size={18} color="#6b7280"/> : i===2 ? <Medal size={18} color="#b45309"/> : <span style={{ fontWeight:800, color:"#9ca3af", fontSize:15 }}>{i+1}</span>}
                        </div>
                      </div>

                      {/* Points ring */}
                      <ScoreRing points={emp.points} size={52} color={isTop3?rankColor:"#3b82f6"}/>

                      {/* Info */}
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ margin:"0 0 2px", fontWeight:800, color:"#111827", fontSize:14, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{emp.name}</p>
                        <p style={{ margin:"0 0 6px", fontSize:11, color:"#9ca3af" }}>{emp.dept}</p>
                        <div style={{ display:"flex", gap:6, flexWrap:"wrap", alignItems:"center" }}>
                          {[...new Set(emp.awards)].map((t,j) => (
                            <span key={j} style={{ color: AWARD_CONFIG[t]?.color, display:"flex" }}>{AWARD_CONFIG[t]?.icon}</span>
                          ))}
                          <span style={{ fontSize:11, color:"#10b981", fontWeight:700, display:"flex", alignItems:"center", gap:3 }}>
                            <Banknote size={11}/> ₹{emp.totalCash.toLocaleString("en-IN")}
                          </span>
                        </div>
                        <MiniBar pct={Math.min((emp.points/200)*100,100)} color={isTop3?rankColor:"#3b82f6"}/>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ════════ TAB: WALL OF FAME ════════ */}
        {activeTab === "wall" && (
          <div>
            <div style={{ background:"#fff", borderRadius:12, border:"1px solid #e5e7eb", padding:"18px 22px", marginBottom:18, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                  <Sparkles size={17} color="#f59e0b"/>
                  <p style={{ margin:0, fontWeight:800, fontSize:15, color:"#111827" }}>Wall of Fame</p>
                </div>
                <p style={{ margin:0, fontSize:12, color:"#9ca3af" }}>Celebrating Radnus champions — digital recognition board</p>
              </div>
              <div style={{ width:40, height:40, borderRadius:10, background:"#fffbeb", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <Trophy size={20} color="#f59e0b"/>
              </div>
            </div>

            {wallOfFame.length === 0 ? (
              <div style={{ textAlign:"center", padding:"60px 0", background:"#fff", borderRadius:12, border:"1px solid #e5e7eb" }}>
                <p style={{ color:"#6b7280", fontSize:15 }}>Wall is empty — announce some awards to populate it!</p>
              </div>
            ) : (
              <div className="wof-grid" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14 }}>
                {wallOfFame.map((a, i) => {
                  const cfg = AWARD_CONFIG[a.award_type];
                  return (
                    <div key={a._id} className="aw-card" style={{ background:"#fff", borderRadius:14, border:`1px solid ${cfg.border}`, overflow:"hidden", animationDelay:`${i*0.04}s` }}>
                      <div style={{ height:3, background:`linear-gradient(90deg,${cfg.color},${cfg.color}66)` }}/>
                      <div style={{ padding:"16px" }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
                          <span style={{ background:cfg.lightBg, color:cfg.color, padding:"4px 10px", borderRadius:20, fontSize:11, fontWeight:700, display:"inline-flex", alignItems:"center", gap:4, border:`1px solid ${cfg.border}` }}>
                            {cfg.icon} {cfg.label}
                          </span>
                          <span style={{ fontSize:11, color:"#9ca3af", display:"flex", alignItems:"center", gap:4 }}>
                            <CalendarDays size={11}/>
                            {a.announced_at ? new Date(a.announced_at).toLocaleDateString("en-IN",{day:"numeric",month:"short"}) : a.period}
                          </span>
                        </div>

                        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                          <div style={{ width:42, height:42, borderRadius:"50%", background:cfg.lightBg, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, color:cfg.color, fontSize:17, flexShrink:0, border:`1.5px solid ${cfg.border}` }}>
                            {a.employee_id?.name?.charAt(0)||"?"}
                          </div>
                          <div>
                            <p style={{ margin:0, fontWeight:800, color:"#111827", fontSize:14 }}>{a.employee_id?.name}</p>
                            <p style={{ margin:0, fontSize:11, color:"#9ca3af" }}>{a.employee_id?.department}</p>
                          </div>
                        </div>

                        <div style={{ background:"#f9fafb", borderRadius:8, padding:"10px 12px", borderLeft:`3px solid ${cfg.color}` }}>
                          <p style={{ margin:0, fontSize:12, color:"#6b7280", lineHeight:1.5, fontStyle:"italic" }}>"{a.reason}"</p>
                        </div>

                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:10 }}>
                          <span style={{ fontSize:12, color:"#10b981", fontWeight:700, display:"flex", alignItems:"center", gap:4 }}>
                            <Banknote size={12}/> ₹{a.cash_amount?.toLocaleString("en-IN")}
                          </span>
                          <span style={{ fontSize:11, color:"#9ca3af", display:"flex", alignItems:"center", gap:4 }}>
                            <BadgeCheck size={13} color="#10b981"/> Recognized
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ════════ TAB: ANALYTICS ════════ */}
        {activeTab === "analytics" && (
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            {/* Award breakdown */}
            <div style={{ background:"#fff", borderRadius:12, border:"1px solid #e5e7eb", padding:"20px 24px" }}>
              <p style={{ margin:"0 0 16px", fontWeight:700, fontSize:14, color:"#111827", display:"flex", alignItems:"center", gap:6 }}>
                <BarChart2 size={15} color="#3b82f6"/> Award Distribution
              </p>
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                {Object.entries(analytics.byType).map(([type, count]) => {
                  const cfg = AWARD_CONFIG[type];
                  const total = awards.length || 1;
                  const pct = Math.round((count/total)*100);
                  return (
                    <div key={type}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6, alignItems:"center" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <span style={{ color:cfg.color }}>{cfg.icon}</span>
                          <span style={{ fontSize:13, color:"#374151", fontWeight:600 }}>{cfg.label}</span>
                        </div>
                        <div style={{ display:"flex", gap:12, alignItems:"center" }}>
                          <span style={{ fontSize:12, color:"#9ca3af" }}>{pct}%</span>
                          <span style={{ fontSize:14, fontWeight:800, color:cfg.color }}>{count}</span>
                        </div>
                      </div>
                      <div style={{ background:"#f3f4f6", borderRadius:99, height:8, overflow:"hidden" }}>
                        <div style={{ width:`${pct}%`, height:"100%", background:cfg.color, borderRadius:99, transition:"width 1s ease" }}/>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Status breakdown */}
            <div style={{ background:"#fff", borderRadius:12, border:"1px solid #e5e7eb", padding:"20px 24px" }}>
              <p style={{ margin:"0 0 16px", fontWeight:700, fontSize:14, color:"#111827", display:"flex", alignItems:"center", gap:6 }}>
                <Gauge size={15} color="#3b82f6"/> Pipeline Status
              </p>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))", gap:10 }}>
                {Object.entries(STATUS_CONFIG).map(([key,cfg]) => {
                  const count = awards.filter(a=>a.status===key).length;
                  return (
                    <div key={key} style={{ background:cfg.bg, borderRadius:10, padding:"14px", textAlign:"center", border:`1px solid ${cfg.color}22` }}>
                      <div style={{ display:"flex", justifyContent:"center", marginBottom:6, color:cfg.color }}>{cfg.icon}</div>
                      <p style={{ margin:"0 0 4px", fontSize:22, fontWeight:900, color:cfg.color }}>{count}</p>
                      <p style={{ margin:0, fontSize:11, color:"#6b7280", fontWeight:600 }}>{cfg.label}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 6-Step Process */}
            <div style={{ background:"#fff", borderRadius:12, border:"1px solid #e5e7eb", padding:"20px 24px" }}>
              <p style={{ margin:"0 0 16px", fontWeight:700, fontSize:14, color:"#111827", display:"flex", alignItems:"center", gap:6 }}>
                <ListChecks size={15} color="#3b82f6"/> 5-Step Process Flow
              </p>
              <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
                {[
                  { icon:<Plus size={14}/>,        t:"Nomination Submission",  d:"HR Portal / Email within cut-off date" },
                  { icon:<UserCheck size={14}/>,   t:"Dept Head Validation",   d:"Ensures authenticity and impact" },
                  { icon:<ShieldCheck size={14}/>, t:"HR & Leadership Review", d:"Confirms eligibility and fairness" },
                  { icon:<Megaphone size={14}/>,   t:"Announcement & Reward",  d:"During monthly/quarterly meeting" },
                  { icon:<Award size={14}/>,       t:"Record Maintenance",     d:"HR maintains recognition records for performance history" },
                ].map((s,i) => (
                  <div key={i} style={{ display:"flex", gap:14, alignItems:"flex-start", paddingBottom:i<4?16:0 }}>
                    <div style={{ flexShrink:0, display:"flex", flexDirection:"column", alignItems:"center" }}>
                      <div style={{ width:32, height:32, borderRadius:"50%", background:"#eff6ff", border:"1px solid #bfdbfe", color:"#3b82f6", display:"flex", alignItems:"center", justifyContent:"center" }}>
                        {s.icon}
                      </div>
                      {i<4 && <div style={{ width:1.5, flex:1, background:"#e5e7eb", minHeight:20, marginTop:4 }}/>}
                    </div>
                    <div style={{ paddingTop:6 }}>
                      <p style={{ margin:"0 0 2px", fontWeight:700, fontSize:13, color:"#111827" }}>{s.t}</p>
                      <p style={{ margin:0, fontSize:12, color:"#6b7280" }}>{s.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Expected Impact */}
            <div style={{ background:"#fff", borderRadius:12, border:"1px solid #e5e7eb", padding:"20px 24px" }}>
              <p style={{ margin:"0 0 14px", fontWeight:700, fontSize:14, color:"#111827", display:"flex", alignItems:"center", gap:6 }}>
                <Target size={15} color="#3b82f6"/> Expected Impact
              </p>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:10 }}>
                {[
                  { icon:<Star size={15} color="#f59e0b"/>,     text:"Builds a positive, recognition-driven culture" },
                  { icon:<Lightbulb size={15} color="#8b5cf6"/>, text:"Enhances employee engagement, creativity & ownership" },
                  { icon:<Users size={15} color="#3b82f6"/>,    text:"Strengthens cross-functional collaboration" },
                  { icon:<ShieldCheck size={15} color="#10b981"/>, text:"Improves retention by valuing contributions promptly" },
                ].map((h,i) => (
                  <div key={i} style={{ display:"flex", gap:10, alignItems:"flex-start", background:"#f9fafb", borderRadius:9, padding:"12px 14px", border:"1px solid #e5e7eb" }}>
                    <span style={{ flexShrink:0, marginTop:1 }}>{h.icon}</span>
                    <p style={{ margin:0, fontSize:12, color:"#6b7280", lineHeight:1.5 }}>{h.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}