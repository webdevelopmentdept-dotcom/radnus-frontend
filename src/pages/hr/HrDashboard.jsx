import { Outlet, useNavigate } from "react-router-dom";
import HrSidebar from "./HrSidebar";
import { useEffect, useState, useRef } from "react";
import axios from "axios";

// ── Bell icon (inline SVG, no extra import needed) ──
const BellIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

function getHrId() {
  const hrUserRaw = localStorage.getItem("hrUser");
  if (hrUserRaw) {
    try {
      const obj = JSON.parse(hrUserRaw);
      const id = obj?._id || obj?.id || obj?.hrId || obj?.userId;
      if (id) return String(id);
    } catch (_) {}
  }
  const hrId = localStorage.getItem("hrId");
  if (hrId && hrId !== "undefined" && hrId !== "null" && hrId.trim() !== "") return hrId.trim();
  return null;
}

export default function HrDashboard() {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const API_BASE = import.meta.env.VITE_API_BASE_URL;

  const [pendingCount, setPendingCount] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  const hrRole = localStorage.getItem("hrRole") || "hr";
  const isEmployee = hrRole === "employee";

  // ══════════════════════════════════════════
  // ✅ NEW — Notification Toast → Bell logic
  // ══════════════════════════════════════════
  const [unreadCount, setUnreadCount] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const [showBell, setShowBell] = useState(false);
  const toastTimerRef = useRef(null);
  const hasShownToastRef = useRef(false); // toast oru session-la once mattum varum

  const hrId = getHrId();

  useEffect(() => {
    if (isEmployee || !hrId) return;

    const fetchUnreadNotifications = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/notifications/hr/${hrId}`);
        const data = res.data?.data || res.data || [];
        const count = data.filter(n => !n.isRead).length;
        setUnreadCount(count);

        if (count > 0) {
          setShowBell(true); // bell eppovum theriyum unread irundha
          // toast session-ku once mattum show pannanum
          if (!hasShownToastRef.current) {
            hasShownToastRef.current = true;
            setShowToast(true);
            if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
            toastTimerRef.current = setTimeout(() => {
              setShowToast(false);
            }, 5000);
          }
        } else {
          setShowBell(false);
          setShowToast(false);
        }
      } catch (e) {
        console.log(e);
      }
    };

    fetchUnreadNotifications();
    const interval = setInterval(fetchUnreadNotifications, 30000);

    // ✅ Listen for instant refresh trigger (fired when notifications are marked read anywhere)
    window.addEventListener("notifications-updated", fetchUnreadNotifications);

    return () => {
      clearInterval(interval);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      window.removeEventListener("notifications-updated", fetchUnreadNotifications);
    };
  }, [hrId, isEmployee]);

  const goToNotifications = () => {
    navigate("/hr/dashboard/notifications");
  };
  // ══════════════════════════════════════════
  // END — Notification logic
  // ══════════════════════════════════════════

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (isEmployee) return;
    const fetchPending = async () => {
      try {
        const [assessRes, reviewRes] = await Promise.all([
          axios.get(`${API_BASE}/api/self-assessment/all`),
          axios.get(`${API_BASE}/api/performance-reviews/all`),
        ]);
        const assessments = assessRes.data?.data || [];
        const reviews = reviewRes.data?.data || [];
        const reviewedIds = new Set(reviews.map(r => r.self_assessment_id));
        const pending = assessments.filter(a => !reviewedIds.has(a._id));
        setPendingCount(pending.length);
      } catch (e) {
        console.log(e);
      }
    };
    fetchPending();
    const interval = setInterval(fetchPending, 60000);
    return () => clearInterval(interval);
  }, []);

  const goToReviews = () => {
    navigate("/hr/dashboard/performance/reviews");
  };

  return (
    <div>
      <style>{`
        /* ══════════════════════════════════════════
           ✅ Wrapper — stacks notif + pending card
           automatically, no manual pixel math needed
        ══════════════════════════════════════════ */
        .top-right-stack {
          position: fixed;
          top: 16px;
          right: 20px;
          z-index: 1600;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 10px;
        }

        .pr-opp-card {
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 6px 20px rgba(0,0,0,0.10);
          padding: 9px 12px;
          display: flex;
          align-items: center;
          gap: 9px;
          max-width: 270px;
          width: 100%;
        }
        .pr-opp-icon {
          width: 28px; height: 28px;
          border-radius: 8px;
          background: #fef3c7;
          display: flex; align-items: center; justify-content: center;
          font-size: 13px;
          flex-shrink: 0;
        }
        .pr-opp-label {
          font-size: 9px; font-weight: 800; color: #d97706;
          text-transform: uppercase; letter-spacing: 0.4px;
        }
        .pr-opp-title {
          font-size: 12px; font-weight: 700; color: #1a1a2e;
          margin: 1px 0 0;
          line-height: 1.3;
        }
        .pr-opp-sub {
          display: none;
        }
        .pr-opp-actions {
          display: flex; flex-direction: column; gap: 4px;
          flex-shrink: 0;
        }
        .pr-opp-btn-view {
          background: #d97706; color: #fff;
          border: none; border-radius: 6px;
          padding: 4px 10px; font-size: 10.5px; font-weight: 700;
          cursor: pointer; white-space: nowrap;
        }
        .pr-opp-btn-cancel {
          background: transparent; color: #6b7280;
          border: 1px solid #e5e7eb; border-radius: 6px;
          padding: 3px 10px; font-size: 10px; font-weight: 600;
          cursor: pointer; white-space: nowrap;
        }

        /* ══════════════════════════════════════════
           ✅ NEW — Notification card (unified style,
           same design language as .pr-opp-card)
        ══════════════════════════════════════════ */
        .notif-card {
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 6px 20px rgba(0,0,0,0.10);
          padding: 9px 12px;
          display: flex;
          align-items: center;
          gap: 9px;
          max-width: 270px;
          width: 100%;
          cursor: pointer;
          animation: notifSlideIn 0.25s ease;
        }
        @keyframes notifSlideIn {
          from { transform: translateX(30px); opacity: 0; }
          to   { transform: translateX(0); opacity: 1; }
        }
        .notif-card-icon {
          width: 28px; height: 28px;
          border-radius: 8px;
          background: #eff6ff;
          color: #1d4ed8;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .notif-card-label {
          font-size: 9px; font-weight: 800; color: #1d4ed8;
          text-transform: uppercase; letter-spacing: 0.4px;
        }
        .notif-card-title {
          font-size: 12px; font-weight: 700; color: #1a1a2e;
          margin: 1px 0 0;
          line-height: 1.3;
        }
        .notif-card-sub {
          display: none;
        }
        .notif-card-actions {
          display: flex; flex-direction: column; gap: 4px;
          flex-shrink: 0;
        }
        .notif-card-btn-view {
          background: #1d4ed8; color: #fff;
          border: none; border-radius: 6px;
          padding: 4px 10px; font-size: 10.5px; font-weight: 700;
          cursor: pointer; white-space: nowrap;
        }
        .notif-card-btn-cancel {
          background: transparent; color: #6b7280;
          border: 1px solid #e5e7eb; border-radius: 6px;
          padding: 3px 10px; font-size: 10px; font-weight: 600;
          cursor: pointer; white-space: nowrap;
        }

        /* Compact bell chip (after 5s, same card family, slimmer) */
        .notif-bell-chip {
          background: #fff;
          border-radius: 14px;
          box-shadow: 0 8px 30px rgba(0,0,0,0.12);
          padding: 10px 14px;
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          animation: notifSlideIn 0.25s ease;
        }
        .notif-bell-chip-icon {
          width: 30px; height: 30px;
          border-radius: 9px;
          background: #eff6ff;
          color: #1d4ed8;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .notif-bell-chip-text {
          font-size: 12.5px; font-weight: 700; color: #1a1a2e;
          white-space: nowrap;
        }
        .notif-bell-chip-badge {
          min-width: 20px; height: 20px;
          background: #dc2626;
          color: #fff;
          border-radius: 99px;
          font-size: 11px;
          font-weight: 700;
          display: flex; align-items: center; justify-content: center;
          padding: 0 5px;
          flex-shrink: 0;
        }

        @media (max-width: 768px) {
          .top-right-stack {
            left: 12px; right: 12px; top: 12px;
            align-items: stretch;
          }
          .pr-opp-card, .notif-card, .notif-bell-chip {
            max-width: none;
          }
        }
      `}</style>

      {/* Sidebar */}
      <HrSidebar />

      {/* ✅ Single wrapper — auto-stacks notification + pending review, no manual pixel math */}
      <div className="top-right-stack">

        {/* Notification Card (auto-shrinks to bell chip after 5s) */}
        {!isEmployee && showToast && (
          <div className="notif-card" onClick={goToNotifications}>
            <div className="notif-card-icon"><BellIcon size={18} /></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="notif-card-label">Notification</div>
              <div className="notif-card-title">
                You have {unreadCount} unread notification{unreadCount > 1 ? "s" : ""}
              </div>
            </div>
            <div className="notif-card-actions">
              <button className="notif-card-btn-view" onClick={(e) => { e.stopPropagation(); goToNotifications(); }}>View</button>
              <button className="notif-card-btn-cancel" onClick={(e) => { e.stopPropagation(); setShowToast(false); }}>Cancel</button>
            </div>
          </div>
        )}

        {/* Compact bell chip (shows after card disappears, stays on every page) */}
        {!isEmployee && !showToast && showBell && unreadCount > 0 && (
          <div className="notif-bell-chip" onClick={goToNotifications} title="Notifications">
            <div className="notif-bell-chip-icon"><BellIcon size={16} /></div>
            <span className="notif-bell-chip-text">Notifications</span>
            <span className="notif-bell-chip-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>
          </div>
        )}

        {/* Pending Review Summary Card */}
        {!isEmployee && !dismissed && pendingCount > 0 && (
          <div className="pr-opp-card">
            <div className="pr-opp-icon">⏳</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="pr-opp-label">Pending Review</div>
              <div className="pr-opp-title">
                Review pending on {pendingCount} employee{pendingCount > 1 ? "s" : ""}
              </div>
            </div>
            <div className="pr-opp-actions">
              <button className="pr-opp-btn-view" onClick={goToReviews}>View</button>
              <button className="pr-opp-btn-cancel" onClick={() => setDismissed(true)}>Cancel</button>
            </div>
          </div>
        )}

      </div>

      {/* Main Content */}
      <div
        style={{
          marginLeft: isMobile ? "0px" : "260px",
          padding: isMobile ? "15px" : "20px",
          transition: "0.3s",
        }}
      >
        <Outlet />
      </div>
    </div>
  );
}