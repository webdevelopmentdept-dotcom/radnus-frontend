import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  ShieldCheck, Plus, Pencil, Check, X, Users, Star,
  Banknote, TrendingUp, BookOpen, Clock, ToggleLeft,
  ToggleRight, CheckCircle2, XCircle, RefreshCw,
  ChevronDown, ChevronRight, Calendar, Award,
  Briefcase, FileText, AlertTriangle, Info, Trash2
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

// ─── Constants ────────────────────────────────────────────────
const STATUS_CONFIG = {
  draft:        { label:"Draft",        color:"#6b7280", bg:"#f3f4f6" },
  active:       { label:"Active",       color:"#10b981", bg:"#ecfdf5" },
  under_review: { label:"Under Review", color:"#f59e0b", bg:"#fffbeb" },
  closed:       { label:"Closed",       color:"#ef4444", bg:"#fef2f2" },
};

const REVIEW_FREQS = ["monthly","quarterly","bi-annual","annual"];

const EMPTY_PLAN = {
  financialIncentives:  { description:"", amount:"", frequency:"quarterly", linkedTo:"" },
  careerGrowth:         { fastTrackedPromotion:false, leadershipGrooming:false, crossFunctionalExposure:false, notes:"" },
  skillDevelopment:     { externalCourses:false, internalBootcamp:false, radnusAcademyLMS:false, certifications:[], notes:"" },
  workFlexibility:      { remoteWork:false, flexibleHours:false, projectBasedAutonomy:false, notes:"" },
  recognition:          { boardLevelVisibility:false, townhallHighlight:false, digitalLeaderboard:false, esopEligible:false, notes:"" },
  reviewFrequency:      "quarterly",
  nextReviewDate:       "",
  approvedBy:           "",
  status:               "draft",
  hrNotes:              "",
};

const labelStyle = { fontSize:11, fontWeight:700, color:"#6b7280", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:4, display:"block" };

// ─── Toggle Row ───────────────────────────────────────────────
function ToggleRow({ label, checked, onChange, disabled }) {
  return (
    <div className="d-flex align-items-center justify-content-between py-1">
      <span style={{ fontSize:13, color:"#374151" }}>{label}</span>
      {disabled ? (
        <span className="badge" style={{ background:checked?"#ecfdf5":"#f3f4f6", color:checked?"#059669":"#9ca3af", border:`1px solid ${checked?"#6ee7b7":"#e5e7eb"}`, fontSize:11 }}>
          {checked ? "Yes" : "No"}
        </span>
      ) : (
        <div className="form-check form-switch mb-0">
          <input className="form-check-input" type="checkbox" role="switch" checked={checked} onChange={e=>onChange(e.target.checked)} style={{ width:34, height:18, cursor:"pointer" }}/>
        </div>
      )}
    </div>
  );
}

