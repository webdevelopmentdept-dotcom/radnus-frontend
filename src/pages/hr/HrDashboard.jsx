import { Outlet, useNavigate } from "react-router-dom";
import HrSidebar from "./HrSidebar";
import { useEffect, useState } from "react";
import axios from "axios";

export default function HrDashboard() {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const API_BASE = import.meta.env.VITE_API_BASE_URL;

  const [pendingCount, setPendingCount] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  const hrRole = localStorage.getItem("hrRole") || "hr";
  const isEmployee = hrRole === "employee";

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
        .pr-opp-card {
          position: fixed;
          top: 16px;
          right: 20px;
          z-index: 1500;
          background: #fff;
          border-radius: 14px;
          box-shadow: 0 8px 30px rgba(0,0,0,0.12);
          padding: 12px 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          max-width: 340px;
        }
        .pr-opp-icon {
          width: 36px; height: 36px;
          border-radius: 10px;
          background: #fef3c7;
          display: flex; align-items: center; justify-content: center;
          font-size: 16px;
          flex-shrink: 0;
        }
        .pr-opp-label {
          font-size: 10px; font-weight: 800; color: #d97706;
          text-transform: uppercase; letter-spacing: 0.5px;
        }
        .pr-opp-title {
          font-size: 13.5px; font-weight: 700; color: #1a1a2e;
          margin: 1px 0 0;
        }
        .pr-opp-sub {
          font-size: 11.5px; color: #6b7280;
          margin: 1px 0 0;
        }
        .pr-opp-actions {
          display: flex; flex-direction: column; gap: 6px;
          flex-shrink: 0;
        }
        .pr-opp-btn-view {
          background: #d97706; color: #fff;
          border: none; border-radius: 8px;
          padding: 6px 14px; font-size: 12px; font-weight: 700;
          cursor: pointer; white-space: nowrap;
        }
        .pr-opp-btn-cancel {
          background: transparent; color: #6b7280;
          border: 1px solid #e5e7eb; border-radius: 8px;
          padding: 5px 14px; font-size: 11.5px; font-weight: 600;
          cursor: pointer; white-space: nowrap;
        }

        @media (max-width: 768px) {
          .pr-opp-card {
            left: 12px; right: 12px; top: 12px;
            max-width: none;
          }
        }
      `}</style>

      {/* Sidebar */}
      <HrSidebar />

      {/* Pending Review Summary Card */}
      {!isEmployee && !dismissed && pendingCount > 0 && (
        <div className="pr-opp-card">
          <div className="pr-opp-icon">⏳</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="pr-opp-label">Pending Review</div>
            <div className="pr-opp-title">
              Review pending on {pendingCount} employee{pendingCount > 1 ? "s" : ""}
            </div>
            <div className="pr-opp-sub">Self assessments awaiting your approval</div>
          </div>
          <div className="pr-opp-actions">
            <button className="pr-opp-btn-view" onClick={goToReviews}>View</button>
            <button className="pr-opp-btn-cancel" onClick={() => setDismissed(true)}>Cancel</button>
          </div>
        </div>
      )}

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