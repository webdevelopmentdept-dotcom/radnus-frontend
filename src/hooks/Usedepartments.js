
import { useState, useEffect } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

// In-memory cache — one API call shared across all components
let _cache    = null;
let _fetching = false;
let _listeners = [];

export function useDepartments() {
  const [departments, setDepartments] = useState(_cache || []);
  const [loading, setLoading]         = useState(!_cache);

  useEffect(() => {
    if (_cache) { setDepartments(_cache); setLoading(false); return; }

    const cb = (data) => { setDepartments(data); setLoading(false); };
    _listeners.push(cb);

    if (!_fetching) {
      _fetching = true;
      axios.get(`${API_BASE}/api/departments/active`)
        .then(res => {
          _cache = res.data.data || res.data || [];
          _listeners.forEach(fn => fn(_cache));
          _listeners = []; _fetching = false;
        })
        .catch(() => {
          _listeners.forEach(fn => fn([]));
          _listeners = []; _fetching = false;
        });
    }

    return () => { _listeners = _listeners.filter(fn => fn !== cb); };
  }, []);

  // Call after add/edit/delete dept to bust cache everywhere
  const refresh = () => {
    _cache = null; _fetching = false; setLoading(true);
    axios.get(`${API_BASE}/api/departments/active`)
      .then(res => { _cache = res.data.data || []; setDepartments(_cache); setLoading(false); })
      .catch(() => setLoading(false));
  };

  return { departments, loading, refresh };
}

// ─── DepartmentSelect — plug-and-play <select> ───────────────────────────────
export function DepartmentSelect({
  value,
  onChange,
  placeholder = "Select Department",
  required    = false,
  style       = {},
}) {
  const { departments, loading } = useDepartments();

  return (
    <select
      value={value || ""}
      onChange={e => onChange(e.target.value)}
      required={required}
      style={{
        width:"100%", padding:"9px 11px",
        background:"#f9fafb", border:"1px solid #e5e7eb",
        borderRadius:8, color: value ? "#111827" : "#9ca3af",
        fontSize:13, outline:"none",
        ...style,
      }}
    >
      <option value="">{loading ? "Loading..." : placeholder}</option>
      {departments.map(d => (
        // value = dept name (string). Change to d._id if you store dept ObjectId as FK
        <option key={d._id} value={d.name}>{d.name} ({d.code})</option>
      ))}
    </select>
  );
}