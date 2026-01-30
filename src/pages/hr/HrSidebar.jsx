import { NavLink, useNavigate } from "react-router-dom";

export default function HrSidebar() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div
      style={{
        width: "230px",
        background: "#0d6efd",
        color: "#fff",
        minHeight: "100vh",
        padding: "20px",
      }}
    >
      <h5 className="fw-bold mb-4">HR Dashboard</h5>

      <NavLink
        to="/hr/dashboard/applicants"
        className="d-block text-white mb-3 text-decoration-none"
      >
        📄 Applicants
      </NavLink>

      <NavLink
        to="/hr/dashboard/employees"
        className="d-block text-white mb-3 text-decoration-none"
      >
        👥 Employee List
      </NavLink>

      <button onClick={logout} className="btn btn-light btn-sm mt-4">
        Logout
      </button>
    </div>
  );
}
