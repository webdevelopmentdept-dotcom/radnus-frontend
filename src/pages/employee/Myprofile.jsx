import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Camera, Save, Lock, Eye, EyeOff,
  Briefcase, MapPin, Calendar, Hash,
  CheckCircle, Clock, User, Building,
  ShieldCheck, Pencil, Award, UserCircle,
  KeyRound, ChevronRight, AlertTriangle
} from "lucide-react";
import EmployeeLayout from "./EmployeeLayout";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const BGR_META = {
  Build:  { color: "#059669", bg: "#d1fae5", border: "#6ee7b7" },
  Grow:   { color: "#2563eb", bg: "#dbeafe", border: "#93c5fd" },
  Retain: { color: "#d97706", bg: "#fef3c7", border: "#fcd34d" },
};

export default function MyProfile() {
  const [employee,       setEmployee]       = useState(null);
  const [activation,     setActivation]     = useState(null);
  const [gradeInfo,      setGradeInfo]      = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [saving,         setSaving]         = useState(false);
  const [activeTab,      setActiveTab]      = useState("personal");
  const [toast,          setToast]          = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [resolvedEmpCode, setResolvedEmpCode] = useState("");

  const [personalForm, setPersonalForm] = useState({ name:"", email:"", mobile:"", dob:"", address:"" });
  const [pwForm,   setPwForm]   = useState({ current:"", newPw:"", confirm:"" });
  const [showPw,   setShowPw]   = useState({ current:false, newPw:false, confirm:false });
  const [pwSaving, setPwSaving] = useState(false);

  const empId = localStorage.getItem("employeeId");

  useEffect(() => {
    if (!empId) { window.location.href = "/login"; return; }
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const empRes = await axios.get(`${API_BASE}/api/employee/me/${empId}`);
      const emp = empRes.data;

      let mergedEmp = { ...emp };
      let finalEmpCode = emp.employeeId || "";

      try {
        const hrRes = await axios.get(`${API_BASE}/api/hr/employees`);
        const hrList = Array.isArray(hrRes.data) ? hrRes.data : hrRes.data?.data || [];
        const matched = hrList.find(e => e._id === empId);
        finalEmpCode = matched?.employeeId || emp.employeeId || "";
        mergedEmp = { ...emp, employeeId: finalEmpCode };
      } catch {
        finalEmpCode = emp.employeeId || "";
        mergedEmp = { ...emp, employeeId: finalEmpCode };
      }

      setEmployee(mergedEmp);
      setResolvedEmpCode(finalEmpCode);
      setPersonalForm({
        name:    mergedEmp.name    || "",
        email:   mergedEmp.email   || "",
        mobile:  mergedEmp.mobile  || "",
        dob:     mergedEmp.dob     || "",
        address: mergedEmp.address || "",
      });

      try {
        const actRes = await axios.get(`${API_BASE}/api/hr/activation/${empId}`);
        if (actRes.data.success && actRes.data.data) setActivation(actRes.data.data);
      } catch (_) {}

      try {
        const gRes = await axios.get(`${API_BASE}/api/assign-grade/employee/${empId}`);
        if (gRes.data.success && gRes.data.data?.grade_id) {
          setGradeInfo(gRes.data.data.grade_id);
        } else {
          throw new Error("no data");
        }
      } catch {
        try {
          const gAllRes = await axios.get(`${API_BASE}/api/assign-grade`);
          const gData   = gAllRes.data;
          const list    = gData.success
            ? (Array.isArray(gData.data) ? gData.data : [gData.data])
            : (Array.isArray(gData) ? gData : []);
          const match = list.find(a => {
            const eid = a.employee_id?._id || a.employee_id;
            return eid === empId;
          });
          if (match?.grade_id) setGradeInfo(match.grade_id);
        } catch (_) {}
      }

    } catch (err) { console.log(err); }
    finally { setLoading(false); }
  };

  const showToast = (msg, type="success") => {
    setToast({msg,type}); setTimeout(()=>setToast(null),3200);
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    setUploadingPhoto(true);
    try {
      const fd = new FormData(); fd.append("file",file); fd.append("employeeId",empId);
      await axios.post(`${API_BASE}/api/employee/upload-profile`, fd);
      await fetchAll(); showToast("Profile photo updated");
    } catch { showToast("Upload failed","error"); }
    finally { setUploadingPhoto(false); }
  };

  const handleSavePersonal = async () => {
    if (!personalForm.name || !personalForm.email) return showToast("Name and Email required","error");
    setSaving(true);
    try {
      await axios.put(`${API_BASE}/api/employee/update-profile`, {employeeId:empId,...personalForm});
      await fetchAll(); showToast("Profile updated successfully");
    } catch { showToast("Save failed","error"); }
    finally { setSaving(false); }
  };

  const handleChangePassword = async () => {
    if (!pwForm.current||!pwForm.newPw||!pwForm.confirm) return showToast("All fields required","error");
    if (pwForm.newPw.length<6) return showToast("Password must be at least 6 characters","error");
    if (pwForm.newPw!==pwForm.confirm) return showToast("Passwords do not match","error");
    setPwSaving(true);
    try {
      await axios.put(`${API_BASE}/api/employee/change-password`, {
        employeeId:empId, currentPassword:pwForm.current, newPassword:pwForm.newPw
      });
      setPwForm({current:"",newPw:"",confirm:""}); showToast("Password changed successfully");
    } catch(err) { showToast(err.response?.data?.message||"Failed to change password","error"); }
    finally { setPwSaving(false); }
  };

  const emp     = activation?.employment || {};
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-IN") : "—";
  const isApproved = employee?.status==="approved"||employee?.status==="active";
  const isRejected = employee?.status==="rejected";

  const pwStrength = (pw) => {
    if(!pw) return 0; let s=0;
    if(pw.length>=6) s++; if(pw.length>=8) s++;
    if(/[A-Z]/.test(pw)||/[0-9]/.test(pw)) s++;
    if(/[^a-zA-Z0-9]/.test(pw)) s++; return s;
  };
  const strength      = pwStrength(pwForm.newPw);
  const strengthLabel = ["","Weak","Fair","Good","Strong"][strength];
  const strengthColor = ["","#ef4444","#f97316","#eab308","#22c55e"][strength];

  if (loading) return (
    <div style={{display:"flex",justifyContent:"center",alignItems:"center",height:"100vh",background:"#f4f6fb"}}>
      <div style={{width:36,height:36,border:"3px solid #e8eaf0",borderTopColor:"#6366f1",borderRadius:"50%",animation:"_spin .7s linear infinite"}}/>
      <style>{`@keyframes _spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const avatarUrl = (size) => employee?.profileImage ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(employee?.name||"U")}&background=6366f1&color=fff&size=${size}`;

  const TABS = [
    {id:"personal",   icon:<UserCircle size={15}/>, label:"Personal Info"},
    {id:"employment", icon:<Briefcase size={15}/>,  label:"Employment"},
    {id:"password",   icon:<KeyRound size={15}/>,   label:"Security"},
  ];

  const GradeBadge = () => {
    if (!gradeInfo) return <span style={{color:"#d1d5db",fontStyle:"italic",fontSize:13}}>Not assigned yet</span>;
    const meta = BGR_META[gradeInfo.bgr_stage] || BGR_META.Build;
    return (
      <div style={{display:"flex",alignItems:"center",gap:7,flexWrap:"wrap"}}>
        <span style={{background:"#1a1a2e",color:"#fff",padding:"2px 9px",borderRadius:6,fontSize:12,fontWeight:800}}>
          {gradeInfo.level}
        </span>
        <span style={{fontWeight:700,color:"#1a1d2e",fontSize:13}}>{gradeInfo.designation}</span>
        {gradeInfo.bgr_stage && (
          <span style={{background:meta.bg,color:meta.color,border:`1px solid ${meta.border}`,padding:"2px 9px",borderRadius:20,fontSize:11,fontWeight:700}}>
            {gradeInfo.bgr_stage}
          </span>
        )}
      </div>
    );
  };

  const EMP_ROWS = [
    {
      icon:<Hash size={14}/>,
      label:"Employee ID",
      value: resolvedEmpCode || emp.employee_code || "—",
    },
    {icon:<Briefcase size={14}/>,   label:"Designation",       value:emp.designation||employee?.designation||"—"},
    {icon:<Building size={14}/>,    label:"Department",        value:emp.department||employee?.department||"—"},
    {icon:<Award size={14}/>,       label:"Grade Level",       value:<GradeBadge/>, isJSX:true},
    {icon:<Briefcase size={14}/>,   label:"Employment Type",   value:emp.employment_type||"—"},
    {icon:<MapPin size={14}/>,      label:"Work Location",     value:emp.work_location||"—"},
    {icon:<Clock size={14}/>,       label:"Work Shift",        value:emp.work_shift||"—"},
    {icon:<Calendar size={14}/>,    label:"Date of Joining",   value:fmtDate(emp.date_of_joining)},
    {icon:<Calendar size={14}/>,    label:"Confirmation Date", value:fmtDate(emp.confirmation_date)},
    {icon:<User size={14}/>,        label:"Reporting Manager", value:emp.reporting_manager||"—"},
    {icon:<CheckCircle size={14}/>, label:"Account Status",    value:isApproved?"Active":employee?.status||"—"},
  ];

  const statusColor = isApproved ? "#16a34a" : isRejected ? "#dc2626" : "#d97706";
  const statusBg    = isApproved ? "#f0fdf4" : isRejected ? "#fef2f2" : "#fffbeb";
  const statusBorder= isApproved ? "#bbf7d0" : isRejected ? "#fecaca" : "#fde68a";
  const statusLabel = isApproved ? "Active"  : isRejected ? "Rejected" : "Pending";

  return (
    <EmployeeLayout employee={employee}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        .mp * { box-sizing: border-box; }
        .mp { font-family:'Inter',sans-serif; background:#f4f6fb; min-height:100vh; color:#1a1d2e; }

        /* ── Topbar ── */
        .mp-top { background:#fff; border-bottom:1px solid #eaecf4; height:56px; padding:0 28px; display:flex; align-items:center; gap:10px; position:sticky; top:0; z-index:40; }
        .mp-top-title { font-size:14px; font-weight:700; color:#1a1d2e; flex:1; }
        .mp-top-av { width:32px; height:32px; border-radius:8px; overflow:hidden; border:1.5px solid #e4e6f0; }
        .mp-top-av img { width:100%; height:100%; object-fit:cover; }

        /* ── Hero ── */
        .mp-hero { background:#1e2235; padding:28px 32px; display:flex; align-items:center; gap:24px; flex-wrap:wrap; position:relative; overflow:hidden; }
        .mp-hero-glow1 { position:absolute; top:-80px; right:-60px; width:280px; height:280px; border-radius:50%; background:rgba(99,102,241,.12); pointer-events:none; }
        .mp-hero-glow2 { position:absolute; bottom:-70px; left:25%; width:200px; height:200px; border-radius:50%; background:rgba(139,92,246,.08); pointer-events:none; }

        /* ── Photo ── */
        .mp-photo-ring { position:relative; flex-shrink:0; z-index:1; width:84px; height:84px; }
        .mp-photo-ring-border { position:absolute; inset:0; border-radius:50%; border:2.5px solid #6366f1; z-index:0; }
        .mp-photo-img { position:relative; z-index:1; width:76px; height:76px; border-radius:50%; object-fit:cover; border:3px solid #1e2235; display:block; margin:4px; }
        .mp-photo-overlay { position:absolute; inset:4px; border-radius:50%; z-index:2; background:rgba(0,0,0,.55); display:flex; flex-direction:column; align-items:center; justify-content:center; cursor:pointer; color:#fff; opacity:0; transition:opacity .2s; }
        .mp-photo-ring:hover .mp-photo-overlay { opacity:1; }
        .mp-overlay-text { font-size:9px; font-weight:600; margin-top:3px; letter-spacing:0.2px; }

        /* ── Hero Info ── */
        .mp-hero-info { flex:1; min-width:0; z-index:1; }
        .mp-hero-name { margin:0 0 5px; font-size:22px; font-weight:800; color:#fff; letter-spacing:-0.5px; line-height:1.1; }
        .mp-hero-meta { display:flex; align-items:center; gap:6px; font-size:12px; color:rgba(255,255,255,.5); font-weight:500; margin-bottom:3px; }
        .mp-hero-chips { display:flex; align-items:center; gap:8px; margin-top:10px; flex-wrap:wrap; }
        .mp-hero-chip { display:inline-flex; align-items:center; gap:6px; background:rgba(255,255,255,.07); border:1px solid rgba(255,255,255,.12); border-radius:8px; padding:5px 10px; }
        .mp-chip-label { font-size:9px; color:rgba(255,255,255,.35); font-weight:700; text-transform:uppercase; letter-spacing:0.6px; }
        .mp-chip-val   { font-size:12px; color:#fff; font-weight:700; font-family:monospace; }
        .mp-hero-grade-chip { display:inline-flex; align-items:center; gap:6px; background:rgba(255,255,255,.07); border:1px solid rgba(255,255,255,.12); border-radius:8px; padding:5px 10px; }
        .mp-status-pill { display:inline-flex; align-items:center; gap:6px; border-radius:99px; padding:6px 14px; font-size:12px; font-weight:700; z-index:1; flex-shrink:0; border:1px solid; }
        .mp-status-dot { width:6px; height:6px; border-radius:50%; }

        /* ── Content ── */
        .mp-content { padding:24px 28px; display:flex; flex-direction:column; gap:18px; align-items:stretch; max-width:920px; margin:0 auto; width:100%; }

        /* ── Tabs ── */
        .mp-tabbar { display:inline-flex; gap:2px; background:#fff; border-radius:12px; border:1px solid #eaecf4; padding:4px; box-shadow:0 1px 4px rgba(0,0,0,.04); }
        .mp-tab-btn { display:flex; align-items:center; gap:7px; padding:9px 18px; border:none; border-radius:8px; cursor:pointer; font-family:'Inter',sans-serif; font-size:13px; font-weight:600; transition:all .18s; white-space:nowrap; }
        .mp-tab-btn.on { background:#6366f1; color:#fff; box-shadow:0 3px 10px rgba(99,102,241,.3); }
        .mp-tab-btn:not(.on) { background:transparent; color:#6b7280; }
        .mp-tab-btn:not(.on):hover { background:#f4f6fb; color:#374151; }

        /* ── Card ── */
        .mp-card { background:#fff; border-radius:14px; border:1px solid #eaecf4; overflow:hidden; box-shadow:0 1px 8px rgba(0,0,0,.04); width:100%; max-width:860px; }
        .mp-card-head { padding:16px 22px; border-bottom:1px solid #f3f4f9; display:flex; align-items:center; gap:12px; }
        .mp-card-icon { width:36px; height:36px; border-radius:9px; background:#6366f1; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .mp-card-icon.dark { background:#1e2235; }
        .mp-card-head h4 { margin:0 0 2px; font-size:14px; font-weight:700; color:#1a1d2e; }
        .mp-card-head p  { margin:0; font-size:12px; color:#9ca3af; }

        /* ── Form ── */
        .mp-form-body  { padding:22px; }
        .mp-form-grid  { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px; }
        .mp-field-label { display:block; font-size:11px; font-weight:700; color:#6b7280; margin-bottom:6px; letter-spacing:0.3px; text-transform:uppercase; }
        .mp-field-input { width:100%; padding:10px 13px; border:1.5px solid #e8eaf0; border-radius:9px; font-size:13px; color:#1a1d2e; background:#fafbfd; outline:none; font-family:'Inter',sans-serif; transition:border-color .15s,box-shadow .15s; }
        .mp-field-input:focus { border-color:#6366f1; box-shadow:0 0 0 3px rgba(99,102,241,.1); background:#fff; }

        /* ── Emp ID badge in form ── */
        .mp-empid-badge { display:flex; align-items:center; justify-content:space-between; background:#f5f5ff; border:1.5px solid #e0e0fe; border-radius:10px; padding:11px 15px; margin-bottom:18px; }
        .mp-empid-badge-label { font-size:11px; font-weight:700; color:#6366f1; text-transform:uppercase; letter-spacing:0.5px; }
        .mp-empid-badge-val { background:#1a1a2e; color:#fff; padding:"3px 14px"; border-radius:7px; font-size:13px; font-weight:800; font-family:monospace; letter-spacing:0.4px; }

        /* ── Employment rows ── */
        .mp-emp-row { display:flex; align-items:center; justify-content:space-between; padding:13px 22px; border-bottom:1px solid #f4f5fb; transition:background .15s; }
        .mp-emp-row:last-child { border-bottom:none; }
        .mp-emp-row:hover { background:#fafbfd; }
        .mp-emp-row.is-grade { background:#f8f7ff; border-left:3px solid #6366f1; }
        .mp-emp-row.is-grade:hover { background:#f0effe; }
        .mp-emp-row.is-empid { background:#f0f9ff; border-left:3px solid #2563eb; }
        .mp-emp-row.is-empid:hover { background:#e0f2fe; }
        .mp-emp-lhs { display:flex; align-items:center; gap:9px; font-size:13px; color:#6b7280; font-weight:500; }
        .mp-emp-lhs-icon { width:26px; height:26px; border-radius:7px; background:#f0f0fe; display:flex; align-items:center; justify-content:center; color:#6366f1; flex-shrink:0; }
        .mp-emp-val { font-size:13px; font-weight:600; color:#1a1d2e; }

        /* ── Password ── */
        .mp-pw-wrap { position:relative; }
        .mp-pw-wrap .mp-field-input { padding-right:44px; }
        .mp-eye { position:absolute; right:12px; top:50%; transform:translateY(-50%); background:none; border:none; cursor:pointer; color:#9ca3af; padding:0; display:flex; align-items:center; }
        .mp-bars { display:flex; gap:4px; margin-bottom:5px; }
        .mp-bar  { flex:1; height:3.5px; border-radius:99px; transition:background .3s; }

        /* ── Buttons ── */
        .mp-save-btn { display:inline-flex; align-items:center; gap:8px; padding:10px 22px; border:none; border-radius:9px; background:#6366f1; color:#fff; font-weight:700; font-size:13px; cursor:pointer; font-family:'Inter',sans-serif; box-shadow:0 3px 10px rgba(99,102,241,.3); transition:opacity .15s,transform .12s; }
        .mp-save-btn:hover   { opacity:.9; transform:translateY(-1px); }
        .mp-save-btn:active  { transform:translateY(0); }
        .mp-save-btn:disabled{ opacity:.55; cursor:not-allowed; transform:none; }
        .mp-sec-btn { background:#1e2235; box-shadow:0 3px 10px rgba(0,0,0,.15); }

        /* ── Toast ── */
        .mp-toast { position:fixed; top:16px; right:20px; z-index:9999; padding:12px 20px; border-radius:10px; color:#fff; font-weight:600; font-size:13px; box-shadow:0 6px 20px rgba(0,0,0,.15); animation:_tin .22s ease; display:flex; align-items:center; gap:8px; }
        @keyframes _tin { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes _spin { to{transform:rotate(360deg)} }

        /* ── Spinner ── */
        .mp-spinner { width:16px; height:16px; border:2px solid rgba(255,255,255,.3); border-top-color:#fff; border-radius:50%; animation:_spin .7s linear infinite; }

        /* ── Media queries ── */
        @media (max-width:900px) {
          .mp-content { padding:18px 20px; max-width:100%; }
          .mp-hero    { padding:22px 20px; }
        }
        @media (max-width:640px) {
          .mp-top      { padding:0 14px; height:50px; }
          .mp-top-title{ font-size:13px; }
          .mp-hero     { padding:16px 14px; gap:12px; }
          .mp-hero-name{ font-size:18px; }
          .mp-photo-ring { width:68px; height:68px; }
          .mp-photo-img  { width:60px; height:60px; margin:4px; }
          .mp-hero-chips { gap:6px; margin-top:8px; }
          .mp-hero-chip  { padding:4px 8px; }
          .mp-content    { padding:12px 12px; gap:12px; }
          .mp-tabbar     { width:100%; }
          .mp-tab-btn    { flex:1; justify-content:center; padding:8px 8px; font-size:11.5px; gap:5px; }
          .mp-card       { max-width:100%; border-radius:12px; }
          .mp-form-grid  { grid-template-columns:1fr; gap:12px; }
          .mp-form-body  { padding:14px; }
          .mp-card-head  { padding:13px 14px; }
          .mp-emp-row    { padding:11px 14px; flex-direction:column; align-items:flex-start; gap:4px; }
          .mp-emp-row.is-grade { border-left-width:2px; }
          .mp-emp-row.is-empid { border-left-width:2px; }
          .mp-toast { left:12px; right:12px; top:12px; }
          .mp-save-btn { width:100%; justify-content:center; }
          .mp-status-pill { padding:5px 11px; font-size:11px; }
        }
        @media (max-width:380px) {
          .mp-tab-btn  { font-size:10.5px; padding:8px 5px; gap:4px; }
          .mp-hero-name{ font-size:16px; }
        }
      `}</style>

      <div className="mp">
        {toast && (
          <div className="mp-toast" style={{background:toast.type==="error"?"#dc2626":"#16a34a"}}>
            {toast.type==="error"
              ? <AlertTriangle size={15}/>
              : <CheckCircle size={15}/>}
            {toast.msg}
          </div>
        )}

        {/* ── Topbar ── */}
        <div className="mp-top">
          <span className="mp-top-title">My Profile</span>
          <div className="mp-top-av"><img src={avatarUrl(34)} alt="avatar"/></div>
        </div>

        {/* ── Hero ── */}
        <div className="mp-hero">
          <div className="mp-hero-glow1"/>
          <div className="mp-hero-glow2"/>

          <div className="mp-photo-ring">
            <div className="mp-photo-ring-border"/>
            <img className="mp-photo-img" src={avatarUrl(76)} alt="profile"/>
            <label className="mp-photo-overlay">
              {uploadingPhoto
                ? <div className="mp-spinner"/>
                : <Camera size={17}/>}
              <span className="mp-overlay-text">{uploadingPhoto ? "Uploading" : "Change"}</span>
              <input type="file" accept="image/*" style={{display:"none"}} onChange={handlePhotoUpload}/>
            </label>
          </div>

          <div className="mp-hero-info">
            <p className="mp-hero-name">{employee?.name}</p>
            <p className="mp-hero-meta"><Briefcase size={12}/>{emp.designation||employee?.designation||"—"}</p>
            <p className="mp-hero-meta"><Building size={12}/>{emp.department||employee?.department||"—"}</p>

            <div className="mp-hero-chips">
              {resolvedEmpCode && (
                <div className="mp-hero-chip">
                  <Hash size={11} color="rgba(255,255,255,.35)"/>
                  <span className="mp-chip-label">EMP ID</span>
                  <span className="mp-chip-val">{resolvedEmpCode}</span>
                </div>
              )}

              {gradeInfo && (() => {
                const meta = BGR_META[gradeInfo.bgr_stage] || BGR_META.Build;
                return (
                  <div className="mp-hero-grade-chip">
                    <Award size={11} color="rgba(255,255,255,.35)"/>
                    <span style={{background:"rgba(255,255,255,.15)",color:"#fff",padding:"1px 7px",borderRadius:5,fontSize:11,fontWeight:800}}>{gradeInfo.level}</span>
                    <span style={{fontSize:11,color:"rgba(255,255,255,.7)",fontWeight:600}}>{gradeInfo.designation}</span>
                    <span style={{background:meta.bg,color:meta.color,padding:"1px 7px",borderRadius:10,fontSize:10,fontWeight:700}}>{gradeInfo.bgr_stage}</span>
                  </div>
                );
              })()}
            </div>
          </div>

          <div className="mp-status-pill" style={{
            background: isApproved?"rgba(22,163,74,.12)":isRejected?"rgba(220,38,38,.12)":"rgba(217,119,6,.12)",
            color:       isApproved?"#86efac":isRejected?"#fca5a5":"#fde68a",
            borderColor: isApproved?"rgba(134,239,172,.2)":isRejected?"rgba(252,165,165,.2)":"rgba(253,230,138,.2)",
          }}>
            <span className="mp-status-dot" style={{background:isApproved?"#22c55e":isRejected?"#ef4444":"#f59e0b"}}/>
            {statusLabel}
          </div>
        </div>

        {/* ── Content ── */}
        <div className="mp-content">
          <div className="mp-tabbar">
            {TABS.map(t => (
              <button key={t.id} className={`mp-tab-btn ${activeTab===t.id?"on":""}`} onClick={()=>setActiveTab(t.id)}>
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>

          {/* ── Personal Info Tab ── */}
          {activeTab==="personal" && (
            <div className="mp-card">
              <div className="mp-card-head">
                <div className="mp-card-icon"><Pencil size={15} color="#fff"/></div>
                <div><h4>Personal Information</h4><p>Update your contact and personal details</p></div>
              </div>
              <div className="mp-form-body">
                {resolvedEmpCode && (
                  <div className="mp-empid-badge">
                    <span className="mp-empid-badge-label">Employee ID</span>
                    <span style={{background:"#1a1a2e",color:"#fff",padding:"3px 14px",borderRadius:7,fontSize:13,fontWeight:800,fontFamily:"monospace",letterSpacing:"0.4px"}}>
                      {resolvedEmpCode}
                    </span>
                  </div>
                )}

                <div className="mp-form-grid">
                  {[
                    {label:"Full Name",     key:"name",   type:"text",  ph:"Your full name"},
                    {label:"Email Address", key:"email",  type:"email", ph:"email@example.com"},
                    {label:"Mobile Number", key:"mobile", type:"text",  ph:"10-digit mobile"},
                    {label:"Date of Birth", key:"dob",    type:"date",  ph:""},
                  ].map(f => (
                    <div key={f.key}>
                      <label className="mp-field-label">{f.label}</label>
                      <input className="mp-field-input" type={f.type} value={personalForm[f.key]} placeholder={f.ph}
                        onChange={e=>setPersonalForm(p=>({...p,[f.key]:e.target.value}))}/>
                    </div>
                  ))}
                </div>
                <div style={{marginBottom:20}}>
                  <label className="mp-field-label">Address</label>
                  <textarea className="mp-field-input" rows={3} value={personalForm.address} style={{resize:"vertical"}}
                    placeholder="Your full address" onChange={e=>setPersonalForm(p=>({...p,address:e.target.value}))}/>
                </div>
                <button className="mp-save-btn" onClick={handleSavePersonal} disabled={saving}>
                  {saving ? <div className="mp-spinner"/> : <Save size={14}/>}
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          )}

          {/* ── Employment Info Tab ── */}
          {activeTab==="employment" && (
            <div className="mp-card">
              <div className="mp-card-head">
                <div className="mp-card-icon"><Briefcase size={15} color="#fff"/></div>
                <div><h4>Employment Details</h4><p>Set by HR · Read only</p></div>
              </div>
              <div style={{padding:"4px 0"}}>
                {EMP_ROWS.map((r,i) => (
                  <div
                    key={i}
                    className={`mp-emp-row${r.label==="Grade Level"?" is-grade":r.label==="Employee ID"?" is-empid":""}`}
                  >
                    <span className="mp-emp-lhs">
                      <span className="mp-emp-lhs-icon">{r.icon}</span>
                      {r.label}
                    </span>
                    {r.isJSX
                      ? <div>{r.value}</div>
                      : r.label === "Employee ID"
                        ? (
                          <span style={{
                            background: r.value !== "—" ? "#1a1a2e" : "transparent",
                            color: r.value !== "—" ? "#fff" : "#d1d5db",
                            padding: r.value !== "—" ? "3px 12px" : "0",
                            borderRadius: 7,
                            fontSize: 13,
                            fontWeight: 800,
                            fontFamily: "monospace",
                            letterSpacing: "0.4px",
                          }}>
                            {r.value}
                          </span>
                        )
                        : <span className="mp-emp-val">{r.value}</span>
                    }
                  </div>
                ))}
              </div>
              {!activation && (
                <div style={{padding:"13px 22px",background:"#fffbeb",borderTop:"1px solid #fde68a",display:"flex",alignItems:"center",gap:8}}>
                  <AlertTriangle size={14} color="#92400e"/>
                  <p style={{margin:0,fontSize:13,color:"#92400e"}}>
                    Employment details not set yet. HR will configure after activation.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── Security Tab ── */}
          {activeTab==="password" && (
            <div className="mp-card">
              <div className="mp-card-head">
                <div className="mp-card-icon dark"><ShieldCheck size={15} color="#fff"/></div>
                <div><h4>Change Password</h4><p>Keep your account secure with a strong password</p></div>
              </div>
              <div className="mp-form-body">
                {[
                  {key:"current", label:"Current Password", ph:"Enter current password"},
                  {key:"newPw",   label:"New Password",     ph:"At least 6 characters"},
                  {key:"confirm", label:"Confirm Password", ph:"Repeat new password"},
                ].map((f,i) => (
                  <div key={f.key} style={{marginBottom:i<2?14:0}}>
                    <label className="mp-field-label">{f.label}</label>
                    <div className="mp-pw-wrap">
                      <input className="mp-field-input" type={showPw[f.key]?"text":"password"}
                        value={pwForm[f.key]} placeholder={f.ph}
                        onChange={e=>setPwForm(p=>({...p,[f.key]:e.target.value}))}/>
                      <button className="mp-eye" onClick={()=>setShowPw(p=>({...p,[f.key]:!p[f.key]}))}>
                        {showPw[f.key] ? <EyeOff size={14}/> : <Eye size={14}/>}
                      </button>
                    </div>
                  </div>
                ))}

                {pwForm.newPw && (
                  <div style={{margin:"13px 0 4px"}}>
                    <div className="mp-bars">
                      {[1,2,3,4].map(i=>(
                        <div key={i} className="mp-bar" style={{background:strength>=i?strengthColor:"#e8eaf0"}}/>
                      ))}
                    </div>
                    <p style={{margin:0,fontSize:11,color:strength?strengthColor:"#9ca3af",fontWeight:600}}>{strengthLabel}</p>
                  </div>
                )}

                {pwForm.confirm && pwForm.newPw !== pwForm.confirm && (
                  <div style={{display:"flex",alignItems:"center",gap:6,marginTop:10}}>
                    <AlertTriangle size={13} color="#ef4444"/>
                    <p style={{margin:0,fontSize:12,color:"#ef4444",fontWeight:600}}>Passwords do not match</p>
                  </div>
                )}

                <div style={{marginTop:20}}>
                  <button className="mp-save-btn mp-sec-btn" onClick={handleChangePassword} disabled={pwSaving}>
                    {pwSaving ? <div className="mp-spinner"/> : <Lock size={14}/>}
                    {pwSaving ? "Changing..." : "Change Password"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </EmployeeLayout>
  );
}