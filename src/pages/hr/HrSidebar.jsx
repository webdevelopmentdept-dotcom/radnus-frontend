import { NavLink, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Home01Icon,
  UserMultiple02Icon,
  CheckmarkCircle01Icon,
  CancelCircleIcon,
  Clock01Icon,
  CalendarCheckIn01Icon,
  Logout01Icon,
  Settings01Icon,
  BarChartIcon,
  Target01Icon,
  TaskDone01Icon,
  StarIcon,
  ChartAverageIcon,
  Menu01Icon,
  Cancel01Icon,
  MailSend01Icon,
  Task01Icon,
  Notification01Icon,
  Medal01Icon,
  Setting07Icon,
  Building04Icon,
} from "@hugeicons/core-free-icons";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export default function HrSidebar() {
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const id = localStorage.getItem("hrId");
        if (!id) return;
        const res = await axios.get(`${API_BASE}/api/notifications/hr/${id}`);
        const all = res.data?.data || res.data || [];
        setUnreadCount(all.filter(n => !n.isRead).length);
      } catch (e) { console.log(e); }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const close = () => setShow(false);

  return (
    <>
      <style>{`
        .hr-sidebar {
          width: 260px;
          height: 100vh;
          position: fixed;
          top: 0; left: 0;
          background: #111827;
          color: #fff;
          padding: 0;
          overflow-y: auto;
          z-index: 1000;
          display: flex;
          flex-direction: column;
          transition: transform 0.28s ease;
        }

        @media (min-width: 768px) {
          .hr-sidebar { transform: translateX(0) !important; display: flex !important; }
          .hr-menu-btn { display: none !important; }
          .hr-overlay  { display: none !important; }
        }

        @media (max-width: 767px) {
          .hr-sidebar { transform: translateX(-100%); }
          .hr-sidebar.open { transform: translateX(0); }
        }

        .hr-overlay {
          display: none;
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.5);
          z-index: 999;
        }
        .hr-overlay.open { display: block; }

        .hr-menu-btn {
          position: fixed;
          top: 14px; left: 14px;
          z-index: 998;
          background: #111827;
          border: none; border-radius: 8px;
          padding: 8px; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }

        .hr-brand {
          display: flex; align-items: center;
          justify-content: space-between;
          padding: 20px 20px 16px;
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }
        .hr-brand-title {
          font-size: 18px; font-weight: 800;
          color: #fff; letter-spacing: 0.3px;
        }
        .hr-close-btn {
          background: none; border: none;
          color: rgba(255,255,255,0.6);
          cursor: pointer; padding: 4px; display: none;
        }
        @media (max-width: 767px) {
          .hr-close-btn { display: flex; }
        }

        .hr-section {
          font-size: 10px; color: #6b7280;
          margin: 16px 20px 5px;
          text-transform: uppercase;
          letter-spacing: 1.2px; font-weight: 700;
          padding-bottom: 4px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }

        .hr-nav { padding: 8px 12px; flex: 1; }

        .hr-nav a {
          display: flex; align-items: center; gap: 12px;
          padding: 9px 14px; border-radius: 9px;
          margin-bottom: 1px; text-decoration: none;
          color: #d1d5db; font-size: 13.5px; font-weight: 500;
          transition: background 0.18s, color 0.18s;
          white-space: nowrap;
          position: relative;
        }
        .hr-nav a:hover {
          background: rgba(255,255,255,0.07);
          color: #fff; text-decoration: none;
        }
        .hr-nav a.active {
          background: #1d4ed8; color: #fff; font-weight: 600;
        }

        .hr-sub-item {
          display: flex; align-items: center; gap: 12px;
          padding: 8px 14px 8px 32px !important;
          font-size: 13px !important;
          color: #9ca3af !important;
        }
        .hr-sub-item:hover { color: #fff !important; }
        .hr-sub-item.active {
          background: #1d4ed8 !important;
          color: #fff !important;
        }

        .hr-notif-badge {
          position: absolute;
          top: 7px; right: 10px;
          background: #ef4444; color: #fff;
          border-radius: 50%;
          width: 18px; height: 18px;
          font-size: 10px; font-weight: 700;
          display: flex; align-items: center; justify-content: center;
          border: 2px solid #111827;
          line-height: 1;
        }

        .hr-logout-wrap {
          padding: 12px 12px 20px;
          border-top: 1px solid rgba(255,255,255,0.08);
          margin-top: auto;
        }
        .hr-logout-btn {
          display: flex; align-items: center; gap: 12px;
          width: 100%; padding: 10px 14px;
          border-radius: 9px; border: none;
          background: rgba(239,68,68,0.12);
          color: #f87171; font-size: 14px; font-weight: 600;
          cursor: pointer; transition: background 0.18s;
          font-family: inherit;
        }
        .hr-logout-btn:hover { background: rgba(239,68,68,0.22); }

        .hr-flow-label {
          font-size: 10px;
          color: #4ade80;
          background: rgba(74,222,128,0.1);
          border: 1px solid rgba(74,222,128,0.2);
          border-radius: 4px;
          padding: 1px 6px;
          margin-left: auto;
          font-weight: 600;
          flex-shrink: 0;
        }
      `}</style>

      {/* Mobile hamburger */}
      <button className="hr-menu-btn" onClick={() => setShow(true)}>
        <HugeiconsIcon icon={Menu01Icon} size={22} color="#fff" strokeWidth={2} />
      </button>

      {/* Overlay */}
      <div className={`hr-overlay ${show ? "open" : ""}`} onClick={close} />

      {/* Sidebar */}
      <div className={`hr-sidebar ${show ? "open" : ""}`}>

        {/* Brand */}
        <div className="hr-brand">
          <span className="hr-brand-title">🏢 HR Panel</span>
          <button className="hr-close-btn" onClick={close}>
            <HugeiconsIcon icon={Cancel01Icon} size={20} color="rgba(255,255,255,0.6)" strokeWidth={2} />
          </button>
        </div>

        <nav className="hr-nav">

          {/* ── DASHBOARD ── */}
          <NavLink to="/hr/dashboard" end
            className={({ isActive }) => isActive ? "active" : ""}
            onClick={close}>
            <HugeiconsIcon icon={Home01Icon} size={18} color="currentColor" strokeWidth={1.8} />
            Dashboard
          </NavLink>

          {/* ══════════════════════════════
              RECRUITMENT
          ══════════════════════════════ */}
          <div className="hr-section">Recruitment</div>

          <NavLink to="/hr/dashboard/applicants"
            className={({ isActive }) => isActive ? "active" : ""}
            onClick={close}>
            <HugeiconsIcon icon={MailSend01Icon} size={18} color="currentColor" strokeWidth={1.8} />
            Applicants
          </NavLink>

          <NavLink to="/hr/dashboard/job-postings"
            className={({ isActive }) => isActive ? "active" : ""}
            onClick={close}>
            <HugeiconsIcon icon={TaskDone01Icon} size={18} color="currentColor" strokeWidth={1.8} />
            Job Postings
          </NavLink>

          {/* ══════════════════════════════
              EMPLOYEES
          ══════════════════════════════ */}
          <div className="hr-section">Employees</div>

          <NavLink to="/hr/dashboard/employees"
            className={({ isActive }) => isActive ? "active" : ""}
            onClick={close}>
            <HugeiconsIcon icon={UserMultiple02Icon} size={18} color="currentColor" strokeWidth={1.8} />
            All Employees
          </NavLink>

          <NavLink to="/hr/dashboard/hr-pending"
            className={({ isActive }) => isActive ? "active" : ""}
            onClick={close}>
            <HugeiconsIcon icon={Clock01Icon} size={18} color="currentColor" strokeWidth={1.8} />
            Pending Approvals
          </NavLink>

          <NavLink to="/hr/dashboard/hr-approved"
            className={({ isActive }) => isActive ? "active" : ""}
            onClick={close}>
            <HugeiconsIcon icon={CheckmarkCircle01Icon} size={18} color="currentColor" strokeWidth={1.8} />
            Approved
          </NavLink>

          <NavLink to="/hr/dashboard/hr-reject"
            className={({ isActive }) => isActive ? "active" : ""}
            onClick={close}>
            <HugeiconsIcon icon={CancelCircleIcon} size={18} color="currentColor" strokeWidth={1.8} />
            Rejected
          </NavLink>

          {/* ══════════════════════════════
              REPORTS
          ══════════════════════════════ */}
          <div className="hr-section">Reports</div>

          <NavLink to="/hr/dashboard/active-employees"
            className={({ isActive }) => isActive ? "active" : ""}
            onClick={close}>
            <HugeiconsIcon icon={BarChartIcon} size={18} color="currentColor" strokeWidth={1.8} />
            Activated Employees
          </NavLink>

          {/* ══════════════════════════════
              LEAVE
          ══════════════════════════════ */}
          <div className="hr-section">Leave</div>

          <NavLink to="/hr/dashboard/leave/requests"
            className={({ isActive }) => isActive ? "active" : ""}
            onClick={close}>
            <HugeiconsIcon icon={CalendarCheckIn01Icon} size={18} color="currentColor" strokeWidth={1.8} />
            Requests
          </NavLink>

          {/* ══════════════════════════════
              PERFORMANCE — KPI FLOW
              Step 1 → 2 → 3 → 4
          ══════════════════════════════ */}
          <div className="hr-section">Performance — KPI</div>

          {/* Step 1: Create the rulebook */}
          <NavLink to="/hr/dashboard/performance/kpi-templates"
            className={({ isActive }) => isActive ? "active hr-sub-item" : "hr-sub-item"}
            onClick={close}>
            <HugeiconsIcon icon={Target01Icon} size={16} color="currentColor" strokeWidth={1.8} />
            KPI Templates
            <span className="hr-flow-label">1</span>
          </NavLink>

          {/* Step 2: Assign to employee */}
          <NavLink to="/hr/dashboard/performance/assign-kpi"
            className={({ isActive }) => isActive ? "active hr-sub-item" : "hr-sub-item"}
            onClick={close}>
            <HugeiconsIcon icon={Task01Icon} size={16} color="currentColor" strokeWidth={1.8} />
            Assign KPIs
            <span className="hr-flow-label">2</span>
          </NavLink>

          {/* Step 3: HR reviews submitted actuals */}
          <NavLink to="/hr/dashboard/performance/reviews"
            className={({ isActive }) => isActive ? "active hr-sub-item" : "hr-sub-item"}
            onClick={close}>
            <HugeiconsIcon icon={StarIcon} size={16} color="currentColor" strokeWidth={1.8} />
            Reviews
            <span className="hr-flow-label">3</span>
          </NavLink>

          {/* Step 4: See final scores */}
          <NavLink to="/hr/dashboard/performance/reports"
            className={({ isActive }) => isActive ? "active hr-sub-item" : "hr-sub-item"}
            onClick={close}>
            <HugeiconsIcon icon={ChartAverageIcon} size={16} color="currentColor" strokeWidth={1.8} />
            Performance Reports
            <span className="hr-flow-label">4</span>
          </NavLink>

          {/* ══════════════════════════════
              PERFORMANCE — OKR FLOW
              Step 1 → 2
          ══════════════════════════════ */}
          <div className="hr-section">Performance — OKR</div>

          {/* Step 1: Create team objectives */}
          <NavLink to="/hr/dashboard/performance/okr-setup"
            className={({ isActive }) => isActive ? "active hr-sub-item" : "hr-sub-item"}
            onClick={close}>
            <HugeiconsIcon icon={Setting07Icon} size={16} color="currentColor" strokeWidth={1.8} />
            OKR Setup
            <span className="hr-flow-label">1</span>
          </NavLink>

          {/* Step 2: Track team progress */}
          <NavLink to="/hr/dashboard/performance/okr-dashboard"
            className={({ isActive }) => isActive ? "active hr-sub-item" : "hr-sub-item"}
            onClick={close}>
            <HugeiconsIcon icon={Target01Icon} size={16} color="currentColor" strokeWidth={1.8} />
            OKR Dashboard
            <span className="hr-flow-label">2</span>
          </NavLink>

          {/* ══════════════════════════════
              PERFORMANCE — OTHERS
          ══════════════════════════════ */}
          <div className="hr-section">Performance — Others</div>

          <NavLink to="/hr/dashboard/performance/variable-pay"
            className={({ isActive }) => isActive ? "active" : ""}
            onClick={close}>
            <HugeiconsIcon icon={ChartAverageIcon} size={18} color="currentColor" strokeWidth={1.8} />
            Variable Pay
          </NavLink>

          {/* ══════════════════════════════
                 APPRAISAL
            ══════════════════════════════ */}
          <div className="hr-section">Appraisal</div>

          <NavLink to="/hr/dashboard/appraisal"
            className={({ isActive }) => isActive ? "active" : ""}
            onClick={close}>
            <HugeiconsIcon icon={ChartAverageIcon} size={18} color="currentColor" strokeWidth={1.8} />
            Appraisal Hub
          </NavLink>


          <NavLink to="/hr/dashboard/performance/esop"
            className={({ isActive }) => isActive ? "active" : ""}
            onClick={close}>
            <HugeiconsIcon icon={BarChartIcon} size={18} color="currentColor" strokeWidth={1.8} />
            ESOP
          </NavLink>

          <NavLink to="/hr/dashboard/attendance/monthly"
            className={({ isActive }) => isActive ? "active" : ""}
            onClick={close}>
            <HugeiconsIcon icon={CalendarCheckIn01Icon} size={18} color="currentColor" strokeWidth={1.8} />
            Attendance
          </NavLink>

          {/* ══════════════════════════════
              RECOGNITION
          ══════════════════════════════ */}
          <div className="hr-section">Recognition</div>

          <NavLink to="/hr/dashboard/recognition/awards"
            className={({ isActive }) => isActive ? "active" : ""}
            onClick={close}>
            <HugeiconsIcon icon={Medal01Icon} size={18} color="currentColor" strokeWidth={1.8} />
            Awards Hub
          </NavLink>

          <NavLink to="/hr/dashboard/recognition/impact-bonus"
            className={({ isActive }) => isActive ? "active" : ""}
            onClick={close}>
            <HugeiconsIcon icon={Medal01Icon} size={18} color="currentColor" strokeWidth={1.8} />
            Impact Bonus
          </NavLink>

          <NavLink to="/hr/dashboard/recognition/engagement-calendar"
            className={({ isActive }) => isActive ? "active" : ""}
            onClick={close}>
            <HugeiconsIcon icon={CalendarCheckIn01Icon} size={18} color="currentColor" strokeWidth={1.8} />
            Engagement Calendar
          </NavLink>

          {/* ══════════════════════════════
              GRADING
          ══════════════════════════════ */}
          <div className="hr-section">Grading</div>

          <NavLink to="/hr/dashboard/grading/grade-master"
            className={({ isActive }) => isActive ? "active hr-sub-item" : "hr-sub-item"}
            onClick={close}>
            <HugeiconsIcon icon={Medal01Icon} size={16} color="currentColor" strokeWidth={1.8} />
            Grade Master
            <span className="hr-flow-label">1</span>
          </NavLink>

          <NavLink to="/hr/dashboard/grading/assign-grade"
            className={({ isActive }) => isActive ? "active hr-sub-item" : "hr-sub-item"}
            onClick={close}>
            <HugeiconsIcon icon={UserMultiple02Icon} size={16} color="currentColor" strokeWidth={1.8} />
            Assign Grade
            <span className="hr-flow-label">2</span>
          </NavLink>

          <NavLink to="/hr/dashboard/grading/grade-reports"
            className={({ isActive }) => isActive ? "active hr-sub-item" : "hr-sub-item"}
            onClick={close}>
            <HugeiconsIcon icon={ChartAverageIcon} size={16} color="currentColor" strokeWidth={1.8} />
            Grade Reports
            <span className="hr-flow-label">3</span>
          </NavLink>

          {/* ══════════════════════════════
              360° FEEDBACK
          ══════════════════════════════ */}
          <div className="hr-section">360° Feedback</div>

          <NavLink to="/hr/dashboard/feedback/setup"
            className={({ isActive }) => isActive ? "active hr-sub-item" : "hr-sub-item"}
            onClick={close}>
            <HugeiconsIcon icon={Setting07Icon} size={16} color="currentColor" strokeWidth={1.8} />
            Cycle Setup
            <span className="hr-flow-label">1</span>
          </NavLink>

          <NavLink to="/hr/dashboard/feedback/nominations"
            className={({ isActive }) => isActive ? "active hr-sub-item" : "hr-sub-item"}
            onClick={close}>
            <HugeiconsIcon icon={UserMultiple02Icon} size={16} color="currentColor" strokeWidth={1.8} />
            Nominations
            <span className="hr-flow-label">2</span>
          </NavLink>

          <NavLink to="/hr/dashboard/feedback/manager-feedback"
            className={({ isActive }) => isActive ? "active hr-sub-item" : "hr-sub-item"}
            onClick={close}>
            <HugeiconsIcon icon={StarIcon} size={16} color="currentColor" strokeWidth={1.8} />
            HR Feedback
            <span className="hr-flow-label">3</span>
          </NavLink>

          <NavLink to="/hr/dashboard/feedback/submissions"
            className={({ isActive }) => isActive ? "active hr-sub-item" : "hr-sub-item"}
            onClick={close}>
            <HugeiconsIcon icon={TaskDone01Icon} size={16} color="currentColor" strokeWidth={1.8} />
            Submissions
            <span className="hr-flow-label">4</span>
          </NavLink>

          <NavLink to="/hr/dashboard/feedback/reports"
            className={({ isActive }) => isActive ? "active hr-sub-item" : "hr-sub-item"}
            onClick={close}>
            <HugeiconsIcon icon={ChartAverageIcon} size={16} color="currentColor" strokeWidth={1.8} />
            Feedback Reports
            <span className="hr-flow-label">5</span>
          </NavLink>


          <div className="hr-section">Training</div>

          <NavLink to="/hr/dashboard/training"
            className={({ isActive }) => isActive ? "active" : ""}
            onClick={close}>

            <HugeiconsIcon icon={Target01Icon} size={18} color="currentColor" strokeWidth={1.8} />

            Training Roadmap
          </NavLink>


          {/* ══════════════════════════════
    INCENTIVE
══════════════════════════════ */}
          <div className="hr-section">Incentive</div>

          <NavLink to="/hr/dashboard/incentives/plans"
            className={({ isActive }) => isActive ? "active hr-sub-item" : "hr-sub-item"}
            onClick={close}>
            <HugeiconsIcon icon={ChartAverageIcon} size={16} color="currentColor" strokeWidth={1.8} />
            Incentive Plans
            <span className="hr-flow-label">1</span>
          </NavLink>

          <NavLink to="/hr/dashboard/incentives/assign"
            className={({ isActive }) => isActive ? "active hr-sub-item" : "hr-sub-item"}
            onClick={close}>
            <HugeiconsIcon icon={UserMultiple02Icon} size={16} color="currentColor" strokeWidth={1.8} />
            Assign Plans
            <span className="hr-flow-label">2</span>
          </NavLink>

          <NavLink to="/hr/dashboard/incentives/results"
            className={({ isActive }) => isActive ? "active hr-sub-item" : "hr-sub-item"}
            onClick={close}>
            <HugeiconsIcon icon={Medal01Icon} size={16} color="currentColor" strokeWidth={1.8} />
            Results & Payout
            <span className="hr-flow-label">3</span>
          </NavLink>

          {/* ══════════════════════════════
                      MASTERS
            ══════════════════════════════ */}
          <div className="hr-section">Masters</div>

          <NavLink to="/hr/dashboard/masters/departments"
            className={({ isActive }) => isActive ? "active" : ""}
            onClick={close}>
            <HugeiconsIcon icon={Building04Icon} size={18} color="currentColor" strokeWidth={1.8} />
            Departments
          </NavLink>


          {/* ══════════════════════════════
              POLICIES  ← ADD THIS SECTION
             ══════════════════════════════ */}
          <div className="hr-section">Policies</div>

          <NavLink to="/hr/dashboard/policies"
            className={({ isActive }) => isActive ? "active" : ""}
            onClick={close}>
            <HugeiconsIcon icon={TaskDone01Icon} size={18} color="currentColor" strokeWidth={1.8} />
            Policy Management
          </NavLink>

          {/* ══════════════════════════════
                      WELLNESS
            ══════════════════════════════ */}
          <div className="hr-section">Wellness</div>

          <NavLink to="/hr/dashboard/wellness"
            className={({ isActive }) => isActive ? "active" : ""}
            onClick={close}>
            <HugeiconsIcon icon={CalendarCheckIn01Icon} size={18} color="currentColor" strokeWidth={1.8} />
            Wellness Dashboard
          </NavLink>


          {/* ══════════════════════════════
                        CLUBS
              ══════════════════════════════ */}
          <div className="hr-section">Clubs</div>

          <NavLink to="/hr/dashboard/clubs"
            className={({ isActive }) => isActive ? "active" : ""}
            onClick={close}>
            <HugeiconsIcon icon={Building04Icon} size={18} color="currentColor" strokeWidth={1.8} />
            Corporate Clubs
          </NavLink>

          {/* ══════════════════════════════
    RETENTION (HR ONLY)
══════════════════════════════ */}
          <div className="hr-section">Retention</div>

          <NavLink to="/hr/dashboard/retention-plan"
            className={({ isActive }) => isActive ? "active" : ""}
            onClick={close}>
            <HugeiconsIcon icon={StarIcon} size={18} />
            Retention Plan
          </NavLink>


          <NavLink to="/hr/dashboard/leadership-track"
            className={({ isActive }) => isActive ? "active" : ""}
            onClick={close}>
            <HugeiconsIcon icon={Target01Icon} size={18} color="currentColor" strokeWidth={1.8} />
            Leadership Track
          </NavLink>

          <NavLink to="/hr/dashboard/alumni-network"
            className={({ isActive }) => isActive ? "active" : ""}
            onClick={close}>

            <HugeiconsIcon icon={Building04Icon} size={18} color="currentColor" strokeWidth={1.8} />

            Alumni Network
          </NavLink>

          {/* ══════════════════════════════
              SETTINGS & NOTIFICATIONS
          ══════════════════════════════ */}
          <div className="hr-section">Settings</div>

          <NavLink to="/hr/dashboard/settings"
            className={({ isActive }) => isActive ? "active" : ""}
            onClick={close}>
            <HugeiconsIcon icon={Settings01Icon} size={18} color="currentColor" strokeWidth={1.8} />
            Settings
          </NavLink>

          <NavLink to="/hr/dashboard/notifications"
            className={({ isActive }) => isActive ? "active" : ""}
            onClick={close}>
            <HugeiconsIcon icon={Notification01Icon} size={18} color="currentColor" strokeWidth={1.8} />
            Notifications
            {unreadCount > 0 && (
              <span className="hr-notif-badge">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </NavLink>

        </nav>

        {/* Logout */}
        <div className="hr-logout-wrap">
          <button className="hr-logout-btn" onClick={logout}>
            <HugeiconsIcon icon={Logout01Icon} size={20} color="currentColor" strokeWidth={1.8} />
            Logout
          </button>
        </div>

      </div>

      {/* Desktop spacer */}
      <div className="d-none d-md-block" style={{ marginLeft: "260px" }} />
    </>
  );
}