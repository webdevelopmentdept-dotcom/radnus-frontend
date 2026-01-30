import { useEffect, useState } from "react";

export default function HrEmployees() {
  const [employees, setEmployees] = useState([]);
  const API = import.meta.env.VITE_API_BASE_URL;
  useEffect(() => {
    const token = localStorage.getItem("token");

    fetch(`${API}/api/hr/employees`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setEmployees(data);
        } else {
          setEmployees([]);
        }
      })
      .catch(() => setEmployees([]));
  }, []);
  {
    employees.length === 0 && <p className="text-muted">No employees found</p>;
  }

  return (
    <div>
      <h4 className="fw-bold mb-3">Employee List</h4>

      <table className="table table-bordered">
        <thead>
          <tr>
            <th>Emp ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Department</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((e) => (
            <tr key={e._id}>
              <td>{e.employeeId}</td>
              <td>{e.name}</td>
              <td>{e.email}</td>
              <td>{e.department}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
