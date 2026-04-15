import { useState, useEffect } from "react";
import axios from "axios";
import EmployeeLayout from "./EmployeeLayout";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const TIER_CONFIG = {
  tier1_local:   { label:"Local Impact",       icon:"LOCAL",   color:"#3b82f6", bg:"#eff6ff", range:"₹5K–₹15K",    desc:"Improves team or dept efficiency" },
  tier2_cross:   { label:"Cross-functional",   icon:"CROSS",   color:"#8b5cf6", bg:"#f5f3ff", range:"₹25K–₹50K",   desc:"Benefits multiple departments" },
  tier3_company: { label:"Company-Wide",       icon:"COMPANY", color:"#ef4444", bg:"#fef2f2", range:"₹1L–₹2L+CEO", desc:"Measurable business growth" },
};

const STATUS_CFG = {
  submitted:   { label:"Submitted",      color:"#6b7280", bg:"#f3f4f6", step:1 },
  dept_review: { label:"Dept Review",    color:"#f59e0b", bg:"#fffbeb", step:2 },
  iec_review:  { label:"IEC Review",     color:"#8b5cf6", bg:"#f5f3ff", step:3 },
  scoring:     { label:"Scoring",        color:"#3b82f6", bg:"#eff6ff", step:4 },
  approved:    { label:"Approved",       color:"#10b981", bg:"#ecfdf5", step:5 },
  announced:   { label:"Announced",      color:"#059669", bg:"#d1fae5", step:6 },
  rejected:    { label:"Not Selected",   color:"#ef4444", bg:"#fef2f2", step:0 },
};

const IMPACT_AREAS = [
  { key:"revenue_growth",        label:"Revenue Growth"       },
  { key:"cost_reduction",        label:"Cost Reduction"       },
  { key:"product_innovation",    label:"Product Innovation"   },
  { key:"customer_satisfaction", label:"Customer Satisfaction"},
  { key:"brand_visibility",      label:"Brand Visibility"     },
  { key:"employee_engagement",   label:"Employee Engagement"  },
];

// ── SVG Icon Library ─────────────────────────────────────────────────────────
const Icon = ({ name, size = 16, color = "currentColor", style = {} }) => {
  const icons = {
    bulb: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>,
    trophy: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>,
    check: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={style}><polyline points="20 6 9 17 4 12"/></svg>,
    x: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={style}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    mail: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>,
    review: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>,
    target: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
    user: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    search: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>,
    star: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
    announce: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><path d="m3 11 19-9-9 19-2-8-8-2z"/></svg>,
    money: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>,
    chart: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
    info: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>,
    calendar: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    shield: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    arrow_down: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><polyline points="6 9 12 15 18 9"/></svg>,
    arrow_up: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><polyline points="18 15 12 9 6 15"/></svg>,
    link: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
    rocket: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>,
    newspaper: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6Z"/></svg>,
    award: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>,
    trending: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>,
    local: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
    cross_dept: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><rect x="2" y="2" width="9" height="9" rx="2"/><rect x="13" y="2" width="9" height="9" rx="2"/><rect x="2" y="13" width="9" height="9" rx="2"/><rect x="13" y="13" width="9" height="9" rx="2"/></svg>,
    global: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
    comment: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
    list: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
  };
  return icons[name] || null;
};

// ── Input / textarea base style ───────────────────────────────────────────────
const inp = {
  width:"100%", padding:"10px 13px", border:"1.5px solid #e5e7eb",
  borderRadius:10, fontSize:14, color:"#1a1a2e", background:"#fff",
  boxSizing:"border-box", outline:"none", fontFamily:"inherit",
  transition:"border-color .2s",
};

