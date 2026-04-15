import React, { useState, useEffect } from "react";
import axios from "axios";
import { TrendingUp, Users, BookOpen, Award, Info, CheckCircle, XCircle, RotateCcw } from "lucide-react";
import EmployeeLayout from "./EmployeeLayout";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const STAGE_CONFIG = {
  1:{ label:"Emerging Leader",  color:"#6366f1", bg:"#eef2ff", targetRole:"Sr. Executive → Asst. Manager", timeline:"1–2 yrs", focusAreas:["Operational excellence","Team handling","OKR ownership"] },
  2:{ label:"Managerial Leader", color:"#3b82f6", bg:"#eff6ff", targetRole:"Manager → Sr. Manager",        timeline:"2–3 yrs", focusAreas:["Strategic planning","Project ownership","Mentoring"] },
  3:{ label:"Business Leader",  color:"#10b981", bg:"#ecfdf5", targetRole:"GM → AVP",                     timeline:"3–5 yrs", focusAreas:["Cross-functional leadership","Financial acumen","Stakeholder management"] },
  4:{ label:"Strategic Leader", color:"#f59e0b", bg:"#fffbeb", targetRole:"VP → Director",                timeline:"3–5 yrs", focusAreas:["Company-wide impact","Innovation","Culture building"] },
  5:{ label:"Executive / CXO",  color:"#ef4444", bg:"#fef2f2", targetRole:"CXO",                          timeline:"2–4 yrs", focusAreas:["Visionary leadership","Board-level decision making"] },
};

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

function BoolRow({ label, value }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"5px 0", borderBottom:"1px solid #f9fafb" }}>
      <span style={{ fontSize:13, color:"#374151" }}>{label}</span>
      {value
        ? <span style={{ color:"#059669", fontSize:12, fontWeight:700, display:"flex", alignItems:"center", gap:4 }}><CheckCircle size={12}/> Yes</span>
        : <span style={{ color:"#9ca3af", fontSize:12, fontWeight:600, display:"flex", alignItems:"center", gap:4 }}><XCircle size={12}/> No</span>}
    </div>
  );
}

