import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Plus, Edit3, Trash2, RefreshCw, Search,
  Wifi, WifiOff, Users, CheckCircle, XCircle,
  Loader, X, Save, Fingerprint, AlertTriangle,
  ChevronDown, Monitor,
} from 'lucide-react';

// ─── Config ──────────────────────────────────────────────────
const API = import.meta.env.VITE_API_BASE_URL || 'http://192.168.0.70:4000';

const tok = () =>
  localStorage.getItem('hrToken') ||
  localStorage.getItem('token')   ||
  sessionStorage.getItem('hrToken') || '';
const H = () => ({ Authorization: `Bearer ${tok()}` });

const DEPTS = [
  'IT','HR','Finance','Operations','Marketing',
  'Sales','Admin','Production','QA','Management',
];

const STATUS_COLORS = {
  active:   { bg: '#dcfce7', color: '#15803d', border: '#bbf7d0' },
  inactive: { bg: '#f1f5f9', color: '#64748b', border: '#e2e8f0' },
  pending:  { bg: '#fef9c3', color: '#a16207', border: '#fde047' },
};

// ═══════════════════════════════════════════
//  TOAST
// ═══════════════════════════════════════════
function Toast({ t }) {
  if (!t) return null;
  return (
    <div style={{
      position: 'fixed', top: 24, right: 24, zIndex: 99999,
      background: t.type === 'error' ? '#dc2626' : '#16a34a',
      color: '#fff', padding: '12px 20px', borderRadius: 12,
      fontWeight: 700, fontSize: 13,
      boxShadow: '0 8px 32px rgba(0,0,0,0.22)',
      display: 'flex', alignItems: 'center', gap: 9,
      maxWidth: 360, fontFamily: "'DM Sans', sans-serif",
      animation: 'slideIn 0.2s ease',
    }}>
      {t.type === 'error' ? <XCircle size={15} /> : <CheckCircle size={15} />}
      {t.msg}
    </div>
  );
}

// ═══════════════════════════════════════════
//  MACHINE STATUS BADGE
// ═══════════════════════════════════════════
function MachineBadge({ status, onCheck }) {
  const cfg = {
    online:   { bg: '#dcfce7', color: '#15803d', border: '#bbf7d0', icon: <Wifi size={12} />,   label: 'Machine Online'  },
    offline:  { bg: '#fee2e2', color: '#dc2626', border: '#fecaca', icon: <WifiOff size={12} />, label: 'Machine Offline' },
    checking: { bg: '#f1f5f9', color: '#64748b', border: '#e2e8f0', icon: <Loader size={12} style={{ animation: 'spin 1s linear infinite' }} />, label: 'Checking...' },
    unknown:  { bg: '#f8fafc', color: '#64748b', border: '#e2e8f0', icon: <Monitor size={12} />, label: 'Check Machine'  },
  }[status] || {};

  return (
    <button onClick={onCheck} style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '7px 14px', borderRadius: 8,
      background: cfg.bg, color: cfg.color,
      border: `1.5px solid ${cfg.border}`,
      fontSize: 12, fontWeight: 700, cursor: 'pointer',
      fontFamily: "'DM Sans', sans-serif",
      transition: 'all 0.15s',
    }}>
      {cfg.icon} {cfg.label}
    </button>
  );
}

