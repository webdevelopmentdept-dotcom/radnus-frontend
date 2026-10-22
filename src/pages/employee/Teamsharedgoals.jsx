import { useEffect, useState } from "react";
import axios from "axios";
import EmployeeLayout from "./EmployeeLayout";
import SharedGoalsView from "../hr/Sharedgoalsview"

const API = `${import.meta.env.VITE_API_BASE_URL}/api/life-growth`;
const token = () => localStorage.getItem("employeeToken") || sessionStorage.getItem("employeeToken");

export default function TeamSharedGoals() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    axios.get(`${API}/team/shared-goals`, { headers: { Authorization: `Bearer ${token()}` } })
      .then((r) => setItems(r.data.data || []))
      .catch((e) => setErr(e?.response?.data?.message || "Could not load shared goals"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <EmployeeLayout pageTitle="Team Life Goals">
      <div style={{ padding: 16, maxWidth: 900, margin: "0 auto" }}>
        <p style={{ fontSize: 13, color: "#4b5563" }}>
          These are goals your team members chose to share with you. Please treat them as confidential. Employees decide what you see and can stop sharing at any time.
        </p>
        {loading && <p>Loading...</p>}
        {err && <p style={{ color: "#dc2626" }}>{err}</p>}
        {!loading && !err && <SharedGoalsView items={items} emptyText="No one has shared a goal with you yet." />}
      </div>
    </EmployeeLayout>
  );
}