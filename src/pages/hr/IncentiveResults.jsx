import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { Download, Users, TrendingUp, CheckCircle, DollarSign } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const inputStyle = {
  width:"100%", padding:"9px 12px", border:"1px solid #d1d5db",
  borderRadius:8, fontSize:13, color:"#1a1a2e", background:"#fff",
  boxSizing:"border-box", outline:"none",
};
const labelStyle = { display:"block", fontSize:12, fontWeight:700, color:"#374151", marginBottom:6 };

// ── Core slab calculator ──────────────────────────────────────────────────────
function calcIncentive(plan, finalScore, salary=0) {
  if (!plan) return { amount:0, slabLabel:"No Plan Matched" };
  const score = Math.round(finalScore||0);
  const slab  = (plan.slabs||[]).find(s => score >= s.min_score && score <= s.max_score);
  if (!slab || slab.type==="none") return { amount:0, slabLabel:`${score}% → No Bonus` };
  const amount = slab.type==="percentage"
    ? Math.round((slab.value/100)*salary)
    : slab.value;
  return {
    amount,
    slabLabel: `${score}% → ${slab.type==="percentage" ? `${slab.value}% of salary` : `₹${Number(slab.value).toLocaleString("en-IN")}`}`,
  };
}

const STATUS_META = {
  pending:  { label:"Pending",  color:"#d97706", bg:"#fffbeb" },
  approved: { label:"Approved", color:"#16a34a", bg:"#f0fdf4" },
  paid:     { label:"Paid",     color:"#2563eb", bg:"#eff6ff" },
};

