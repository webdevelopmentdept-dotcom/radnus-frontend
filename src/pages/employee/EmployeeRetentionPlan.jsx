import React, { useState, useEffect } from "react";
import axios from "axios";
import EmployeeLayout from "./EmployeeLayout";
import {
  ShieldCheck, Banknote, TrendingUp, BookOpen,
  Clock, Award, Calendar, Info, CheckCircle, XCircle
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const STATUS_CONFIG = {
  draft:        { label:"Draft",        color:"#6b7280", bg:"#f3f4f6" },
  active:       { label:"Active",       color:"#10b981", bg:"#ecfdf5" },
  under_review: { label:"Under Review", color:"#f59e0b", bg:"#fffbeb" },
  closed:       { label:"Closed",       color:"#ef4444", bg:"#fef2f2" },
};

/* ── responsive hook ── */
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return isMobile;
}

function SectionCard({ title, icon, color, bg, children }) {
  return (
    <div style={{ background:"#fff", borderRadius:14, border:"1px solid #e5e7eb", overflow:"hidden" }}>
      <div style={{ padding:"13px 16px", borderBottom:"1px solid #f3f4f6", display:"flex", alignItems:"center", gap:10 }}>
        <div style={{ width:30, height:30, borderRadius:8, background:bg, display:"flex", alignItems:"center", justifyContent:"center", color, flexShrink:0 }}>
          {icon}
        </div>
        <p style={{ margin:0, fontWeight:700, fontSize:14, color:"#111827" }}>{title}</p>
      </div>
      <div style={{ padding:"13px 16px" }}>{children}</div>
    </div>
  );
}

function BoolRow({ label, value }) {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"6px 0", borderBottom:"1px solid #f9fafb" }}>
      <span style={{ fontSize:13, color:"#374151", flex:1, marginRight:8 }}>{label}</span>
      {value ? (
        <span style={{ display:"flex", alignItems:"center", gap:4, background:"#ecfdf5", color:"#059669", padding:"2px 10px", borderRadius:20, fontSize:12, fontWeight:600, border:"1px solid #6ee7b7", flexShrink:0 }}>
          <CheckCircle size={11}/> Yes
        </span>
      ) : (
        <span style={{ display:"flex", alignItems:"center", gap:4, background:"#f3f4f6", color:"#9ca3af", padding:"2px 10px", borderRadius:20, fontSize:12, fontWeight:600, border:"1px solid #e5e7eb", flexShrink:0 }}>
          <XCircle size={11}/> No
        </span>
      )}
    </div>
  );
}

