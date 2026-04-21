import { useState, useEffect } from "react";
import axios from "axios";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  PlusSignIcon, Delete02Icon, PencilEdit01Icon,
  CheckmarkCircle01Icon, Building04Icon,
} from "@hugeicons/core-free-icons";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const inputStyle = {
  width: "100%", padding: "9px 12px", border: "1px solid #d1d5db",
  borderRadius: 8, fontSize: 13, color: "#1a1a2e", background: "#fff",
  boxSizing: "border-box", outline: "none",
};
const labelStyle = {
  display: "block", fontSize: 12, fontWeight: 700,
  color: "#374151", marginBottom: 6,
};

const EMPTY_FORM = {
  name: "", department: "", cycle: "Monthly",
  slabs: [
    { min_score: 0,  max_score: 50,  type: "none",       value: 0 },
    { min_score: 51, max_score: 75,  type: "fixed",      value: 2000 },
    { min_score: 76, max_score: 90,  type: "fixed",      value: 5000 },
    { min_score: 91, max_score: 100, type: "percentage", value: 10 },
  ],
};

const DEPT_COLORS = {
  Sales:       { color: "#2563eb", bg: "#eff6ff" },
  Engineering: { color: "#7c3aed", bg: "#f5f3ff" },
  Marketing:   { color: "#d97706", bg: "#fffbeb" },
  HR:          { color: "#16a34a", bg: "#f0fdf4" },
  Finance:     { color: "#ea580c", bg: "#fff7ed" },
  Operations:  { color: "#0891b2", bg: "#ecfeff" },
};
const getColor = (dept) => DEPT_COLORS[dept] || { color: "#6b7280", bg: "#f3f4f6" };

