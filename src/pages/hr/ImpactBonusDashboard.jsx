import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  Plus, Download, Lightbulb, TrendingUp, Star, RefreshCw, CheckCircle,
  Home, Link2, Rocket, DollarSign, Scissors, Smile, Radio, Users,
  Eye, Trophy, Settings, Target, Megaphone, BarChart2,
  XCircle, CheckSquare, ClipboardList, X, ChevronRight
} from "lucide-react";
import * as XLSX from "xlsx";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const TIER_CONFIG = {
  tier1_local:   { label:"Local Impact",        Icon:Home,    color:"#3b82f6", bg:"#eff6ff", range:"₹5K–₹15K"    },
  tier2_cross:   { label:"Cross-functional",    Icon:Link2,   color:"#8b5cf6", bg:"#f5f3ff", range:"₹25K–₹50K"   },
  tier3_company: { label:"Company-Wide Impact", Icon:Rocket,  color:"#ef4444", bg:"#fef2f2", range:"₹1L–₹2L+CEO" },
};

const STATUS_CFG = {
  submitted:    { label:"Submitted",    color:"#6b7280", bg:"#f3f4f6", step:1 },
  dept_review:  { label:"Dept Review",  color:"#f59e0b", bg:"#fffbeb", step:2 },
  iec_review:   { label:"IEC Review",   color:"#8b5cf6", bg:"#f5f3ff", step:3 },
  scoring:      { label:"Scoring",      color:"#3b82f6", bg:"#eff6ff", step:4 },
  approved:     { label:"Approved",     color:"#10b981", bg:"#ecfdf5", step:5 },
  announced:    { label:"Announced",    color:"#059669", bg:"#d1fae5", step:6 },
  rejected:     { label:"Rejected",     color:"#ef4444", bg:"#fef2f2", step:0 },
};

const SCORING_FIELDS = [
  { key:"innovation_originality",     label:"Innovation / Originality",             max:25 },
  { key:"measurable_business_result", label:"Measurable Business Result",           max:35 },
  { key:"scalability",                label:"Scalability",                          max:20 },
  { key:"team_collaboration_speed",   label:"Team Collaboration & Implementation",  max:20 },
];

const IMPACT_AREAS = [
  { key:"revenue_growth",        label:"Revenue Growth",        Icon:DollarSign },
  { key:"cost_reduction",        label:"Cost Reduction",        Icon:Scissors   },
  { key:"product_innovation",    label:"Product Innovation",    Icon:Lightbulb  },
  { key:"customer_satisfaction", label:"Customer Satisfaction", Icon:Smile      },
  { key:"brand_visibility",      label:"Brand Visibility",      Icon:Radio      },
  { key:"employee_engagement",   label:"Employee Engagement",   Icon:Users      },
];

const inp = {
  width:"100%", padding:"9px 12px", border:"1px solid #d1d5db",
  borderRadius:8, fontSize:13, color:"#1a1a2e", background:"#fff",
  boxSizing:"border-box", outline:"none"
};
const lbl = {
  display:"block", fontSize:11, fontWeight:700,
  color:"#374151", marginBottom:5,
  textTransform:"uppercase", letterSpacing:"0.04em"
};

const STYLES = `
  .ib-page { padding: 28px 32px; }
  .ib-stats { grid-template-columns: repeat(4,1fr); }
  .ib-tier-grid { grid-template-columns: repeat(3,1fr); }
  .ib-form-grid { grid-template-columns: 1fr 1fr; }
  .ib-table { display: block !important; }
  .ib-cards { display: none !important; }
  @media(max-width:1024px){
    .ib-stats { grid-template-columns: repeat(2,1fr) !important; }
    .ib-tier-grid { grid-template-columns: repeat(2,1fr) !important; }
  }
  @media(max-width:768px){
    .ib-page { padding: 16px; }
    .ib-stats { grid-template-columns: repeat(2,1fr) !important; }
    .ib-tier-grid { grid-template-columns: 1fr !important; }
    .ib-form-grid { grid-template-columns: 1fr !important; }
    .ib-table { display: none !important; }
    .ib-cards { display: flex !important; flex-direction: column; gap: 12px; padding: 12px 16px; }
  }
`;

