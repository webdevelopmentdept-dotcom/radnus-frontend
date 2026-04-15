import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Wallet, DollarSign, PieChart, ShieldCheck, Calendar,
  Briefcase, MapPin, Clock, CheckCircle, UserCheck
} from "lucide-react";
import EmployeeLayout from "./EmployeeLayout";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export default function MyPackage() {
  const [data, setData]         = useState(null);
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const id = localStorage.getItem("employeeId");
    if (!id) { window.location.href = "/login"; return; }
    const fetchAll = async () => {
      try {
        const empRes = await axios.get(`${API_BASE}/api/employee/me/${id}`);
        setEmployee(empRes.data);
        const pkgRes = await axios.get(`${API_BASE}/api/hr/activation/${id}`);
        if (pkgRes.data.success && pkgRes.data.data) setData(pkgRes.data.data);
      } catch (err) { console.log(err); }
      finally { setLoading(false); }
    };
    fetchAll();
  }, []);

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center vh-100">
      <div className="spinner-border text-primary" role="status" />
    </div>
  );

  const emp = data?.employment || {};
  const sal = data?.salary     || {};
  const fmt = (v) => v ? `₹${Number(v).toLocaleString("en-IN")}` : "—";

  const salaryRows = [
    { label: "Basic Salary",         value: sal.basic,                color: "#2563eb" },
    { label: "HRA",                  value: sal.hra,                  color: "#7c3aed" },
    { label: "Special Allowance",    value: sal.special_allowance,    color: "#0891b2" },
    { label: "Conveyance Allowance", value: sal.conveyance_allowance, color: "#059669" },
  ];

  const deductions = [
    { label: "Professional Tax", value: fmt(sal.professional_tax), show: !!sal.professional_tax },
    { label: "PF",  value: "Applicable", show: sal.pf_applicable  },
    { label: "ESI", value: "Applicable", show: sal.esi_applicable },
    { label: "TDS", value: "Applicable", show: sal.tds_applicable },
  ].filter(d => d.show);

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-IN") : "—";

  return (
    <EmployeeLayout>
      <style>{`
        .section-title {
          display: flex; align-items: center; gap: 8px;
          color: #dc2626; font-weight: 700; margin-bottom: 16px;
        }
      `}</style>

      {/* Topbar */}
      <header style={{ background: "#fff", padding: "14px 28px", borderBottom: "1px solid #e5e7eb", position: "sticky", top: 0, zIndex: 50, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        <div className="d-flex align-items-center gap-3 w-100">
          <span className="fw-bold text-primary d-none d-sm-inline">My Salary Package</span>
          <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center ms-auto"
            style={{ width: 40, height: 40, fontSize: 16, fontWeight: 700 }}>
            {employee?.name?.charAt(0)}
          </div>
        </div>
      </header>

      <div className="container-fluid" style={{ padding: 28, background: "#f4f6fb", minHeight: "100vh" }}>

        {!data ? (
          <div className="card text-center py-5">
            <div className="card-body">
              <Wallet size={56} className="text-muted opacity-25 mb-3" />
              <h5 className="fw-bold text-muted">Salary Package Not Assigned Yet</h5>
              <p className="text-muted small">Your HR will set up your salary package after activation.</p>
            </div>
          </div>
        ) : (
          <>
            {/* CTC Banner */}
            <div className="card mb-4" style={{ background: "linear-gradient(135deg,#1e3a8a 0%,#2563eb 100%)", border: "none" }}>
              <div className="card-body p-4">
                <div className="row align-items-center g-3">
                  <div className="col-md-6 text-white">
                    <p className="mb-1 opacity-75 small fw-bold text-uppercase">Annual CTC</p>
                    <h1 className="fw-bold mb-1" style={{ fontSize: "clamp(28px,5vw,42px)" }}>{fmt(sal.ctc)}</h1>
                    <p className="mb-0 opacity-75 small">{emp.designation} · {emp.department}</p>
                  </div>
                  <div className="col-md-6">
                    <div className="row g-3">
                      {[
                        { label: "Gross / Month", value: fmt(sal.gross_salary), icon: <DollarSign size={18} /> },
                        { label: "Net / Month",   value: fmt(sal.net_salary),   icon: <Wallet size={18} /> },
                      ].map((s, i) => (
                        <div key={i} className="col-6">
                          <div className="rounded-3 p-3 text-white" style={{ background: "rgba(255,255,255,0.15)" }}>
                            <div className="opacity-75 mb-1">{s.icon}</div>
                            <div className="fw-bold fs-5">{s.value}</div>
                            <div className="small opacity-75">{s.label}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="row g-4">
              {/* Earnings */}
              <div className="col-lg-6">
                <div className="card h-100">
                  <div className="card-body">
                    <h5 className="section-title"><PieChart size={20} /> Earnings Breakdown</h5>
                    {salaryRows.map((row, i) => row.value ? (
                      <div key={i} className="mb-3">
                        <div className="d-flex justify-content-between mb-1">
                          <span className="small fw-bold" style={{ color: row.color }}>{row.label}</span>
                          <span className="small fw-bold">{fmt(row.value)}</span>
                        </div>
                        <div className="progress" style={{ height: 8, borderRadius: 99 }}>
                          <div className="progress-bar" style={{
                            width: `${Math.min((Number(row.value) / Number(sal.gross_salary || 1)) * 100, 100)}%`,
                            background: row.color, borderRadius: 99
                          }} />
                        </div>
                      </div>
                    ) : null)}
                    <div className="d-flex justify-content-between mt-3 pt-3" style={{ borderTop: "2px solid #e5e7eb" }}>
                      <span className="fw-bold">Gross Total</span>
                      <span className="fw-bold text-primary fs-5">{fmt(sal.gross_salary)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Deductions + Employment */}
              <div className="col-lg-6">
                <div className="card mb-4">
                  <div className="card-body">
                    <h5 className="section-title"><ShieldCheck size={20} /> Deductions</h5>
                    {deductions.length === 0
                      ? <p className="text-muted small">No deductions applicable.</p>
                      : deductions.map((d, i) => (
                        <div key={i} className="d-flex justify-content-between align-items-center py-2"
                          style={{ borderBottom: "1px solid #f3f4f6" }}>
                          <span className="small text-muted">{d.label}</span>
                          <span className="small fw-bold text-danger">{d.value}</span>
                        </div>
                      ))
                    }
                    <div className="d-flex justify-content-between mt-3 pt-2" style={{ borderTop: "2px solid #e5e7eb" }}>
                      <span className="fw-bold">Net Take Home</span>
                      <span className="fw-bold text-success fs-5">{fmt(sal.net_salary)}</span>
                    </div>
                  </div>
                </div>

                {/* Employment Info */}
                <div className="card">
                  <div className="card-body">
                    <h5 className="section-title"><Briefcase size={20} /> Employment Info</h5>
                    {[
                      { icon: <CheckCircle size={15} className="text-primary" />, label: "Employee Code",     value: emp.employee_code    || "—" },
                      { icon: <Briefcase   size={15} className="text-primary" />, label: "Employment Type",   value: emp.employment_type  || "—" },
                      { icon: <MapPin      size={15} className="text-primary" />, label: "Work Location",     value: emp.work_location    || "—" },
                      { icon: <Clock       size={15} className="text-primary" />, label: "Work Shift",        value: emp.work_shift       || "—" },
                      { icon: <Calendar    size={15} className="text-primary" />, label: "Date of Joining",   value: fmtDate(emp.date_of_joining) },
                      { icon: <Calendar    size={15} className="text-primary" />, label: "Confirmation Date", value: fmtDate(emp.confirmation_date) },
                      { icon: <UserCheck   size={15} className="text-primary" />, label: "Reporting Manager", value: emp.reporting_manager || "—" },
                    ].map((r, i, arr) => (
                      <div key={i} className="d-flex justify-content-between align-items-center py-2"
                        style={{ borderBottom: i < arr.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                        <span className="small text-muted d-flex align-items-center gap-2">{r.icon}{r.label}</span>
                        <span className="small fw-bold">{r.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </EmployeeLayout>
  );
}