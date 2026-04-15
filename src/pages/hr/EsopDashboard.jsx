import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { Plus, Download, TrendingUp, Users, Award, RefreshCw } from "lucide-react";
import * as XLSX from "xlsx";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const GRADE_CONFIG = {
  L6:  { designation:"Senior Manager",  min:0.05, max:0.10, color:"#3b82f6", bg:"#eff6ff" },
  L7:  { designation:"General Manager", min:0.10, max:0.25, color:"#8b5cf6", bg:"#f5f3ff" },
  L8:  { designation:"AVP",             min:0.25, max:0.50, color:"#f59e0b", bg:"#fffbeb" },
  L9:  { designation:"VP",              min:0.50, max:1.00, color:"#10b981", bg:"#ecfdf5" },
  L10: { designation:"Director / CXO",  min:1.00, max:3.00, color:"#ef4444", bg:"#fef2f2" },
};

const STATUS_CFG = {
  granted:   { label:"Granted",   color:"#6b7280", bg:"#f3f4f6" },
  vesting:   { label:"Vesting",   color:"#f59e0b", bg:"#fffbeb" },
  vested:    { label:"Vested",    color:"#3b82f6", bg:"#eff6ff" },
  exercised: { label:"Exercised", color:"#10b981", bg:"#ecfdf5" },
  forfeited: { label:"Forfeited", color:"#ef4444", bg:"#fef2f2" },
};

const VESTING_SCHEDULE = [
  { year:"Year 1", pct:0  },
  { year:"Year 2", pct:25 },
  { year:"Year 3", pct:25 },
  { year:"Year 4", pct:25 },
  { year:"Year 5", pct:25 },
];

const POLICY = [
  { label:"Policy Name",      value:"Radnus Employee Stock Option Plan (R-ESOP)" },
  { label:"Effective Date",   value:"12-Nov-2025" },
  { label:"Applicable Roles", value:"Grade L6 (Sr. Manager) to L10 (CXO & Directors)" },
  { label:"Ownership",        value:"Board of Directors & Chief People Officer (CPO)" },
  { label:"Vesting Period",   value:"Standard 4 years with 1-year cliff" },
  { label:"Exercise Period",  value:"Within 5 years from the vesting date" },
];

const ELIGIBILITY = [
  "Minimum 2 years of service at Radnus",
  "Consistent Exceeds Expectation rating for 2 consecutive years",
  "No disciplinary record",
];

const IMPACT = [
  { icon:"🏗️", text:"Builds a leadership-driven ownership culture" },
  { icon:"💎", text:"Enhances loyalty, accountability, and strategic thinking" },
  { icon:"🌟", text:"Attracts high-caliber professionals to senior roles" },
  { icon:"📈", text:"Strengthens succession planning and long-term retention" },
];

const inp = {
  width:"100%", padding:"9px 12px", border:"1px solid #d1d5db",
  borderRadius:8, fontSize:13, color:"#1a1a2e", background:"#fff",
  boxSizing:"border-box", outline:"none"
};
const lbl = { display:"block", fontSize:11, fontWeight:700, color:"#374151", marginBottom:5, textTransform:"uppercase", letterSpacing:"0.04em" };

const STYLES = `
  .esop-page { padding: 28px 32px; }
  .esop-stats { grid-template-columns: repeat(4, 1fr); }
  .esop-grade-grid { grid-template-columns: repeat(5, 1fr); }
  .esop-form-grid { grid-template-columns: 1fr 1fr; }
  .esop-table { display: block !important; }
  .esop-cards { display: none !important; }
  @media (max-width: 1024px) {
    .esop-stats { grid-template-columns: repeat(2,1fr) !important; }
    .esop-grade-grid { grid-template-columns: repeat(3,1fr) !important; }
  }
  @media (max-width: 768px) {
    .esop-page { padding: 16px; }
    .esop-stats { grid-template-columns: repeat(2,1fr) !important; }
    .esop-grade-grid { grid-template-columns: repeat(2,1fr) !important; }
    .esop-form-grid { grid-template-columns: 1fr !important; }
    .esop-table { display: none !important; }
    .esop-cards { display: flex !important; flex-direction: column; gap:12px; padding:12px 16px; }
  }
`;