export default function EmployeeLeadershipTrack() {
  const [track,   setTrack]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const employeeId = localStorage.getItem("employeeId") || localStorage.getItem("employee_id");

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/leadership/employee/${employeeId}`);
        setTrack(res.data.data);
      } catch (e) {
        if (e?.response?.status === 404) setTrack(null);
        else setError(e?.response?.data?.message || "Failed to load");
      } finally { setLoading(false); }
    };
    if (employeeId) fetch();
    else { setError("Session expired."); setLoading(false); }
  }, [employeeId]);

  if (loading) return (
    <EmployeeLayout>
      <div style={{ display:"flex", justifyContent:"center", padding:60 }}>
        <div style={{ width:36, height:36, border:"4px solid #e5e7eb", borderTopColor:"#6366f1", borderRadius:"50%", animation:"spin .8s linear infinite" }}/>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </EmployeeLayout>
  );

  if (error) return (
    <EmployeeLayout>
      <div style={{ margin:24, padding:16, background:"#fef2f2", borderRadius:10, color:"#dc2626" }}>{error}</div>
    </EmployeeLayout>
  );

  // ── Not Enrolled ─────────────────────────────────────────────
  if (!track) return (
    <EmployeeLayout>
      <div style={{ fontFamily:"'Segoe UI',sans-serif", background:"#f4f6fb", minHeight:"100vh", padding:"40px 24px" }}>
        <div style={{ maxWidth:560, margin:"0 auto", textAlign:"center" }}>
          <div style={{ width:72, height:72, borderRadius:"50%", background:"#eef2ff", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px" }}>
            <TrendingUp size={32} color="#6366f1"/>
          </div>
          <h4 style={{ fontWeight:800, color:"#1a1a2e", marginBottom:8 }}>Not Yet Enrolled</h4>
          <p style={{ color:"#6b7280", fontSize:14, marginBottom:28 }}>
            You haven't been enrolled in the Leadership Track yet. Contact your HR team for more information.
          </p>
          <div style={{ background:"#fff", borderRadius:14, border:"1px solid #e5e7eb", padding:24, textAlign:"left" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
              <Info size={16} color="#6366f1"/>
              <p style={{ margin:0, fontWeight:700, fontSize:14, color:"#1a1a2e" }}>About Leadership Track (Policy 3.39)</p>
            </div>
            <p style={{ margin:"0 0 12px", fontSize:13, color:"#374151" }}>
              Radnus grooms high-potential employees into future leaders through a structured 5-stage track.
            </p>
            {Object.entries(STAGE_CONFIG).map(([s,c]) => (
              <div key={s} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0", borderBottom:"1px solid #f3f4f6" }}>
                <div style={{ width:28, height:28, borderRadius:"50%", background:c.bg, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, color:c.color, fontSize:12, flexShrink:0 }}>
                  {s}
                </div>
                <div>
                  <p style={{ margin:0, fontSize:13, fontWeight:600, color:"#1a1a2e" }}>{c.label}</p>
                  <p style={{ margin:0, fontSize:11, color:"#9ca3af" }}>{c.targetRole} · {c.timeline}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </EmployeeLayout>
  );

  // ── Enrolled ─────────────────────────────────────────────────
  const cfg = STAGE_CONFIG[track.stage] || STAGE_CONFIG[1];

  return (
    <EmployeeLayout>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ fontFamily:"'Segoe UI',sans-serif", background:"#f4f6fb", minHeight:"100vh", padding:"28px 24px" }}>
        <div style={{ maxWidth:1100, margin:"0 auto" }}>

          {/* Header */}
          <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:20 }}>
            <div style={{ width:46, height:46, borderRadius:12, background:"linear-gradient(135deg,#6366f1,#3b82f6)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <TrendingUp size={22} color="#fff"/>
            </div>
            <div>
              <h3 style={{ margin:0, fontWeight:800, fontSize:20, color:"#1a1a2e" }}>My Leadership Track</h3>
              <p style={{ margin:"2px 0 0", fontSize:12, color:"#6b7280" }}>Radnus Policy 3.39 — Grow with Radnus Leadership Track</p>
            </div>
          </div>

          {/* Stage Card */}
          <div style={{ background:"#fff", borderRadius:16, border:"1px solid #e5e7eb", padding:"22px 24px", marginBottom:20 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:12, marginBottom:20 }}>
              <div>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
                  <span style={{ background:cfg.bg, color:cfg.color, padding:"4px 14px", borderRadius:20, fontSize:13, fontWeight:700, border:`1px solid ${cfg.color}33` }}>
                    Stage {track.stage}: {cfg.label}
                  </span>
                  {track.isHiPo && (
                    <span style={{ background:"#fffbeb", color:"#d97706", padding:"4px 12px", borderRadius:20, fontSize:12, fontWeight:700, border:"1px solid #fde68a" }}>
                      ⭐ HiPo
                    </span>
                  )}
                </div>
                <p style={{ margin:0, fontSize:14, color:"#374151" }}>
                  Target: <strong>{cfg.targetRole}</strong> · Timeline: <strong>{cfg.timeline}</strong>
                </p>
              </div>
              <div style={{ textAlign:"right" }}>
                <p style={{ margin:0, fontSize:11, color:"#9ca3af", fontWeight:600 }}>ENROLLED</p>
                <p style={{ margin:0, fontSize:13, fontWeight:700, color:"#1a1a2e" }}>
                  {new Date(track.enrolledAt).toLocaleDateString("en-IN")}
                </p>
              </div>
            </div>

            {/* Progress Steps */}
            <div style={{ display:"flex", alignItems:"center" }}>
              {[1,2,3,4,5].map((s,i) => {
                const c    = STAGE_CONFIG[s];
                const done = s < track.stage;
                const curr = s === track.stage;
                return (
                  <React.Fragment key={s}>
                    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", flex:1 }}>
                      <div style={{ width:38, height:38, borderRadius:"50%", background:done?"#10b981":curr?c.color:"#e5e7eb", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:800, fontSize:14, border:`3px solid ${done?"#10b981":curr?c.color:"#e5e7eb"}` }}>
                        {done ? "✓" : s}
                      </div>
                      <p style={{ margin:"6px 0 0", fontSize:10, fontWeight:curr?700:500, color:curr?c.color:"#9ca3af", textAlign:"center" }}>{c.label}</p>
                    </div>
                    {i < 4 && <div style={{ flex:1, height:3, background:s < track.stage?"#10b981":"#e5e7eb", marginBottom:22 }}/>}
                  </React.Fragment>
                );
              })}
            </div>

            {/* Focus Areas */}
            <div style={{ marginTop:16, padding:"12px 16px", background:"#f8fafc", borderRadius:10 }}>
              <p style={{ margin:"0 0 8px", fontSize:12, fontWeight:700, color:"#6b7280" }}>CURRENT FOCUS AREAS</p>
              <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                {cfg.focusAreas.map((f,i) => (
                  <span key={i} style={{ background:cfg.bg, color:cfg.color, padding:"4px 12px", borderRadius:20, fontSize:12, fontWeight:600, border:`1px solid ${cfg.color}33` }}>
                    {f}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Info Banner */}
          <div style={{ background:"#eff6ff", border:"1px solid #bfdbfe", borderRadius:10, padding:"12px 16px", marginBottom:20, display:"flex", gap:10, fontSize:13, color:"#1e40af" }}>
            <Info size={15} color="#3b82f6" style={{ flexShrink:0 }}/>
            This is your confidential Leadership Track. Assessments are conducted bi-annually. Contact HR for any queries.
          </div>

          {/* Detail Grid */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(300px,1fr))", gap:16, marginBottom:16 }}>

            {/* Performance */}
            <SectionCard title="My Performance" icon={<TrendingUp size={15}/>} color="#10b981" bg="#ecfdf5">
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {[
                  ["OKR Score",       `${track.performance?.okrScore||0}%`,            "#10b981"],
                  ["Last Assessment", `${track.performance?.lastAssessmentScore||0}%`, "#3b82f6"],
                ].map(([l,v,c]) => (
                  <div key={l} style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <span style={{ fontSize:13, color:"#6b7280" }}>{l}</span>
                    <span style={{ fontSize:20, fontWeight:900, color:c }}>{v}</span>
                  </div>
                ))}
                {track.performance?.nextAssessmentDate && (
                  <div style={{ background:"#f0fdf4", borderRadius:8, padding:"8px 12px", marginTop:4 }}>
                    <p style={{ margin:0, fontSize:12, color:"#059669" }}>
                      📅 Next Assessment: <strong>{new Date(track.performance.nextAssessmentDate).toLocaleDateString("en-IN")}</strong>
                    </p>
                  </div>
                )}
                <BoolRow label="Promotion Eligible" value={track.performance?.promotionEligible}/>
              </div>
            </SectionCard>

            {/* Mentor */}
            <SectionCard title="My Mentor" icon={<Users size={15}/>} color="#3b82f6" bg="#eff6ff">
              {track.mentor?.name ? (
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                    <div style={{ width:40, height:40, borderRadius:"50%", background:"#eff6ff", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, color:"#3b82f6", fontSize:16 }}>
                      {track.mentor.name.charAt(0)}
                    </div>
                    <div>
                      <p style={{ margin:0, fontWeight:700, fontSize:14, color:"#1a1a2e" }}>{track.mentor.name}</p>
                      <p style={{ margin:0, fontSize:12, color:"#6b7280" }}>{track.mentor.designation}</p>
                    </div>
                  </div>
                  <div style={{ background:"#f0f9ff", borderRadius:8, padding:"8px 12px" }}>
                    <p style={{ margin:0, fontSize:12, color:"#0369a1" }}>
                      🗓️ Sessions: <strong>{track.mentor.sessionFreq}</strong>
                    </p>
                  </div>
                  {track.mentor?.notes && <p style={{ margin:0, fontSize:12, color:"#6b7280", fontStyle:"italic" }}>{track.mentor.notes}</p>}
                </div>
              ) : <p style={{ margin:0, fontSize:13, color:"#9ca3af" }}>Mentor not assigned yet.</p>}
            </SectionCard>

            {/* Skills */}
            <SectionCard title="Skill Programs" icon={<BookOpen size={15}/>} color="#8b5cf6" bg="#f5f3ff">
              {[
                ["Leadership Training",      track.skillPrograms?.leadershipTraining],
                ["Financial Management",     track.skillPrograms?.financialManagement],
                ["Innovation Program",       track.skillPrograms?.innovationProgram],
                ["People Management",        track.skillPrograms?.peopleManagement],
                ["Culture Immersion",        track.skillPrograms?.radnusCultureImmersion],
                ["Corporate Academy LMS",    track.skillPrograms?.corporateAcademyLMS],
                ["External Programs",        track.skillPrograms?.externalPrograms],
              ].map(([l,v]) => <BoolRow key={l} label={l} value={v}/>)}
            </SectionCard>

            {/* Recognition */}
            <SectionCard title="Recognition & Rewards" icon={<Award size={15}/>} color="#ef4444" bg="#fef2f2">
              {[
                ["ESOP Eligible",         track.recognition?.esopEligible],
                ["Impact Bonus Received", track.recognition?.impactBonusReceived],
                ["Public Recognition",    track.recognition?.publicRecognition],
                ["HiPo Talent Pool",      track.recognition?.hiPoTalentPool],
              ].map(([l,v]) => <BoolRow key={l} label={l} value={v}/>)}
              {track.recognition?.notes && (
                <p style={{ margin:"10px 0 0", fontSize:12, color:"#6b7280", fontStyle:"italic" }}>{track.recognition.notes}</p>
              )}
            </SectionCard>

            {/* Progress History */}
            {track.progressHistory?.length > 0 && (
              <SectionCard title="My Progress Timeline" icon={<RotateCcw size={15}/>} color="#6b7280" bg="#f3f4f6">
                <div style={{ display:"flex", flexDirection:"column", gap:10, maxHeight:220, overflowY:"auto" }}>
                  {[...track.progressHistory].reverse().map((h,i) => (
                    <div key={i} style={{ borderLeft:"3px solid #6366f1", paddingLeft:12 }}>
                      <p style={{ margin:0, fontSize:13, fontWeight:600, color:"#1a1a2e" }}>
                        {h.stageChanged ? `🚀 Stage ${h.fromStage} → ${h.toStage}` : "📝 Update"}
                      </p>
                      <p style={{ margin:"2px 0 0", fontSize:11, color:"#6b7280" }}>
                        {new Date(h.date).toLocaleDateString("en-IN")}
                      </p>
                      {h.notes && <p style={{ margin:"2px 0 0", fontSize:11, color:"#9ca3af" }}>{h.notes}</p>}
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}
          </div>

          {/* Footer */}
          <div style={{ background:"#fff", borderRadius:12, border:"1px solid #e5e7eb", padding:"14px 18px", display:"flex", alignItems:"center", gap:10 }}>
            <Info size={14} color="#9ca3af"/>
            <p style={{ margin:0, fontSize:12, color:"#9ca3af" }}>
              This track is confidential. For stage updates or queries, contact your HR team directly.
            </p>
          </div>

        </div>
      </div>
    </EmployeeLayout>
  );
}