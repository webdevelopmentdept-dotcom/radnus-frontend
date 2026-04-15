import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Download, TrendingUp, Users, Star, Award, BarChart2,
  ChevronDown, ChevronUp, FileText, Printer, Filter,
  CheckCircle, AlertCircle, Clock, Search
} from "lucide-react";
import * as XLSX from "xlsx";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

/* ─── Helpers (same as Submissions) ─────────────────────────────── */
const getRatingInfo = (score) => {
  if (!score || score === 0) return { label: "No Data",              color: "#9ca3af", bg: "#f3f4f6", bar: "#d1d5db" };
  if (score >= 90)           return { label: "Outstanding",          color: "#059669", bg: "#ecfdf5", bar: "#10b981" };
  if (score >= 75)           return { label: "Exceeds Expectations", color: "#2563eb", bg: "#eff6ff", bar: "#3b82f6" };
  if (score >= 60)           return { label: "Meets Expectations",   color: "#d97706", bg: "#fffbeb", bar: "#f59e0b" };
  if (score >= 45)           return { label: "Needs Improvement",    color: "#ea580c", bg: "#fff7ed", bar: "#f97316" };
  return                            { label: "Unsatisfactory",       color: "#dc2626", bg: "#fef2f2", bar: "#ef4444" };
};

const REVIEWER_COLORS = {
  manager:     { bg: "#ede9fe", color: "#7c3aed", label: "Manager",     weight: 40 },
  peer:        { bg: "#dbeafe", color: "#1d4ed8", label: "Peer",        weight: 25 },
  subordinate: { bg: "#d1fae5", color: "#065f46", label: "Subordinate", weight: 20 },
  self:        { bg: "#fef3c7", color: "#92400e", label: "Self",        weight: 15 },
};

const COMPETENCY_LABELS = {
  communication:   "Communication",
  leadership:      "Leadership",
  technicalSkills: "Technical Skills",
  goalAchievement: "Goal Achievement",
  innovation:      "Innovation",
  teamwork:        "Teamwork",
};
const COMPETENCY_ICONS = {
  communication: "💬", leadership: "👑", technicalSkills: "⚡",
  goalAchievement: "🎯", innovation: "💡", teamwork: "🤝",
};

/* ─── Mini bar chart component ───────────────────────────────────── */
const ScoreBar = ({ score, max = 100, color }) => (
  <div style={{ background: "#e2e8f0", borderRadius: 99, height: 6, overflow: "hidden", width: "100%" }}>
    <div style={{
      width: `${Math.min((score / max) * 100, 100)}%`, height: "100%",
      background: color, borderRadius: 99,
      transition: "width 0.8s cubic-bezier(.4,0,.2,1)"
    }} />
  </div>
);