// ─── Section Card ─────────────────────────────────────────────
function SectionCard({ title, icon, color, bg, children }) {
  return (
    <div className="card border-0 shadow-sm h-100" style={{ borderRadius:13 }}>
      <div className="card-body">
        <div className="d-flex align-items-center gap-2 mb-3">
          <div style={{ width:32,height:32,borderRadius:8,background:bg,display:"flex",alignItems:"center",justifyContent:"center",color,flexShrink:0 }}>
            {icon}
          </div>
          <p className="mb-0 fw-bold" style={{ fontSize:14, color:"#111827" }}>{title}</p>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Plan Form ────────────────────────────────────────────────
function PlanForm({ initialPlan, employees, onSave, onCancel, isNew }) {
  const [employeeId, setEmployeeId] = useState(initialPlan?.employeeId?._id || initialPlan?.employeeId || "");
  const [plan, setPlan] = useState({
    ...EMPTY_PLAN,
    ...(initialPlan || {}),
    financialIncentives:  { ...EMPTY_PLAN.financialIncentives,  ...(initialPlan?.financialIncentives||{})  },
    careerGrowth:         { ...EMPTY_PLAN.careerGrowth,         ...(initialPlan?.careerGrowth||{})         },
    skillDevelopment:     { ...EMPTY_PLAN.skillDevelopment,     ...(initialPlan?.skillDevelopment||{})     },
    workFlexibility:      { ...EMPTY_PLAN.workFlexibility,      ...(initialPlan?.workFlexibility||{})      },
    recognition:          { ...EMPTY_PLAN.recognition,          ...(initialPlan?.recognition||{})          },
    nextReviewDate:       initialPlan?.nextReviewDate ? initialPlan.nextReviewDate.split("T")[0] : "",
  });
  const [certInput, setCertInput] = useState("");
  const [saving, setSaving] = useState(false);

  const setSection = (key, val) => setPlan(p => ({ ...p, [key]: { ...p[key], ...val } }));

  const handle = async () => {
    if (!employeeId && isNew) return alert("Select an employee");
    setSaving(true);
    await onSave(isNew ? { ...plan, employeeId } : plan);
    setSaving(false);
  };

  const addCert = () => {
    if (!certInput.trim()) return;
    setSection("skillDevelopment", { certifications: [...(plan.skillDevelopment.certifications||[]), certInput.trim()] });
    setCertInput("");
  };

  return (
    <div>
      {/* Employee select (new only) */}
      {isNew && (
        <div className="mb-4">
          <label style={labelStyle}>Employee *</label>
          <select className="form-select form-select-sm" value={employeeId} onChange={e=>setEmployeeId(e.target.value)} style={{ maxWidth:360 }}>
            <option value="">-- Select Employee --</option>
            {employees.map(e=><option key={e._id} value={e._id}>{e.name} — {e.department}</option>)}
          </select>
        </div>
      )}

      <div className="row g-4 mb-4">
        {/* Financial Incentives */}
        <div className="col-md-6">
          <SectionCard title="Financial Incentives" icon={<Banknote size={16}/>} color="#10b981" bg="#ecfdf5">
            <div className="d-flex flex-column gap-2">
              <div>
                <label style={labelStyle}>Description</label>
                <input className="form-control form-control-sm" value={plan.financialIncentives.description} onChange={e=>setSection("financialIncentives",{description:e.target.value})} placeholder="Competitive compensation, bonuses, impact awards"/>
              </div>
              <div className="row g-2">
                <div className="col">
                  <label style={labelStyle}>Amount / Range</label>
                  <input className="form-control form-control-sm" value={plan.financialIncentives.amount} onChange={e=>setSection("financialIncentives",{amount:e.target.value})} placeholder="e.g. ₹1L–₹5L"/>
                </div>
                <div className="col">
                  <label style={labelStyle}>Frequency</label>
                  <select className="form-select form-select-sm" value={plan.financialIncentives.frequency} onChange={e=>setSection("financialIncentives",{frequency:e.target.value})}>
                    {["quarterly","annual","performance-based"].map(f=><option key={f}>{f}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={labelStyle}>Linked To</label>
                <input className="form-control form-control-sm" value={plan.financialIncentives.linkedTo} onChange={e=>setSection("financialIncentives",{linkedTo:e.target.value})} placeholder="e.g. Business results, project delivery"/>
              </div>
            </div>
          </SectionCard>
        </div>

        {/* Career Growth */}
        <div className="col-md-6">
          <SectionCard title="Career Advancement" icon={<TrendingUp size={16}/>} color="#3b82f6" bg="#eff6ff">
            <ToggleRow label="Fast-tracked Promotion"       checked={plan.careerGrowth.fastTrackedPromotion}    onChange={v=>setSection("careerGrowth",{fastTrackedPromotion:v})}/>
            <ToggleRow label="Leadership Grooming"          checked={plan.careerGrowth.leadershipGrooming}      onChange={v=>setSection("careerGrowth",{leadershipGrooming:v})}/>
            <ToggleRow label="Cross-functional Exposure"    checked={plan.careerGrowth.crossFunctionalExposure} onChange={v=>setSection("careerGrowth",{crossFunctionalExposure:v})}/>
            <div className="mt-2">
              <label style={labelStyle}>Notes</label>
              <textarea className="form-control form-control-sm" rows={2} value={plan.careerGrowth.notes} onChange={e=>setSection("careerGrowth",{notes:e.target.value})} placeholder="Participation in Leadership Track, mentorship..."/>
            </div>
          </SectionCard>
        </div>

        {/* Skill Development */}
        <div className="col-md-6">
          <SectionCard title="Skill Development" icon={<BookOpen size={16}/>} color="#8b5cf6" bg="#f5f3ff">
            <ToggleRow label="External Courses"     checked={plan.skillDevelopment.externalCourses}  onChange={v=>setSection("skillDevelopment",{externalCourses:v})}/>
            <ToggleRow label="Internal Bootcamp"    checked={plan.skillDevelopment.internalBootcamp} onChange={v=>setSection("skillDevelopment",{internalBootcamp:v})}/>
            <ToggleRow label="Radnus Academy LMS"   checked={plan.skillDevelopment.radnusAcademyLMS} onChange={v=>setSection("skillDevelopment",{radnusAcademyLMS:v})}/>
            <div className="mt-2">
              <label style={labelStyle}>Certifications</label>
              <div className="input-group input-group-sm">
                <input className="form-control" value={certInput} onChange={e=>setCertInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addCert()} placeholder="Add certification & press Enter"/>
                <button className="btn btn-outline-secondary" onClick={addCert} type="button">Add</button>
              </div>
              <div className="d-flex flex-wrap gap-1 mt-2">
                {plan.skillDevelopment.certifications?.map((c,i)=>(
                  <span key={i} className="badge bg-light text-dark border" style={{ fontSize:11 }}>
                    {c} <X size={10} className="ms-1" style={{ cursor:"pointer" }} onClick={()=>setSection("skillDevelopment",{certifications:plan.skillDevelopment.certifications.filter((_,j)=>j!==i)})}/>
                  </span>
                ))}
              </div>
            </div>
            <div className="mt-2">
              <label style={labelStyle}>Notes</label>
              <textarea className="form-control form-control-sm" rows={2} value={plan.skillDevelopment.notes} onChange={e=>setSection("skillDevelopment",{notes:e.target.value})} placeholder="Radnus Academy LMS, bootcamp details..."/>
            </div>
          </SectionCard>
        </div>

        {/* Work Flexibility */}
        <div className="col-md-6">
          <SectionCard title="Flexible Work Options" icon={<Clock size={16}/>} color="#f59e0b" bg="#fffbeb">
            <ToggleRow label="Remote Work"               checked={plan.workFlexibility.remoteWork}           onChange={v=>setSection("workFlexibility",{remoteWork:v})}/>
            <ToggleRow label="Flexible Hours"            checked={plan.workFlexibility.flexibleHours}        onChange={v=>setSection("workFlexibility",{flexibleHours:v})}/>
            <ToggleRow label="Project-based Autonomy"    checked={plan.workFlexibility.projectBasedAutonomy} onChange={v=>setSection("workFlexibility",{projectBasedAutonomy:v})}/>
            <div className="mt-2">
              <label style={labelStyle}>Notes</label>
              <textarea className="form-control form-control-sm" rows={2} value={plan.workFlexibility.notes} onChange={e=>setSection("workFlexibility",{notes:e.target.value})} placeholder="Customized schedule details..."/>
            </div>
          </SectionCard>
        </div>

        {/* Recognition */}
        <div className="col-md-6">
          <SectionCard title="Recognition & Engagement" icon={<Award size={16}/>} color="#ef4444" bg="#fef2f2">
            <ToggleRow label="Board-level Visibility"    checked={plan.recognition.boardLevelVisibility} onChange={v=>setSection("recognition",{boardLevelVisibility:v})}/>
            <ToggleRow label="Townhall Highlight"        checked={plan.recognition.townhallHighlight}    onChange={v=>setSection("recognition",{townhallHighlight:v})}/>
            <ToggleRow label="Digital Leaderboard"       checked={plan.recognition.digitalLeaderboard}  onChange={v=>setSection("recognition",{digitalLeaderboard:v})}/>
            <ToggleRow label="ESOP Eligible"             checked={plan.recognition.esopEligible}        onChange={v=>setSection("recognition",{esopEligible:v})}/>
            <div className="mt-2">
              <label style={labelStyle}>Notes</label>
              <textarea className="form-control form-control-sm" rows={2} value={plan.recognition.notes} onChange={e=>setSection("recognition",{notes:e.target.value})} placeholder="Impact Bonus, public recognition details..."/>
            </div>
          </SectionCard>
        </div>

        {/* Plan Meta */}
        <div className="col-md-6">
          <SectionCard title="Plan Settings" icon={<FileText size={16}/>} color="#6b7280" bg="#f3f4f6">
            <div className="d-flex flex-column gap-3">
              <div className="row g-2">
                <div className="col">
                  <label style={labelStyle}>Review Frequency</label>
                  <select className="form-select form-select-sm" value={plan.reviewFrequency} onChange={e=>setPlan(p=>({...p,reviewFrequency:e.target.value}))}>
                    {REVIEW_FREQS.map(f=><option key={f} value={f}>{f.charAt(0).toUpperCase()+f.slice(1)}</option>)}
                  </select>
                </div>
                <div className="col">
                  <label style={labelStyle}>Next Review Date</label>
                  <input type="date" className="form-control form-control-sm" value={plan.nextReviewDate} onChange={e=>setPlan(p=>({...p,nextReviewDate:e.target.value}))}/>
                </div>
              </div>
              <div className="row g-2">
                <div className="col">
                  <label style={labelStyle}>Approved By (CEO/CPO)</label>
                  <input className="form-control form-control-sm" value={plan.approvedBy} onChange={e=>setPlan(p=>({...p,approvedBy:e.target.value}))} placeholder="e.g. Anand Kumar — CPO"/>
                </div>
                <div className="col">
                  <label style={labelStyle}>Status</label>
                  <select className="form-select form-select-sm" value={plan.status} onChange={e=>setPlan(p=>({...p,status:e.target.value}))}>
                    {Object.entries(STATUS_CONFIG).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={labelStyle}>HR Notes (Confidential)</label>
                <textarea className="form-control form-control-sm" rows={3} value={plan.hrNotes} onChange={e=>setPlan(p=>({...p,hrNotes:e.target.value}))} placeholder="Internal HR notes about this employee's retention risk, strategy..."/>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>

      {/* Actions */}
      <div className="d-flex gap-3 pt-2 border-top">
        <button className="btn btn-light px-4" onClick={onCancel}>Cancel</button>
        <button className="btn btn-primary fw-bold px-5" onClick={handle} disabled={saving}>
          {saving?"Saving...":isNew?"Create Retention Plan":"Update Plan"}
        </button>
      </div>
    </div>
  );
}

// ─── Plan View (Read-only) ────────────────────────────────────
function PlanView({ plan }) {
  const empName = plan.employeeId?.name || "—";
  const st = STATUS_CONFIG[plan.status] || STATUS_CONFIG.draft;

  const BoolBadge = ({ val }) => (
    <span className="badge" style={{ background:val?"#ecfdf5":"#f3f4f6", color:val?"#059669":"#9ca3af", border:`1px solid ${val?"#6ee7b7":"#e5e7eb"}`, fontSize:11 }}>{val?"Included":"Not included"}</span>
  );

  return (
    <div>
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4">
        <div>
          <h5 className="fw-bold mb-1">Retention Plan — {empName}</h5>
          <div className="d-flex align-items-center gap-2">
            <span className="badge" style={{ background:st.bg, color:st.color, border:`1px solid ${st.color}33` }}>{st.label}</span>
            {plan.approvedBy&&<span className="text-muted" style={{ fontSize:12 }}>Approved by: {plan.approvedBy}</span>}
            {plan.nextReviewDate&&<span className="text-muted" style={{ fontSize:12 }}>Next review: {new Date(plan.nextReviewDate).toLocaleDateString("en-IN")}</span>}
          </div>
        </div>
      </div>

      <div className="row g-4 mb-4">
        {/* Financial */}
        <div className="col-md-6">
          <SectionCard title="Financial Incentives" icon={<Banknote size={16}/>} color="#10b981" bg="#ecfdf5">
            {plan.financialIncentives?.description&&<p className="mb-1" style={{ fontSize:13 }}>{plan.financialIncentives.description}</p>}
            <div className="d-flex gap-3 flex-wrap" style={{ fontSize:12, color:"#6b7280" }}>
              {plan.financialIncentives?.amount&&<span>Amount: <strong>{plan.financialIncentives.amount}</strong></span>}
              {plan.financialIncentives?.frequency&&<span>Frequency: <strong>{plan.financialIncentives.frequency}</strong></span>}
              {plan.financialIncentives?.linkedTo&&<span>Linked to: <strong>{plan.financialIncentives.linkedTo}</strong></span>}
            </div>
          </SectionCard>
        </div>

        {/* Career */}
        <div className="col-md-6">
          <SectionCard title="Career Advancement" icon={<TrendingUp size={16}/>} color="#3b82f6" bg="#eff6ff">
            <ToggleRow label="Fast-tracked Promotion"    checked={plan.careerGrowth?.fastTrackedPromotion}    disabled/>
            <ToggleRow label="Leadership Grooming"       checked={plan.careerGrowth?.leadershipGrooming}      disabled/>
            <ToggleRow label="Cross-functional Exposure" checked={plan.careerGrowth?.crossFunctionalExposure} disabled/>
            {plan.careerGrowth?.notes&&<p className="mb-0 text-muted mt-2" style={{ fontSize:12 }}>{plan.careerGrowth.notes}</p>}
          </SectionCard>
        </div>

        {/* Skills */}
        <div className="col-md-6">
          <SectionCard title="Skill Development" icon={<BookOpen size={16}/>} color="#8b5cf6" bg="#f5f3ff">
            <ToggleRow label="External Courses"   checked={plan.skillDevelopment?.externalCourses}  disabled/>
            <ToggleRow label="Internal Bootcamp"  checked={plan.skillDevelopment?.internalBootcamp} disabled/>
            <ToggleRow label="Radnus Academy LMS" checked={plan.skillDevelopment?.radnusAcademyLMS} disabled/>
            {plan.skillDevelopment?.certifications?.length>0&&(
              <div className="mt-2 d-flex flex-wrap gap-1">
                {plan.skillDevelopment.certifications.map((c,i)=><span key={i} className="badge bg-light text-dark border" style={{ fontSize:11 }}>{c}</span>)}
              </div>
            )}
            {plan.skillDevelopment?.notes&&<p className="mb-0 text-muted mt-2" style={{ fontSize:12 }}>{plan.skillDevelopment.notes}</p>}
          </SectionCard>
        </div>

        {/* Flexibility */}
        <div className="col-md-6">
          <SectionCard title="Flexible Work Options" icon={<Clock size={16}/>} color="#f59e0b" bg="#fffbeb">
            <ToggleRow label="Remote Work"             checked={plan.workFlexibility?.remoteWork}           disabled/>
            <ToggleRow label="Flexible Hours"          checked={plan.workFlexibility?.flexibleHours}        disabled/>
            <ToggleRow label="Project-based Autonomy"  checked={plan.workFlexibility?.projectBasedAutonomy} disabled/>
            {plan.workFlexibility?.notes&&<p className="mb-0 text-muted mt-2" style={{ fontSize:12 }}>{plan.workFlexibility.notes}</p>}
          </SectionCard>
        </div>

        {/* Recognition */}
        <div className="col-md-6">
          <SectionCard title="Recognition & Engagement" icon={<Award size={16}/>} color="#ef4444" bg="#fef2f2">
            <ToggleRow label="Board-level Visibility"  checked={plan.recognition?.boardLevelVisibility} disabled/>
            <ToggleRow label="Townhall Highlight"      checked={plan.recognition?.townhallHighlight}    disabled/>
            <ToggleRow label="Digital Leaderboard"     checked={plan.recognition?.digitalLeaderboard}  disabled/>
            <ToggleRow label="ESOP Eligible"           checked={plan.recognition?.esopEligible}        disabled/>
            {plan.recognition?.notes&&<p className="mb-0 text-muted mt-2" style={{ fontSize:12 }}>{plan.recognition.notes}</p>}
          </SectionCard>
        </div>

        {/* Review History */}
        {plan.reviewHistory?.length>0&&(
          <div className="col-md-6">
            <SectionCard title="Review History" icon={<Calendar size={16}/>} color="#6b7280" bg="#f3f4f6">
              <div className="d-flex flex-column gap-2">
                {plan.reviewHistory.map((r,i)=>(
                  <div key={i} style={{ borderLeft:"3px solid #3b82f6", paddingLeft:10 }}>
                    <p className="mb-0 fw-semibold" style={{ fontSize:13 }}>{r.outcome}</p>
                    <p className="mb-0 text-muted" style={{ fontSize:11 }}>{new Date(r.date).toLocaleDateString("en-IN")} · {r.reviewedBy}</p>
                    {r.notes&&<p className="mb-0 text-muted" style={{ fontSize:11 }}>{r.notes}</p>}
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────────
function DeleteModal({ plan, onConfirm, onCancel, deleting }) {
  return (
    <div className="modal d-block" tabIndex="-1" style={{ background:"rgba(0,0,0,0.4)" }}>
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth:420 }}>
        <div className="modal-content border-0" style={{ borderRadius:14 }}>
          <div className="modal-body p-4 text-center">
            <div style={{ width:56,height:56,borderRadius:"50%",background:"#fef2f2",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px" }}>
              <Trash2 size={24} color="#ef4444"/>
            </div>
            <h5 className="fw-bold mb-2">Delete Retention Plan?</h5>
            <p className="text-muted mb-4" style={{ fontSize:14 }}>
              Are you sure you want to delete the retention plan for <strong>{plan?.employeeId?.name || "this employee"}</strong>? This action cannot be undone.
            </p>
            <div className="d-flex gap-3 justify-content-center">
              <button className="btn btn-light px-4" onClick={onCancel} disabled={deleting}>Cancel</button>
              <button className="btn btn-danger fw-bold px-4" onClick={onConfirm} disabled={deleting}>
                {deleting ? (
                  <><span className="spinner-border spinner-border-sm me-2"/>Deleting...</>
                ) : (
                  <><Trash2 size={14} className="me-1"/>Delete</>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────
export default function RetentionPlan({ role = "hr" }) {
  const [plans, setPlans]               = useState([]);
  const [employees, setEmployees]       = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [view, setView]                 = useState("list"); // "list"|"create"|"edit"|"detail"
  const [selected, setSelected]         = useState(null);
  const [toast, setToast]               = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null); // plan to delete
  const [deleting, setDeleting]         = useState(false);

  const employeeId = localStorage.getItem("employee_id");

  const showMsg = (msg, type="success") => {
    setToast({ msg, type });
    setTimeout(()=>setToast(null), 3000);
  };

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      if (role === "hr") {
        const [plansRes, empRes] = await Promise.all([
          axios.get(`${API_BASE}/api/retention`),
          axios.get(`${API_BASE}/api/hr/employees`),
        ]);
        setPlans(plansRes.data.data || []);
        const allEmp = Array.isArray(empRes.data) ? empRes.data : [];
        setEmployees(allEmp.filter(emp => emp.status === "active"));
      } else {
        const res = await axios.get(`${API_BASE}/api/retention/${employeeId}`);
        setSelected(res.data.data);
      }
    } catch (e) {
      if (e?.response?.status === 404 && role === "employee") setSelected(null);
      else setError(e?.response?.data?.message || "Failed to load");
    }
    finally { setLoading(false); }
  }, [role, employeeId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = async (data) => {
    try {
      await axios.post(`${API_BASE}/api/retention`, data);
      showMsg("Retention plan created successfully");
      setView("list"); fetchData();
    } catch (e) { showMsg(e?.response?.data?.message||"Failed","error"); }
  };

  const handleUpdate = async (data) => {
    try {
      await axios.put(`${API_BASE}/api/retention/${selected._id}`, data);
      showMsg("Plan updated successfully");
      setView("list"); setSelected(null); fetchData();
    } catch (e) { showMsg(e?.response?.data?.message||"Failed","error"); }
  };

  // ── DELETE ────────────────────────────────────────────────
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await axios.delete(`${API_BASE}/api/retention/${deleteTarget._id}`);
      showMsg("Retention plan deleted successfully");
      setDeleteTarget(null);
      fetchData();
    } catch (e) {
      showMsg(e?.response?.data?.message || "Failed to delete", "error");
      setDeleteTarget(null);
    }
    setDeleting(false);
  };

  if (loading) return <div className="d-flex justify-content-center p-5"><div className="spinner-border text-primary"/></div>;
  if (error)   return <div className="alert alert-danger m-4">{error}</div>;

  // ── EMPLOYEE VIEW ─────────────────────────────────────────
  if (role === "employee") {
    if (!selected) return (
      <div className="container-fluid py-5 text-center">
        <ShieldCheck size={48} className="text-muted mb-3"/>
        <h5 className="text-muted">No Retention Plan assigned to you yet.</h5>
        <p className="text-muted">Your HR team will create a personalised plan when eligible.</p>
        <div className="card border-0 shadow-sm mx-auto mt-4" style={{ maxWidth:500, borderRadius:14, borderLeft:"4px solid #3b82f6" }}>
          <div className="card-body">
            <p className="fw-bold mb-2" style={{ fontSize:14 }}>Eligibility (Policy 3.38)</p>
            <ul className="text-muted mb-0" style={{ fontSize:13 }}>
              <li>Critical role: Tech Lead, Product Manager, Sales Head, Key Account Manager, CXO-level</li>
              <li>Minimum Top 20% performance rating in last appraisal</li>
              <li>Minimum 12 months in current role</li>
            </ul>
          </div>
        </div>
      </div>
    );
    return (
      <div className="container-fluid py-4" style={{ maxWidth:1000 }}>
        <div className="d-flex align-items-center gap-3 mb-4">
          <div style={{ width:42,height:42,borderRadius:11,background:"linear-gradient(135deg,#10b981,#3b82f6)",display:"flex",alignItems:"center",justifyContent:"center" }}>
            <ShieldCheck size={20} color="#fff"/>
          </div>
          <div>
            <h4 className="mb-0 fw-bold">My Retention Plan</h4>
            <p className="mb-0 text-muted" style={{ fontSize:12 }}>Radnus Policy 3.38 — Custom Retention Plan for Critical Positions</p>
          </div>
        </div>
        <div className="alert alert-info d-flex align-items-center gap-2 mb-4" style={{ fontSize:13 }}>
          <Info size={15}/>
          This is your personalised retention plan. It is confidential and reviewed {selected.reviewFrequency}. Contact HR for any queries.
        </div>
        <PlanView plan={selected}/>
      </div>
    );
  }

  // ── HR: Create / Edit ─────────────────────────────────────
  if (view === "create" || view === "edit") return (
    <div className="container-fluid py-4" style={{ maxWidth:1200 }}>
      {toast&&<div className={`alert alert-${toast.type==="error"?"danger":"success"} position-fixed top-0 end-0 m-3`} style={{ zIndex:9999 }}>{toast.msg}</div>}
      <div className="d-flex align-items-center gap-3 mb-4">
        <button className="btn btn-sm btn-light" onClick={()=>{setView("list");setSelected(null);}}>← Back</button>
        <h5 className="mb-0 fw-bold">{view==="create"?"Create New Retention Plan":"Edit Retention Plan"}</h5>
        {selected&&<span className="text-muted" style={{ fontSize:13 }}>— {selected.employeeId?.name}</span>}
      </div>
      <PlanForm
        initialPlan={view==="edit"?selected:null}
        employees={employees}
        isNew={view==="create"}
        onSave={view==="create"?handleCreate:handleUpdate}
        onCancel={()=>{setView("list");setSelected(null);}}
      />
    </div>
  );

  // ── HR: Detail view ───────────────────────────────────────
  if (view === "detail" && selected) return (
    <div className="container-fluid py-4" style={{ maxWidth:1100 }}>
      {toast&&<div className={`alert alert-${toast.type==="error"?"danger":"success"} position-fixed top-0 end-0 m-3`} style={{ zIndex:9999 }}>{toast.msg}</div>}
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4">
        <div className="d-flex align-items-center gap-2">
          <button className="btn btn-sm btn-light" onClick={()=>{setView("list");setSelected(null);}}>← Back</button>
          <h5 className="mb-0 fw-bold">Retention Plan — {selected.employeeId?.name}</h5>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1" onClick={()=>setView("edit")}>
            <Pencil size={13}/> Edit Plan
          </button>
          <button className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1" onClick={()=>setDeleteTarget(selected)}>
            <Trash2 size={13}/> Delete Plan
          </button>
        </div>
      </div>
      <PlanView plan={selected}/>

      {/* Delete Modal */}
      {deleteTarget && (
        <DeleteModal
          plan={deleteTarget}
          onConfirm={handleDeleteConfirm}
          onCancel={()=>setDeleteTarget(null)}
          deleting={deleting}
        />
      )}
    </div>
  );

  // ── HR: List ──────────────────────────────────────────────
  return (
    <div className="container-fluid py-4" style={{ maxWidth:1300 }}>
      {toast&&<div className={`alert alert-${toast.type==="error"?"danger":"success"} position-fixed top-0 end-0 m-3`} style={{ zIndex:9999 }}>{toast.msg}</div>}

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <DeleteModal
          plan={deleteTarget}
          onConfirm={handleDeleteConfirm}
          onCancel={()=>setDeleteTarget(null)}
          deleting={deleting}
        />
      )}

      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
        <div className="d-flex align-items-center gap-3">
          <div style={{ width:42,height:42,borderRadius:11,background:"linear-gradient(135deg,#10b981,#3b82f6)",display:"flex",alignItems:"center",justifyContent:"center" }}>
            <ShieldCheck size={20} color="#fff"/>
          </div>
          <div>
            <h4 className="mb-0 fw-bold">Custom Retention Plans</h4>
            <p className="mb-0 text-muted" style={{ fontSize:12 }}>Radnus Policy 3.38 · Personalised plans for critical positions</p>
          </div>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-sm btn-light d-flex align-items-center gap-1" onClick={fetchData} disabled={loading}><RefreshCw size={13}/> Refresh</button>
          <button className="btn btn-primary d-flex align-items-center gap-2 fw-bold" onClick={()=>setView("create")}><Plus size={14}/> New Plan</button>
        </div>
      </div>

      {/* Stats */}
      <div className="row g-3 mb-4">
        {Object.entries(STATUS_CONFIG).map(([key,cfg])=>{
          const count = plans.filter(p=>p.status===key).length;
          return (
            <div key={key} className="col">
              <div className="card border-0 shadow-sm" style={{ borderRadius:11 }}>
                <div className="card-body py-3 d-flex justify-content-between align-items-center">
                  <div>
                    <p className="mb-0 text-muted" style={{ fontSize:11, textTransform:"uppercase", fontWeight:700 }}>{cfg.label}</p>
                    <p className="mb-0 fw-bold" style={{ fontSize:24, color:cfg.color }}>{count}</p>
                  </div>
                  <span style={{ width:38,height:38,borderRadius:9,background:cfg.bg,display:"flex",alignItems:"center",justifyContent:"center" }}>
                    <ShieldCheck size={18} color={cfg.color}/>
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Policy reminder */}
      <div className="alert d-flex align-items-start gap-2 mb-4" style={{ background:"#eff6ff", border:"1px solid #bfdbfe", borderRadius:10, fontSize:12 }}>
        <Info size={15} color="#3b82f6" style={{ flexShrink:0, marginTop:1 }}/>
        <p className="mb-0" style={{ color:"#1e40af" }}>
          <strong>Policy 3.38:</strong> Retention plans require CEO/CPO approval and are maintained as confidential HR records. Review effectiveness quarterly and adjust based on employee feedback and business priorities.
        </p>
      </div>

      {/* Plans table */}
      {plans.length === 0 ? (
        <div className="text-center py-5">
          <ShieldCheck size={40} className="text-muted mb-3"/>
          <p className="text-muted">No retention plans created yet. Start by clicking "New Plan".</p>
        </div>
      ) : (
        <div className="card border-0 shadow-sm" style={{ borderRadius:12, overflow:"hidden" }}>
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" style={{ fontSize:13 }}>
              <thead className="table-light">
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Components</th>
                  <th>Review</th>
                  <th>Approved By</th>
                  <th>Last Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {plans.map(p=>{
                  const st = STATUS_CONFIG[p.status]||STATUS_CONFIG.draft;
                  const components = [
                    p.financialIncentives?.amount?"Financial":null,
                    p.careerGrowth?.fastTrackedPromotion||p.careerGrowth?.leadershipGrooming?"Career":null,
                    p.skillDevelopment?.externalCourses||p.skillDevelopment?.radnusAcademyLMS?"Skills":null,
                    p.workFlexibility?.remoteWork||p.workFlexibility?.flexibleHours?"Flex":null,
                    p.recognition?.esopEligible||p.recognition?.boardLevelVisibility?"Recognition":null,
                  ].filter(Boolean);
                  return (
                    <tr key={p._id}>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div style={{ width:30,height:30,borderRadius:"50%",background:"#eff6ff",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,color:"#3b82f6",fontSize:12,flexShrink:0 }}>
                            {p.employeeId?.name?.charAt(0)||"?"}
                          </div>
                          <p className="mb-0 fw-bold" style={{ fontSize:13 }}>{p.employeeId?.name||"—"}</p>
                        </div>
                      </td>
                      <td className="text-muted" style={{ fontSize:12 }}>{p.employeeId?.department||"—"}</td>
                      <td><span className="badge" style={{ background:st.bg, color:st.color, border:`1px solid ${st.color}33` }}>{st.label}</span></td>
                      <td>
                        <div className="d-flex gap-1 flex-wrap">
                          {components.map(c=><span key={c} className="badge bg-light text-dark" style={{ fontSize:10 }}>{c}</span>)}
                          {components.length===0&&<span className="text-muted" style={{ fontSize:11 }}>—</span>}
                        </div>
                      </td>
                      <td className="text-muted" style={{ fontSize:12 }}>{p.reviewFrequency}</td>
                      <td className="text-muted" style={{ fontSize:12 }}>{p.approvedBy||"—"}</td>
                      <td className="text-muted" style={{ fontSize:12 }}>{new Date(p.updatedAt).toLocaleDateString("en-IN")}</td>
                      <td>
                        <div className="d-flex gap-1">
                          <button
                            className="btn btn-sm btn-outline-primary py-0 px-2"
                            style={{ fontSize:11 }}
                            onClick={()=>{setSelected(p);setView("detail");}}
                          >
                            View
                          </button>
                          <button
                            className="btn btn-sm btn-outline-secondary py-0 px-2"
                            style={{ fontSize:11 }}
                            onClick={()=>{setSelected(p);setView("edit");}}
                          >
                            <Pencil size={11}/>
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger py-0 px-2"
                            style={{ fontSize:11 }}
                            onClick={()=>setDeleteTarget(p)}
                          >
                            <Trash2 size={11}/>
                          </button>
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
  );
}