import { useState, useEffect } from "react";
import EmployeeLayout from "./EmployeeLayout";
import {
  LifeBuoy, ExternalLink, Package, Laptop2, KeyRound, WifiOff,
  HelpCircle, ArrowUpRight, Clock, CheckCircle2, AlertCircle,
} from "lucide-react";

// 🔧 Replace with your real ticketing portal link (or set VITE_TICKET_PORTAL_URL)
const TICKET_PORTAL_URL =
  import.meta.env.VITE_TICKET_PORTAL_URL || "https://support.yourcompany.com/tickets/new";

// Base URL of your backend API (same one used across the rest of the app)
const API_BASE = import.meta.env.VITE_API_BASE_URL;

// Only SYSTEM / TECHNICAL issue categories — this page is not for HR,
// payroll, or facilities queries.
const CATEGORIES = [
  { id: "new-equipment", label: "New Equipment Request", icon: Package, color: "#3d5af1" },
  { id: "hardware-software", label: "Hardware / Software Issue", icon: Laptop2, color: "#dc2626" },
  { id: "password-reset", label: "Password Reset", icon: KeyRound, color: "#d97706" },
  { id: "connectivity", label: "Connectivity", icon: WifiOff, color: "#7c3aed" },
  { id: "other", label: "Other System Issue", icon: HelpCircle, color: "#6b7280" },
];

// Status pills — mapped to the actual statuses used by the ticket backend
// (open, in-progress, resolved, closed)
const STATUS_CFG = {
  open:          { label: "Open",        color: "#d97706", bg: "#fffbeb", icon: Clock },
  "in-progress": { label: "In Progress", color: "#3d5af1", bg: "#eef1fd", icon: AlertCircle },
  resolved:      { label: "Resolved",    color: "#16a34a", bg: "#f0fdf4", icon: CheckCircle2 },
  closed:        { label: "Closed",      color: "#6b7280", bg: "#f3f4f6", icon: CheckCircle2 },
};

