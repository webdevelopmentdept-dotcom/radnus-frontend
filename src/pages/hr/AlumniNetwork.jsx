import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  Users, UserPlus, Search, RefreshCw, Plus, Pencil, X, Check,
  Briefcase, MapPin, Mail, Phone, Linkedin, Star, Award,
  MessageSquare, GitBranch, RotateCcw, ChevronRight,
  TrendingUp, BookOpen, Target, Info, Calendar, Filter,
  Globe, Heart, Zap, BarChart2, UserCheck, ExternalLink,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

// ─── Constants ────────────────────────────────────────────────
const NETWORK_STATUS = {
  active:    { label: "Active",     color: "#10b981", bg: "#ecfdf5" },
  inactive:  { label: "Inactive",   color: "#6b7280", bg: "#f3f4f6" },
  opted_out: { label: "Opted Out",  color: "#ef4444", bg: "#fef2f2" },
};

const EXIT_REASONS = [
  { value: "resignation",    label: "Resignation" },
  { value: "termination",    label: "Termination" },
  { value: "contract_end",   label: "Contract End" },
  { value: "retirement",     label: "Retirement" },
  { value: "other",          label: "Other" },
];

const ENGAGEMENT_TYPES = [
  { value: "newsletter",      label: "Newsletter" },
  { value: "event",           label: "Event / Meetup" },
  { value: "mentorship",      label: "Mentorship" },
  { value: "referral",        label: "Referral" },
  { value: "rehire_interest", label: "Rehire Interest" },
  { value: "other",           label: "Other" },
];

const REFERRAL_TYPES = [
  { value: "candidate", label: "Candidate" },
  { value: "client",    label: "Client" },
  { value: "business",  label: "Business Opportunity" },
];

const REHIRE_STATUS = {
  not_applied: { label: "Not Applied", color: "#6b7280", bg: "#f3f4f6" },
  interested:  { label: "Interested",  color: "#3b82f6", bg: "#eff6ff" },
  in_process:  { label: "In Process",  color: "#f59e0b", bg: "#fffbeb" },
  rehired:     { label: "Rehired",     color: "#10b981", bg: "#ecfdf5" },
  rejected:    { label: "Rejected",    color: "#ef4444", bg: "#fef2f2" },
};

const labelStyle = {
  fontSize: 11, fontWeight: 700, color: "#6b7280",
  textTransform: "uppercase", letterSpacing: "0.05em",
  marginBottom: 4, display: "block",
};

// ─── Stat Card ────────────────────────────────────────────────
function StatCard({ label, value, color, bg, icon }) {
  return (
    <div className="card border-0 shadow-sm" style={{ borderRadius: 11 }}>
      <div className="card-body py-3 d-flex justify-content-between align-items-center">
        <div>
          <p className="mb-0 text-muted" style={{ fontSize: 11, textTransform: "uppercase", fontWeight: 700 }}>{label}</p>
          <p className="mb-0 fw-bold" style={{ fontSize: 24, color }}>{value}</p>
        </div>
        <span style={{ width: 38, height: 38, borderRadius: 9, background: bg, display: "flex", alignItems: "center", justifyContent: "center", color }}>
          {icon}
        </span>
      </div>
    </div>
  );
}