// Scoring Modal
function ScoringModal({ sub, onClose, onSave }) {
  const [scores, setScores] = useState({
    innovation_originality:     sub.scoring?.innovation_originality     || 0,
    measurable_business_result: sub.scoring?.measurable_business_result || 0,
    scalability:                sub.scoring?.scalability                || 0,
    team_collaboration_speed:   sub.scoring?.team_collaboration_speed   || 0,
  });
  const [bonus, setBonus]     = useState(sub.bonus_amount || 0);
  const [comment, setComment] = useState(sub.iec_comment || "");
  const [saving, setSaving]   = useState(false);

  const total = Object.values(scores).reduce((a,b)=>a+b,0);
  const tier  = total >= 80 ? "tier3_company" : total >= 60 ? "tier2_cross" : "tier1_local";
  const tc    = TIER_CONFIG[tier];

  const handle = async () => {
    setSaving(true);
    await onSave(sub._id, {
      status: "approved",
      scoring: scores,
      bonus_amount: bonus,
      impact_tier: tier,
      iec_comment: comment,
      approved_by: "CPO + CEO"
    });
    setSaving(false);
    onClose();
  };

  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.6)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16,overflowY:"auto" }}>
      <div style={{ background:"#fff",borderRadius:16,width:"100%",maxWidth:520,boxShadow:"0 25px 60px rgba(0,0,0,.3)",maxHeight:"90vh",overflowY:"auto" }}>
        <div style={{ background:"#1a1a2e",padding:"16px 22px",borderRadius:"16px 16px 0 0",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
          <div style={{ display:"flex",alignItems:"center",gap:8 }}>
            <Target size={16} color="#fff"/>
            <p style={{ margin:0,color:"#fff",fontWeight:800,fontSize:15 }}>Score Innovation</p>
          </div>
          <button onClick={onClose} style={{ background:"rgba(255,255,255,.1)",border:"none",borderRadius:7,padding:"5px 10px",color:"#d1d5db",cursor:"pointer",display:"flex",alignItems:"center" }}>
            <X size={14}/>
          </button>
        </div>
        <div style={{ padding:22 }}>
          <div style={{ background:"#f8fafc",borderRadius:10,padding:"12px 16px",marginBottom:16 }}>
            <p style={{ margin:"0 0 2px",fontWeight:700,color:"#1a1a2e",fontSize:14 }}>{sub.title}</p>
            <p style={{ margin:0,fontSize:12,color:"#6b7280" }}>{sub.employee_id?.name} · {sub.employee_id?.department}</p>
          </div>

          {SCORING_FIELDS.map(f => (
            <div key={f.key} style={{ marginBottom:14 }}>
              <div style={{ display:"flex",justifyContent:"space-between",marginBottom:4 }}>
                <label style={{ fontSize:13,fontWeight:600,color:"#374151" }}>{f.label}</label>
                <div style={{ display:"flex",alignItems:"center",gap:6 }}>
                  <input type="number" min={0} max={f.max} value={scores[f.key]}
                    onChange={e=>setScores(s=>({...s,[f.key]:Math.min(Number(e.target.value),f.max)}))}
                    style={{ width:56,padding:"4px 8px",border:"1px solid #d1d5db",borderRadius:6,fontSize:13,textAlign:"center",outline:"none" }}/>
                  <span style={{ fontSize:12,color:"#9ca3af" }}>/ {f.max}</span>
                </div>
              </div>
              <div style={{ background:"#f3f4f6",borderRadius:99,height:6,overflow:"hidden" }}>
                <div style={{ width:`${(scores[f.key]/f.max)*100}%`,height:"100%",background:"#3b82f6",borderRadius:99,transition:"width .3s" }}/>
              </div>
            </div>
          ))}

          <div style={{ background:tc.bg,border:`1px solid ${tc.color}33`,borderRadius:10,padding:"12px 16px",marginBottom:16,display:"flex",justifyContent:"space-between",alignItems:"center" }}>
            <div>
              <p style={{ margin:0,fontSize:11,color:"#6b7280",fontWeight:700 }}>TOTAL SCORE / 100</p>
              <p style={{ margin:0,fontSize:28,fontWeight:900,color:tc.color }}>{total}</p>
            </div>
            <div style={{ textAlign:"right" }}>
              <p style={{ margin:0,fontSize:11,color:"#6b7280",fontWeight:700 }}>AUTO TIER</p>
              <span style={{ background:tc.bg,color:tc.color,fontWeight:700,padding:"4px 12px",borderRadius:20,fontSize:12,display:"inline-flex",alignItems:"center",gap:4 }}>
                <tc.Icon size={12}/> {tc.label}
              </span>
              <p style={{ margin:"4px 0 0",fontSize:11,color:"#6b7280" }}>{tc.range}</p>
            </div>
          </div>

          <div style={{ marginBottom:12 }}>
            <label style={lbl}>Bonus Amount (₹)</label>
            <input type="number" style={inp} value={bonus} onChange={e=>setBonus(Number(e.target.value))} />
          </div>
          <div style={{ marginBottom:20 }}>
            <label style={lbl}>IEC Committee Comment</label>
            <textarea style={{ ...inp,minHeight:60,resize:"vertical" }} value={comment} onChange={e=>setComment(e.target.value)} placeholder="Evaluation notes..."/>
          </div>

          <div style={{ display:"flex",gap:10,justifyContent:"flex-end" }}>
            <button onClick={onClose} style={{ padding:"10px 20px",border:"1px solid #e5e7eb",borderRadius:8,background:"#fff",color:"#374151",fontWeight:600,cursor:"pointer" }}>Cancel</button>
            <button onClick={handle} disabled={saving}
              style={{ padding:"10px 24px",border:"none",borderRadius:8,background:saving?"#93c5fd":"#10b981",color:"#fff",fontWeight:700,cursor:saving?"not-allowed":"pointer",display:"flex",alignItems:"center",gap:6 }}>
              <CheckCircle size={14}/> {saving?"Saving...":"Approve & Score"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Description Modal
function DescriptionModal({ sub, onClose }) {
  const tc = TIER_CONFIG[sub.impact_tier] || TIER_CONFIG.tier1_local;
  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.6)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16 }}>
      <div style={{ background:"#fff",borderRadius:16,width:"100%",maxWidth:480,boxShadow:"0 25px 60px rgba(0,0,0,.3)" }}>
        <div style={{ background:"#1a1a2e",padding:"16px 22px",borderRadius:"16px 16px 0 0",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
          <div style={{ display:"flex",alignItems:"center",gap:8 }}>
            <Lightbulb size={16} color="#fff"/>
            <p style={{ margin:0,color:"#fff",fontWeight:800,fontSize:15 }}>{sub.title}</p>
          </div>
          <button onClick={onClose} style={{ background:"rgba(255,255,255,.1)",border:"none",borderRadius:7,padding:"5px 10px",color:"#d1d5db",cursor:"pointer",display:"flex",alignItems:"center" }}>
            <X size={14}/>
          </button>
        </div>
        <div style={{ padding:22 }}>
          <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:14 }}>
            <div style={{ width:36,height:36,borderRadius:"50%",background:tc.bg,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,color:tc.color,fontSize:15 }}>
              {sub.employee_id?.name?.charAt(0)||"?"}
            </div>
            <div>
              <p style={{ margin:0,fontWeight:700,color:"#1a1a2e",fontSize:14 }}>{sub.employee_id?.name}</p>
              <p style={{ margin:0,fontSize:12,color:"#6b7280" }}>{sub.employee_id?.department}</p>
            </div>
            <span style={{ marginLeft:"auto",background:tc.bg,color:tc.color,padding:"4px 10px",borderRadius:20,fontSize:11,fontWeight:700,display:"inline-flex",alignItems:"center",gap:4 }}>
              <tc.Icon size={11}/> {tc.label}
            </span>
          </div>
          <div style={{ background:"#f8fafc",borderRadius:10,padding:"14px 16px",marginBottom:14 }}>
            <p style={{ margin:"0 0 6px",fontSize:11,fontWeight:700,color:"#6b7280",textTransform:"uppercase",letterSpacing:"0.04em" }}>Description & Impact</p>
            <p style={{ margin:0,fontSize:14,color:"#1a1a2e",lineHeight:1.7 }}>{sub.description}</p>
          </div>
          {sub.period && (
            <div style={{ display:"flex",alignItems:"center",gap:6,marginBottom:8,fontSize:12,color:"#6b7280" }}>
              <ClipboardList size={13}/> Period: <strong>{sub.period}</strong>
            </div>
          )}
          {sub.impact_areas?.length > 0 && (
            <div style={{ display:"flex",gap:6,flexWrap:"wrap",marginBottom:8 }}>
              {sub.impact_areas.map(ia => {
                const area = IMPACT_AREAS.find(a=>a.key===ia);
                return area ? (
                  <span key={ia} style={{ background:"#f3f4f6",color:"#374151",padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:600,display:"inline-flex",alignItems:"center",gap:4 }}>
                    <area.Icon size={11}/> {area.label}
                  </span>
                ) : null;
              })}
            </div>
          )}
          <div style={{ display:"flex",justifyContent:"flex-end",marginTop:16 }}>
            <button onClick={onClose} style={{ padding:"9px 22px",border:"1px solid #e5e7eb",borderRadius:8,background:"#fff",color:"#374151",fontWeight:600,cursor:"pointer",fontSize:13 }}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ImpactBonusDashboard() {
  const [subs, setSubs]         = useState([]);
  const [employees, setEmps]    = useState([]);
  const [summary, setSummary]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [scoringModal, setScoringModal] = useState(null);
  const [descModal, setDescModal]       = useState(null);
  const [saving, setSaving]     = useState(false);
  const [toast, setToast]       = useState(null);
  const [filterTier, setFT]     = useState("All");
  const [filterStatus, setFS]   = useState("All");

  const [form, setForm] = useState({
    employee_id:"", title:"", description:"",
    impact_areas:[], submission_channel:"hr_desk",
    employee_level:"L1-L3", contribution_type:"",
    impact_tier:"tier1_local", period:""
  });

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [sRes, eRes, sumRes] = await Promise.all([
        axios.get(`${API_BASE}/api/impact-bonus`),
        axios.get(`${API_BASE}/api/hr/employees`),   // ✅ FIX: approved → employees
        axios.get(`${API_BASE}/api/impact-bonus/summary`),
      ]);
      if (sRes.data.success) setSubs(sRes.data.data);

      // ✅ FIX: active employees மட்டும் filter
      if (eRes.data) {
        const active = Array.isArray(eRes.data)
          ? eRes.data.filter(emp => emp.status === "active")
          : [];
        setEmps(active);
      }

      if (sumRes.data.success) setSummary(sumRes.data.data);
    } catch { showMsg("Failed to load","error"); }
    finally { setLoading(false); }
  };

  const showMsg = (msg,type="success") => {
    setToast({msg,type});
    setTimeout(()=>setToast(null),3000);
  };

  const handleSubmit = async () => {
    if (!form.employee_id || !form.title || !form.description)
      return showMsg("Employee, title, description required","error");
    setSaving(true);
    try {
      await axios.post(`${API_BASE}/api/impact-bonus`, form);
      showMsg("Innovation submitted!");
      setShowForm(false);
      setForm({ employee_id:"",title:"",description:"",impact_areas:[],submission_channel:"hr_desk",employee_level:"L1-L3",contribution_type:"",impact_tier:"tier1_local",period:"" });
      fetchAll();
    } catch(err) { showMsg(err?.response?.data?.message||"Failed","error"); }
    finally { setSaving(false); }
  };

  const handleStatusUpdate = async (id, payload) => {
    try {
      await axios.patch(`${API_BASE}/api/impact-bonus/${id}/status`, payload);
      showMsg(payload.status==="announced"?"Announced!":"Status updated");
      fetchAll();
    } catch { showMsg("Failed","error"); }
  };

  const filtered = useMemo(() => {
    let d = [...subs];
    if (filterTier   !== "All") d = d.filter(s => s.impact_tier === filterTier);
    if (filterStatus !== "All") d = d.filter(s => s.status      === filterStatus);
    return d;
  }, [subs, filterTier, filterStatus]);

  const exportExcel = () => {
    const rows = filtered.map((s,i) => ({
      "#":i+1, "Employee":s.employee_id?.name, "Dept":s.employee_id?.department,
      "Title":s.title, "Tier":TIER_CONFIG[s.impact_tier]?.label,
      "Score":s.total_score, "Bonus":s.bonus_amount,
      "Status":STATUS_CFG[s.status]?.label, "Period":s.period
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Impact Bonus");
    XLSX.writeFile(wb, `ImpactBonus_${Date.now()}.xlsx`);
  };

  if (loading) return (
    <div style={{ display:"flex",justifyContent:"center",alignItems:"center",height:"60vh" }}>
      <p style={{ color:"#6b7280" }}>Loading...</p>
    </div>
  );

  return (
    <div className="ib-page" style={{ fontFamily:"'Segoe UI',sans-serif",minHeight:"100vh",background:"#f4f6fb" }}>
      <style>{STYLES}</style>

      {toast && (
        <div style={{ position:"fixed",top:20,right:16,zIndex:9999,background:toast.type==="error"?"#ef4444":"#10b981",color:"#fff",padding:"12px 20px",borderRadius:8,fontWeight:600,fontSize:14,display:"flex",alignItems:"center",gap:8 }}>
          {toast.type==="error" ? <XCircle size={16}/> : <CheckCircle size={16}/>}
          {toast.msg}
        </div>
      )}

      {scoringModal && (
        <ScoringModal sub={scoringModal} onClose={()=>setScoringModal(null)} onSave={handleStatusUpdate}/>
      )}

      {descModal && (
        <DescriptionModal sub={descModal} onClose={()=>setDescModal(null)}/>
      )}

      {/* Header */}
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24,gap:12,flexWrap:"wrap" }}>
        <div>
          <div style={{ display:"flex",alignItems:"center",gap:8 }}>
            <Lightbulb size={22} color="#1a1a2e"/>
            <h2 style={{ margin:0,fontSize:22,fontWeight:800,color:"#1a1a2e" }}>Impact Bonus</h2>
          </div>
          <p style={{ margin:"4px 0 0",color:"#6b7280",fontSize:14 }}>Google-Style Innovation Rewards · Up to ₹2L + CEO Recognition</p>
        </div>
        <div style={{ display:"flex",gap:8 }}>
          <button onClick={fetchAll} style={{ display:"flex",alignItems:"center",gap:6,padding:"9px 14px",background:"#fff",border:"1px solid #e5e7eb",borderRadius:8,fontWeight:600,fontSize:13,cursor:"pointer",color:"#374151" }}>
            <RefreshCw size={14}/> Refresh
          </button>
          <button onClick={exportExcel} style={{ display:"flex",alignItems:"center",gap:6,padding:"9px 14px",background:"#fff",border:"1px solid #e5e7eb",borderRadius:8,fontWeight:600,fontSize:13,cursor:"pointer",color:"#374151" }}>
            <Download size={14}/> Export
          </button>
          <button onClick={()=>setShowForm(f=>!f)} style={{ display:"flex",alignItems:"center",gap:6,padding:"10px 20px",background:"#1a1a2e",color:"#fff",border:"none",borderRadius:9,fontWeight:700,fontSize:14,cursor:"pointer" }}>
            <Plus size={15}/> {showForm?"Close":"Submit Innovation"}
          </button>
        </div>
      </div>

      {/* Stats */}
      {summary && (
        <div className="ib-stats" style={{ display:"grid",gap:14,marginBottom:24 }}>
          {[
            { label:"Total Submissions", value:summary.total,     color:"#1a1a2e", bg:"#f3f4f6", icon:<Lightbulb size={20} color="#1a1a2e"/> },
            { label:"Under Review",      value:summary.submitted,  color:"#f59e0b", bg:"#fffbeb", icon:<Star size={20} color="#f59e0b"/> },
            { label:"Approved",          value:summary.approved,   color:"#10b981", bg:"#ecfdf5", icon:<CheckCircle size={20} color="#10b981"/> },
            { label:"Total Bonus Paid",  value:`₹${(summary.total_bonus_paid||0).toLocaleString("en-IN")}`, color:"#3b82f6", bg:"#eff6ff", icon:<TrendingUp size={20} color="#3b82f6"/> },
          ].map((s,i)=>(
            <div key={i} style={{ background:"#fff",borderRadius:12,padding:"16px 20px",border:"1px solid #e5e7eb",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
              <div>
                <p style={{ margin:"0 0 4px",fontSize:11,color:"#6b7280",fontWeight:700,textTransform:"uppercase" }}>{s.label}</p>
                <p style={{ margin:0,fontSize:s.label==="Total Bonus Paid"?16:26,fontWeight:900,color:s.color }}>{s.value}</p>
              </div>
              <div style={{ width:44,height:44,borderRadius:10,background:s.bg,display:"flex",alignItems:"center",justifyContent:"center" }}>{s.icon}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tier Cards */}
      <div className="ib-tier-grid" style={{ display:"grid",gap:14,marginBottom:24 }}>
        {Object.entries(TIER_CONFIG).map(([key,cfg])=>(
          <div key={key} style={{ background:"#fff",borderRadius:12,border:`1px solid ${cfg.color}33`,overflow:"hidden" }}>
            <div style={{ background:cfg.color,padding:"12px 16px",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
              <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                <cfg.Icon size={20} color="#fff"/>
                <span style={{ color:"#fff",fontWeight:800,fontSize:14 }}>{cfg.label}</span>
              </div>
              <span style={{ background:"rgba(255,255,255,.2)",color:"#fff",fontSize:11,padding:"3px 10px",borderRadius:20,fontWeight:700 }}>{cfg.range}</span>
            </div>
            <div style={{ padding:"12px 16px" }}>
              {key==="tier1_local"   && <p style={{ margin:0,fontSize:12,color:"#6b7280" }}>Improves team or department efficiency</p>}
              {key==="tier2_cross"   && <p style={{ margin:0,fontSize:12,color:"#6b7280" }}>Benefits multiple departments or reduces major cost</p>}
              {key==="tier3_company" && <p style={{ margin:0,fontSize:12,color:"#6b7280" }}>Creates measurable business growth or market advantage</p>}
            </div>
          </div>
        ))}
      </div>

      {/* Submission Form */}
      {showForm && (
        <div style={{ background:"#fff",borderRadius:16,border:"1px solid #e5e7eb",marginBottom:24,overflow:"hidden",boxShadow:"0 4px 24px rgba(0,0,0,.07)" }}>
          <div style={{ background:"#1a1a2e",padding:"16px 22px",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
            <div style={{ display:"flex",alignItems:"center",gap:8 }}>
              <Lightbulb size={16} color="#fff"/>
              <p style={{ margin:0,color:"#fff",fontWeight:800,fontSize:15 }}>Submit Innovation</p>
            </div>
            <button onClick={()=>setShowForm(false)} style={{ background:"rgba(255,255,255,.1)",border:"none",borderRadius:7,padding:"5px 12px",color:"#d1d5db",cursor:"pointer",display:"flex",alignItems:"center" }}>
              <X size={14}/>
            </button>
          </div>
          <div style={{ padding:22 }}>
            <div className="ib-form-grid" style={{ display:"grid",gap:14,marginBottom:14 }}>
              <div>
                <label style={lbl}>Employee *</label>
                <select style={inp} value={form.employee_id} onChange={e=>setForm(f=>({...f,employee_id:e.target.value}))}>
                  <option value="">-- Select --</option>
                  {employees.map(e=><option key={e._id} value={e._id}>{e.name} — {e.department}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Period</label>
                <input style={inp} value={form.period} onChange={e=>setForm(f=>({...f,period:e.target.value}))} placeholder="e.g. Q1 2026"/>
              </div>
              <div>
                <label style={lbl}>Employee Level</label>
                <select style={inp} value={form.employee_level} onChange={e=>setForm(f=>({...f,employee_level:e.target.value}))}>
                  <option value="L1-L3">L1–L3 (Executives)</option>
                  <option value="L4-L6">L4–L6 (Managers)</option>
                  <option value="L7-L10">L7–L10 (Leadership)</option>
                </select>
              </div>
              <div>
                <label style={lbl}>Submission Channel</label>
                <select style={inp} value={form.submission_channel} onChange={e=>setForm(f=>({...f,submission_channel:e.target.value}))}>
                  <option value="hr_desk">HR Innovation Desk</option>
                  <option value="lms_portal">Radnus LMS Portal</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom:14 }}>
              <label style={lbl}>Innovation Title *</label>
              <input style={inp} value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="e.g. Automated Stock Monitoring System"/>
            </div>
            <div style={{ marginBottom:14 }}>
              <label style={lbl}>Description & Impact *</label>
              <textarea style={{ ...inp,minHeight:80,resize:"vertical" }} value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="What did you build? What was the measurable impact?"/>
            </div>

            {/* Impact Areas */}
            <div style={{ marginBottom:14 }}>
              <label style={lbl}>Impact Areas</label>
              <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
                {IMPACT_AREAS.map(ia=>(
                  <button key={ia.key}
                    onClick={()=>setForm(f=>({...f,impact_areas:f.impact_areas.includes(ia.key)?f.impact_areas.filter(x=>x!==ia.key):[...f.impact_areas,ia.key]}))}
                    style={{ padding:"6px 14px",border:`1.5px solid ${form.impact_areas.includes(ia.key)?"#3b82f6":"#e5e7eb"}`,borderRadius:20,background:form.impact_areas.includes(ia.key)?"#eff6ff":"#fff",color:form.impact_areas.includes(ia.key)?"#2563eb":"#6b7280",fontSize:12,fontWeight:600,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:5 }}>
                    <ia.Icon size={12}/> {ia.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tier select */}
            <div style={{ marginBottom:20 }}>
              <label style={lbl}>Impact Tier</label>
              <div style={{ display:"flex",gap:10,flexWrap:"wrap" }}>
                {Object.entries(TIER_CONFIG).map(([k,v])=>(
                  <button key={k} onClick={()=>setForm(f=>({...f,impact_tier:k}))}
                    style={{ padding:"8px 16px",border:`2px solid ${form.impact_tier===k?v.color:"#e5e7eb"}`,borderRadius:8,background:form.impact_tier===k?v.bg:"#fff",color:form.impact_tier===k?v.color:"#6b7280",fontWeight:700,fontSize:12,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:6 }}>
                    <v.Icon size={13}/> {v.label} <span style={{ fontSize:11,opacity:.7 }}>({v.range})</span>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display:"flex",gap:10,justifyContent:"flex-end" }}>
              <button onClick={()=>setShowForm(false)} style={{ padding:"10px 24px",border:"1px solid #e5e7eb",borderRadius:8,background:"#fff",color:"#374151",fontWeight:600,cursor:"pointer" }}>Cancel</button>
              <button onClick={handleSubmit} disabled={saving}
                style={{ padding:"10px 28px",border:"none",borderRadius:8,background:saving?"#93c5fd":"#1a1a2e",color:"#fff",fontWeight:700,fontSize:14,cursor:saving?"not-allowed":"pointer",display:"flex",alignItems:"center",gap:7 }}>
                <Lightbulb size={15}/> {saving?"Submitting...":"Submit Innovation"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Process Flow */}
      <div style={{ background:"#fff",borderRadius:14,border:"1px solid #e5e7eb",padding:"18px 22px",marginBottom:24 }}>
        <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:14 }}>
          <Settings size={15} color="#1a1a2e"/>
          <p style={{ margin:0,fontWeight:700,fontSize:14,color:"#1a1a2e" }}>6-Step Process Flow</p>
        </div>
        <div style={{ display:"flex",gap:0,flexWrap:"wrap" }}>
          {[
            { n:1, t:"Idea Submission",  d:"HR Desk / LMS Portal",       color:"#6b7280", Icon:Lightbulb    },
            { n:2, t:"Dept Head Review", d:"Feasibility & alignment",    color:"#f59e0b", Icon:Users         },
            { n:3, t:"IEC Review",       d:"Quantifiable results check", color:"#8b5cf6", Icon:ClipboardList },
            { n:4, t:"Scoring",          d:"100-point evaluation",       color:"#3b82f6", Icon:BarChart2     },
            { n:5, t:"CPO+CEO Approval", d:"Final bonus authorization",  color:"#10b981", Icon:CheckSquare   },
            { n:6, t:"Announcement",     d:"Town Hall + Impact Wall",    color:"#059669", Icon:Megaphone     },
          ].map((step,i)=>(
            <div key={i} style={{ display:"flex",alignItems:"center",flex:1,minWidth:120,marginBottom:8 }}>
              <div style={{ display:"flex",flexDirection:"column",alignItems:"center",flex:1 }}>
                <div style={{ width:34,height:34,borderRadius:"50%",background:step.color,display:"flex",alignItems:"center",justifyContent:"center" }}>
                  <step.Icon size={16} color="#fff"/>
                </div>
                <p style={{ margin:"4px 0 0",fontSize:11,fontWeight:700,color:"#1a1a2e",textAlign:"center" }}>{step.t}</p>
                <p style={{ margin:0,fontSize:10,color:"#9ca3af",textAlign:"center" }}>{step.d}</p>
              </div>
              {i<5 && <ChevronRight size={16} color="#d1d5db" style={{ flexShrink:0 }}/>}
            </div>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ background:"#fff",borderRadius:14,border:"1px solid #e5e7eb",overflow:"hidden" }}>
        <div style={{ padding:"16px 20px",borderBottom:"1px solid #f3f4f6",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8 }}>
          <h3 style={{ margin:0,fontSize:15,fontWeight:700,color:"#1a1a2e" }}>All Submissions ({filtered.length})</h3>
          <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
            <select style={{ ...inp,width:"auto",fontSize:12 }} value={filterTier} onChange={e=>setFT(e.target.value)}>
              <option value="All">All Tiers</option>
              {Object.entries(TIER_CONFIG).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
            </select>
            <select style={{ ...inp,width:"auto",fontSize:12 }} value={filterStatus} onChange={e=>setFS(e.target.value)}>
              <option value="All">All Status</option>
              {Object.entries(STATUS_CFG).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
        </div>

        {filtered.length===0 ? (
          <div style={{ textAlign:"center",padding:"60px 0" }}>
            <Lightbulb size={40} color="#d1d5db" style={{ marginBottom:10 }}/>
            <p style={{ color:"#6b7280",fontWeight:600 }}>No submissions yet</p>
            <p style={{ color:"#9ca3af",fontSize:13 }}>Click "Submit Innovation" to start</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="ib-table" style={{ overflowX:"auto" }}>
              <table style={{ width:"100%",borderCollapse:"collapse",fontSize:13 }}>
                <thead>
                  <tr style={{ background:"#f8fafc" }}>
                    {["Employee","Innovation","Tier","Score","Bonus","Status","Actions"].map(h=>(
                      <th key={h} style={{ padding:"12px 16px",textAlign:"left",fontWeight:700,color:"#374151",borderBottom:"2px solid #e5e7eb",whiteSpace:"nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s,i)=>{
                    const tc  = TIER_CONFIG[s.impact_tier] || TIER_CONFIG.tier1_local;
                    const st  = STATUS_CFG[s.status];
                    return (
                      <tr key={s._id} style={{ borderBottom:"1px solid #f3f4f6",background:i%2===0?"#fff":"#fafafa" }}>
                        <td style={{ padding:"13px 16px" }}>
                          <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                            <div style={{ width:34,height:34,borderRadius:"50%",background:tc.bg,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,color:tc.color,fontSize:14 }}>
                              {s.employee_id?.name?.charAt(0)||"?"}
                            </div>
                            <div>
                              <p style={{ margin:0,fontWeight:700,color:"#1a1a2e" }}>{s.employee_id?.name}</p>
                              <p style={{ margin:0,fontSize:11,color:"#9ca3af" }}>{s.employee_id?.department}</p>
                            </div>
                          </div>
                        </td>

                        <td style={{ padding:"13px 16px",maxWidth:180,cursor:"pointer" }} onClick={()=>setDescModal(s)}>
                          <p style={{ margin:0,fontWeight:600,color:"#1a1a2e",fontSize:13 }}>{s.title}</p>
                          <p style={{ margin:0,fontSize:11,color:"#9ca3af",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:160 }}>{s.description}</p>
                          <p style={{ margin:"3px 0 0",fontSize:10,color:"#3b82f6",fontWeight:600,display:"flex",alignItems:"center",gap:3 }}>
                            <Eye size={10}/> View full
                          </p>
                        </td>

                        <td style={{ padding:"13px 16px" }}>
                          <span style={{ background:tc.bg,color:tc.color,padding:"4px 10px",borderRadius:20,fontSize:11,fontWeight:700,display:"inline-flex",alignItems:"center",gap:4 }}>
                            <tc.Icon size={11}/> {tc.label}
                          </span>
                        </td>
                        <td style={{ padding:"13px 16px",fontWeight:700,color:"#1a1a2e",fontSize:15 }}>
                          {s.total_score>0 ? `${s.total_score}/100` : "—"}
                        </td>
                        <td style={{ padding:"13px 16px",fontWeight:700,color:"#10b981" }}>
                          {s.bonus_amount>0 ? `₹${s.bonus_amount.toLocaleString("en-IN")}` : "—"}
                        </td>
                        <td style={{ padding:"13px 16px" }}>
                          <span style={{ background:st.bg,color:st.color,padding:"4px 12px",borderRadius:20,fontSize:11,fontWeight:700 }}>
                            {st.label}
                          </span>
                        </td>
                        <td style={{ padding:"13px 16px" }}>
                          <div style={{ display:"flex",gap:5,flexWrap:"wrap" }}>
                            {s.status==="submitted" && (
                              <button onClick={()=>handleStatusUpdate(s._id,{status:"dept_review"})}
                                style={{ padding:"4px 10px",background:"#fffbeb",border:"1px solid #fde68a",borderRadius:5,color:"#d97706",fontSize:11,fontWeight:600,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:4 }}>
                                <Users size={11}/> Dept Review
                              </button>
                            )}
                            {s.status==="dept_review" && (
                              <button onClick={()=>handleStatusUpdate(s._id,{status:"iec_review"})}
                                style={{ padding:"4px 10px",background:"#f5f3ff",border:"1px solid #ddd6fe",borderRadius:5,color:"#8b5cf6",fontSize:11,fontWeight:600,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:4 }}>
                                <ClipboardList size={11}/> IEC Review
                              </button>
                            )}
                            {s.status==="iec_review" && (
                              <button onClick={()=>setScoringModal(s)}
                                style={{ padding:"4px 10px",background:"#eff6ff",border:"1px solid #bfdbfe",borderRadius:5,color:"#2563eb",fontSize:11,fontWeight:600,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:4 }}>
                                <Target size={11}/> Score & Approve
                              </button>
                            )}
                            {s.status==="approved" && (
                              <button onClick={()=>handleStatusUpdate(s._id,{status:"announced",impact_wall:true,certificate_issued:true})}
                                style={{ padding:"4px 10px",background:"#ecfdf5",border:"1px solid #6ee7b7",borderRadius:5,color:"#059669",fontSize:11,fontWeight:600,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:4 }}>
                                <Megaphone size={11}/> Announce
                              </button>
                            )}
                            {!["announced","rejected"].includes(s.status) && (
                              <button onClick={()=>handleStatusUpdate(s._id,{status:"rejected",rejection_reason:"Not meeting criteria"})}
                                style={{ padding:"4px 8px",background:"#fef2f2",border:"1px solid #fecaca",borderRadius:5,color:"#ef4444",fontSize:11,fontWeight:600,cursor:"pointer",display:"inline-flex",alignItems:"center" }}>
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

            {/* Mobile Cards */}
            <div className="ib-cards">
              {filtered.map(s=>{
                const tc = TIER_CONFIG[s.impact_tier]||TIER_CONFIG.tier1_local;
                const st = STATUS_CFG[s.status];
                return (
                  <div key={s._id} style={{ border:"1px solid #e5e7eb",borderRadius:10,padding:"14px 16px",background:"#fff" }}>
                    <div style={{ display:"flex",justifyContent:"space-between",marginBottom:8 }}>
                      <div>
                        <p style={{ margin:0,fontWeight:700,color:"#1a1a2e" }}>{s.employee_id?.name}</p>
                        <p style={{ margin:0,fontSize:12,color:"#6b7280" }}>{s.employee_id?.department}</p>
                      </div>
                      <span style={{ background:st.bg,color:st.color,padding:"4px 10px",borderRadius:20,fontSize:11,fontWeight:700,height:"fit-content" }}>{st.label}</span>
                    </div>
                    <p style={{ margin:"0 0 4px",fontWeight:600,color:"#1a1a2e",fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",gap:5 }}
                      onClick={()=>setDescModal(s)}>
                      {s.title} <Eye size={12} color="#3b82f6"/>
                    </p>
                    <div style={{ display:"flex",gap:8,marginBottom:10,flexWrap:"wrap" }}>
                      <span style={{ background:tc.bg,color:tc.color,padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:700,display:"inline-flex",alignItems:"center",gap:4 }}>
                        <tc.Icon size={11}/> {tc.label}
                      </span>
                      {s.total_score>0 && <span style={{ fontSize:12,fontWeight:700,color:"#1a1a2e" }}>{s.total_score}/100 pts</span>}
                      {s.bonus_amount>0 && <span style={{ fontSize:12,fontWeight:700,color:"#10b981" }}>₹{s.bonus_amount.toLocaleString("en-IN")}</span>}
                    </div>
                    <div style={{ display:"flex",gap:6 }}>
                      {s.status==="iec_review" && (
                        <button onClick={()=>setScoringModal(s)}
                          style={{ flex:1,padding:"7px",background:"#eff6ff",border:"1px solid #bfdbfe",borderRadius:7,color:"#2563eb",fontSize:12,fontWeight:600,cursor:"pointer",display:"inline-flex",alignItems:"center",justifyContent:"center",gap:5 }}>
                          <Target size={13}/> Score
                        </button>
                      )}
                      {s.status==="approved" && (
                        <button onClick={()=>handleStatusUpdate(s._id,{status:"announced",impact_wall:true,certificate_issued:true})}
                          style={{ flex:1,padding:"7px",background:"#ecfdf5",border:"1px solid #6ee7b7",borderRadius:7,color:"#059669",fontSize:12,fontWeight:600,cursor:"pointer",display:"inline-flex",alignItems:"center",justifyContent:"center",gap:5 }}>
                          <Megaphone size={13}/> Announce
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Scoring Criteria + Examples */}
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginTop:20 }}>
        <div style={{ background:"#fff",borderRadius:14,border:"1px solid #e5e7eb",padding:"18px 20px" }}>
          <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:12 }}>
            <Target size={15} color="#1a1a2e"/>
            <p style={{ margin:0,fontWeight:700,fontSize:14,color:"#1a1a2e" }}>Scoring Criteria (100 pts)</p>
          </div>
          {SCORING_FIELDS.map((f,i)=>(
            <div key={i} style={{ display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:i<3?"1px solid #f3f4f6":"none",fontSize:13 }}>
              <span style={{ color:"#374151" }}>{f.label}</span>
              <span style={{ fontWeight:800,color:"#2563eb" }}>{f.max} pts</span>
            </div>
          ))}
          <div style={{ marginTop:12,background:"#f0fdf4",borderRadius:8,padding:"10px 12px",fontSize:12,color:"#16a34a",fontWeight:600,display:"flex",alignItems:"center",gap:6 }}>
            <CheckCircle size={13}/> Total: 100 pts · Tier auto-assigned based on score
          </div>
        </div>

        <div style={{ background:"#fff",borderRadius:14,border:"1px solid #e5e7eb",padding:"18px 20px" }}>
          <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:12 }}>
            <Lightbulb size={15} color="#1a1a2e"/>
            <p style={{ margin:0,fontWeight:700,fontSize:14,color:"#1a1a2e" }}>Examples of Eligible Innovations</p>
          </div>
          {[
            "New digital marketing funnel → boosted leads by 30%",
            "Tool tracking student progress via Radnus Academy LMS",
            "Automated stock monitoring → saving ₹3L annually",
            "B2B partnership model → expanded to 10 districts",
          ].map((e,i)=>(
            <div key={i} style={{ display:"flex",gap:8,marginBottom:8,fontSize:12,color:"#374151",alignItems:"flex-start" }}>
              <CheckCircle size={13} color="#10b981" style={{ flexShrink:0,marginTop:1 }}/><span>{e}</span>
            </div>
          ))}
          <div style={{ marginTop:10,background:"#fffbeb",borderRadius:8,padding:"10px 12px",fontSize:12,color:"#92400e",display:"flex",alignItems:"center",gap:6 }}>
            <Trophy size={13}/> Recognition Add-ons: CEO Certificate + Innovation Digest + ESOP eligibility
          </div>
        </div>
      </div>
    </div>
  );
}