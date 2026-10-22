import { useEffect, useState } from "react";
import axios from "axios";
import EmployeeLayout from "./EmployeeLayout";

/* ───────── shared goals list (read-only) ───────── */
const STATUS = {
  planned: "Planned", in_progress: "In progress", paused: "Paused", completed: "Completed", cancelled: "Cancelled", revised: "Revised",
};
const money = (n) => (n === null || n === undefined ? "" : `₹${Number(n).toLocaleString("en-IN")}`);
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "");

const card = { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: 16, marginBottom: 14 };
const chip = { fontSize: 12, padding: "2px 8px", borderRadius: 20, background: "#eef2ff", color: "#3730a3" };

function SharedGoalsView({ items, emptyText }) {
  const groups = {};
  items.forEach((i) => {
    const k = String(i.employee._id);
    if (!groups[k]) groups[k] = { employee: i.employee, rows: [] };
    groups[k].rows.push(i);
  });
  const list = Object.values(groups);

  if (!list.length) return <div style={{ ...card, color: "#6b7280", textAlign: "center" }}>{emptyText}</div>;

  return list.map(({ employee, rows }) => (
    <div key={employee._id} style={card}>
      <div style={{ marginBottom: 8 }}>
        <b style={{ fontSize: 16 }}>{employee.name}</b>
        <span style={{ fontSize: 12, color: "#6b7280", marginLeft: 8 }}>{[employee.designation, employee.department].filter(Boolean).join(" · ")}</span>
      </div>
      {rows.map(({ goal, scope }) => (
        <div key={goal._id} style={{ borderTop: "1px solid #f1f5f9", padding: "10px 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
            <div>
              <b style={{ fontSize: 14 }}>{goal.title}</b>
              <div style={{ fontSize: 12, color: "#6b7280" }}>
                {goal.category}{goal.stage_number ? ` · Stage ${goal.stage_number}` : ""} · Target {fmtDate(goal.target_date)}
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
              <span style={chip}>{STATUS[goal.status] || goal.status}</span>
              <span style={{ ...chip, background: scope === "full" ? "#fef3c7" : "#f3f4f6", color: scope === "full" ? "#92400e" : "#374151" }}>
                {scope === "full" ? "Full details" : "Summary"}
              </span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "6px 0" }}>
            <div style={{ flex: 1, height: 6, background: "#e5e7eb", borderRadius: 6 }}>
              <div style={{ width: `${goal.current_progress}%`, height: 6, background: "#4f46e5", borderRadius: 6 }} />
            </div>
            <span style={{ fontSize: 12 }}>{goal.current_progress}%</span>
          </div>
          {scope === "full" && (
            <div style={{ fontSize: 13, color: "#374151", display: "grid", gap: 2 }}>
              {goal.description && <div><b>Description: </b>{goal.description}</div>}
              {goal.next_action && <div><b>Next action: </b>{goal.next_action}</div>}
              {goal.target_amount != null && <div><b>Target amount: </b>{money(goal.target_amount)}</div>}
              {goal.monthly_contribution != null && <div><b>Monthly plan: </b>{money(goal.monthly_contribution)}</div>}
              {goal.notes && <div><b>Notes: </b>{goal.notes}</div>}
            </div>
          )}
        </div>
      ))}
    </div>
  ));
}

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