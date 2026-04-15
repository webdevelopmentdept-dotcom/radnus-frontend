import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  BookOpen, Users, Target, Award, CheckCircle2, Clock,
  AlertTriangle, Plus, Pencil, X, Check, RefreshCw,
  ChevronRight, BarChart2, Layers, FileText, Search,
  Filter, Download, TrendingUp, Star, Zap, Info,
  UserCheck, Calendar, GraduationCap, ClipboardList,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

// ─── Constants ────────────────────────────────────────────────
const STATUS_CONFIG = {
  pending:     { label: "Pending",     color: "#6b7280", bg: "#f3f4f6" },
  in_progress: { label: "In Progress", color: "#3b82f6", bg: "#eff6ff" },
  completed:   { label: "Completed",   color: "#10b981", bg: "#ecfdf5" },
  overdue:     { label: "Overdue",     color: "#ef4444", bg: "#fef2f2" },
  waived:      { label: "Waived",      color: "#8b5cf6", bg: "#f5f3ff" },
};

const LEVEL_CONFIG = {
  L1: { label: "L1 – Intern/Trainee",        color: "#6b7280" },
  L2: { label: "L2 – Executive",              color: "#3b82f6" },
  L3: { label: "L3 – Senior Executive",       color: "#8b5cf6" },
  L4: { label: "L4 – Manager",                color: "#f59e0b" },
  L5: { label: "L5 – GM / AVP",               color: "#ef4444" },
  L6: { label: "L6 – VP / Director / CXO",   color: "#10b981" },
  all:{ label: "All Levels",                  color: "#111827" },
};

const TYPE_CONFIG = {
  induction:        { label: "Induction",        color: "#3b82f6", bg: "#eff6ff" },
  job_role:         { label: "Job Role",          color: "#8b5cf6", bg: "#f5f3ff" },
  cross_functional: { label: "Cross-Functional",  color: "#f59e0b", bg: "#fffbeb" },
  culture:          { label: "Culture",           color: "#10b981", bg: "#ecfdf5" },
  refresher:        { label: "Refresher",         color: "#6b7280", bg: "#f3f4f6" },
  department:       { label: "Department",        color: "#ef4444", bg: "#fef2f2" },
};

const DEPARTMENTS = ["Sales & Distribution","Technical & Service","HR & Admin","Accounts & Finance","Marketing","Operations","all"];
const LEVELS      = ["L1","L2","L3","L4","L5","L6","all"];
const TYPES       = ["induction","job_role","cross_functional","culture","refresher","department"];

const labelStyle = { fontSize:11, fontWeight:700, color:"#6b7280", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:4, display:"block" };