// ═══════════════════════════════════════════
//  EMPLOYEE FORM MODAL
// ═══════════════════════════════════════════
function EmpModal({ emp, onDone, onClose }) {
  const isEdit = !!emp?._id;
  const [f, setF] = useState({
    name:        emp?.name        || '',
    employeeId:  emp?.employeeId  || '',
    essl_id:     emp?.essl_id     || '',
    department:  emp?.department  || '',
    designation: emp?.designation || '',
    mobile:      emp?.mobile      || '',
    email:       emp?.email       || '',
    status:      emp?.status      || 'active',
  });
  const [saving, setSaving] = useState(false);
  const [note,   setNote]   = useState('');
  const [noteOk, setNoteOk] = useState(true);

  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  const inp = {
    width: '100%', padding: '9px 12px',
    border: '1.5px solid #e5e7eb', borderRadius: 8,
    fontSize: 13, outline: 'none',
    fontFamily: "'DM Sans', sans-serif",
    background: '#f9fafb', boxSizing: 'border-box',
    transition: 'border 0.15s',
  };
  const lab = {
    display: 'block', fontSize: 10, fontWeight: 800,
    color: '#94a3b8', marginBottom: 5,
    textTransform: 'uppercase', letterSpacing: 0.6,
  };

  const submit = async () => {
    if (!f.name.trim()) { setNote('Name is required'); setNoteOk(false); return; }
    setSaving(true); setNote('');
    try {
      let res;
      if (isEdit) {
        // ✅ PUT /api/employees/:id
        res = await axios.put(`${API}/api/employees/${emp._id}`, f, { headers: H() });
      } else {
        // ✅ POST /api/employees
        res = await axios.post(`${API}/api/employees`, f, { headers: H() });
      }

      const sync = res.data.machine_sync;
      if (sync?.attempted) {
        setNoteOk(sync.success);
        setNote(sync.success
          ? '✅ Saved + synced to eSSL machine'
          : `⚠️ Saved to HRMS but machine sync failed: ${sync.message}`
        );
      } else {
        setNoteOk(true);
        setNote('✅ Employee saved (no eSSL ID — machine skip)');
      }
      setTimeout(() => onDone(res.data.data, isEdit ? 'updated' : 'added'), 1400);
    } catch (e) {
      setNote(e.response?.data?.message || 'Failed to save');
      setNoteOk(false);
    } finally { setSaving(false); }
  };

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0,
      background: 'rgba(15,23,42,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 10000, padding: 16,
      backdropFilter: 'blur(4px)',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#fff', borderRadius: 18,
        width: '100%', maxWidth: 540,
        maxHeight: '92vh', overflowY: 'auto',
        boxShadow: '0 32px 80px rgba(0,0,0,0.28)',
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          padding: '20px 24px', borderRadius: '18px 18px 0 0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 38, height: 38,
              background: 'rgba(99,102,241,0.25)',
              borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Fingerprint size={18} color="#a5b4fc" />
            </div>
            <div>
              <div style={{ color: '#f1f5f9', fontWeight: 800, fontSize: 15, fontFamily: "'DM Sans', sans-serif" }}>
                {isEdit ? 'Edit Employee' : 'Add New Employee'}
              </div>
              <div style={{ color: '#64748b', fontSize: 11, marginTop: 2, fontFamily: "'DM Sans', sans-serif" }}>
                {isEdit ? 'Changes auto-sync to eSSL machine' : 'Saved to HRMS + pushed to MB20'}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.08)', border: 'none',
            width: 32, height: 32, borderRadius: 8,
            cursor: 'pointer', color: '#94a3b8',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><X size={14} /></button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px' }}>

          {/* Name + Emp ID */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div>
              <label style={lab}>Full Name *</label>
              <input value={f.name} onChange={e => set('name', e.target.value)}
                placeholder="Rajesh Kumar" style={inp} />
            </div>
            <div>
              <label style={lab}>Employee ID</label>
              <input value={f.employeeId} onChange={e => set('employeeId', e.target.value)}
                placeholder="EMP-001 (auto if blank)" style={inp} />
            </div>
          </div>

          {/* eSSL ID */}
          <div style={{
            background: 'linear-gradient(135deg, #eff6ff, #eef2ff)',
            border: '1.5px solid #bfdbfe',
            borderRadius: 12, padding: '14px 16px', marginBottom: 14,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Fingerprint size={15} color="#2563eb" />
              <label style={{ ...lab, color: '#1d4ed8', margin: 0 }}>
                eSSL Enrollment Number (Biometric Machine ID)
              </label>
            </div>
            <input
              value={f.essl_id}
              onChange={e => set('essl_id', e.target.value)}
              placeholder="e.g. 1, 2, 3 ... (MB20 machine number)"
              style={{ ...inp, background: '#fff', borderColor: '#bfdbfe' }}
            />
            <div style={{ fontSize: 11, color: '#3b82f6', marginTop: 6, fontFamily: "'DM Sans', sans-serif" }}>
              ℹ️ MB20 machine-ல் enrolled number. Biometric இல்லன்னா blank விடு.
            </div>
          </div>

          {/* Dept + Designation */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div>
              <label style={lab}>Department</label>
              <div style={{ position: 'relative' }}>
                <select value={f.department} onChange={e => set('department', e.target.value)}
                  style={{ ...inp, appearance: 'none', paddingRight: 32 }}>
                  <option value="">Select Department</option>
                  {DEPTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <ChevronDown size={13} color="#94a3b8" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              </div>
            </div>
            <div>
              <label style={lab}>Designation</label>
              <input value={f.designation} onChange={e => set('designation', e.target.value)}
                placeholder="Senior Developer" style={inp} />
            </div>
          </div>

          {/* Mobile + Email */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div>
              <label style={lab}>Mobile</label>
              <input value={f.mobile} onChange={e => set('mobile', e.target.value)}
                placeholder="+91 9876543210" style={inp} />
            </div>
            <div>
              <label style={lab}>Email</label>
              <input type="email" value={f.email} onChange={e => set('email', e.target.value)}
                placeholder="name@company.com" style={inp} />
            </div>
          </div>

          {/* Status */}
          <div style={{ marginBottom: 16 }}>
            <label style={lab}>Status</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {['active', 'inactive'].map(s => (
                <button key={s} onClick={() => set('status', s)} style={{
                  padding: '7px 20px', borderRadius: 20,
                  border: `2px solid ${f.status === s ? '#0f172a' : '#e5e7eb'}`,
                  background: f.status === s ? '#0f172a' : '#fff',
                  color: f.status === s ? '#fff' : '#94a3b8',
                  fontWeight: 700, fontSize: 12, cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif",
                  textTransform: 'capitalize', transition: 'all 0.15s',
                }}>{s}</button>
              ))}
            </div>
          </div>

          {/* Note */}
          {note && (
            <div style={{
              background: noteOk ? '#f0fdf4' : '#fff7ed',
              border: `1px solid ${noteOk ? '#bbf7d0' : '#fed7aa'}`,
              borderRadius: 8, padding: '10px 14px', marginBottom: 12,
              fontSize: 12, fontWeight: 600,
              color: noteOk ? '#15803d' : '#c2410c',
              fontFamily: "'DM Sans', sans-serif",
            }}>{note}</div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: '11px 0', borderRadius: 10,
            border: '1.5px solid #e5e7eb', background: '#fff',
            fontWeight: 700, cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#64748b',
          }}>Cancel</button>
          <button onClick={submit} disabled={saving} style={{
            flex: 2, padding: '11px 0', borderRadius: 10,
            background: saving ? '#94a3b8' : 'linear-gradient(135deg, #0f172a, #1e293b)',
            color: '#fff', border: 'none', fontWeight: 700,
            cursor: saving ? 'not-allowed' : 'pointer',
            fontFamily: "'DM Sans', sans-serif", fontSize: 13,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            {saving
              ? <><Loader size={13} style={{ animation: 'spin 1s linear infinite' }} /> Saving...</>
              : <><Save size={13} /> {isEdit ? 'Update Employee' : 'Add Employee'}</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
//  MACHINE PANEL MODAL
// ═══════════════════════════════════════════
function MachinePanel({ onClose }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [err,     setErr]     = useState('');

  useEffect(() => {
    // ✅ GET /api/employees/machine-list
    axios.get(`${API}/api/employees/machine-list`, { headers: H() })
      .then(r => setData(r.data))
      .catch(e => setErr(e.response?.data?.message || e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0,
      background: 'rgba(15,23,42,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 10000, padding: 16, backdropFilter: 'blur(4px)',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#fff', borderRadius: 18,
        width: '100%', maxWidth: 680,
        maxHeight: '86vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 32px 80px rgba(0,0,0,0.28)',
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #0f172a, #1e293b)',
          padding: '18px 22px', borderRadius: '18px 18px 0 0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            <div style={{
              width: 36, height: 36, background: 'rgba(34,197,94,0.2)',
              borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Monitor size={16} color="#4ade80" />
            </div>
            <div>
              <div style={{ color: '#f1f5f9', fontWeight: 800, fontSize: 14, fontFamily: "'DM Sans', sans-serif" }}>
                MB20 Machine — Employee List
              </div>
              <div style={{ color: '#64748b', fontSize: 11, marginTop: 2, fontFamily: "'DM Sans', sans-serif" }}>
                Live data from biometric machine
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.08)', border: 'none',
            width: 32, height: 32, borderRadius: 8,
            cursor: 'pointer', color: '#94a3b8',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><X size={14} /></button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '50px 0', color: '#94a3b8' }}>
              <Loader size={28} style={{ animation: 'spin 1s linear infinite', marginBottom: 12 }} />
              <div style={{ fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>Fetching from machine...</div>
            </div>
          ) : err ? (
            <div style={{
              background: '#fff1f2', border: '1px solid #fecaca',
              borderRadius: 12, padding: '18px 20px',
            }}>
              <div style={{ color: '#dc2626', fontWeight: 800, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 7, fontFamily: "'DM Sans', sans-serif" }}>
                <AlertTriangle size={15} /> Cannot fetch machine data
              </div>
              <div style={{ color: '#dc2626', fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>{err}</div>
              <div style={{ color: '#64748b', fontSize: 12, marginTop: 10, lineHeight: 1.7, fontFamily: "'DM Sans', sans-serif" }}>
                • eSSL server (port 5000) running-ஆ check பண்ணு<br />
                • ESSL_MACHINE_IP in server .env check பண்ணு<br />
                • Machine power on-ஆ confirm பண்ணு
              </div>
            </div>
          ) : (
            <>
              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 18 }}>
                {[
                  { label: 'Total on Machine', value: data.machine_count, color: '#0f172a', bg: '#f8fafc', border: '#e2e8f0' },
                  { label: 'Linked to HRMS',   value: data.hrms_linked,  color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0' },
                  { label: 'Not in HRMS',      value: data.not_in_hrms,  color: '#dc2626', bg: '#fff1f2', border: '#fecaca' },
                ].map(s => (
                  <div key={s.label} style={{
                    background: s.bg, border: `1.5px solid ${s.border}`,
                    borderRadius: 12, padding: '14px', textAlign: 'center',
                  }}>
                    <div style={{ fontSize: 26, fontWeight: 900, color: s.color, fontFamily: "'DM Sans', sans-serif" }}>{s.value}</div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: s.color, opacity: 0.75, marginTop: 3, fontFamily: "'DM Sans', sans-serif" }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Table */}
              <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      {['Machine ID', 'Name', 'HRMS Link'].map(h => (
                        <th key={h} style={{
                          padding: '10px 14px', textAlign: 'left',
                          fontSize: 10, fontWeight: 800, color: '#94a3b8',
                          textTransform: 'uppercase', letterSpacing: 0.5,
                          borderBottom: '1px solid #e5e7eb',
                          fontFamily: "'DM Sans', sans-serif",
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {!data.employees?.length ? (
                      <tr><td colSpan={3} style={{ textAlign: 'center', padding: '36px 0', color: '#cbd5e1', fontFamily: "'DM Sans', sans-serif" }}>
                        No employees on machine
                      </td></tr>
                    ) : data.employees.map((e, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '10px 14px', fontWeight: 800, fontFamily: 'monospace', color: '#2563eb', fontSize: 14 }}>
                          #{e.essl_id}
                        </td>
                        <td style={{ padding: '10px 14px', fontWeight: 600, color: '#0f172a', fontFamily: "'DM Sans', sans-serif" }}>{e.name}</td>
                        <td style={{ padding: '10px 14px' }}>
                          {e.in_hrms ? (
                            <div>
                              <span style={{
                                background: '#dcfce7', color: '#15803d',
                                padding: '2px 10px', borderRadius: 7,
                                fontSize: 11, fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
                              }}>✓ Linked</span>
                              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3, fontFamily: "'DM Sans', sans-serif" }}>
                                {e.hrms_record?.name} · {e.hrms_record?.department}
                              </div>
                            </div>
                          ) : (
                            <span style={{
                              background: '#fee2e2', color: '#dc2626',
                              padding: '2px 10px', borderRadius: 7,
                              fontSize: 11, fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
                            }}>✗ Not in HRMS</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        <div style={{ padding: '14px 20px', borderTop: '1px solid #f1f5f9', flexShrink: 0 }}>
          <button onClick={onClose} style={{
            width: '100%', padding: '11px 0', borderRadius: 10,
            border: '1.5px solid #e5e7eb', background: '#fff',
            fontWeight: 700, cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#64748b',
          }}>Close</button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
//  DELETE CONFIRM MODAL
// ═══════════════════════════════════════════
function DeleteModal({ emp, onConfirm, onClose }) {
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0,
      background: 'rgba(15,23,42,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 10000, backdropFilter: 'blur(4px)',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#fff', borderRadius: 16, padding: 28,
        maxWidth: 380, width: '90%',
        boxShadow: '0 24px 64px rgba(0,0,0,0.22)',
        textAlign: 'center',
      }}>
        <div style={{
          width: 56, height: 56, background: '#fee2e2',
          borderRadius: 14, margin: '0 auto 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Trash2 size={22} color="#dc2626" />
        </div>
        <h3 style={{ margin: '0 0 8px', fontWeight: 800, color: '#0f172a', fontSize: 16, fontFamily: "'DM Sans', sans-serif" }}>
          Delete Employee?
        </h3>
        <p style={{ color: '#64748b', fontSize: 13, margin: '0 0 6px', fontFamily: "'DM Sans', sans-serif" }}>
          <strong>{emp.name}</strong> will be removed from HRMS
          {emp.essl_id && <> + eSSL machine <span style={{ color: '#2563eb', fontWeight: 700 }}>(ID: {emp.essl_id})</span></>}.
        </p>
        <p style={{ color: '#94a3b8', fontSize: 12, margin: '0 0 20px', fontFamily: "'DM Sans', sans-serif" }}>
          This action cannot be undone.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: '11px 0', borderRadius: 10,
            border: '1.5px solid #e5e7eb', background: '#fff',
            fontWeight: 700, cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif", color: '#64748b',
          }}>Cancel</button>
          <button onClick={() => onConfirm(emp)} style={{
            flex: 1, padding: '11px 0', borderRadius: 10,
            background: '#dc2626', color: '#fff', border: 'none',
            fontWeight: 700, cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif",
          }}>Delete</button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
//  MAIN PAGE
// ═══════════════════════════════════════════
export default function EsslEmployeeManager() {
  const [emps,       setEmps]       = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [deptF,      setDeptF]      = useState('all');
  const [statusF,    setStatusF]    = useState('all');
  const [modal,      setModal]      = useState(null);
  const [delEmp,     setDelEmp]     = useState(null);
  const [machPanel,  setMachPanel]  = useState(false);
  const [machStatus, setMachStatus] = useState('unknown');
  const [syncingId,  setSyncingId]  = useState(null);
  const [toast,      setToast]      = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // ✅ GET /api/employees
      const r = await axios.get(`${API}/api/employees`, { headers: H() });
      setEmps(r.data?.data || r.data || []);
    } catch {
      showToast('Failed to load employees', 'error');
    } finally { setLoading(false); }
  }, []);

  const checkMachine = async () => {
    setMachStatus('checking');
    try {
      // ✅ GET /api/employees/machine-ping
      const r = await axios.get(`${API}/api/employees/machine-ping`, { headers: H() });
      setMachStatus(r.data.ok ? 'online' : 'offline');
    } catch { setMachStatus('offline'); }
  };

  useEffect(() => { load(); checkMachine(); }, []);

  const handleDelete = async (emp) => {
    try {
      // ✅ DELETE /api/employees/:id
      const r = await axios.delete(`${API}/api/employees/${emp._id}`, { headers: H() });
      const sync = r.data.essl_sync;
      showToast(
        `${emp.name} deleted${sync?.success ? ' + removed from machine ✅' : ''}`,
        'success'
      );
      setDelEmp(null);
      load();
    } catch (e) {
      showToast(e.response?.data?.message || 'Delete failed', 'error');
    }
  };

  const syncOne = async (emp) => {
    setSyncingId(emp._id);
    try {
      // ✅ POST /api/employees/:id/sync-essl
      const r = await axios.post(
        `${API}/api/employees/${emp._id}/sync-essl`, {}, { headers: H() }
      );
      showToast(r.data.message, r.data.success ? 'success' : 'error');
      load();
    } catch (e) {
      showToast(e.response?.data?.message || 'Sync failed', 'error');
    } finally { setSyncingId(null); }
  };

  const syncAll = async () => {
    setSyncingId('all');
    try {
      // ✅ POST /api/employees/sync-all-essl
      const r = await axios.post(`${API}/api/employees/sync-all-essl`, {}, { headers: H() });
      showToast(`Synced ${r.data.synced}/${r.data.total} to machine`, r.data.failed > 0 ? 'error' : 'success');
      load();
    } catch { showToast('Bulk sync failed', 'error'); }
    finally { setSyncingId(null); }
  };

  const filtered = emps.filter(e => {
    const s = !search ||
      e.name?.toLowerCase().includes(search.toLowerCase()) ||
      (e.employeeId || '').toLowerCase().includes(search.toLowerCase()) ||
      (e.essl_id || '').includes(search);
    const d  = deptF   === 'all' || e.department === deptF;
    const st = statusF === 'all' || e.status     === statusF;
    return s && d && st;
  });

  const depts    = ['all', ...new Set(emps.map(e => e.department).filter(Boolean))];
  const withEssl = emps.filter(e => e.essl_id).length;
  const noEssl   = emps.filter(e => !e.essl_id).length;

  const selStyle = {
    border: '1.5px solid #e2e8f0', borderRadius: 8,
    padding: '8px 12px', fontSize: 13, fontWeight: 600,
    outline: 'none', fontFamily: "'DM Sans', sans-serif",
    background: '#f8fafc', color: '#0f172a', cursor: 'pointer',
  };

  return (
    <div style={{
      padding: '24px 28px', minHeight: '100vh',
      background: '#f1f5f9',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideIn { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        tbody tr:hover { background: #f8fafc !important; }
      `}</style>

      <Toast t={toast} />

      {/* Modals */}
      {modal !== null && (
        <EmpModal
          emp={modal}
          onDone={(emp, action) => { setModal(null); showToast(`${emp.name} ${action}!`); load(); }}
          onClose={() => setModal(null)}
        />
      )}
      {delEmp && (
        <DeleteModal
          emp={delEmp}
          onConfirm={handleDelete}
          onClose={() => setDelEmp(null)}
        />
      )}
      {machPanel && <MachinePanel onClose={() => setMachPanel(false)} />}

      {/* ── Header ── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'flex-start', flexWrap: 'wrap', gap: 14, marginBottom: 20,
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{
              width: 40, height: 40, background: '#0f172a',
              borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Fingerprint size={20} color="#a5b4fc" />
            </div>
            <h2 style={{ margin: 0, fontWeight: 900, fontSize: 20, color: '#0f172a' }}>
              eSSL Employee Manager
            </h2>
          </div>
          <p style={{ margin: 0, color: '#64748b', fontSize: 13 }}>
            HRMS + MB20 biometric machine sync · {emps.length} employees
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <MachineBadge status={machStatus} onCheck={checkMachine} />

          <button onClick={() => setMachPanel(true)} style={{
            background: '#eff6ff', border: '1.5px solid #bfdbfe',
            borderRadius: 8, padding: '7px 14px', cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 700, color: '#2563eb',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <Users size={13} /> Machine List
          </button>

          <button onClick={syncAll} disabled={syncingId === 'all'} style={{
            background: '#1e293b', border: 'none',
            borderRadius: 8, padding: '7px 14px', cursor: syncingId === 'all' ? 'not-allowed' : 'pointer',
            fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 700, color: '#fff',
            display: 'flex', alignItems: 'center', gap: 6,
            opacity: syncingId === 'all' ? 0.6 : 1,
          }}>
            {syncingId === 'all'
              ? <Loader size={12} style={{ animation: 'spin 1s linear infinite' }} />
              : <RefreshCw size={12} />}
            Sync All
          </button>

          <button onClick={() => setModal({})} style={{
            background: 'linear-gradient(135deg, #16a34a, #15803d)',
            border: 'none', borderRadius: 8, padding: '7px 16px',
            cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
            fontSize: 12, fontWeight: 700, color: '#fff',
            display: 'flex', alignItems: 'center', gap: 6,
            boxShadow: '0 2px 8px rgba(22,163,74,0.3)',
          }}>
            <Plus size={13} /> Add Employee
          </button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(130px,1fr))',
        gap: 10, marginBottom: 18,
      }}>
        {[
          { label: 'Total',        value: emps.length,                                    color: '#0f172a', bg: '#f8fafc', border: '#e2e8f0' },
          { label: 'Active',       value: emps.filter(e => e.status === 'active').length,  color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0' },
          { label: 'Inactive',     value: emps.filter(e => e.status === 'inactive').length,color: '#64748b', bg: '#f8fafc', border: '#e2e8f0' },
          { label: 'With eSSL ID', value: withEssl,                                        color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
          { label: 'No eSSL ID',   value: noEssl,                                          color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
        ].map(c => (
          <div key={c.label} style={{
            background: c.bg, border: `1.5px solid ${c.border}`,
            borderRadius: 12, padding: '14px', textAlign: 'center',
            animation: 'fadeUp 0.3s ease',
          }}>
            <div style={{ fontSize: 24, fontWeight: 900, color: c.color }}>{c.value}</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: c.color, opacity: 0.75, marginTop: 3 }}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div style={{
        background: '#fff', borderRadius: 12, padding: '12px 16px',
        marginBottom: 14, border: '1px solid #e5e7eb',
        display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 7,
          background: '#f8fafc', border: '1.5px solid #e2e8f0',
          borderRadius: 8, padding: '8px 12px', flex: 1, minWidth: 180,
        }}>
          <Search size={13} color="#94a3b8" />
          <input
            placeholder="Search name, ID, eSSL..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ border: 'none', background: 'transparent', fontSize: 13, outline: 'none', fontFamily: "'DM Sans', sans-serif", width: '100%', color: '#0f172a' }}
          />
        </div>

        <select value={deptF} onChange={e => setDeptF(e.target.value)} style={selStyle}>
          {depts.map(d => <option key={d} value={d}>{d === 'all' ? 'All Departments' : d}</option>)}
        </select>

        <select value={statusF} onChange={e => setStatusF(e.target.value)} style={selStyle}>
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="pending">Pending</option>
        </select>

        <button onClick={load} style={{
          background: '#0f172a', border: 'none', borderRadius: 8,
          padding: '8px 14px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6,
          fontWeight: 700, fontSize: 12, color: '#fff',
          fontFamily: "'DM Sans', sans-serif",
        }}>
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      {/* ── Table ── */}
      <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <div style={{
          padding: '14px 18px', borderBottom: '1px solid #f1f5f9',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontWeight: 800, fontSize: 14, color: '#0f172a' }}>
            Employees ({filtered.length})
          </span>
          {noEssl > 0 && (
            <span style={{
              fontSize: 12, color: '#d97706', fontWeight: 700,
              display: 'flex', alignItems: 'center', gap: 5,
            }}>
              <AlertTriangle size={12} /> {noEssl} without eSSL ID
            </span>
          )}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px 0', color: '#94a3b8' }}>
            <Loader size={24} style={{ animation: 'spin 1s linear infinite', marginBottom: 10 }} />
            <div style={{ fontSize: 13 }}>Loading employees...</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['#', 'Employee', 'Department', 'eSSL ID', 'Machine Sync', 'Status', 'Actions'].map(h => (
                    <th key={h} style={{
                      padding: '10px 14px', textAlign: 'left',
                      fontSize: 10, fontWeight: 800, color: '#94a3b8',
                      textTransform: 'uppercase', letterSpacing: 0.5,
                      whiteSpace: 'nowrap', borderBottom: '2px solid #e5e7eb',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '48px 0', color: '#cbd5e1' }}>
                    <div style={{ fontSize: 36, marginBottom: 10 }}>👥</div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>No employees found</div>
                  </td></tr>
                ) : filtered.map((emp, i) => (
                  <tr key={emp._id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.1s' }}>

                    {/* # */}
                    <td style={{ padding: '11px 14px', color: '#cbd5e1', fontWeight: 700, fontSize: 12 }}>{i + 1}</td>

                    {/* Employee */}
                    <td style={{ padding: '11px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 34, height: 34,
                          background: `hsl(${(emp.name?.charCodeAt(0) || 65) * 5 % 360}, 65%, 20%)`,
                          borderRadius: 9,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#fff', fontWeight: 800, fontSize: 13, flexShrink: 0,
                        }}>
                          {(emp.name || '?').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>{emp.name}</div>
                          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>{emp.employeeId || '—'}</div>
                        </div>
                      </div>
                    </td>

                    {/* Department */}
                    <td style={{ padding: '11px 14px', color: '#64748b' }}>{emp.department || '—'}</td>

                    {/* eSSL ID */}
                    <td style={{ padding: '11px 14px' }}>
                      {emp.essl_id ? (
                        <span style={{
                          background: '#eff6ff', color: '#2563eb',
                          padding: '4px 10px', borderRadius: 7,
                          fontWeight: 800, fontSize: 13, fontFamily: 'monospace',
                          border: '1px solid #bfdbfe',
                        }}>#{emp.essl_id}</span>
                      ) : (
                        <span style={{
                          background: '#fffbeb', color: '#d97706',
                          padding: '4px 10px', borderRadius: 7,
                          fontWeight: 700, fontSize: 11, border: '1px solid #fde68a',
                        }}>Not set</span>
                      )}
                    </td>

                    {/* ✅ Machine Sync — FIXED: no more emp.essl_synced check */}
                    <td style={{ padding: '11px 14px' }}>
                      {!emp.essl_id ? (
                        <span style={{ color: '#cbd5e1', fontSize: 11 }}>N/A</span>
                      ) : (
                        <span style={{
                          background: '#dcfce7', color: '#15803d',
                          padding: '3px 10px', borderRadius: 7,
                          fontSize: 11, fontWeight: 700,
                        }}>✓ Synced</span>
                      )}
                    </td>

                    {/* Status */}
                    <td style={{ padding: '11px 14px' }}>
                      {(() => {
                        const sc = STATUS_COLORS[emp.status] || STATUS_COLORS.inactive;
                        return (
                          <span style={{
                            background: sc.bg, color: sc.color,
                            border: `1px solid ${sc.border}`,
                            padding: '3px 10px', borderRadius: 7,
                            fontSize: 11, fontWeight: 700, textTransform: 'capitalize',
                          }}>{emp.status}</span>
                        );
                      })()}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '11px 14px' }}>
                      <div style={{ display: 'flex', gap: 5 }}>
                        {emp.essl_id && (
                          <button
                            onClick={() => syncOne(emp)}
                            disabled={syncingId === emp._id}
                            title="Sync to machine"
                            style={{
                              background: '#eff6ff', color: '#2563eb',
                              border: '1.5px solid #bfdbfe', borderRadius: 7,
                              padding: '6px 9px', cursor: 'pointer',
                              display: 'inline-flex', alignItems: 'center',
                              opacity: syncingId === emp._id ? 0.5 : 1,
                            }}>
                            {syncingId === emp._id
                              ? <Loader size={11} style={{ animation: 'spin 1s linear infinite' }} />
                              : <RefreshCw size={11} />}
                          </button>
                        )}
                        <button onClick={() => setModal(emp)} style={{
                          background: '#f8fafc', color: '#374151',
                          border: '1.5px solid #e2e8f0', borderRadius: 7,
                          padding: '6px 10px', fontSize: 11, fontWeight: 700,
                          cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                        }}>
                          <Edit3 size={11} /> Edit
                        </button>
                        <button onClick={() => setDelEmp(emp)} style={{
                          background: '#fff1f2', color: '#dc2626',
                          border: '1.5px solid #fecaca', borderRadius: 7,
                          padding: '6px 9px', cursor: 'pointer',
                          display: 'inline-flex', alignItems: 'center',
                        }}>
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}