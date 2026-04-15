import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import EmployeeLayout from "./EmployeeLayout";
import {
  Users, Linkedin, Briefcase, MapPin, Mail, Phone,
  BookOpen, GitBranch, MessageSquare, Star,
  Calendar, Check, Plus, Pencil,
  RotateCcw, Heart, Globe, Info, RefreshCw, AlertTriangle,
  Zap, UserCheck,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

// ─── Global Styles ─────────────────────────────────────────────
const STYLES = `
  @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin   { to{transform:rotate(360deg)} }

  *, *::before, *::after { box-sizing: border-box !important; }

  .an-page {
    padding: 16px;
    min-height: 100vh;
    background: #f4f6fb;
    font-family: 'Segoe UI', sans-serif;
    overflow-x: hidden;
    box-sizing: border-box;
    width: 100%;
    max-width: 100%;
    position: relative;
  }

  .an-page * {
    max-width: 100%;
    box-sizing: border-box;
  }

  .an-card { animation: fadeUp .3s ease both; }

  /* ── Not Alumni Section ── */
  .an-not-alumni-wrapper {
    width: 100%;
    max-width: 720px;
    margin: 0 auto;
    overflow: hidden;
  }

  .an-not-alumni-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 24px;
  }

  /* ── Alumni Dashboard ── */
  .an-header-row   { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 6px; }
  .an-stat-row     { display: flex; gap: 10px; margin-bottom: 16px; flex-wrap: wrap; }
  .an-tabs         { display: flex; gap: 4px; background: #fff; border-radius: 12px; padding: 4px; border: 1.5px solid #e5e7eb; margin-bottom: 16px; overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .an-profile-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .an-benefit-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
  .an-ref-stat-row { display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; }
  .an-edit-grid    { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding: 16px 20px; }
  .an-tenure-row   { display: flex; gap: 16px; flex-wrap: wrap; font-size: 12px; }
  .an-header-profile { display: flex; justify-content: space-between; align-items: flex-start; gap: 14px; margin-bottom: 12px; }
  .an-badges       { display: flex; gap: 5px; flex-wrap: wrap; }
  .an-header-actions { display: flex; gap: 6px; flex-shrink: 0; flex-wrap: wrap; }

  /* ── Tablet ── */
  @media (max-width: 768px) {
    .an-page { padding: 10px !important; }

    .an-header-row { flex-direction: column !important; align-items: flex-start !important; }
    .an-header-actions { width: 100% !important; }
    .an-header-actions button { flex: 1 !important; font-size: 11px !important; }

    .an-stat-row > div { flex: 1 1 calc(50% - 5px) !important; min-width: 0 !important; }

    .an-tabs button { font-size: 12px !important; padding: 8px 10px !important; white-space: nowrap !important; }

    .an-profile-grid { grid-template-columns: 1fr !important; }
    .an-benefit-grid { grid-template-columns: 1fr 1fr !important; }
    .an-not-alumni-grid { grid-template-columns: 1fr !important; }

    .an-ref-stat-row > div { flex: 1 1 calc(33% - 5px) !important; min-width: 0 !important; }
    .an-timeline-line { display: none !important; }
    .an-header-profile { flex-direction: column !important; align-items: flex-start !important; }
    .an-tenure-row { flex-direction: column !important; gap: 6px !important; }
    .an-edit-grid { grid-template-columns: 1fr !important; }
  }

  /* ── Mobile ── */
  @media (max-width: 480px) {
    .an-page { padding: 8px !important; }
    .an-stat-row > div { flex: 1 1 calc(50% - 4px) !important; }
    .an-benefit-grid { grid-template-columns: 1fr !important; }
    .an-not-alumni-grid { grid-template-columns: 1fr !important; }
    .an-ref-stat-row > div { flex: 1 1 calc(33% - 4px) !important; }
  }

  /* ── Modal ── */
  @media (max-width: 600px) {
    .an-modal-dialog { margin: 8px !important; max-height: 92vh; overflow-y: auto; }
    .an-modal-footer { flex-direction: column !important; }
    .an-modal-footer button { width: 100% !important; }
  }
`;

// ─── Constants ──────────────────────────────────────────────────
const NETWORK_STATUS = {
  active:    { label: "Active",    color: "#10b981", bg: "#ecfdf5" },
  inactive:  { label: "Inactive",  color: "#6b7280", bg: "#f3f4f6" },
  opted_out: { label: "Opted Out", color: "#ef4444", bg: "#fef2f2" },
};

const REFERRAL_TYPES = [
  { value: "candidate", label: "Candidate" },
  { value: "client",    label: "Client" },
  { value: "business",  label: "Business Opportunity" },
];

const ENGAGEMENT_TYPES = [
  { value: "newsletter",      label: "Newsletter" },
  { value: "event",           label: "Event / Meetup" },
  { value: "mentorship",      label: "Mentorship" },
  { value: "referral",        label: "Referral" },
  { value: "rehire_interest", label: "Rehire Interest" },
  { value: "other",           label: "Other" },
];

const REHIRE_STATUS = {
  not_applied: { label: "Not Applied",  color: "#6b7280", bg: "#f3f4f6" },
  interested:  { label: "Interested",   color: "#3b82f6", bg: "#eff6ff" },
  in_process:  { label: "In Process",   color: "#f59e0b", bg: "#fffbeb" },
  rehired:     { label: "Rehired ✓",    color: "#10b981", bg: "#ecfdf5" },
  rejected:    { label: "Not Selected", color: "#ef4444", bg: "#fef2f2" },
};

const labelStyle = {
  fontSize: 11, fontWeight: 700, color: "#6b7280",
  textTransform: "uppercase", letterSpacing: "0.05em",
  marginBottom: 4, display: "block",
};

function getEmployeeId() {
  return (
    localStorage.getItem("employee_id") ||
    localStorage.getItem("employeeId")  ||
    localStorage.getItem("emp_id")      ||
    null
  );
}

// ─── Add Referral Modal ─────────────────────────────────────────
function AddReferralModal({ alumniId, onClose, onSave }) {
  const [form, setForm] = useState({ type: "candidate", name: "", contactInfo: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const inp = { width: "100%", padding: "8px 10px", border: "1.5px solid #e5e7eb", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.5)", zIndex: 1050, display: "flex", alignItems: "center", justifyContent: "center", padding: 12, overflowY: "auto" }}>
      <div className="an-modal-dialog" style={{ background: "#fff", borderRadius: 14, width: "100%", maxWidth: 480, boxShadow: "0 20px 60px rgba(0,0,0,.2)", overflow: "hidden" }}>
        <div style={{ background: "#f9fafb", padding: "14px 18px", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: "#f5f3ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <GitBranch size={15} color="#8b5cf6" />
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>Submit a Referral</p>
              <p style={{ margin: 0, color: "#6b7280", fontSize: 11 }}>Refer a candidate, client, or business opportunity</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, color: "#6b7280", lineHeight: 1, flexShrink: 0, marginLeft: 8 }}>×</button>
        </div>
        <div style={{ padding: "14px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={labelStyle}>Referral Type</label>
            <select style={inp} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
              {REFERRAL_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Name *</label>
            <input style={inp} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Person or company name" />
          </div>
          <div>
            <label style={labelStyle}>Contact Info</label>
            <input style={inp} value={form.contactInfo} onChange={e => setForm(f => ({ ...f, contactInfo: e.target.value }))} placeholder="Email or phone number" />
          </div>
          <div>
            <label style={labelStyle}>Notes</label>
            <textarea style={{ ...inp, resize: "vertical", minHeight: 80 }} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Why are you referring them?" />
          </div>
          <div style={{ background: "#eff6ff", borderRadius: 8, padding: "10px 12px", fontSize: 12, color: "#1d4ed8", display: "flex", gap: 6, alignItems: "flex-start" }}>
            <Info size={13} style={{ flexShrink: 0, marginTop: 1 }} />
            Your referral will be reviewed by HR. You'll be notified on updates.
          </div>
        </div>
        <div className="an-modal-footer" style={{ padding: "12px 18px", borderTop: "1px solid #e5e7eb", display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "10px", border: "1.5px solid #e5e7eb", borderRadius: 9, background: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
          <button disabled={saving || !form.name}
            onClick={async () => { setSaving(true); await onSave(alumniId, form); setSaving(false); }}
            style={{ flex: 1, padding: "10px", border: "none", borderRadius: 9, background: saving || !form.name ? "#9ca3af" : "#8b5cf6", color: "#fff", fontSize: 13, fontWeight: 700, cursor: saving || !form.name ? "not-allowed" : "pointer" }}>
            {saving ? "Submitting..." : "Submit Referral"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Edit Profile Modal ─────────────────────────────────────────
function EditProfileModal({ alumni, onClose, onSave }) {
  const [form, setForm] = useState({
    linkedIn:            alumni.linkedIn            || "",
    currentCompany:      alumni.currentCompany      || "",
    currentRole:         alumni.currentRole         || "",
    currentCity:         alumni.currentCity         || "",
    phone:               alumni.phone               || "",
    mentorshipAvailable: alumni.mentorshipAvailable || false,
    mentorshipDomains:   alumni.mentorshipDomains?.join(", ") || "",
  });
  const [saving, setSaving] = useState(false);
  const inp = { width: "100%", padding: "9px 12px", border: "1.5px solid #e5e7eb", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.5)", zIndex: 1050, display: "flex", alignItems: "center", justifyContent: "center", padding: 12, overflowY: "auto" }}>
      <div className="an-modal-dialog" style={{ background: "#fff", borderRadius: 14, width: "100%", maxWidth: 560, boxShadow: "0 20px 60px rgba(0,0,0,.2)", overflow: "hidden", margin: "auto" }}>
        <div style={{ background: "#f9fafb", padding: "14px 18px", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Pencil size={15} color="#3b82f6" />
            <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>Update My Profile</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, color: "#6b7280", lineHeight: 1, flexShrink: 0 }}>×</button>
        </div>
        <div className="an-edit-grid">
          {[
            { label: "LinkedIn URL",    key: "linkedIn",       placeholder: "https://linkedin.com/in/...", colSpan: 2 },
            { label: "Phone",           key: "phone",          placeholder: "+91 XXXXX XXXXX" },
            { label: "Current Company", key: "currentCompany", placeholder: "e.g. TCS, Infosys..." },
            { label: "Current Role",    key: "currentRole",    placeholder: "e.g. Senior Manager" },
            { label: "Current City",    key: "currentCity",    placeholder: "e.g. Chennai, Bangalore" },
          ].map(f => (
            <div key={f.key} style={{ gridColumn: f.colSpan ? "1 / -1" : "auto" }}>
              <label style={labelStyle}>{f.label}</label>
              <input style={inp} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder} />
            </div>
          ))}
          <div style={{ gridColumn: "1 / -1" }}>
            <div style={{ background: "#f5f3ff", borderRadius: 9, padding: "12px 14px", border: "1px solid #ddd6fe", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ position: "relative", width: 40, height: 22, flexShrink: 0 }}>
                <input type="checkbox" checked={form.mentorshipAvailable}
                  onChange={e => setForm(p => ({ ...p, mentorshipAvailable: e.target.checked }))}
                  style={{ opacity: 0, position: "absolute", inset: 0, cursor: "pointer", zIndex: 1, margin: 0 }} />
                <div style={{ position: "absolute", inset: 0, background: form.mentorshipAvailable ? "#8b5cf6" : "#d1d5db", borderRadius: 99, transition: "background .2s" }} />
                <div style={{ position: "absolute", top: 2, left: form.mentorshipAvailable ? 20 : 2, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left .2s", boxShadow: "0 1px 3px rgba(0,0,0,.2)" }} />
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 13 }}>Available for Mentorship</p>
                <p style={{ margin: 0, color: "#6b7280", fontSize: 11 }}>Guide current Radnus employees in your domain</p>
              </div>
            </div>
          </div>
          {form.mentorshipAvailable && (
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Mentorship Domains (comma separated)</label>
              <input style={inp} value={form.mentorshipDomains}
                onChange={e => setForm(p => ({ ...p, mentorshipDomains: e.target.value }))}
                placeholder="e.g. Sales, Technology, Leadership" />
            </div>
          )}
        </div>
        <div className="an-modal-footer" style={{ padding: "12px 18px", borderTop: "1px solid #e5e7eb", display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "10px", border: "1.5px solid #e5e7eb", borderRadius: 9, background: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
          <button disabled={saving}
            onClick={async () => {
              setSaving(true);
              await onSave({ ...form, mentorshipDomains: form.mentorshipDomains ? form.mentorshipDomains.split(",").map(d => d.trim()).filter(Boolean) : [] });
              setSaving(false);
            }}
            style={{ flex: 1, padding: "10px", border: "none", borderRadius: 9, background: saving ? "#9ca3af" : "#3b82f6", color: "#fff", fontSize: 13, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer" }}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Stat Card ──────────────────────────────────────────────────
function StatCard({ icon, label, value, color, bg }) {
  return (
    <div style={{ background: bg, borderRadius: 10, padding: "10px 12px", display: "flex", gap: 8, alignItems: "center", border: `1px solid ${color}22`, flex: 1, minWidth: 0, overflow: "hidden" }}>
      <div style={{ width: 30, height: 30, borderRadius: 8, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {React.cloneElement(icon, { size: 15, color })}
      </div>
      <div style={{ minWidth: 0, overflow: "hidden" }}>
        <p style={{ margin: 0, fontSize: 17, fontWeight: 900, color, lineHeight: 1 }}>{value}</p>
        <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.4px", opacity: 0.8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</p>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────
export default function AlumniNetworkEmployee() {
  const [alumni, setAlumni]       = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [modal, setModal]         = useState(null);
  const [toast, setToast]         = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  const employeeId = getEmployeeId();

  const showMsg = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchAlumni = useCallback(async () => {
    if (!employeeId) { setError("session"); setLoading(false); return; }
    setLoading(true); setError(null);
    try {
      const res = await axios.get(`${API_BASE}/api/alumni`, { params: { employeeRef: employeeId } });
      const myAlumni = (res.data.data || []).find(
        a => a.employeeId?._id === employeeId || a.employeeId === employeeId
      );
      setAlumni(myAlumni || null);
    } catch (e) {
      if (e?.response?.status === 404) setAlumni(null);
      else setError(e?.response?.data?.message || "Failed to load");
    } finally { setLoading(false); }
  }, [employeeId]);

  useEffect(() => { fetchAlumni(); }, [fetchAlumni]);

  const handleUpdateProfile = async (data) => {
    try {
      await axios.put(`${API_BASE}/api/alumni/${alumni._id}`, data);
      showMsg("Profile updated successfully!");
      setModal(null); fetchAlumni();
    } catch (e) { showMsg(e?.response?.data?.message || "Failed", "error"); }
  };

  const handleAddReferral = async (id, data) => {
    try {
      await axios.post(`${API_BASE}/api/alumni/${id}/referral`, data);
      showMsg("Referral submitted! HR will review it.");
      setModal(null); fetchAlumni();
    } catch (e) { showMsg(e?.response?.data?.message || "Failed", "error"); }
  };

  // ── Loading ──────────────────────────────────────────────────
  if (loading) return (
    <EmployeeLayout>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: 80 }}>
        <div style={{ width: 36, height: 36, border: "3px solid #e5e7eb", borderTopColor: "#10b981", borderRadius: "50%", animation: "spin .8s linear infinite" }} />
      </div>
    </EmployeeLayout>
  );

  if (error === "session") return (
    <EmployeeLayout>
      <div style={{ textAlign: "center", padding: 60 }}>
        <AlertTriangle size={40} color="#f59e0b" style={{ marginBottom: 12 }} />
        <h5 style={{ color: "#6b7280" }}>Session expired.</h5>
        <p style={{ color: "#9ca3af" }}>Please login again.</p>
      </div>
    </EmployeeLayout>
  );

  if (error) return (
    <EmployeeLayout>
      <div style={{ margin: 16, padding: 14, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, color: "#dc2626", fontSize: 13 }}>{error}</div>
    </EmployeeLayout>
  );

  // ── NOT ALUMNI ───────────────────────────────────────────────
  if (!alumni) return (
    <EmployeeLayout>
      <style>{STYLES}</style>
      <div className="an-page">
        <div className="an-not-alumni-wrapper">

          {/* Hero */}
          <div style={{ textAlign: "center", marginBottom: 24, padding: "0 4px" }}>
            <div style={{ width: 68, height: 68, borderRadius: "50%", background: "linear-gradient(135deg,#10b981,#3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
              <Users size={30} color="#fff" />
            </div>
            <h4 style={{ margin: "0 0 4px", fontWeight: 800, fontSize: 18, wordBreak: "break-word", overflowWrap: "break-word" }}>
              Radnus Alumni Network
            </h4>
            <p style={{ margin: 0, color: "#6b7280", fontSize: 12, wordBreak: "break-word", overflowWrap: "break-word" }}>
              Policy 3.40 — Ex-Radnus Employees as Brand Advocates
            </p>
          </div>

          {/* Banner */}
          <div style={{ background: "#fff", borderRadius: 12, padding: "14px 16px", marginBottom: 20, borderLeft: "4px solid #10b981", boxShadow: "0 1px 4px rgba(0,0,0,.06)", overflow: "hidden" }}>
            <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: 14, wordBreak: "break-word" }}>
              You are not yet part of the Alumni Network.
            </p>
            <p style={{ margin: 0, color: "#6b7280", fontSize: 13, lineHeight: 1.6, wordBreak: "break-word", overflowWrap: "break-word" }}>
              When you complete your journey at Radnus, you'll automatically be added to our Alumni Network — a lifelong community of ex-Radnus professionals.
            </p>
          </div>

          {/* Benefits label */}
          <p style={{ margin: "0 0 12px", fontWeight: 700, fontSize: 14 }}>What Alumni Members Get:</p>

          {/* Benefits grid */}
          <div className="an-not-alumni-grid">
            {[
              { icon: <Globe size={17} />,        color: "#10b981", bg: "#ecfdf5", title: "Alumni Portal Access",    desc: "Dedicated networking platform with career updates" },
              { icon: <MessageSquare size={17} />, color: "#3b82f6", bg: "#eff6ff", title: "Monthly Newsletter",      desc: "Company news, events, and industry updates" },
              { icon: <BookOpen size={17} />,     color: "#8b5cf6", bg: "#f5f3ff", title: "Mentorship Opportunities", desc: "Guide current Radnus HiPo & leadership track members" },
              { icon: <GitBranch size={17} />,    color: "#f59e0b", bg: "#fffbeb", title: "Referral Incentives",      desc: "Refer candidates, clients, or business opportunities" },
              { icon: <RotateCcw size={17} />,    color: "#ef4444", bg: "#fef2f2", title: "Rehire Program",           desc: "Fast-track rehire for high-performing alumni" },
              { icon: <Star size={17} />,         color: "#10b981", bg: "#ecfdf5", title: "Recognition & Awards",     desc: "Highlighted in events, newsletters & digital boards" },
            ].map((item, i) => (
              <div key={i} style={{ background: "#fff", borderRadius: 11, padding: "12px", boxShadow: "0 1px 4px rgba(0,0,0,.06)", display: "flex", gap: 10, alignItems: "flex-start", overflow: "hidden", minWidth: 0 }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: item.bg, display: "flex", alignItems: "center", justifyContent: "center", color: item.color, flexShrink: 0 }}>{item.icon}</div>
                <div style={{ minWidth: 0, overflow: "hidden" }}>
                  <p style={{ margin: "0 0 2px", fontWeight: 700, fontSize: 13, wordBreak: "break-word" }}>{item.title}</p>
                  <p style={{ margin: 0, color: "#6b7280", fontSize: 12, wordBreak: "break-word" }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Components Table */}
          <div style={{ background: "#fff", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,.06)" }}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid #f3f4f6" }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>Alumni Network Components</p>
            </div>
            <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 460 }}>
                <thead>
                  <tr style={{ background: "#f9fafb" }}>
                    {["Component", "Description", "Frequency"].map(h => (
                      <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, color: "#6b7280", fontSize: 11, textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { component: "Alumni Portal",        desc: "Networking tools, discussion forums, career updates",              freq: "Continuous" },
                    { component: "Regular Newsletters",  desc: "Company achievements, new products, Radnus Day, events",           freq: "Monthly" },
                    { component: "Rehire Program",       desc: "Encourage former high-performers to rejoin critical roles",        freq: "On-demand" },
                    { component: "Mentorship",           desc: "Alumni guide current employees, especially HiPo members",          freq: "Quarterly" },
                    { component: "Referral Program",     desc: "Alumni incentivized to refer clients, talent, or business",        freq: "Ongoing" },
                    { component: "Networking Events",    desc: "Annual or semi-annual alumni meetups, virtual or on-site",         freq: "Annual / Bi-Annual" },
                    { component: "Recognition & Awards", desc: "Highlight notable alumni in newsletters and digital leaderboards", freq: "Quarterly" },
                  ].map((r, i) => (
                    <tr key={i} style={{ borderTop: "1px solid #f3f4f6" }}>
                      <td style={{ padding: "10px 14px", fontWeight: 600, whiteSpace: "nowrap" }}>{r.component}</td>
                      <td style={{ padding: "10px 14px", color: "#6b7280" }}>{r.desc}</td>
                      <td style={{ padding: "10px 14px" }}>
                        <span style={{ background: "#f3f4f6", padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 600, whiteSpace: "nowrap" }}>{r.freq}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </EmployeeLayout>
  );

  // ── ALUMNI DASHBOARD ─────────────────────────────────────────
  const ns = NETWORK_STATUS[alumni.networkStatus] || NETWORK_STATUS.active;
  const rs = REHIRE_STATUS[alumni.rehireStatus]   || REHIRE_STATUS.not_applied;
  const totalReferrals     = alumni.referrals?.length || 0;
  const convertedReferrals = alumni.referrals?.filter(r => r.status === "converted").length || 0;
  const totalEngagements   = alumni.engagementLog?.length || 0;
  const totalSessions      = alumni.mentorshipSessions?.length || 0;

  return (
    <EmployeeLayout>
      <style>{STYLES}</style>

      {toast && (
        <div style={{ position: "fixed", top: 16, right: 12, left: 12, zIndex: 9999, background: toast.type === "error" ? "#ef4444" : "#10b981", color: "#fff", padding: "12px 18px", borderRadius: 10, fontWeight: 600, fontSize: 14, boxShadow: "0 8px 24px rgba(0,0,0,.2)", animation: "fadeUp .3s ease", display: "flex", alignItems: "center", gap: 8 }}>
          {toast.msg}
        </div>
      )}

      {modal === "referral" && <AddReferralModal alumniId={alumni._id} onClose={() => setModal(null)} onSave={handleAddReferral} />}
      {modal === "edit"     && <EditProfileModal alumni={alumni} onClose={() => setModal(null)} onSave={handleUpdateProfile} />}

      <div className="an-page">

        {/* Page Header */}
        <div style={{ marginBottom: 14 }}>
          <div className="an-header-row">
            <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
              <div style={{ width: 40, height: 40, borderRadius: 11, background: "#fff", border: "1.5px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Users size={20} color="#10b981" />
              </div>
              <div style={{ minWidth: 0 }}>
                <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#1a1a2e", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Alumni Network</h2>
                <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>Your alumni profile, referrals & engagement</p>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Card */}
        <div className="an-card" style={{ background: "linear-gradient(135deg,#ecfdf5 0%,#eff6ff 100%)", borderRadius: 14, padding: "14px", marginBottom: 12, border: "1px solid #6ee7b7", boxShadow: "0 1px 6px rgba(0,0,0,.06)", overflow: "hidden" }}>
          <div className="an-header-profile">
            <div style={{ display: "flex", gap: 10, alignItems: "center", flex: 1, minWidth: 0 }}>
              <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "#fff", fontSize: 20, flexShrink: 0 }}>
                {alumni.name?.charAt(0)}
              </div>
              <div style={{ minWidth: 0 }}>
                <h4 style={{ margin: "0 0 2px", fontWeight: 800, fontSize: 15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{alumni.name}</h4>
                <p style={{ margin: "0 0 5px", color: "#4b5563", fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{alumni.designation} · {alumni.department}</p>
                <div className="an-badges">
                  <span style={{ background: ns.bg, color: ns.color, border: `1px solid ${ns.color}33`, borderRadius: 20, padding: "2px 8px", fontSize: 10, fontWeight: 700 }}>{ns.label}</span>
                  {alumni.isBrandAmbassador && <span style={{ background: "#fffbeb", color: "#d97706", border: "1px solid #fcd34d", borderRadius: 20, padding: "2px 8px", fontSize: 10, fontWeight: 700 }}>⭐ Ambassador</span>}
                  {alumni.mentorshipAvailable && <span style={{ background: "#f5f3ff", color: "#8b5cf6", border: "1px solid #ddd6fe", borderRadius: 20, padding: "2px 8px", fontSize: 10, fontWeight: 700 }}>Mentor</span>}
                  {alumni.isRehireEligible && <span style={{ background: "#eff6ff", color: "#3b82f6", border: "1px solid #bfdbfe", borderRadius: 20, padding: "2px 8px", fontSize: 10, fontWeight: 700 }}>Rehire Eligible</span>}
                  {alumni.tags?.map(t => <span key={t} style={{ background: "#f3f4f6", color: "#374151", borderRadius: 20, padding: "2px 7px", fontSize: 10, fontWeight: 600 }}>{t}</span>)}
                </div>
              </div>
            </div>
            <div className="an-header-actions">
              <button onClick={() => setModal("edit")} style={{ padding: "7px 11px", border: "1.5px solid #3b82f6", borderRadius: 9, background: "#fff", color: "#3b82f6", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>
                <Pencil size={11} /> Edit
              </button>
              <button onClick={() => setModal("referral")} style={{ padding: "7px 11px", border: "none", borderRadius: 9, background: "#10b981", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>
                <GitBranch size={11} /> Refer
              </button>
              <button onClick={fetchAlumni} style={{ padding: "7px 9px", border: "1.5px solid #e5e7eb", borderRadius: 9, background: "#fff", cursor: "pointer", display: "flex", alignItems: "center" }}>
                <RefreshCw size={13} color="#6b7280" />
              </button>
            </div>
          </div>
          <div className="an-tenure-row">
            <span style={{ color: "#4b5563", display: "flex", alignItems: "center", gap: 4 }}>
              <Calendar size={11} color="#6b7280" /> Tenure: <strong style={{ marginLeft: 3 }}>{alumni.tenure || "—"}</strong>
            </span>
            <span style={{ color: "#4b5563" }}>
              Relieved: <strong>{alumni.relievingDate ? new Date(alumni.relievingDate).toLocaleDateString("en-IN") : "—"}</strong>
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              Rehire: <span style={{ background: rs.bg, color: rs.color, borderRadius: 20, padding: "1px 8px", fontSize: 10, fontWeight: 700, marginLeft: 3 }}>{rs.label}</span>
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="an-stat-row">
          <StatCard icon={<GitBranch />}     label="Referrals"   value={`${totalReferrals}`} color="#8b5cf6" bg="#f5f3ff" />
          <StatCard icon={<MessageSquare />} label="Engagements" value={totalEngagements}    color="#3b82f6" bg="#eff6ff" />
          <StatCard icon={<BookOpen />}      label="Mentorship"  value={totalSessions}       color="#10b981" bg="#ecfdf5" />
          <StatCard icon={<UserCheck />}     label="Status"      value={ns.label}            color={ns.color} bg={ns.bg} />
        </div>

        {/* Tabs */}
        <div className="an-tabs">
          {[
            { key: "overview",   label: "Overview",                         icon: <Users size={12} /> },
            { key: "referrals",  label: `Referrals (${totalReferrals})`,    icon: <GitBranch size={12} /> },
            { key: "engagement", label: `Engagement (${totalEngagements})`, icon: <MessageSquare size={12} /> },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              style={{ padding: "9px 13px", border: "none", borderRadius: 9, cursor: "pointer", fontWeight: 600, fontSize: 12, background: activeTab === tab.key ? "#1a1a2e" : "transparent", color: activeTab === tab.key ? "#fff" : "#6b7280", transition: "all .2s", display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap", flexShrink: 0 }}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ── */}
        {activeTab === "overview" && (
          <div className="an-profile-grid">
            {/* My Profile */}
            <div className="an-card" style={{ background: "#fff", borderRadius: 13, padding: 14, boxShadow: "0 1px 4px rgba(0,0,0,.06)", overflow: "hidden" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>My Profile</p>
                <button onClick={() => setModal("edit")} style={{ background: "none", border: "1px solid #e5e7eb", borderRadius: 7, padding: "4px 9px", fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", gap: 3, color: "#6b7280", flexShrink: 0 }}>
                  <Pencil size={10} /> Edit
                </button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {alumni.email && (
                  <div style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
                    <Mail size={13} color="#6b7280" style={{ flexShrink: 0 }} />
                    <span style={{ wordBreak: "break-all", fontSize: 12 }}>{alumni.email}</span>
                  </div>
                )}
                {alumni.phone && (
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <Phone size={13} color="#6b7280" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: 12 }}>{alumni.phone}</span>
                  </div>
                )}
                {alumni.currentCompany ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
                    <Briefcase size={13} color="#6b7280" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{alumni.currentRole} @ {alumni.currentCompany}</span>
                  </div>
                ) : (
                  <p style={{ margin: 0, color: "#9ca3af", fontSize: 12 }}>
                    Current company not updated.{" "}
                    <button onClick={() => setModal("edit")} style={{ background: "none", border: "none", color: "#3b82f6", fontSize: 12, cursor: "pointer", padding: 0, fontWeight: 600 }}>Update →</button>
                  </p>
                )}
                {alumni.currentCity && (
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <MapPin size={13} color="#6b7280" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: 12 }}>{alumni.currentCity}</span>
                  </div>
                )}
                {alumni.linkedIn ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <Linkedin size={13} color="#0077b5" style={{ flexShrink: 0 }} />
                    <a href={alumni.linkedIn} target="_blank" rel="noreferrer" style={{ color: "#0077b5", fontSize: 12 }}>LinkedIn Profile</a>
                  </div>
                ) : (
                  <p style={{ margin: 0, color: "#9ca3af", fontSize: 12 }}>
                    LinkedIn not linked.{" "}
                    <button onClick={() => setModal("edit")} style={{ background: "none", border: "none", color: "#3b82f6", fontSize: 12, cursor: "pointer", padding: 0, fontWeight: 600 }}>Add →</button>
                  </p>
                )}
              </div>
            </div>

            {/* Mentorship */}
            <div className="an-card" style={{ background: "#fff", borderRadius: 13, padding: 14, boxShadow: "0 1px 4px rgba(0,0,0,.06)", borderLeft: `4px solid ${alumni.mentorshipAvailable ? "#8b5cf6" : "#e5e7eb"}`, overflow: "hidden" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>Mentorship</p>
                <button onClick={() => setModal("edit")} style={{ background: "none", border: "1px solid #e5e7eb", borderRadius: 7, padding: "4px 9px", fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", gap: 3, color: "#6b7280", flexShrink: 0 }}>
                  <Pencil size={10} /> {alumni.mentorshipAvailable ? "Edit" : "Enable"}
                </button>
              </div>
              {alumni.mentorshipAvailable ? (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
                    <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#f5f3ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Check size={12} color="#8b5cf6" />
                    </div>
                    <span style={{ fontWeight: 600, fontSize: 12, color: "#8b5cf6" }}>Available for mentorship</span>
                  </div>
                  {alumni.mentorshipDomains?.length > 0 && (
                    <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 10 }}>
                      {alumni.mentorshipDomains.map((d, i) => (
                        <span key={i} style={{ background: "#8b5cf6", color: "#fff", borderRadius: 20, padding: "2px 8px", fontSize: 11, fontWeight: 600 }}>{d}</span>
                      ))}
                    </div>
                  )}
                  <div style={{ background: "#f9fafb", borderRadius: 8, padding: "7px 10px" }}>
                    <p style={{ margin: 0, color: "#6b7280", fontSize: 12 }}>Sessions: <strong>{totalSessions}</strong></p>
                  </div>
                  {alumni.mentorshipSessions?.length > 0 && (
                    <div style={{ marginTop: 10 }}>
                      <p style={{ margin: "0 0 6px", fontWeight: 600, fontSize: 12 }}>Recent Sessions:</p>
                      {alumni.mentorshipSessions.slice(-3).reverse().map((s, i) => (
                        <div key={i} style={{ borderLeft: "3px solid #8b5cf6", paddingLeft: 9, marginBottom: 7 }}>
                          <p style={{ margin: 0, fontWeight: 600, fontSize: 12 }}>{s.menteeName || "—"}</p>
                          <p style={{ margin: 0, color: "#6b7280", fontSize: 11 }}>{new Date(s.date).toLocaleDateString("en-IN")}</p>
                          {s.notes && <p style={{ margin: 0, color: "#6b7280", fontSize: 11 }}>{s.notes}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <p style={{ margin: "0 0 8px", color: "#6b7280", fontSize: 13, lineHeight: 1.6 }}>Guide current Radnus employees — especially HiPo and Leadership Track members.</p>
                  <ul style={{ color: "#6b7280", fontSize: 12, paddingLeft: 16, marginBottom: 10 }}>
                    <li>Quarterly 1-on-1 sessions</li>
                    <li>Project-based advisory</li>
                    <li>Track goals & career growth</li>
                  </ul>
                  <button onClick={() => setModal("edit")} style={{ padding: "7px 12px", border: "1.5px solid #8b5cf6", borderRadius: 8, background: "#fff", color: "#8b5cf6", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                    <Plus size={11} /> Enable Mentorship
                  </button>
                </div>
              )}
            </div>

            {/* Benefits — full width */}
            <div className="an-card" style={{ gridColumn: "1 / -1", background: "#fff", borderRadius: 13, padding: 14, boxShadow: "0 1px 4px rgba(0,0,0,.06)" }}>
              <p style={{ margin: "0 0 12px", fontWeight: 700, fontSize: 14 }}>Your Alumni Benefits</p>
              <div className="an-benefit-grid">
                {[
                  { icon: <Globe size={15} />,        color: "#10b981", bg: "#ecfdf5", title: "Alumni Portal",       desc: "Access networking tools, discussion forums, and career updates" },
                  { icon: <MessageSquare size={15} />, color: "#3b82f6", bg: "#eff6ff", title: "Monthly Newsletter",  desc: "Stay updated with Radnus news, events, and industry insights" },
                  { icon: <GitBranch size={15} />,     color: "#8b5cf6", bg: "#f5f3ff", title: "Referral Incentives", desc: "Earn rewards for referring candidates, clients, or business leads" },
                  { icon: <RotateCcw size={15} />,     color: "#f59e0b", bg: "#fffbeb", title: "Rehire Program",      desc: "Fast-tracked rehire process for eligible alumni" },
                  { icon: <Star size={15} />,          color: "#ef4444", bg: "#fef2f2", title: "Recognition",         desc: "Highlighted in newsletters, events, and digital leaderboards" },
                  { icon: <Heart size={15} />,         color: "#10b981", bg: "#ecfdf5", title: "Culture Bond",        desc: "Career milestone celebrations, birthdays, notable achievements" },
                ].map((b, i) => (
                  <div key={i} style={{ display: "flex", gap: 9, alignItems: "flex-start", minWidth: 0, overflow: "hidden" }}>
                    <div style={{ width: 28, height: 28, borderRadius: 7, background: b.bg, display: "flex", alignItems: "center", justifyContent: "center", color: b.color, flexShrink: 0 }}>{b.icon}</div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ margin: "0 0 2px", fontWeight: 600, fontSize: 12, wordBreak: "break-word" }}>{b.title}</p>
                      <p style={{ margin: 0, color: "#6b7280", fontSize: 11, lineHeight: 1.4, wordBreak: "break-word" }}>{b.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── REFERRALS ── */}
        {activeTab === "referrals" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>My Referrals</p>
              <button onClick={() => setModal("referral")} style={{ padding: "8px 13px", border: "none", borderRadius: 9, background: "#10b981", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                <Plus size={12} /> New Referral
              </button>
            </div>
            <div className="an-ref-stat-row">
              {[
                { label: "Total",     value: totalReferrals,                                                    color: "#8b5cf6", bg: "#f5f3ff" },
                { label: "Pending",   value: alumni.referrals?.filter(r => r.status === "pending").length || 0, color: "#f59e0b", bg: "#fffbeb" },
                { label: "Converted", value: convertedReferrals,                                                color: "#10b981", bg: "#ecfdf5" },
              ].map((s, i) => (
                <div key={i} style={{ flex: 1, background: s.bg, borderRadius: 10, padding: "11px 12px", textAlign: "center", border: `1px solid ${s.color}22`, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 20, fontWeight: 900, color: s.color }}>{s.value}</p>
                  <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: s.color, textTransform: "uppercase", opacity: 0.8 }}>{s.label}</p>
                </div>
              ))}
            </div>
            {alumni.referrals?.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[...alumni.referrals].reverse().map((r, i) => (
                  <div key={i} className="an-card" style={{ background: "#fff", borderRadius: 12, padding: "13px 14px", boxShadow: "0 1px 4px rgba(0,0,0,.06)", overflow: "hidden" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: "0 0 3px", fontWeight: 700, fontSize: 14, wordBreak: "break-word" }}>{r.name}</p>
                        <p style={{ margin: "0 0 2px", color: "#6b7280", fontSize: 12 }}>{REFERRAL_TYPES.find(t => t.value === r.type)?.label} · {new Date(r.date).toLocaleDateString("en-IN")}</p>
                        {r.contactInfo && <p style={{ margin: 0, color: "#9ca3af", fontSize: 11, wordBreak: "break-all" }}>{r.contactInfo}</p>}
                        {r.notes && <p style={{ margin: "5px 0 0", fontSize: 12 }}>{r.notes}</p>}
                      </div>
                      <span style={{ background: r.status === "converted" ? "#ecfdf5" : r.status === "closed" ? "#fef2f2" : "#fffbeb", color: r.status === "converted" ? "#059669" : r.status === "closed" ? "#dc2626" : "#d97706", padding: "4px 9px", borderRadius: 20, fontSize: 11, fontWeight: 700, flexShrink: 0, border: "1px solid currentColor", whiteSpace: "nowrap" }}>
                        {r.status === "converted" ? "✓ Converted" : r.status === "closed" ? "Closed" : "Pending"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "44px 20px", background: "#fff", borderRadius: 14, border: "1.5px solid #e5e7eb" }}>
                <GitBranch size={34} color="#d1d5db" style={{ marginBottom: 10 }} />
                <p style={{ margin: "0 0 4px", color: "#374151", fontWeight: 600 }}>No referrals yet.</p>
                <p style={{ margin: "0 0 14px", color: "#9ca3af", fontSize: 13 }}>Refer a candidate, client, or business opportunity!</p>
                <button onClick={() => setModal("referral")} style={{ padding: "9px 20px", border: "none", borderRadius: 9, background: "#10b981", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <Plus size={13} /> Submit First Referral
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── ENGAGEMENT ── */}
        {activeTab === "engagement" && (
          <div>
            <p style={{ margin: "0 0 14px", fontWeight: 700, fontSize: 14 }}>Engagement History</p>
            {alumni.engagementLog?.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {[...alumni.engagementLog].reverse().map((e, i) => (
                  <div key={i} style={{ display: "flex", gap: 10 }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #bfdbfe" }}>
                        <Zap size={13} color="#3b82f6" />
                      </div>
                      {i < alumni.engagementLog.length - 1 && (
                        <div className="an-timeline-line" style={{ width: 1, flex: 1, background: "#e5e7eb", marginTop: 2 }} />
                      )}
                    </div>
                    <div style={{ paddingTop: 5, paddingBottom: 14, flex: 1, minWidth: 0 }}>
                      <div style={{ background: "#fff", borderRadius: 10, padding: "9px 12px", boxShadow: "0 1px 3px rgba(0,0,0,.06)", overflow: "hidden" }}>
                        <p style={{ margin: "0 0 2px", fontWeight: 600, fontSize: 13, wordBreak: "break-word" }}>{e.note}</p>
                        <p style={{ margin: 0, color: "#9ca3af", fontSize: 11 }}>
                          {ENGAGEMENT_TYPES.find(t => t.value === e.type)?.label || e.type} · {new Date(e.date).toLocaleDateString("en-IN")} · by {e.addedBy}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "44px 20px", background: "#fff", borderRadius: 14, border: "1.5px solid #e5e7eb" }}>
                <MessageSquare size={34} color="#d1d5db" style={{ marginBottom: 10 }} />
                <p style={{ margin: "0 0 4px", color: "#374151", fontWeight: 600 }}>No engagement activities yet.</p>
                <p style={{ margin: 0, color: "#9ca3af", fontSize: 13 }}>HR will log your interactions — events, newsletters, mentorship sessions, and more.</p>
              </div>
            )}
          </div>
        )}

      </div>
    </EmployeeLayout>
  );
}