export default function EmployeeRetentionPlan() {
  const [plan, setPlan]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const isMobile   = useIsMobile();
  const employeeId = localStorage.getItem("employeeId") || localStorage.getItem("employee_id");

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_BASE}/api/retention/employee/${employeeId}`);
        setPlan(res.data.data);
      } catch (e) {
        if (e?.response?.status === 404) setPlan(null);
        else setError(e?.response?.data?.message || "Failed to load");
      } finally {
        setLoading(false);
      }
    };
    if (employeeId) fetchPlan();
    else { setError("Session expired. Please login again."); setLoading(false); }
  }, [employeeId]);

  /* ── loading ── */
  if (loading) return (
    <EmployeeLayout>
      <div style={{ display:"flex", justifyContent:"center", alignItems:"center", minHeight:300 }}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{ width:36, height:36, border:"4px solid #e5e7eb", borderTopColor:"#3b82f6", borderRadius:"50%", animation:"spin 0.8s linear infinite" }}/>
      </div>
    </EmployeeLayout>
  );

  /* ── error ── */
  if (error) return (
    <EmployeeLayout>
      <div style={{ margin:isMobile?14:24, padding:16, background:"#fef2f2", border:"1px solid #fca5a5", borderRadius:10, color:"#dc2626", fontSize:14 }}>
        {error}
      </div>
    </EmployeeLayout>
  );

  /* ── no plan ── */
  if (!plan) return (
    <EmployeeLayout>
      <div style={{ background:"#f4f6fb", padding: isMobile ? "24px 14px" : "40px 24px", minHeight:"100vh" }}>
        <div style={{ maxWidth:560, margin:"0 auto", textAlign:"center" }}>
          <div style={{ width:72, height:72, borderRadius:"50%", background:"#f3f4f6", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px" }}>
            <ShieldCheck size={34} color="#9ca3af"/>
          </div>
          <h4 style={{ fontWeight:800, color:"#1a1a2e", marginBottom:8 }}>No Retention Plan Yet</h4>
          <p style={{ color:"#6b7280", fontSize:14, marginBottom:28 }}>
            Your HR team will create a personalised retention plan once you meet the eligibility criteria.
          </p>
          <div style={{ background:"#fff", borderRadius:14, border:"1px solid #e5e7eb", padding: isMobile ? 16 : 24, textAlign:"left" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
              <Info size={16} color="#3b82f6"/>
              <p style={{ margin:0, fontWeight:700, fontSize:14, color:"#1e40af" }}>Eligibility Criteria (Policy 3.38)</p>
            </div>
            {[
              { icon:"💼", text:"Critical roles: Tech Lead, Product Manager, Sales Head, Key Account Manager, CXO-level" },
              { icon:"⭐", text:"Minimum Top 20% performance rating in last appraisal cycle" },
              { icon:"📅", text:"Minimum 12 months in current role (flexible for strategic hires)" },
            ].map((item, i) => (
              <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:10, padding:"10px 0", borderBottom: i < 2 ? "1px solid #f3f4f6" : "none" }}>
                <span style={{ fontSize:18, flexShrink:0 }}>{item.icon}</span>
                <p style={{ margin:0, fontSize:13, color:"#374151", lineHeight:1.5 }}>{item.text}</p>
              </div>
            ))}
          </div>
          <p style={{ marginTop:20, fontSize:12, color:"#9ca3af" }}>Contact your HR team for more details.</p>
        </div>
      </div>
    </EmployeeLayout>
  );

  const st = STATUS_CONFIG[plan.status] || STATUS_CONFIG.draft;

  /* ── layout tokens ── */
  const px         = isMobile ? 14 : 24;
  const cardPad    = isMobile ? 14 : 18;
  /* single column on mobile, auto-fit 2-col on tablet+desktop */
  const gridCols   = isMobile ? "1fr" : "repeat(auto-fit, minmax(300px, 1fr))";

  return (
    <EmployeeLayout>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }

        /* status bar: stack on mobile */
        @media (max-width: 600px) {
          .rp-status-bar {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 8px !important;
          }
        }

        /* header: tighten on mobile */
        @media (max-width: 480px) {
          .rp-header-title { font-size: 17px !important; }
        }
      `}</style>

      <div style={{ background:"#f4f6fb", padding:`${isMobile?18:28}px ${px}px`, minHeight:"100vh", boxSizing:"border-box" }}>
        <div style={{ maxWidth:1100, margin:"0 auto" }}>

          {/* ── Header ── */}
          <div style={{ display:"flex", alignItems:"center", gap: isMobile ? 10 : 14, marginBottom:18 }}>
            <div style={{ width: isMobile?40:46, height: isMobile?40:46, borderRadius:12, background:"linear-gradient(135deg,#10b981,#3b82f6)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <ShieldCheck size={isMobile?18:22} color="#fff"/>
            </div>
            <div style={{ minWidth:0 }}>
              <h3 className="rp-header-title" style={{ margin:0, fontWeight:800, fontSize:20, color:"#1a1a2e", overflow:"hidden", textOverflow:"ellipsis", whiteSpace: isMobile?"normal":"nowrap" }}>
                My Retention Plan
              </h3>
              <p style={{ margin:"2px 0 0", fontSize:12, color:"#6b7280" }}>
                Radnus Policy 3.38 — Custom Retention Plan
              </p>
            </div>
          </div>

          {/* ── Status Bar ── */}
          <div
            className="rp-status-bar"
            style={{ background:"#fff", borderRadius:14, border:"1px solid #e5e7eb", padding: isMobile?"14px":"16px 20px", marginBottom:18, display:"flex", alignItems:"center", flexWrap:"wrap", gap:10 }}
          >
            <span style={{ background:st.bg, color:st.color, padding:"4px 14px", borderRadius:20, fontSize:13, fontWeight:700, border:`1px solid ${st.color}33`, flexShrink:0 }}>
              {st.label}
            </span>
            {plan.approvedBy && (
              <span style={{ fontSize:13, color:"#6b7280" }}>
                ✅ Approved by: <strong style={{ color:"#1a1a2e" }}>{plan.approvedBy}</strong>
              </span>
            )}
            {plan.nextReviewDate && (
              <span style={{ fontSize:13, color:"#6b7280" }}>
                📅 Next Review: <strong style={{ color:"#1a1a2e" }}>{new Date(plan.nextReviewDate).toLocaleDateString("en-IN")}</strong>
              </span>
            )}
            {plan.reviewFrequency && (
              <span style={{ fontSize:13, color:"#6b7280" }}>
                🔁 Reviewed: <strong style={{ color:"#1a1a2e" }}>{plan.reviewFrequency}</strong>
              </span>
            )}
          </div>

          {/* ── Info Banner ── */}
          <div style={{ background:"#eff6ff", border:"1px solid #bfdbfe", borderRadius:10, padding: isMobile?"11px 13px":"12px 16px", marginBottom:20, display:"flex", alignItems:"flex-start", gap:10, fontSize:13, color:"#1e40af" }}>
            <Info size={15} color="#3b82f6" style={{ flexShrink:0, marginTop:2 }}/>
            <p style={{ margin:0, lineHeight:1.5 }}>
              This is your personalised retention plan. It is <strong>confidential</strong> and reviewed {plan.reviewFrequency}. Contact HR for any queries.
            </p>
          </div>

          {/* ── Plan Grid ── */}
          <div style={{ display:"grid", gridTemplateColumns: gridCols, gap: isMobile ? 12 : 18, marginBottom:18 }}>

            <SectionCard title="Financial Incentives" icon={<Banknote size={15}/>} color="#10b981" bg="#ecfdf5">
              {plan.financialIncentives?.description && (
                <p style={{ margin:"0 0 10px", fontSize:13, color:"#374151" }}>{plan.financialIncentives.description}</p>
              )}
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                {plan.financialIncentives?.amount && (
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, flexWrap:"wrap", gap:4 }}>
                    <span style={{ color:"#6b7280" }}>Amount / Range</span>
                    <strong style={{ color:"#10b981" }}>{plan.financialIncentives.amount}</strong>
                  </div>
                )}
                {plan.financialIncentives?.frequency && (
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, flexWrap:"wrap", gap:4 }}>
                    <span style={{ color:"#6b7280" }}>Frequency</span>
                    <strong style={{ color:"#1a1a2e" }}>{plan.financialIncentives.frequency}</strong>
                  </div>
                )}
                {plan.financialIncentives?.linkedTo && (
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, flexWrap:"wrap", gap:4 }}>
                    <span style={{ color:"#6b7280" }}>Linked To</span>
                    <strong style={{ color:"#1a1a2e" }}>{plan.financialIncentives.linkedTo}</strong>
                  </div>
                )}
              </div>
            </SectionCard>

            <SectionCard title="Career Advancement" icon={<TrendingUp size={15}/>} color="#3b82f6" bg="#eff6ff">
              <BoolRow label="Fast-tracked Promotion"    value={plan.careerGrowth?.fastTrackedPromotion}/>
              <BoolRow label="Leadership Grooming"       value={plan.careerGrowth?.leadershipGrooming}/>
              <BoolRow label="Cross-functional Exposure" value={plan.careerGrowth?.crossFunctionalExposure}/>
              {plan.careerGrowth?.notes && (
                <p style={{ margin:"10px 0 0", fontSize:12, color:"#6b7280", fontStyle:"italic" }}>{plan.careerGrowth.notes}</p>
              )}
            </SectionCard>

            <SectionCard title="Skill Development" icon={<BookOpen size={15}/>} color="#8b5cf6" bg="#f5f3ff">
              <BoolRow label="External Courses"   value={plan.skillDevelopment?.externalCourses}/>
              <BoolRow label="Internal Bootcamp"  value={plan.skillDevelopment?.internalBootcamp}/>
              <BoolRow label="Radnus Academy LMS" value={plan.skillDevelopment?.radnusAcademyLMS}/>
              {plan.skillDevelopment?.certifications?.length > 0 && (
                <div style={{ marginTop:10 }}>
                  <p style={{ margin:"0 0 6px", fontSize:11, fontWeight:700, color:"#6b7280", textTransform:"uppercase" }}>Certifications</p>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                    {plan.skillDevelopment.certifications.map((c,i) => (
                      <span key={i} style={{ background:"#f5f3ff", color:"#7c3aed", padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:600, border:"1px solid #ddd6fe" }}>{c}</span>
                    ))}
                  </div>
                </div>
              )}
              {plan.skillDevelopment?.notes && (
                <p style={{ margin:"10px 0 0", fontSize:12, color:"#6b7280", fontStyle:"italic" }}>{plan.skillDevelopment.notes}</p>
              )}
            </SectionCard>

            <SectionCard title="Flexible Work Options" icon={<Clock size={15}/>} color="#f59e0b" bg="#fffbeb">
              <BoolRow label="Remote Work"            value={plan.workFlexibility?.remoteWork}/>
              <BoolRow label="Flexible Hours"         value={plan.workFlexibility?.flexibleHours}/>
              <BoolRow label="Project-based Autonomy" value={plan.workFlexibility?.projectBasedAutonomy}/>
              {plan.workFlexibility?.notes && (
                <p style={{ margin:"10px 0 0", fontSize:12, color:"#6b7280", fontStyle:"italic" }}>{plan.workFlexibility.notes}</p>
              )}
            </SectionCard>

            <SectionCard title="Recognition & Engagement" icon={<Award size={15}/>} color="#ef4444" bg="#fef2f2">
              <BoolRow label="Board-level Visibility" value={plan.recognition?.boardLevelVisibility}/>
              <BoolRow label="Townhall Highlight"     value={plan.recognition?.townhallHighlight}/>
              <BoolRow label="Digital Leaderboard"    value={plan.recognition?.digitalLeaderboard}/>
              <BoolRow label="ESOP Eligible"          value={plan.recognition?.esopEligible}/>
              {plan.recognition?.notes && (
                <p style={{ margin:"10px 0 0", fontSize:12, color:"#6b7280", fontStyle:"italic" }}>{plan.recognition.notes}</p>
              )}
            </SectionCard>

            {plan.reviewHistory?.length > 0 && (
              <SectionCard title="Review History" icon={<Calendar size={15}/>} color="#6b7280" bg="#f3f4f6">
                <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                  {plan.reviewHistory.map((r,i) => (
                    <div key={i} style={{ borderLeft:"3px solid #3b82f6", paddingLeft:12 }}>
                      <p style={{ margin:0, fontWeight:700, fontSize:13, color:"#1a1a2e" }}>{r.outcome}</p>
                      <p style={{ margin:"2px 0 0", fontSize:11, color:"#6b7280" }}>
                        {new Date(r.date).toLocaleDateString("en-IN")} · {r.reviewedBy}
                      </p>
                      {r.notes && <p style={{ margin:"2px 0 0", fontSize:11, color:"#9ca3af" }}>{r.notes}</p>}
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}
          </div>

          {/* ── Footer ── */}
          <div style={{ background:"#fff", borderRadius:12, border:"1px solid #e5e7eb", padding: isMobile?"12px 14px":"14px 18px", display:"flex", alignItems:"flex-start", gap:10 }}>
            <Info size={14} color="#9ca3af" style={{ flexShrink:0, marginTop:2 }}/>
            <p style={{ margin:0, fontSize:12, color:"#9ca3af", lineHeight:1.5 }}>
              This plan is confidential. For any updates or queries, please contact your HR team directly.
            </p>
          </div>

        </div>
      </div>
    </EmployeeLayout>
  );
}