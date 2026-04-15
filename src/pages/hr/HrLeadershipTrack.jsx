import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  TrendingUp, Plus, Pencil, RefreshCw, Info,
  Star, Users, Award, BookOpen, RotateCcw,
  ChevronRight, CheckCircle, XCircle, Target
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const STAGE_CONFIG = {
  1: { label:"Emerging Leader",  color:"#6366f1", bg:"#eef2ff", targetRole:"Sr. Executive → Asst. Manager", timeline:"1–2 yrs" },
  2: { label:"Managerial Leader", color:"#3b82f6", bg:"#eff6ff", targetRole:"Manager → Sr. Manager",        timeline:"2–3 yrs" },
  3: { label:"Business Leader",  color:"#10b981", bg:"#ecfdf5", targetRole:"GM → AVP",                     timeline:"3–5 yrs" },
  4: { label:"Strategic Leader", color:"#f59e0b", bg:"#fffbeb", targetRole:"VP → Director",                timeline:"3–5 yrs" },
  5: { label:"Executive / CXO",  color:"#ef4444", bg:"#fef2f2", targetRole:"CXO",                          timeline:"2–4 yrs" },
};

const STATUS_CONFIG = {
  active:    { label:"Active",    color:"#10b981", bg:"#ecfdf5" },
  paused:    { label:"Paused",    color:"#f59e0b", bg:"#fffbeb" },
  completed: { label:"Completed", color:"#3b82f6", bg:"#eff6ff" },
  withdrawn: { label:"Withdrawn", color:"#ef4444", bg:"#fef2f2" },
};

const labelStyle = { fontSize:11, fontWeight:700, color:"#6b7280", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:4, display:"block" };

function SectionCard({ title, icon, color, bg, children }) {
  return (
    <div style={{ background:"#fff", borderRadius:14, border:"1px solid #e5e7eb", overflow:"hidden" }}>
      <div style={{ padding:"13px 18px", borderBottom:"1px solid #f3f4f6", display:"flex", alignItems:"center", gap:10 }}>
        <div style={{ width:30, height:30, borderRadius:8, background:bg, display:"flex", alignItems:"center", justifyContent:"center", color, flexShrink:0 }}>
          {icon}
        </div>
        <p style={{ margin:0, fontWeight:700, fontSize:14, color:"#111827" }}>{title}</p>
      </div>
      <div style={{ padding:"14px 18px" }}>{children}</div>
    </div>
  );
}

function ToggleRow({ label, checked, onChange, disabled }) {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"5px 0", borderBottom:"1px solid #f9fafb" }}>
      <span style={{ fontSize:13, color:"#374151" }}>{label}</span>
      {disabled ? (
        <span style={{ background:checked?"#ecfdf5":"#f3f4f6", color:checked?"#059669":"#9ca3af", padding:"2px 10px", borderRadius:20, fontSize:11, fontWeight:600, border:`1px solid ${checked?"#6ee7b7":"#e5e7eb"}` }}>
          {checked ? "Yes" : "No"}
        </span>
      ) : (
        <div className="form-check form-switch mb-0">
          <input className="form-check-input" type="checkbox" role="switch"
            checked={checked} onChange={e=>onChange(e.target.checked)}
            style={{ width:34, height:18, cursor:"pointer" }}/>
        </div>
      )}
    </div>
  );
}

