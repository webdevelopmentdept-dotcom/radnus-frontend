// PolicyQuizManagementPage.jsx
// Place this in: src/pages/hr/ (same folder as your other HR pages)
// This is just a wrapper that fetches policies and passes to PolicyQuizManagement

import { useState, useEffect } from "react";
import axios from "axios";
import PolicyQuizManagement from "./PolicyQuizManagement"; // same folder la irukku

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export default function PolicyQuizManagementPage() {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`${API_BASE}/api/policies`)
      .then((res) => {
        const data = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.data)
          ? res.data.data
          : [];
        setPolicies(data);
      })
      .catch((err) => console.log("Fetch error:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>
        Loading policies...
      </div>
    );
  }

  return <PolicyQuizManagement policies={policies} />;
}