export default function IncentivePlans() {
  const [plans, setPlans]       = useState([]);
  const [depts, setDepts]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId]     = useState(null);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [saving, setSaving]     = useState(false);
  const [toast, setToast]       = useState(null);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [p, d] = await Promise.all([
        axios.get(`${API_BASE}/api/incentive-plans`),
        axios.get(`${API_BASE}/api/departments`),
      ]);
      setPlans(p.data?.data || p.data || []);
      const list = d.data?.data || d.data || [];
      setDepts(list.map((x) => (typeof x === "string" ? x : x.name)));
    } catch { showToast("Failed to load", "error"); }
    finally   { setLoading(false); }
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const updateSlab = (i, field, val) => {
    const slabs = [...form.slabs];
    slabs[i] = { ...slabs[i], [field]: field === "type" ? val : Number(val) };
    setForm({ ...form, slabs });
  };

  const openCreate = () => { setForm(EMPTY_FORM); setEditId(null); setShowForm(true); };
  const openEdit   = (p)  => {
    setForm({ name: p.name, department: p.department, cycle: p.cycle, slabs: p.slabs || EMPTY_FORM.slabs });
    setEditId(p._id); setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.department) {
      showToast("Name & department required", "error"); return;
    }
    setSaving(true);
    try {
      if (editId) await axios.put(`${API_BASE}/api/incentive-plans/${editId}`, form);
      else        await axios.post(`${API_BASE}/api/incentive-plans`, form);
      showToast(editId ? "Updated ✅" : "Created ✅");
      setShowForm(false); fetchAll();
    } catch { showToast("Save failed", "error"); }
    finally   { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this plan?")) return;
    try {
      await axios.delete(`${API_BASE}/api/incentive-plans/${id}`);
      showToast("Deleted ✅"); fetchAll();
    } catch { showToast("Delete failed", "error"); }
  };

  return (
    <div style={{ padding: "28px 32px", fontFamily: "'Segoe UI',sans-serif", minHeight: "100vh", background: "#f4f6fb" }}>
      <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position:"fixed", top:20, right:16, zIndex:9999, background: toast.type==="error"?"#ff4d4f":"#52c41a", color:"#fff", padding:"12px 20px", borderRadius:8, fontWeight:500, fontSize:14 }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24, flexWrap:"wrap", gap:12 }}>
        <div>
          <h2 style={{ margin:0, fontSize:22, fontWeight:800, color:"#1a1a2e" }}>Incentive Plans</h2>
          <p style={{ margin:"4px 0 0", color:"#6b7280", fontSize:14 }}>
            Department-wise slab rules — based on KPI final score
          </p>
        </div>
        <button onClick={openCreate} style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 20px", background:"#1d4ed8", color:"#fff", border:"none", borderRadius:9, fontWeight:700, fontSize:14, cursor:"pointer" }}>
          <HugeiconsIcon icon={PlusSignIcon} size={16} color="#fff" strokeWidth={2} />
          New Plan
        </button>
      </div>

      {/* Summary */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))", gap:16, marginBottom:24 }}>
        {[
          { label:"Total Plans",   value: plans.length,                                          color:"#2563eb" },
          { label:"Departments",   value: [...new Set(plans.map(p=>p.department))].length,       color:"#7c3aed" },
          { label:"Monthly",       value: plans.filter(p=>p.cycle==="Monthly").length,           color:"#16a34a" },
          { label:"Quarterly",     value: plans.filter(p=>p.cycle==="Quarterly").length,         color:"#d97706" },
        ].map(s => (
          <div key={s.label} style={{ background:"#fff", borderRadius:12, padding:"16px 20px", border:"1px solid #e5e7eb" }}>
            <p style={{ margin:"0 0 4px", fontSize:11, color:"#6b7280", fontWeight:700, textTransform:"uppercase" }}>{s.label}</p>
            <p style={{ margin:0, fontSize:26, fontWeight:800, color:s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ textAlign:"center", padding:80, color:"#6b7280" }}>
          <div style={{ width:36, height:36, border:"4px solid #e5e7eb", borderTopColor:"#1d4ed8", borderRadius:"50%", animation:"spin 0.8s linear infinite", margin:"0 auto 12px" }} />
          Loading plans...
        </div>
      ) : plans.length === 0 ? (
        <div style={{ textAlign:"center", padding:80, background:"#fff", borderRadius:14, border:"1px solid #e5e7eb", color:"#9ca3af" }}>
          <div style={{ fontSize:48, marginBottom:12 }}>📋</div>
          <p style={{ fontWeight:700, fontSize:16, margin:"0 0 6px" }}>No plans yet</p>
          <p style={{ fontSize:13, margin:0 }}>Click "New Plan" to define your first department incentive rule</p>
        </div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))", gap:16 }}>
          {plans.map(plan => {
            const { color, bg } = getColor(plan.department);
            return (
              <div key={plan._id} style={{ background:"#fff", borderRadius:14, border:"1px solid #e5e7eb", overflow:"hidden" }}>

                {/* Card top */}
                <div style={{ padding:"16px 20px", borderBottom:"1px solid #f3f4f6", display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <div style={{ width:40, height:40, borderRadius:10, background:bg, display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <HugeiconsIcon icon={Building04Icon} size={20} color={color} strokeWidth={1.8} />
                    </div>
                    <div>
                      <p style={{ margin:0, fontWeight:800, fontSize:15, color:"#1a1a2e" }}>{plan.name}</p>
                      <p style={{ margin:"3px 0 0", fontSize:12 }}>
                        <span style={{ background:bg, color, fontWeight:700, padding:"1px 8px", borderRadius:5, fontSize:11 }}>{plan.department}</span>
                        {" · "}
                        <span style={{ color:"#9ca3af" }}>{plan.cycle}</span>
                      </p>
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:6 }}>
                    <button onClick={()=>openEdit(plan)} style={{ background:"#eff6ff", border:"none", borderRadius:7, padding:"6px 10px", cursor:"pointer" }}>
                      <HugeiconsIcon icon={PencilEdit01Icon} size={14} color="#2563eb" strokeWidth={2} />
                    </button>
                    <button onClick={()=>handleDelete(plan._id)} style={{ background:"#fef2f2", border:"none", borderRadius:7, padding:"6px 10px", cursor:"pointer" }}>
                      <HugeiconsIcon icon={Delete02Icon} size={14} color="#dc2626" strokeWidth={2} />
                    </button>
                  </div>
                </div>

                {/* Slabs */}
                <div style={{ padding:"14px 20px" }}>
                  <p style={{ margin:"0 0 8px", fontSize:11, fontWeight:700, color:"#6b7280", textTransform:"uppercase", letterSpacing:"0.05em" }}>
                    Incentive Slabs
                  </p>
                  {(plan.slabs||[]).map((slab, i) => {
                    const sc = slab.type==="none" ? "#9ca3af" : slab.type==="percentage" ? "#16a34a" : "#d97706";
                    return (
                      <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 0", borderBottom: i < plan.slabs.length-1 ? "1px dashed #f3f4f6" : "none" }}>
                        <span style={{ fontSize:12, color:"#374151", fontWeight:600 }}>
                          Score {slab.min_score}% – {slab.max_score}%
                        </span>
                        <span style={{ fontSize:12, fontWeight:800, color:sc }}>
                          {slab.type==="none"       ? "No Bonus"
                           : slab.type==="percentage" ? `+${slab.value}% of Salary`
                           :                           `₹${Number(slab.value).toLocaleString("en-IN")}`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── MODAL ── */}
      {showForm && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:2000, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
          <div style={{ background:"#fff", borderRadius:16, width:"100%", maxWidth:580, maxHeight:"90vh", overflowY:"auto" }}>

            {/* Modal header */}
            <div style={{ padding:"20px 24px", borderBottom:"1px solid #f3f4f6", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <h3 style={{ margin:0, fontSize:17, fontWeight:800, color:"#1a1a2e" }}>
                  {editId ? "Edit Plan" : "New Incentive Plan"}
                </h3>
                <p style={{ margin:"2px 0 0", fontSize:12, color:"#6b7280" }}>
                  Score slab → payout rules for a department
                </p>
              </div>
              <button onClick={()=>setShowForm(false)} style={{ background:"#f3f4f6", border:"none", borderRadius:8, padding:"6px 14px", cursor:"pointer", fontWeight:700, fontSize:13, color:"#374151" }}>✕</button>
            </div>

            <div style={{ padding:"20px 24px", display:"flex", flexDirection:"column", gap:16 }}>

              {/* Name */}
              <div>
                <label style={labelStyle}>Plan Name *</label>
                <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="e.g. Sales Monthly Incentive" style={inputStyle} />
              </div>

              {/* Dept + Cycle */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                <div>
                  <label style={labelStyle}>Department *</label>
                  <select value={form.department} onChange={e=>setForm({...form,department:e.target.value})} style={inputStyle}>
                    <option value="">Select...</option>
                    {depts.map(d=><option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Cycle</label>
                  <select value={form.cycle} onChange={e=>setForm({...form,cycle:e.target.value})} style={inputStyle}>
                    <option>Monthly</option>
                    <option>Quarterly</option>
                    <option>Half-Yearly</option>
                    <option>Yearly</option>
                  </select>
                </div>
              </div>

              {/* Slabs */}
              <div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                  <label style={{...labelStyle, margin:0}}>Score Slabs</label>
                  <button onClick={()=>setForm({...form,slabs:[...form.slabs,{min_score:0,max_score:100,type:"fixed",value:0}]})}
                    style={{ background:"#eff6ff", border:"none", borderRadius:7, padding:"5px 12px", fontSize:12, fontWeight:700, color:"#1d4ed8", cursor:"pointer" }}>
                    + Add Slab
                  </button>
                </div>

                {/* Slab header */}
                <div style={{ display:"grid", gridTemplateColumns:"75px 75px 115px 1fr 32px", gap:8, marginBottom:6 }}>
                  {["Min %","Max %","Type","Amount / %",""].map(h=>(
                    <span key={h} style={{ fontSize:11, fontWeight:700, color:"#9ca3af", textTransform:"uppercase" }}>{h}</span>
                  ))}
                </div>

                {form.slabs.map((slab,i)=>(
                  <div key={i} style={{ display:"grid", gridTemplateColumns:"75px 75px 115px 1fr 32px", gap:8, marginBottom:8, alignItems:"center" }}>
                    <input type="number" min="0" max="100" value={slab.min_score}
                      onChange={e=>updateSlab(i,"min_score",e.target.value)}
                      style={{...inputStyle, padding:"7px 8px", fontSize:12}} />
                    <input type="number" min="0" max="100" value={slab.max_score}
                      onChange={e=>updateSlab(i,"max_score",e.target.value)}
                      style={{...inputStyle, padding:"7px 8px", fontSize:12}} />
                    <select value={slab.type} onChange={e=>updateSlab(i,"type",e.target.value)}
                      style={{...inputStyle, padding:"7px 8px", fontSize:12}}>
                      <option value="none">No Bonus</option>
                      <option value="fixed">Fixed ₹</option>
                      <option value="percentage">% Salary</option>
                    </select>
                    <input type="number" min="0" value={slab.value}
                      disabled={slab.type==="none"}
                      onChange={e=>updateSlab(i,"value",e.target.value)}
                      placeholder={slab.type==="percentage"?"e.g. 5":"e.g. 3000"}
                      style={{...inputStyle, padding:"7px 8px", fontSize:12, background:slab.type==="none"?"#f9fafb":"#fff", color:slab.type==="none"?"#9ca3af":"#1a1a2e"}} />
                    <button onClick={()=>setForm({...form,slabs:form.slabs.filter((_,idx)=>idx!==i)})}
                      style={{ background:"#fef2f2", border:"none", borderRadius:7, padding:"7px", cursor:"pointer" }}>
                      <HugeiconsIcon icon={Delete02Icon} size={14} color="#dc2626" strokeWidth={2} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
                <button onClick={()=>setShowForm(false)} style={{ padding:"10px 20px", background:"#f3f4f6", border:"none", borderRadius:9, fontWeight:700, fontSize:14, cursor:"pointer", color:"#374151" }}>
                  Cancel
                </button>
                <button onClick={handleSave} disabled={saving} style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 24px", background:saving?"#93c5fd":"#1d4ed8", color:"#fff", border:"none", borderRadius:9, fontWeight:700, fontSize:14, cursor:saving?"not-allowed":"pointer" }}>
                  <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} color="#fff" strokeWidth={2} />
                  {saving ? "Saving..." : editId ? "Update" : "Create Plan"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}