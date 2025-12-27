import React, { useEffect, useState } from "react";

export default function AdminUpdates() {
  const [updates, setUpdates] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
 const API = import.meta.env.VITE_API_BASE_URL;
  // Load all updates
  const loadUpdates = async () => {
    try {
      const res = await fetch(`${API}/api/updates`);
      const data = await res.json();

      // FIX: Must use data.updates
      if (data.success) {
        setUpdates(data.updates);
      }
    } catch (err) {
      console.log("Error fetching updates", err);
    }
  };

  useEffect(() => {
    loadUpdates();
  }, []);

  // Add update
  const addUpdate = async (e) => {
    e.preventDefault();
    if (!message.trim()) return alert("Message cannot be empty");

    setLoading(true);

    const res = await fetch(`${API}/api/updates/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });

    const data = await res.json();
    setLoading(false);

    if (data.success) {
      setMessage("");
      loadUpdates();
    } else {
      alert(data.message);
    }
  };

  // Delete update
  const deleteUpdate = async (id) => {
    if (!window.confirm("Delete this update?")) return;

    const res = await fetch(
      `${API}/api/updates/delete/${id}`,
      { method: "DELETE" }
    );

    const data = await res.json();

    if (data.success) {
      loadUpdates();
    } else {
      alert("Delete failed");
    }
  };

  return (
    <div className="container mt-4">

      <h2 className="fw-bold mb-4 text-primary">📢 Admin Updates</h2>

      {/* Add Update Box */}
      <div className="card shadow-sm p-4 mb-4">
        <h5 className="fw-semibold mb-3">Add New Announcement</h5>

        <form onSubmit={addUpdate}>
          <textarea
            className="form-control mb-3"
            rows="3"
            placeholder="Write an update message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          ></textarea>

          <button className="btn btn-primary px-4" disabled={loading}>
            {loading ? "Posting..." : "Post Update"}
          </button>
        </form>
      </div>

      {/* Updates List */}
      <div className="card shadow-sm p-4">
        <h5 className="fw-semibold mb-3">Recent Updates</h5>

        {updates.length === 0 && (
          <p className="text-muted">No updates posted yet.</p>
        )}

        {updates.map((u) => (
          <div
            key={u._id}
            className="border rounded p-3 mb-3 d-flex justify-content-between align-items-start"
          >
            <div>
              <p className="m-0">{u.message}</p>

              {/* FIX: Date formatting */}
              <small className="text-secondary">
                {new Date(u.createdAt).toLocaleDateString()}
                {" • "}
                {new Date(u.createdAt).toLocaleTimeString()}
              </small>
            </div>

            <button
              className="btn btn-sm btn-outline-danger"
              onClick={() => deleteUpdate(u._id)}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
