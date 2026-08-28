import { NavLink, useNavigate, useLocation } from "react-router-dom";
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
  ChartUpIcon,
  Certificate01Icon,
  Award01Icon,
  CircleArrowReload01Icon,
  MessageMultiple01Icon,
  SchoolIcon,
  WellnessIcon,
  MoneyBag01Icon,
  OfficeIcon,
} from "@hugeicons/core-free-icons";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

// ══════════════════════════════════════════════════════
// MENU CONFIG — data-driven, generated from the original
// flat menu (every `to`, icon, label, badge preserved 1:1)
// ══════════════════════════════════════════════════════
const EMPLOYEE_MENU = [
  {
    type: "group",
    key: "Attendance-Leave",
    title: "Attendance & Leave",
    icon: CalendarCheckIn01Icon,
    items: [
      { to: "/hr/dashboard/attendance/monthly", end: false, icon: CalendarCheckIn01Icon, size: 20, label: "Attendance", flow: null, notif: false },
    ],
  },
  {
    type: "group",
    key: "Performance-KPI",
    title: "KPI Management",
    icon: StarIcon,
    items: [
      { to: "/hr/dashboard/performance/reviews", end: false, icon: StarIcon, size: 18, label: "Reviews ✅", flow: null, notif: false },
      { to: "/hr/dashboard/performance/reports", end: false, icon: ChartAverageIcon, size: 18, label: "Performance Reports ✅", flow: null, notif: false },
      { to: "/hr/dashboard/performance/department-scoreboard", end: false, icon: ChartAverageIcon, size: 18, label: "Department Scoreboard", flow: null, notif: false },
    ],
  },
];

