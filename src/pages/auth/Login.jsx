import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();

  return (
    <div
      className="d-flex justify-content-center align-items-center"
      style={{ minHeight: "60vh" }}
    >
      <div
        className="card shadow p-4"
        style={{ width: "380px", borderRadius: "9px" }}
      >
        <h3 className="text-center text-danger fw-bold mb-4">Choose Role</h3>

        {/* Center the buttons + Reduce width */}
        <div className="d-flex flex-column gap-3 align-items-center">
          <button
            className="btn btn-outline-danger"
            style={{ width: "200px" }}
            onClick={() => navigate("/admin/login")}
          >
            Admin
          </button>

          <button
            className="btn btn-outline-primary"
            style={{ width: "200px" }}
            onClick={() => navigate("/hr/login")}
          >
            HR
          </button>

          <button
            className="btn btn-outline-success"
            style={{ width: "200px" }}
            onClick={() => navigate("/channel/login")}
          >
            Channel Partner
          </button>

          {/* <button
            className="btn btn-outline-warning"
            style={{ width: "200px" }}
            onClick={() => navigate("/employee/login")}
          >
            Employee
          </button> */}
        </div>
      </div>
    </div>
  );
}