/* ─── Radial / Donut score ring ──────────────────────────────────── */
const ScoreRing = ({ score, size = 80, stroke = 7 }) => {
  const ri     = getRatingInfo(score);
  const r      = (size - stroke) / 2;
  const circ   = 2 * Math.PI * r;
  const filled = score > 0 ? (score / 100) * circ : 0;
  return (
    <svg width={size} height={size} style={{ display: "block", flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={ri.bar} strokeWidth={stroke}
        strokeDasharray={`${filled} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition: "stroke-dasharray 1s cubic-bezier(.4,0,.2,1)" }}
      />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central"
        style={{ fontSize: size * 0.22, fontWeight: 800, fill: ri.color }}>
        {score > 0 ? `${score}%` : "—"}
      </text>
    </svg>
  );
};

/* ══════════════════════════════════════════════════════════════════ */
export default function FeedbackReports() {
  const [cycles,        setCycles]        = useState([]);
  const [selectedCycle, setSelectedCycle] = useState(null);
  const [summary,       setSummary]       = useState([]);
  const [allSubs,       setAllSubs]       = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [expandedRow,   setExpandedRow]   = useState(null);
  const [toast,         setToast]         = useState(null);
  const [search,        setSearch]        = useState("");
  const [deptFilter,    setDeptFilter]    = useState("all");
  const [ratingFilter,  setRatingFilter]  = useState("all");
  const [printEmp,      setPrintEmp]      = useState(null); // for individual PDF print

  /* ─── Toast ─────────────────────────────────────────────────── */
  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  /* ─── Load cycles on mount ───────────────────────────────────── */
  useEffect(() => { fetchCycles(); }, []);

  const fetchCycles = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/feedback-cycles`);
      if (res.data.success)
        setCycles(res.data.data.filter(c => c.status === "active" || c.status === "completed"));
    } catch { showToast("Failed to load cycles", "error"); }
    finally { setLoading(false); }
  };

  const fetchData = async (cycleId) => {
    setLoading(true);
    try {
      const [sRes, cRes] = await Promise.all([
        axios.get(`${API_BASE}/api/feedback-submissions/summary/${cycleId}`),
        axios.get(`${API_BASE}/api/feedback-submissions/cycle/${cycleId}`),
      ]);
      if (sRes.data.success) setSummary(sRes.data.data);
      if (cRes.data.success) setAllSubs(cRes.data.data);
    } catch { showToast("Failed to load report data", "error"); }
    finally { setLoading(false); }
  };

  const handleCycleSelect = (cycle) => {
    setSelectedCycle(cycle);
    setExpandedRow(null);
    setSearch("");
    setDeptFilter("all");
    setRatingFilter("all");
    fetchData(cycle._id);
  };

  /* ─── Competency averages for an employee ────────────────────── */
  const getCompAvgs = (empId) => {
    const subs = allSubs.filter(s =>
      String(s.revieweeId?._id || s.revieweeId) === String(empId)
    );
    if (!subs.length) return null;
    const keys = ["communication","leadership","technicalSkills","goalAchievement","innovation","teamwork"];
    const avgs = {};
    keys.forEach(k => {
      const vals = subs.map(s => s.competencies?.[k]).filter(v => typeof v === "number" && v > 0);
      avgs[k] = vals.length ? Math.round(vals.reduce((a,b)=>a+b,0)/vals.length) : 0;
    });
    return Object.values(avgs).some(v=>v>0) ? avgs : null;
  };

  /* ─── Reviewer type breakdown averages ──────────────────────── */
  const getTypeAvgs = (empId) => {
    const subs = allSubs.filter(s =>
      String(s.revieweeId?._id || s.revieweeId) === String(empId)
    );
    const grouped = {};
    subs.forEach(s => {
      if (!grouped[s.reviewerType]) grouped[s.reviewerType] = [];
      grouped[s.reviewerType].push(s.overallScore || 0);
    });
    const out = {};
    Object.entries(grouped).forEach(([type, scores]) => {
      out[type] = Math.round(scores.reduce((a,b)=>a+b,0)/scores.length);
    });
    return out;
  };

  /* ─── Filters ─────────────────────────────────────────────────── */
  const depts = ["all", ...new Set(summary.map(s=>s.department).filter(Boolean))];
  const filtered = summary.filter(row => {
    const matchSearch = !search ||
      row.employeeName?.toLowerCase().includes(search.toLowerCase()) ||
      row.department?.toLowerCase().includes(search.toLowerCase()) ||
      row.designation?.toLowerCase().includes(search.toLowerCase());
    const matchDept   = deptFilter === "all" || row.department === deptFilter;
    const matchRating = ratingFilter === "all" || getRatingInfo(row.aggregatedScore).label === ratingFilter;
    return matchSearch && matchDept && matchRating;
  });

  /* ─── Stats ───────────────────────────────────────────────────── */
  const completedCount = summary.filter(s=>s.allSubmitted).length;
  const scoreData      = summary.filter(s=>s.aggregatedScore>0);
  const avgScore       = scoreData.length
    ? Math.round(scoreData.reduce((a,b)=>a+b.aggregatedScore,0)/scoreData.length) : 0;
  const topPerformer   = [...scoreData].sort((a,b)=>b.aggregatedScore-a.aggregatedScore)[0];
  const totalReviews   = summary.reduce((a,s)=>a+(s.receivedReviews||0),0);

  /* ─── Export full Excel report ───────────────────────────────── */
  const exportExcel = () => {
    const rows = filtered.map((s,i) => {
      const comp = getCompAvgs(s.employeeId) || {};
      const types = getTypeAvgs(s.employeeId);
      return {
        "#": i+1,
        "Employee": s.employeeName,
        "Department": s.department,
        "Designation": s.designation,
        "Reviews Received": `${s.receivedReviews}/${s.expectedReviews}`,
        "Aggregated Score (%)": s.aggregatedScore||"—",
        "Rating": getRatingInfo(s.aggregatedScore).label,
        "Manager Score": types.manager||"—",
        "Peer Score": types.peer||"—",
        "Subordinate Score": types.subordinate||"—",
        "Self Score": types.self||"—",
        "Communication": comp.communication||"—",
        "Leadership": comp.leadership||"—",
        "Technical Skills": comp.technicalSkills||"—",
        "Goal Achievement": comp.goalAchievement||"—",
        "Innovation": comp.innovation||"—",
        "Teamwork": comp.teamwork||"—",
        "Status": s.allSubmitted ? "Complete" : "Pending",
      };
    });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Feedback Report");
    XLSX.writeFile(wb, `FeedbackReport_${selectedCycle?.cycleName||"report"}.xlsx`);
    showToast("Report exported successfully! ✅");
  };

  /* ─── Print individual card ──────────────────────────────────── */
  const handlePrintIndividual = (row) => {
    setPrintEmp(row);
    setTimeout(() => {
      window.print();
      setPrintEmp(null);
    }, 300);
  };

  /* ══════════════════════════════════════════════════════════════ */
  return (
    <div style={{ fontFamily:"'Segoe UI',sans-serif", minHeight:"100vh", background:"#f4f6fb", padding:"28px 32px" }}>
      <style>{`
        @keyframes spin    { to { transform:rotate(360deg); } }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:.5} }
        .rpt-row:hover     { background:#f8fafc !important; }
        .rpt-expand        { animation:fadeUp 0.25s ease both; }
        .rpt-table-wrap    { display:block !important; }
        .rpt-card-list     { display:none  !important; }
        .filter-select:focus { outline:none; border-color:#6366f1 !important; }
        .search-input:focus  { outline:none; border-color:#6366f1 !important; }
        .action-btn:hover  { background:#f1f5f9 !important; }

        /* Print styles */
        @media print {
          body * { visibility:hidden; }
          #print-report, #print-report * { visibility:visible; }
          #print-report { position:fixed;top:0;left:0;width:100%;padding:32px; }
        }

        @media(max-width:768px){
          .rpt-table-wrap { display:none  !important; }
          .rpt-card-list  { display:flex  !important; flex-direction:column; gap:12px; }
          .rpt-stats      { grid-template-columns:1fr 1fr !important; }
          .rpt-filters    { flex-direction:column !important; }
          .rpt-pad        { padding:16px !important; }
        }
      `}</style>

      {/* ── Toast ─────────────────────────────────────────────── */}
      {toast && (
        <div style={{ position:"fixed",top:20,right:20,zIndex:9999,
          background:toast.type==="error"?"#dc2626":"#059669",
          color:"#fff",padding:"12px 20px",borderRadius:10,fontWeight:600,
          fontSize:14,boxShadow:"0 8px 24px rgba(0,0,0,.15)",animation:"fadeUp .3s ease" }}>
          {toast.type==="error"?"❌":"✅"} {toast.msg}
        </div>
      )}

      {/* ── Header ────────────────────────────────────────────── */}
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:28,gap:12,flexWrap:"wrap" }}>
        <div>
          <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:4 }}>
            <div style={{ width:36,height:36,borderRadius:10,background:"#eff6ff",display:"flex",alignItems:"center",justifyContent:"center" }}>
              <FileText size={18} color="#2563eb" />
            </div>
            <h2 style={{ margin:0,fontSize:24,fontWeight:800,color:"#0f172a",letterSpacing:"-0.5px" }}>
              Feedback Reports
            </h2>
          </div>
          <p style={{ margin:"0 0 0 46px",color:"#64748b",fontSize:14 }}>
            Detailed performance reports · Manager 40% · Peers 25% · Subordinates 20% · Self 15%
          </p>
        </div>
        {selectedCycle && summary.length > 0 && (
          <div style={{ display:"flex",gap:8 }}>
            <button className="action-btn" onClick={exportExcel}
              style={{ display:"flex",alignItems:"center",gap:6,padding:"10px 16px",background:"#fff",border:"1.5px solid #e2e8f0",borderRadius:10,fontWeight:600,fontSize:13,cursor:"pointer",color:"#374151",transition:"background .15s" }}>
              <Download size={14}/> Export Excel
            </button>
          </div>
        )}
      </div>

      {/* ── Cycle Selector ────────────────────────────────────── */}
      <div style={{ background:"#fff",borderRadius:14,padding:"16px 20px",border:"1.5px solid #e2e8f0",marginBottom:24 }}>
        <label style={{ display:"block",fontSize:11,fontWeight:700,color:"#94a3b8",marginBottom:8,textTransform:"uppercase",letterSpacing:"0.8px" }}>
          Select Feedback Cycle
        </label>
        <select
          className="filter-select"
          value={selectedCycle?._id||""}
          onChange={e => {
            const c = cycles.find(cy=>cy._id===e.target.value);
            if (c) handleCycleSelect(c);
          }}
          style={{ width:"100%",padding:"10px 14px",border:"1.5px solid #e2e8f0",borderRadius:8,fontSize:14,color:"#0f172a",background:"#fff",cursor:"pointer",transition:"border-color .15s" }}>
          <option value="">— Select a cycle —</option>
          {cycles.map(c=>(
            <option key={c._id} value={c._id}>
              {c.cycleName} · {c.period} ({c.status})
            </option>
          ))}
        </select>
      </div>

      {/* ── Empty state ───────────────────────────────────────── */}
      {!selectedCycle && (
        <div style={{ background:"#fff",borderRadius:16,padding:"64px 24px",textAlign:"center",border:"1.5px solid #e2e8f0" }}>
          <div style={{ fontSize:52,marginBottom:12 }}>📋</div>
          <p style={{ color:"#374151",fontWeight:700,fontSize:17,margin:0 }}>Select a cycle to generate reports</p>
          <p style={{ color:"#94a3b8",fontSize:14,marginTop:6 }}>Competency breakdowns, reviewer scores & more</p>
        </div>
      )}

      {/* ── Loader ────────────────────────────────────────────── */}
      {selectedCycle && loading && (
        <div style={{ textAlign:"center",padding:60 }}>
          <div style={{ width:36,height:36,border:"3px solid #e2e8f0",borderTopColor:"#6366f1",borderRadius:"50%",animation:"spin 0.7s linear infinite",margin:"0 auto 12px" }}/>
          <p style={{ color:"#94a3b8",fontSize:14 }}>Generating report data...</p>
        </div>
      )}

      {selectedCycle && !loading && (
        <>
          {/* ── Stats row ──────────────────────────────────────── */}
          <div className="rpt-stats" style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:24 }}>
            {[
              { label:"Total Employees",  value:summary.length,                    color:"#2563eb", bg:"#eff6ff", icon:<Users size={18} color="#2563eb"/>,        sub:"In this cycle" },
              { label:"Reports Ready",    value:completedCount,                    color:"#059669", bg:"#ecfdf5", icon:<CheckCircle size={18} color="#059669"/>,  sub:"All reviews done" },
              { label:"Avg Score",        value:avgScore>0?`${avgScore}%`:"—",     color:"#7c3aed", bg:"#f5f3ff", icon:<Star size={18} color="#7c3aed"/>,          sub:getRatingInfo(avgScore).label },
              { label:"Top Performer",    value:topPerformer?`${topPerformer.aggregatedScore}%`:"—", color:"#0891b2", bg:"#ecfeff", icon:<Award size={18} color="#0891b2"/>, sub:topPerformer?.employeeName||"—" },
            ].map((s,i)=>(
              <div key={i} style={{ background:"#fff",borderRadius:12,padding:"16px 18px",border:"1.5px solid #e2e8f0" }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8 }}>
                  <p style={{ margin:0,fontSize:11,color:"#94a3b8",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.6px" }}>{s.label}</p>
                  <div style={{ width:32,height:32,borderRadius:8,background:s.bg,display:"flex",alignItems:"center",justifyContent:"center" }}>{s.icon}</div>
                </div>
                <p style={{ margin:0,fontSize:26,fontWeight:900,color:s.color,lineHeight:1 }}>{s.value}</p>
                <p style={{ margin:"4px 0 0",fontSize:11,color:"#94a3b8" }}>{s.sub}</p>
              </div>
            ))}
          </div>

          {/* ── Filters bar ────────────────────────────────────── */}
          {summary.length > 0 && (
            <div className="rpt-filters" style={{ display:"flex",gap:10,marginBottom:20,flexWrap:"wrap",alignItems:"center" }}>
              {/* Search */}
              <div style={{ flex:1,minWidth:200,position:"relative" }}>
                <Search size={14} style={{ position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:"#94a3b8" }}/>
                <input
                  className="search-input"
                  placeholder="Search employee, department..."
                  value={search}
                  onChange={e=>setSearch(e.target.value)}
                  style={{ width:"100%",padding:"10px 12px 10px 34px",border:"1.5px solid #e2e8f0",borderRadius:10,fontSize:13,color:"#0f172a",background:"#fff",boxSizing:"border-box",transition:"border-color .15s" }}
                />
              </div>
              {/* Dept filter */}
              <select className="filter-select" value={deptFilter} onChange={e=>setDeptFilter(e.target.value)}
                style={{ padding:"10px 14px",border:"1.5px solid #e2e8f0",borderRadius:10,fontSize:13,color:"#374151",background:"#fff",cursor:"pointer",minWidth:160,transition:"border-color .15s" }}>
                {depts.map(d=><option key={d} value={d}>{d==="all"?"All Departments":d}</option>)}
              </select>
              {/* Rating filter */}
              <select className="filter-select" value={ratingFilter} onChange={e=>setRatingFilter(e.target.value)}
                style={{ padding:"10px 14px",border:"1.5px solid #e2e8f0",borderRadius:10,fontSize:13,color:"#374151",background:"#fff",cursor:"pointer",minWidth:180,transition:"border-color .15s" }}>
                <option value="all">All Ratings</option>
                {["Outstanding","Exceeds Expectations","Meets Expectations","Needs Improvement","Unsatisfactory"].map(r=>(
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              {/* Result count */}
              <span style={{ fontSize:12,color:"#94a3b8",padding:"10px 8px",whiteSpace:"nowrap" }}>
                Showing {filtered.length} of {summary.length}
              </span>
            </div>
          )}

          {/* ── No results ─────────────────────────────────────── */}
          {summary.length === 0 ? (
            <div style={{ background:"#fff",borderRadius:16,padding:60,textAlign:"center",border:"1.5px solid #e2e8f0" }}>
              <div style={{ fontSize:44,marginBottom:12 }}>📭</div>
              <p style={{ color:"#374151",fontWeight:700 }}>No report data yet</p>
              <p style={{ color:"#94a3b8",fontSize:13 }}>Wait for reviewers to submit feedback</p>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ background:"#fff",borderRadius:16,padding:48,textAlign:"center",border:"1.5px solid #e2e8f0" }}>
              <div style={{ fontSize:40,marginBottom:10 }}>🔍</div>
              <p style={{ color:"#374151",fontWeight:700 }}>No matches found</p>
              <p style={{ color:"#94a3b8",fontSize:13 }}>Try adjusting your filters</p>
            </div>
          ) : (
            <>
              {/* ══ DESKTOP TABLE ══════════════════════════════ */}
              <div className="rpt-table-wrap" style={{ background:"#fff",borderRadius:16,border:"1.5px solid #e2e8f0",overflow:"hidden" }}>
                <table style={{ width:"100%",borderCollapse:"collapse",fontSize:13 }}>
                  <thead>
                    <tr style={{ background:"#f8fafc",borderBottom:"2px solid #e2e8f0" }}>
                      {["Employee","Department","Score","Reviewer Breakdown","Competency Highlights","Status","Actions",""].map(h=>(
                        <th key={h} style={{ padding:"14px 16px",textAlign:"left",fontWeight:700,color:"#64748b",fontSize:11,textTransform:"uppercase",letterSpacing:"0.6px",whiteSpace:"nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((row, i) => {
                      const ri         = getRatingInfo(row.aggregatedScore);
                      const compAvgs   = getCompAvgs(row.employeeId);
                      const typeAvgs   = getTypeAvgs(row.employeeId);
                      const empSubs    = row.submissions || [];
                      const isExpanded = expandedRow === row.employeeId;

                      // top 3 competencies
                      const topComps = compAvgs
                        ? Object.entries(compAvgs).sort((a,b)=>b[1]-a[1]).slice(0,3)
                        : [];

                      return (
                        <React.Fragment key={row.employeeId || i}>
                          <tr className="rpt-row"
                            onClick={() => setExpandedRow(isExpanded ? null : row.employeeId)}
                            style={{ borderBottom:"1px solid #f1f5f9",background:"#fff",cursor:"pointer",transition:"background .1s" }}>

                            {/* Employee */}
                            <td style={{ padding:"14px 16px" }}>
                              <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                                <div style={{ width:38,height:38,borderRadius:10,background:ri.bg,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,color:ri.color,fontSize:15,flexShrink:0 }}>
                                  {row.employeeName?.charAt(0)?.toUpperCase()||"?"}
                                </div>
                                <div>
                                  <p style={{ margin:0,fontWeight:700,color:"#0f172a",fontSize:14 }}>{row.employeeName||"—"}</p>
                                  <p style={{ margin:0,fontSize:11,color:"#94a3b8" }}>{row.designation||"—"}</p>
                                </div>
                              </div>
                            </td>

                            {/* Dept */}
                            <td style={{ padding:"14px 16px",color:"#64748b",fontSize:13 }}>{row.department||"—"}</td>

                            {/* Score ring */}
                            <td style={{ padding:"14px 16px" }}>
                              <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                                <ScoreRing score={row.aggregatedScore||0} size={56} stroke={5}/>
                                <div>
                                  <p style={{ margin:0,fontSize:11,fontWeight:700,color:ri.color }}>{ri.label}</p>
                                  <p style={{ margin:"2px 0 0",fontSize:11,color:"#94a3b8" }}>
                                    {row.receivedReviews}/{row.expectedReviews} reviews
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* Reviewer pills */}
                            <td style={{ padding:"14px 16px" }}>
                              <div style={{ display:"flex",flexDirection:"column",gap:4,minWidth:160 }}>
                                {Object.entries(typeAvgs).length === 0 ? (
                                  <span style={{ fontSize:11,color:"#94a3b8" }}>No data</span>
                                ) : Object.entries(typeAvgs).map(([type, score]) => {
                                  const rc = REVIEWER_COLORS[type] || REVIEWER_COLORS.peer;
                                  const s_ri = getRatingInfo(score);
                                  return (
                                    <div key={type} style={{ display:"flex",alignItems:"center",gap:6 }}>
                                      <span style={{ background:rc.bg,color:rc.color,padding:"2px 7px",borderRadius:5,fontSize:10,fontWeight:700,textTransform:"uppercase",minWidth:72,textAlign:"center" }}>
                                        {rc.label}
                                      </span>
                                      <span style={{ fontSize:12,fontWeight:800,color:s_ri.color,minWidth:30 }}>{score}%</span>
                                      <div style={{ flex:1,maxWidth:60 }}><ScoreBar score={score} color={s_ri.bar}/></div>
                                    </div>
                                  );
                                })}
                              </div>
                            </td>

                            {/* Top competencies */}
                            <td style={{ padding:"14px 16px" }}>
                              {topComps.length === 0 ? (
                                <span style={{ fontSize:11,color:"#94a3b8" }}>—</span>
                              ) : (
                                <div style={{ display:"flex",flexDirection:"column",gap:5 }}>
                                  {topComps.map(([key, val]) => {
                                    const c_ri = getRatingInfo(val);
                                    return (
                                      <div key={key} style={{ display:"flex",alignItems:"center",gap:6 }}>
                                        <span style={{ fontSize:12 }}>{COMPETENCY_ICONS[key]}</span>
                                        <span style={{ fontSize:11,color:"#374151",minWidth:90 }}>{COMPETENCY_LABELS[key]}</span>
                                        <span style={{ fontSize:12,fontWeight:700,color:c_ri.color }}>{val}%</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </td>

                            {/* Status */}
                            <td style={{ padding:"14px 16px" }}>
                              {row.nominations === "pending" ? (
                                <span style={{ background:"#fef3c7",color:"#92400e",fontWeight:700,padding:"4px 10px",borderRadius:20,fontSize:11,whiteSpace:"nowrap" }}>⚠️ Nominations Pending</span>
                              ) : row.allSubmitted ? (
                                <span style={{ background:"#ecfdf5",color:"#065f46",fontWeight:700,padding:"4px 10px",borderRadius:20,fontSize:11 }}>✅ Complete</span>
                              ) : (
                                <span style={{ background:"#fffbeb",color:"#92400e",fontWeight:700,padding:"4px 10px",borderRadius:20,fontSize:11 }}>⏳ In Progress</span>
                              )}
                            </td>

                            {/* Actions */}
                            <td style={{ padding:"14px 16px" }} onClick={e=>e.stopPropagation()}>
                              <button
                                onClick={() => handlePrintIndividual(row)}
                                title="Print individual report"
                                style={{ display:"flex",alignItems:"center",gap:4,padding:"6px 10px",background:"#f8fafc",border:"1.5px solid #e2e8f0",borderRadius:8,cursor:"pointer",fontSize:11,fontWeight:600,color:"#64748b" }}>
                                <Printer size={12}/> Print
                              </button>
                            </td>

                            {/* Expand toggle */}
                            <td style={{ padding:"14px 16px" }}>
                              <div style={{ width:28,height:28,borderRadius:8,background:isExpanded?"#eff6ff":"#f8fafc",display:"flex",alignItems:"center",justifyContent:"center",color:isExpanded?"#2563eb":"#94a3b8" }}>
                                {isExpanded ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                              </div>
                            </td>
                          </tr>

                          {/* ── Expanded Detail Report ─────────── */}
                          {isExpanded && (
                            <tr>
                              <td colSpan={8} style={{ padding:"0 16px 24px",background:"#f8fafc" }}>
                                <div className="rpt-expand" style={{ background:"#fff",borderRadius:14,border:"1.5px solid #e2e8f0",padding:24,marginTop:10 }}>

                                  {/* Employee header */}
                                  <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24,flexWrap:"wrap",gap:12 }}>
                                    <div style={{ display:"flex",alignItems:"center",gap:14 }}>
                                      <div style={{ width:52,height:52,borderRadius:14,background:ri.bg,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,color:ri.color,fontSize:20 }}>
                                        {row.employeeName?.charAt(0)?.toUpperCase()}
                                      </div>
                                      <div>
                                        <p style={{ margin:0,fontSize:18,fontWeight:800,color:"#0f172a" }}>{row.employeeName}</p>
                                        <p style={{ margin:"2px 0 0",fontSize:13,color:"#64748b" }}>{row.designation} · {row.department}</p>
                                      </div>
                                    </div>
                                    <div style={{ display:"flex",alignItems:"center",gap:16 }}>
                                      <ScoreRing score={row.aggregatedScore||0} size={80} stroke={7}/>
                                      <div>
                                        <p style={{ margin:0,fontSize:12,color:"#94a3b8",fontWeight:600 }}>OVERALL</p>
                                        <p style={{ margin:"2px 0 0",fontSize:14,fontWeight:700,color:ri.color }}>{ri.label}</p>
                                        <p style={{ margin:"2px 0 0",fontSize:11,color:"#94a3b8" }}>{row.receivedReviews}/{row.expectedReviews} reviews</p>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Reviewer breakdown cards */}
                                  <p style={{ margin:"0 0 12px",fontWeight:700,fontSize:14,color:"#0f172a" }}>
                                    Individual Reviewer Scores
                                    <span style={{ marginLeft:8,fontSize:12,fontWeight:500,color:"#94a3b8" }}>(Manager 40% · Peers 25% · Subordinates 20% · Self 15%)</span>
                                  </p>

                                  {empSubs.length === 0 ? (
                                    <p style={{ color:"#94a3b8",fontSize:13,padding:"10px 0 20px" }}>No submissions received yet</p>
                                  ) : (
                                    <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:12,marginBottom:24 }}>
                                      {empSubs.map((sub, si) => {
                                        const si_ri = getRatingInfo(sub.overallScore);
                                        const rc    = REVIEWER_COLORS[sub.reviewerType] || REVIEWER_COLORS.peer;
                                        const name  = sub.reviewerName || sub.reviewer || "Anonymous";
                                        return (
                                          <div key={si} style={{ background:"#f8fafc",borderRadius:12,padding:16,border:"1.5px solid #e2e8f0" }}>
                                            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10 }}>
                                              <span style={{ background:rc.bg,color:rc.color,padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:700,textTransform:"uppercase" }}>{rc.label}</span>
                                              <span style={{ fontSize:11,color:"#94a3b8" }}>{rc.weight}% weight</span>
                                            </div>
                                            <p style={{ margin:"0 0 8px",fontSize:13,fontWeight:600,color:"#374151" }}>{name}</p>
                                            <div style={{ display:"flex",alignItems:"baseline",gap:3,marginBottom:6 }}>
                                              <span style={{ fontSize:28,fontWeight:900,color:si_ri.color,lineHeight:1 }}>{sub.overallScore}</span>
                                              <span style={{ fontSize:13,color:"#94a3b8" }}>%</span>
                                            </div>
                                            <span style={{ fontSize:11,color:si_ri.color,fontWeight:600 }}>{si_ri.label}</span>
                                            <div style={{ background:"#e2e8f0",borderRadius:99,height:5,overflow:"hidden",marginTop:10 }}>
                                              <div style={{ width:`${Math.min(sub.overallScore,100)}%`,height:"100%",background:si_ri.bar,borderRadius:99 }}/>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}

                                  {/* Weighted aggregate banner */}
                                  {row.aggregatedScore > 0 && (
                                    <div style={{ background:ri.bg,border:`1.5px solid ${ri.color}30`,borderRadius:12,padding:"14px 18px",marginBottom:24,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12 }}>
                                      <div>
                                        <p style={{ margin:0,fontSize:11,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.6px" }}>Weighted Aggregate Score</p>
                                        <p style={{ margin:"2px 0 0",fontSize:11,color:"#94a3b8" }}>Manager×40% + Peers×25% + Subordinates×20% + Self×15%</p>
                                      </div>
                                      <div style={{ textAlign:"right" }}>
                                        <p style={{ margin:0,fontSize:36,fontWeight:900,color:ri.color,lineHeight:1 }}>{row.aggregatedScore}%</p>
                                        <p style={{ margin:"2px 0 0",fontSize:12,fontWeight:700,color:ri.color }}>{ri.label}</p>
                                      </div>
                                    </div>
                                  )}

                                  {/* Full competency breakdown */}
                                  {compAvgs && (
                                    <>
                                      <p style={{ margin:"0 0 14px",fontWeight:700,fontSize:14,color:"#0f172a" }}>Competency Breakdown</p>
                                      <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:12,marginBottom:24 }}>
                                        {Object.entries(compAvgs).map(([key, val]) => {
                                          const c_ri = getRatingInfo(val);
                                          return (
                                            <div key={key} style={{ background:"#f8fafc",borderRadius:10,padding:"14px 16px",border:"1.5px solid #e2e8f0" }}>
                                              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10 }}>
                                                <div style={{ display:"flex",alignItems:"center",gap:7 }}>
                                                  <span style={{ fontSize:16 }}>{COMPETENCY_ICONS[key]}</span>
                                                  <span style={{ fontSize:12,fontWeight:700,color:"#374151" }}>{COMPETENCY_LABELS[key]}</span>
                                                </div>
                                                <span style={{ fontSize:15,fontWeight:900,color:c_ri.color }}>{val}%</span>
                                              </div>
                                              <ScoreBar score={val} color={c_ri.bar}/>
                                              <p style={{ margin:"6px 0 0",fontSize:10,fontWeight:600,color:c_ri.color }}>{c_ri.label}</p>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </>
                                  )}

                                  {/* Radar-style text summary */}
                                  {compAvgs && (() => {
                                    const sorted = Object.entries(compAvgs).sort((a,b)=>b[1]-a[1]);
                                    const best   = sorted[0];
                                    const worst  = sorted[sorted.length-1];
                                    return (
                                      <div style={{ background:"#f8fafc",borderRadius:12,padding:"16px 20px",border:"1.5px solid #e2e8f0" }}>
                                        <p style={{ margin:"0 0 12px",fontWeight:700,fontSize:13,color:"#0f172a" }}>📝 Report Summary</p>
                                        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
                                          <div style={{ background:"#ecfdf5",borderRadius:10,padding:"12px 14px" }}>
                                            <p style={{ margin:"0 0 4px",fontSize:10,fontWeight:700,color:"#059669",textTransform:"uppercase",letterSpacing:"0.5px" }}>💪 Strongest Competency</p>
                                            <p style={{ margin:0,fontWeight:700,color:"#0f172a",fontSize:13 }}>{COMPETENCY_ICONS[best[0]]} {COMPETENCY_LABELS[best[0]]}</p>
                                            <p style={{ margin:"2px 0 0",fontSize:12,color:"#059669",fontWeight:600 }}>{best[1]}% · {getRatingInfo(best[1]).label}</p>
                                          </div>
                                          <div style={{ background:"#fff7ed",borderRadius:10,padding:"12px 14px" }}>
                                            <p style={{ margin:"0 0 4px",fontSize:10,fontWeight:700,color:"#ea580c",textTransform:"uppercase",letterSpacing:"0.5px" }}>📈 Growth Area</p>
                                            <p style={{ margin:0,fontWeight:700,color:"#0f172a",fontSize:13 }}>{COMPETENCY_ICONS[worst[0]]} {COMPETENCY_LABELS[worst[0]]}</p>
                                            <p style={{ margin:"2px 0 0",fontSize:12,color:"#ea580c",fontWeight:600 }}>{worst[1]}% · {getRatingInfo(worst[1]).label}</p>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })()}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* ══ MOBILE CARDS ════════════════════════════════ */}
              <div className="rpt-card-list">
                {filtered.map(row => {
                  const ri       = getRatingInfo(row.aggregatedScore);
                  const empSubs  = row.submissions || [];
                  const typeAvgs = getTypeAvgs(row.employeeId);
                  return (
                    <div key={row.employeeId} style={{ border:"1.5px solid #e2e8f0",borderRadius:14,background:"#fff",overflow:"hidden" }}>
                      {/* Card header */}
                      <div className="rpt-pad" style={{ padding:16,display:"flex",justifyContent:"space-between",alignItems:"center" }}
                        onClick={()=>setExpandedRow(expandedRow===row.employeeId?null:row.employeeId)}>
                        <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                          <div style={{ width:40,height:40,borderRadius:10,background:ri.bg,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,color:ri.color,fontSize:16 }}>
                            {row.employeeName?.charAt(0)?.toUpperCase()}
                          </div>
                          <div>
                            <p style={{ margin:0,fontWeight:700,color:"#0f172a" }}>{row.employeeName}</p>
                            <p style={{ margin:0,fontSize:12,color:"#94a3b8" }}>{row.department} · {row.designation}</p>
                          </div>
                        </div>
                        <ScoreRing score={row.aggregatedScore||0} size={52} stroke={5}/>
                      </div>
                      {/* Reviewer pills */}
                      <div style={{ padding:"0 16px 14px",display:"flex",gap:6,flexWrap:"wrap" }}>
                        {Object.entries(typeAvgs).map(([type, score]) => {
                          const rc = REVIEWER_COLORS[type]||REVIEWER_COLORS.peer;
                          return (
                            <div key={type} style={{ background:rc.bg,borderRadius:6,padding:"3px 9px" }}>
                              <span style={{ fontSize:11,fontWeight:700,color:rc.color }}>{rc.label} {score}%</span>
                            </div>
                          );
                        })}
                        <span style={{ fontSize:11,color:row.allSubmitted?"#059669":"#d97706",fontWeight:700,marginLeft:"auto" }}>
                          {row.allSubmitted?"✅ Complete":"⏳ Pending"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}

      {/* ── Hidden print template ─────────────────────────────── */}
      {printEmp && (() => {
        const ri       = getRatingInfo(printEmp.aggregatedScore);
        const compAvgs = getCompAvgs(printEmp.employeeId);
        const typeAvgs = getTypeAvgs(printEmp.employeeId);
        return (
          <div id="print-report" style={{ position:"fixed",top:-9999,left:-9999 }}>
            <h2>{printEmp.employeeName} — 360° Feedback Report</h2>
            <p>{printEmp.designation} · {printEmp.department}</p>
            <p>Overall Score: {printEmp.aggregatedScore}% ({ri.label})</p>
            <p>Reviews: {printEmp.receivedReviews}/{printEmp.expectedReviews}</p>
            <h3>Reviewer Scores</h3>
            {Object.entries(typeAvgs).map(([t,s])=><p key={t}>{REVIEWER_COLORS[t]?.label||t}: {s}%</p>)}
            {compAvgs && (<><h3>Competency Scores</h3>{Object.entries(compAvgs).map(([k,v])=><p key={k}>{COMPETENCY_LABELS[k]}: {v}%</p>)}</>)}
            <p style={{ marginTop:20,fontSize:11,color:"#666" }}>Generated: {new Date().toLocaleDateString()} · {selectedCycle?.cycleName}</p>
          </div>
        );
      })()}
    </div>
  );
}