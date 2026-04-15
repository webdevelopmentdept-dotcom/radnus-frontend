import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { Download, Calculator, CheckCircle, DollarSign, Users } from "lucide-react";
import * as XLSX from "xlsx";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const CATEGORY_CONFIG = {
  exec: { label: "Executives / Sr. Executives", min: 5,  max: 10, freq: "Quarterly" },
  mgr:  { label: "Asst. Managers / Managers",   min: 10, max: 15, freq: "Quarterly / Half-Yearly" },
  sr:   { label: "Sr. Managers / GMs / AVPs",   min: 15, max: 20, freq: "Half-Yearly" },
  vp:   { label: "VP / Director / CXO",          min: 20, max: 30, freq: "Annual" },
};

const STATUS_COLORS = {
  draft:    { bg: "#fffbeb", color: "#d97706", label: "Draft" },
  approved: { bg: "#eff6ff", color: "#2563eb", label: "Approved" },
  paid:     { bg: "#f0fdf4", color: "#16a34a", label: "Paid" },
};

const getRatingInfo = (score) => {
  if (score >= 90) return { label: "Outstanding",          color: "#16a34a" };
  if (score >= 75) return { label: "Exceeds Expectations", color: "#2563eb" };
  if (score >= 60) return { label: "Meets Expectations",   color: "#d97706" };
  if (score >= 45) return { label: "Needs Improvement",    color: "#ea580c" };
  return              { label: "Unsatisfactory",           color: "#dc2626" };
};

const STYLES = `
  .vp-page { padding: 28px 32px; }
  .vp-stats { grid-template-columns: repeat(4, 1fr); }
  .vp-form-grid { grid-template-columns: 1fr 1fr; }
  .vp-score-grid { grid-template-columns: 1fr 1fr; }
  .vp-table-wrap { display: block !important; }
  .vp-card-list { display: none !important; }

  @media (max-width: 768px) {
    .vp-page { padding: 16px; }
    .vp-stats { grid-template-columns: repeat(2, 1fr) !important; }
    .vp-form-grid { grid-template-columns: 1fr !important; }
    .vp-score-grid { grid-template-columns: 1fr !important; }
    .vp-table-wrap { display: none !important; }
    .vp-card-list { display: flex !important; flex-direction: column; gap: 12px; padding: 12px 16px; }
  }
  @media (max-width: 480px) {
    .vp-stats { grid-template-columns: 1fr !important; }
  }
`;

const labelStyle = {
  display: "block", fontSize: 12, fontWeight: 700,
  color: "#374151", marginBottom: 6
};
const inputStyle = {
  width: "100%", padding: "9px 12px", border: "1px solid #d1d5db",
  borderRadius: 8, fontSize: 13, color: "#1a1a2e", background: "#fff",
  boxSizing: "border-box", outline: "none",
};