const HR_MENU = [
  {
    type: "link",
    to: "/hr/dashboard", end: true,
    icon: Home01Icon, size: 20,
    label: "Dashboard", notif: false,
  },
  {
    type: "group",
    key: "Recruitment",
    title: "Recruitment",
    icon: MailSend01Icon,
    items: [
      { to: "/hr/dashboard/applicants", end: false, icon: MailSend01Icon, size: 20, label: "Applicants ✅", flow: null, notif: false },
      { to: "/hr/dashboard/job-postings", end: false, icon: TaskDone01Icon, size: 20, label: "Job Postings ✅", flow: null, notif: false },
    ],
  },
  {
    type: "group",
    key: "Employees",
    title: "Employees",
    icon: UserMultiple02Icon,
    items: [
      { to: "/hr/dashboard/employees", end: false, icon: UserMultiple02Icon, size: 20, label: "All Employees ✅", flow: null, notif: false },
      { to: "/hr/dashboard/hr-pending", end: false, icon: Clock01Icon, size: 20, label: "Pending Approvals ✅", flow: null, notif: false },
      { to: "/hr/dashboard/hr-approved", end: false, icon: CheckmarkCircle01Icon, size: 20, label: "Approved ✅", flow: null, notif: false },
      { to: "/hr/dashboard/hr-reject", end: false, icon: CancelCircleIcon, size: 20, label: "Rejected ✅", flow: null, notif: false },
      { to: "/hr/dashboard/active-employees", end: false, icon: BarChartIcon, size: 20, label: "Activated Employees ✅", flow: null, notif: false },
    ],
  },
  {
    type: "group",
    key: "Attendance-Leave",
    title: "Attendance & Leave",
    icon: CalendarCheckIn01Icon,
    items: [
      { to: "/hr/dashboard/attendance/monthly", end: false, icon: CalendarCheckIn01Icon, size: 20, label: "Attendance", flow: null, notif: false },
      { to: "/hr/dashboard/leave/requests", end: false, icon: Clock01Icon, size: 20, label: "Leave Requests", flow: null, notif: false },
      { to: "/hr/dashboard/essl-manager", end: false, icon: Notification01Icon, size: 20, label: "eSSL Manager", flow: null, notif: false },
    ],
  },
  {
    type: "group",
    key: "Payroll",
    title: "Payroll",
    icon: BarChartIcon,
    items: [
      { to: "/hr/dashboard/payroll", end: false, icon: BarChartIcon, size: 20, label: "Payroll", flow: null, notif: false },
      { to: "/hr/dashboard/payroll/advances", end: false, icon: MailSend01Icon, size: 20, label: "Advance Requests", flow: null, notif: false },
    ],
  },
  {
    type: "group",
    key: "Performance-KPI",
    title: "KPI Management",
    icon: Target01Icon,
    items: [
      { to: "/hr/dashboard/performance/kpi-templates", end: false, icon: Target01Icon, size: 18, label: "KPI Templates ✅", flow: "1", notif: false },
      { to: "/hr/dashboard/performance/assign-kpi", end: false, icon: Task01Icon, size: 18, label: "Assign KPIs ✅", flow: "2", notif: false },
      { to: "/hr/dashboard/performance/reviews", end: false, icon: StarIcon, size: 18, label: "Reviews ✅", flow: "3", notif: false },
      { to: "/hr/dashboard/performance/reports", end: false, icon: ChartAverageIcon, size: 18, label: "Performance Reports ✅", flow: "4", notif: false },
    ],
  },
  {
    type: "group",
    key: "Performance-OKR",
    title: "OKR Management",
    icon: CircleArrowReload01Icon,
    items: [
      { to: "/hr/dashboard/performance/okr-setup", end: false, icon: Setting07Icon, size: 18, label: "OKR Setup ✅", flow: "1", notif: false },
      { to: "/hr/dashboard/performance/okr-dashboard", end: false, icon: Target01Icon, size: 18, label: "OKR Dashboard ✅", flow: "2", notif: false },
    ],
  },
  {
    type: "group",
    key: "Performance-Others",
    title: "Performance — Others",
    icon: ChartUpIcon,
    items: [
      { to: "/hr/dashboard/performance/department-scoreboard", end: false, icon: ChartAverageIcon, size: 20, label: "Department Scoreboard", flow: null, notif: false },
      { to: "/hr/dashboard/performance/variable-pay", end: false, icon: ChartAverageIcon, size: 20, label: "Variable Pay", flow: null, notif: false },
    ],
  },
  {
    type: "group",
    key: "Appraisal",
    title: "Appraisal",
    icon: Certificate01Icon,
    items: [
      { to: "/hr/dashboard/appraisal", end: false, icon: ChartAverageIcon, size: 20, label: "Appraisal Hub", flow: null, notif: false },
      { to: "/hr/dashboard/performance/esop", end: false, icon: BarChartIcon, size: 20, label: "ESOP", flow: null, notif: false },
    ],
  },
  {
    type: "group",
    key: "Recognition",
    title: "Recognition",
    icon: Award01Icon,
    items: [
      { to: "/hr/dashboard/recognition/awards", end: false, icon: Medal01Icon, size: 20, label: "Awards Hub", flow: null, notif: false },
      { to: "/hr/dashboard/recognition/impact-bonus", end: false, icon: Medal01Icon, size: 20, label: "Impact Bonus", flow: null, notif: false },
      { to: "/hr/dashboard/recognition/engagement-calendar", end: false, icon: CalendarCheckIn01Icon, size: 20, label: "Engagement Calendar", flow: null, notif: false },
    ],
  },
  {
    type: "group",
    key: "Grading",
    title: "Grading",
    icon: Medal01Icon,
    items: [
      { to: "/hr/dashboard/grading/grade-master", end: false, icon: Medal01Icon, size: 18, label: "Grade Master ✅", flow: "1", notif: false },
      { to: "/hr/dashboard/grading/dept-salary", end: false, icon: BarChartIcon, size: 18, label: "Dept Salary Bands ✅", flow: "2", notif: false },
      { to: "/hr/dashboard/grading/assign-grade", end: false, icon: UserMultiple02Icon, size: 18, label: "Assign Grade ✅", flow: "2", notif: false },
      { to: "/hr/dashboard/grading/grade-reports", end: false, icon: ChartAverageIcon, size: 18, label: "Grade Reports ✅", flow: "3", notif: false },
    ],
  },
  {
    type: "group",
    key: "360-Feedback",
    title: "360° Feedback",
    icon: MessageMultiple01Icon,
    items: [
      { to: "/hr/dashboard/feedback/setup", end: false, icon: Setting07Icon, size: 18, label: "Cycle Setup", flow: "1", notif: false },
      { to: "/hr/dashboard/feedback/nominations", end: false, icon: UserMultiple02Icon, size: 18, label: "Nominations", flow: "2", notif: false },
      { to: "/hr/dashboard/feedback/manager-feedback", end: false, icon: StarIcon, size: 18, label: "HR Feedback", flow: "3", notif: false },
      { to: "/hr/dashboard/feedback/submissions", end: false, icon: TaskDone01Icon, size: 18, label: "Submissions", flow: "4", notif: false },
      { to: "/hr/dashboard/feedback/reports", end: false, icon: ChartAverageIcon, size: 18, label: "Feedback Reports", flow: "5", notif: false },
      { to: "/hr/dashboard/feedback", end: false, icon: Task01Icon, size: 20, label: "Employee Feedback", flow: null, notif: false },
    ],
  },
  {
    type: "group",
    key: "Training",
    title: "Training",
    icon: SchoolIcon,
    items: [
      { to: "/hr/dashboard/training", end: false, icon: Target01Icon, size: 20, label: "Training Roadmap", flow: null, notif: false },
    ],
  },
  {
    type: "group",
    key: "Incentive",
    title: "Incentive",
    icon: MoneyBag01Icon,
    items: [
      { to: "/hr/dashboard/incentives/plans", end: false, icon: ChartAverageIcon, size: 18, label: "Incentive Plans", flow: "1", notif: false },
      { to: "/hr/dashboard/incentives/assign", end: false, icon: UserMultiple02Icon, size: 18, label: "Assign Plans", flow: "2", notif: false },
      { to: "/hr/dashboard/incentives/results", end: false, icon: Medal01Icon, size: 18, label: "Results & Payout", flow: "3", notif: false },
    ],
  },
  {
    type: "group",
    key: "Masters",
    title: "Masters",
    icon: Building04Icon,
    items: [
      { to: "/hr/dashboard/masters/departments", end: false, icon: Building04Icon, size: 20, label: "Departments ✅", flow: null, notif: false },
      { to: "/hr/dashboard/masters/sop", end: false, icon: TaskDone01Icon, size: 20, label: "SOP Management ✅", flow: null, notif: false },
      { to: "/hr/dashboard/masters/products", end: false, icon: TaskDone01Icon, size: 20, label: "Product Knowledge Portal", flow: null, notif: false },
    ],
  },
  {
    type: "group",
    key: "Policies",
    title: "Policies",
    icon: TaskDone01Icon,
    items: [
      { to: "/hr/dashboard/policies", end: false, icon: TaskDone01Icon, size: 20, label: "Policy Management ✅", flow: null, notif: false },
      { to: "/hr/dashboard/policies/quiz", end: false, icon: TaskDone01Icon, size: 18, label: "Quiz Management ✅", flow: "2", notif: false },
    ],
  },
  {
    type: "group",
    key: "Announcements",
    title: "Announcements",
    icon: Notification01Icon,
    items: [
      { to: "/hr/dashboard/announcements", end: false, icon: Notification01Icon, size: 20, label: "Announcements", flow: null, notif: false },
    ],
  },
  {
    type: "group",
    key: "Wellness",
    title: "Wellness",
    icon: WellnessIcon,
    items: [
      { to: "/hr/dashboard/wellness", end: false, icon: CalendarCheckIn01Icon, size: 20, label: "Wellness Dashboard", flow: null, notif: false },
    ],
  },
  {
    type: "group",
    key: "Clubs",
    title: "Clubs",
    icon: OfficeIcon,
    items: [
      { to: "/hr/dashboard/clubs", end: false, icon: Building04Icon, size: 20, label: "Corporate Clubs", flow: null, notif: false },
    ],
  },
  {
    type: "group",
    key: "Retention",
    title: "Retention",
    icon: StarIcon,
    items: [
      { to: "/hr/dashboard/retention-plan", end: false, icon: StarIcon, size: 20, label: "Retention Plan", flow: null, notif: false },
      { to: "/hr/dashboard/leadership-track", end: false, icon: Target01Icon, size: 20, label: "Leadership Track", flow: null, notif: false },
      { to: "/hr/dashboard/alumni-network", end: false, icon: Building04Icon, size: 20, label: "Alumni Network", flow: null, notif: false },
    ],
  },
  {
    type: "group",
    key: "IT-Support",
    title: "IT Support",
    icon: Task01Icon,
    items: [
      { to: "/hr/dashboard/tickets", end: false, icon: Task01Icon, size: 20, label: "Ticket Management", flow: null, notif: false },
    ],
  },
  {
    type: "group",
    key: "Settings",
    title: "Settings",
    icon: Settings01Icon,
    items: [
      { to: "/hr/dashboard/settings", end: false, icon: Settings01Icon, size: 20, label: "Settings", flow: null, notif: false },
      { to: "/hr/dashboard/notifications", end: false, icon: Notification01Icon, size: 20, label: "Notifications", flow: null, notif: true },
    ],
  },
];

