import { useEffect, useState } from "react";
import axios from "axios";
import SharedGoalsView from "../hr/Sharedgoalsview"

const API = `${import.meta.env.VITE_API_BASE_URL}/api/life-growth`;
const token = () => localStorage.getItem("hrToken") || sessionStorage.getItem("hrToken");

export default function HrSharedGoals() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    axios.get(`${API}/hr/shared-goals`, { headers: { Authorization: `Bearer ${token()}` } })
      .then((r) => setItems(r.data.data || []))
      .catch((e) => setErr(e?.response?.data?.message || "Could not load shared goals"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ padding: 24, maxWidth: 900 }}>
      <h2 style={{ marginTop: 0 }}>Shared Life Goals</h2>
      <p style={{ fontSize: 14, color: "#4b5563" }}>
        Only goals that employees chose to share with HR appear here, at the level the employee chose. Private goals are never shown. Please keep this information confidential and do not use it for appraisal, salary or promotion decisions.
      </p>
      {loading && <p>Loading...</p>}
      {err && <p style={{ color: "#dc2626" }}>{err}</p>}
      {!loading && !err && <SharedGoalsView items={items} emptyText="No employee has shared a goal with HR yet." />}
    </div>
  );
}