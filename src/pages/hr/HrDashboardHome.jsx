import { useEffect, useState } from "react";

export default function HrDashboardHome() {
  
const API_BASE = import.meta.env.VITE_API_BASE_URL;
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });

  const departments = [
    { name: "IT", count: 40 },
    { name: "HR", count: 20 },
    { name: "Sales", count: 30 },
    { name: "Support", count: 30 },
    { name: "Finance", count: 15 },
    { name: "Marketing", count: 25 },
  ];

  const recruitment = {
    selected: 20,
    waiting: 15,
    rejected: 15,
  };

  useEffect(() => {
    setTimeout(() => {
      setStats({
        total: 120,
        pending: 8,
        approved: 100,
        rejected: 12,
      });
    }, 500);
  }, []);

  const maxDept = Math.max(...departments.map(d => d.count));
  const totalRecruit =
    recruitment.selected + recruitment.waiting + recruitment.rejected;

  const selectedPercent = (recruitment.selected / totalRecruit) * 100;
  const waitingPercent = (recruitment.waiting / totalRecruit) * 100;

  return (
    <div className="container-fluid p-3">
      <h4 className="mb-4 fw-bold">HR Dashboard</h4>

      {/* ===== TOP CARDS ===== */}
      <div className="row g-3">
        <Card title="Total Employees" value={stats.total} color="#2563eb" />
        <Card title="Pending" value={stats.pending} color="#f59e0b" />
        <Card title="Approved" value={stats.approved} color="#10b981" />
        <Card title="Rejected" value={stats.rejected} color="#ef4444" />
      </div>

      {/* ===== DEPARTMENT GRAPH ===== */}
      <div className="card mt-4 shadow-sm">
        <div className="card-body">
          <h5>Department Distribution</h5>

          {departments.map((dept, i) => (
            <div key={i} className="mb-3">
              <div className="d-flex justify-content-between">
                <span>{dept.name}</span>
                <span>{dept.count}</span>
              </div>

              <div className="progress">
                <div
                  className="progress-bar"
                  style={{
                    width: `${(dept.count / maxDept) * 100}%`,
                    background: i % 2 === 0 ? "#3b82f6" : "#10b981",
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ===== RECRUITMENT PIE CHART ===== */}
      <div className="card mt-4 shadow-sm">
        <div className="card-body text-center">
          <h5>Recruitment Overview</h5>

          <div
            className="pie-chart mt-3"
            style={{
              background: `conic-gradient(
                #10b981 0% ${selectedPercent}%,
                #f59e0b ${selectedPercent}% ${selectedPercent + waitingPercent}%,
                #ef4444 ${selectedPercent + waitingPercent}% 100%
              )`,
            }}
          ></div>

          <div className="d-flex justify-content-center gap-4 mt-3">
            <Legend color="#10b981" label={`Selected (${recruitment.selected})`} />
            <Legend color="#f59e0b" label={`Waiting (${recruitment.waiting})`} />
            <Legend color="#ef4444" label={`Rejected (${recruitment.rejected})`} />
          </div>
        </div>
      </div>

      {/* ===== PENDING TABLE ===== */}
      <div className="card mt-4 shadow-sm">
        <div className="card-body">
          <h5>Pending Approvals</h5>

          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>John</td>
                  <td>Developer</td>
                  <td>
                    <button className="btn btn-success btn-sm me-2">
                      Approve
                    </button>
                    <button className="btn btn-danger btn-sm">
                      Reject
                    </button>
                  </td>
                </tr>
                <tr>
                  <td>Priya</td>
                  <td>HR</td>
                  <td>
                    <button className="btn btn-success btn-sm me-2">
                      Approve
                    </button>
                    <button className="btn btn-danger btn-sm">
                      Reject
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ===== RECENT ACTIVITY ===== */}
      <div className="card mt-4 shadow-sm">
        <div className="card-body">
          <h5>Recent Activities</h5>
          <ul className="list-group">
            <li className="list-group-item">✅ Employee Approved</li>
            <li className="list-group-item">🔴 New Registration</li>
            <li className="list-group-item">❌ Document Rejected</li>
          </ul>
        </div>
      </div>

      {/* ===== STYLE ===== */}
      <style>{`
        .card {
          border-radius: 12px;
        }

        .card:hover {
          transform: translateY(-5px);
          transition: 0.3s;
        }

        .progress {
          height: 10px;
          border-radius: 10px;
        }

        .pie-chart {
          width: 150px;
          height: 150px;
          border-radius: 50%;
          margin: auto;
        }

        @media (max-width: 768px) {
          h4 { font-size: 18px; }
          .pie-chart {
            width: 120px;
            height: 120px;
          }
        }
      `}</style>
    </div>
  );
}

/* ===== COMPONENTS ===== */

function Card({ title, value, color }) {
  return (
    <div className="col-12 col-sm-6 col-lg-3">
      <div
        style={{
          background: color,
          borderRadius: "12px",
          padding: "20px",
          color: "#fff",
        }}
      >
        <h6>{title}</h6>
        <h3>{value}</h3>
      </div>
    </div>
  );
}

function Legend({ color, label }) {
  return (
    <div className="d-flex align-items-center gap-2">
      <div style={{ width: "12px", height: "12px", background: color }}></div>
      <small>{label}</small>
    </div>
  );
}