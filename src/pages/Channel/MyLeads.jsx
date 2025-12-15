import { useOutletContext } from "react-router-dom";
import { useState, useEffect } from "react";

export default function LeadsList() {
  const { darkMode } = useOutletContext();
  const [leads, setLeads] = useState([]);

  useEffect(() => {
    loadMyLeads();
  }, []);

  const loadMyLeads = async () => {
    try {
      const partnerId = localStorage.getItem("partnerId");
      if (!partnerId) return;

      const res = await fetch(
        `http://localhost:5000/api/lead/partner/${partnerId}`
      );
      const data = await res.json();

      if (data.success) setLeads(data.leads);
    } catch (err) {
      console.error("Error loading leads:", err);
    }
  };

  const statusStyle = (status) => {
    const map = {
      Pending: { bg: "#fff3cd", color: "#b45309" },
      PENDING: { bg: "#fff3cd", color: "#b45309" },

      Approve: { bg: "#dcfce7", color: "#15803d" },
      APPROVED: { bg: "#dcfce7", color: "#15803d" },
      CONVERTED: { bg: "#dcfce7", color: "#15803d" },

      Reject: { bg: "#fee2e2", color: "#b91c1c" },
      REJECTED: { bg: "#fee2e2", color: "#b91c1c" },
    };

    return map[status] || { bg: "#e5e7eb", color: "#374151" };
  };

  return (
    <div style={{ padding: "24px" }}>
      <h2
        style={{
          fontSize: "26px",
          fontWeight: 700,
          marginBottom: "18px",
          color: darkMode ? "#fff" : "#111827",
        }}
      >
        My Leads
      </h2>

      <div
        style={{
          background: darkMode ? "#141414" : "#ffffff",
          borderRadius: "16px",
          padding: "18px",
          boxShadow: darkMode
            ? "0 8px 24px rgba(0,0,0,0.5)"
            : "0 8px 24px rgba(0,0,0,0.08)",
          overflowX: "auto",
        }}
      >
        {leads.length === 0 ? (
          <div
            style={{
              padding: "40px",
              textAlign: "center",
              color: "#9ca3af",
              fontSize: "15px",
            }}
          >
            No leads found
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr
                style={{
                  background: darkMode ? "#1f1f1f" : "#f3f4f6",
                  textAlign: "left",
                }}
              >
                {["Name", "Course", "Status", "Remark"].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "14px",
                      fontSize: "14px",
                      fontWeight: 600,
                      color: darkMode ? "#d1d5db" : "#374151",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {leads.map((l, i) => {
                const s = statusStyle(l.status);

                return (
                  <tr
                    key={l._id}
                    style={{
                      borderBottom: darkMode
                        ? "1px solid #262626"
                        : "1px solid #e5e7eb",
                      background:
                        i % 2 === 0
                          ? "transparent"
                          : darkMode
                          ? "#181818"
                          : "#fafafa",
                    }}
                  >
                    <td style={{ padding: "14px", fontWeight: 500 }}>
                      {l.name}
                    </td>
                    <td style={{ padding: "14px", color: "#6b7280" }}>
                      {l.course}
                    </td>
                    <td style={{ padding: "14px" }}>
                      <span
                        style={{
                          background: s.bg,
                          color: s.color,
                          padding: "6px 14px",
                          borderRadius: "999px",
                          fontSize: "13px",
                          fontWeight: 600,
                          display: "inline-block",
                        }}
                      >
                        {l.status}
                      </span>
                    </td>
                    <td style={{ padding: "14px", color: "#6b7280" }}>
                      {l.remark || "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