// ── Global styles ─────────────────────────────────────────────────────────────
const STYLES = `
  @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin   { to{transform:rotate(360deg)} }
  .ib-card { animation: fadeUp .3s ease both; }
  .ib-inp:focus { border-color: #3b82f6 !important; box-shadow: 0 0 0 3px rgba(59,130,246,0.1) !important; }
  .ib-chip:hover { opacity:.85; }
  .ib-area:hover { border-color: #3b82f6 !important; }
  .ib-btn-tab:hover { background: #f3f4f6; }

  @media (max-width: 900px) {
    .ib-page { padding: 20px !important; }
    .ib-form-cols { grid-template-columns: 1fr !important; }
    .ib-score-grid { grid-template-columns: 1fr !important; }
    .ib-policy-grid { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)) !important; }
    .ib-tier-row { flex-direction: column !important; }
    .ib-tier-row > button { width: 100% !important; }
    .ib-stat-row { flex-wrap: wrap; gap: 8px !important; }
  }

  @media (max-width: 768px) {
    .ib-page { padding: 14px !important; }
    .ib-header-row { flex-direction: column !important; align-items: flex-start !important; gap: 12px; }
    .ib-tab-bar { width: 100% !important; }
    .ib-tab-bar button { flex: 1; text-align: center; justify-content: center; font-size: 12px !important; padding: 8px 10px !important; }
    .ib-steps { gap: 2px !important; }
    .ib-step-label { display: none !important; }
    .ib-step-line { display: none !important; }
    .ib-result-row { flex-direction: column !important; gap: 10px !important; }
    .ib-form-header { padding: 16px !important; }
    .ib-form-body { padding: 16px !important; }
    .ib-submit-row { flex-direction: column !important; }
    .ib-submit-row button { width: 100% !important; }
    .ib-area-chips { gap: 6px !important; }
    .ib-tier-row > button { padding: 10px 12px !important; }
    .ib-card-header { flex-direction: column !important; align-items: flex-start !important; gap: 10px; }
    .ib-card-header-right { align-self: flex-start; }
    .ib-stat-row > div { flex: 1; min-width: 100px; }
  }

  @media (max-width: 480px) {
    .ib-page { padding: 10px !important; }
    .ib-stat-row { flex-direction: column !important; }
    .ib-stat-row > div { width: 100% !important; }
    .ib-result-scores { grid-template-columns: 1fr 1fr !important; }
    .ib-policy-grid { grid-template-columns: 1fr !important; }
  }
`;

// ── Step icon by index ────────────────────────────────────────────────────────
const STEP_ICONS = ["mail","user","search","target","check","announce"];

