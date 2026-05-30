import React, { useEffect, useState, useRef } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_BASE_URL;

export default function PosterSidebar({ type = "jobs" }) {
  const [posters, setPosters] = useState([]);
  const [active,  setActive]  = useState(0);
  const [enlarged, setEnlarged] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    axios
      .get(`${API}/api/connect/posters?type=${type}`)
      .then((r) => {
        const data = Array.isArray(r.data) ? r.data : [];
        setPosters(data);
      })
      .catch(() => setPosters([]));
  }, [type]);

  useEffect(() => {
    if (posters.length < 2) return;
    intervalRef.current = setInterval(() => {
      setActive((prev) => (prev + 1) % posters.length);
    }, 5000);
    return () => clearInterval(intervalRef.current);
  }, [posters]);

  const goTo = (index) => {
    setActive(index);
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setActive((prev) => (prev + 1) % posters.length);
    }, 5000);
  };

  const openEnlarged = (url) => {
    setEnlarged(url);
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const closeEnlarged = () => {
    setEnlarged(null);
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleWheel = (e) => {
    e.preventDefault();
    setZoom((prev) => Math.min(4, Math.max(1, prev - e.deltaY * 0.001)));
  };

  const handleMouseDown = (e) => {
    if (zoom <= 1) return;
    setDragging(true);
    dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e) => {
    if (!dragging) return;
    setPan({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y,
    });
  };

  const handleMouseUp = () => setDragging(false);

  // Touch pinch zoom
  const lastDist = useRef(null);
  const handleTouchMove = (e) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (lastDist.current) {
        const delta = dist - lastDist.current;
        setZoom((prev) => Math.min(4, Math.max(1, prev + delta * 0.01)));
      }
      lastDist.current = dist;
    }
  };
  const handleTouchEnd = () => { lastDist.current = null; };

  if (posters.length === 0) return null;

  const current = posters[active] || {};

  return (
    <>
      <div style={{ position: "sticky", top: 80 }}>
        <div
          className="d-flex align-items-center gap-2 mb-3"
          style={{ borderLeft: "3px solid #d61f26", paddingLeft: 10 }}
        >
          <span className="fw-bold" style={{ fontSize: 14 }}>
            📢 Latest Hiring Posters
          </span>
          <span
            className="badge rounded-pill"
            style={{ background: "#ffeaea", color: "#d61f26", fontSize: 11 }}
          >
            {posters.length} editions
          </span>
        </div>

        <div
          className="rounded-4 overflow-hidden"
          style={{
            boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
            cursor: "zoom-in",
            border: "2px solid #f5e0e0",
            transition: "transform 0.3s ease",
            background: "#fff",
          }}
          onClick={() => openEnlarged(current.imageUrl)}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.01)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
        >
          {/* ✅ FIX 1: ${API} prefix எடுத்தோம் */}
          <img
            src={current.imageUrl}
            alt={current.title || "Poster"}
            style={{ width: "100%", display: "block" }}
          />
          <div
            style={{
              background: "linear-gradient(135deg, #d61f26, #9f1216)",
              color: "#fff",
              padding: "10px 14px",
              fontSize: 13,
            }}
          >
            <div className="fw-bold">{current.title || "Hiring Poster"}</div>
            {current.edition && (
              <small style={{ opacity: 0.85 }}>{current.edition}</small>
            )}
          </div>
        </div>

        {posters.length > 1 && (
          <div className="d-flex justify-content-center gap-2 mt-3">
            {posters.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                style={{
                  width: i === active ? 24 : 8,
                  height: 8,
                  borderRadius: 999,
                  border: "none",
                  background: i === active ? "#d61f26" : "#ddd",
                  padding: 0,
                  cursor: "pointer",
                  transition: "all 0.3s",
                }}
              />
            ))}
          </div>
        )}

        {posters.length > 1 && (
          <div className="d-flex gap-2 mt-3 flex-wrap">
            {posters.map((p, i) => (
              <img
                key={i}
                src={p.imageUrl} // ✅ FIX 2: ${API} prefix எடுத்தோம்
                alt={p.title || "Poster"}
                onClick={() => goTo(i)}
                style={{
                  width: 52,
                  height: 52,
                  objectFit: "cover",
                  borderRadius: 8,
                  cursor: "pointer",
                  border: i === active ? "2.5px solid #d61f26" : "2.5px solid transparent",
                  opacity: i === active ? 1 : 0.65,
                  transition: "all 0.25s",
                }}
              />
            ))}
          </div>
        )}

        <p className="text-muted mt-2" style={{ fontSize: 11, textAlign: "center" }}>
          🔍 Click poster to zoom
        </p>
      </div>

      {/* ✅ FIX 3: Zoom modal */}
      {enlarged && (
        <div
          onClick={closeEnlarged}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.92)",
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          {/* Zoom controls */}
          <div
            style={{
              position: "absolute",
              bottom: 30,
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              gap: 12,
              zIndex: 100001,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setZoom((z) => Math.max(1, z - 0.5))}
              style={zoomBtnStyle}
            >−</button>
            <span style={{ color: "#fff", lineHeight: "36px", fontSize: 13 }}>
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(4, z + 0.5))}
              style={zoomBtnStyle}
            >+</button>
            <button
              onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
              style={{ ...zoomBtnStyle, background: "#555" }}
            >Reset</button>
          </div>

          {/* Close button */}
          <button
            onClick={closeEnlarged}
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
              zIndex: 100001,
            }}
          >✕</button>

          {/* Zoomable image container */}
          <div
            onClick={(e) => e.stopPropagation()}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{
              overflow: "hidden",
              cursor: zoom > 1 ? (dragging ? "grabbing" : "grab") : "zoom-in",
              borderRadius: 16,
              maxWidth: "85vw",
              maxHeight: "85vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <img
              src={enlarged} // ✅ FIX 4: already clean URL, no prefix needed
              alt="Poster"
              draggable={false}
              style={{
                maxWidth: "85vw",
                maxHeight: "85vh",
                borderRadius: 16,
                boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
                transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
                transition: dragging ? "none" : "transform 0.2s ease",
                userSelect: "none",
              }}
            />
          </div>

          <p style={{
            position: "absolute",
            top: 20,
            left: "50%",
            transform: "translateX(-50%)",
            color: "rgba(255,255,255,0.6)",
            fontSize: 12,
            whiteSpace: "nowrap",
          }}>
            🖱️ Scroll to zoom · Drag to pan · Pinch on mobile
          </p>
        </div>
      )}
    </>
  );
}

const zoomBtnStyle = {
  background: "#d61f26",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  width: 36,
  height: 36,
  fontSize: 18,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};