// ─── Create Alumni Modal ──────────────────────────────────────
function CreateAlumniModal({ employees, onClose, onSave }) {
  const [form, setForm] = useState({
    employeeId: "", relievingDate: "", exitReason: "resignation",
    linkedIn: "", currentCompany: "", currentRole: "", currentCity: "",
    isRehireEligible: true, hrNotes: "", tags: "",
  });
  const [saving, setSaving] = useState(false);

  const handle = async () => {
    if (!form.employeeId || !form.relievingDate)
      return alert("Employee and Relieving Date are required");
    setSaving(true);
    await onSave({
      ...form,
      tags: form.tags ? form.tags.split(",").map(t => t.trim()).filter(Boolean) : [],
    });
    setSaving(false);
  };

  return (
    <div className="modal show d-block" style={{ background: "rgba(15,23,42,.45)", zIndex: 1050 }}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: 14 }}>
          <div className="modal-header border-bottom" style={{ background: "#f9fafb", borderRadius: "14px 14px 0 0" }}>
            <div className="d-flex align-items-center gap-2">
              <div style={{ width: 34, height: 34, borderRadius: 9, background: "#ecfdf5", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <UserPlus size={16} color="#10b981" />
              </div>
              <div>
                <p className="mb-0 fw-bold" style={{ fontSize: 14 }}>Add Alumni Profile</p>
                <p className="mb-0 text-muted" style={{ fontSize: 11 }}>Policy 3.40 — Alumni Network</p>
              </div>
            </div>
            <button className="btn-close" onClick={onClose} />
          </div>
          <div className="modal-body">
            <div className="row g-3">
              <div className="col-md-6">
                <label style={labelStyle}>Employee *</label>
                <select className="form-select form-select-sm" value={form.employeeId} onChange={e => setForm(f => ({ ...f, employeeId: e.target.value }))}>
                  <option value="">-- Select Employee --</option>
                  {employees.map(e => (
                    <option key={e._id} value={e._id}>{e.name} — {e.department}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-6">
                <label style={labelStyle}>Relieving Date *</label>
                <input type="date" className="form-control form-control-sm" value={form.relievingDate} onChange={e => setForm(f => ({ ...f, relievingDate: e.target.value }))} />
              </div>
              <div className="col-md-6">
                <label style={labelStyle}>Exit Reason</label>
                <select className="form-select form-select-sm" value={form.exitReason} onChange={e => setForm(f => ({ ...f, exitReason: e.target.value }))}>
                  {EXIT_REASONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div className="col-md-6">
                <label style={labelStyle}>LinkedIn URL</label>
                <input className="form-control form-control-sm" value={form.linkedIn} onChange={e => setForm(f => ({ ...f, linkedIn: e.target.value }))} placeholder="https://linkedin.com/in/..." />
              </div>
              <div className="col-md-6">
                <label style={labelStyle}>Current Company</label>
                <input className="form-control form-control-sm" value={form.currentCompany} onChange={e => setForm(f => ({ ...f, currentCompany: e.target.value }))} placeholder="e.g. TCS, Infosys..." />
              </div>
              <div className="col-md-6">
                <label style={labelStyle}>Current Role</label>
                <input className="form-control form-control-sm" value={form.currentRole} onChange={e => setForm(f => ({ ...f, currentRole: e.target.value }))} placeholder="e.g. Senior Manager" />
              </div>
              <div className="col-md-6">
                <label style={labelStyle}>Current City</label>
                <input className="form-control form-control-sm" value={form.currentCity} onChange={e => setForm(f => ({ ...f, currentCity: e.target.value }))} placeholder="e.g. Chennai" />
              </div>
              <div className="col-md-6">
                <label style={labelStyle}>Tags (comma separated)</label>
                <input className="form-control form-control-sm" value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="HiPo, Boomerang, Influencer" />
              </div>
              <div className="col-12">
                <label style={labelStyle}>HR Notes (Confidential)</label>
                <textarea className="form-control form-control-sm" rows={2} value={form.hrNotes} onChange={e => setForm(f => ({ ...f, hrNotes: e.target.value }))} placeholder="Internal notes about this alumni..." />
              </div>
              <div className="col-12">
                <div className="form-check form-switch d-flex align-items-center gap-2" style={{ background: "#f9fafb", borderRadius: 9, padding: "10px 14px", border: "1px solid #e5e7eb" }}>
                  <input className="form-check-input" type="checkbox" role="switch" checked={form.isRehireEligible} onChange={e => setForm(f => ({ ...f, isRehireEligible: e.target.checked }))} style={{ width: 36, height: 20 }} />
                  <label className="form-check-label fw-bold" style={{ fontSize: 13 }}>Eligible for Rehire</label>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-footer gap-2">
            <button className="btn btn-light flex-fill" onClick={onClose}>Cancel</button>
            <button className="btn btn-success fw-bold flex-fill" onClick={handle} disabled={saving}>
              {saving ? "Creating..." : "Create Alumni Profile"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Engagement Modal ─────────────────────────────────────────
function EngagementModal({ alumni, onClose, onSave }) {
  const [form, setForm] = useState({ type: "other", note: "", addedBy: "HR" });
  const [saving, setSaving] = useState(false);
  return (
    <div className="modal show d-block" style={{ background: "rgba(15,23,42,.45)", zIndex: 1055 }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: 14 }}>
          <div className="modal-header" style={{ background: "#f9fafb", borderRadius: "14px 14px 0 0" }}>
            <div className="d-flex align-items-center gap-2">
              <MessageSquare size={16} color="#3b82f6" />
              <p className="mb-0 fw-bold" style={{ fontSize: 14 }}>Log Engagement — {alumni?.name}</p>
            </div>
            <button className="btn-close" onClick={onClose} />
          </div>
          <div className="modal-body d-flex flex-column gap-3">
            <div>
              <label style={labelStyle}>Type</label>
              <select className="form-select form-select-sm" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                {ENGAGEMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Note *</label>
              <textarea className="form-control form-control-sm" rows={3} value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} placeholder="Describe the interaction, outcomes..." />
            </div>
            <div>
              <label style={labelStyle}>Added By</label>
              <input className="form-control form-control-sm" value={form.addedBy} onChange={e => setForm(f => ({ ...f, addedBy: e.target.value }))} />
            </div>
          </div>
          <div className="modal-footer gap-2">
            <button className="btn btn-light flex-fill" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary fw-bold flex-fill" disabled={saving || !form.note}
              onClick={async () => { if (!form.note) return; setSaving(true); await onSave(alumni._id, form); setSaving(false); }}>
              {saving ? "Saving..." : "Log Engagement"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Referral Modal ───────────────────────────────────────────
function ReferralModal({ alumni, onClose, onSave }) {
  const [form, setForm] = useState({ type: "candidate", name: "", contactInfo: "", notes: "" });
  const [saving, setSaving] = useState(false);
  return (
    <div className="modal show d-block" style={{ background: "rgba(15,23,42,.45)", zIndex: 1055 }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: 14 }}>
          <div className="modal-header" style={{ background: "#f9fafb", borderRadius: "14px 14px 0 0" }}>
            <div className="d-flex align-items-center gap-2">
              <GitBranch size={16} color="#8b5cf6" />
              <p className="mb-0 fw-bold" style={{ fontSize: 14 }}>Add Referral — {alumni?.name}</p>
            </div>
            <button className="btn-close" onClick={onClose} />
          </div>
          <div className="modal-body d-flex flex-column gap-3">
            <div>
              <label style={labelStyle}>Referral Type</label>
              <select className="form-select form-select-sm" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                {REFERRAL_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Name *</label>
              <input className="form-control form-control-sm" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Referred person/company name" />
            </div>
            <div>
              <label style={labelStyle}>Contact Info</label>
              <input className="form-control form-control-sm" value={form.contactInfo} onChange={e => setForm(f => ({ ...f, contactInfo: e.target.value }))} placeholder="Email or phone" />
            </div>
            <div>
              <label style={labelStyle}>Notes</label>
              <textarea className="form-control form-control-sm" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Additional details..." />
            </div>
          </div>
          <div className="modal-footer gap-2">
            <button className="btn btn-light flex-fill" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary fw-bold flex-fill" disabled={saving || !form.name}
              onClick={async () => { if (!form.name) return; setSaving(true); await onSave(alumni._id, form); setSaving(false); }}>
              {saving ? "Saving..." : "Add Referral"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Alumni Detail Drawer ─────────────────────────────────────
function AlumniDrawer({ alumni, onClose, onRefresh }) {
  const [modal, setModal] = useState(null); // "engagement"|"referral"|"edit"
  const [editForm, setEditForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast]   = useState(null);

  if (!alumni) return null;

  const ns = NETWORK_STATUS[alumni.networkStatus] || NETWORK_STATUS.active;
  const rs = REHIRE_STATUS[alumni.rehireStatus]   || REHIRE_STATUS.not_applied;

  const showMsg = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const logEngagement = async (id, data) => {
    try {
      await axios.post(`${API_BASE}/api/alumni/${id}/engagement`, data);
      showMsg("Engagement logged");
      onRefresh(id);
      setModal(null);
    } catch (e) { showMsg(e?.response?.data?.message || "Failed", "error"); }
  };

  const addReferral = async (id, data) => {
    try {
      await axios.post(`${API_BASE}/api/alumni/${id}/referral`, data);
      showMsg("Referral added");
      onRefresh(id);
      setModal(null);
    } catch (e) { showMsg(e?.response?.data?.message || "Failed", "error"); }
  };

  const saveEdit = async () => {
    setSaving(true);
    try {
      await axios.put(`${API_BASE}/api/alumni/${alumni._id}`, editForm);
      showMsg("Profile updated");
      onRefresh(alumni._id);
      setModal(null);
    } catch (e) { showMsg(e?.response?.data?.message || "Failed", "error"); }
    setSaving(false);
  };

  const updateRefStatus = async (refId, status) => {
    try {
      await axios.put(`${API_BASE}/api/alumni/${alumni._id}/referral/${refId}`, { status });
      showMsg("Referral updated");
      onRefresh(alumni._id);
    } catch (e) { showMsg("Failed", "error"); }
  };

  return (
    <>
      {modal === "engagement" && <EngagementModal alumni={alumni} onClose={() => setModal(null)} onSave={logEngagement} />}
      {modal === "referral"   && <ReferralModal   alumni={alumni} onClose={() => setModal(null)} onSave={addReferral} />}

      <div style={{ position: "fixed", inset: 0, zIndex: 900, display: "flex" }}>
        <div onClick={onClose} style={{ flex: 1, background: "rgba(15,23,42,.35)" }} />
        <div style={{ width: 560, background: "#fff", overflowY: "auto", boxShadow: "-4px 0 40px rgba(0,0,0,.15)", display: "flex", flexDirection: "column" }}>

          {toast && <div className={`alert alert-${toast.type === "error" ? "danger" : "success"} m-2 py-2`} style={{ fontSize: 13 }}>{toast.msg}</div>}

          {/* Header */}
          <div style={{ padding: "18px 22px", borderBottom: "1px solid #e5e7eb", background: "linear-gradient(135deg,#ecfdf5,#eff6ff)", position: "sticky", top: 0, zIndex: 1 }}>
            <div className="d-flex justify-content-between align-items-start">
              <div className="d-flex gap-3 align-items-center">
                <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "#fff", fontSize: 22, flexShrink: 0 }}>
                  {alumni.name?.charAt(0)}
                </div>
                <div>
                  <p className="mb-0 fw-bold" style={{ fontSize: 16 }}>{alumni.name}</p>
                  <p className="mb-0 text-muted" style={{ fontSize: 12 }}>{alumni.designation} · {alumni.department}</p>
                  <div className="d-flex gap-2 mt-1 flex-wrap">
                    <span className="badge" style={{ background: ns.bg, color: ns.color, border: `1px solid ${ns.color}33`, fontSize: 11 }}>{ns.label}</span>
                    {alumni.isRehireEligible && <span className="badge" style={{ background: "#eff6ff", color: "#3b82f6", fontSize: 11 }}>Rehire Eligible</span>}
                    {alumni.isBrandAmbassador && <span className="badge bg-warning text-dark" style={{ fontSize: 11 }}>Brand Ambassador</span>}
                    {alumni.tags?.map(t => <span key={t} className="badge bg-light text-dark" style={{ fontSize: 10 }}>{t}</span>)}
                  </div>
                </div>
              </div>
              <button className="btn btn-sm btn-light" onClick={onClose}><X size={14} /></button>
            </div>

            {/* Action buttons */}
            <div className="d-flex gap-2 mt-3 flex-wrap">
              <button className="btn btn-sm btn-outline-primary py-1" style={{ fontSize: 12 }} onClick={() => { setEditForm({ ...alumni, tags: alumni.tags?.join(", ") || "" }); setModal("edit"); }}>
                <Pencil size={11} /> Edit
              </button>
              <button className="btn btn-sm btn-outline-success py-1" style={{ fontSize: 12 }} onClick={() => setModal("engagement")}>
                <MessageSquare size={11} /> Log Engagement
              </button>
              <button className="btn btn-sm btn-outline-secondary py-1" style={{ fontSize: 12 }} onClick={() => setModal("referral")}>
                <GitBranch size={11} /> Add Referral
              </button>
            </div>
          </div>

          <div style={{ padding: "18px 22px", flex: 1 }}>

            {/* Edit Form */}
            {modal === "edit" && editForm && (
              <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 12 }}>
                <div className="card-body">
                  <p className="fw-bold mb-3" style={{ fontSize: 13 }}>Edit Profile</p>
                  <div className="row g-2">
                    {[
                      { key: "linkedIn",       label: "LinkedIn",        placeholder: "https://linkedin.com/in/..." },
                      { key: "currentCompany", label: "Current Company", placeholder: "Company name" },
                      { key: "currentRole",    label: "Current Role",    placeholder: "Designation" },
                      { key: "currentCity",    label: "Current City",    placeholder: "City" },
                    ].map(f => (
                      <div className="col-md-6" key={f.key}>
                        <label style={labelStyle}>{f.label}</label>
                        <input className="form-control form-control-sm" value={editForm[f.key] || ""} onChange={e => setEditForm(ef => ({ ...ef, [f.key]: e.target.value }))} placeholder={f.placeholder} />
                      </div>
                    ))}
                    <div className="col-md-6">
                      <label style={labelStyle}>Network Status</label>
                      <select className="form-select form-select-sm" value={editForm.networkStatus} onChange={e => setEditForm(ef => ({ ...ef, networkStatus: e.target.value }))}>
                        {Object.entries(NETWORK_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label style={labelStyle}>Rehire Status</label>
                      <select className="form-select form-select-sm" value={editForm.rehireStatus} onChange={e => setEditForm(ef => ({ ...ef, rehireStatus: e.target.value }))}>
                        {Object.entries(REHIRE_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                      </select>
                    </div>
                    <div className="col-12">
                      <label style={labelStyle}>Tags (comma separated)</label>
                      <input className="form-control form-control-sm" value={editForm.tags || ""} onChange={e => setEditForm(ef => ({ ...ef, tags: e.target.value }))} placeholder="HiPo, Boomerang, Influencer" />
                    </div>
                    <div className="col-12">
                      <div className="d-flex gap-3">
                        <div className="form-check form-switch">
                          <input className="form-check-input" type="checkbox" role="switch" checked={editForm.isRehireEligible} onChange={e => setEditForm(ef => ({ ...ef, isRehireEligible: e.target.checked }))} />
                          <label className="form-check-label" style={{ fontSize: 13 }}>Rehire Eligible</label>
                        </div>
                        <div className="form-check form-switch">
                          <input className="form-check-input" type="checkbox" role="switch" checked={editForm.isBrandAmbassador} onChange={e => setEditForm(ef => ({ ...ef, isBrandAmbassador: e.target.checked }))} />
                          <label className="form-check-label" style={{ fontSize: 13 }}>Brand Ambassador</label>
                        </div>
                        <div className="form-check form-switch">
                          <input className="form-check-input" type="checkbox" role="switch" checked={editForm.mentorshipAvailable} onChange={e => setEditForm(ef => ({ ...ef, mentorshipAvailable: e.target.checked }))} />
                          <label className="form-check-label" style={{ fontSize: 13 }}>Mentorship Available</label>
                        </div>
                      </div>
                    </div>
                    <div className="col-12">
                      <label style={labelStyle}>HR Notes</label>
                      <textarea className="form-control form-control-sm" rows={2} value={editForm.hrNotes || ""} onChange={e => setEditForm(ef => ({ ...ef, hrNotes: e.target.value }))} />
                    </div>
                  </div>
                  <div className="d-flex gap-2 mt-3">
                    <button className="btn btn-light btn-sm flex-fill" onClick={() => setModal(null)}>Cancel</button>
                    <button className="btn btn-primary btn-sm fw-bold flex-fill" onClick={saveEdit} disabled={saving}>{saving ? "Saving..." : "Save Changes"}</button>
                  </div>
                </div>
              </div>
            )}

            {/* Basic Info */}
            <div style={{ background: "#f9fafb", borderRadius: 10, padding: "12px 15px", marginBottom: 16, border: "1px solid #e5e7eb" }}>
              <p className="fw-bold mb-2" style={{ fontSize: 13 }}>Profile Info</p>
              <div className="row g-2" style={{ fontSize: 12 }}>
                {alumni.email && <div className="col-12 d-flex align-items-center gap-2"><Mail size={12} color="#6b7280" /><span>{alumni.email}</span></div>}
                {alumni.phone && <div className="col-12 d-flex align-items-center gap-2"><Phone size={12} color="#6b7280" /><span>{alumni.phone}</span></div>}
                {alumni.currentCompany && <div className="col-12 d-flex align-items-center gap-2"><Briefcase size={12} color="#6b7280" /><span>{alumni.currentRole} @ {alumni.currentCompany}</span></div>}
                {alumni.currentCity && <div className="col-12 d-flex align-items-center gap-2"><MapPin size={12} color="#6b7280" /><span>{alumni.currentCity}</span></div>}
                {alumni.linkedIn && (
                  <div className="col-12 d-flex align-items-center gap-2">
                    <Linkedin size={12} color="#0077b5" />
                    <a href={alumni.linkedIn} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: "#0077b5" }}>LinkedIn Profile</a>
                  </div>
                )}
                <div className="col-6 d-flex align-items-center gap-2"><Calendar size={12} color="#6b7280" /><span>Tenure: {alumni.tenure || "—"}</span></div>
                <div className="col-6 d-flex align-items-center gap-2"><span className="text-muted">Exit: </span><span>{EXIT_REASONS.find(r => r.value === alumni.exitReason)?.label || "—"}</span></div>
                <div className="col-6"><span className="text-muted">Relieved: </span><span>{alumni.relievingDate ? new Date(alumni.relievingDate).toLocaleDateString("en-IN") : "—"}</span></div>
                <div className="col-6">
                  <span className="badge" style={{ background: rs.bg, color: rs.color, fontSize: 11 }}>{rs.label}</span>
                </div>
              </div>
            </div>

            {/* Mentorship */}
            {alumni.mentorshipAvailable && (
              <div style={{ background: "#f5f3ff", borderRadius: 10, padding: "12px 15px", marginBottom: 16, border: "1px solid #ddd6fe" }}>
                <div className="d-flex align-items-center gap-2 mb-1">
                  <BookOpen size={13} color="#8b5cf6" />
                  <p className="mb-0 fw-bold" style={{ fontSize: 13, color: "#8b5cf6" }}>Available for Mentorship</p>
                </div>
                {alumni.mentorshipDomains?.length > 0 && (
                  <div className="d-flex flex-wrap gap-1">
                    {alumni.mentorshipDomains.map((d, i) => (
                      <span key={i} className="badge" style={{ background: "#8b5cf6", fontSize: 11 }}>{d}</span>
                    ))}
                  </div>
                )}
                <p className="mb-0 text-muted mt-1" style={{ fontSize: 11 }}>{alumni.mentorshipSessions?.length || 0} sessions conducted</p>
              </div>
            )}

            {/* Referrals */}
            <div className="d-flex justify-content-between align-items-center mb-2">
              <p className="mb-0 fw-bold" style={{ fontSize: 13 }}>Referrals</p>
              <span className="badge bg-light text-dark" style={{ fontSize: 11 }}>{alumni.referrals?.length || 0} total</span>
            </div>
            {alumni.referrals?.length > 0 ? (
              <div className="d-flex flex-column gap-2 mb-4">
                {alumni.referrals.map((r, i) => (
                  <div key={i} style={{ background: "#f9fafb", borderRadius: 8, padding: "8px 12px", border: "1px solid #e5e7eb" }}>
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <p className="mb-0 fw-semibold" style={{ fontSize: 12 }}>{r.name}</p>
                        <p className="mb-0 text-muted" style={{ fontSize: 11 }}>{REFERRAL_TYPES.find(t => t.value === r.type)?.label} · {new Date(r.date).toLocaleDateString("en-IN")}</p>
                      </div>
                      <select className="form-select form-select-sm" style={{ width: "auto", fontSize: 11 }} value={r.status}
                        onChange={e => updateRefStatus(r._id, e.target.value)}>
                        <option value="pending">Pending</option>
                        <option value="converted">Converted</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>
                    {r.notes && <p className="mb-0 text-muted mt-1" style={{ fontSize: 11 }}>{r.notes}</p>}
                  </div>
                ))}
              </div>
            ) : <p className="text-muted mb-3" style={{ fontSize: 12 }}>No referrals yet.</p>}

            {/* Engagement Log */}
            <div className="d-flex justify-content-between align-items-center mb-2">
              <p className="mb-0 fw-bold" style={{ fontSize: 13 }}>Engagement Log</p>
              <span className="badge bg-light text-dark" style={{ fontSize: 11 }}>{alumni.engagementLog?.length || 0} activities</span>
            </div>
            {alumni.engagementLog?.length > 0 ? (
              <div className="d-flex flex-column gap-2">
                {[...alumni.engagementLog].reverse().slice(0, 8).map((e, i) => (
                  <div key={i} style={{ borderLeft: "3px solid #3b82f6", paddingLeft: 10 }}>
                    <p className="mb-0 fw-semibold" style={{ fontSize: 12 }}>{e.note}</p>
                    <p className="mb-0 text-muted" style={{ fontSize: 11 }}>
                      {ENGAGEMENT_TYPES.find(t => t.value === e.type)?.label || e.type} · {new Date(e.date).toLocaleDateString("en-IN")} · {e.addedBy}
                    </p>
                  </div>
                ))}
              </div>
            ) : <p className="text-muted" style={{ fontSize: 12 }}>No engagements logged yet.</p>}

            {/* HR Notes */}
            {alumni.hrNotes && (
              <div className="mt-3 p-3 rounded" style={{ background: "#fffbeb", border: "1px solid #fde68a" }}>
                <p className="mb-1 fw-bold" style={{ fontSize: 12, color: "#92400e" }}>HR Notes (Confidential)</p>
                <p className="mb-0" style={{ fontSize: 12, color: "#78350f" }}>{alumni.hrNotes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────
export default function AlumniNetwork() {
  const [alumni, setAlumni]         = useState([]);
  const [stats, setStats]           = useState(null);
  const [employees, setEmployees]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [selected, setSelected]     = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [toast, setToast]           = useState(null);
  const [search, setSearch]         = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterRehire, setFilterRehire] = useState(false);
  const [activeTab, setActiveTab]   = useState("directory"); // "directory"|"mentors"|"referrals"

  const showMsg = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchAll = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params = {};
      if (search)             params.search = search;
      if (filterStatus !== "all") params.status = filterStatus;
      if (filterRehire)       params.rehire = "true";

      const [alumniRes, statsRes, empRes] = await Promise.all([
        axios.get(`${API_BASE}/api/alumni`, { params }),
        axios.get(`${API_BASE}/api/alumni/stats`),
        axios.get(`${API_BASE}/api/hr/employees`),
      ]);

      setAlumni(alumniRes.data.data || []);
      setStats(statsRes.data.data);
      const allEmp = Array.isArray(empRes.data) ? empRes.data : [];
      // Only active employees can be converted to alumni
      setEmployees(allEmp.filter(e => e.status === "active" || e.status === "inactive"));
    } catch (e) { setError(e?.response?.data?.message || "Failed to load"); }
    finally { setLoading(false); }
  }, [search, filterStatus, filterRehire]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const refreshOne = async (id) => {
    try {
      const res = await axios.get(`${API_BASE}/api/alumni/${id}`);
      setSelected(res.data.data);
      setAlumni(prev => prev.map(a => a._id === id ? res.data.data : a));
    } catch (e) { /* silent */ }
  };

  const handleCreate = async (data) => {
    try {
      await axios.post(`${API_BASE}/api/alumni`, data);
      showMsg("Alumni profile created successfully");
      setShowCreate(false);
      fetchAll();
    } catch (e) { showMsg(e?.response?.data?.message || "Failed", "error"); }
  };

  // Filtered lists for tabs
  const mentors    = alumni.filter(a => a.mentorshipAvailable);
  const referrers  = alumni.filter(a => (a.referrals?.length || 0) > 0);

  const displayList = activeTab === "mentors"   ? mentors
                    : activeTab === "referrals" ? referrers
                    : alumni;

  return (
    <div className="container-fluid py-4" style={{ maxWidth: 1400 }}>

      {toast && (
        <div className={`alert alert-${toast.type === "error" ? "danger" : "success"} position-fixed top-0 end-0 m-3`} style={{ zIndex: 9999, fontSize: 13 }}>
          {toast.msg}
        </div>
      )}

      {selected && (
        <AlumniDrawer alumni={selected} onClose={() => setSelected(null)} onRefresh={refreshOne} />
      )}

      {showCreate && (
        <CreateAlumniModal employees={employees} onClose={() => setShowCreate(false)} onSave={handleCreate} />
      )}

      {/* ── Header ── */}
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
        <div className="d-flex align-items-center gap-3">
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg,#10b981,#3b82f6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Users size={22} color="#fff" />
          </div>
          <div>
            <h4 className="mb-0 fw-bold">Alumni Network</h4>
            <p className="mb-0 text-muted" style={{ fontSize: 12 }}>Policy 3.40 — Ex-Radnus Employees as Brand Advocates</p>
          </div>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-sm btn-light d-flex align-items-center gap-1" onClick={fetchAll} disabled={loading}>
            <RefreshCw size={13} /> Refresh
          </button>
          <button className="btn btn-success d-flex align-items-center gap-2 fw-bold" onClick={() => setShowCreate(true)}>
            <UserPlus size={14} /> Add Alumni
          </button>
        </div>
      </div>

      {/* ── Policy Banner ── */}
      <div className="alert d-flex align-items-start gap-2 mb-4" style={{ background: "#ecfdf5", border: "1px solid #6ee7b7", borderRadius: 10, fontSize: 12 }}>
        <Info size={15} color="#059669" style={{ flexShrink: 0, marginTop: 1 }} />
        <p className="mb-0" style={{ color: "#065f46" }}>
          <strong>Policy 3.40:</strong> Radnus maintains a structured Alumni Network to retain long-term relationships with ex-employees, turning them into brand ambassadors, mentors, referral sources, or future rehires.
        </p>
      </div>

      {/* ── Stats Row ── */}
      {stats && (
        <div className="row g-3 mb-4">
          <div className="col"><StatCard label="Total Alumni"    value={stats.total}       color="#111827" bg="#f3f4f6" icon={<Users size={16} />} /></div>
          <div className="col"><StatCard label="Active"          value={stats.active}      color="#10b981" bg="#ecfdf5" icon={<UserCheck size={16} />} /></div>
          <div className="col"><StatCard label="Rehire Ready"    value={stats.rehireReady} color="#3b82f6" bg="#eff6ff" icon={<RotateCcw size={16} />} /></div>
          <div className="col"><StatCard label="Mentors"         value={stats.mentors}     color="#8b5cf6" bg="#f5f3ff" icon={<BookOpen size={16} />} /></div>
          <div className="col"><StatCard label="Total Referrals" value={stats.referrals?.total || 0} color="#f59e0b" bg="#fffbeb" icon={<GitBranch size={16} />} /></div>
          <div className="col"><StatCard label="Ambassadors"     value={stats.ambassadors} color="#ef4444" bg="#fef2f2" icon={<Star size={16} />} /></div>
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="d-flex gap-2 mb-3">
        {[
          { key: "directory",  label: `All Alumni (${alumni.length})`,       icon: <Users size={13} /> },
          { key: "mentors",    label: `Mentors (${mentors.length})`,          icon: <BookOpen size={13} /> },
          { key: "referrals",  label: `Referrers (${referrers.length})`,      icon: <GitBranch size={13} /> },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`btn btn-sm d-flex align-items-center gap-1 ${activeTab === tab.key ? "btn-primary" : "btn-light"}`}
            style={{ fontSize: 12 }}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="card border-0 shadow-sm mb-3" style={{ borderRadius: 10 }}>
        <div className="card-body py-2 px-3 d-flex gap-3 align-items-center flex-wrap">
          <div className="input-group input-group-sm" style={{ maxWidth: 260 }}>
            <span className="input-group-text border-end-0 bg-white">
              <Search size={13} color="#9ca3af" />
            </span>
            <input className="form-control border-start-0" placeholder="Search alumni..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="form-select form-select-sm" style={{ maxWidth: 160 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="all">All Status</option>
            {Object.entries(NETWORK_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <div className="form-check mb-0">
            <input className="form-check-input" type="checkbox" id="rehireFilter" checked={filterRehire} onChange={e => setFilterRehire(e.target.checked)} />
            <label className="form-check-label" htmlFor="rehireFilter" style={{ fontSize: 12 }}>Rehire Eligible Only</label>
          </div>
          <span className="text-muted ms-auto" style={{ fontSize: 12 }}>{displayList.length} alumni</span>
          {loading && <div className="spinner-border spinner-border-sm text-primary" />}
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* ── Alumni Table ── */}
      {displayList.length === 0 ? (
        <div className="text-center py-5">
          <Users size={40} className="text-muted mb-3" />
          <p className="text-muted">No alumni found. Add alumni profiles using the "Add Alumni" button.</p>
        </div>
      ) : (
        <div className="card border-0 shadow-sm" style={{ borderRadius: 12, overflow: "hidden" }}>
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" style={{ fontSize: 13 }}>
              <thead className="table-light">
                <tr>
                  <th>Alumni</th>
                  <th>Dept / Role</th>
                  <th>Tenure</th>
                  <th>Current</th>
                  <th>Status</th>
                  <th>Referrals</th>
                  <th>Flags</th>
                  <th>Relieved</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {displayList.map(a => {
                  const ns = NETWORK_STATUS[a.networkStatus] || NETWORK_STATUS.active;
                  const convertedRef = a.referrals?.filter(r => r.status === "converted").length || 0;
                  const totalRef     = a.referrals?.length || 0;
                  return (
                    <tr key={a._id}>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#ecfdf5", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#10b981", fontSize: 14, flexShrink: 0 }}>
                            {a.name?.charAt(0)}
                          </div>
                          <div>
                            <p className="mb-0 fw-bold" style={{ fontSize: 13 }}>{a.name}</p>
                            <p className="mb-0 text-muted" style={{ fontSize: 11 }}>{a.email}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <p className="mb-0" style={{ fontSize: 12 }}>{a.department}</p>
                        <p className="mb-0 text-muted" style={{ fontSize: 11 }}>{a.designation}</p>
                      </td>
                      <td className="text-muted" style={{ fontSize: 12 }}>{a.tenure || "—"}</td>
                      <td>
                        {a.currentCompany ? (
                          <div>
                            <p className="mb-0" style={{ fontSize: 12 }}>{a.currentRole}</p>
                            <p className="mb-0 text-muted" style={{ fontSize: 11 }}>{a.currentCompany}</p>
                          </div>
                        ) : <span className="text-muted" style={{ fontSize: 11 }}>—</span>}
                      </td>
                      <td>
                        <span className="badge" style={{ background: ns.bg, color: ns.color, border: `1px solid ${ns.color}33`, fontSize: 11 }}>{ns.label}</span>
                      </td>
                      <td>
                        {totalRef > 0 ? (
                          <span style={{ fontSize: 12 }}>{totalRef} <span className="text-muted">({convertedRef} ✓)</span></span>
                        ) : <span className="text-muted" style={{ fontSize: 11 }}>—</span>}
                      </td>
                      <td>
                        <div className="d-flex gap-1 flex-wrap">
                          {a.isRehireEligible    && <span className="badge bg-primary"        style={{ fontSize: 10 }}>Rehire</span>}
                          {a.isBrandAmbassador   && <span className="badge bg-warning text-dark" style={{ fontSize: 10 }}>Ambassador</span>}
                          {a.mentorshipAvailable && <span className="badge bg-purple text-white" style={{ fontSize: 10, background: "#8b5cf6" }}>Mentor</span>}
                        </div>
                      </td>
                      <td className="text-muted" style={{ fontSize: 11 }}>
                        {a.relievingDate ? new Date(a.relievingDate).toLocaleDateString("en-IN") : "—"}
                      </td>
                      <td>
                        <button className="btn btn-sm btn-outline-success py-0 px-2" style={{ fontSize: 11 }}
                          onClick={async () => { const r = await axios.get(`${API_BASE}/api/alumni/${a._id}`); setSelected(r.data.data); }}>
                          View <ChevronRight size={11} />
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

      {/* ── KPI Summary (bottom) ── */}
      {stats && (
        <div className="card border-0 shadow-sm mt-4" style={{ borderRadius: 12 }}>
          <div className="card-body">
            <p className="fw-bold mb-3" style={{ fontSize: 13 }}>KPI Dashboard — Alumni Network (Policy 3.40)</p>
            <div className="row g-3">
              {[
                { metric: "Alumni Registration Rate",           target: "≥ 80% of ex-employees", current: `${stats.total} alumni`, frequency: "Annual" },
                { metric: "Alumni Engagement Rate",            target: "≥ 60% active participation", current: `${stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}% active`, frequency: "Quarterly" },
                { metric: "Alumni-driven Referrals",           target: "≥ 10% of hires",        current: `${stats.referrals?.total || 0} referrals (${stats.referrals?.converted || 0} converted)`, frequency: "Annual" },
                { metric: "Rehire Success Rate",               target: "≥ 5% of alumni",        current: `${stats.rehireReady} eligible`, frequency: "Annual" },
                { metric: "Mentorship Participation",          target: "≥ 20 alumni mentoring", current: `${stats.mentors} mentors`, frequency: "Annual" },
              ].map((k, i) => (
                <div key={i} className="col-md-4">
                  <div style={{ background: "#f9fafb", borderRadius: 9, padding: "10px 14px", border: "1px solid #e5e7eb" }}>
                    <p className="mb-0 fw-semibold" style={{ fontSize: 12 }}>{k.metric}</p>
                    <p className="mb-0 text-muted" style={{ fontSize: 11 }}>Target: {k.target} · {k.frequency}</p>
                    <p className="mb-0 mt-1" style={{ fontSize: 12, color: "#3b82f6", fontWeight: 600 }}>Current: {k.current}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}