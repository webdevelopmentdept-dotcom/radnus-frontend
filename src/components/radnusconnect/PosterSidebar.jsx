import React, { useEffect, useState, useRef } from "react";
import axios from "axios";

export default function PosterSidebar() {
  const [posters, setPosters] = useState([]);
  const [active, setActive] = useState(0);
  const [enlarged, setEnlarged] = useState(null);

  const intervalRef = useRef(null);

  // ─────────────────────────────────────────────
  // Fetch Posters
  // ─────────────────────────────────────────────
  useEffect(() => {
    axios
      .get("/api/connect/posters")
      .then((r) => {
        const posterData = Array.isArray(r.data)
          ? r.data
          : r.data.posters || r.data.data || [];

        setPosters(posterData);
      })
      .catch((err) => {
        console.error("Poster fetch error:", err);
        setPosters([]);
      });
  }, []);

  // ─────────────────────────────────────────────
  // Auto Slider
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (!Array.isArray(posters) || posters.length < 2) return;

    intervalRef.current = setInterval(() => {
      setActive((prev) => (prev + 1) % posters.length);
    }, 5000);

    return () => clearInterval(intervalRef.current);
  }, [posters]);

  // ─────────────────────────────────────────────
  // Change Slide Manually
  // ─────────────────────────────────────────────
  const goTo = (index) => {
    setActive(index);

    clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      setActive((prev) => (prev + 1) % posters.length);
    }, 5000);
  };

  // ─────────────────────────────────────────────
  // Safety Check
  // ─────────────────────────────────────────────
  if (!Array.isArray(posters) || posters.length === 0) {
    return null;
  }

  const current = posters[active] || {};

  return (
    <>
      {/* ───────────────────────────────────── */}
      {/* Sidebar */}
      {/* ───────────────────────────────────── */}
      <div
        style={{
          position: "sticky",
          top: 80,
        }}
      >
        {/* Header */}
        <div
          className="d-flex align-items-center gap-2 mb-3"
          style={{
            borderLeft: "3px solid #d61f26",
            paddingLeft: 10,
          }}
        >
          <span
            className="fw-bold"
            style={{
              fontSize: 14,
            }}
          >
            📢 Latest Hiring Posters
          </span>

          <span
            className="badge rounded-pill"
            style={{
              background: "#ffeaea",
              color: "#d61f26",
              fontSize: 11,
            }}
          >
            {posters.length} editions
          </span>
        </div>

        {/* Main Poster */}
        <div
          className="rounded-4 overflow-hidden"
          style={{
            boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
            cursor: "pointer",
            border: "2px solid #f5e0e0",
            transition: "transform 0.3s ease",
            background: "#fff",
          }}
          onClick={() => setEnlarged(current.imageUrl)}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.01)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          <img
            src={current.imageUrl}
            alt={current.title || "Poster"}
            style={{
              width: "100%",
              display: "block",
            }}
          />

          {/* Caption */}
          <div
            style={{
              background:
                "linear-gradient(135deg, #d61f26, #9f1216)",
              color: "#fff",
              padding: "10px 14px",
              fontSize: 13,
            }}
          >
            <div className="fw-bold">
              {current.title || "Hiring Poster"}
            </div>

            {current.edition && (
              <small
                style={{
                  opacity: 0.85,
                }}
              >
                {current.edition}
              </small>
            )}
          </div>
        </div>

        {/* Dots */}
        {posters.length > 1 && (
          <div className="d-flex justify-content-center gap-2 mt-3">
            {Array.isArray(posters) &&
              posters.map((_, i) => (
                <button
                  key={`dot-${i}`}
                  onClick={() => goTo(i)}
                  style={{
                    width: i === active ? 24 : 8,
                    height: 8,
                    borderRadius: 999,
                    border: "none",
                    background:
                      i === active
                        ? "#d61f26"
                        : "#ddd",
                    padding: 0,
                    cursor: "pointer",
                    transition: "all 0.3s",
                  }}
                />
              ))}
          </div>
        )}

        {/* Thumbnails */}
        {posters.length > 1 && (
          <div className="d-flex gap-2 mt-3 flex-wrap">
            {Array.isArray(posters) &&
              posters.map((p, i) => (
                <img
                  key={`${p._id || "poster"}-${i}`}
                  src={p.imageUrl}
                  alt={p.title || "Poster"}
                  onClick={() => goTo(i)}
                  style={{
                    width: 52,
                    height: 52,
                    objectFit: "cover",
                    borderRadius: 8,
                    cursor: "pointer",
                    border:
                      i === active
                        ? "2.5px solid #d61f26"
                        : "2.5px solid transparent",
                    opacity: i === active ? 1 : 0.65,
                    transition: "all 0.25s",
                  }}
                />
              ))}
          </div>
        )}

        {/* Hint */}
        <p
          className="text-muted mt-2"
          style={{
            fontSize: 11,
            textAlign: "center",
          }}
        >
          Click poster to enlarge
        </p>
      </div>

      {/* ───────────────────────────────────── */}
      {/* Lightbox */}
      {/* ───────────────────────────────────── */}
      {enlarged && (
        <div
          onClick={() => setEnlarged(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.88)",
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <img
            src={enlarged}
            alt="Poster Enlarged"
            style={{
              maxWidth: "90vw",
              maxHeight: "90vh",
              borderRadius: 16,
              boxShadow:
                "0 20px 60px rgba(0,0,0,0.5)",
            }}
          />

          {/* Close Button */}
          <button
            onClick={() => setEnlarged(null)}
            style={{
              position: "absolute",
              top: 20,
              right: 20,
              background: "#d61f26",
              color: "#fff",
              border: "none",
              borderRadius: "50%",
              width: 40,
              height: 40,
              fontSize: 20,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
}