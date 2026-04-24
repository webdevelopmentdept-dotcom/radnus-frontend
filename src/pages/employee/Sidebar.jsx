import { useState, useEffect } from "react";
import axios from "axios";
import {
  FileText, Building2, LayoutDashboard, User,
  LogOut, TrendingUp, ClipboardList, Wallet,
  Bell, Settings, CalendarCheck, X,
  ChevronRight, Sun, Moon, Sparkles, MessageCircle
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const NAV_ITEMS = [
  { href: "/employee/dashboard",              icon: LayoutDashboard, label: "Dashboard"        },
  { href: "/employee/profile",                icon: User,            label: "My Profile"       },
  { href: "/employee/attendance",             icon: CalendarCheck,   label: "Attendance"       },
  { href: "/employee/performance",            icon: TrendingUp,      label: "My Performance"   },
  { href: "/employee/training",               icon: TrendingUp,      label: "Training Roadmap" },
  { href: "/employee/self-assessment",        icon: ClipboardList,   label: "Self Assessment"  },
  { href: "/employee/360-feedback",           icon: MessageCircle,   label: "360° Feedback"    },
  { href: "/employee/my-salary",              icon: Wallet,          label: "My Salary" },
  { href: "/employee/appraisal", icon: TrendingUp, label: "My Appraisals" },
  { href: "/employee/my-incentive", icon: Wallet, label: "My Incentive" },
  { href: "/employee/dashboard/impact-bonus", icon: Sparkles,        label: "Impact Bonus"     },
  { href: "/employee/my-documents",           icon: FileText,        label: "My Documents"     },
  { href: "/employee/wellness",               icon: Sparkles,        label: "Wellness"         },
  { href: "/employee/alumni-network",         icon: User,            label: "Alumni Network"   },
  { href: "/employee/clubs",                  icon: Building2,       label: "My Clubs"         },
  { href: "/employee/leadership-track",       icon: TrendingUp,      label: "Leadership Track" },
  { href: "/employee/retention",              icon: User,            label: "Retention Plan"   },
  { href: "/employee/policies",               icon: FileText,        label: "Policies"         },
  { href: "/employee/notifications",          icon: Bell,            label: "Notifications", badge: true },
  { href: "/employee/settings",              icon: Settings,        label: "Settings"         },
];

// ── EmployeeSidebar ──────────────────────────────────────────────────────────
// Props:
//   handleLogout  — logout callback from EmployeeLayout
//   employee      — employee object from EmployeeLayout
//   isOpen        — boolean, controlled by EmployeeLayout (mobile sidebar state)
//   setIsOpen     — setter, controlled by EmployeeLayout
// The hamburger button has been REMOVED from here — it now lives in EmployeeLayout's
// mobile topbar so the page title is never overlapped.
// ─────────────────────────────────────────────────────────────────────────────
export default function EmployeeSidebar({ handleLogout, employee, isOpen, setIsOpen }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [active,      setActive]      = useState(window.location.pathname);

  const [dark, setDark] = useState(() => {
    return localStorage.getItem("esb-theme") !== "light";
  });

  useEffect(() => {
    localStorage.setItem("esb-theme", dark ? "dark" : "light");
  }, [dark]);

  // ── Lock body scroll when mobile sidebar is open ─────────────────────────
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  // ── Fetch unread notifications ───────────────────────────────────────────
  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const id = localStorage.getItem("employeeId");
        if (!id) return;
        const res = await axios.get(`${API_BASE}/api/notifications/${id}`);
        const all = res.data?.data || res.data || [];
        setUnreadCount(all.filter(n => !n.isRead).length);
      } catch (e) { console.log(e); }
    };
    fetchUnread();
    const iv = setInterval(fetchUnread, 30000);
    return () => clearInterval(iv);
  }, []);

  const avatarUrl =
    employee?.profileImage ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(employee?.name || "U")}&background=${dark ? "6366f1" : "3d5af1"}&color=fff&size=128`;

  const T = dark ? {
    bg:          "#0f1117",
    surface:     "#16181f",
    border:      "rgba(255,255,255,0.07)",
    accent:      "#6366f1",
    accent2:     "#8b5cf6",
    text:        "#e2e8f0",
    muted:       "rgba(255,255,255,0.38)",
    hover:       "rgba(99,102,241,0.13)",
    activeBg:    "rgba(99,102,241,0.20)",
    profBg:      "#16181f",
    dotGrid:     "rgba(99,102,241,0.04)",
    skelBg:      "rgba(255,255,255,0.08)",
    sbShadow:    "rgba(0,0,0,0.55)",
    scrollThumb: "rgba(99,102,241,0.35)",
    scrollTrack: "rgba(255,255,255,0.04)",
    hamShadow:   "rgba(99,102,241,0.45)",
  } : {
    bg:          "#ffffff",
    surface:     "#f4f6fc",
    border:      "rgba(0,0,0,0.07)",
    accent:      "#3d5af1",
    accent2:     "#6366f1",
    text:        "#1e293b",
    muted:       "rgba(30,41,59,0.42)",
    hover:       "rgba(61,90,241,0.07)",
    activeBg:    "rgba(61,90,241,0.11)",
    profBg:      "#eef1fd",
    dotGrid:     "rgba(61,90,241,0.04)",
    skelBg:      "rgba(0,0,0,0.07)",
    sbShadow:    "rgba(0,0,0,0.10)",
    scrollThumb: "rgba(61,90,241,0.25)",
    scrollTrack: "rgba(0,0,0,0.04)",
    hamShadow:   "rgba(61,90,241,0.38)",
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap');

        /* ═══════════════════════════════════════════
           SIDEBAR SHELL
        ═══════════════════════════════════════════ */
        .esb {
          font-family: 'Sora', sans-serif;
          width: 245px;
          background: ${T.bg};
          border-right: 1px solid ${T.border};
          display: flex;
          flex-direction: column;
          position: fixed;
          top: 0; left: 0;
          height: 100vh;
          height: 100dvh;
          z-index: 200;
          overflow: hidden;
          box-shadow: 2px 0 28px ${T.sbShadow};
          transition: transform 0.26s cubic-bezier(.4,0,.2,1),
                      background 0.28s, border-color 0.28s, box-shadow 0.28s;
          will-change: transform;
        }
        .esb::before {
          content: '';
          position: absolute; inset: 0;
          background-image: radial-gradient(${T.dotGrid} 1px, transparent 1px);
          background-size: 22px 22px;
          pointer-events: none; z-index: 0;
        }
        .esb > * { position: relative; z-index: 1; }

        /* ── Desktop always visible ─────────────── */
        @media (min-width: 768px) {
          .esb { transform: translateX(0) !important; }
          .esb-overlay { display: none !important; }
        }

        /* ── Mobile slide-in ────────────────────── */
        @media (max-width: 767px) {
          .esb {
            transform: translateX(-100%);
            width: 272px;
            padding-bottom: env(safe-area-inset-bottom, 0px);
          }
          .esb.open { transform: translateX(0); }
        }

        /* ═══════════════════════════════════════════
           OVERLAY
        ═══════════════════════════════════════════ */
        .esb-overlay {
          display: none;
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.52);
          backdrop-filter: blur(3px);
          -webkit-backdrop-filter: blur(3px);
          z-index: 199;
          touch-action: none;
        }
        .esb-overlay.open { display: block; }

        /* ═══════════════════════════════════════════
           BRAND
        ═══════════════════════════════════════════ */
        .esb-brand {
          display: flex; align-items: center; gap: 10px;
          padding: 18px 15px 14px;
          border-bottom: 1px solid ${T.border};
          flex-shrink: 0;
          transition: border-color 0.28s;
        }
        .esb-brand-icon {
          width: 34px; height: 34px; flex-shrink: 0;
          background: linear-gradient(135deg, ${T.accent}, ${T.accent2});
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 14px ${T.hamShadow};
        }
        .esb-brand-text { flex: 1; min-width: 0; }
        .esb-brand-name {
          color: ${T.text}; font-size: 13.5px; font-weight: 700;
          letter-spacing: -0.2px; white-space: nowrap;
          overflow: hidden; text-overflow: ellipsis;
          transition: color 0.28s;
        }
        .esb-brand-sub {
          color: ${T.muted}; font-size: 8.5px; font-weight: 500;
          letter-spacing: 0.9px; text-transform: uppercase; margin-top: 1px;
          transition: color 0.28s;
        }
        .esb-close-btn {
          background: none; border: none;
          color: ${T.muted}; cursor: pointer;
          padding: 6px; border-radius: 8px;
          display: none; flex-shrink: 0;
          transition: color 0.2s, background 0.2s;
          -webkit-tap-highlight-color: transparent;
        }
        .esb-close-btn:hover,
        .esb-close-btn:active { color: ${T.text}; background: ${T.hover}; }
        @media (max-width: 767px) { .esb-close-btn { display: flex; } }

        /* ═══════════════════════════════════════════
           PROFILE CARD
        ═══════════════════════════════════════════ */
        .esb-profile {
          margin: 10px 10px 4px;
          background: ${T.profBg};
          border: 1px solid ${T.border};
          border-radius: 13px;
          padding: 11px;
          display: flex; align-items: center; gap: 10px;
          position: relative; overflow: hidden;
          flex-shrink: 0;
          transition: background 0.28s, border-color 0.28s;
        }
        .esb-profile::after {
          content: '';
          position: absolute; top: -22px; left: -14px;
          width: 80px; height: 80px;
          background: radial-gradient(circle,
            ${dark ? "rgba(99,102,241,0.22)" : "rgba(61,90,241,0.10)"},
            transparent 70%);
          pointer-events: none;
        }
        .esb-avatar-wrap { position: relative; flex-shrink: 0; }
        .esb-avatar {
          width: 40px; height: 40px;
          border-radius: 10px; object-fit: cover;
          border: 2px solid ${T.accent}55;
          display: block;
        }
        .esb-status-dot {
          position: absolute; bottom: -2px; right: -2px;
          width: 10px; height: 10px;
          background: #22c55e; border-radius: 50%;
          border: 2px solid ${T.bg};
        }
        .esb-profile-info { overflow: hidden; flex: 1; min-width: 0; }
        .esb-profile-name {
          color: ${T.text}; font-size: 12.5px; font-weight: 600;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          transition: color 0.28s;
        }
        .esb-profile-role {
          color: ${T.muted}; font-size: 10px; margin-top: 2px;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          transition: color 0.28s;
        }
        .esb-active-badge {
          background: ${dark ? "rgba(34,197,94,0.14)" : "rgba(34,197,94,0.10)"};
          color: #22c55e;
          font-size: 8px; font-weight: 700;
          letter-spacing: 0.4px; text-transform: uppercase;
          padding: 3px 7px; border-radius: 20px;
          border: 1px solid rgba(34,197,94,0.25);
          flex-shrink: 0;
        }

        /* ═══════════════════════════════════════════
           DARK / LIGHT TOGGLE
        ═══════════════════════════════════════════ */
        .esb-toggle-row {
          display: flex; align-items: center; justify-content: space-between;
          margin: 0 10px 3px;
          padding: 7px 11px;
          background: ${dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)"};
          border-radius: 10px;
          border: 1px solid ${T.border};
          flex-shrink: 0;
          transition: background 0.28s, border-color 0.28s;
        }
        .esb-toggle-label {
          font-size: 10.5px; font-weight: 600;
          color: ${T.muted};
          display: flex; align-items: center; gap: 5px;
          transition: color 0.28s;
          user-select: none;
        }
        .esb-pill {
          width: 40px; height: 22px;
          background: ${dark ? T.accent : "#cbd5e1"};
          border-radius: 30px; position: relative;
          cursor: pointer; border: none;
          transition: background 0.28s; flex-shrink: 0;
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
        }
        .esb-thumb {
          position: absolute; top: 3px;
          left: ${dark ? "20px" : "3px"};
          width: 16px; height: 16px;
          background: #fff; border-radius: 50%;
          transition: left 0.24s cubic-bezier(.4,0,.2,1);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 1px 5px rgba(0,0,0,0.25);
          pointer-events: none;
        }

        /* ═══════════════════════════════════════════
           SECTION LABEL
        ═══════════════════════════════════════════ */
        .esb-section-label {
          padding: 9px 18px 3px;
          font-size: 8.5px; font-weight: 700;
          letter-spacing: 1.1px; text-transform: uppercase;
          color: ${T.muted};
          flex-shrink: 0;
          transition: color 0.28s;
        }

        /* ═══════════════════════════════════════════
           NAV — THE ONLY SCROLLABLE ZONE
        ═══════════════════════════════════════════ */
        .esb-nav {
          display: flex; flex-direction: column;
          padding: 0 8px 4px;
          gap: 1px;
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          overflow-x: hidden;
          -webkit-overflow-scrolling: touch;
          overscroll-behavior: contain;
          scrollbar-width: thin;
          scrollbar-color: ${T.scrollThumb} ${T.scrollTrack};
        }
        .esb-nav::-webkit-scrollbar { width: 4px; }
        .esb-nav::-webkit-scrollbar-track {
          background: ${T.scrollTrack}; border-radius: 4px;
        }
        .esb-nav::-webkit-scrollbar-thumb {
          background: ${T.scrollThumb}; border-radius: 4px;
        }
        .esb-nav::-webkit-scrollbar-thumb:hover { background: ${T.accent}88; }

        /* ── Nav Link ───────────────────────────── */
        .esb-link {
          display: flex; align-items: center; gap: 10px;
          padding: 9px 10px; border-radius: 10px;
          color: ${T.muted};
          text-decoration: none; font-size: 13px; font-weight: 500;
          white-space: nowrap;
          transition: background 0.17s, color 0.17s;
          position: relative; cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
          flex-shrink: 0;
        }
        .esb-link:hover { background: ${T.hover}; color: ${T.text}; text-decoration: none; }
        .esb-link:active { background: ${T.activeBg}; }
        .esb-link.active { background: ${T.activeBg}; color: ${T.accent}; font-weight: 600; }
        .esb-link.active::before {
          content: '';
          position: absolute; left: 0; top: 22%; bottom: 22%;
          width: 3px;
          background: linear-gradient(180deg, ${T.accent}, ${T.accent2});
          border-radius: 0 3px 3px 0;
        }
        .esb-link-icon {
          width: 28px; height: 28px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          background: transparent;
          transition: background 0.17s; flex-shrink: 0;
        }
        .esb-link:hover .esb-link-icon,
        .esb-link.active .esb-link-icon {
          background: ${dark ? "rgba(99,102,241,0.18)" : "rgba(61,90,241,0.10)"};
        }
        .esb-link-label { flex: 1; min-width: 0; }
        .esb-arrow {
          opacity: 0; color: ${T.accent};
          transition: opacity 0.17s, transform 0.17s; flex-shrink: 0;
        }
        .esb-link:hover .esb-arrow,
        .esb-link.active .esb-arrow { opacity: 1; transform: translateX(2px); }

        /* ── Notif badge ─────────────────────────── */
        .esb-badge {
          background: linear-gradient(135deg, #ef4444, #f97316);
          color: #fff; border-radius: 20px;
          min-width: 18px; height: 18px;
          font-size: 9.5px; font-weight: 700;
          display: flex; align-items: center; justify-content: center;
          padding: 0 5px; flex-shrink: 0;
          box-shadow: 0 2px 8px rgba(239,68,68,0.38);
          animation: pulse-notif 2.2s infinite;
        }
        @keyframes pulse-notif {
          0%,100% { box-shadow: 0 2px 8px rgba(239,68,68,0.38); }
          50%      { box-shadow: 0 2px 18px rgba(239,68,68,0.65); }
        }

        /* ── Skeleton ────────────────────────────── */
        .esb-skel {
          background: ${T.skelBg};
          border-radius: 8px;
          animation: esb-sk 1.5s infinite;
        }
        @keyframes esb-sk {
          0%   { opacity: 0.4; }
          50%  { opacity: 0.85; }
          100% { opacity: 0.4; }
        }

        /* ═══════════════════════════════════════════
           FOOTER
        ═══════════════════════════════════════════ */
        .esb-footer {
          padding: 8px 8px 12px;
          border-top: 1px solid ${T.border};
          flex-shrink: 0;
          transition: border-color 0.28s;
        }
        .esb-signout {
          display: flex; align-items: center; gap: 10px;
          padding: 9px 10px; border-radius: 10px;
          color: rgba(239,68,68,0.72);
          font-size: 13px; font-weight: 500;
          cursor: pointer; border: none;
          background: transparent; width: 100%;
          text-align: left; font-family: 'Sora', sans-serif;
          transition: background 0.17s, color 0.17s;
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
        }
        .esb-signout:hover  { background: rgba(239,68,68,0.09); color: #ef4444; }
        .esb-signout:active { background: rgba(239,68,68,0.14); color: #ef4444; }
        .esb-signout-icon {
          width: 28px; height: 28px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          background: rgba(239,68,68,0.10); flex-shrink: 0;
          transition: background 0.17s;
        }
        .esb-signout:hover .esb-signout-icon { background: rgba(239,68,68,0.18); }
        .esb-version {
          display: flex; align-items: center; justify-content: center;
          gap: 4px; margin-top: 8px;
          font-size: 9px; color: ${T.muted};
          letter-spacing: 0.3px;
          transition: color 0.28s;
          user-select: none;
        }
      `}</style>

      {/* ── Overlay — tap to close ── */}
      <div
        className={`esb-overlay ${isOpen ? "open" : ""}`}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      {/* ── Sidebar ── */}
      <aside className={`esb ${isOpen ? "open" : ""}`} aria-label="Navigation">

        {/* Brand */}
        <div className="esb-brand">
          <div className="esb-brand-icon">
            <Building2 size={17} color="#fff" />
          </div>
          <div className="esb-brand-text">
            <div className="esb-brand-name">Employee Portal</div>
            <div className="esb-brand-sub">HRMS Platform</div>
          </div>
          {/* Close button — mobile only, inside sidebar */}
          <button
            className="esb-close-btn"
            onClick={() => setIsOpen(false)}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Profile Card */}
        <div className="esb-profile">
          {employee ? (
            <>
              <div className="esb-avatar-wrap">
                <img src={avatarUrl} alt={employee.name} className="esb-avatar" />
                <span className="esb-status-dot" />
              </div>
              <div className="esb-profile-info">
                <div className="esb-profile-name">{employee.name}</div>
                <div className="esb-profile-role">
                  {employee.department || employee.designation || "Employee"}
                </div>
              </div>
              <div className="esb-active-badge">Active</div>
            </>
          ) : (
            <>
              <div className="esb-skel" style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0 }} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 7, minWidth: 0 }}>
                <div className="esb-skel" style={{ height: 11, width: "80%" }} />
                <div className="esb-skel" style={{ height: 9,  width: "55%" }} />
              </div>
            </>
          )}
        </div>

        {/* Dark / Light Toggle */}
        <div className="esb-toggle-row">
          <span className="esb-toggle-label">
            {dark ? <Moon size={11} /> : <Sun size={11} />}
            {dark ? "Dark Mode" : "Light Mode"}
          </span>
          <button className="esb-pill" onClick={() => setDark(d => !d)} aria-label="Toggle theme">
            <span className="esb-thumb">
              {dark
                ? <Moon size={8} color={T.accent} />
                : <Sun  size={8} color="#f59e0b"  />}
            </span>
          </button>
        </div>

        {/* Section label */}
        <div className="esb-section-label">Main Menu</div>

        {/* Nav — scrollable zone */}
        <nav className="esb-nav">
          {NAV_ITEMS.map(({ href, icon: Icon, label, badge }) => {
            const isActive = active === href;
            return (
              <a
                key={href}
                href={href}
                className={`esb-link ${isActive ? "active" : ""}`}
                onClick={() => { setActive(href); setIsOpen(false); }}
              >
                <span className="esb-link-icon"><Icon size={15} /></span>
                <span className="esb-link-label">{label}</span>
                {badge && unreadCount > 0 ? (
                  <span className="esb-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>
                ) : (
                  <ChevronRight size={12} className="esb-arrow" />
                )}
              </a>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="esb-footer">
          <button className="esb-signout" onClick={handleLogout}>
            <span className="esb-signout-icon"><LogOut size={14} /></span>
            Sign Out
          </button>
          <div className="esb-version">
            <Sparkles size={9} /> HRMS v2.0
          </div>
        </div>

      </aside>
    </>
  );
}