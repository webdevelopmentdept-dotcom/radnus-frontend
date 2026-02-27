import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";

export default function HrSidebar() {
  const navigate = useNavigate();
  const [show, setShow] = useState(false);

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const sidebarStyle = {
    width: "260px",
    height: "100vh",
    position: "fixed",
    top: 0,
    left: 0,
    background: "#111827", // dark professional color
    color: "#fff",
    padding: "20px",
    overflowY: "auto",
    zIndex: 1000,
  };

  const linkBase = {
    display: "block",
    padding: "10px 14px",
    borderRadius: "8px",
    marginBottom: "6px",
    textDecoration: "none",
    color: "#e5e7eb",
    fontSize: "17px",
    transition: "0.2s",
  };

  const activeStyle = {
    background: "#f3f4f6",
    color: "#111",
    fontWeight: "600",
  };

  const sectionTitle = {
    fontSize: "12px",
    color: "#9ca3af",
    marginTop: "18px",
    marginBottom: "8px",
    textTransform: "uppercase",
    letterSpacing: "1px",
  };

  return (
    <>
      {/* Mobile Toggle */}
      <button
        className="btn btn-dark d-md-none m-2"
        onClick={() => setShow(true)}
      >
        ☰
      </button>

      {/* Sidebar */}
      <div
        style={{
          ...sidebarStyle,
          display: show ? "block" : "none",
        }}
        className="d-md-block"
      >
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 style={{ fontWeight: "bold", margin: 0 }}>HR Panel</h5>

          {/* Close Button */}
          <button
            className="btn btn-sm btn-light d-md-none"
            onClick={() => setShow(false)}
          >
            ✕
          </button>
        </div>

        {/* Dashboard */}
        <NavLink
          to="/hr/dashboard"
          style={({ isActive }) => ({
            ...linkBase,
            ...(isActive ? activeStyle : {}),
          })}
        >
          🏠 Dashboard
        </NavLink>

        {/* Recruitment */}
        <div style={sectionTitle}>Recruitment</div>
        <NavLink
          to="/hr/dashboard/applicants"
          style={({ isActive }) => ({
            ...linkBase,
            ...(isActive ? activeStyle : {}),
          })}
        >
          📄 Applicants
        </NavLink>

        {/* Employees */}
        <div style={sectionTitle}>Employees</div>
        <NavLink
          to="/hr/dashboard/employees"
          style={({ isActive }) => ({
            ...linkBase,
            ...(isActive ? activeStyle : {}),
          })}
        >
          👥 All Employees
        </NavLink>

        <NavLink
          to="/hr/dashboard/hr-pending"
          style={({ isActive }) => ({
            ...linkBase,
            ...(isActive ? activeStyle : {}),
          })}
        >
          🔴 Pending Approvals
        </NavLink>

        <NavLink
          to="/hr/dashboard/hr-approved"
          style={({ isActive }) => ({
            ...linkBase,
            ...(isActive ? activeStyle : {}),
          })}
        >
          🟢 Approved
        </NavLink>

        <NavLink
          to="/hr/dashboard/hr-reject"
          style={({ isActive }) => ({
            ...linkBase,
            ...(isActive ? activeStyle : {}),
          })}
        >
          ❌ Rejected
        </NavLink>

        {/* Attendance */}
        <div style={sectionTitle}>Attendance</div>
        <NavLink
          to="/hr/dashboard/attendance/daily"
          style={({ isActive }) => ({
            ...linkBase,
            ...(isActive ? activeStyle : {}),
          })}
        >
          📅 Daily
        </NavLink>

        <NavLink
          to="/hr/dashboard/attendance/monthly"
          style={({ isActive }) => ({
            ...linkBase,
            ...(isActive ? activeStyle : {}),
          })}
        >
          📊 Monthly
        </NavLink>

        <NavLink
          to="/hr/dashboard/attendance/late"
          style={({ isActive }) => ({
            ...linkBase,
            ...(isActive ? activeStyle : {}),
          })}
        >
          ⏰ Late
        </NavLink>

        {/* Leave */}
        <div style={sectionTitle}>Leave</div>
        <NavLink
          to="/hr/dashboard/leave/requests"
          style={({ isActive }) => ({
            ...linkBase,
            ...(isActive ? activeStyle : {}),
          })}
        >
          📨 Requests
        </NavLink>

        <NavLink
          to="/hr/dashboard/leave/history"
          style={({ isActive }) => ({
            ...linkBase,
            ...(isActive ? activeStyle : {}),
          })}
        >
          📜 History
        </NavLink>

        {/* Payroll */}
        <div style={sectionTitle}>Payroll</div>
        <NavLink
          to="/hr/dashboard/payroll"
          style={({ isActive }) => ({
            ...linkBase,
            ...(isActive ? activeStyle : {}),
          })}
        >
          💰 Salary
        </NavLink>

        <NavLink
          to="/hr/dashboard/payslip"
          style={({ isActive }) => ({
            ...linkBase,
            ...(isActive ? activeStyle : {}),
          })}
        >
          🧾 Payslip
        </NavLink>

        {/* Reports */}
        <div style={sectionTitle}>Reports</div>
        <NavLink
          to="/hr/dashboard/reports/employees"
          style={({ isActive }) => ({
            ...linkBase,
            ...(isActive ? activeStyle : {}),
          })}
        >
          📊 Employees
        </NavLink>

        <NavLink
          to="/hr/dashboard/reports/attendance"
          style={({ isActive }) => ({
            ...linkBase,
            ...(isActive ? activeStyle : {}),
          })}
        >
          📈 Attendance
        </NavLink>

        {/* Settings */}
        <div style={sectionTitle}>Settings</div>
        <NavLink
          to="/hr/dashboard/settings"
          style={({ isActive }) => ({
            ...linkBase,
            ...(isActive ? activeStyle : {}),
          })}
        >
          ⚙️ Settings
        </NavLink>

        {/* Logout */}
        <button
          onClick={logout}
          className="btn btn-light w-100 mt-3 fw-semibold"
        >
          Logout
        </button>
      </div>

      {/* Desktop spacing */}
      <div className="d-none d-md-block" style={{ marginLeft: "260px" }}></div>
    </>
  );
}