// Small inline chevron (no extra icon-package dependency)
const Chevron = ({ open }) => (
  <svg
    width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
    style={{
      marginLeft: "auto",
      flexShrink: 0,
      transition: "transform 0.2s ease",
      transform: open ? "rotate(180deg)" : "rotate(0deg)",
    }}
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

export default function HrSidebar({ onHoverChange } = {}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [show, setShow] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hover, setHover] = useState(false); // desktop hover-to-expand
  const [openGroup, setOpenGroup] = useState(null); // accordion — only ONE group open at a time
  const [activeGroup, setActiveGroup] = useState(null);

  const setHoverState = (val) => {
    setHover(val);
    if (onHoverChange) onHoverChange(val); // let the parent layout mirror this for content margin
  };

  // Role check
  const hrRole = localStorage.getItem("hrRole") || "hr";
  const isEmployee = hrRole === "employee";
  const MENU = isEmployee ? EMPLOYEE_MENU : HR_MENU;

useEffect(() => {
  const match = MENU.find(
    (g) => g.type === "group" && g.items.some((it) => location.pathname.startsWith(it.to))
  );
  if (match) {
    setOpenGroup(match.key);
    setActiveGroup(match.key);
  } else {
    setActiveGroup(null);
  }
}, [location.pathname, isEmployee]);

  const toggleGroup = (key) => {
    setOpenGroup((prev) => (prev === key ? null : key)); // accordion: opening one closes the rest
  };

  useEffect(() => {
    if (isEmployee) return;
    const fetchUnread = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) return;
        const payload = JSON.parse(atob(token.split(".")[1]));
        const hrId = payload?.id;
        if (!hrId) return;
        const res = await axios.get(
          `${API_BASE}/api/notifications/hr/${hrId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
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
          overflow-x: hidden;
          z-index: 1000;
          display: flex;
          flex-direction: column;
          transition: transform 0.28s ease, width 0.25s ease;
        }

        @media (min-width: 768px) {
          .hr-sidebar { transform: translateX(0) !important; display: flex !important; }
          .hr-menu-btn { display: none !important; }
          .hr-overlay  { display: none !important; }

          /* Icon-only by default, expands on hover */
          .hr-sidebar { width: 72px; }
          .hr-sidebar.expanded { width: 260px; }
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
          gap: 10px;
          padding: 18px 14px 16px;
          border-bottom: 1px solid rgba(255,255,255,0.08);
          white-space: nowrap;
          overflow: hidden;
        }
        .hr-brand-icon { font-size: 20px; flex-shrink: 0; width: 24px; text-align: center; }
        .hr-brand-title {
          font-size: 17px; font-weight: 800;
          color: #fff; letter-spacing: 0.3px;
        }
        .hr-close-btn {
          background: none; border: none;
          color: rgba(255,255,255,0.6);
          cursor: pointer; padding: 4px; display: none;
          margin-left: auto;
        }
        @media (max-width: 767px) {
          .hr-close-btn { display: flex; }
        }

        .hr-nav { padding: 8px 10px; flex: 1; }

        .hr-nav a, .hr-accordion-header {
          display: flex; align-items: center; gap: 12px;
          padding: 10px 14px; border-radius: 12px;
          margin-bottom: 6px; text-decoration: none;
          color: #d1d5db; font-size: 13.5px; font-weight: 500;
          transition: background 0.2s, color 0.2s, box-shadow 0.2s;
          white-space: nowrap;
          overflow: hidden;
          position: relative;
          width: 100%;
          background: none; border: none; cursor: pointer;
          font-family: inherit; text-align: left;
        }
        .hr-nav a:hover, .hr-accordion-header:hover {
          background: rgba(255,255,255,0.07);
          color: #fff; text-decoration: none;
        }
        .hr-nav a.active {
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          color: #fff; font-weight: 600;
          box-shadow: 0 4px 12px rgba(29,78,216,0.35);
        }
        .hr-nav a svg, .hr-accordion-header svg { flex-shrink: 0; }

        /* ── Accordion group ── */
        .hr-accordion-header.active-group {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  color: #fff;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(29,78,216,0.35);
}  

        .hr-accordion-content {
          display: grid;
          grid-template-rows: 0fr;
          transition: grid-template-rows 0.25s ease;
        }
        .hr-accordion-content.open {
          grid-template-rows: 1fr;
        }
        .hr-accordion-inner { overflow: hidden; }

        .hr-sub-item {
          display: flex; align-items: center; gap: 12px;
          padding: 9px 14px 9px 32px !important;
          font-size: 13px !important;
          color: #9ca3af !important;
          margin-bottom: 4px;
        }
        .hr-sub-item:hover { color: #fff !important; }
        .hr-sub-item.active {
          background: linear-gradient(135deg, #3b82f6, #1d4ed8) !important;
          color: #fff !important;
          box-shadow: 0 4px 12px rgba(29,78,216,0.35);
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
          padding: 12px 10px 20px;
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
          white-space: nowrap;
          overflow: hidden;
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

        /* ── Collapsed (icon-only) desktop state ──
           Text is fully hidden (not clipped) so nothing shows half-cut. */
        @media (min-width: 768px) {
          .hr-sidebar:not(.expanded) .hr-label,
          .hr-sidebar:not(.expanded) .hr-flow-label,
          .hr-sidebar:not(.expanded) .hr-notif-badge,
          .hr-sidebar:not(.expanded) .hr-brand-title,
          .hr-sidebar:not(.expanded) .hr-logout-btn span,
          .hr-sidebar:not(.expanded) .hr-chevron {
            display: none;
          }
          .hr-sidebar:not(.expanded) .hr-nav a,
          .hr-sidebar:not(.expanded) .hr-accordion-header,
          .hr-sidebar:not(.expanded) .hr-logout-btn {
            justify-content: center;
            padding: 10px 8px;
            gap: 0;
          }
          .hr-sidebar:not(.expanded) .hr-brand {
            justify-content: center;
            padding-left: 0;
            padding-right: 0;
          }
          .hr-sidebar:not(.expanded) .hr-sub-item {
            padding-left: 0 !important;
          }
          /* Collapsed: force every accordion shut — only top icons show */
          .hr-sidebar:not(.expanded) .hr-accordion-content {
            grid-template-rows: 0fr !important;
          }
        }
      `}</style>

      {/* Mobile hamburger */}
      <button className="hr-menu-btn" onClick={() => setShow(true)}>
        <HugeiconsIcon icon={Menu01Icon} size={22} color="#fff" strokeWidth={2} />
      </button>

      {/* Overlay */}
      <div className={`hr-overlay ${show ? "open" : ""}`} onClick={close} />

      {/* Sidebar */}
      <div
        className={`hr-sidebar ${show ? "open" : ""} ${hover ? "expanded" : ""}`}
        onMouseEnter={() => setHoverState(true)}
        onMouseLeave={() => setHoverState(false)}
      >

        {/* Brand */}
        <div className="hr-brand">
          <span className="hr-brand-icon">{isEmployee ? "\ud83d\udc64" : "\ud83c\udfe2"}</span>
          <span className="hr-brand-title hr-label">
            {isEmployee ? "Employee Panel" : "HR Panel"}
          </span>
          <button className="hr-close-btn" onClick={close}>
            <HugeiconsIcon icon={Cancel01Icon} size={20} color="rgba(255,255,255,0.6)" strokeWidth={2} />
          </button>
        </div>

        <nav className="hr-nav">
          {MENU.map((entry) => {
            if (entry.type === "link") {
              return (
                <NavLink
                  key={entry.to}
                  to={entry.to}
                  end={entry.end}
                  className={({ isActive }) => (isActive ? "active" : "")}
                  onClick={close}
                >
                  <HugeiconsIcon icon={entry.icon} size={entry.size} color="currentColor" strokeWidth={1.8} />
                  <span className="hr-label">{entry.label}</span>
                  {entry.notif && unreadCount > 0 && (
                    <span className="hr-notif-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>
                  )}
                </NavLink>
              );
            }

            // Accordion group
            const isOpen = openGroup === entry.key;
const isActiveGroup = activeGroup === entry.key;
return (
  <div key={entry.key} className="hr-accordion">
    <button
      type="button"
      className={`hr-accordion-header ${isOpen ? "open" : ""} ${isActiveGroup ? "active-group" : ""}`}
      onClick={() => toggleGroup(entry.key)}
      onMouseEnter={() => setOpenGroup(entry.key)}
    >
                  <HugeiconsIcon icon={entry.icon} size={21} color="currentColor" strokeWidth={1.8} />
                  <span className="hr-label">{entry.title}</span>
                  <span className="hr-chevron">
                    <Chevron open={isOpen} />
                  </span>
                </button>

                <div className={`hr-accordion-content ${isOpen ? "open" : ""}`}>
                  <div className="hr-accordion-inner">
                    {entry.items.map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.end}
                        className={({ isActive }) => (isActive ? "active hr-sub-item" : "hr-sub-item")}
                        onClick={close}
                      >
                        <HugeiconsIcon icon={item.icon} size={item.size} color="currentColor" strokeWidth={1.8} />
                        <span className="hr-label">{item.label}</span>
                        {item.flow && <span className="hr-flow-label">{item.flow}</span>}
                        {item.notif && unreadCount > 0 && (
                          <span className="hr-notif-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>
                        )}
                      </NavLink>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="hr-logout-wrap">
          <button className="hr-logout-btn" onClick={logout}>
            <HugeiconsIcon icon={Logout01Icon} size={20} color="currentColor" strokeWidth={1.8} />
            <span>Logout</span>
          </button>
        </div>

      </div>
    </>
  );
}