// ── Progress Steps ────────────────────────────────────────────────────────────
function ProgressSteps({ status }) {
  const steps = [
    { s:"submitted",   label:"Submitted"  },
    { s:"dept_review", label:"Dept Review"},
    { s:"iec_review",  label:"IEC Review" },
    { s:"scoring",     label:"Scoring"    },
    { s:"approved",    label:"Approved"   },
    { s:"announced",   label:"Announced"  },
  ];
  const currentStep = STATUS_CFG[status]?.step || 0;
  const isRejected  = status === "rejected";

  return (
    <div className="ib-steps" style={{ display:"flex", alignItems:"flex-start", gap:4 }}>
      {steps.map((step, i) => {
        const done    = !isRejected && currentStep > i + 1;
        const active  = !isRejected && currentStep === i + 1;
        const color   = done ? "#10b981" : active ? "#3b82f6" : "#d1d5db";
        const bgCircle= done ? "#10b981" : active ? "#3b82f6" : "#f3f4f6";
        const iconClr = done || active ? "#fff" : "#9ca3af";
        return (
          <div key={i} style={{ display:"flex", alignItems:"center", flex:1 }}>
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", flex:1 }}>
              <div style={{
                width:32, height:32, borderRadius:"50%",
                background: bgCircle,
                display:"flex", alignItems:"center", justifyContent:"center",
                border:`2px solid ${color}`,
                transition:"all .3s",
                flexShrink: 0,
              }}>
                {done
                  ? <Icon name="check" size={14} color="#fff"/>
                  : <Icon name={STEP_ICONS[i]} size={14} color={iconClr}/>
                }
              </div>
              <p className="ib-step-label" style={{ margin:"4px 0 0", fontSize:10, color: done||active?"#374151":"#9ca3af", fontWeight:active?700:400, textAlign:"center", lineHeight:1.2 }}>
                {step.label}
              </p>
            </div>
            {i < steps.length - 1 && (
              <div className="ib-step-line" style={{ height:2, flex:1, background: done?"#10b981":"#e5e7eb", margin:"0 4px", marginTop:-16, transition:"background .3s" }}/>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Tier icon map ─────────────────────────────────────────────────────────────
const TIER_ICON_MAP = { LOCAL:"local", CROSS:"cross_dept", COMPANY:"global" };

// ── Submission Card ───────────────────────────────────────────────────────────
function SubmissionCard({ sub, idx }) {
  const [open, setOpen] = useState(false);
  const tc = TIER_CONFIG[sub.impact_tier] || TIER_CONFIG.tier1_local;
  const st = STATUS_CFG[sub.status] || STATUS_CFG.submitted;
  const isAnnounced = sub.status === "announced";
  const isApproved  = sub.status === "approved" || isAnnounced;
  const isRejected  = sub.status === "rejected";

  return (
    <div className="ib-card" style={{
      background:"#fff", borderRadius:16,
      border:`1.5px solid ${isAnnounced?"#10b981":isRejected?"#fecaca":isApproved?"#bbf7d0":"#e5e7eb"}`,
      overflow:"hidden", animationDelay:`${idx*0.06}s`,
    }}>
      {/* Header */}
      <div style={{ padding:"16px 18px", borderBottom:"1px solid #f3f4f6" }}>
        <div className="ib-card-header" style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12, marginBottom:12 }}>
          <div style={{ flex:1 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
              <div style={{ width:32, height:32, borderRadius:8, background:tc.bg, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <Icon name={TIER_ICON_MAP[tc.icon]} size={16} color={tc.color}/>
              </div>
              <h3 style={{ margin:0, fontSize:15, fontWeight:800, color:"#1a1a2e", lineHeight:1.2 }}>{sub.title}</h3>
            </div>
            <p style={{ margin:0, fontSize:12, color:"#6b7280" }}>
              Submitted {new Date(sub.createdAt).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}
              {sub.period && ` · ${sub.period}`}
            </p>
          </div>
          <span className="ib-card-header-right" style={{ background:st.bg, color:st.color, padding:"5px 12px", borderRadius:20, fontSize:11, fontWeight:700, flexShrink:0, display:"flex", alignItems:"center", gap:5 }}>
            <Icon name={
              sub.status === "submitted"   ? "mail"    :
              sub.status === "dept_review" ? "user"    :
              sub.status === "iec_review"  ? "search"  :
              sub.status === "scoring"     ? "target"  :
              sub.status === "approved"    ? "check"   :
              sub.status === "announced"   ? "trophy"  :
              "x"
            } size={11} color={st.color}/>
            {st.label}
          </span>
        </div>

        {!isRejected && <ProgressSteps status={sub.status}/>}

        {isRejected && (
          <div style={{ background:"#fef2f2", borderRadius:8, padding:"10px 14px", marginTop:8, display:"flex", gap:8, alignItems:"flex-start" }}>
            <div style={{ width:28, height:28, borderRadius:6, background:"#fee2e2", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <Icon name="x" size={14} color="#dc2626"/>
            </div>
            <div>
              <p style={{ margin:0, fontSize:12, fontWeight:700, color:"#dc2626" }}>Not selected this time</p>
              {sub.rejection_reason && <p style={{ margin:"2px 0 0", fontSize:12, color:"#6b7280" }}>{sub.rejection_reason}</p>}
            </div>
          </div>
        )}
      </div>

      {/* Approved / Announced result section */}
      {isApproved && (
        <div style={{ background: isAnnounced?"#f0fdf4":"#f8fafc", padding:"14px 18px", borderBottom:"1px solid #e5e7eb" }}>
          <div className="ib-result-row" style={{ display:"flex", gap:16, flexWrap:"wrap" }}>
            {sub.total_score > 0 && (
              <div>
                <p style={{ margin:"0 0 2px", fontSize:10, color:"#6b7280", fontWeight:700, textTransform:"uppercase" }}>Score</p>
                <p style={{ margin:0, fontSize:22, fontWeight:900, color:"#3b82f6", display:"flex", alignItems:"baseline", gap:3 }}>
                  {sub.total_score}<span style={{ fontSize:12, color:"#9ca3af" }}>/100</span>
                </p>
              </div>
            )}
            {sub.bonus_amount > 0 && (
              <div>
                <p style={{ margin:"0 0 2px", fontSize:10, color:"#6b7280", fontWeight:700, textTransform:"uppercase" }}>Bonus</p>
                <p style={{ margin:0, fontSize:22, fontWeight:900, color:"#10b981" }}>₹{sub.bonus_amount.toLocaleString("en-IN")}</p>
              </div>
            )}
            <div style={{ flex:1 }}>
              {sub.certificate_issued && (
                <div style={{ display:"flex", alignItems:"center", gap:5, fontSize:12, color:"#059669", fontWeight:600, marginBottom:4 }}>
                  <Icon name="award" size={13} color="#059669"/> "Impact Innovator" Certificate
                </div>
              )}
              {sub.featured_in_digest && (
                <div style={{ display:"flex", alignItems:"center", gap:5, fontSize:12, color:"#2563eb", fontWeight:600, marginBottom:4 }}>
                  <Icon name="newspaper" size={13} color="#2563eb"/> Featured in Innovation Digest
                </div>
              )}
              {sub.esop_eligible && (
                <div style={{ display:"flex", alignItems:"center", gap:5, fontSize:12, color:"#7c3aed", fontWeight:600, marginBottom:4 }}>
                  <Icon name="trending" size={13} color="#7c3aed"/> ESOP Fast-track Eligible
                </div>
              )}
              {sub.impact_wall && (
                <div style={{ display:"flex", alignItems:"center", gap:5, fontSize:12, color:"#059669", fontWeight:600 }}>
                  <Icon name="trophy" size={13} color="#059669"/> On Radnus Impact Wall
                </div>
              )}
            </div>
          </div>
          {sub.approved_by && (
            <p style={{ margin:"8px 0 0", fontSize:11, color:"#6b7280", display:"flex", alignItems:"center", gap:4 }}>
              <Icon name="user" size={11} color="#9ca3af"/> Approved by: {sub.approved_by}
            </p>
          )}
        </div>
      )}

      {/* Expand/Collapse */}
      <div style={{ padding:"12px 18px" }}>
        <button onClick={()=>setOpen(o=>!o)}
          style={{ background:"none", border:"none", color:"#3b82f6", fontSize:13, fontWeight:600, cursor:"pointer", padding:0, display:"flex", alignItems:"center", gap:5 }}>
          <Icon name={open?"arrow_up":"arrow_down"} size={14} color="#3b82f6"/>
          {open ? "Hide details" : "View details"}
        </button>

        {open && (
          <div style={{ marginTop:14 }}>
            <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}>
              <Icon name="list" size={13} color="#374151"/>
              <p style={{ margin:0, fontSize:12, fontWeight:700, color:"#374151" }}>Description</p>
            </div>
            <p style={{ margin:"0 0 14px", fontSize:13, color:"#6b7280", lineHeight:1.6 }}>{sub.description}</p>

            {sub.impact_areas?.length > 0 && (
              <div style={{ marginBottom:12 }}>
                <p style={{ margin:"0 0 6px", fontSize:12, fontWeight:700, color:"#374151" }}>Impact Areas</p>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                  {sub.impact_areas.map(ia => {
                    const found = IMPACT_AREAS.find(x=>x.key===ia);
                    return found ? (
                      <span key={ia} style={{ background:"#f3f4f6", padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:600, color:"#374151" }}>
                        {found.label}
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
            )}

            {sub.iec_comment && (
              <div style={{ background:"#eff6ff", borderRadius:8, padding:"10px 14px", borderLeft:"3px solid #3b82f6", marginBottom:8 }}>
                <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:4 }}>
                  <Icon name="comment" size={12} color="#1e40af"/>
                  <p style={{ margin:0, fontSize:11, fontWeight:700, color:"#1e40af" }}>IEC Committee Feedback</p>
                </div>
                <p style={{ margin:0, fontSize:12, color:"#374151" }}>{sub.iec_comment}</p>
              </div>
            )}

            {sub.dept_head_comment && (
              <div style={{ background:"#fffbeb", borderRadius:8, padding:"10px 14px", borderLeft:"3px solid #f59e0b", marginTop:8 }}>
                <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:4 }}>
                  <Icon name="comment" size={12} color="#92400e"/>
                  <p style={{ margin:0, fontSize:11, fontWeight:700, color:"#92400e" }}>Department Head Comment</p>
                </div>
                <p style={{ margin:0, fontSize:12, color:"#374151" }}>{sub.dept_head_comment}</p>
              </div>
            )}

            {/* Scoring breakdown */}
            {sub.total_score > 0 && sub.scoring && (
              <div style={{ marginTop:12 }}>
                <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:8 }}>
                  <Icon name="target" size={13} color="#374151"/>
                  <p style={{ margin:0, fontSize:12, fontWeight:700, color:"#374151" }}>Scoring Breakdown</p>
                </div>
                {[
                  { key:"innovation_originality",     label:"Innovation / Originality",   max:25 },
                  { key:"measurable_business_result", label:"Measurable Business Result", max:35 },
                  { key:"scalability",                label:"Scalability",                max:20 },
                  { key:"team_collaboration_speed",   label:"Team Collaboration",         max:20 },
                ].map(f => {
                  const val = sub.scoring[f.key] || 0;
                  const pct = (val/f.max)*100;
                  return (
                    <div key={f.key} style={{ marginBottom:8 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:3 }}>
                        <span style={{ color:"#374151" }}>{f.label}</span>
                        <span style={{ fontWeight:700, color:"#2563eb" }}>{val}/{f.max}</span>
                      </div>
                      <div style={{ background:"#f3f4f6", borderRadius:99, height:5, overflow:"hidden" }}>
                        <div style={{ width:`${pct}%`, height:"100%", background:"#3b82f6", borderRadius:99 }}/>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function ImpactBonusEmployee() {
  const empId = localStorage.getItem("employeeId") || "";

  const [tab, setTab]           = useState("my");
  const [submissions, setSubs]  = useState([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [toast, setToast]       = useState(null);

  const [form, setForm] = useState({
    title:"", description:"", contribution_type:"",
    impact_areas:[], impact_tier:"tier1_local",
    submission_channel:"lms_portal", period:"",
  });

  useEffect(() => {
    if (empId) fetchSubs();
    else setLoading(false);
  }, [empId]);

  const fetchSubs = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/impact-bonus/employee/${empId}`);
      if (res.data.success) setSubs(res.data.data);
    } catch { showMsg("Failed to load submissions","error"); }
    finally { setLoading(false); }
  };

  const showMsg = (msg, type="success") => {
    setToast({msg, type});
    setTimeout(()=>setToast(null),3500);
  };

  const toggleArea = (key) => {
    setForm(f => ({
      ...f,
      impact_areas: f.impact_areas.includes(key)
        ? f.impact_areas.filter(x=>x!==key)
        : [...f.impact_areas, key]
    }));
  };

  const handleSubmit = async () => {
    if (!form.title.trim())       return showMsg("Please enter a title","error");
    if (!form.description.trim()) return showMsg("Please describe your innovation","error");
    if (!empId)                   return showMsg("Session expired. Please login again","error");

    setSaving(true);
    try {
      await axios.post(`${API_BASE}/api/impact-bonus`, {
        ...form,
        employee_id: empId,
      });
      showMsg("Innovation submitted! HR will review it soon.");
      setForm({ title:"", description:"", contribution_type:"", impact_areas:[], impact_tier:"tier1_local", submission_channel:"lms_portal", period:"" });
      setTab("my");
      fetchSubs();
    } catch(err) {
      showMsg(err?.response?.data?.message || "Submission failed","error");
    } finally { setSaving(false); }
  };

  const pendingCount  = submissions.filter(s => !["approved","announced","rejected"].includes(s.status)).length;
  const approvedCount = submissions.filter(s => ["approved","announced"].includes(s.status)).length;

  return (
    <EmployeeLayout>
      <style>{STYLES}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position:"fixed", top:20, right:16, zIndex:9999, background:toast.type==="error"?"#ef4444":"#10b981", color:"#fff", padding:"12px 20px", borderRadius:10, fontWeight:600, fontSize:14, boxShadow:"0 8px 24px rgba(0,0,0,.2)", animation:"fadeUp .3s ease", display:"flex", alignItems:"center", gap:8, maxWidth:"calc(100vw - 32px)" }}>
          <Icon name={toast.type==="error"?"x":"check"} size={15} color="#fff"/>
          {toast.msg}
        </div>
      )}

      <div className="ib-page" style={{ padding:"24px 28px", minHeight:"100vh", background:"#f4f6fb", fontFamily:"'Segoe UI',sans-serif" }}>

        {/* Header */}
        <div style={{ marginBottom:24 }}>
          <div className="ib-header-row" style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:10, marginBottom:6 }}>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ width:44, height:44, borderRadius:12, background:"#fff", border:"1.5px solid #e5e7eb", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <Icon name="bulb" size={22} color="#f59e0b"/>
              </div>
              <div>
                <h2 style={{ margin:0, fontSize:20, fontWeight:800, color:"#1a1a2e" }}>Impact Bonus</h2>
                <p style={{ margin:0, fontSize:13, color:"#6b7280" }}>Submit innovations · Track status · View rewards</p>
              </div>
            </div>
          </div>

          {/* Quick stats */}
          {submissions.length > 0 && (
            <div className="ib-stat-row" style={{ display:"flex", gap:10, marginTop:14, flexWrap:"wrap" }}>
              {[
                { label:"Total Submitted", value:submissions.length,  color:"#3b82f6", bg:"#eff6ff", icon:"list"    },
                { label:"Under Review",    value:pendingCount,         color:"#f59e0b", bg:"#fffbeb", icon:"review"  },
                { label:"Approved / Won",  value:approvedCount,        color:"#10b981", bg:"#ecfdf5", icon:"trophy"  },
              ].map((s,i)=>(
                <div key={i} style={{ background:s.bg, borderRadius:10, padding:"10px 16px", display:"flex", gap:10, alignItems:"center", border:`1px solid ${s.color}22` }}>
                  <div style={{ width:32, height:32, borderRadius:8, background:`${s.color}18`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <Icon name={s.icon} size={16} color={s.color}/>
                  </div>
                  <div>
                    <p style={{ margin:0, fontSize:20, fontWeight:900, color:s.color, lineHeight:1 }}>{s.value}</p>
                    <p style={{ margin:0, fontSize:11, fontWeight:600, color:s.color, textTransform:"uppercase", letterSpacing:"0.4px", opacity:0.8 }}>{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="ib-tab-bar" style={{ display:"flex", gap:4, background:"#fff", borderRadius:12, padding:4, border:"1.5px solid #e5e7eb", marginBottom:24, width:"fit-content" }}>
          {[
            { id:"my",     label:`My Submissions (${submissions.length})`, icon:"list"   },
            { id:"submit", label:"Submit New Idea",                         icon:"bulb"   },
          ].map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)}
              style={{ padding:"9px 20px", border:"none", borderRadius:9, cursor:"pointer", fontWeight:600, fontSize:13, background:tab===t.id?"#1a1a2e":"transparent", color:tab===t.id?"#fff":"#6b7280", transition:"all .2s", whiteSpace:"nowrap", display:"flex", alignItems:"center", gap:6 }}>
              <Icon name={t.icon} size={14} color={tab===t.id?"#fff":"#6b7280"}/>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── MY SUBMISSIONS TAB ── */}
        {tab === "my" && (
          <>
            {loading ? (
              <div style={{ textAlign:"center", padding:60 }}>
                <div style={{ width:36, height:36, border:"3px solid #e5e7eb", borderTopColor:"#3b82f6", borderRadius:"50%", animation:"spin .8s linear infinite", margin:"0 auto 12px" }}/>
                <p style={{ color:"#6b7280" }}>Loading your submissions...</p>
              </div>
            ) : submissions.length === 0 ? (
              <div style={{ background:"#fff", borderRadius:16, padding:"56px 24px", textAlign:"center", border:"1.5px solid #e5e7eb" }}>
                <div style={{ width:64, height:64, borderRadius:16, background:"#fffbeb", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}>
                  <Icon name="bulb" size={32} color="#f59e0b"/>
                </div>
                <h3 style={{ margin:"0 0 8px", color:"#1a1a2e", fontSize:18 }}>No submissions yet</h3>
                <p style={{ margin:"0 0 20px", color:"#6b7280", fontSize:14, lineHeight:1.6 }}>
                  Have an idea that can improve Radnus? Submit it and earn up to ₹2 Lakh!
                </p>
                <button onClick={()=>setTab("submit")}
                  style={{ padding:"11px 28px", background:"#1a1a2e", color:"#fff", border:"none", borderRadius:12, fontWeight:700, fontSize:14, cursor:"pointer", display:"inline-flex", alignItems:"center", gap:8 }}>
                  <Icon name="bulb" size={16} color="#f59e0b"/>
                  Submit Your First Idea
                </button>
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                {submissions.map((sub,i) => <SubmissionCard key={sub._id} sub={sub} idx={i}/>)}
              </div>
            )}
          </>
        )}

        {/* ── SUBMIT TAB ── */}
        {tab === "submit" && (
          <div style={{ background:"#fff", borderRadius:16, border:"1.5px solid #e5e7eb", overflow:"hidden" }}>
            {/* Form header */}
            <div className="ib-form-header" style={{ background:"#1a1a2e", padding:"20px 24px", display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ width:40, height:40, borderRadius:10, background:"rgba(255,255,255,0.1)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <Icon name="bulb" size={20} color="#f59e0b"/>
              </div>
              <div>
                <h3 style={{ margin:0, color:"#fff", fontWeight:800, fontSize:17 }}>Submit Your Innovation</h3>
                <p style={{ margin:"3px 0 0", color:"#9ca3af", fontSize:13 }}>
                  Earn up to ₹2L + CEO Recognition · Up to 2% of company's annual profit
                </p>
              </div>
            </div>

            <div className="ib-form-body" style={{ padding:24 }}>

              {/* Title */}
              <div style={{ marginBottom:16 }}>
                <label style={{ display:"block", fontSize:12, fontWeight:700, color:"#374151", marginBottom:6, textTransform:"uppercase", letterSpacing:"0.05em" }}>
                  Innovation Title *
                </label>
                <input className="ib-inp" style={inp} value={form.title}
                  onChange={e=>setForm(f=>({...f,title:e.target.value}))}
                  placeholder="e.g. Automated Stock Monitoring System"/>
              </div>

              {/* Description */}
              <div style={{ marginBottom:16 }}>
                <label style={{ display:"block", fontSize:12, fontWeight:700, color:"#374151", marginBottom:6, textTransform:"uppercase", letterSpacing:"0.05em" }}>
                  Describe Your Innovation & Its Impact *
                </label>
                <textarea className="ib-inp" style={{ ...inp, minHeight:100, resize:"vertical" }}
                  value={form.description}
                  onChange={e=>setForm(f=>({...f,description:e.target.value}))}
                  placeholder="What did you build or propose? What is the measurable impact? (e.g. saved ₹3L annually, boosted leads by 30%)"/>
              </div>

              {/* Contribution type + Period */}
              <div className="ib-form-cols" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:16 }}>
                <div>
                  <label style={{ display:"block", fontSize:12, fontWeight:700, color:"#374151", marginBottom:6, textTransform:"uppercase", letterSpacing:"0.05em" }}>
                    Type of Contribution
                  </label>
                  <input className="ib-inp" style={inp} value={form.contribution_type}
                    onChange={e=>setForm(f=>({...f,contribution_type:e.target.value}))}
                    placeholder="e.g. Process improvement, New tool"/>
                </div>
                <div>
                  <label style={{ display:"block", fontSize:12, fontWeight:700, color:"#374151", marginBottom:6, textTransform:"uppercase", letterSpacing:"0.05em" }}>
                    Period
                  </label>
                  <input className="ib-inp" style={inp} value={form.period}
                    onChange={e=>setForm(f=>({...f,period:e.target.value}))}
                    placeholder="e.g. Q1 2026"/>
                </div>
              </div>

              {/* Impact Areas */}
              <div style={{ marginBottom:16 }}>
                <label style={{ display:"block", fontSize:12, fontWeight:700, color:"#374151", marginBottom:8, textTransform:"uppercase", letterSpacing:"0.05em" }}>
                  Impact Areas <span style={{ color:"#9ca3af", textTransform:"none", fontWeight:400 }}>(select all that apply)</span>
                </label>
                <div className="ib-area-chips" style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  {IMPACT_AREAS.map(ia=>{
                    const sel = form.impact_areas.includes(ia.key);
                    return (
                      <button key={ia.key} className="ib-area" onClick={()=>toggleArea(ia.key)}
                        style={{ padding:"7px 14px", border:`1.5px solid ${sel?"#3b82f6":"#e5e7eb"}`, borderRadius:20, background:sel?"#eff6ff":"#fff", color:sel?"#2563eb":"#6b7280", fontSize:12, fontWeight:600, cursor:"pointer", transition:"all .15s" }}>
                        {ia.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Impact Tier */}
              <div style={{ marginBottom:20 }}>
                <label style={{ display:"block", fontSize:12, fontWeight:700, color:"#374151", marginBottom:8, textTransform:"uppercase", letterSpacing:"0.05em" }}>
                  Expected Impact Tier
                </label>
                <div className="ib-tier-row" style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                  {Object.entries(TIER_CONFIG).map(([k,v])=>{
                    const sel = form.impact_tier === k;
                    const iconName = TIER_ICON_MAP[v.icon];
                    return (
                      <button key={k} onClick={()=>setForm(f=>({...f,impact_tier:k}))}
                        style={{ padding:"12px 16px", border:`2px solid ${sel?v.color:"#e5e7eb"}`, borderRadius:12, background:sel?v.bg:"#fff", color:sel?v.color:"#6b7280", fontWeight:700, fontSize:13, cursor:"pointer", transition:"all .2s", textAlign:"left", flex:1, minWidth:140 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                          <div style={{ width:28, height:28, borderRadius:7, background:sel?`${v.color}22`:"#f3f4f6", display:"flex", alignItems:"center", justifyContent:"center" }}>
                            <Icon name={iconName} size={15} color={sel?v.color:"#9ca3af"}/>
                          </div>
                          {v.label}
                        </div>
                        <div style={{ fontSize:11, fontWeight:400, opacity:.75, paddingLeft:36 }}>{v.range} · {v.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Scoring info box */}
              <div style={{ background:"#f8fafc", borderRadius:12, padding:"14px 18px", border:"1px solid #e5e7eb", marginBottom:20 }}>
                <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:10 }}>
                  <Icon name="target" size={14} color="#1a1a2e"/>
                  <p style={{ margin:0, fontWeight:700, fontSize:13, color:"#1a1a2e" }}>How your idea will be scored (100 pts)</p>
                </div>
                <div className="ib-score-grid" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"6px 16px" }}>
                  {[
                    ["Innovation / Originality",    "25 pts"],
                    ["Measurable Business Result",  "35 pts"],
                    ["Scalability",                 "20 pts"],
                    ["Team Collaboration & Speed",  "20 pts"],
                  ].map(([l,v],i)=>(
                    <div key={i} style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:"#6b7280", padding:"5px 0", borderBottom:"1px solid #f0f0f0" }}>
                      <span>{l}</span>
                      <span style={{ fontWeight:700, color:"#3b82f6" }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit button */}
              <div className="ib-submit-row" style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
                <button onClick={()=>setTab("my")}
                  style={{ padding:"11px 24px", border:"1.5px solid #e5e7eb", borderRadius:10, background:"#fff", color:"#374151", fontWeight:600, cursor:"pointer", fontSize:14 }}>
                  Cancel
                </button>
                <button onClick={handleSubmit} disabled={saving}
                  style={{ padding:"11px 32px", border:"none", borderRadius:10, background:saving?"#9ca3af":"#1a1a2e", color:"#fff", fontWeight:800, fontSize:14, cursor:saving?"not-allowed":"pointer", display:"flex", alignItems:"center", gap:8 }}>
                  {saving
                    ? <><div style={{ width:15, height:15, border:"2px solid rgba(255,255,255,0.3)", borderTopColor:"#fff", borderRadius:"50%", animation:"spin .7s linear infinite" }}/>Submitting...</>
                    : <><Icon name="rocket" size={16} color="#fff"/>Submit Innovation</>
                  }
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Policy info */}
        <div style={{ background:"#fff", borderRadius:14, border:"1.5px solid #e5e7eb", padding:"16px 20px", marginTop:20 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:12 }}>
            <Icon name="info" size={15} color="#1a1a2e"/>
            <p style={{ margin:0, fontWeight:700, fontSize:13, color:"#1a1a2e" }}>Policy 3.29 — Key Points</p>
          </div>
          <div className="ib-policy-grid" style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:8 }}>
            {[
              { icon:"calendar",  text:"Quarterly evaluation cycle" },
              { icon:"money",     text:"Budget: Up to 2% of annual profit" },
              { icon:"user",      text:"Open to all employees (L1–L10)" },
              { icon:"award",     text:"CEO Certificate + Innovation Digest feature" },
              { icon:"trending",  text:"Fast-track ESOP eligibility for top innovations" },
              { icon:"shield",    text:"Audited bi-annually by Finance & HR" },
            ].map((h,i)=>(
              <div key={i} style={{ display:"flex", gap:8, alignItems:"flex-start", background:"#f8fafc", borderRadius:8, padding:"9px 12px" }}>
                <div style={{ width:26, height:26, borderRadius:6, background:"#e5e7eb", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <Icon name={h.icon} size={13} color="#374151"/>
                </div>
                <p style={{ margin:0, fontSize:12, color:"#374151", lineHeight:1.5 }}>{h.text}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </EmployeeLayout>
  );
}