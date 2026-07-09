import { useEffect, useState } from "react";
import axios from "axios";
import EmployeeSidebar from "./Sidebar";
import { Clock, XCircle, FileEdit } from "lucide-react";

const ALWAYS_ALLOWED_PATHS = ["/employee/my-documents"];

export default function EmployeeLayout({ children, pageTitle }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [employee, setEmployee] = useState(null);
  const [statusLoaded, setStatusLoaded] = useState(false); // ✅ NEW
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const API_BASE = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        const id = localStorage.getItem("employeeId");
        if (!id) {
          setStatusLoaded(true); // ✅ no id, stop "loading" state
          return;
        }
        const res = await axios.get(`${API_BASE}/api/employee/me/${id}`);
        setEmployee(res.data);
      } catch (err) {
        console.log(err);
      } finally {
        setStatusLoaded(true); // ✅ NEW — fetch attempt finished, success or fail
      }
    };
    fetchEmployee();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("employeeId");
    window.location.href = "/login";
  };

  const derivedTitle = pageTitle || (() => {
    const path = window.location.pathname;
    const segment = path.split("/").filter(Boolean).pop() || "dashboard";
    return segment
      .split("-")
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  })();

  const avatarUrl =
    employee?.profileImage ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(employee?.name || "U")}&background=3d5af1&color=fff&size=64`;

  // ✅ status-based blur lock logic
  const status = employee?.status;
  const isApproved = status === "approved" || status === "active";
  const isRejected = status === "rejected";
  const currentPath = window.location.pathname;
  const isAllowedPath = ALWAYS_ALLOWED_PATHS.some(p => currentPath.startsWith(p));

  // ✅ UPDATED — no spinner/flash: content shows normally while status loads,
  // lock card appears only once status is confirmed & not approved.
  const showBlurLock = !isAllowedPath && statusLoaded && !isApproved;

  const goToDocuments = () => {
    window.location.href = "/employee/my-documents";
  };

  return (
    <>
      <style>{`
        @media (max-width: 767px) {

          /* ── Strategy 1: Known classNames ── */
          .ed-topbar,
          .ea-header,
          .ep-header,
          .perf-header,
          .epr-header,
          .profile-header,
          .sal-header,
          .salary-header,
          .ms-header,
          .my-salary-header,
          .sa-header,
          .self-header,
          .fb-header,
          .feedback-header,
          .tr-header,
          .training-header,
          .notif-header,
          .notifications-header,
          .settings-header,
          .docs-header,
          .doc-header,
          .wellness-header,
          .clubs-header,
          .club-header,
          .ib-header,
          .impact-header,
          .leadership-header,
          .retention-header,
          .alumni-header {
            display: none !important;
          }

          /* ── Strategy 2: Generic ── */
          .emp-page-header,
          .page-header,
          .page-topbar,
          .emp-topbar,
          .emp-header {
            display: none !important;
          }

          /* ── Strategy 3: Target first <header> tag ── */
          #emp-page-content > header:first-child,
          #emp-page-content > div > header:first-child {
            display: none !important;
          }

        }

        /* ✅ NEW — full layout blur (sidebar + content together) */
        .el-lock-blur-wrap {
          filter: blur(9px);
          pointer-events: none;
          user-select: none;
          transition: filter 0.2s ease;
        }
        .el-lock-overlay {
          position: fixed;
          inset: 0;
          z-index: 500;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: rgba(15, 17, 23, 0.28);
        }
        .el-lock-card {
          position: relative; /* NEW - anchors the top-right icon button */
          width: 100%;
          max-width: 420px;
          background: #fff;
          border-radius: 20px;
          padding: 32px 28px;
          text-align: center;
          box-shadow: 0 20px 60px rgba(0,0,0,0.25);
          font-family: 'Sora', 'Manrope', sans-serif;
        }
        .el-lock-icon-wrap {
          width: 64px; height: 64px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 18px;
        }
        .el-lock-title {
          font-size: 19px;
          font-weight: 700;
          color: #1a1d2e;
          margin-bottom: 8px;
        }
        .el-lock-subtitle {
          font-size: 13.5px;
          color: #6b7280;
          line-height: 1.5;
          margin-bottom: 18px;
        }
        .el-lock-remarks {
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 12px;
          padding: 12px 14px;
          text-align: left;
          font-size: 12.5px;
          color: #b91c1c;
          margin-bottom: 20px;
        }
        .el-lock-remarks b { display: block; margin-bottom: 3px; color: #991b1b; }

        /* ✅ NEW — icon-only edit button, top-right corner of card (replaces full-width button) */
        .el-lock-edit-icon-btn {
          position: absolute;
          top: 16px;
          right: 16px;
          width: 36px;
          height: 36px;
          border: none;
          border-radius: 10px;
          background: linear-gradient(135deg, #3d5af1, #6366f1);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 6px 14px rgba(61,90,241,0.35);
        }
        .el-lock-edit-icon-btn:hover {
          filter: brightness(1.05);
        }
      `}</style>

      {/* ✅ NEW — this wrapper now covers Sidebar + Main together, so blur applies to BOTH */}
      <div
        className={showBlurLock ? "el-lock-blur-wrap" : ""}
        style={{ display: "flex", minHeight: "100vh", background: "#f0f2f5" }}
      >
        {/* Sidebar */}
        <EmployeeSidebar
          handleLogout={handleLogout}
          employee={employee}
          isOpen={sidebarOpen}
          setIsOpen={setSidebarOpen}
        />

        <main
          style={{
            marginLeft: isMobile ? "0px" : "260px",
            flex: 1,
            minHeight: "100vh",
            transition: "margin-left 0.28s ease",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* ── Mobile Topbar ── */}
          {isMobile && (
            <div style={{
              position: "sticky",
              top: 0,
              zIndex: 100,
              background: "#fff",
              borderBottom: "1px solid #eef0f6",
              height: 52,
              display: "flex",
              alignItems: "center",
              padding: "0 14px",
              gap: 12,
              boxShadow: "0 1px 8px rgba(0,0,0,0.07)",
            }}>
              <button
                onClick={() => setSidebarOpen(true)}
                aria-label="Open menu"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: "#3d5af1",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  flexShrink: 0,
                  boxShadow: "0 3px 10px rgba(61,90,241,0.35)",
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round">
                  <line x1="3" y1="6"  x2="21" y2="6"  />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              </button>

              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  margin: 0,
                  fontSize: 15,
                  fontWeight: 700,
                  color: "#1a1d2e",
                  fontFamily: "'Sora', 'Manrope', sans-serif",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}>
                  {derivedTitle}
                </p>
              </div>

              <div style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                overflow: "hidden",
                border: "2px solid #e8eaf0",
                flexShrink: 0,
              }}>
                <img
                  src={avatarUrl}
                  alt={employee?.name || "User"}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
            </div>
          )}

          {/* Page content */}
          <div id="emp-page-content" style={{ flex: 1 }}>
            {children}
          </div>
        </main>
      </div>

      {/* ✅ Lock overlay card, sits on top, NOT blurred */}
      {showBlurLock && (
        <div className="el-lock-overlay">
          <div className="el-lock-card">
            {/* ✅ NEW — icon-only edit button, top-right corner (was full-width button at bottom) */}
            <button
              className="el-lock-edit-icon-btn"
              onClick={goToDocuments}
              title="Edit Documents"
              aria-label="Edit Documents"
            >
              <FileEdit size={16} />
            </button>

            <div
              className="el-lock-icon-wrap"
              style={{ background: isRejected ? "#fee2e2" : "#eef1fd" }}
            >
              {isRejected
                ? <XCircle size={30} color="#dc2626" />
                : <Clock size={30} color="#3d5af1" />}
            </div>

            <div className="el-lock-title">
              {isRejected ? "Application Rejected" : "Waiting for HR Approval"}
            </div>

            <div className="el-lock-subtitle">
              {isRejected
                ? "Your submitted documents were reviewed and need corrections. Please check the remarks below."
                : "Your documents are under review. Once HR approves, you'll get full access to the portal."}
            </div>

            {isRejected && employee?.remarks && (
              <div className="el-lock-remarks">
                <b>HR Remarks</b>
                {employee.remarks}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}