// ─── Stat Card ────────────────────────────────────────────────
function StatCard({ label, value, sub, color, bg, icon }) {
  return (
    <div className="card border-0 shadow-sm" style={{ borderRadius:11 }}>
      <div className="card-body py-3">
        <div className="d-flex justify-content-between align-items-start">
          <div>
            <p className="mb-0 text-muted" style={{ fontSize:11, textTransform:"uppercase", fontWeight:700 }}>{label}</p>
            <p className="mb-0 fw-bold" style={{ fontSize:22, color }}>{value}</p>
            {sub && <p className="mb-0 text-muted" style={{ fontSize:11 }}>{sub}</p>}
          </div>
          <span style={{ width:36, height:36, borderRadius:9, background:bg, display:"flex", alignItems:"center", justifyContent:"center", color }}>{icon}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Assign Modal ─────────────────────────────────────────────
function AssignModal({ programs, employees, onClose, onSave }) {
  const [mode, setMode]         = useState("single"); // "single"|"bulk"
  const [employeeId, setEmpId]  = useState("");
  const [employeeIds, setEmpIds]= useState([]);
  const [programId, setProgId]  = useState("");
  const [dueDate, setDueDate]   = useState("");
  const [notes, setNotes]       = useState("");
  const [saving, setSaving]     = useState(false);

  const handle = async () => {
    if (!programId) return alert("Select a program");
    if (mode === "single" && !employeeId) return alert("Select an employee");
    if (mode === "bulk" && !employeeIds.length) return alert("Select at least one employee");
    setSaving(true);
    if (mode === "single") {
      await onSave("single", { employeeId, programId, dueDate, notes });
    } else {
      await onSave("bulk", { employeeIds, programId, dueDate });
    }
    setSaving(false);
  };

  const toggleEmp = (id) => setEmpIds(prev => prev.includes(id) ? prev.filter(e=>e!==id) : [...prev, id]);

  return (
    <div className="modal show d-block" style={{ background:"rgba(15,23,42,.45)", zIndex:1050 }}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content border-0 shadow-lg" style={{ borderRadius:14 }}>
          <div className="modal-header border-bottom" style={{ background:"#f9fafb", borderRadius:"14px 14px 0 0" }}>
            <div className="d-flex align-items-center gap-2">
              <GraduationCap size={18} color="#3b82f6" />
              <p className="mb-0 fw-bold" style={{ fontSize:14 }}>Assign Training</p>
            </div>
            <button className="btn-close" onClick={onClose} />
          </div>
          <div className="modal-body">
            {/* Mode toggle */}
            <div className="d-flex gap-2 mb-4">
              {["single","bulk"].map(m => (
                <button key={m} onClick={()=>setMode(m)}
                  className={`btn btn-sm ${mode===m?"btn-primary":"btn-light"}`} style={{ fontSize:12 }}>
                  {m === "single" ? "Single Employee" : "Bulk Assign"}
                </button>
              ))}
            </div>

            <div className="row g-3">
              <div className="col-md-6">
                <label style={labelStyle}>Training Program *</label>
                <select className="form-select form-select-sm" value={programId} onChange={e=>setProgId(e.target.value)}>
                  <option value="">-- Select Program --</option>
                  {programs.map(p=>(
                    <option key={p._id} value={p._id}>{p.title} ({LEVEL_CONFIG[p.level]?.label || p.level})</option>
                  ))}
                </select>
              </div>
              <div className="col-md-6">
                <label style={labelStyle}>Due Date</label>
                <input type="date" className="form-control form-control-sm" value={dueDate} onChange={e=>setDueDate(e.target.value)} />
              </div>

              {mode === "single" ? (
                <div className="col-12">
                  <label style={labelStyle}>Employee *</label>
                  <select className="form-select form-select-sm" value={employeeId} onChange={e=>setEmpId(e.target.value)}>
                    <option value="">-- Select Employee --</option>
                    {employees.map(e=><option key={e._id} value={e._id}>{e.name} — {e.department}</option>)}
                  </select>
                </div>
              ) : (
                <div className="col-12">
                  <label style={labelStyle}>Select Employees ({employeeIds.length} selected)</label>
                  <div style={{ maxHeight:200, overflowY:"auto", border:"1px solid #e5e7eb", borderRadius:8, padding:"8px" }}>
                    {employees.map(e=>(
                      <div key={e._id} className="form-check">
                        <input className="form-check-input" type="checkbox"
                          checked={employeeIds.includes(e._id)}
                          onChange={()=>toggleEmp(e._id)} />
                        <label className="form-check-label" style={{ fontSize:13 }}>{e.name} — {e.department}</label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {mode === "single" && (
                <div className="col-12">
                  <label style={labelStyle}>Notes</label>
                  <textarea className="form-control form-control-sm" rows={2} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Any instructions or notes..." />
                </div>
              )}
            </div>
          </div>
          <div className="modal-footer gap-2">
            <button className="btn btn-light flex-fill" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary fw-bold flex-fill" onClick={handle} disabled={saving}>
              {saving ? "Assigning..." : "Assign Training"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Record Update Modal ──────────────────────────────────────
function UpdateRecordModal({ record, onClose, onSave }) {
  const [form, setForm] = useState({
    status:              record.status,
    assessmentScore:     record.assessmentScore || "",
    certificationIssued: record.certificationIssued || false,
    progressNote:        "",
    notes:               record.notes || "",
  });
  const [saving, setSaving] = useState(false);

  return (
    <div className="modal show d-block" style={{ background:"rgba(15,23,42,.45)", zIndex:1055 }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 shadow-lg" style={{ borderRadius:14 }}>
          <div className="modal-header" style={{ background:"#f9fafb", borderRadius:"14px 14px 0 0" }}>
            <div className="d-flex align-items-center gap-2">
              <ClipboardList size={16} color="#10b981" />
              <div>
                <p className="mb-0 fw-bold" style={{ fontSize:14 }}>Update Training Record</p>
                <p className="mb-0 text-muted" style={{ fontSize:11 }}>{record.employeeId?.name} — {record.programId?.title}</p>
              </div>
            </div>
            <button className="btn-close" onClick={onClose} />
          </div>
          <div className="modal-body d-flex flex-column gap-3">
            <div>
              <label style={labelStyle}>Status</label>
              <select className="form-select form-select-sm" value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))}>
                {Object.entries(STATUS_CONFIG).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Post-Training Assessment Score (%)</label>
              <input type="number" min="0" max="100" className="form-control form-control-sm"
                value={form.assessmentScore}
                onChange={e=>setForm(f=>({...f,assessmentScore:e.target.value}))}
                placeholder="e.g. 85" />
              <p className="text-muted mt-1" style={{ fontSize:11 }}>Policy target: ≥ 80%</p>
            </div>
            <div className="form-check form-switch d-flex align-items-center gap-2" style={{ background:"#f9fafb", borderRadius:9, padding:"10px 14px", border:"1px solid #e5e7eb" }}>
              <input className="form-check-input" type="checkbox" role="switch"
                checked={form.certificationIssued}
                onChange={e=>setForm(f=>({...f,certificationIssued:e.target.checked}))}
                style={{ width:36, height:20 }} />
              <label className="form-check-label fw-bold" style={{ fontSize:13 }}>Certification Issued</label>
            </div>
            <div>
              <label style={labelStyle}>Progress Note</label>
              <textarea className="form-control form-control-sm" rows={2}
                value={form.progressNote}
                onChange={e=>setForm(f=>({...f,progressNote:e.target.value}))}
                placeholder="What was covered, observations..." />
            </div>
          </div>
          <div className="modal-footer gap-2">
            <button className="btn btn-light flex-fill" onClick={onClose}>Cancel</button>
            <button className="btn btn-success fw-bold flex-fill" disabled={saving}
              onClick={async()=>{setSaving(true);await onSave(record._id,{...form,assessmentScore:form.assessmentScore?Number(form.assessmentScore):undefined});setSaving(false);}}>
              {saving?"Saving...":"Update Record"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main HR Component ────────────────────────────────────────
export default function TrainingRoadmapHR() {
  const [programs, setPrograms]   = useState([]);
  const [records, setRecords]     = useState([]);
  const [employees, setEmployees] = useState([]);
  const [stats, setStats]         = useState(null);
  const [compLog, setCompLog]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [toast, setToast]         = useState(null);
  const [modal, setModal]         = useState(null); // "assign"|"update"
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [activeTab, setActiveTab] = useState("roadmap"); // "roadmap"|"records"|"compliance"|"kpi"
  const [search, setSearch]       = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDept, setFilterDept]     = useState("all");
  const [seeding, setSeeding]     = useState(false);

  const showMsg = (msg, type="success") => {
    setToast({ msg, type });
    setTimeout(()=>setToast(null), 3000);
  };

  const fetchAll = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params = {};
      if (filterStatus !== "all") params.status = filterStatus;
      if (filterDept   !== "all") params.department = filterDept;

      const [progRes, recRes, statsRes, empRes, logRes] = await Promise.all([
        axios.get(`${API_BASE}/api/training/programs`),
        axios.get(`${API_BASE}/api/training/records`, { params }),
        axios.get(`${API_BASE}/api/training/stats`),
        axios.get(`${API_BASE}/api/hr/employees`),
        axios.get(`${API_BASE}/api/training/compliance-log`, { params:{ limit:30 } }),
      ]);
      setPrograms(progRes.data.data || []);
      setRecords(recRes.data.data || []);
      setStats(statsRes.data.data);
      const allEmp = Array.isArray(empRes.data) ? empRes.data : [];
      setEmployees(allEmp.filter(e => e.status === "active"));
      setCompLog(logRes.data.data || []);
    } catch(e) { setError(e?.response?.data?.message || "Failed to load"); }
    finally { setLoading(false); }
  }, [filterStatus, filterDept]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const res = await axios.post(`${API_BASE}/api/training/seed`);
      showMsg(res.data.message);
      fetchAll();
    } catch(e) { showMsg("Seed failed","error"); }
    setSeeding(false);
  };

  const handleAssign = async (mode, data) => {
    try {
      if (mode === "single") {
        await axios.post(`${API_BASE}/api/training/assign`, data);
        showMsg("Training assigned successfully!");
      } else {
        await axios.post(`${API_BASE}/api/training/assign-bulk`, data);
        showMsg("Bulk assignment done!");
      }
      setModal(null);
      fetchAll();
    } catch(e) { showMsg(e?.response?.data?.message||"Failed","error"); }
  };

  const handleUpdate = async (id, data) => {
    try {
      await axios.put(`${API_BASE}/api/training/records/${id}`, data);
      showMsg("Record updated!");
      setModal(null);
      setSelectedRecord(null);
      fetchAll();
    } catch(e) { showMsg(e?.response?.data?.message||"Failed","error"); }
  };

  // Filter records
  const filteredRecords = records.filter(r => {
    const matchSearch = !search.trim() ||
      r.employeeId?.name?.toLowerCase().includes(search.toLowerCase()) ||
      r.programId?.title?.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  // Group programs by level for roadmap view
  const byLevel = LEVELS.filter(l=>l!=="all").reduce((acc, l) => {
    acc[l] = programs.filter(p => p.level === l && p.type !== "department");
    return acc;
  }, {});

  const byDept = DEPARTMENTS.filter(d=>d!=="all").reduce((acc, d) => {
    acc[d] = programs.filter(p => p.department === d || p.type === "department" && p.title.includes(d));
    return acc;
  }, {});

  return (
    <div className="container-fluid py-4" style={{ maxWidth:1400 }}>

      {toast && <div className={`alert alert-${toast.type==="error"?"danger":"success"} position-fixed top-0 end-0 m-3`} style={{ zIndex:9999, fontSize:13 }}>{toast.msg}</div>}

      {modal === "assign" && <AssignModal programs={programs} employees={employees} onClose={()=>setModal(null)} onSave={handleAssign} />}
      {modal === "update" && selectedRecord && <UpdateRecordModal record={selectedRecord} onClose={()=>{setModal(null);setSelectedRecord(null);}} onSave={handleUpdate} />}

      {/* ── Header ── */}
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
        <div className="d-flex align-items-center gap-3">
          <div style={{ width:44, height:44, borderRadius:12, background:"linear-gradient(135deg,#3b82f6,#8b5cf6)", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <GraduationCap size={22} color="#fff" />
          </div>
          <div>
            <h4 className="mb-0 fw-bold">Training Roadmap</h4>
            <p className="mb-0 text-muted" style={{ fontSize:12 }}>Policy 3.15 — Job-Role Based Mandatory Training (RCA)</p>
          </div>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          {programs.length === 0 && (
            <button className="btn btn-sm btn-warning fw-bold" onClick={handleSeed} disabled={seeding}>
              {seeding ? "Seeding..." : "⚡ Seed Default Programs"}
            </button>
          )}
          <button className="btn btn-sm btn-light d-flex align-items-center gap-1" onClick={fetchAll} disabled={loading}>
            <RefreshCw size={13} /> Refresh
          </button>
          <button className="btn btn-primary d-flex align-items-center gap-2 fw-bold" onClick={()=>setModal("assign")}>
            <Plus size={14} /> Assign Training
          </button>
        </div>
      </div>

      {/* ── Stats ── */}
      {stats && (
        <div className="row g-3 mb-4">
          <div className="col"><StatCard label="Total Assigned"    value={stats.total}          color="#111827" bg="#f3f4f6" icon={<BookOpen size={15}/>} /></div>
          <div className="col"><StatCard label="Completion Rate"   value={`${stats.completionRate}%`} sub={`Target ≥ 95%`} color={stats.completionRate>=95?"#10b981":"#ef4444"} bg={stats.completionRate>=95?"#ecfdf5":"#fef2f2"} icon={<CheckCircle2 size={15}/>} /></div>
          <div className="col"><StatCard label="In Progress"       value={stats.inProgress}     color="#3b82f6" bg="#eff6ff" icon={<Clock size={15}/>} /></div>
          <div className="col"><StatCard label="Overdue"           value={stats.overdue}        color="#ef4444" bg="#fef2f2" icon={<AlertTriangle size={15}/>} /></div>
          <div className="col"><StatCard label="Avg Score"         value={`${stats.avgScore}%`} sub="Target ≥ 80%" color={stats.avgScore>=80?"#10b981":"#f59e0b"} bg={stats.avgScore>=80?"#ecfdf5":"#fffbeb"} icon={<Target size={15}/>} /></div>
          <div className="col"><StatCard label="Certified"         value={stats.certified}      color="#8b5cf6" bg="#f5f3ff" icon={<Award size={15}/>} /></div>
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="d-flex gap-2 mb-3 flex-wrap">
        {[
          { key:"roadmap",    label:"Training Roadmap",       icon:<Layers size={13}/> },
          { key:"records",    label:`Records (${records.length})`, icon:<ClipboardList size={13}/> },
          { key:"compliance", label:"Compliance Log",         icon:<FileText size={13}/> },
          { key:"kpi",        label:"KPI Dashboard",          icon:<BarChart2 size={13}/> },
        ].map(tab=>(
          <button key={tab.key} onClick={()=>setActiveTab(tab.key)}
            className={`btn btn-sm d-flex align-items-center gap-1 ${activeTab===tab.key?"btn-primary":"btn-light"}`}
            style={{ fontSize:12 }}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* ══ ROADMAP TAB ══════════════════════════════════════════ */}
      {activeTab === "roadmap" && (
        <div>
          {/* Framework Banner */}
          <div className="card border-0 shadow-sm mb-4" style={{ borderRadius:13, background:"linear-gradient(135deg,#eff6ff,#f5f3ff)" }}>
            <div className="card-body p-4">
              <p className="fw-bold mb-3" style={{ fontSize:14 }}>Framework: Learn → Apply → Lead</p>
              <div className="row g-3">
                {[
                  { stage:"Learn", focus:"Foundation & Skill Learning", outcome:"Acquire job knowledge",        color:"#3b82f6", bg:"#eff6ff" },
                  { stage:"Apply", focus:"Real-world Implementation",   outcome:"Demonstrate proficiency",      color:"#8b5cf6", bg:"#f5f3ff" },
                  { stage:"Lead",  focus:"Coaching & Mentorship",       outcome:"Guide others, build leadership",color:"#10b981", bg:"#ecfdf5" },
                ].map(s=>(
                  <div key={s.stage} className="col-md-4">
                    <div style={{ background:s.bg, borderRadius:10, padding:"12px 16px", border:`1px solid ${s.color}33` }}>
                      <p className="mb-0 fw-bold" style={{ fontSize:15, color:s.color }}>{s.stage}</p>
                      <p className="mb-0" style={{ fontSize:12 }}>{s.focus}</p>
                      <p className="mb-0 text-muted" style={{ fontSize:11 }}>→ {s.outcome}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* L1-L6 Roadmap */}
          <p className="fw-bold mb-3" style={{ fontSize:14 }}>Job-Role Based Mandatory Training Roadmap (L1–L6)</p>
          <div className="row g-3 mb-4">
            {Object.entries(byLevel).map(([level, progs])=>{
              const cfg = LEVEL_CONFIG[level];
              const roadmapProg = programs.find(p => p.level===level && p.type==="induction" || p.level===level && p.type==="job_role");
              const displayProg = progs[0]; // primary program for this level
              return (
                <div key={level} className="col-md-6 col-lg-4">
                  <div className="card border-0 shadow-sm h-100" style={{ borderRadius:13, borderLeft:`4px solid ${cfg.color}` }}>
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <span className="badge" style={{ background:cfg.color, fontSize:12 }}>{level}</span>
                        {displayProg?.duration && <span className="badge bg-light text-dark" style={{ fontSize:11 }}>{displayProg.duration}</span>}
                      </div>
                      <p className="fw-bold mb-1" style={{ fontSize:13, color:cfg.color }}>{cfg.label}</p>
                      {displayProg ? (
                        <>
                          <div className="mb-2">
                            {displayProg.modules?.map((m,i)=>(
                              <div key={i} className="d-flex align-items-start gap-1 mb-1">
                                <Check size={11} color={cfg.color} style={{ flexShrink:0, marginTop:2 }} />
                                <span style={{ fontSize:12 }}>{m}</span>
                              </div>
                            ))}
                          </div>
                          {displayProg.certification && (
                            <div style={{ background:`${cfg.color}10`, borderRadius:7, padding:"6px 10px", marginBottom:8 }}>
                              <p className="mb-0" style={{ fontSize:11, color:cfg.color }}><Award size={11}/> {displayProg.certification}</p>
                            </div>
                          )}
                          {displayProg.conductedBy && (
                            <p className="mb-0 text-muted" style={{ fontSize:11 }}>By: {displayProg.conductedBy}</p>
                          )}
                        </>
                      ) : (
                        <p className="text-muted" style={{ fontSize:12 }}>No programs configured for this level.</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Training Frequency Table */}
          <p className="fw-bold mb-3" style={{ fontSize:14 }}>Training Frequency & Review</p>
          <div className="card border-0 shadow-sm mb-4" style={{ borderRadius:12, overflow:"hidden" }}>
            <div className="table-responsive">
              <table className="table table-sm align-middle mb-0" style={{ fontSize:13 }}>
                <thead className="table-light">
                  <tr><th>Training Type</th><th>Frequency</th><th>Responsible</th></tr>
                </thead>
                <tbody>
                  {[
                    { type:"Induction Training",             freq:"On Joining",    resp:"HR & L&D" },
                    { type:"Job Role Training",              freq:"Within 30 Days",resp:"Department Trainer" },
                    { type:"Cross-Functional / Leadership",  freq:"Every 6 Months",resp:"L&D + HR" },
                    { type:"Culture & Engagement Training",  freq:"Quarterly",     resp:"Culture Team" },
                    { type:"Refresher Training",             freq:"Annual",        resp:"HR & L&D" },
                  ].map((r,i)=>(
                    <tr key={i}>
                      <td className="fw-semibold">{r.type}</td>
                      <td><span className="badge bg-light text-dark" style={{ fontSize:11 }}>{r.freq}</span></td>
                      <td className="text-muted">{r.resp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Department Mandatory */}
          <p className="fw-bold mb-3" style={{ fontSize:14 }}>Department-Wise Mandatory Modules</p>
          <div className="row g-3">
            {[
              { dept:"Sales & Distribution", color:"#3b82f6", bg:"#eff6ff", modules:["Product Mastery","Negotiation Skills","Channel Management","CRM Usage","Customer Relationship Excellence"] },
              { dept:"Technical & Service",  color:"#8b5cf6", bg:"#f5f3ff", modules:["Product Repair Standards","Troubleshooting","Tools & ESD Handling","Quality Audits","RCV Model"] },
              { dept:"HR & Admin",           color:"#10b981", bg:"#ecfdf5", modules:["HR Policies","Recruitment SOPs","Payroll Management","Employee Engagement","HRMS System"] },
              { dept:"Accounts & Finance",   color:"#f59e0b", bg:"#fffbeb", modules:["GST / Tally / Compliance","Expense Control","Profit Analysis","Cost Optimization","Audit Preparation"] },
              { dept:"Marketing",            color:"#ef4444", bg:"#fef2f2", modules:["Digital Campaigns","Brand Guidelines","Market Analysis","Event Management","Customer Insights"] },
              { dept:"Operations",           color:"#6b7280", bg:"#f3f4f6", modules:["Stock Management","Vendor Handling","Delivery Process","Process Optimization","MIS Reporting"] },
            ].map((d,i)=>(
              <div key={i} className="col-md-6 col-lg-4">
                <div className="card border-0 shadow-sm h-100" style={{ borderRadius:12, borderTop:`3px solid ${d.color}` }}>
                  <div className="card-body">
                    <p className="fw-bold mb-2" style={{ fontSize:13, color:d.color }}>{d.dept}</p>
                    <div className="d-flex flex-column gap-1">
                      {d.modules.map((m,j)=>(
                        <div key={j} className="d-flex align-items-center gap-2">
                          <span style={{ width:6, height:6, borderRadius:"50%", background:d.color, flexShrink:0 }}/>
                          <span style={{ fontSize:12 }}>{m}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══ RECORDS TAB ══════════════════════════════════════════ */}
      {activeTab === "records" && (
        <div>
          {/* Filters */}
          <div className="card border-0 shadow-sm mb-3" style={{ borderRadius:10 }}>
            <div className="card-body py-2 px-3 d-flex gap-3 align-items-center flex-wrap">
              <div className="input-group input-group-sm" style={{ maxWidth:240 }}>
                <span className="input-group-text border-end-0 bg-white"><Search size={13} color="#9ca3af"/></span>
                <input className="form-control border-start-0" placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)}/>
              </div>
              <select className="form-select form-select-sm" style={{ maxWidth:150 }} value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
                <option value="all">All Status</option>
                {Object.entries(STATUS_CONFIG).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
              </select>
              <select className="form-select form-select-sm" style={{ maxWidth:200 }} value={filterDept} onChange={e=>setFilterDept(e.target.value)}>
                <option value="all">All Departments</option>
                {DEPARTMENTS.filter(d=>d!=="all").map(d=><option key={d} value={d}>{d}</option>)}
              </select>
              <span className="text-muted ms-auto" style={{ fontSize:12 }}>{filteredRecords.length} records</span>
              {loading && <div className="spinner-border spinner-border-sm text-primary"/>}
            </div>
          </div>

          {filteredRecords.length === 0 ? (
            <div className="text-center py-5">
              <BookOpen size={40} className="text-muted mb-3"/>
              <p className="text-muted">No training records found.</p>
              <button className="btn btn-primary btn-sm mt-2" onClick={()=>setModal("assign")}>
                <Plus size={13}/> Assign First Training
              </button>
            </div>
          ) : (
            <div className="card border-0 shadow-sm" style={{ borderRadius:12, overflow:"hidden" }}>
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0" style={{ fontSize:13 }}>
                  <thead className="table-light">
                    <tr>
                      <th>Employee</th>
                      <th>Program</th>
                      <th>Level/Type</th>
                      <th>Status</th>
                      <th>Score</th>
                      <th>Cert</th>
                      <th>Due Date</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.map(r=>{
                      const st  = STATUS_CONFIG[r.status] || STATUS_CONFIG.pending;
                      const typ = TYPE_CONFIG[r.programId?.type] || TYPE_CONFIG.job_role;
                      const lvl = LEVEL_CONFIG[r.programId?.level];
                      const isOverdue = r.dueDate && new Date(r.dueDate) < new Date() && r.status !== "completed";
                      return (
                        <tr key={r._id}>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <div style={{ width:30, height:30, borderRadius:"50%", background:"#eff6ff", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, color:"#3b82f6", fontSize:12, flexShrink:0 }}>
                                {r.employeeId?.name?.charAt(0)}
                              </div>
                              <div>
                                <p className="mb-0 fw-bold" style={{ fontSize:13 }}>{r.employeeId?.name}</p>
                                <p className="mb-0 text-muted" style={{ fontSize:11 }}>{r.employeeId?.department}</p>
                              </div>
                            </div>
                          </td>
                          <td>
                            <p className="mb-0 fw-semibold" style={{ fontSize:12 }}>{r.programId?.title}</p>
                            <p className="mb-0 text-muted" style={{ fontSize:11 }}>{r.programId?.duration}</p>
                          </td>
                          <td>
                            <div className="d-flex flex-column gap-1">
                              {lvl && <span className="badge" style={{ background:lvl.color, fontSize:10 }}>{r.programId?.level}</span>}
                              <span className="badge" style={{ background:typ.bg, color:typ.color, fontSize:10 }}>{typ.label}</span>
                            </div>
                          </td>
                          <td>
                            <span className="badge" style={{ background:st.bg, color:st.color, border:`1px solid ${st.color}33`, fontSize:11 }}>
                              {isOverdue && r.status!=="completed" ? "Overdue" : st.label}
                            </span>
                          </td>
                          <td>
                            {r.assessmentScore !== null && r.assessmentScore !== undefined ? (
                              <span style={{ fontSize:13, fontWeight:700, color:r.assessmentScore>=80?"#10b981":"#ef4444" }}>
                                {r.assessmentScore}%
                              </span>
                            ) : <span className="text-muted" style={{ fontSize:11 }}>—</span>}
                          </td>
                          <td>
                            {r.certificationIssued
                              ? <span style={{ color:"#10b981" }}><Award size={14}/></span>
                              : <span className="text-muted" style={{ fontSize:11 }}>—</span>}
                          </td>
                          <td className="text-muted" style={{ fontSize:11 }}>
                            {r.dueDate ? (
                              <span style={{ color:isOverdue?"#ef4444":"inherit" }}>
                                {new Date(r.dueDate).toLocaleDateString("en-IN")}
                              </span>
                            ) : "—"}
                          </td>
                          <td>
                            <button className="btn btn-sm btn-outline-primary py-0 px-2" style={{ fontSize:11 }}
                              onClick={()=>{ setSelectedRecord(r); setModal("update"); }}>
                              Update
                            </button>
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
      )}

      {/* ══ COMPLIANCE LOG TAB ═══════════════════════════════════ */}
      {activeTab === "compliance" && (
        <div>
          <div className="d-flex align-items-center gap-2 mb-3">
            <FileText size={16} color="#3b82f6" />
            <p className="mb-0 fw-bold" style={{ fontSize:14 }}>Training Compliance Log (HRF–TR–01)</p>
          </div>
          <div className="alert d-flex align-items-start gap-2 mb-3" style={{ background:"#eff6ff", border:"1px solid #bfdbfe", borderRadius:10, fontSize:12 }}>
            <Info size={14} color="#3b82f6" style={{ flexShrink:0, marginTop:1 }}/>
            <p className="mb-0" style={{ color:"#1e40af" }}>
              All trainings are tracked via RCA (Radnus Corporate Academy). HR will maintain this compliance log with completion reports. Managers must ensure 100% training compliance before confirming employee probation or promotion.
            </p>
          </div>
          {compLog.length === 0 ? (
            <div className="text-center py-5"><FileText size={36} className="text-muted mb-3"/><p className="text-muted">No compliance logs yet.</p></div>
          ) : (
            <div className="card border-0 shadow-sm" style={{ borderRadius:12, overflow:"hidden" }}>
              <div className="table-responsive">
                <table className="table table-sm align-middle mb-0" style={{ fontSize:13 }}>
                  <thead className="table-light">
                    <tr><th>Date</th><th>Employee</th><th>Program</th><th>Action</th><th>Note</th><th>By</th></tr>
                  </thead>
                  <tbody>
                    {compLog.map((l,i)=>{
                      const actionColor = {
                        assigned:"#3b82f6", started:"#f59e0b", completed:"#10b981",
                        overdue:"#ef4444", score_updated:"#8b5cf6", cert_issued:"#10b981", waived:"#6b7280"
                      }[l.action] || "#6b7280";
                      return (
                        <tr key={i}>
                          <td className="text-muted" style={{ fontSize:11 }}>{new Date(l.date).toLocaleDateString("en-IN")}</td>
                          <td>
                            <p className="mb-0 fw-semibold" style={{ fontSize:12 }}>{l.employeeId?.name}</p>
                            <p className="mb-0 text-muted" style={{ fontSize:11 }}>{l.employeeId?.department}</p>
                          </td>
                          <td className="text-muted" style={{ fontSize:12 }}>{l.programTitle || "—"}</td>
                          <td><span className="badge" style={{ background:`${actionColor}20`, color:actionColor, fontSize:11 }}>{l.action?.replace("_"," ")}</span></td>
                          <td className="text-muted" style={{ fontSize:11 }}>{l.note || "—"}</td>
                          <td className="text-muted" style={{ fontSize:11 }}>{l.addedBy}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ KPI TAB ══════════════════════════════════════════════ */}
      {activeTab === "kpi" && (
        <div>
          <p className="fw-bold mb-3" style={{ fontSize:14 }}>Performance Indicators (KPIs) — Policy 3.15</p>
          <div className="row g-3 mb-4">
            {[
              { kpi:"Training Completion Rate",                    target:"≥ 95%",             freq:"Quarterly",  current:`${stats?.completionRate||0}%`,  pass:(stats?.completionRate||0)>=95 },
              { kpi:"Post-Training Assessment Score",              target:"≥ 80%",             freq:"Monthly",    current:`${stats?.avgScore||0}%`,          pass:(stats?.avgScore||0)>=80 },
              { kpi:"New Hire Certification Completion",           target:"100% within 30 days",freq:"Ongoing",  current:`${stats?.certified||0} certified`, pass:true },
              { kpi:"Cross-Functional Certification Rate",         target:"≥ 60%",             freq:"Half-Yearly",current:"—",                               pass:null },
              { kpi:"Leadership Readiness (Internal Promotion)",   target:"≥ 20%",             freq:"Annual",     current:"—",                               pass:null },
            ].map((k,i)=>(
              <div key={i} className="col-md-6">
                <div className="card border-0 shadow-sm" style={{ borderRadius:12, borderLeft:`4px solid ${k.pass===null?"#e5e7eb":k.pass?"#10b981":"#ef4444"}` }}>
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start">
                      <p className="mb-0 fw-bold" style={{ fontSize:13 }}>{k.kpi}</p>
                      {k.pass !== null && (
                        <span style={{ color:k.pass?"#10b981":"#ef4444" }}>
                          {k.pass ? <CheckCircle2 size={16}/> : <AlertTriangle size={16}/>}
                        </span>
                      )}
                    </div>
                    <div className="d-flex gap-3 mt-2" style={{ fontSize:12 }}>
                      <span className="text-muted">Target: <strong>{k.target}</strong></span>
                      <span className="text-muted">·</span>
                      <span className="text-muted">{k.freq}</span>
                    </div>
                    <p className="mb-0 mt-1" style={{ fontSize:13, fontWeight:700, color:k.pass===null?"#6b7280":k.pass?"#10b981":"#ef4444" }}>
                      Current: {k.current}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Dept completion breakdown */}
          {stats?.byDept?.length > 0 && (
            <div className="card border-0 shadow-sm" style={{ borderRadius:12 }}>
              <div className="card-body">
                <p className="fw-bold mb-3" style={{ fontSize:14 }}>Department-wise Completion</p>
                <div className="d-flex flex-column gap-3">
                  {stats.byDept.map((d,i)=>{
                    const rate = d.total > 0 ? Math.round((d.completed/d.total)*100) : 0;
                    return (
                      <div key={i}>
                        <div className="d-flex justify-content-between mb-1">
                          <span style={{ fontSize:13 }}>{d._id || "Unknown"}</span>
                          <span style={{ fontSize:13, fontWeight:700 }}>{d.completed}/{d.total} ({rate}%)</span>
                        </div>
                        <div style={{ height:8, background:"#f3f4f6", borderRadius:4 }}>
                          <div style={{ height:8, background:rate>=95?"#10b981":rate>=70?"#f59e0b":"#ef4444", borderRadius:4, width:`${rate}%`, transition:"width .3s" }}/>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}