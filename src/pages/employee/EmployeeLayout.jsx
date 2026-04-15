import { useEffect, useState } from "react";
import axios from "axios";
import EmployeeSidebar from "./Sidebar";

export default function EmployeeLayout({ children, pageTitle }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [employee, setEmployee] = useState(null);
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
        if (!id) return;
        const res = await axios.get(`${API_BASE}/api/employee/me/${id}`);
        setEmployee(res.data);
      } catch (err) {
        console.log(err);
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

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f0f2f5" }}>

      {/* ══════════════════════════════════════════════════════
          GLOBAL MOBILE HEADER HIDE
          — Hides the FIRST header/topbar inside every page
          — Works even if className is unknown
          — Layout topbar handles [≡] [Title] [Avatar]
          ══════════════════════════════════════════════════════ */}
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

          /* ── Strategy 2: Generic — catches ANY header/topbar
             that is sticky or has position:sticky/fixed ──
             This covers pages whose className we don't know */
          .emp-page-header,
          .page-header,
          .page-topbar,
          .emp-topbar,
          .emp-header {
            display: none !important;
          }

          /* ── Strategy 3: Target the first <header> tag
             inside the page content area directly ── */
          #emp-page-content > header:first-child,
          #emp-page-content > div > header:first-child {
            display: none !important;
          }

        }
      `}</style>

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

        {/* Page content — id used for Strategy 3 CSS selector */}
        <div id="emp-page-content" style={{ flex: 1 }}>
          {children}
        </div>
      </main>
    </div>
  );
}