// ── Enroll / Edit Form ─────────────────────────────────────────
function TrackForm({ initial, employees, onSave, onCancel, isNew }) {
  const [employeeId, setEmployeeId] = useState(initial?.employeeId?._id || initial?.employeeId || "");
  const [stage,      setStage]      = useState(initial?.stage      || 1);
  const [status,     setStatus]     = useState(initial?.status     || "active");
  const [isHiPo,     setIsHiPo]     = useState(initial?.isHiPo     || false);
  const [mentor,     setMentor]     = useState(initial?.mentor     || { name:"", designation:"", sessionFreq:"quarterly", notes:"" });
  const [skills,     setSkills]     = useState(initial?.skillPrograms || {
    leadershipTraining:false, financialManagement:false, innovationProgram:false,
    peopleManagement:false, radnusCultureImmersion:false, corporateAcademyLMS:false,
    externalPrograms:false, notes:"",
  });
  const [perf,       setPerf]       = useState(initial?.performance || {
    okrScore:0, lastAssessmentScore:0, promotionEligible:false, notes:"",
    nextAssessmentDate:"",
  });
  const [recog,      setRecog]      = useState(initial?.recognition || {
    esopEligible:false, impactBonusReceived:false, publicRecognition:false, hiPoTalentPool:false, notes:"",
  });
  const [hrNotes,    setHrNotes]    = useState(initial?.hrNotes    || "");
  const [progressNote, setProgressNote] = useState("");
  const [saving,     setSaving]     = useState(false);

  const cfg = STAGE_CONFIG[stage];

  const handle = async () => {
    if (!employeeId && isNew) return alert("Select an employee");
    setSaving(true);
    await onSave({
      ...(isNew ? { employeeId } : {}),
      stage, status, isHiPo,
      mentor, skillPrograms:skills,
      performance:{ ...perf, nextAssessmentDate: perf.nextAssessmentDate || undefined },
      recognition:recog,
      hrNotes, progressNote,
    });
    setSaving(false);
  };

  return (
    <div>
      {isNew && (
        <div style={{ marginBottom:20 }}>
          <label style={labelStyle}>Employee *</label>
          <select className="form-select form-select-sm" value={employeeId}
            onChange={e=>setEmployeeId(e.target.value)} style={{ maxWidth:380 }}>
            <option value="">-- Select Employee --</option>
            {employees.map(e=>(
              <option key={e._id} value={e._id}>{e.name} — {e.department}</option>
            ))}
          </select>
        </div>
      )}

      {/* Stage Selector */}
      <div style={{ marginBottom:20 }}>
        <label style={labelStyle}>Leadership Stage *</label>
        <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
          {Object.entries(STAGE_CONFIG).map(([s, c]) => (
            <button key={s} onClick={()=>setStage(Number(s))}
              style={{ padding:"10px 16px", borderRadius:10, border:`2px solid ${Number(s)===stage ? c.color : "#e5e7eb"}`,
                background: Number(s)===stage ? c.bg : "#fff",
                color: Number(s)===stage ? c.color : "#6b7280",
                fontWeight: Number(s)===stage ? 700 : 500, fontSize:13, cursor:"pointer", transition:"all .2s" }}>
              Stage {s}<br/>
              <span style={{ fontSize:11, fontWeight:500 }}>{c.label}</span>
            </button>
          ))}
        </div>
        {/* Stage Info */}
        <div style={{ marginTop:12, background:cfg.bg, borderRadius:10, padding:"12px 16px", border:`1px solid ${cfg.color}33` }}>
          <p style={{ margin:0, fontSize:13, color:cfg.color, fontWeight:700 }}>Stage {stage}: {cfg.label}</p>
          <p style={{ margin:"4px 0 0", fontSize:12, color:"#6b7280" }}>
            Target: <strong>{cfg.targetRole}</strong> · Timeline: <strong>{cfg.timeline}</strong>
          </p>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(320px,1fr))", gap:16, marginBottom:20 }}>

        {/* Status & HiPo */}
        <SectionCard title="Track Settings" icon={<Target size={15}/>} color="#6b7280" bg="#f3f4f6">
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <div>
              <label style={labelStyle}>Status</label>
              <select className="form-select form-select-sm" value={status} onChange={e=>setStatus(e.target.value)}>
                {Object.entries(STATUS_CONFIG).map(([k,v])=>(
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
            <ToggleRow label="HiPo (High Potential)" checked={isHiPo} onChange={setIsHiPo}/>
            {!isNew && (
              <div>
                <label style={labelStyle}>Progress Note</label>
                <textarea className="form-control form-control-sm" rows={2}
                  value={progressNote} onChange={e=>setProgressNote(e.target.value)}
                  placeholder="What changed in this update?"/>
              </div>
            )}
            <div>
              <label style={labelStyle}>HR Notes (Confidential)</label>
              <textarea className="form-control form-control-sm" rows={2}
                value={hrNotes} onChange={e=>setHrNotes(e.target.value)}
                placeholder="Internal notes about this employee's track..."/>
            </div>
          </div>
        </SectionCard>

        {/* Mentor */}
        <SectionCard title="Structured Mentorship" icon={<Users size={15}/>} color="#3b82f6" bg="#eff6ff">
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <div>
              <label style={labelStyle}>Mentor Name</label>
              <input className="form-control form-control-sm" value={mentor.name}
                onChange={e=>setMentor(m=>({...m,name:e.target.value}))}
                placeholder="e.g. Anand Kumar"/>
            </div>
            <div>
              <label style={labelStyle}>Designation</label>
              <input className="form-control form-control-sm" value={mentor.designation}
                onChange={e=>setMentor(m=>({...m,designation:e.target.value}))}
                placeholder="e.g. CPO"/>
            </div>
            <div>
              <label style={labelStyle}>Session Frequency</label>
              <select className="form-select form-select-sm" value={mentor.sessionFreq}
                onChange={e=>setMentor(m=>({...m,sessionFreq:e.target.value}))}>
                {["monthly","quarterly","bi-annual"].map(f=><option key={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Notes</label>
              <textarea className="form-control form-control-sm" rows={2}
                value={mentor.notes} onChange={e=>setMentor(m=>({...m,notes:e.target.value}))}
                placeholder="Mentorship details..."/>
            </div>
          </div>
        </SectionCard>

        {/* Skill Programs */}
        <SectionCard title="Skill Development Programs" icon={<BookOpen size={15}/>} color="#8b5cf6" bg="#f5f3ff">
          <ToggleRow label="Leadership Training"      checked={skills.leadershipTraining}     onChange={v=>setSkills(s=>({...s,leadershipTraining:v}))}/>
          <ToggleRow label="Financial Management"     checked={skills.financialManagement}    onChange={v=>setSkills(s=>({...s,financialManagement:v}))}/>
          <ToggleRow label="Innovation Program"       checked={skills.innovationProgram}      onChange={v=>setSkills(s=>({...s,innovationProgram:v}))}/>
          <ToggleRow label="People Management"        checked={skills.peopleManagement}       onChange={v=>setSkills(s=>({...s,peopleManagement:v}))}/>
          <ToggleRow label="Radnus Culture Immersion" checked={skills.radnusCultureImmersion} onChange={v=>setSkills(s=>({...s,radnusCultureImmersion:v}))}/>
          <ToggleRow label="Corporate Academy LMS"    checked={skills.corporateAcademyLMS}    onChange={v=>setSkills(s=>({...s,corporateAcademyLMS:v}))}/>
          <ToggleRow label="External Programs"        checked={skills.externalPrograms}       onChange={v=>setSkills(s=>({...s,externalPrograms:v}))}/>
          <div style={{ marginTop:8 }}>
            <label style={labelStyle}>Notes</label>
            <textarea className="form-control form-control-sm" rows={2}
              value={skills.notes} onChange={e=>setSkills(s=>({...s,notes:e.target.value}))}
              placeholder="Program details..."/>
          </div>
        </SectionCard>

        {/* Performance */}
        <SectionCard title="Performance Metrics" icon={<TrendingUp size={15}/>} color="#10b981" bg="#ecfdf5">
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <div className="row g-2">
              <div className="col">
                <label style={labelStyle}>OKR Score (%)</label>
                <input type="number" className="form-control form-control-sm" min={0} max={100}
                  value={perf.okrScore} onChange={e=>setPerf(p=>({...p,okrScore:Number(e.target.value)}))}/>
              </div>
              <div className="col">
                <label style={labelStyle}>Last Assessment (%)</label>
                <input type="number" className="form-control form-control-sm" min={0} max={100}
                  value={perf.lastAssessmentScore} onChange={e=>setPerf(p=>({...p,lastAssessmentScore:Number(e.target.value)}))}/>
              </div>
            </div>
            <div>
              <label style={labelStyle}>Next Assessment Date</label>
              <input type="date" className="form-control form-control-sm"
                value={perf.nextAssessmentDate || ""}
                onChange={e=>setPerf(p=>({...p,nextAssessmentDate:e.target.value}))}/>
            </div>
            <ToggleRow label="Promotion Eligible" checked={perf.promotionEligible} onChange={v=>setPerf(p=>({...p,promotionEligible:v}))}/>
            <div>
              <label style={labelStyle}>Notes</label>
              <textarea className="form-control form-control-sm" rows={2}
                value={perf.notes} onChange={e=>setPerf(p=>({...p,notes:e.target.value}))}
                placeholder="Performance observations..."/>
            </div>
          </div>
        </SectionCard>

        {/* Recognition */}
        <SectionCard title="Recognition & Rewards" icon={<Award size={15}/>} color="#ef4444" bg="#fef2f2">
          <ToggleRow label="ESOP Eligible"          checked={recog.esopEligible}        onChange={v=>setRecog(r=>({...r,esopEligible:v}))}/>
          <ToggleRow label="Impact Bonus Received"  checked={recog.impactBonusReceived} onChange={v=>setRecog(r=>({...r,impactBonusReceived:v}))}/>
          <ToggleRow label="Public Recognition"     checked={recog.publicRecognition}   onChange={v=>setRecog(r=>({...r,publicRecognition:v}))}/>
          <ToggleRow label="HiPo Talent Pool"       checked={recog.hiPoTalentPool}      onChange={v=>setRecog(r=>({...r,hiPoTalentPool:v}))}/>
          <div style={{ marginTop:8 }}>
            <label style={labelStyle}>Notes</label>
            <textarea className="form-control form-control-sm" rows={2}
              value={recog.notes} onChange={e=>setRecog(r=>({...r,notes:e.target.value}))}
              placeholder="Recognition details..."/>
          </div>
        </SectionCard>
      </div>

      <div style={{ display:"flex", gap:12, paddingTop:16, borderTop:"1px solid #e5e7eb" }}>
        <button className="btn btn-light px-4" onClick={onCancel}>Cancel</button>
        <button className="btn btn-primary fw-bold px-5" onClick={handle} disabled={saving}>
          {saving ? "Saving..." : isNew ? "Enroll in Leadership Track" : "Update Track"}
        </button>
      </div>
    </div>
  );
}

// ── Main HR Component ──────────────────────────────────────────
export default function HrLeadershipTrack() {
  const [tracks,    setTracks]    = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [view,      setView]      = useState("list");
  const [selected,  setSelected]  = useState(null);
  const [toast,     setToast]     = useState(null);
  const [filter,    setFilter]    = useState("all");

  const showMsg = (msg, type="success") => {
    setToast({ msg, type });
    setTimeout(()=>setToast(null), 3000);
  };

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [tRes, eRes] = await Promise.all([
        axios.get(`${API_BASE}/api/leadership`),          // ✅ FIXED
        axios.get(`${API_BASE}/api/hr/employees`),
      ]);
      setTracks(tRes.data.data || []);
      const all = Array.isArray(eRes.data) ? eRes.data : [];
      setEmployees(all.filter(e=>e.status==="active"));
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleEnroll = async (data) => {
    try {
      await axios.post(`${API_BASE}/api/leadership`, data);   // ✅ FIXED
      showMsg("Employee enrolled successfully ✅");
      setView("list"); fetchData();
    } catch (e) { showMsg(e?.response?.data?.message || "Failed","error"); }
  };

  const handleUpdate = async (data) => {
    try {
      await axios.put(`${API_BASE}/api/leadership/${selected._id}`, data);  // ✅ FIXED
      showMsg("Track updated ✅");
      setView("list"); setSelected(null); fetchData();
    } catch (e) { showMsg(e?.response?.data?.message || "Failed","error"); }
  };

  const handleWithdraw = async (id) => {
    if (!window.confirm("Withdraw this employee from the Leadership Track?")) return;
    try {
      await axios.delete(`${API_BASE}/api/leadership/${id}`);   // ✅ FIXED
      showMsg("Employee withdrawn"); fetchData();
    } catch (e) { showMsg("Failed","error"); }
  };

  const filtered = filter === "all" ? tracks : tracks.filter(t => t.status === filter);

  if (loading) return (
    <div style={{ display:"flex", justifyContent:"center", padding:60 }}>
      <div style={{ width:36, height:36, border:"4px solid #e5e7eb", borderTopColor:"#3b82f6", borderRadius:"50%", animation:"spin .8s linear infinite" }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
  if (error) return <div style={{ margin:24, padding:16, background:"#fef2f2", borderRadius:10, color:"#dc2626" }}>{error}</div>;

  // ── Enroll / Edit View ───────────────────────────────────────
  if (view === "create" || view === "edit") return (
    <div style={{ fontFamily:"'Segoe UI',sans-serif", background:"#f4f6fb", minHeight:"100vh", padding:"28px 24px" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      {toast && (
        <div style={{ position:"fixed", top:16, right:16, zIndex:9999, background:toast.type==="error"?"#ff4d4f":"#52c41a", color:"#fff", padding:"12px 20px", borderRadius:8, fontWeight:500 }}>
          {toast.msg}
        </div>
      )}
      <div style={{ maxWidth:1200, margin:"0 auto" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:24 }}>
          <button onClick={()=>{ setView("list"); setSelected(null); }}
            style={{ padding:"7px 14px", border:"1px solid #e5e7eb", borderRadius:8, background:"#fff", cursor:"pointer", fontSize:13 }}>
            ← Back
          </button>
          <h4 style={{ margin:0, fontWeight:800, color:"#1a1a2e" }}>
            {view==="create" ? "Enroll Employee in Leadership Track" : `Edit Track — ${selected?.employeeId?.name}`}
          </h4>
        </div>
        <TrackForm
          initial={view==="edit" ? selected : null}
          employees={employees}
          isNew={view==="create"}
          onSave={view==="create" ? handleEnroll : handleUpdate}
          onCancel={()=>{ setView("list"); setSelected(null); }}
        />
      </div>
    </div>
  );

  // ── Detail View ──────────────────────────────────────────────
  if (view === "detail" && selected) {
    const cfg = STAGE_CONFIG[selected.stage] || STAGE_CONFIG[1];
    const st  = STATUS_CONFIG[selected.status] || STATUS_CONFIG.active;
    return (
      <div style={{ fontFamily:"'Segoe UI',sans-serif", background:"#f4f6fb", minHeight:"100vh", padding:"28px 24px" }}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{ maxWidth:1100, margin:"0 auto" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20, flexWrap:"wrap", gap:12 }}>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <button onClick={()=>{ setView("list"); setSelected(null); }}
                style={{ padding:"7px 14px", border:"1px solid #e5e7eb", borderRadius:8, background:"#fff", cursor:"pointer", fontSize:13 }}>
                ← Back
              </button>
              <h4 style={{ margin:0, fontWeight:800, color:"#1a1a2e" }}>
                {selected.employeeId?.name} — Leadership Track
              </h4>
            </div>
            <button onClick={()=>setView("edit")}
              style={{ padding:"8px 18px", background:"#1a1a2e", color:"#fff", border:"none", borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}>
              <Pencil size={13}/> Edit Track
            </button>
          </div>

          {/* Stage Progress Bar */}
          <div style={{ background:"#fff", borderRadius:14, border:"1px solid #e5e7eb", padding:"20px 24px", marginBottom:20 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16, flexWrap:"wrap", gap:10 }}>
              <div>
                <p style={{ margin:0, fontSize:18, fontWeight:800, color:"#1a1a2e" }}>Stage {selected.stage}: {cfg.label}</p>
                <p style={{ margin:"4px 0 0", fontSize:13, color:"#6b7280" }}>
                  Target: <strong>{cfg.targetRole}</strong> · Timeline: <strong>{cfg.timeline}</strong>
                </p>
              </div>
              <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
                <span style={{ background:st.bg, color:st.color, padding:"4px 14px", borderRadius:20, fontSize:12, fontWeight:700, border:`1px solid ${st.color}33` }}>
                  {st.label}
                </span>
                {selected.isHiPo && (
                  <span style={{ background:"#fffbeb", color:"#d97706", padding:"4px 12px", borderRadius:20, fontSize:12, fontWeight:700, border:"1px solid #fde68a" }}>
                    ⭐ HiPo
                  </span>
                )}
              </div>
            </div>
            {/* Stage Steps */}
            <div style={{ display:"flex", alignItems:"center", gap:0 }}>
              {[1,2,3,4,5].map((s,i)=>{
                const c = STAGE_CONFIG[s];
                const done = s < selected.stage;
                const curr = s === selected.stage;
                return (
                  <React.Fragment key={s}>
                    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", flex:1 }}>
                      <div style={{ width:36, height:36, borderRadius:"50%", background: done?"#10b981" : curr? c.color : "#e5e7eb", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:800, fontSize:14, border:`3px solid ${done?"#10b981":curr?c.color:"#e5e7eb"}` }}>
                        {done ? "✓" : s}
                      </div>
                      <p style={{ margin:"6px 0 0", fontSize:10, fontWeight:curr?700:500, color:curr?c.color:"#9ca3af", textAlign:"center" }}>{c.label}</p>
                    </div>
                    {i < 4 && <div style={{ flex:1, height:3, background: s < selected.stage ? "#10b981" : "#e5e7eb", marginBottom:20 }}/>}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(300px,1fr))", gap:16, marginBottom:16 }}>

            {/* Mentor */}
            <SectionCard title="Mentorship" icon={<Users size={15}/>} color="#3b82f6" bg="#eff6ff">
              {selected.mentor?.name ? (
                <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:13 }}>
                    <span style={{ color:"#6b7280" }}>Mentor</span>
                    <strong>{selected.mentor.name}</strong>
                  </div>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:13 }}>
                    <span style={{ color:"#6b7280" }}>Designation</span>
                    <strong>{selected.mentor.designation}</strong>
                  </div>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:13 }}>
                    <span style={{ color:"#6b7280" }}>Sessions</span>
                    <strong>{selected.mentor.sessionFreq}</strong>
                  </div>
                  {selected.mentor?.notes && <p style={{ margin:"6px 0 0", fontSize:12, color:"#6b7280", fontStyle:"italic" }}>{selected.mentor.notes}</p>}
                </div>
              ) : <p style={{ margin:0, fontSize:13, color:"#9ca3af" }}>No mentor assigned yet.</p>}
            </SectionCard>

            {/* Performance */}
            <SectionCard title="Performance" icon={<TrendingUp size={15}/>} color="#10b981" bg="#ecfdf5">
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:13 }}>
                  <span style={{ color:"#6b7280" }}>OKR Score</span>
                  <strong style={{ color:"#10b981" }}>{selected.performance?.okrScore || 0}%</strong>
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:13 }}>
                  <span style={{ color:"#6b7280" }}>Last Assessment</span>
                  <strong style={{ color:"#3b82f6" }}>{selected.performance?.lastAssessmentScore || 0}%</strong>
                </div>
                {selected.performance?.nextAssessmentDate && (
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:13 }}>
                    <span style={{ color:"#6b7280" }}>Next Assessment</span>
                    <strong>{new Date(selected.performance.nextAssessmentDate).toLocaleDateString("en-IN")}</strong>
                  </div>
                )}
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:13 }}>
                  <span style={{ color:"#6b7280" }}>Promotion Eligible</span>
                  <span style={{ background:selected.performance?.promotionEligible?"#ecfdf5":"#f3f4f6", color:selected.performance?.promotionEligible?"#059669":"#9ca3af", padding:"2px 10px", borderRadius:20, fontSize:11, fontWeight:600 }}>
                    {selected.performance?.promotionEligible ? "Yes" : "No"}
                  </span>
                </div>
              </div>
            </SectionCard>

            {/* Skills */}
            <SectionCard title="Skill Programs" icon={<BookOpen size={15}/>} color="#8b5cf6" bg="#f5f3ff">
              {[
                ["Leadership Training",      selected.skillPrograms?.leadershipTraining],
                ["Financial Management",     selected.skillPrograms?.financialManagement],
                ["Innovation Program",       selected.skillPrograms?.innovationProgram],
                ["People Management",        selected.skillPrograms?.peopleManagement],
                ["Culture Immersion",        selected.skillPrograms?.radnusCultureImmersion],
                ["Corporate Academy LMS",    selected.skillPrograms?.corporateAcademyLMS],
                ["External Programs",        selected.skillPrograms?.externalPrograms],
              ].map(([label, val]) => (
                <div key={label} style={{ display:"flex", justifyContent:"space-between", padding:"4px 0", borderBottom:"1px solid #f9fafb", fontSize:12 }}>
                  <span style={{ color:"#374151" }}>{label}</span>
                  <span style={{ color:val?"#059669":"#9ca3af", fontWeight:600 }}>{val?"✓ Yes":"✗ No"}</span>
                </div>
              ))}
            </SectionCard>

            {/* Recognition */}
            <SectionCard title="Recognition & Rewards" icon={<Award size={15}/>} color="#ef4444" bg="#fef2f2">
              {[
                ["ESOP Eligible",         selected.recognition?.esopEligible],
                ["Impact Bonus Received", selected.recognition?.impactBonusReceived],
                ["Public Recognition",    selected.recognition?.publicRecognition],
                ["HiPo Talent Pool",      selected.recognition?.hiPoTalentPool],
              ].map(([label, val]) => (
                <div key={label} style={{ display:"flex", justifyContent:"space-between", padding:"4px 0", borderBottom:"1px solid #f9fafb", fontSize:12 }}>
                  <span style={{ color:"#374151" }}>{label}</span>
                  <span style={{ color:val?"#059669":"#9ca3af", fontWeight:600 }}>{val?"✓ Yes":"✗ No"}</span>
                </div>
              ))}
            </SectionCard>

            {/* Progress History */}
            {selected.progressHistory?.length > 0 && (
              <SectionCard title="Progress History" icon={<RotateCcw size={15}/>} color="#6b7280" bg="#f3f4f6">
                <div style={{ display:"flex", flexDirection:"column", gap:10, maxHeight:200, overflowY:"auto" }}>
                  {[...selected.progressHistory].reverse().map((h,i) => (
                    <div key={i} style={{ borderLeft:"3px solid #3b82f6", paddingLeft:10 }}>
                      <p style={{ margin:0, fontSize:13, fontWeight:600, color:"#1a1a2e" }}>
                        {h.stageChanged ? `Stage ${h.fromStage} → ${h.toStage}` : "Update"}
                      </p>
                      <p style={{ margin:"2px 0 0", fontSize:11, color:"#6b7280" }}>
                        {new Date(h.date).toLocaleDateString("en-IN")} · {h.updatedBy}
                      </p>
                      {h.notes && <p style={{ margin:"2px 0 0", fontSize:11, color:"#9ca3af" }}>{h.notes}</p>}
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── List View ────────────────────────────────────────────────
  return (
    <div style={{ fontFamily:"'Segoe UI',sans-serif", background:"#f4f6fb", minHeight:"100vh", padding:"28px 24px" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      {toast && (
        <div style={{ position:"fixed", top:16, right:16, zIndex:9999, background:toast.type==="error"?"#ff4d4f":"#52c41a", color:"#fff", padding:"12px 20px", borderRadius:8, fontWeight:500 }}>
          {toast.msg}
        </div>
      )}

      <div style={{ maxWidth:1300, margin:"0 auto" }}>
        {/* Header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12, marginBottom:24 }}>
          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            <div style={{ width:46, height:46, borderRadius:12, background:"linear-gradient(135deg,#6366f1,#3b82f6)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <TrendingUp size={22} color="#fff"/>
            </div>
            <div>
              <h3 style={{ margin:0, fontWeight:800, fontSize:20, color:"#1a1a2e" }}>Leadership Track</h3>
              <p style={{ margin:"2px 0 0", fontSize:12, color:"#6b7280" }}>Radnus Policy 3.39 · Grow with Radnus Leadership Track</p>
            </div>
          </div>
          <div style={{ display:"flex", gap:10 }}>
            <button onClick={fetchData}
              style={{ padding:"8px 14px", border:"1px solid #e5e7eb", borderRadius:8, background:"#fff", cursor:"pointer", display:"flex", alignItems:"center", gap:6, fontSize:13 }}>
              <RefreshCw size={13}/> Refresh
            </button>
            <button onClick={()=>setView("create")}
              style={{ padding:"8px 18px", background:"#1a1a2e", color:"#fff", border:"none", borderRadius:8, fontWeight:700, fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}>
              <Plus size={14}/> Enroll Employee
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(160px,1fr))", gap:14, marginBottom:24 }}>
          {[
            { label:"Total Enrolled", value:tracks.length,                            color:"#3b82f6", bg:"#eff6ff" },
            { label:"Active",         value:tracks.filter(t=>t.status==="active").length,    color:"#10b981", bg:"#ecfdf5" },
            { label:"HiPo",           value:tracks.filter(t=>t.isHiPo).length,              color:"#f59e0b", bg:"#fffbeb" },
            { label:"Promotion Ready",value:tracks.filter(t=>t.performance?.promotionEligible).length, color:"#8b5cf6", bg:"#f5f3ff" },
          ].map((s,i) => (
            <div key={i} style={{ background:"#fff", borderRadius:12, border:"1px solid #e5e7eb", padding:"16px 18px" }}>
              <p style={{ margin:"0 0 4px", fontSize:11, color:"#6b7280", fontWeight:700, textTransform:"uppercase" }}>{s.label}</p>
              <p style={{ margin:0, fontSize:26, fontWeight:900, color:s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Stage Summary */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:10, marginBottom:24 }}>
          {[1,2,3,4,5].map(s => {
            const cfg   = STAGE_CONFIG[s];
            const count = tracks.filter(t=>t.stage===s).length;
            return (
              <div key={s} style={{ background:cfg.bg, borderRadius:12, border:`1px solid ${cfg.color}33`, padding:"12px 14px", textAlign:"center" }}>
                <p style={{ margin:"0 0 2px", fontSize:11, fontWeight:700, color:cfg.color }}>Stage {s}</p>
                <p style={{ margin:"0 0 2px", fontSize:20, fontWeight:900, color:cfg.color }}>{count}</p>
                <p style={{ margin:0, fontSize:10, color:"#9ca3af" }}>{cfg.label}</p>
              </div>
            );
          })}
        </div>

        {/* Filter */}
        <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap" }}>
          {["all","active","paused","completed","withdrawn"].map(f => (
            <button key={f} onClick={()=>setFilter(f)}
              style={{ padding:"6px 14px", borderRadius:20, border:"1px solid #e5e7eb", cursor:"pointer", fontSize:12, fontWeight:600,
                background: filter===f ? "#1a1a2e" : "#fff",
                color:      filter===f ? "#fff"     : "#6b7280" }}>
              {f.charAt(0).toUpperCase()+f.slice(1)}
              {f==="all" ? ` (${tracks.length})` : ` (${tracks.filter(t=>t.status===f).length})`}
            </button>
          ))}
        </div>

        {/* Policy Note */}
        <div style={{ background:"#eff6ff", border:"1px solid #bfdbfe", borderRadius:10, padding:"12px 16px", marginBottom:20, display:"flex", gap:10, fontSize:12, color:"#1e40af" }}>
          <Info size={14} color="#3b82f6" style={{ flexShrink:0, marginTop:1 }}/>
          <p style={{ margin:0 }}>
            <strong>Policy 3.39:</strong> Leadership assessments every 6 months. Promotion eligibility linked to certification, project outcomes, and mentorship feedback. HiPo employees receive ESOP and fast-track benefits.
          </p>
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <div style={{ background:"#fff", borderRadius:14, border:"1px solid #e5e7eb", padding:60, textAlign:"center" }}>
            <TrendingUp size={40} color="#d1d5db" style={{ marginBottom:12 }}/>
            <p style={{ color:"#6b7280", fontWeight:600 }}>No employees enrolled yet.</p>
          </div>
        ) : (
          <div style={{ background:"#fff", borderRadius:14, border:"1px solid #e5e7eb", overflow:"hidden" }}>
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                <thead>
                  <tr style={{ background:"#f9fafb", borderBottom:"1px solid #e5e7eb" }}>
                    {["Employee","Dept","Stage","Status","HiPo","OKR","Assessment","Promo Eligible","Enrolled","Actions"].map(h=>(
                      <th key={h} style={{ padding:"12px 14px", textAlign:"left", fontSize:11, fontWeight:700, color:"#6b7280", textTransform:"uppercase", whiteSpace:"nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(t => {
                    const cfg = STAGE_CONFIG[t.stage] || STAGE_CONFIG[1];
                    const st  = STATUS_CONFIG[t.status] || STATUS_CONFIG.active;
                    return (
                      <tr key={t._id} style={{ borderBottom:"1px solid #f3f4f6" }}>
                        <td style={{ padding:"12px 14px" }}>
                          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                            <div style={{ width:32, height:32, borderRadius:"50%", background:cfg.bg, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, color:cfg.color, fontSize:13, flexShrink:0 }}>
                              {t.employeeId?.name?.charAt(0) || "?"}
                            </div>
                            <p style={{ margin:0, fontWeight:700 }}>{t.employeeId?.name || "—"}</p>
                          </div>
                        </td>
                        <td style={{ padding:"12px 14px", color:"#6b7280" }}>{t.employeeId?.department || "—"}</td>
                        <td style={{ padding:"12px 14px" }}>
                          <span style={{ background:cfg.bg, color:cfg.color, padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:700, border:`1px solid ${cfg.color}33` }}>
                            S{t.stage} · {cfg.label}
                          </span>
                        </td>
                        <td style={{ padding:"12px 14px" }}>
                          <span style={{ background:st.bg, color:st.color, padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:600, border:`1px solid ${st.color}33` }}>
                            {st.label}
                          </span>
                        </td>
                        <td style={{ padding:"12px 14px" }}>
                          {t.isHiPo ? <span style={{ color:"#d97706", fontWeight:700 }}>⭐ Yes</span> : <span style={{ color:"#9ca3af" }}>—</span>}
                        </td>
                        <td style={{ padding:"12px 14px", fontWeight:700, color:"#10b981" }}>{t.performance?.okrScore || 0}%</td>
                        <td style={{ padding:"12px 14px", fontWeight:700, color:"#3b82f6" }}>{t.performance?.lastAssessmentScore || 0}%</td>
                        <td style={{ padding:"12px 14px" }}>
                          {t.performance?.promotionEligible
                            ? <span style={{ color:"#059669", fontWeight:700 }}>✓ Yes</span>
                            : <span style={{ color:"#9ca3af" }}>No</span>}
                        </td>
                        <td style={{ padding:"12px 14px", color:"#6b7280", whiteSpace:"nowrap" }}>
                          {new Date(t.enrolledAt).toLocaleDateString("en-IN")}
                        </td>
                        <td style={{ padding:"12px 14px" }}>
                          <div style={{ display:"flex", gap:6 }}>
                            <button onClick={()=>{ setSelected(t); setView("detail"); }}
                              style={{ padding:"5px 12px", border:"1px solid #3b82f6", borderRadius:6, background:"#fff", color:"#3b82f6", fontSize:11, fontWeight:600, cursor:"pointer" }}>
                              View
                            </button>
                            <button onClick={()=>{ setSelected(t); setView("edit"); }}
                              style={{ padding:"5px 10px", border:"1px solid #e5e7eb", borderRadius:6, background:"#fff", color:"#6b7280", fontSize:11, cursor:"pointer" }}>
                              ✏️
                            </button>
                            {t.status !== "withdrawn" && (
                              <button onClick={()=>handleWithdraw(t._id)}
                                style={{ padding:"5px 10px", border:"1px solid #fca5a5", borderRadius:6, background:"#fff", color:"#ef4444", fontSize:11, cursor:"pointer" }}>
                                ✕
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
          </div>
        )}
      </div>
    </div>
  );
}