export default function RaiseTicket() {
  const [selectedCategory, setSelectedCategory] = useState(null);

  // ── Real tickets state (fetched from backend) ──────────────────────────
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTickets = async () => {
      const token =
        localStorage.getItem("employeeToken") ||
        sessionStorage.getItem("employeeToken");

      if (!token) {
        setError("You're not logged in — please log in again.");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/api/employee/tickets`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          throw new Error(`Request failed with status ${res.status}`);
        }

        const data = await res.json();
        setTickets(Array.isArray(data) ? data : []);
        setError("");
      } catch (err) {
        console.error("Failed to load tickets:", err);
        setError("Couldn't load your tickets right now.");
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, []);

  const openTicketPortal = (category) => {
    const url = category
      ? `${TICKET_PORTAL_URL}${TICKET_PORTAL_URL.includes("?") ? "&" : "?"}category=${encodeURIComponent(category)}`
      : TICKET_PORTAL_URL;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <EmployeeLayout pageTitle="Raise Ticket">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap');
        .rt-wrap { font-family: 'Sora', sans-serif; padding: 22px 22px 40px; max-width: 900px; margin: 0 auto; }

        .rt-hero {
          background: linear-gradient(135deg, #3d5af1, #6366f1);
          border-radius: 20px;
          padding: 28px 26px;
          color: #fff;
          display: flex;
          align-items: center;
          gap: 18px;
          box-shadow: 0 14px 34px rgba(61,90,241,0.28);
          flex-wrap: wrap;
        }
        .rt-hero-icon {
          width: 54px; height: 54px; border-radius: 14px;
          background: rgba(255,255,255,0.16);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .rt-hero-text { flex: 1; min-width: 220px; }
        .rt-hero-title { font-size: 19px; font-weight: 700; margin-bottom: 4px; }
        .rt-hero-sub { font-size: 13px; opacity: 0.9; line-height: 1.5; }
        .rt-hero-cta {
          background: #fff; color: #3d5af1; border: none;
          padding: 11px 20px; border-radius: 12px;
          font-family: 'Sora', sans-serif; font-weight: 700; font-size: 13.5px;
          display: flex; align-items: center; gap: 8px; cursor: pointer;
          box-shadow: 0 6px 16px rgba(0,0,0,0.15);
          transition: transform 0.15s ease;
          white-space: nowrap;
        }
        .rt-hero-cta:hover { transform: translateY(-1px); }

        .rt-section-title {
          font-size: 13px; font-weight: 700; color: #1e293b;
          margin: 26px 2px 12px; letter-spacing: 0.2px;
        }

        .rt-cat-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 12px;
        }
        .rt-cat-card {
          background: #fff;
          border: 1.5px solid #eef0f6;
          border-radius: 14px;
          padding: 16px 14px;
          cursor: pointer;
          display: flex; flex-direction: column; gap: 10px;
          transition: border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease;
        }
        .rt-cat-card:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,0.06); }
        .rt-cat-card.active { border-color: #3d5af1; box-shadow: 0 8px 20px rgba(61,90,241,0.15); }
        .rt-cat-icon {
          width: 36px; height: 36px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
        }
        .rt-cat-label { font-size: 12.5px; font-weight: 600; color: #1e293b; }
        .rt-cat-arrow { display: flex; align-items: center; gap: 4px; font-size: 10.5px; color: #94a3b8; font-weight: 600; }

        .rt-note {
          margin-top: 16px;
          background: #eef1fd;
          border: 1px solid #dbe1fb;
          border-radius: 12px;
          padding: 12px 14px;
          font-size: 12px;
          color: #3d5af1;
          display: flex; align-items: center; gap: 8px;
        }

        .rt-list {
          background: #fff;
          border: 1.5px solid #eef0f6;
          border-radius: 14px;
          overflow: hidden;
        }
        .rt-row {
          display: flex; align-items: flex-start; gap: 14px;
          padding: 16px 18px;
          border-bottom: 1px solid #f4f5f9;
          transition: background 0.15s ease;
        }
        .rt-row:hover { background: #fafbfe; }
        .rt-row:last-child { border-bottom: none; }
        .rt-row-icon {
          width: 38px; height: 38px; border-radius: 11px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; margin-top: 1px;
        }
        .rt-row-main { flex: 1; min-width: 0; }
        .rt-row-top {
          display: flex; align-items: center; gap: 9px; flex-wrap: wrap;
        }
        .rt-row-subject { font-size: 13.5px; font-weight: 700; color: #1e293b; }
        .rt-row-ticketno {
          font-family: 'IBM Plex Mono', monospace; font-size: 10px; font-weight: 600;
          color: #94a3b8; background: #f4f5f9;
          padding: 2px 8px; border-radius: 6px; white-space: nowrap;
        }
        .rt-row-meta {
          font-size: 11.5px; color: #94a3b8; margin-top: 5px;
          display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
        }
        .rt-priority-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
        .rt-status-pill {
          display: flex; align-items: center; gap: 5px;
          font-size: 10.5px; font-weight: 700;
          padding: 6px 12px; border-radius: 20px;
          flex-shrink: 0; white-space: nowrap;
          margin-top: 1px;
        }

        .rt-empty {
          text-align: center; padding: 30px 16px; color: #94a3b8; font-size: 12.5px;
        }

        /* ═══════════════════════════════════════════
           MOBILE FIXES
        ═══════════════════════════════════════════ */
        @media (max-width: 640px) {
          .rt-wrap { padding: 14px 14px 32px; }

          .rt-hero {
            flex-direction: column;
            align-items: flex-start;
            padding: 20px 18px;
            gap: 12px;
            border-radius: 16px;
          }
          .rt-hero-icon { width: 44px; height: 44px; border-radius: 12px; }
          .rt-hero-text { min-width: 0; width: 100%; }
          .rt-hero-title { font-size: 16.5px; }
          .rt-hero-sub { font-size: 12.5px; }
          .rt-hero-cta {
            width: 100%;
            justify-content: center;
            padding: 12px 18px;
          }

          .rt-section-title { margin: 20px 2px 10px; font-size: 12px; }

          .rt-cat-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
          }
          .rt-cat-card { padding: 13px 12px; border-radius: 12px; }
          .rt-cat-icon { width: 32px; height: 32px; }
          .rt-cat-label { font-size: 12px; }
          .rt-cat-arrow { font-size: 10px; }

          .rt-note { font-size: 11.5px; padding: 11px 12px; }

          .rt-row {
            padding: 14px;
            gap: 10px;
          }
          .rt-row-icon { width: 34px; height: 34px; border-radius: 10px; }
          .rt-row-subject { font-size: 13px; }
          .rt-row-ticketno { font-size: 9.5px; }
          .rt-status-pill { padding: 5px 10px; font-size: 10px; }
        }

        @media (max-width: 380px) {
          .rt-cat-grid { grid-template-columns: 1fr 1fr; gap: 8px; }
          .rt-hero-title { font-size: 15.5px; }
        }
      `}</style>

      <div className="rt-wrap">
        {/* Hero */}
        <div className="rt-hero">
          <div className="rt-hero-icon"><LifeBuoy size={26} color="#fff" /></div>
          <div className="rt-hero-text">
            <div className="rt-hero-title">Facing a system issue? Raise a ticket.</div>
            <div className="rt-hero-sub">
              Need new equipment, facing a hardware/software issue, a password
reset, or a connectivity problem — pick a category below or go
straight to the support portal. It opens in a new tab and our
IT team will get back to you there.
            </div>
          </div>
          <button className="rt-hero-cta" onClick={() => openTicketPortal(selectedCategory)}>
            Raise a Ticket <ExternalLink size={15} />
          </button>
        </div>

        {/* Categories */}
        <div className="rt-section-title">What's it about?</div>
        <div className="rt-cat-grid">
          {CATEGORIES.map(({ id, label, icon: Icon, color }) => (
            <div
              key={id}
              className={`rt-cat-card ${selectedCategory === id ? "active" : ""}`}
              onClick={() => { setSelectedCategory(id); openTicketPortal(id); }}
            >
              <div className="rt-cat-icon" style={{ background: `${color}18` }}>
                <Icon size={18} color={color} />
              </div>
              <div className="rt-cat-label">{label}</div>
              <div className="rt-cat-arrow">Open portal <ArrowUpRight size={11} /></div>
            </div>
          ))}
        </div>

        <div className="rt-note">
          <ExternalLink size={14} />
          This takes you to our support ticketing portal in a new tab.
        </div>

        {/* Recent tickets — fetched live from /api/employee/tickets */}
        <div className="rt-section-title">My Recent Tickets</div>
        <div className="rt-list">
          {loading ? (
            <div className="rt-empty">Loading your tickets…</div>
          ) : error ? (
            <div className="rt-empty">{error}</div>
          ) : tickets.length === 0 ? (
            <div className="rt-empty">No system issues raised yet — click a category above to report one.</div>
          ) : (
            tickets.map((t) => {
              const cfg = STATUS_CFG[t.status] || STATUS_CFG.open;
              const StatusIcon = cfg.icon;
              const priorityColor =
                { low: "#16a34a", medium: "#d97706", high: "#dc2626", critical: "#b91c1c" }[t.priority] ||
                "#94a3b8";
              return (
                <div className="rt-row" key={t._id || t.id}>
                  <div className="rt-row-icon" style={{ background: cfg.bg }}>
                    <StatusIcon size={17} color={cfg.color} />
                  </div>
                  <div className="rt-row-main">
                    <div className="rt-row-top">
                      <span className="rt-row-subject">{t.subject}</span>
                      <span className="rt-row-ticketno">{t.ticket_no}</span>
                    </div>
                    <div className="rt-row-meta">
                      <span className="rt-priority-dot" style={{ background: priorityColor }} />
                      {t.priority
                        ? t.priority.charAt(0).toUpperCase() + t.priority.slice(1)
                        : "Normal"}{" "}
                      priority · {t.category}
                      {t.created_at ? ` · ${new Date(t.created_at).toLocaleDateString()}` : ""}
                    </div>
                  </div>
                  <div className="rt-status-pill" style={{ background: cfg.bg, color: cfg.color }}>
                    <StatusIcon size={11} /> {cfg.label}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </EmployeeLayout>
  );
}