export default function EsopDashboard() {
  const [grants, setGrants]     = useState([]);
  const [employees, setEmps]    = useState([]);
  const [summary, setSummary]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [toast, setToast]       = useState(null);
  const [filterGrade, setFG]    = useState("All");
  const [filterStatus, setFS]   = useState("All");

  const [form, setForm] = useState({
    employee_id:"", grade:"L7", designation:"",
    total_options:1000, allocation_pct:0.10,
    exercise_price:"", company_valuation:"",
    grant_date:"", vesting_start:"",
    approved_by:"", payout_method:"shares", notes:""
  });

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [gRes, eRes, sRes] = await Promise.all([
        axios.get(`${API_BASE}/api/esop`),
        axios.get(`${API_BASE}/api/hr/employees`), // ✅ FIXED: same as HrActiveEmployees
        axios.get(`${API_BASE}/api/esop/summary`),
      ]);
      if (gRes.data.success) setGrants(gRes.data.data);

      // ✅ FIXED: active employees only — same filter as HrActiveEmployees.jsx
      if (eRes.data) {
        const active = Array.isArray(eRes.data)
          ? eRes.data.filter(emp => emp.status === "active")
          : [];
        setEmps(active);
      }

      if (sRes.data.success) setSummary(sRes.data.data);
    } catch { showMsg("Failed to load", "error"); }
    finally { setLoading(false); }
  };

  const showMsg = (msg, type="success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleGrant = async () => {
    if (!form.employee_id || !form.exercise_price) {
      return showMsg("Employee and exercise price required", "error");
    }
    setSaving(true);
    try {
      await axios.post(`${API_BASE}/api/esop`, {
        ...form,
        designation: GRADE_CONFIG[form.grade]?.designation,
      });
      showMsg("ESOP granted successfully! 🎉");
      setShowForm(false);
      setForm({ employee_id:"", grade:"L7", designation:"", total_options:1000, allocation_pct:0.10, exercise_price:"", company_valuation:"", grant_date:"", vesting_start:"", approved_by:"", payout_method:"shares", notes:"" });
      fetchAll();
    } catch (err) {
      showMsg(err?.response?.data?.message || "Failed", "error");
    } finally { setSaving(false); }
  };

  const handleStatus = async (id, status) => {
    try {
      await axios.patch(`${API_BASE}/api/esop/${id}/status`, { status });
      showMsg("Status updated ✓");
      fetchAll();
    } catch { showMsg("Failed", "error"); }
  };

  const filtered = useMemo(() => {
    let d = [...grants];
    if (filterGrade  !== "All") d = d.filter(g => g.grade  === filterGrade);
    if (filterStatus !== "All") d = d.filter(g => g.status === filterStatus);
    return d;
  }, [grants, filterGrade, filterStatus]);

  const getVestedPct = (grant) => {
    if (!grant.vesting_start) return 0;
    const years = (Date.now() - new Date(grant.vesting_start)) / (1000*60*60*24*365);
    if (years < 1) return 0;
    if (years < 2) return 0;
    if (years < 3) return 25;
    if (years < 4) return 50;
    if (years < 5) return 75;
    return 100;
  };

  const exportExcel = () => {
    const rows = filtered.map((g,i) => ({
      "#": i+1, "Employee": g.employee_id?.name,
      "Grade": g.grade, "Designation": g.designation,
      "Options": g.total_options, "Alloc %": g.allocation_pct,
      "Exercise Price (₹)": g.exercise_price,
      "Status": STATUS_CFG[g.status]?.label,
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "ESOP");
    XLSX.writeFile(wb, `ESOP_${Date.now()}.xlsx`);
  };

  if (loading) return (
    <div style={{ display:"flex",justifyContent:"center",alignItems:"center",height:"60vh" }}>
      <p style={{ color:"#6b7280" }}>Loading ESOP data...</p>
    </div>
  );

  const cfg = GRADE_CONFIG[form.grade];

  return (
    <div className="esop-page" style={{ fontFamily:"'Segoe UI',sans-serif", minHeight:"100vh", background:"#f4f6fb" }}>
      <style>{STYLES}</style>

      {toast && (
        <div style={{ position:"fixed", top:20, right:16, zIndex:9999, background:toast.type==="error"?"#ef4444":"#10b981", color:"#fff", padding:"12px 20px", borderRadius:8, fontWeight:600, fontSize:14, boxShadow:"0 4px 16px rgba(0,0,0,.15)" }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24, gap:12, flexWrap:"wrap" }}>
        <div>
          <h2 style={{ margin:0, fontSize:22, fontWeight:800, color:"#1a1a2e" }}>📈 R-ESOP Dashboard</h2>
          <p style={{ margin:"4px 0 0", color:"#6b7280", fontSize:14 }}>Employee Stock Option Plan · L6 to L10 · Radnus Leadership Equity</p>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={fetchAll} style={{ display:"flex", alignItems:"center", gap:6, padding:"9px 14px", background:"#fff", border:"1px solid #e5e7eb", borderRadius:8, fontWeight:600, fontSize:13, cursor:"pointer", color:"#374151" }}>
            <RefreshCw size={14}/> Refresh
          </button>
          <button onClick={exportExcel} style={{ display:"flex", alignItems:"center", gap:6, padding:"9px 14px", background:"#fff", border:"1px solid #e5e7eb", borderRadius:8, fontWeight:600, fontSize:13, cursor:"pointer", color:"#374151" }}>
            <Download size={14}/> Export
          </button>
          <button onClick={() => setShowForm(f=>!f)} style={{ display:"flex", alignItems:"center", gap:6, padding:"10px 20px", background:"#1a1a2e", color:"#fff", border:"none", borderRadius:9, fontWeight:700, fontSize:14, cursor:"pointer" }}>
            <Plus size={15}/> {showForm ? "Close" : "Grant ESOP"}
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      {summary && (
        <div className="esop-stats" style={{ display:"grid", gap:14, marginBottom:24 }}>
          {[
            { label:"Total Grants",    value:summary.total,     color:"#1a1a2e", bg:"#f3f4f6" },
            { label:"Active Vesting",  value:summary.vesting,   color:"#f59e0b", bg:"#fffbeb" },
            { label:"Fully Vested",    value:summary.vested,    color:"#3b82f6", bg:"#eff6ff" },
            { label:"Exercised",       value:summary.exercised, color:"#10b981", bg:"#ecfdf5" },
          ].map((s,i) => (
            <div key={i} style={{ background:"#fff", borderRadius:12, padding:"16px 20px", border:"1px solid #e5e7eb", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <p style={{ margin:"0 0 4px", fontSize:11, color:"#6b7280", fontWeight:700, textTransform:"uppercase" }}>{s.label}</p>
                <p style={{ margin:0, fontSize:26, fontWeight:900, color:s.color }}>{s.value}</p>
              </div>
              <div style={{ width:44, height:44, borderRadius:10, background:s.bg, display:"flex", alignItems:"center", justifyContent:"center" }}>
                {i===0?<Users size={20} color={s.color}/>:i===1?<TrendingUp size={20} color={s.color}/>:<Award size={20} color={s.color}/>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Grade Structure */}
      <div className="esop-grade-grid" style={{ display:"grid", gap:12, marginBottom:24 }}>
        {Object.entries(GRADE_CONFIG).map(([grade, cfg]) => (
          <div key={grade} style={{ background:"#fff", borderRadius:12, border:`1px solid ${cfg.color}33`, overflow:"hidden" }}>
            <div style={{ background:cfg.color, padding:"10px 14px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span style={{ color:"#fff", fontWeight:900, fontSize:15 }}>{grade}</span>
              <span style={{ background:"rgba(255,255,255,.2)", color:"#fff", fontSize:10, padding:"2px 8px", borderRadius:20, fontWeight:700 }}>ESOP</span>
            </div>
            <div style={{ padding:"12px 14px" }}>
              <p style={{ margin:"0 0 4px", fontSize:12, fontWeight:700, color:"#1a1a2e" }}>{cfg.designation}</p>
              <p style={{ margin:0, fontSize:13, fontWeight:900, color:cfg.color }}>{cfg.min}% – {cfg.max}%</p>
              <p style={{ margin:"2px 0 0", fontSize:10, color:"#9ca3af" }}>Stock allocation</p>
            </div>
          </div>
        ))}
      </div>

      {/* Policy Overview */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:24 }}>
        <div style={{ background:"#fff", borderRadius:14, border:"1px solid #e5e7eb", overflow:"hidden" }}>
          <div style={{ background:"#1a1a2e", padding:"14px 18px" }}>
            <p style={{ margin:0, color:"#fff", fontWeight:800, fontSize:14 }}>📋 R-ESOP Policy Overview</p>
          </div>
          <div style={{ padding:"14px 18px" }}>
            {POLICY.map((p,i) => (
              <div key={i} style={{ display:"flex", gap:12, padding:"8px 0", borderBottom: i<POLICY.length-1?"1px solid #f3f4f6":"none", fontSize:13 }}>
                <span style={{ color:"#9ca3af", fontWeight:600, flexShrink:0, minWidth:120 }}>{p.label}</span>
                <span style={{ color:"#1f2937", fontWeight:500 }}>{p.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background:"#fff", borderRadius:14, border:"1px solid #e5e7eb", padding:"18px 20px" }}>
          <p style={{ margin:"0 0 14px", fontWeight:800, fontSize:14, color:"#1a1a2e" }}>⏳ Vesting Schedule</p>
          {VESTING_SCHEDULE.map((v,i) => (
            <div key={i} style={{ marginBottom:10 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4, fontSize:13 }}>
                <span style={{ color:"#374151", fontWeight:600 }}>{v.year}</span>
                <span style={{ fontWeight:800, color: v.pct===0?"#9ca3af":"#1a1a2e" }}>{v.pct}%</span>
              </div>
              <div style={{ background:"#f3f4f6", borderRadius:99, height:7, overflow:"hidden" }}>
                <div style={{ width:`${v.pct}%`, height:"100%", background: v.pct===0?"#e5e7eb":"#3b82f6", borderRadius:99 }}/>
              </div>
            </div>
          ))}
          <div style={{ marginTop:12, padding:"10px 14px", background:"#eff6ff", borderRadius:8, fontSize:12, color:"#1e40af" }}>
            💡 1-year cliff: No vesting in Year 1. 25% vests each year from Year 2–5.
          </div>
          <p style={{ margin:"16px 0 8px", fontWeight:800, fontSize:13, color:"#1a1a2e" }}>✅ Eligibility Criteria</p>
          {ELIGIBILITY.map((e,i) => (
            <div key={i} style={{ display:"flex", gap:8, marginBottom:6, fontSize:12, color:"#374151" }}>
              <span style={{ color:"#10b981", fontWeight:700, flexShrink:0 }}>•</span>
              <span>{e}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Grant Form */}
      {showForm && (
        <div style={{ background:"#fff", borderRadius:16, border:"1px solid #e5e7eb", marginBottom:24, overflow:"hidden", boxShadow:"0 4px 24px rgba(0,0,0,.07)" }}>
          <div style={{ background:"#1a1a2e", padding:"16px 22px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <p style={{ margin:0, color:"#fff", fontWeight:800, fontSize:15 }}>📈 Grant New ESOP</p>
            <button onClick={() => setShowForm(false)} style={{ background:"rgba(255,255,255,.1)", border:"none", borderRadius:7, padding:"5px 12px", color:"#d1d5db", cursor:"pointer", fontSize:13 }}>✕</button>
          </div>
          <div style={{ padding:22 }}>
            {/* Grade selector */}
            <div style={{ marginBottom:16 }}>
              <label style={lbl}>Grade / Level</label>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                {Object.entries(GRADE_CONFIG).map(([g,c]) => (
                  <button key={g} onClick={() => setForm(f=>({...f, grade:g, allocation_pct:c.min, designation:c.designation}))}
                    style={{ padding:"8px 16px", border:`2px solid ${form.grade===g?c.color:"#e5e7eb"}`, borderRadius:8, background: form.grade===g?c.bg:"#fff", color: form.grade===g?c.color:"#6b7280", fontWeight:700, fontSize:13, cursor:"pointer" }}>
                    {g} · {c.designation}
                  </button>
                ))}
              </div>
              <p style={{ margin:"6px 0 0", fontSize:12, color:"#6b7280" }}>
                Allocation range for {form.grade}: <strong style={{ color:cfg?.color }}>{cfg?.min}% – {cfg?.max}%</strong>
              </p>
            </div>

            <div className="esop-form-grid" style={{ display:"grid", gap:14, marginBottom:14 }}>
              {/* ✅ FIXED: Active employees only in dropdown */}
              <div>
                <label style={lbl}>Employee * <span style={{ color:"#10b981", fontWeight:600 }}>(Active only)</span></label>
                <select style={inp} value={form.employee_id} onChange={e=>setForm(f=>({...f,employee_id:e.target.value}))}>
                  {employees.length === 0
                    ? <option value="">Loading employees...</option>
                    : <>
                        <option value="">-- Select Active Employee --</option>
                        {employees.map(e => (
                          <option key={e._id} value={e._id}>
                            {e.name} — {e.designation} ({e.department})
                          </option>
                        ))}
                      </>
                  }
                </select>
              </div>

              <div>
                <label style={lbl}>Total Options</label>
                <input type="number" style={inp} value={form.total_options} onChange={e=>setForm(f=>({...f,total_options:Number(e.target.value)}))} />
              </div>
              <div>
                <label style={lbl}>Allocation % (within band)</label>
                <input type="number" step="0.01" style={inp} value={form.allocation_pct} onChange={e=>setForm(f=>({...f,allocation_pct:Number(e.target.value)}))} min={cfg?.min} max={cfg?.max} />
              </div>
              <div>
                <label style={lbl}>Exercise Price (₹/share) *</label>
                <input type="number" style={inp} value={form.exercise_price} onChange={e=>setForm(f=>({...f,exercise_price:e.target.value}))} placeholder="e.g. 100" />
              </div>
              <div>
                <label style={lbl}>Company Valuation (₹ crore)</label>
                <input type="number" style={inp} value={form.company_valuation} onChange={e=>setForm(f=>({...f,company_valuation:e.target.value}))} placeholder="e.g. 50" />
              </div>
              <div>
                <label style={lbl}>Grant Date</label>
                <input type="date" style={inp} value={form.grant_date} onChange={e=>setForm(f=>({...f,grant_date:e.target.value}))} />
              </div>
              <div>
                <label style={lbl}>Vesting Start Date</label>
                <input type="date" style={inp} value={form.vesting_start} onChange={e=>setForm(f=>({...f,vesting_start:e.target.value}))} />
              </div>
              <div>
                <label style={lbl}>Payout Method</label>
                <select style={inp} value={form.payout_method} onChange={e=>setForm(f=>({...f,payout_method:e.target.value}))}>
                  <option value="shares">Convert to Shares (FMV)</option>
                  <option value="cash_equivalent">Cash Equivalent Payout</option>
                </select>
              </div>
              <div>
                <label style={lbl}>Approved By</label>
                <input style={inp} value={form.approved_by} onChange={e=>setForm(f=>({...f,approved_by:e.target.value}))} placeholder="Board / CPO name" />
              </div>
            </div>

            {/* Live calculation */}
            {form.exercise_price && form.company_valuation && (
              <div style={{ background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:10, padding:"14px 18px", marginBottom:16, display:"flex", gap:24, flexWrap:"wrap" }}>
                <div>
                  <p style={{ margin:"0 0 2px", fontSize:11, color:"#6b7280", fontWeight:700 }}>TOTAL VALUE AT EXERCISE</p>
                  <p style={{ margin:0, fontSize:18, fontWeight:900, color:"#10b981" }}>
                    ₹{(form.total_options * Number(form.exercise_price)).toLocaleString("en-IN")}
                  </p>
                </div>
                <div>
                  <p style={{ margin:"0 0 2px", fontSize:11, color:"#6b7280", fontWeight:700 }}>IF RADNUS = ₹{form.company_valuation}Cr</p>
                  <p style={{ margin:0, fontSize:18, fontWeight:900, color:"#3b82f6" }}>
                    ₹{(Number(form.company_valuation) * 1e7 * (form.allocation_pct/100)).toLocaleString("en-IN")} potential value
                  </p>
                </div>
              </div>
            )}

            <div style={{ marginBottom:16 }}>
              <label style={lbl}>Notes</label>
              <textarea style={{ ...inp, minHeight:60, resize:"vertical" }} value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="Any special terms..." />
            </div>

            <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
              <button onClick={() => setShowForm(false)} style={{ padding:"10px 24px", border:"1px solid #e5e7eb", borderRadius:8, background:"#fff", color:"#374151", fontWeight:600, cursor:"pointer" }}>Cancel</button>
              <button onClick={handleGrant} disabled={saving} style={{ padding:"10px 28px", border:"none", borderRadius:8, background:saving?"#93c5fd":"#1a1a2e", color:"#fff", fontWeight:700, fontSize:14, cursor:saving?"not-allowed":"pointer" }}>
                {saving ? "Granting..." : "Grant ESOP 📈"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grants Table */}
      <div style={{ background:"#fff", borderRadius:14, border:"1px solid #e5e7eb", overflow:"hidden" }}>
        <div style={{ padding:"16px 20px", borderBottom:"1px solid #f3f4f6", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:8 }}>
          <h3 style={{ margin:0, fontSize:15, fontWeight:700, color:"#1a1a2e" }}>All ESOP Grants ({filtered.length})</h3>
          <div style={{ display:"flex", gap:8 }}>
            <select style={{ ...inp, width:"auto", fontSize:12 }} value={filterGrade} onChange={e=>setFG(e.target.value)}>
              <option value="All">All Grades</option>
              {Object.keys(GRADE_CONFIG).map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            <select style={{ ...inp, width:"auto", fontSize:12 }} value={filterStatus} onChange={e=>setFS(e.target.value)}>
              <option value="All">All Status</option>
              {Object.entries(STATUS_CFG).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign:"center", padding:"60px 0" }}>
            <div style={{ fontSize:40, marginBottom:10 }}>📈</div>
            <p style={{ color:"#6b7280", fontWeight:600 }}>No ESOP grants yet</p>
            <p style={{ color:"#9ca3af", fontSize:13 }}>Click "Grant ESOP" to issue the first grant</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="esop-table" style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                <thead>
                  <tr style={{ background:"#f8fafc" }}>
                    {["Employee","Grade","Options","Alloc%","Exercise Price","Vested","Status","Actions"].map(h=>(
                      <th key={h} style={{ padding:"12px 16px", textAlign:"left", fontWeight:700, color:"#374151", borderBottom:"2px solid #e5e7eb", whiteSpace:"nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((g,i) => {
                    const gc  = GRADE_CONFIG[g.grade] || {};
                    const st  = STATUS_CFG[g.status];
                    const vPct = getVestedPct(g);
                    return (
                      <tr key={g._id} style={{ borderBottom:"1px solid #f3f4f6", background:i%2===0?"#fff":"#fafafa" }}>
                        <td style={{ padding:"13px 16px" }}>
                          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                            <div style={{ width:34, height:34, borderRadius:"50%", background:gc.bg, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, color:gc.color, fontSize:14 }}>
                              {g.employee_id?.name?.charAt(0)||"?"}
                            </div>
                            <div>
                              <p style={{ margin:0, fontWeight:700, color:"#1a1a2e" }}>{g.employee_id?.name}</p>
                              <p style={{ margin:0, fontSize:11, color:"#9ca3af" }}>{g.employee_id?.department}</p>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding:"13px 16px" }}>
                          <span style={{ background:gc.bg, color:gc.color, padding:"4px 10px", borderRadius:20, fontSize:11, fontWeight:700 }}>{g.grade}</span>
                        </td>
                        <td style={{ padding:"13px 16px", fontWeight:700, color:"#1a1a2e" }}>{g.total_options?.toLocaleString()}</td>
                        <td style={{ padding:"13px 16px", color:"#374151" }}>{g.allocation_pct}%</td>
                        <td style={{ padding:"13px 16px", color:"#374151" }}>₹{Number(g.exercise_price).toLocaleString("en-IN")}</td>
                        <td style={{ padding:"13px 16px", minWidth:100 }}>
                          <div style={{ background:"#f3f4f6", borderRadius:99, height:6, overflow:"hidden", marginBottom:3 }}>
                            <div style={{ width:`${vPct}%`, height:"100%", background:"#3b82f6", borderRadius:99 }}/>
                          </div>
                          <span style={{ fontSize:11, color:"#6b7280" }}>{vPct}% vested</span>
                        </td>
                        <td style={{ padding:"13px 16px" }}>
                          <span style={{ background:st.bg, color:st.color, padding:"4px 12px", borderRadius:20, fontSize:11, fontWeight:700 }}>{st.label}</span>
                        </td>
                        <td style={{ padding:"13px 16px" }}>
                          <div style={{ display:"flex", gap:5 }}>
                            {g.status==="granted"  && <button onClick={()=>handleStatus(g._id,"vesting")}  style={{ padding:"4px 10px", background:"#fffbeb", border:"1px solid #fde68a", borderRadius:5, color:"#d97706", fontSize:11, fontWeight:600, cursor:"pointer" }}>Start Vesting</button>}
                            {g.status==="vesting"  && <button onClick={()=>handleStatus(g._id,"vested")}   style={{ padding:"4px 10px", background:"#eff6ff", border:"1px solid #bfdbfe", borderRadius:5, color:"#2563eb", fontSize:11, fontWeight:600, cursor:"pointer" }}>Mark Vested</button>}
                            {g.status==="vested"   && <button onClick={()=>handleStatus(g._id,"exercised")} style={{ padding:"4px 10px", background:"#ecfdf5", border:"1px solid #6ee7b7", borderRadius:5, color:"#10b981", fontSize:11, fontWeight:600, cursor:"pointer" }}>Exercise</button>}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="esop-cards">
              {filtered.map(g => {
                const gc   = GRADE_CONFIG[g.grade] || {};
                const st   = STATUS_CFG[g.status];
                const vPct = getVestedPct(g);
                return (
                  <div key={g._id} style={{ border:"1px solid #e5e7eb", borderRadius:10, padding:"14px 16px", background:"#fff" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
                      <div>
                        <p style={{ margin:0, fontWeight:700, color:"#1a1a2e" }}>{g.employee_id?.name}</p>
                        <p style={{ margin:0, fontSize:12, color:"#6b7280" }}>{g.employee_id?.department}</p>
                      </div>
                      <div style={{ display:"flex", gap:6, alignItems:"flex-start" }}>
                        <span style={{ background:gc.bg, color:gc.color, padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:700 }}>{g.grade}</span>
                        <span style={{ background:st.bg, color:st.color, padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:700 }}>{st.label}</span>
                      </div>
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"6px 12px", fontSize:13, marginBottom:10 }}>
                      <div><span style={{ color:"#9ca3af", fontSize:10 }}>OPTIONS</span><p style={{ margin:"2px 0 0", fontWeight:800, color:"#1a1a2e" }}>{g.total_options?.toLocaleString()}</p></div>
                      <div><span style={{ color:"#9ca3af", fontSize:10 }}>EXERCISE PRICE</span><p style={{ margin:"2px 0 0", fontWeight:700 }}>₹{Number(g.exercise_price).toLocaleString("en-IN")}</p></div>
                    </div>
                    <div style={{ background:"#f3f4f6", borderRadius:99, height:6, overflow:"hidden", marginBottom:6 }}>
                      <div style={{ width:`${vPct}%`, height:"100%", background:"#3b82f6", borderRadius:99 }}/>
                    </div>
                    <p style={{ margin:"0 0 10px", fontSize:12, color:"#6b7280" }}>{vPct}% vested</p>
                    <div style={{ display:"flex", gap:6 }}>
                      {g.status==="granted"  && <button onClick={()=>handleStatus(g._id,"vesting")}  style={{ flex:1, padding:"7px", background:"#fffbeb", border:"1px solid #fde68a", borderRadius:7, color:"#d97706", fontSize:12, fontWeight:600, cursor:"pointer" }}>Start Vesting</button>}
                      {g.status==="vesting"  && <button onClick={()=>handleStatus(g._id,"vested")}   style={{ flex:1, padding:"7px", background:"#eff6ff", border:"1px solid #bfdbfe", borderRadius:7, color:"#2563eb", fontSize:12, fontWeight:600, cursor:"pointer" }}>Mark Vested</button>}
                      {g.status==="vested"   && <button onClick={()=>handleStatus(g._id,"exercised")} style={{ flex:1, padding:"7px", background:"#ecfdf5", border:"1px solid #6ee7b7", borderRadius:7, color:"#10b981", fontSize:12, fontWeight:600, cursor:"pointer" }}>Exercise</button>}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Governance & Impact */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginTop:20 }}>
        <div style={{ background:"#fff", borderRadius:14, border:"1px solid #e5e7eb", padding:"18px 20px" }}>
          <p style={{ margin:"0 0 12px", fontWeight:700, fontSize:14, color:"#1a1a2e" }}>⚖️ Governance & Compliance</p>
          {[
            "Administered under Companies Act, 2013 – Rule 12",
            "All grants approved by Board of Directors and recorded in ESOP Register",
            "HR & Finance jointly maintain ESOP Ledger for each participant",
            "Exit terms and forfeiture conditions clearly defined in offer letter annexure",
          ].map((t,i) => (
            <div key={i} style={{ display:"flex", gap:8, marginBottom:8, fontSize:13, color:"#374151" }}>
              <span style={{ color:"#3b82f6", fontWeight:700, flexShrink:0 }}>•</span><span>{t}</span>
            </div>
          ))}
        </div>
        <div style={{ background:"#fff", borderRadius:14, border:"1px solid #e5e7eb", padding:"18px 20px" }}>
          <p style={{ margin:"0 0 12px", fontWeight:700, fontSize:14, color:"#1a1a2e" }}>🎯 Expected Impact</p>
          {IMPACT.map((h,i) => (
            <div key={i} style={{ display:"flex", gap:10, alignItems:"flex-start", background:"#f8fafc", borderRadius:8, padding:"10px 12px", border:"1px solid #e5e7eb", marginBottom:8 }}>
              <span style={{ fontSize:16, flexShrink:0 }}>{h.icon}</span>
              <p style={{ margin:0, fontSize:12, color:"#374151", lineHeight:1.5 }}>{h.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}