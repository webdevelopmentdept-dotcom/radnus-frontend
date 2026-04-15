import React, { useState, useEffect } from "react";
import axios from "axios";
import { CheckCircle, Users, Star, ChevronDown, ChevronUp, Download, TrendingUp } from "lucide-react";
import * as XLSX from "xlsx";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const getRatingInfo = (score) => {
  if (!score || score === 0) return { label: "No Data",              color: "#9ca3af", bg: "#f3f4f6", bar: "#d1d5db" };
  if (score >= 90)           return { label: "Outstanding",          color: "#059669", bg: "#ecfdf5", bar: "#10b981" };
  if (score >= 75)           return { label: "Exceeds Expectations", color: "#2563eb", bg: "#eff6ff", bar: "#3b82f6" };
  if (score >= 60)           return { label: "Meets Expectations",   color: "#d97706", bg: "#fffbeb", bar: "#f59e0b" };
  if (score >= 45)           return { label: "Needs Improvement",    color: "#ea580c", bg: "#fff7ed", bar: "#f97316" };
  return                            { label: "Unsatisfactory",       color: "#dc2626", bg: "#fef2f2", bar: "#ef4444" };
};

const REVIEWER_COLORS = {
  manager:     { bg: "#ede9fe", color: "#7c3aed", label: "Manager",     weight: "40%" },
  peer:        { bg: "#dbeafe", color: "#1d4ed8", label: "Peer",        weight: "25%" },
  subordinate: { bg: "#d1fae5", color: "#065f46", label: "Subordinate", weight: "20%" },
  self:        { bg: "#fef3c7", color: "#92400e", label: "Self",        weight: "15%" },
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

export default function FeedbackSubmissions() {
  const [cycles, setCycles]           = useState([]);
  const [selectedCycle, setSelectedCycle] = useState(null);
  const [summary, setSummary]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [expandedRow, setExpandedRow] = useState(null);
  const [toast, setToast]             = useState(null);

  useEffect(() => { fetchCycles(); }, []);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchCycles = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/feedback-cycles`);
      if (res.data.success)
        setCycles(res.data.data.filter(c => c.status === "active" || c.status === "completed"));
    } catch { showToast("Failed to load cycles", "error"); }
    finally { setLoading(false); }
  };

  const fetchSummary = async (cycleId) => {
    setLoading(true);
    try {
      // ✅ FIX: Only use summary API — it now includes submissions per employee
      const sRes = await axios.get(`${API_BASE}/api/feedback-submissions/summary/${cycleId}`);
      if (sRes.data.success) setSummary(sRes.data.data);
    } catch { showToast("Failed to load feedback data", "error"); }
    finally { setLoading(false); }
  };

  const handleSelectCycle = (cycle) => {
    setSelectedCycle(cycle);
    setExpandedRow(null);
    fetchSummary(cycle._id);
  };

  // ✅ FIX: Use submissions from summary data directly — no separate /cycle API needed
  const getEmpSubs = (empId) => {
    const row = summary.find(s => String(s.employeeId) === String(empId));
    return row?.submissions || [];
  };

  // ✅ Competency averages — still needs /cycle API or from summary
  // We keep a separate submissions state for competency detail
  const [allSubmissions, setAllSubmissions] = useState([]);

  const fetchAllSubmissions = async (cycleId) => {
    try {
      const res = await axios.get(`${API_BASE}/api/feedback-submissions/cycle/${cycleId}`);
      if (res.data.success) setAllSubmissions(res.data.data);
    } catch { /* silent */ }
  };

  const handleSelectCycleFull = (cycle) => {
    setSelectedCycle(cycle);
    setExpandedRow(null);
    fetchSummary(cycle._id);
    fetchAllSubmissions(cycle._id); // for competency breakdown
  };

  const getCompAvgs = (empId) => {
    const subs = allSubmissions.filter(s =>
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

  const exportExcel = () => {
    const rows = summary.map((s,i) => ({
      "#": i+1, "Employee": s.employeeName, "Department": s.department,
      "Designation": s.designation,
      "Reviews Received": `${s.receivedReviews}/${s.expectedReviews}`,
      "Aggregated Score": s.aggregatedScore||"—",
      "Rating": getRatingInfo(s.aggregatedScore).label,
      "Status": s.allSubmitted ? "Complete":"Pending",
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "360 Feedback");
    XLSX.writeFile(wb, `360Feedback_${selectedCycle?.cycleName||"report"}.xlsx`);
    showToast("Excel exported! ✅");
  };

  const completedCount = summary.filter(s=>s.allSubmitted).length;
  const avgScoreData   = summary.filter(s=>s.aggregatedScore>0);
  const avgScore       = avgScoreData.length
    ? Math.round(avgScoreData.reduce((a,b)=>a+b.aggregatedScore,0)/avgScoreData.length) : 0;

  // ✅ Total reviews count from summary
  const totalReviews = summary.reduce((acc, s) => acc + (s.receivedReviews || 0), 0);

  return (
    <div style={{ fontFamily:"'Segoe UI',sans-serif", minHeight:"100vh", background:"#f4f6fb", padding:"28px 32px" }}>
      <style>{`
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .fb-row:hover { background:#f8fafc !important; }
        .fb-expand { animation: fadeUp 0.25s ease both; }
        .fs-table-wrap { display:block !important; }
        .fs-card-list  { display:none  !important; }
        @media(max-width:768px){
          .fs-table-wrap{ display:none  !important; }
          .fs-card-list { display:flex  !important; flex-direction:column; gap:12px; padding:12px; }
          .fs-stats { grid-template-columns:1fr 1fr !important; }
          .fb-pad { padding:16px !important; }
        }
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position:"fixed",top:20,right:20,zIndex:9999,background:toast.type==="error"?"#dc2626":"#059669",color:"#fff",padding:"12px 20px",borderRadius:10,fontWeight:600,fontSize:14,boxShadow:"0 8px 24px rgba(0,0,0,.15)" }}>
          {toast.type==="error"?"❌":"✅"} {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:28,gap:12,flexWrap:"wrap" }}>
        <div>
          <h2 style={{ margin:0,fontSize:24,fontWeight:800,color:"#0f172a",letterSpacing:"-0.5px" }}>360° Feedback Results</h2>
          <p style={{ margin:"4px 0 0",color:"#64748b",fontSize:14 }}>Aggregated scores · Manager 40% · Peers 25% · Subordinates 20% · Self 15%</p>
        </div>
        {selectedCycle && summary.length>0 && (
          <button onClick={exportExcel} style={{ display:"flex",alignItems:"center",gap:6,padding:"10px 18px",background:"#fff",border:"1.5px solid #e2e8f0",borderRadius:10,fontWeight:600,fontSize:13,cursor:"pointer",color:"#374151" }}>
            <Download size={14}/> Export Excel
          </button>
        )}
      </div>

      {/* Cycle Selector */}
      <div style={{ background:"#fff",borderRadius:14,padding:"16px 20px",border:"1.5px solid #e2e8f0",marginBottom:24 }}>
        <label style={{ display:"block",fontSize:11,fontWeight:700,color:"#94a3b8",marginBottom:8,textTransform:"uppercase",letterSpacing:"0.8px" }}>Select Feedback Cycle</label>
        <select
          value={selectedCycle?._id||""}
          onChange={e=>{
            const c=cycles.find(cy=>cy._id===e.target.value);
            if(c) handleSelectCycleFull(c); // ✅ use full fetch
          }}
          style={{ width:"100%",padding:"10px 14px",border:"1.5px solid #e2e8f0",borderRadius:8,fontSize:14,color:"#0f172a",background:"#fff",outline:"none",cursor:"pointer" }}>
          <option value="">— Select a cycle —</option>
          {cycles.map(c=><option key={c._id} value={c._id}>{c.cycleName} · {c.period} ({c.status})</option>)}
        </select>
      </div>

      {/* Empty state */}
      {!selectedCycle && (
        <div style={{ background:"#fff",borderRadius:16,padding:"60px 24px",textAlign:"center",border:"1.5px solid #e2e8f0" }}>
          <div style={{ fontSize:48,marginBottom:12 }}>📊</div>
          <p style={{ color:"#374151",fontWeight:700,fontSize:16,margin:0 }}>Select a cycle to view results</p>
          <p style={{ color:"#94a3b8",fontSize:13,marginTop:6 }}>All reviewer scores will appear here</p>
        </div>
      )}

      {/* Loading */}
      {selectedCycle && loading && (
        <div style={{ textAlign:"center",padding:60 }}>
          <div style={{ width:36,height:36,border:"3px solid #e2e8f0",borderTopColor:"#6366f1",borderRadius:"50%",animation:"spin 0.7s linear infinite",margin:"0 auto 12px" }}/>
          <p style={{ color:"#94a3b8",fontSize:14 }}>Loading feedback data...</p>
        </div>
      )}

      {selectedCycle && !loading && (
        <>
          {/* Stats */}
          <div className="fs-stats" style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:24 }}>
            {[
              { label:"Total Employees", value:summary.length,              color:"#2563eb", bg:"#eff6ff", icon:<Users size={18} color="#2563eb"/>,       sub:"In this cycle" },
              { label:"Fully Reviewed",  value:completedCount,              color:"#059669", bg:"#ecfdf5", icon:<CheckCircle size={18} color="#059669"/>, sub:"All reviews done" },
              { label:"Avg Score",       value:avgScore>0?`${avgScore}%`:"—", color:"#7c3aed", bg:"#f5f3ff", icon:<Star size={18} color="#7c3aed"/>,       sub:getRatingInfo(avgScore).label },
              { label:"Total Reviews",   value:totalReviews,                color:"#0891b2", bg:"#ecfeff", icon:<TrendingUp size={18} color="#0891b2"/>,   sub:"Across all types" },
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

          {/* Table */}
          {summary.length===0 ? (
            <div style={{ background:"#fff",borderRadius:16,padding:60,textAlign:"center",border:"1.5px solid #e2e8f0" }}>
              <div style={{ fontSize:44,marginBottom:12 }}>📭</div>
              <p style={{ color:"#374151",fontWeight:700 }}>No feedback data yet</p>
              <p style={{ color:"#94a3b8",fontSize:13 }}>Complete nominations and wait for reviewers to submit</p>
            </div>
          ) : (
            <>
              {/* Desktop */}
              <div className="fs-table-wrap" style={{ background:"#fff",borderRadius:16,border:"1.5px solid #e2e8f0",overflow:"hidden" }}>
                <table style={{ width:"100%",borderCollapse:"collapse",fontSize:13 }}>
                  <thead>
                    <tr style={{ background:"#f8fafc",borderBottom:"2px solid #e2e8f0" }}>
                      {["Employee","Dept","Reviews","Score","Reviewer Breakdown","Status",""].map(h=>(
                        <th key={h} style={{ padding:"14px 16px",textAlign:"left",fontWeight:700,color:"#64748b",fontSize:11,textTransform:"uppercase",letterSpacing:"0.6px",whiteSpace:"nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {summary.map((row,i)=>{
                      const ri         = getRatingInfo(row.aggregatedScore);
                      const compAvgs   = getCompAvgs(row.employeeId);
                      // ✅ FIX: get submissions from summary row directly
                      const empSubs    = row.submissions || [];
                      const isExpanded = expandedRow === row.employeeId;

                      return (
                        <React.Fragment key={row.employeeId||i}>
                          <tr className="fb-row" onClick={()=>setExpandedRow(isExpanded?null:row.employeeId)}
                            style={{ borderBottom:"1px solid #f1f5f9",background:"#fff",cursor:"pointer" }}>

                            {/* Employee */}
                            <td style={{ padding:"14px 16px" }}>
                              <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                                <div style={{ width:36,height:36,borderRadius:10,background:ri.bg,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,color:ri.color,fontSize:14,flexShrink:0 }}>
                                  {row.employeeName?.charAt(0)?.toUpperCase()||"?"}
                                </div>
                                <div>
                                  <p style={{ margin:0,fontWeight:700,color:"#0f172a",fontSize:14 }}>{row.employeeName||"—"}</p>
                                  <p style={{ margin:0,fontSize:11,color:"#94a3b8" }}>{row.designation||"—"}</p>
                                </div>
                              </div>
                            </td>

                            {/* Dept */}
                            <td style={{ padding:"14px 16px",color:"#64748b" }}>{row.department||"—"}</td>

                            {/* Reviews */}
                            <td style={{ padding:"14px 16px" }}>
                              <div style={{ display:"flex",alignItems:"center",gap:4 }}>
                                <span style={{ fontWeight:700,color:row.receivedReviews>=row.expectedReviews?"#059669":"#d97706",fontSize:15 }}>{row.receivedReviews}</span>
                                <span style={{ color:"#94a3b8",fontSize:12 }}>/ {row.expectedReviews}</span>
                              </div>
                              <div style={{ width:60,height:4,background:"#e2e8f0",borderRadius:99,marginTop:4,overflow:"hidden" }}>
                                <div style={{ width:`${Math.min((row.receivedReviews/(row.expectedReviews||1))*100,100)}%`,height:"100%",background:row.receivedReviews>=row.expectedReviews?"#10b981":"#f59e0b",borderRadius:99 }}/>
                              </div>
                            </td>

                            {/* Score */}
                            <td style={{ padding:"14px 16px" }}>
                              {row.aggregatedScore>0 ? (
                                <div>
                                  <div style={{ display:"flex",alignItems:"baseline",gap:3 }}>
                                    <span style={{ fontWeight:900,fontSize:20,color:ri.color }}>{row.aggregatedScore}</span>
                                    <span style={{ fontSize:12,color:"#94a3b8" }}>%</span>
                                  </div>
                                  <span style={{ fontSize:11,color:ri.color,fontWeight:600 }}>{ri.label}</span>
                                </div>
                              ) : (
                                <span style={{ color:"#cbd5e1",fontSize:18,fontWeight:700 }}>—</span>
                              )}
                            </td>

                            {/* Reviewer Breakdown pills */}
                            <td style={{ padding:"14px 16px" }}>
                              <div style={{ display:"flex",gap:4,flexWrap:"wrap" }}>
                                {empSubs.length===0 ? (
                                  <span style={{ fontSize:11,color:"#94a3b8" }}>No submissions</span>
                                ) : empSubs.map((sub,si)=>{
                                  const rc=REVIEWER_COLORS[sub.reviewerType]||REVIEWER_COLORS.peer;
                                  return (
                                    <div key={si} style={{ background:rc.bg,borderRadius:6,padding:"3px 8px",display:"flex",alignItems:"center",gap:4 }}>
                                      <span style={{ fontSize:10,fontWeight:700,color:rc.color,textTransform:"uppercase" }}>{rc.label}</span>
                                      <span style={{ fontSize:12,fontWeight:900,color:rc.color }}>{sub.overallScore}%</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </td>

                            {/* Status */}
                            <td style={{ padding:"14px 16px" }}>
                              {row.nominations==="pending" ? (
                                <span style={{ background:"#fef3c7",color:"#92400e",fontWeight:700,padding:"4px 10px",borderRadius:20,fontSize:11,whiteSpace:"nowrap" }}>⚠️ Nominations Pending</span>
                              ) : row.allSubmitted ? (
                                <span style={{ background:"#ecfdf5",color:"#065f46",fontWeight:700,padding:"4px 10px",borderRadius:20,fontSize:11 }}>✅ Complete</span>
                              ) : (
                                <span style={{ background:"#fffbeb",color:"#92400e",fontWeight:700,padding:"4px 10px",borderRadius:20,fontSize:11 }}>⏳ In Progress</span>
                              )}
                            </td>

                            {/* Toggle */}
                            <td style={{ padding:"14px 16px" }}>
                              <div style={{ width:28,height:28,borderRadius:8,background:isExpanded?"#eff6ff":"#f8fafc",display:"flex",alignItems:"center",justifyContent:"center",color:isExpanded?"#2563eb":"#94a3b8" }}>
                                {isExpanded?<ChevronUp size={14}/>:<ChevronDown size={14}/>}
                              </div>
                            </td>
                          </tr>

                          {/* Expanded Detail */}
                          {isExpanded && (
                            <tr>
                              <td colSpan={7} style={{ padding:"0 16px 20px",background:"#f8fafc" }}>
                                <div className="fb-expand" style={{ background:"#fff",borderRadius:14,border:"1.5px solid #e2e8f0",padding:24,marginTop:10 }}>

                                  {/* Individual Reviewer Score Cards */}
                                  <p style={{ margin:"0 0 14px",fontWeight:700,fontSize:14,color:"#0f172a" }}>
                                    Individual Reviewer Scores
                                    <span style={{ marginLeft:8,fontSize:12,fontWeight:500,color:"#94a3b8" }}>(Manager 40% · Peers 25% · Subordinates 20% · Self 15%)</span>
                                  </p>

                                  {empSubs.length===0 ? (
                                    <p style={{ color:"#94a3b8",fontSize:13,padding:"10px 0 20px" }}>No submissions received yet</p>
                                  ) : (
                                    <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:12,marginBottom:24 }}>
                                      {empSubs.map((sub,si)=>{
                                        const si_ri = getRatingInfo(sub.overallScore);
                                        const rc    = REVIEWER_COLORS[sub.reviewerType]||REVIEWER_COLORS.peer;
                                        const name  = sub.reviewerName||sub.reviewer||"Anonymous";
                                        return (
                                          <div key={si} style={{ background:"#f8fafc",borderRadius:12,padding:16,border:"1.5px solid #e2e8f0" }}>
                                            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10 }}>
                                              <span style={{ background:rc.bg,color:rc.color,padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:700,textTransform:"uppercase" }}>{rc.label}</span>
                                              <span style={{ fontSize:11,color:"#94a3b8" }}>{rc.weight} weight</span>
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

                                  {/* Weighted Aggregate */}
                                  {row.aggregatedScore>0 && (
                                    <div style={{ background:getRatingInfo(row.aggregatedScore).bg,border:`1.5px solid ${getRatingInfo(row.aggregatedScore).color}30`,borderRadius:12,padding:"14px 18px",marginBottom:24,display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                                      <div>
                                        <p style={{ margin:0,fontSize:11,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.6px" }}>Weighted Aggregate Score</p>
                                        <p style={{ margin:"2px 0 0",fontSize:11,color:"#94a3b8" }}>Manager×40% + Peers×25% + Subordinates×20% + Self×15%</p>
                                      </div>
                                      <div style={{ textAlign:"right" }}>
                                        <p style={{ margin:0,fontSize:36,fontWeight:900,color:getRatingInfo(row.aggregatedScore).color,lineHeight:1 }}>{row.aggregatedScore}%</p>
                                        <p style={{ margin:"2px 0 0",fontSize:12,fontWeight:700,color:getRatingInfo(row.aggregatedScore).color }}>{getRatingInfo(row.aggregatedScore).label}</p>
                                      </div>
                                    </div>
                                  )}

                                  {/* Competency Breakdown */}
                                  {compAvgs && (
                                    <>
                                      <p style={{ margin:"0 0 14px",fontWeight:700,fontSize:14,color:"#0f172a" }}>Competency Breakdown (Averages across all reviewers)</p>
                                      <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(190px,1fr))",gap:10 }}>
                                        {Object.entries(compAvgs).map(([key,val])=>{
                                          const c_ri=getRatingInfo(val);
                                          return (
                                            <div key={key} style={{ background:"#f8fafc",borderRadius:10,padding:"12px 14px",border:"1.5px solid #e2e8f0" }}>
                                              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8 }}>
                                                <div style={{ display:"flex",alignItems:"center",gap:6 }}>
                                                  <span style={{ fontSize:14 }}>{COMPETENCY_ICONS[key]}</span>
                                                  <span style={{ fontSize:12,fontWeight:600,color:"#374151" }}>{COMPETENCY_LABELS[key]}</span>
                                                </div>
                                                <span style={{ fontSize:14,fontWeight:800,color:c_ri.color }}>{val}%</span>
                                              </div>
                                              <div style={{ background:"#e2e8f0",borderRadius:99,height:6,overflow:"hidden" }}>
                                                <div style={{ width:`${Math.min(val,100)}%`,height:"100%",background:c_ri.bar,borderRadius:99 }}/>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </>
                                  )}
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

              {/* Mobile Cards */}
              <div className="fs-card-list">
                {summary.map(row=>{
                  const ri      = getRatingInfo(row.aggregatedScore);
                  const empSubs = row.submissions || []; // ✅ FIX
                  return (
                    <div key={row.employeeId} style={{ border:"1.5px solid #e2e8f0",borderRadius:14,padding:16,background:"#fff" }}>
                      <div style={{ display:"flex",justifyContent:"space-between",marginBottom:10 }}>
                        <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                          <div style={{ width:38,height:38,borderRadius:10,background:ri.bg,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,color:ri.color,fontSize:15 }}>
                            {row.employeeName?.charAt(0)?.toUpperCase()}
                          </div>
                          <div>
                            <p style={{ margin:0,fontWeight:700,color:"#0f172a" }}>{row.employeeName}</p>
                            <p style={{ margin:0,fontSize:12,color:"#94a3b8" }}>{row.department}</p>
                          </div>
                        </div>
                        <span style={{ fontSize:24,fontWeight:900,color:ri.color }}>{row.aggregatedScore>0?`${row.aggregatedScore}%`:"—"}</span>
                      </div>
                      <div style={{ display:"flex",gap:4,flexWrap:"wrap",marginBottom:10 }}>
                        {empSubs.map((sub,si)=>{
                          const rc=REVIEWER_COLORS[sub.reviewerType]||REVIEWER_COLORS.peer;
                          return <div key={si} style={{ background:rc.bg,borderRadius:6,padding:"3px 8px" }}><span style={{ fontSize:11,fontWeight:700,color:rc.color }}>{rc.label} {sub.overallScore}%</span></div>;
                        })}
                      </div>
                      <div style={{ display:"flex",justifyContent:"space-between",fontSize:12,color:"#94a3b8" }}>
                        <span>Reviews: {row.receivedReviews}/{row.expectedReviews}</span>
                        <span style={{ color:row.allSubmitted?"#059669":"#d97706",fontWeight:600 }}>
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
    </div>
  );
}