export default function IncentiveResults() {
  const [results,  setResults]  = useState([]);
  const [plans,    setPlans]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [toast,    setToast]    = useState(null);
  const [bulkBusy, setBulkBusy] = useState(false);

  // filters
  const [fStatus, setFStatus] = useState("All");
  const [fDept,   setFDept]   = useState("All");
  const [fPeriod, setFPeriod] = useState("All");

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [rRes, pRes] = await Promise.all([
        axios.get(`${API_BASE}/api/incentive-results`),
        axios.get(`${API_BASE}/api/incentive-plans`),
      ]);
      setResults(rRes.data?.data || rRes.data || []);
      setPlans(pRes.data?.data   || pRes.data || []);
    } catch { showToast("Failed to load","error"); }
    finally   { setLoading(false); }
  };

  const showToast = (msg, type="success") => {
    setToast({msg,type}); setTimeout(()=>setToast(null),3000);
  };

  // options
  const depts   = useMemo(()=>["All",...new Set(results.map(r=>r.employee_id?.department).filter(Boolean))]  ,[results]);
  const periods = useMemo(()=>["All",...new Set(results.map(r=>r.cycle_period).filter(Boolean))].sort((a,b)=>b.localeCompare(a)),[results]);

  const filtered = useMemo(()=> results.filter(r=>{
    if (fStatus!=="All" && r.status!==fStatus.toLowerCase()) return false;
    if (fDept  !=="All" && r.employee_id?.department!==fDept) return false;
    if (fPeriod!=="All" && r.cycle_period!==fPeriod)          return false;
    return true;
  }),[results,fStatus,fDept,fPeriod]);

  // summary numbers (use DB stored amount first, else calculate)
  const stats = useMemo(()=>{
    const amt   = (r) => r.calculated_amount ?? calcIncentive(plans.find(p=>p._id===(r.plan_id?._id||r.plan_id)), r.performance_score, r.salary).amount;
    const total    = filtered.reduce((s,r)=>s+amt(r),0);
    const approved = filtered.filter(r=>r.status==="approved").reduce((s,r)=>s+amt(r),0);
    return {
      total, approved,
      pending: filtered.filter(r=>r.status==="pending").length,
      paid:    filtered.filter(r=>r.status==="paid").length,
    };
  },[filtered,plans]);

  const updateStatus = async (id, status) => {
    try {
      await axios.put(`${API_BASE}/api/incentive-results/${id}`,{status});
      showToast(`Marked as ${status} ✅`); fetchAll();
    } catch { showToast("Update failed","error"); }
  };

  const bulkApprove = async () => {
    const ids = filtered.filter(r=>r.status==="pending").map(r=>r._id);
    if (!ids.length){ showToast("No pending items","error"); return; }
    setBulkBusy(true);
    try {
      await Promise.all(ids.map(id=>axios.put(`${API_BASE}/api/incentive-results/${id}`,{status:"approved"})));
      showToast(`${ids.length} approved ✅`); fetchAll();
    } catch { showToast("Bulk approve failed","error"); }
    finally   { setBulkBusy(false); }
  };

  const exportExcel = () => {
    const rows = filtered.map((r,i)=>{
      const plan = plans.find(p=>p._id===(r.plan_id?._id||r.plan_id));
      const { amount } = calcIncentive(plan, r.performance_score, r.salary);
      return {
        "#": i+1,
        "Employee":        r.employee_id?.name||"—",
        "Department":      r.employee_id?.department||"—",
        "Period":          r.cycle_period||"—",
        "Plan":            plan?.name||"—",
        "Final Score (%)": r.performance_score??0,
        "Incentive (₹)":   r.calculated_amount??amount,
        "Status":          r.status||"pending",
      };
    });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Incentive Results");
    XLSX.writeFile(wb,`Incentive_${new Date().toLocaleDateString("en-IN").replace(/\//g,"-")}.xlsx`);
    showToast("Downloaded ✅");
  };

  return (
    <div style={{ padding:"28px 32px", fontFamily:"'Segoe UI',sans-serif", minHeight:"100vh", background:"#f4f6fb" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>

      {toast && (
        <div style={{ position:"fixed",top:20,right:16,zIndex:9999,background:toast.type==="error"?"#ff4d4f":"#52c41a",color:"#fff",padding:"12px 20px",borderRadius:8,fontWeight:500,fontSize:14 }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24,flexWrap:"wrap",gap:12 }}>
        <div>
          <h2 style={{ margin:0,fontSize:22,fontWeight:800,color:"#1a1a2e" }}>Results & Payout</h2>
          <p style={{ margin:"4px 0 0",color:"#6b7280",fontSize:14 }}>
            Incentives auto-calculated from KPI final score → approve → mark paid
          </p>
        </div>
        <div style={{ display:"flex",gap:10,flexWrap:"wrap" }}>
          <button onClick={bulkApprove} disabled={bulkBusy} style={{ display:"flex",alignItems:"center",gap:8,padding:"10px 18px",background:"#16a34a",color:"#fff",border:"none",borderRadius:9,fontWeight:700,fontSize:13,cursor:"pointer" }}>
            <CheckCircle size={15}/> {bulkBusy?"Approving...":"Bulk Approve Pending"}
          </button>
          <button onClick={exportExcel} style={{ display:"flex",alignItems:"center",gap:8,padding:"10px 18px",background:"#1d4ed8",color:"#fff",border:"none",borderRadius:9,fontWeight:700,fontSize:13,cursor:"pointer" }}>
            <Download size={15}/> Export Excel
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:16,marginBottom:24 }}>
        {[
          { label:"Total Payout",    value:`₹${stats.total.toLocaleString("en-IN")}`,    color:"#1d4ed8", icon:<DollarSign size={20} color="#1d4ed8"/> },
          { label:"Approved Amount", value:`₹${stats.approved.toLocaleString("en-IN")}`, color:"#16a34a", icon:<TrendingUp size={20} color="#16a34a"/> },
          { label:"Pending",         value: stats.pending,                                 color:"#d97706", icon:<Users size={20} color="#d97706"/> },
          { label:"Paid",            value: stats.paid,                                    color:"#2563eb", icon:<CheckCircle size={20} color="#2563eb"/> },
        ].map(s=>(
          <div key={s.label} style={{ background:"#fff",borderRadius:12,padding:"16px 20px",border:"1px solid #e5e7eb",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
            <div>
              <p style={{ margin:"0 0 4px",fontSize:11,color:"#6b7280",fontWeight:700,textTransform:"uppercase" }}>{s.label}</p>
              <p style={{ margin:0,fontSize:22,fontWeight:800,color:s.color }}>{s.value}</p>
            </div>
            {s.icon}
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ background:"#fff",borderRadius:14,padding:"16px 20px",border:"1px solid #e5e7eb",marginBottom:20,display:"flex",gap:16,flexWrap:"wrap",alignItems:"flex-end" }}>
        {[
          {label:"Status",     val:fStatus, set:setFStatus, opts:["All","Pending","Approved","Paid"]},
          {label:"Department", val:fDept,   set:setFDept,   opts:depts},
          {label:"Period",     val:fPeriod, set:setFPeriod, opts:periods},
        ].map(f=>(
          <div key={f.label} style={{ minWidth:150 }}>
            <label style={labelStyle}>{f.label}</label>
            <select value={f.val} onChange={e=>f.set(e.target.value)} style={inputStyle}>
              {f.opts.map(o=><option key={o}>{o}</option>)}
            </select>
          </div>
        ))}
        {(fStatus!=="All"||fDept!=="All"||fPeriod!=="All") && (
          <button onClick={()=>{setFStatus("All");setFDept("All");setFPeriod("All");}} style={{ background:"none",border:"none",color:"#2563eb",fontWeight:600,fontSize:13,cursor:"pointer",marginBottom:2 }}>
            ✕ Clear
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign:"center",padding:80,color:"#6b7280" }}>
          <div style={{ width:36,height:36,border:"4px solid #e5e7eb",borderTopColor:"#1d4ed8",borderRadius:"50%",animation:"spin 0.8s linear infinite",margin:"0 auto 12px" }}/>
          Loading results...
        </div>
      ) : filtered.length===0 ? (
        <div style={{ textAlign:"center",padding:80,background:"#fff",borderRadius:14,border:"1px solid #e5e7eb",color:"#9ca3af" }}>
          <div style={{ fontSize:48,marginBottom:12 }}>💰</div>
          <p style={{ fontWeight:700 }}>No results found</p>
          <p style={{ fontSize:13 }}>Results are auto-generated when KPI reviews are completed</p>
        </div>
      ) : (
        <div style={{ background:"#fff",borderRadius:14,border:"1px solid #e5e7eb",overflow:"hidden" }}>
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%",borderCollapse:"collapse",fontSize:14 }}>
              <thead>
                <tr style={{ background:"#f8fafc" }}>
                  {["#","Employee","Dept","Period","Plan","Score","Incentive","Slab","Status","Action"].map(h=>(
                    <th key={h} style={{ padding:"12px 16px",textAlign:"left",fontWeight:700,color:"#374151",borderBottom:"2px solid #e5e7eb",whiteSpace:"nowrap",fontSize:13 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r,i)=>{
                  const plan = plans.find(p=>p._id===(r.plan_id?._id||r.plan_id));
                  const { amount, slabLabel } = calcIncentive(plan, r.performance_score, r.salary);
                  const finalAmt = r.calculated_amount ?? amount;
                  const sm = STATUS_META[r.status] || STATUS_META.pending;
                  const score = Math.round(r.performance_score||0);
                  const scoreColor = score>=90?"#16a34a":score>=75?"#2563eb":score>=60?"#d97706":"#dc2626";

                  return (
                    <tr key={r._id} style={{ borderBottom:"1px solid #f3f4f6",background:i%2===0?"#fff":"#fafafa" }}>
                      <td style={{ padding:"12px 16px",color:"#9ca3af",fontWeight:600 }}>{i+1}</td>

                      {/* Employee */}
                      <td style={{ padding:"12px 16px" }}>
                        <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                          <div style={{ width:32,height:32,borderRadius:"50%",background:"#eff6ff",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,color:"#2563eb",fontSize:13 }}>
                            {r.employee_id?.name?.charAt(0)||"?"}
                          </div>
                          <div>
                            <p style={{ margin:0,fontWeight:700,color:"#1a1a2e",fontSize:13 }}>{r.employee_id?.name||"—"}</p>
                            <p style={{ margin:0,fontSize:11,color:"#6b7280" }}>{r.employee_id?.designation||""}</p>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding:"12px 16px",fontSize:13,color:"#374151" }}>{r.employee_id?.department||"—"}</td>
                      <td style={{ padding:"12px 16px" }}>
                        <span style={{ background:"#f3f4f6",padding:"3px 8px",borderRadius:5,fontWeight:600,fontSize:12 }}>{r.cycle_period||"—"}</span>
                      </td>
                      <td style={{ padding:"12px 16px",fontSize:12,color:"#6b7280" }}>{plan?.name||"—"}</td>

                      {/* Score */}
                      <td style={{ padding:"12px 16px" }}>
                        <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                          <span style={{ fontWeight:800,fontSize:16,color:scoreColor }}>{score}%</span>
                          <div style={{ width:50,background:"#f3f4f6",borderRadius:99,height:6,overflow:"hidden" }}>
                            <div style={{ width:`${score}%`,height:"100%",background:scoreColor,borderRadius:99 }}/>
                          </div>
                        </div>
                      </td>

                      {/* Incentive */}
                      <td style={{ padding:"12px 16px" }}>
                        <p style={{ margin:0,fontWeight:800,fontSize:16,color:finalAmt>0?"#16a34a":"#9ca3af" }}>
                          {finalAmt>0 ? `₹${finalAmt.toLocaleString("en-IN")}` : "—"}
                        </p>
                      </td>

                      {/* Slab label */}
                      <td style={{ padding:"12px 16px",fontSize:11,color:"#9ca3af",maxWidth:160 }}>{slabLabel}</td>

                      {/* Status */}
                      <td style={{ padding:"12px 16px" }}>
                        <span style={{ background:sm.bg,color:sm.color,fontWeight:700,padding:"4px 10px",borderRadius:20,fontSize:12 }}>{sm.label}</span>
                      </td>

                      {/* Action */}
                      <td style={{ padding:"12px 16px" }}>
                        {r.status==="pending" && (
                          <button onClick={()=>updateStatus(r._id,"approved")} style={{ background:"#f0fdf4",border:"none",borderRadius:6,padding:"5px 12px",fontSize:12,fontWeight:700,color:"#16a34a",cursor:"pointer" }}>
                            Approve
                          </button>
                        )}
                        {r.status==="approved" && (
                          <button onClick={()=>updateStatus(r._id,"paid")} style={{ background:"#eff6ff",border:"none",borderRadius:6,padding:"5px 12px",fontSize:12,fontWeight:700,color:"#1d4ed8",cursor:"pointer" }}>
                            Mark Paid
                          </button>
                        )}
                        {r.status==="paid" && (
                          <span style={{ fontSize:13,color:"#16a34a",fontWeight:700 }}>✓ Paid</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p style={{ textAlign:"center",padding:"12px 0",fontSize:13,color:"#9ca3af",margin:0,borderTop:"1px solid #f3f4f6" }}>
            Showing {filtered.length} of {results.length} results
          </p>
        </div>
      )}
    </div>
  );
}