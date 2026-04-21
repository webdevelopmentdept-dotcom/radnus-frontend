import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkCircle01Icon, Delete02Icon, UserMultiple02Icon } from "@hugeicons/core-free-icons";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const inputStyle = {
  width:"100%", padding:"9px 12px", border:"1px solid #d1d5db",
  borderRadius:8, fontSize:13, color:"#1a1a2e", background:"#fff",
  boxSizing:"border-box", outline:"none",
};
const labelStyle = { display:"block", fontSize:12, fontWeight:700, color:"#374151", marginBottom:6 };

export default function IncentiveAssign() {
  const [employees,  setEmployees]  = useState([]);
  const [plans,      setPlans]      = useState([]);
  const [assigned,   setAssigned]   = useState([]); // existing assignments
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [toast,      setToast]      = useState(null);

  // form
  const [selEmp,     setSelEmp]     = useState("");
  const [selPlan,    setPlan]       = useState("");
  const [cycle,      setCycle]      = useState("Monthly");
  const [period,     setPeriod]     = useState(""); // e.g. "2026-04" or "2026-Q2"

  // filters
  const [filterDept, setFilterDept] = useState("All");
  const [search,     setSearch]     = useState("");

  useEffect(() => { fetchAll(); }, []);

 const fetchAll = async () => {
  setLoading(true);
  try {
    const [empRes, planRes, assignRes] = await Promise.all([
      axios.get(`${API_BASE}/api/hr/employees`),          // ✅ fixed
      axios.get(`${API_BASE}/api/incentive-plans`),
      axios.get(`${API_BASE}/api/incentive-assignments`),
    ]);

    // ✅ filter only active employees
    const allEmps = empRes.data?.data || empRes.data || [];
    setEmployees(allEmps.filter(e => e.status === "active"));

    setPlans(planRes.data?.data      || planRes.data   || []);
    setAssigned(assignRes.data?.data || assignRes.data || []);
  } catch { showToast("Failed to load", "error"); }
  finally   { setLoading(false); }
};

  const showToast = (msg, type="success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // dept filter for employee dropdown
  const depts = useMemo(() => ["All", ...new Set(employees.map(e=>e.department).filter(Boolean))], [employees]);

  const filteredEmps = useMemo(() => {
    return employees.filter(e => {
      const matchDept = filterDept==="All" || e.department===filterDept;
      const matchName = !search.trim() || e.name?.toLowerCase().includes(search.toLowerCase());
      return matchDept && matchName;
    });
  }, [employees, filterDept, search]);

  // auto-fill plan when employee selected (match dept)
  const handleEmpChange = (empId) => {
    setSelEmp(empId);
    const emp  = employees.find(e=>e._id===empId);
    const dPlan = plans.find(p=>p.department===emp?.department);
    if (dPlan) { setPlan(dPlan._id); setCycle(dPlan.cycle); }
  };

  const handleAssign = async () => {
    if (!selEmp || !selPlan || !period) { showToast("Employee, plan & period required", "error"); return; }
    setSaving(true);
    try {
      await axios.post(`${API_BASE}/api/incentive-assignments`, {
        employee_id: selEmp, plan_id: selPlan, cycle, period,
      });
      showToast("Plan assigned ✅");
      setSelEmp(""); setPlan(""); setPeriod("");
      fetchAll();
    } catch { showToast("Assign failed", "error"); }
    finally   { setSaving(false); }
  };

  const handleRemove = async (id) => {
    if (!window.confirm("Remove this assignment?")) return;
    try {
      await axios.delete(`${API_BASE}/api/incentive-assignments/${id}`);
      showToast("Removed ✅"); fetchAll();
    } catch { showToast("Remove failed","error"); }
  };

  // Period placeholder based on cycle
  const periodPlaceholder = cycle==="Monthly" ? "e.g. 2026-04" : cycle==="Quarterly" ? "e.g. 2026-Q2" : cycle==="Half-Yearly" ? "e.g. 2026-H1" : "e.g. 2026";

  const selectedPlan = plans.find(p=>p._id===selPlan);

  return (
    <div style={{ padding:"28px 32px", fontFamily:"'Segoe UI',sans-serif", minHeight:"100vh", background:"#f4f6fb" }}>
      <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>

      {toast && (
        <div style={{ position:"fixed", top:20, right:16, zIndex:9999, background:toast.type==="error"?"#ff4d4f":"#52c41a", color:"#fff", padding:"12px 20px", borderRadius:8, fontWeight:500, fontSize:14 }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom:24 }}>
        <h2 style={{ margin:0, fontSize:22, fontWeight:800, color:"#1a1a2e" }}>Assign Incentive Plans</h2>
        <p style={{ margin:"4px 0 0", color:"#6b7280", fontSize:14 }}>
          Link employees to a department incentive plan for a specific period
        </p>
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:16, marginBottom:24 }}>
        {[
          { label:"Total Assigned",  value: assigned.length,                                         color:"#2563eb" },
          { label:"Monthly",         value: assigned.filter(a=>a.cycle==="Monthly").length,           color:"#16a34a" },
          { label:"Quarterly",       value: assigned.filter(a=>a.cycle==="Quarterly").length,         color:"#d97706" },
          { label:"Employees",       value: new Set(assigned.map(a=>a.employee_id?._id||a.employee_id)).size, color:"#7c3aed" },
        ].map(s=>(
          <div key={s.label} style={{ background:"#fff", borderRadius:12, padding:"16px 20px", border:"1px solid #e5e7eb" }}>
            <p style={{ margin:"0 0 4px", fontSize:11, color:"#6b7280", fontWeight:700, textTransform:"uppercase" }}>{s.label}</p>
            <p style={{ margin:0, fontSize:26, fontWeight:800, color:s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Assign Form */}
      <div style={{ background:"#fff", borderRadius:14, border:"1px solid #e5e7eb", padding:"20px 24px", marginBottom:24 }}>
        <p style={{ margin:"0 0 16px", fontWeight:800, fontSize:15, color:"#1a1a2e" }}>
          ➕ New Assignment
        </p>

        {/* Filter row */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14 }}>
          <div>
            <label style={labelStyle}>Filter by Department</label>
            <select value={filterDept} onChange={e=>setFilterDept(e.target.value)} style={inputStyle}>
              {depts.map(d=><option key={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Search Employee</label>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Type name..." style={inputStyle} />
          </div>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:14, marginBottom:16 }}>
          {/* Employee */}
          <div>
            <label style={labelStyle}>Employee *</label>
            <select value={selEmp} onChange={e=>handleEmpChange(e.target.value)} style={inputStyle}>
              <option value="">Select employee...</option>
              {filteredEmps.map(e=>(
                <option key={e._id} value={e._id}>{e.name} — {e.department}</option>
              ))}
            </select>
          </div>

          {/* Plan — auto-filled */}
          <div>
            <label style={labelStyle}>Incentive Plan *</label>
            <select value={selPlan} onChange={e=>setPlan(e.target.value)} style={inputStyle}>
              <option value="">Select plan...</option>
              {plans.map(p=>(
                <option key={p._id} value={p._id}>{p.name} ({p.department} · {p.cycle})</option>
              ))}
            </select>
          </div>

          {/* Cycle (readonly from plan) */}
          <div>
            <label style={labelStyle}>Cycle</label>
            <select value={cycle} onChange={e=>setCycle(e.target.value)} style={inputStyle}>
              <option>Monthly</option>
              <option>Quarterly</option>
              <option>Half-Yearly</option>
              <option>Yearly</option>
            </select>
          </div>

          {/* Period */}
          <div>
            <label style={labelStyle}>Period *</label>
            <input value={period} onChange={e=>setPeriod(e.target.value)} placeholder={periodPlaceholder} style={inputStyle} />
          </div>
        </div>

        {/* Plan preview */}
        {selectedPlan && (
          <div style={{ background:"#f8fafc", borderRadius:10, padding:"12px 16px", marginBottom:16, border:"1px solid #e5e7eb" }}>
            <p style={{ margin:"0 0 8px", fontSize:12, fontWeight:700, color:"#6b7280", textTransform:"uppercase" }}>Plan Preview — {selectedPlan.name}</p>
            <div style={{ display:"flex", gap:24, flexWrap:"wrap" }}>
              {(selectedPlan.slabs||[]).map((s,i)=>{
                const sc = s.type==="none"?"#9ca3af":s.type==="percentage"?"#16a34a":"#d97706";
                return (
                  <div key={i}>
                    <span style={{ fontSize:12, color:"#374151", fontWeight:600 }}>{s.min_score}–{s.max_score}%: </span>
                    <span style={{ fontSize:12, fontWeight:800, color:sc }}>
                      {s.type==="none"?"No Bonus":s.type==="percentage"?`+${s.value}% salary`:`₹${Number(s.value).toLocaleString("en-IN")}`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <button onClick={handleAssign} disabled={saving} style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 24px", background:saving?"#93c5fd":"#1d4ed8", color:"#fff", border:"none", borderRadius:9, fontWeight:700, fontSize:14, cursor:saving?"not-allowed":"pointer" }}>
          <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} color="#fff" strokeWidth={2} />
          {saving ? "Assigning..." : "Assign Plan"}
        </button>
      </div>

      {/* Assigned List */}
      <div style={{ background:"#fff", borderRadius:14, border:"1px solid #e5e7eb", overflow:"hidden" }}>
        <div style={{ padding:"16px 20px", borderBottom:"1px solid #f3f4f6", display:"flex", alignItems:"center", gap:10 }}>
          <HugeiconsIcon icon={UserMultiple02Icon} size={18} color="#374151" strokeWidth={1.8} />
          <p style={{ margin:0, fontWeight:800, fontSize:15, color:"#1a1a2e" }}>All Assignments</p>
        </div>

        {loading ? (
          <div style={{ textAlign:"center", padding:60, color:"#6b7280" }}>
            <div style={{ width:32, height:32, border:"4px solid #e5e7eb", borderTopColor:"#1d4ed8", borderRadius:"50%", animation:"spin 0.8s linear infinite", margin:"0 auto 12px" }} />
            Loading...
          </div>
        ) : assigned.length===0 ? (
          <div style={{ textAlign:"center", padding:60, color:"#9ca3af" }}>
            <div style={{ fontSize:36, marginBottom:10 }}>📌</div>
            <p style={{ fontWeight:600 }}>No assignments yet</p>
          </div>
        ) : (
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:14 }}>
              <thead>
                <tr style={{ background:"#f8fafc" }}>
                  {["#","Employee","Department","Plan","Cycle","Period","Assigned On",""].map(h=>(
                    <th key={h} style={{ padding:"11px 16px", textAlign:"left", fontWeight:700, color:"#374151", borderBottom:"2px solid #e5e7eb", whiteSpace:"nowrap", fontSize:13 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {assigned.map((a,i)=>{
                  const plan = plans.find(p=>p._id===(a.plan_id?._id||a.plan_id));
                  return (
                    <tr key={a._id} style={{ borderBottom:"1px solid #f3f4f6", background:i%2===0?"#fff":"#fafafa" }}>
                      <td style={{ padding:"12px 16px", color:"#9ca3af", fontWeight:600 }}>{i+1}</td>
                      <td style={{ padding:"12px 16px" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <div style={{ width:32, height:32, borderRadius:"50%", background:"#eff6ff", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, color:"#2563eb", fontSize:13 }}>
                            {a.employee_id?.name?.charAt(0)||"?"}
                          </div>
                          <div>
                            <p style={{ margin:0, fontWeight:700, color:"#1a1a2e", fontSize:13 }}>{a.employee_id?.name||"—"}</p>
                            <p style={{ margin:0, fontSize:11, color:"#6b7280" }}>{a.employee_id?.designation||""}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding:"12px 16px", fontSize:13, color:"#374151" }}>{a.employee_id?.department||"—"}</td>
                      <td style={{ padding:"12px 16px", fontSize:13, color:"#374151" }}>{plan?.name||"—"}</td>
                      <td style={{ padding:"12px 16px" }}>
                        <span style={{ background:"#f3f4f6", padding:"3px 10px", borderRadius:5, fontWeight:600, fontSize:12 }}>{a.cycle}</span>
                      </td>
                      <td style={{ padding:"12px 16px" }}>
                        <span style={{ background:"#eff6ff", color:"#1d4ed8", padding:"3px 10px", borderRadius:5, fontWeight:700, fontSize:12 }}>{a.period}</span>
                      </td>
                      <td style={{ padding:"12px 16px", color:"#6b7280", fontSize:13 }}>
                        {a.createdAt ? new Date(a.createdAt).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}) : "—"}
                      </td>
                      <td style={{ padding:"12px 16px" }}>
                        <button onClick={()=>handleRemove(a._id)} style={{ background:"#fef2f2", border:"none", borderRadius:7, padding:"6px 10px", cursor:"pointer" }}>
                          <HugeiconsIcon icon={Delete02Icon} size={14} color="#dc2626" strokeWidth={2} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}