// ── Score Slider ─────────────────────────────────────────────────────────────
function ScoreSlider({ label, weight, value, onChange }) {
  const color = value >= 80 ? "#16a34a" : value >= 60 ? "#2563eb" : value >= 40 ? "#d97706" : "#dc2626";
  return (
    <div style={{ background: "#f8fafc", borderRadius: 10, padding: 14, border: "1px solid #e5e7eb" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <div>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#1a1a2e" }}>{label}</p>
          <p style={{ margin: 0, fontSize: 11, color: "#9ca3af" }}>Weightage: {weight}%</p>
        </div>
        <span style={{ fontSize: 22, fontWeight: 900, color }}>{value}</span>
      </div>
      <input type="range" min="0" max="100" value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: "100%", accentColor: color }} />
      <div style={{ background: "#e5e7eb", borderRadius: 99, height: 4, overflow: "hidden", marginTop: 4 }}>
        <div style={{ width: `${value}%`, height: "100%", background: color, borderRadius: 99, transition: "width .3s" }} />
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function VariablePayDashboard() {
  const [records, setRecords]       = useState([]);
  const [employees, setEmployees]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showCalc, setShowCalc]     = useState(false);
  const [saving, setSaving]         = useState(false);
  const [toast, setToast]           = useState(null);
  const [filterStatus, setFilterStatus] = useState("All");

  const [form, setForm] = useState({
    employee_id: "", period: "",
    employee_category: "sr",
    annual_ctc: "", variable_pct: 17,
    okr_score: 80, kpi_score: 75,
    feedback_score: 80, innovation_score: 70,
    notes: ""
  });

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [recRes, empRes] = await Promise.all([
        axios.get(`${API_BASE}/api/variable-pay`),
        axios.get(`${API_BASE}/api/hr/employees`),   // ✅ active employees API
      ]);
      if (recRes.data.success) setRecords(recRes.data.data);

      // ✅ Only active employees in dropdown
      if (empRes.data) {
        const active = Array.isArray(empRes.data)
          ? empRes.data.filter(emp => emp.status === "active")
          : [];
        setEmployees(active);
      }
    } catch { showToast("Failed to load data", "error"); }
    finally { setLoading(false); }
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const perfScore = Math.round(
    (form.okr_score * 0.40) + (form.kpi_score * 0.30) +
    (form.feedback_score * 0.20) + (form.innovation_score * 0.10)
  );
  const varPayAmount = form.annual_ctc
    ? Math.round(Number(form.annual_ctc) * (form.variable_pct / 100) * (perfScore / 100))
    : 0;

  const catConfig = CATEGORY_CONFIG[form.employee_category];

  const handleSave = async () => {
    if (!form.employee_id) return showToast("Select an employee", "error");
    if (!form.period)      return showToast("Enter period", "error");
    if (!form.annual_ctc)  return showToast("Enter Annual CTC", "error");
    setSaving(true);
    try {
      await axios.post(`${API_BASE}/api/variable-pay/calculate`, {
        ...form,
        okr_score: form.okr_score,
        kpi_score: form.kpi_score,
        feedback_score: form.feedback_score,
        innovation_score: form.innovation_score,
      });
      showToast("Variable pay calculated & saved!");
      setShowCalc(false);
      fetchAll();
    } catch (err) {
      showToast(err?.response?.data?.message || "Save failed", "error");
    } finally { setSaving(false); }
  };

  const handleApprove = async (id) => {
    try {
      await axios.patch(`${API_BASE}/api/variable-pay/${id}/approve`, {});
      showToast("Approved!");
      fetchAll();
    } catch { showToast("Approve failed", "error"); }
  };

  const handlePaid = async (id) => {
    try {
      await axios.patch(`${API_BASE}/api/variable-pay/${id}/paid`, {});
      showToast("Marked as Paid!");
      fetchAll();
    } catch { showToast("Failed", "error"); }
  };

  const filtered = useMemo(() => {
    if (filterStatus === "All") return records;
    return records.filter(r => r.status === filterStatus);
  }, [records, filterStatus]);

  const summary = useMemo(() => ({
    total:    records.length,
    draft:    records.filter(r => r.status === "draft").length,
    approved: records.filter(r => r.status === "approved").length,
    paid:     records.filter(r => r.status === "paid").length,
    totalAmt: records.filter(r => r.status !== "draft")
                     .reduce((s, r) => s + (r.variable_pay_amount || 0), 0),
  }), [records]);

  const exportExcel = () => {
    const rows = filtered.map((r, i) => ({
      "#": i + 1,
      "Employee": r.employee_id?.name,
      "Department": r.employee_id?.department,
      "Period": r.period,
      "CTC (₹)": r.annual_ctc,
      "Variable %": r.variable_pct,
      "OKR Score": r.okr_score,
      "KPI Score": r.kpi_score,
      "360° Score": r.feedback_score,
      "Innovation": r.innovation_score,
      "Perf Score": r.performance_score,
      "Variable Pay (₹)": r.variable_pay_amount,
      "Status": STATUS_COLORS[r.status]?.label,
    }));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, "Variable Pay");
    XLSX.writeFile(wb, `VariablePay_${new Date().toLocaleDateString("en-IN").replace(/\//g,"-")}.xlsx`);
  };

  if (loading) return (
    <div style={{ display:"flex", justifyContent:"center", alignItems:"center", height:"60vh" }}>
      <p style={{ color:"#6b7280" }}>Loading...</p>
    </div>
  );

  return (
    <div className="vp-page" style={{ fontFamily:"'Segoe UI',sans-serif", minHeight:"100vh", background:"#f4f6fb" }}>
      <style>{STYLES}</style>

      {toast && (
        <div style={{ position:"fixed", top:20, right:16, zIndex:9999, background: toast.type==="error"?"#ff4d4f":"#52c41a", color:"#fff", padding:"12px 20px", borderRadius:8, fontWeight:500, fontSize:14 }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24, gap:12, flexWrap:"wrap" }}>
        <div>
          <h2 style={{ margin:0, fontSize:22, fontWeight:800, color:"#1a1a2e" }}>Variable Pay</h2>
          <p style={{ margin:"4px 0 0", color:"#6b7280", fontSize:14 }}>Performance-based variable pay calculation & management</p>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={exportExcel} disabled={!filtered.length}
            style={{ display:"flex", alignItems:"center", gap:6, padding:"10px 16px", background:"#fff", border:"1px solid #e5e7eb", borderRadius:9, fontWeight:600, fontSize:13, cursor:"pointer", color:"#374151" }}>
            <Download size={15}/> Export
          </button>
          <button onClick={() => setShowCalc(c => !c)}
            style={{ display:"flex", alignItems:"center", gap:6, padding:"10px 20px", background:"#1a1a2e", color:"#fff", border:"none", borderRadius:9, fontWeight:700, fontSize:14, cursor:"pointer" }}>
            <Calculator size={15}/> {showCalc ? "Close" : "Calculate Pay"}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="vp-stats" style={{ display:"grid", gap:14, marginBottom:24 }}>
        {[
          { label:"Total Records",    value: summary.total,    color:"#2563eb", bg:"#eff6ff", icon:<Users size={20} color="#2563eb"/> },
          { label:"Pending Approval", value: summary.draft,    color:"#d97706", bg:"#fffbeb", icon:<Calculator size={20} color="#d97706"/> },
          { label:"Approved",         value: summary.approved, color:"#2563eb", bg:"#eff6ff", icon:<CheckCircle size={20} color="#2563eb"/> },
          { label:"Total Pay (₹)",    value:`₹${summary.totalAmt.toLocaleString("en-IN")}`, color:"#16a34a", bg:"#f0fdf4", icon:<DollarSign size={20} color="#16a34a"/> },
        ].map((s, i) => (
          <div key={i} style={{ background:"#fff", borderRadius:12, padding:"16px 20px", border:"1px solid #e5e7eb", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <p style={{ margin:"0 0 4px", fontSize:11, color:"#6b7280", fontWeight:700, textTransform:"uppercase" }}>{s.label}</p>
              <p style={{ margin:0, fontSize:22, fontWeight:900, color:s.color }}>{s.value}</p>
            </div>
            <div style={{ width:44, height:44, borderRadius:10, background:s.bg, display:"flex", alignItems:"center", justifyContent:"center" }}>{s.icon}</div>
          </div>
        ))}
      </div>

      {/* ══ Calculator Panel ══ */}
      {showCalc && (
        <div style={{ background:"#fff", borderRadius:16, border:"1px solid #e5e7eb", marginBottom:24, overflow:"hidden", boxShadow:"0 4px 24px rgba(0,0,0,.07)" }}>
          <div style={{ background:"#1a1a2e", padding:"16px 22px" }}>
            <p style={{ margin:0, color:"#fff", fontWeight:800, fontSize:15 }}>Variable Pay Calculator — Policy 3.24</p>
            <p style={{ margin:"3px 0 0", color:"#9ca3af", fontSize:12 }}>
              Formula: (CTC × Variable %) × (Performance Score ÷ 100)
            </p>
          </div>

          <div style={{ padding:22 }}>
            {/* Employee + Period */}
            <div className="vp-form-grid" style={{ display:"grid", gap:16, marginBottom:16 }}>
              <div>
                <label style={labelStyle}>Employee * <span style={{ color:"#16a34a", fontWeight:500, fontSize:11 }}>({employees.length} active)</span></label>
                <select style={inputStyle} value={form.employee_id}
                  onChange={e => setForm(f => ({...f, employee_id: e.target.value}))}>
                  <option value="">-- Select Active Employee --</option>
                  {employees.map(emp => (
                    <option key={emp._id} value={emp._id}>
                      {emp.name} — {emp.designation} ({emp.department})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Period *</label>
                <input style={inputStyle} placeholder="e.g. Q1 2026 or March 2026"
                  value={form.period} onChange={e => setForm(f => ({...f, period: e.target.value}))} />
              </div>
            </div>

            {/* Category + CTC + Variable % */}
            <div className="vp-form-grid" style={{ display:"grid", gap:16, marginBottom:20 }}>
              <div>
                <label style={labelStyle}>Employee Category</label>
                <select style={inputStyle} value={form.employee_category}
                  onChange={e => {
                    const cat = e.target.value;
                    const cfg = CATEGORY_CONFIG[cat];
                    setForm(f => ({...f, employee_category: cat, variable_pct: Math.round((cfg.min+cfg.max)/2)}));
                  }}>
                  {Object.entries(CATEGORY_CONFIG).map(([k,v]) => (
                    <option key={k} value={k}>{v.label} ({v.min}–{v.max}%)</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Annual CTC (₹) *</label>
                <input type="number" style={inputStyle} placeholder="e.g. 1200000"
                  value={form.annual_ctc} onChange={e => setForm(f => ({...f, annual_ctc: e.target.value}))} />
              </div>
              <div>
                <label style={labelStyle}>Variable % (within band: {catConfig.min}–{catConfig.max}%)</label>
                <input type="range" min={catConfig.min} max={catConfig.max}
                  value={form.variable_pct} step="1"
                  onChange={e => setForm(f => ({...f, variable_pct: Number(e.target.value)}))}
                  style={{ width:"100%", accentColor:"#2563eb", marginBottom:4 }} />
                <p style={{ margin:0, fontSize:13, fontWeight:700, color:"#2563eb" }}>{form.variable_pct}%</p>
              </div>
              <div style={{ background:"#f8fafc", borderRadius:10, padding:14, border:"1px solid #e5e7eb" }}>
                <p style={{ margin:"0 0 4px", fontSize:12, color:"#9ca3af" }}>Payout Frequency</p>
                <p style={{ margin:0, fontSize:14, fontWeight:700, color:"#1a1a2e" }}>{catConfig.freq}</p>
              </div>
            </div>

            {/* Score Sliders */}
            <p style={{ margin:"0 0 12px", fontWeight:700, fontSize:14, color:"#1a1a2e" }}>
              Performance Score Inputs
            </p>
            <div className="vp-score-grid" style={{ display:"grid", gap:12, marginBottom:20 }}>
              <ScoreSlider label="OKR Achievement"         weight={40} value={form.okr_score}        onChange={v => setForm(f=>({...f, okr_score:v}))} />
              <ScoreSlider label="KPI Results"             weight={30} value={form.kpi_score}        onChange={v => setForm(f=>({...f, kpi_score:v}))} />
              <ScoreSlider label="360° Feedback & Culture" weight={20} value={form.feedback_score}   onChange={v => setForm(f=>({...f, feedback_score:v}))} />
              <ScoreSlider label="Innovation / Initiative" weight={10} value={form.innovation_score} onChange={v => setForm(f=>({...f, innovation_score:v}))} />
            </div>

            {/* Live Result */}
            <div style={{ background: perfScore >= 90 ? "#f0fdf4" : perfScore >= 60 ? "#eff6ff" : "#fffbeb", border:`1px solid ${getRatingInfo(perfScore).color}33`, borderRadius:12, padding:"18px 22px", marginBottom:16, display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
              <div>
                <p style={{ margin:"0 0 2px", fontSize:12, color:"#6b7280", fontWeight:600 }}>PERFORMANCE SCORE</p>
                <p style={{ margin:0, fontSize:32, fontWeight:900, color: getRatingInfo(perfScore).color }}>{perfScore}%</p>
                <p style={{ margin:0, fontSize:13, fontWeight:700, color: getRatingInfo(perfScore).color }}>{getRatingInfo(perfScore).label}</p>
              </div>
              <div style={{ textAlign:"right" }}>
                <p style={{ margin:"0 0 2px", fontSize:12, color:"#6b7280", fontWeight:600 }}>VARIABLE PAY</p>
                <p style={{ margin:0, fontSize:28, fontWeight:900, color:"#16a34a" }}>
                  ₹{varPayAmount.toLocaleString("en-IN")}
                </p>
                <p style={{ margin:0, fontSize:12, color:"#9ca3af" }}>
                  ₹{form.annual_ctc ? Number(form.annual_ctc).toLocaleString("en-IN") : 0} × {form.variable_pct}% × {perfScore}%
                </p>
              </div>
            </div>

            {/* Recognition */}
            {perfScore >= 90 && (
              <div style={{ background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:10, padding:"10px 16px", marginBottom:16, fontSize:13, color:"#16a34a", fontWeight:600 }}>
                🏆 Score &gt;90% — Eligible for Radnus Excellence Certificate + HiPo Program (Ref: 3.23)
              </div>
            )}

            <div>
              <label style={labelStyle}>Notes (Optional)</label>
              <textarea style={{ ...inputStyle, resize:"vertical", minHeight:60 }}
                placeholder="Any notes..."
                value={form.notes} onChange={e => setForm(f=>({...f, notes: e.target.value}))} />
            </div>

            <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:20 }}>
              <button onClick={() => setShowCalc(false)}
                style={{ padding:"10px 24px", border:"1px solid #e5e7eb", borderRadius:8, background:"#fff", color:"#374151", fontWeight:600, cursor:"pointer" }}>
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                style={{ padding:"10px 28px", border:"none", borderRadius:8, background: saving?"#93c5fd":"#1a1a2e", color:"#fff", fontWeight:700, fontSize:14, cursor: saving?"not-allowed":"pointer" }}>
                {saving ? "Saving..." : "Save Variable Pay"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Records Table */}
      <div style={{ background:"#fff", borderRadius:14, border:"1px solid #e5e7eb", overflow:"hidden" }}>
        <div style={{ padding:"16px 20px", borderBottom:"1px solid #f3f4f6", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:8 }}>
          <h3 style={{ margin:0, fontSize:15, fontWeight:700, color:"#1a1a2e" }}>All Records</h3>
          <div style={{ display:"flex", gap:6 }}>
            {["All","draft","approved","paid"].map(s => (
              <button key={s} onClick={() => setFilterStatus(s)}
                style={{ padding:"5px 14px", border:"1px solid", borderColor: filterStatus===s?"#1a1a2e":"#e5e7eb", borderRadius:20, background: filterStatus===s?"#1a1a2e":"#fff", color: filterStatus===s?"#fff":"#6b7280", fontSize:12, fontWeight:600, cursor:"pointer", textTransform:"capitalize" }}>
                {s === "All" ? "All" : STATUS_COLORS[s]?.label}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign:"center", padding:"60px 0" }}>
            <div style={{ fontSize:40, marginBottom:10 }}>💰</div>
            <p style={{ color:"#6b7280", fontWeight:600 }}>No variable pay records yet</p>
            <p style={{ color:"#9ca3af", fontSize:13 }}>Click "Calculate Pay" to create the first record</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="vp-table-wrap" style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                <thead>
                  <tr style={{ background:"#f8fafc" }}>
                    {["Employee","Department","Period","CTC","Variable %","Perf Score","Variable Pay","Status","Actions"].map(h => (
                      <th key={h} style={{ padding:"12px 16px", textAlign:"left", fontWeight:700, color:"#374151", borderBottom:"2px solid #e5e7eb", whiteSpace:"nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r, i) => {
                    const st = STATUS_COLORS[r.status];
                    const ri = getRatingInfo(r.performance_score);
                    return (
                      <tr key={r._id} style={{ borderBottom:"1px solid #f3f4f6", background: i%2===0?"#fff":"#fafafa" }}>
                        <td style={{ padding:"13px 16px" }}>
                          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                            <div style={{ width:34, height:34, borderRadius:"50%", background:"#eff6ff", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, color:"#2563eb", fontSize:14 }}>
                              {r.employee_id?.name?.charAt(0)||"?"}
                            </div>
                            <div>
                              <p style={{ margin:0, fontWeight:700, color:"#1a1a2e" }}>{r.employee_id?.name}</p>
                              <p style={{ margin:0, fontSize:11, color:"#9ca3af" }}>{r.employee_id?.designation}</p>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding:"13px 16px", color:"#374151" }}>{r.employee_id?.department}</td>
                        <td style={{ padding:"13px 16px" }}>
                          <span style={{ background:"#f3f4f6", padding:"3px 8px", borderRadius:5, fontWeight:600, fontSize:12 }}>{r.period}</span>
                        </td>
                        <td style={{ padding:"13px 16px", color:"#374151" }}>₹{r.annual_ctc?.toLocaleString("en-IN")}</td>
                        <td style={{ padding:"13px 16px", color:"#2563eb", fontWeight:700 }}>{r.variable_pct}%</td>
                        <td style={{ padding:"13px 16px" }}>
                          <span style={{ fontWeight:900, color:ri.color, fontSize:15 }}>{r.performance_score}%</span>
                          <br/>
                          <span style={{ fontSize:10, color:ri.color }}>{ri.label}</span>
                        </td>
                        <td style={{ padding:"13px 16px" }}>
                          <span style={{ fontWeight:900, color:"#16a34a", fontSize:15 }}>
                            ₹{r.variable_pay_amount?.toLocaleString("en-IN")}
                          </span>
                        </td>
                        <td style={{ padding:"13px 16px" }}>
                          <span style={{ background:st.bg, color:st.color, fontWeight:700, padding:"4px 12px", borderRadius:20, fontSize:12 }}>
                            {st.label}
                          </span>
                        </td>
                        <td style={{ padding:"13px 16px" }}>
                          <div style={{ display:"flex", gap:6 }}>
                            {r.status === "draft" && (
                              <button onClick={() => handleApprove(r._id)}
                                style={{ padding:"5px 12px", background:"#eff6ff", border:"1px solid #bfdbfe", borderRadius:6, color:"#2563eb", fontSize:12, fontWeight:600, cursor:"pointer" }}>
                                Approve
                              </button>
                            )}
                            {r.status === "approved" && (
                              <button onClick={() => handlePaid(r._id)}
                                style={{ padding:"5px 12px", background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:6, color:"#16a34a", fontSize:12, fontWeight:600, cursor:"pointer" }}>
                                Mark Paid
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
            <div className="vp-card-list">
              {filtered.map(r => {
                const st = STATUS_COLORS[r.status];
                const ri = getRatingInfo(r.performance_score);
                return (
                  <div key={r._id} style={{ border:"1px solid #e5e7eb", borderRadius:10, padding:"14px 16px", background:"#fff" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
                      <div>
                        <p style={{ margin:0, fontWeight:700, color:"#1a1a2e" }}>{r.employee_id?.name}</p>
                        <p style={{ margin:0, fontSize:12, color:"#6b7280" }}>{r.employee_id?.department} · {r.period}</p>
                      </div>
                      <span style={{ background:st.bg, color:st.color, fontWeight:700, padding:"4px 10px", borderRadius:20, fontSize:11 }}>{st.label}</span>
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"6px 12px", fontSize:13, marginBottom:10 }}>
                      <div><span style={{ color:"#9ca3af", fontSize:10 }}>PERF SCORE</span><p style={{ margin:"2px 0 0", fontWeight:900, color:ri.color, fontSize:18 }}>{r.performance_score}%</p></div>
                      <div><span style={{ color:"#9ca3af", fontSize:10 }}>VARIABLE PAY</span><p style={{ margin:"2px 0 0", fontWeight:900, color:"#16a34a", fontSize:16 }}>₹{r.variable_pay_amount?.toLocaleString("en-IN")}</p></div>
                    </div>
                    {r.status === "draft" && (
                      <button onClick={() => handleApprove(r._id)} style={{ width:"100%", padding:"8px", background:"#eff6ff", border:"1px solid #bfdbfe", borderRadius:7, color:"#2563eb", fontWeight:600, cursor:"pointer" }}>Approve</button>
                    )}
                    {r.status === "approved" && (
                      <button onClick={() => handlePaid(r._id)} style={{ width:"100%", padding:"8px", background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:7, color:"#16a34a", fontWeight:600, cursor:"pointer" }}>Mark Paid</button>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}