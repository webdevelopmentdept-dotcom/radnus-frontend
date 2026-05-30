import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { FiArrowLeft, FiUserCheck } from "react-icons/fi";
import TechnicianCard from "./TechnicianCard";
import PosterSidebar from "./PosterSidebar";
import FilterPanel from "./FilterPanel";

const API = import.meta.env.VITE_API_BASE_URL;

export default function TechnicianBoard() {
  const [technicians, setTechnicians] = useState([]);
  const [total,   setTotal]   = useState(0);
  const [pages,   setPages]   = useState(1);
  const [page,    setPage]    = useState(1);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    district: "", experience: "", skill: "", search: "",
  });

  const fetchTechs = useCallback(async () => {
    setLoading(true);
    try {
      const params = { ...filters, page, limit: 12 };
      Object.keys(params).forEach((k) => !params[k] && delete params[k]);
      const { data } = await axios.get(`${API}/api/technician/public`, { params });
      setTechnicians(Array.isArray(data.technicians) ? data.technicians : []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    } catch {
      setTechnicians([]);
    }
    setLoading(false);
  }, [filters, page]);

  useEffect(() => { fetchTechs(); }, [fetchTechs]);

  const handleFilterChange = (key, val) => {
    if (key === "__reset__") {
      setFilters(val);
      setPage(1);
      return;
    }
    setFilters((f) => ({ ...f, [key]: val }));
    setPage(1);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fa" }}>
      <div style={{
        background: "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)",
        color: "#fff",
        padding: "20px 0 24px",
      }}>
        <div className="container">
          <div className="d-flex align-items-center gap-3 mb-2">
            <Link
              to="/radnus-connect"
              className="btn btn-sm d-flex align-items-center gap-1"
              style={{
                background: "rgba(255,255,255,0.15)",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                fontSize: 13,
              }}
            >
              <FiArrowLeft size={14} /> Back
            </Link>
            <span style={{ opacity: 0.5, fontSize: 13 }}>Radnus Connect</span>
          </div>
          <div className="d-flex align-items-center gap-3">
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: "#d61f26",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <FiUserCheck size={22} />
            </div>
            <div>
              <h4 className="fw-bold mb-0">Find Skilled Technicians</h4>
              <p className="mb-0" style={{ opacity: 0.7, fontSize: 14 }}>
                {total} technician{total !== 1 ? "s" : ""} available for hire
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-4">
        <div className="row g-4">
          <div className="col-lg-8">
            <FilterPanel
              filters={filters}
              onChange={handleFilterChange}
              type="technicians"
              total={total}
            />

            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-danger mb-3" />
                <p className="text-muted">Loading technicians...</p>
              </div>
            ) : technicians.length === 0 ? (
              <div className="text-center py-5 rounded-4"
                style={{ background: "#fff", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>👨‍🔧</div>
                <h5 className="fw-bold text-muted">No technicians found</h5>
                <p className="text-muted small">Try changing your filters or check back later</p>
              </div>
            ) : (
              <div className="row row-cols-1 row-cols-md-2 g-3">
                {technicians.map((tech) => (
                  <div key={tech._id} className="col">
                    <TechnicianCard tech={tech} />
                  </div>
                ))}
              </div>
            )}

            {!loading && pages > 1 && (
              <div className="d-flex justify-content-center align-items-center gap-2 mt-4 flex-wrap">
                <button className="btn btn-sm btn-outline-secondary rounded-3"
                  disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                  ← Prev
                </button>
                {Array.from({ length: pages }, (_, i) => i + 1)
                  .filter((p) => Math.abs(p - page) < 4)
                  .map((p) => (
                    <button key={p}
                      className={`btn btn-sm rounded-3 ${p === page ? "btn-danger" : "btn-outline-secondary"}`}
                      onClick={() => setPage(p)}>
                      {p}
                    </button>
                  ))}
                <button className="btn btn-sm btn-outline-secondary rounded-3"
                  disabled={page === pages} onClick={() => setPage((p) => p + 1)}>
                  Next →
                </button>
              </div>
            )}
          </div>

          <div className="col-lg-4 d-none d-lg-block">
            <PosterSidebar type="technicians" />
            <div className="rounded-4 p-4 mt-4 text-center"
              style={{ background: "linear-gradient(135deg, #d61f26, #9f1216)", color: "#fff" }}>
              <h6 className="fw-bold mb-2">Are you a technician?</h6>
              <p className="mb-3" style={{ opacity: 0.85, fontSize: 13 }}>
                Register now and get placed in top mobile shops
              </p>
              <Link to="/radnus-connect/technician"
                className="btn btn-light btn-sm w-100 rounded-3 fw-semibold"
                style={{ color: "#d61f26" }}>
                Register Free
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}