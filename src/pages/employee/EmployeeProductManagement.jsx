import React, { useState, useEffect } from "react";
import EmployeeLayout from "./EmployeeLayout";

export default function EmployeeProductManagement() {
  // Lives under pages/employee/ — routed at /employee/products.
  // Full CRUD, same as HR's version — access is gated by canManageProducts
  // (route guard here + backend middleware), not by feature differences.

  /* ------------------------ STYLES ------------------------ */
  const overlayStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    background: "rgba(15, 23, 42, 0.55)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backdropFilter: "blur(4px)",
    zIndex: 3000
  };

  const popupStyle = {
    width: "580px",
    background: "var(--pm-surface)",
    borderRadius: "16px",
    padding: "0",
    boxShadow: "0 24px 60px rgba(15, 23, 42, 0.25)",
    border: "1px solid var(--pm-border)",
    overflow: "hidden"
  };

  const CATEGORIES = [
    "Mobile Service Equipment",
    "Tools",
    "Machinery",
    "Accessories",
    "Software / Tools"
  ];

  /* ------------------------ STATES ------------------------ */
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [viewData, setViewData] = useState(null);
  const [lightboxImage, setLightboxImage] = useState(null); // full-size image url, or null if closed
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false); // backend 403'd — this employee isn't the assignee

  const [form, setForm] = useState({
    productName: "",
    category: "",
    applications: "",
    operatingProcedure: "",
    safetyInstructions: "",
    skillLevel: "Beginner",
    trainingVideoUrl: "",
    sopId: "",
    trainerNotes: ""
  });

  const BLANK_SPEC = {
    usageApplication: "",
    modelNumber: "",
    machineType: "",
    brand: "",
    automationGrade: "",
    weight: "",
    features: "",
  };
  const [specification, setSpecification] = useState(BLANK_SPEC);
  const [specExtra, setSpecExtra] = useState([]); // [{ label, value }] — anything not in the fixed fields

  const [imageFiles, setImageFiles] = useState([]);       // newly picked File objects (accumulates)
  const [existingImages, setExistingImages] = useState([]); // [{url, cloudinary_id}] already on the product (edit mode)
  const [removedImageIds, setRemovedImageIds] = useState([]); // cloudinary_id of existingImages the user removed
  const [sopList, setSopList] = useState([]);
  const [troubleshooting, setTroubleshooting] = useState([{ issue: "", solution: "" }]);
  const [maintenanceSchedule, setMaintenanceSchedule] = useState([{ task: "", frequency: "" }]);
  const [relatedProducts, setRelatedProducts] = useState([]);

  // Logged-in employee — used for "Updated By". Employee login only stores
  // employeeId/employeeToken directly (no combined JSON object like HR), so
  // the display name isn't available locally — fetch it once via the same
  // /api/employee/me/:id endpoint other employee pages already use
  // (see EmployeeLayout.jsx, Myprofile.jsx) and cache it in state.
  const [employeeName, setEmployeeName] = useState("Employee");
  const getEmployeeUser = () => {
    return { id: localStorage.getItem("employeeId") || null, name: employeeName };
  };

  /* ------------------------ LOAD PRODUCTS ------------------------ */
  useEffect(() => {
    loadProducts();
    loadSops();

    const empId = localStorage.getItem("employeeId");
    if (empId) {
      fetch(`${import.meta.env.VITE_API_BASE_URL}/api/employee/me/${empId}`)
        .then((r) => r.json())
        .then((data) => {
          if (data?.name) setEmployeeName(data.name);
        })
        .catch(() => {}); // keep "Employee" fallback on any failure
    }
  }, []);

  const API = import.meta.env.VITE_API_BASE_URL;

  // Every /api/products call needs this — backend added `auth` +
  // `canManageProducts` middleware, so requests without a valid,
  // access-granted employee token get a 401/403.
 const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("employeeToken") || sessionStorage.getItem("employeeToken")}`,
});

  const loadSops = async () => {
    try {
      const res = await fetch(`${API}/api/sops`, { headers: authHeaders() });
      const data = await res.json();
      if (data.success) setSopList(data.data || data.sops || []);
    } catch (err) {
      console.error("LOAD SOP ERROR", err);
    }
  };

  const loadProducts = async () => {
    try {
      const res = await fetch(`${API}/api/products`, { headers: authHeaders() });
      if (res.status === 403) {
        setAccessDenied(true);
        return;
      }
      const data = await res.json();
      if (data.success) setProducts(data.data);
    } catch (err) {
      console.error("LOAD ERROR", err);
    }
  };

  /* ------------------------ HANDLE INPUT ------------------------ */
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB — must match backend multer limit
  const MAX_IMAGES = 6; // must match backend upload.array("images", 6)

  const handleImageChange = (e) => {
    const picked = Array.from(e.target.files);
    e.target.value = ""; // allow re-picking the same file name later

    const tooBig = picked.find((f) => f.size > MAX_IMAGE_SIZE);
    if (tooBig) {
      alert(`"${tooBig.name}" is over 5MB. Please pick a smaller image (or compress it) and try again.`);
      return;
    }

    const currentCount = existingImages.length - removedImageIds.length + imageFiles.length;
    const room = MAX_IMAGES - currentCount;
    if (room <= 0) {
      alert(`You can have up to ${MAX_IMAGES} images per product. Remove one first.`);
      return;
    }

    // Accumulate instead of replacing — each pick adds to the pending list.
    setImageFiles((prev) => [...prev, ...picked.slice(0, room)]);
    if (picked.length > room) {
      alert(`Only added ${room} image(s) — ${MAX_IMAGES} max per product.`);
    }
  };

  const removeNewImage = (idx) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const removeExistingImage = (cloudinaryId) => {
    setRemovedImageIds((prev) => [...prev, cloudinaryId]);
  };

  const undoRemoveExistingImage = (cloudinaryId) => {
    setRemovedImageIds((prev) => prev.filter((id) => id !== cloudinaryId));
  };

  /* ------------------------ SPECIFICATION ------------------------ */
  const updateSpecField = (field, value) => {
    setSpecification({ ...specification, [field]: value });
  };
  const updateSpecExtraRow = (idx, field, value) => {
    const rows = [...specExtra];
    rows[idx][field] = value;
    setSpecExtra(rows);
  };
  const addSpecExtraRow = () =>
    setSpecExtra([...specExtra, { label: "", value: "" }]);
  const removeSpecExtraRow = (idx) =>
    setSpecExtra(specExtra.filter((_, i) => i !== idx));

  /* ------------------------ TROUBLESHOOTING ROWS ------------------------ */
  const updateTroubleshootingRow = (idx, field, value) => {
    const rows = [...troubleshooting];
    rows[idx][field] = value;
    setTroubleshooting(rows);
  };
  const addTroubleshootingRow = () =>
    setTroubleshooting([...troubleshooting, { issue: "", solution: "" }]);
  const removeTroubleshootingRow = (idx) =>
    setTroubleshooting(troubleshooting.filter((_, i) => i !== idx));

  /* ------------------------ MAINTENANCE ROWS ------------------------ */
  const updateMaintenanceRow = (idx, field, value) => {
    const rows = [...maintenanceSchedule];
    rows[idx][field] = value;
    setMaintenanceSchedule(rows);
  };
  const addMaintenanceRow = () =>
    setMaintenanceSchedule([...maintenanceSchedule, { task: "", frequency: "" }]);
  const removeMaintenanceRow = (idx) =>
    setMaintenanceSchedule(maintenanceSchedule.filter((_, i) => i !== idx));

  /* ------------------------ RELATED PRODUCTS ------------------------ */
  const toggleRelatedProduct = (id) => {
    setRelatedProducts((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  /* ------------------------ SAVE / UPDATE ------------------------ */
  const saveProduct = async (e) => {
    e.preventDefault();
    setSaving(true);

    const employeeUser = getEmployeeUser();

    const payload = new FormData();
    Object.entries(form).forEach(([key, value]) => payload.append(key, value));
    imageFiles.forEach((file) => payload.append("images", file));

    payload.append(
      "troubleshooting",
      JSON.stringify(troubleshooting.filter((r) => r.issue && r.solution))
    );
    payload.append(
      "maintenanceSchedule",
      JSON.stringify(maintenanceSchedule.filter((r) => r.task && r.frequency))
    );
    payload.append("relatedProducts", JSON.stringify(relatedProducts));
    payload.append(
      "specification",
      JSON.stringify({
        ...specification,
        extra: specExtra.filter((r) => r.label && r.value),
      })
    );
    // Store the readable name, not the raw id — updatedBy is a plain
    // display String on the backend (see models/Product.js), so whatever
    // we send here is exactly what "Updated By" shows on the View modal.
    payload.append("updatedBy", employeeUser.name || employeeUser.id || "");
    if (editingId && removedImageIds.length) {
      payload.append("removeImages", JSON.stringify(removedImageIds));
    }

    const url = editingId
      ? `${API}/api/products/${editingId}`
      : `${API}/api/products`;

    const method = editingId ? "PUT" : "POST";

    try {
      // Note: FormData sets its own Content-Type (with boundary) — don't set
      // it manually, just add Authorization alongside it.
      const res = await fetch(url, { method, headers: authHeaders(), body: payload });

      if (!res.ok) {
        // Try to read the backend's actual JSON error message first — the
        // router-level error handler (routes/productRoutes.js) always sends
        // { success:false, message } for 500s. Only fall back to a generic
        // message if the response isn't JSON (e.g. a host/proxy HTML error
        // page for 413 Content Too Large, before it reaches our handler).
        let backendMessage = null;
        try {
          const errData = await res.json();
          backendMessage = errData?.message || null;
        } catch (_) {
          // response wasn't JSON — ignore, fall back below
        }

        throw new Error(
          backendMessage ||
            (res.status === 413
              ? "Upload too large. Please use fewer or smaller images (max 5MB each)."
              : `Save failed (status ${res.status}). Please try again.`)
        );
      }

      const data = await res.json();

      if (data.success) {
        setShowForm(false);
        setEditingId(null);
        setImageFiles([]);
        setExistingImages([]);
        setRemovedImageIds([]);
        loadProducts();
      } else {
        alert(data.message || "Something went wrong");
      }
    } catch (err) {
      console.error("SAVE ERROR", err);
      alert(err.message || "Something went wrong while saving. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  /* ------------------------ DELETE PRODUCT ------------------------ */
  const deleteProduct = async (id) => {
    if (!window.confirm("Delete this product permanently?")) return;

    try {
      const res = await fetch(`${API}/api/products/${id}`, { method: "DELETE", headers: authHeaders() });
      const data = await res.json();
      if (data.success) loadProducts();
    } catch (err) {
      console.error("DELETE ERROR", err);
    }
  };

  /* ------------------------ EDIT ------------------------ */
  const editProduct = (p) => {
    setEditingId(p._id);
    setForm({
      productName: p.productName,
      category: p.category,
      applications: p.applications || "",
      operatingProcedure: p.operatingProcedure || "",
      safetyInstructions: p.safetyInstructions || "",
      skillLevel: p.skillLevel || "Beginner",
      trainingVideoUrl: p.trainingVideoUrl || "",
      sopId: p.sopId?._id || p.sopId || "",
      trainerNotes: p.trainerNotes || ""
    });
    setSpecification({ ...BLANK_SPEC, ...(p.specification || {}) });
    setSpecExtra(p.specification?.extra?.length ? p.specification.extra : []);
    setImageFiles([]);
    setExistingImages(p.images || []);
    setRemovedImageIds([]);
    setTroubleshooting(p.troubleshooting?.length ? p.troubleshooting : [{ issue: "", solution: "" }]);
    setMaintenanceSchedule(p.maintenanceSchedule?.length ? p.maintenanceSchedule : [{ task: "", frequency: "" }]);
    setRelatedProducts((p.relatedProducts || []).map((rp) => rp._id || rp));
    setShowForm(true);
  };

  const resetAndAdd = () => {
    setEditingId(null);
    setForm({
      productName: "",
      category: "",
      applications: "",
      operatingProcedure: "",
      safetyInstructions: "",
      skillLevel: "Beginner",
      trainingVideoUrl: "",
      sopId: "",
      trainerNotes: ""
    });
    setSpecification(BLANK_SPEC);
    setSpecExtra([]);
    setImageFiles([]);
    setExistingImages([]);
    setRemovedImageIds([]);
    setTroubleshooting([{ issue: "", solution: "" }]);
    setMaintenanceSchedule([{ task: "", frequency: "" }]);
    setRelatedProducts([]);
    setShowForm(true);
  };

  /* ------------------------ SEARCH ------------------------ */
  const filteredProducts = products.filter((p) =>
    p.productName.toLowerCase().includes(search.toLowerCase())
  );

  /* ------------------------ UI ------------------------ */
  // Backend already blocks this at the API level (403), but showing a clear
  // message instead of a blank/broken table is much better UX than letting
  // every fetch silently fail.
  if (accessDenied) {
    return (
      <EmployeeLayout>
        <div
          style={{
            minHeight: "60vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: "40px 20px",
            color: "#101828",
          }}
        >
          <div style={{ fontSize: "40px", marginBottom: "12px" }}>🔒</div>
          <h4 style={{ fontWeight: 700, marginBottom: "8px" }}>You don't have access to this page</h4>
          <p style={{ color: "#64748B", maxWidth: "380px" }}>
            Product Management is currently assigned to a different employee. Contact HR if you think this is a mistake.
          </p>
        </div>
      </EmployeeLayout>
    );
  }

  return (
    <EmployeeLayout>
    <div className="pm-root container-fluid px-4 py-4">
      {/* DESIGN SYSTEM TOKENS + COMPONENT STYLES — visual layer only, no logic here */}
      <style>{`
        .pm-root {
          --pm-bg: #F6F7FB;
          --pm-surface: #FFFFFF;
          --pm-border: #E4E7EE;
          --pm-text: #101828;
          --pm-text-muted: #64748B;
          --pm-primary: #2A3EB1;
          --pm-primary-dark: #212F8B;
          --pm-primary-soft: #EEF1FD;
          --pm-accent: #0F9D80;
          --pm-accent-soft: #E7F7F2;
          --pm-danger: #D8434B;
          --pm-danger-soft: #FDEEEE;
          --pm-radius-lg: 16px;
          --pm-radius-md: 12px;
          --pm-radius-sm: 8px;
          --pm-shadow-sm: 0 1px 2px rgba(16, 24, 40, 0.06);
          --pm-shadow-md: 0 8px 24px rgba(16, 24, 40, 0.08);
          background: var(--pm-bg);
          min-height: 100vh;
          font-family: "Inter", "Segoe UI", system-ui, -apple-system, sans-serif;
          color: var(--pm-text);
        }

        .pm-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 28px;
          gap: 16px;
          flex-wrap: wrap;
        }
        .pm-brand { display: flex; align-items: center; gap: 14px; }
        .pm-brand-icon {
          width: 44px; height: 44px;
          border-radius: var(--pm-radius-sm);
          background: var(--pm-primary-soft);
          display: flex; align-items: center; justify-content: center;
        }
        .pm-brand-icon img { width: 24px; height: 24px; }
        .pm-eyebrow {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--pm-primary);
          margin: 0 0 2px;
        }
        .pm-title { font-size: 22px; font-weight: 700; margin: 0; color: var(--pm-text); }

        .pm-btn {
          border: none;
          border-radius: var(--pm-radius-sm);
          font-weight: 600;
          font-size: 14px;
          padding: 10px 18px;
          transition: all 0.15s ease;
          cursor: pointer;
        }
        .pm-btn-primary { background: var(--pm-primary); color: #fff; box-shadow: var(--pm-shadow-sm); }
        .pm-btn-primary:hover { background: var(--pm-primary-dark); }
        .pm-btn-ghost {
          background: var(--pm-surface);
          color: var(--pm-text);
          border: 1px solid var(--pm-border);
        }
        .pm-btn-ghost:hover { background: #F2F3F7; }
        .pm-btn-sm { padding: 6px 12px; font-size: 12.5px; border-radius: var(--pm-radius-sm); }
        .pm-btn-outline-primary { background: var(--pm-surface); color: var(--pm-primary); border: 1px solid var(--pm-border); }
        .pm-btn-outline-primary:hover { background: var(--pm-primary-soft); border-color: var(--pm-primary); }
        .pm-btn-outline-info { background: var(--pm-surface); color: #0B6FA8; border: 1px solid var(--pm-border); }
        .pm-btn-outline-info:hover { background: #EAF4FB; border-color: #0B6FA8; }
        .pm-btn-outline-danger { background: var(--pm-surface); color: var(--pm-danger); border: 1px solid var(--pm-border); }
        .pm-btn-outline-danger:hover { background: var(--pm-danger-soft); border-color: var(--pm-danger); }
        .pm-btn-outline-secondary { background: var(--pm-surface); color: var(--pm-text-muted); border: 1px solid var(--pm-border); font-weight: 600; font-size: 13px; padding: 6px 14px; border-radius: var(--pm-radius-sm); }
        .pm-btn-outline-secondary:hover { background: #F2F3F7; }
        .pm-btn-icon-danger {
          border-radius: 50%;
          border: none;
          width: 22px; height: 22px;
          display: flex; align-items: center; justify-content: center;
          padding: 0; line-height: 1; font-size: 13px;
          background: var(--pm-danger); color: #fff;
        }
        .pm-btn-icon-muted {
          border-radius: 50%;
          border: none;
          width: 22px; height: 22px;
          display: flex; align-items: center; justify-content: center;
          padding: 0; line-height: 1; font-size: 13px;
          background: #94A3B8; color: #fff;
        }

        .pm-search {
          max-width: 360px;
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--pm-surface);
          border: 1px solid var(--pm-border);
          border-radius: var(--pm-radius-sm);
          padding: 9px 14px;
          box-shadow: var(--pm-shadow-sm);
          margin-bottom: 24px;
        }
        .pm-search input {
          border: none; outline: none; flex: 1; font-size: 14px; background: transparent; color: var(--pm-text);
        }
        .pm-search svg { color: var(--pm-text-muted); flex-shrink: 0; }

        .pm-card {
          background: var(--pm-surface);
          border: 1px solid var(--pm-border);
          border-radius: var(--pm-radius-lg);
          box-shadow: var(--pm-shadow-sm);
          overflow: hidden;
        }

        .pm-table { width: 100%; border-collapse: collapse; font-size: 14px; }
        .pm-table thead th {
          text-align: left;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: var(--pm-text-muted);
          background: #FAFBFD;
          padding: 13px 16px;
          border-bottom: 1px solid var(--pm-border);
        }
        .pm-table tbody td {
          padding: 12px 16px;
          border-bottom: 1px solid var(--pm-border);
          vertical-align: middle;
          color: var(--pm-text);
        }
        .pm-table tbody tr:last-child td { border-bottom: none; }
        .pm-table tbody tr:hover { background: #FAFBFE; }
        .pm-code {
          background: var(--pm-primary-soft);
          color: var(--pm-primary-dark);
          font-size: 12.5px;
          padding: 3px 8px;
          border-radius: 6px;
          font-family: "SFMono-Regular", Consolas, monospace;
        }
        .pm-thumb {
          width: 44px; height: 44px; object-fit: cover; border-radius: 9px;
          border: 1px solid var(--pm-border);
        }
        .pm-thumb-empty {
          width: 44px; height: 44px; border-radius: 9px;
          background: #F1F2F6; display: flex; align-items: center; justify-content: center;
          color: var(--pm-text-muted); font-size: 12px;
        }
        .pm-badge {
          display: inline-flex; align-items: center; gap: 5px;
          font-size: 11.5px; font-weight: 600; padding: 4px 10px; border-radius: 999px;
        }
        .pm-badge-success { background: var(--pm-accent-soft); color: var(--pm-accent); }
        .pm-badge-neutral { background: #F1F2F6; color: var(--pm-text-muted); }
        .pm-empty { text-align: center; color: var(--pm-text-muted); padding: 48px 16px; font-size: 14px; }

        .pm-modal-head {
          padding: 20px 26px;
          border-bottom: 1px solid var(--pm-border);
          display: flex; align-items: center; justify-content: space-between;
          background: #FAFBFD;
        }
        .pm-modal-title { font-size: 17px; font-weight: 700; margin: 0; }
        .pm-modal-body { padding: 22px 26px 26px; }
        .pm-close {
          border: none; background: #F1F2F6; color: var(--pm-text-muted);
          width: 30px; height: 30px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center; font-size: 15px; cursor: pointer;
        }
        .pm-close:hover { background: #E4E7EE; color: var(--pm-text); }

        .pm-field { margin-bottom: 14px; }
        .pm-label {
          display: block; font-size: 12.5px; font-weight: 600; color: var(--pm-text); margin-bottom: 6px;
        }
        .pm-input, .pm-select, .pm-textarea {
          width: 100%;
          border: 1px solid var(--pm-border);
          border-radius: var(--pm-radius-sm);
          padding: 9px 12px;
          font-size: 13.5px;
          color: var(--pm-text);
          background: var(--pm-surface);
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }
        .pm-input:focus, .pm-select:focus, .pm-textarea:focus {
          outline: none; border-color: var(--pm-primary); box-shadow: 0 0 0 3px var(--pm-primary-soft);
        }
        .pm-hint { font-size: 11.5px; color: var(--pm-text-muted); margin-top: 5px; display: block; }

        .pm-section {
          border: 1px solid var(--pm-border);
          border-radius: var(--pm-radius-md);
          padding: 16px;
          margin-bottom: 16px;
          background: #FCFCFD;
        }
        .pm-section-eyebrow {
          font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase;
          color: var(--pm-primary); margin-bottom: 12px;
        }

        .pm-row-inline { display: flex; gap: 8px; margin-bottom: 8px; align-items: center; }

        .pm-thumb-picker { position: relative; width: 80px; height: 80px; }
        .pm-thumb-picker img { width: 80px; height: 80px; object-fit: cover; border-radius: 10px; border: 1px solid var(--pm-border); }
        .pm-thumb-badge {
          position: absolute; bottom: 4px; left: 4px; font-size: 9px; font-weight: 700;
          background: var(--pm-primary); color: #fff; padding: 2px 6px; border-radius: 5px;
        }

        .pm-checklist {
          border: 1px solid var(--pm-border); border-radius: var(--pm-radius-sm);
          padding: 10px 12px; max-height: 130px; overflow-y: auto; background: var(--pm-surface);
        }
        .pm-check-row { display: flex; align-items: center; gap: 8px; padding: 4px 0; font-size: 13.5px; }

        .pm-form-actions {
          display: flex; justify-content: flex-end; gap: 10px;
          border-top: 1px solid var(--pm-border); padding-top: 18px; margin-top: 4px;
        }

        .pm-view-thumb {
          width: 92px; height: 92px; object-fit: cover; border-radius: 12px;
          border: 1px solid var(--pm-border); cursor: pointer; transition: transform 0.15s ease;
        }
        .pm-view-thumb:hover { transform: scale(1.03); }
        .pm-view-row { font-size: 13.5px; margin-bottom: 8px; color: var(--pm-text); }
        .pm-view-row strong { color: var(--pm-text); font-weight: 600; }
        .pm-view-table { width: 100%; font-size: 13.5px; border-collapse: collapse; }
        .pm-view-table td { padding: 6px 0; border-bottom: 1px solid var(--pm-border); }
        .pm-view-table tr:last-child td { border-bottom: none; }
        .pm-view-label { color: var(--pm-text-muted); width: 45%; }
        .pm-divider { border: none; border-top: 1px solid var(--pm-border); margin: 16px 0; }
        .pm-meta { font-size: 12.5px; color: var(--pm-text-muted); margin-bottom: 4px; }
        .pm-link { color: var(--pm-primary); font-weight: 600; text-decoration: none; }
        .pm-link:hover { text-decoration: underline; }
      `}</style>

      {/* HEADER */}
      <div className="pm-topbar">
        <div className="pm-brand">
          {/* <div className="pm-brand-icon">
            <img
              src="https://img.icons8.com/color/48/tools.png"
              alt="icon"
            />
          </div> */}
          <div>
            {/* <p className="pm-eyebrow">Masters</p> */}
            <h2 className="pm-title">Product Knowledge Portal</h2>
          </div>
        </div>

        <button className="pm-btn pm-btn-primary" onClick={resetAndAdd}>
          + Add Product
        </button>
      </div>

      {/* SEARCH BAR */}
      <div className="pm-search">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          placeholder="Search product..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* TABLE */}
      <div className="pm-card">
        <div className="table-responsive">
          <table className="pm-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Image</th>
                <th>Product Code</th>
                <th>Name</th>
                <th>Category</th>
                <th>Skill Level</th>
                <th>Training Program</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredProducts.map((p, i) => (
                <tr key={p._id}>
                  <td>{i + 1}</td>
                  <td>
                    {p.images?.[0]?.url ? (
                      <img
                        src={p.images[0].url}
                        alt={p.productName}
                        className="pm-thumb"
                        onClick={() => setLightboxImage(p.images[0].url)}
                        style={{ cursor: "pointer" }}
                      />
                    ) : (
                      <span className="pm-thumb-empty">—</span>
                    )}
                  </td>
                  <td><span className="pm-code">{p.productCode}</span></td>
                  <td style={{ fontWeight: 600 }}>{p.productName}</td>
                  <td>{p.category}</td>
                  <td>{p.skillLevel}</td>
                  <td>
                    {p.trainingProgramId ? (
                      <span className="pm-badge pm-badge-success">Linked</span>
                    ) : (
                      <span className="pm-badge pm-badge-neutral">None</span>
                    )}
                  </td>

                  <td>
                    <div className="d-flex gap-2">
                      <button className="pm-btn pm-btn-sm pm-btn-outline-info" onClick={() => setViewData(p)}>
                        View
                      </button>
                      <button className="pm-btn pm-btn-sm pm-btn-outline-primary" onClick={() => editProduct(p)}>
                        Edit
                      </button>
                      <button className="pm-btn pm-btn-sm pm-btn-outline-danger" onClick={() => deleteProduct(p._id)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan="8" className="pm-empty">
                    No products found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ------------------------ ADD / EDIT FORM MODAL ------------------------ */}
      {showForm && (
        <div style={overlayStyle}>
          <div style={{ ...popupStyle, maxHeight: "85vh", display: "flex", flexDirection: "column" }}>
            <div className="pm-modal-head">
              <h4 className="pm-modal-title">{editingId ? "Edit Product" : "Add Product"}</h4>
              <button type="button" className="pm-close" onClick={() => setShowForm(false)}>×</button>
            </div>

            <div className="pm-modal-body" style={{ overflowY: "auto" }}>
              <form onSubmit={saveProduct}>
                <div className="pm-field">
                  <label className="pm-label">Product Name</label>
                  <input
                    className="pm-input"
                    name="productName"
                    value={form.productName}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="pm-field">
                  <label className="pm-label">Category</label>
                  <select
                    className="pm-select"
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select category</option>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="pm-field">
                  <label className="pm-label">Product Images</label>

                  {/* Already-uploaded images (edit mode) — click × to remove */}
                  {existingImages.length > 0 && (
                    <div className="d-flex gap-2 flex-wrap mb-2">
                      {existingImages.map((img) => {
                        const isRemoved = removedImageIds.includes(img.cloudinary_id);
                        return (
                          <div key={img.cloudinary_id} className="pm-thumb-picker">
                            <img
                              src={img.url}
                              alt=""
                              style={{ opacity: isRemoved ? 0.3 : 1 }}
                            />
                            <button
                              type="button"
                              className={isRemoved ? "pm-btn-icon-muted" : "pm-btn-icon-danger"}
                              style={{ position: "absolute", top: "-6px", right: "-6px" }}
                              onClick={() =>
                                isRemoved
                                  ? undoRemoveExistingImage(img.cloudinary_id)
                                  : removeExistingImage(img.cloudinary_id)
                              }
                              title={isRemoved ? "Undo remove" : "Remove image"}
                            >
                              {isRemoved ? "↺" : "×"}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Newly picked images — not uploaded yet, previewed here */}
                  {imageFiles.length > 0 && (
                    <div className="d-flex gap-2 flex-wrap mb-2">
                      {imageFiles.map((file, idx) => (
                        <div key={idx} className="pm-thumb-picker">
                          <img
                            src={URL.createObjectURL(file)}
                            alt=""
                          />
                          <span className="pm-thumb-badge">new</span>
                          <button
                            type="button"
                            className="pm-btn-icon-danger"
                            style={{ position: "absolute", top: "-6px", right: "-6px" }}
                            onClick={() => removeNewImage(idx)}
                            title="Remove"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <input
                    type="file"
                    className="pm-input"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                  />
                  <small className="pm-hint">
                    Up to {MAX_IMAGES} images total, 5MB each. Pick more than once to keep adding.
                  </small>
                </div>

                <div className="pm-section">
                  <p className="pm-section-eyebrow">Specification</p>
                  <div className="row g-2">
                    <div className="col-6">
                      <label className="pm-label">Usage / Application</label>
                      <input
                        className="pm-input"
                        placeholder="e.g. OCA LAMINATION"
                        value={specification.usageApplication}
                        onChange={(e) => updateSpecField("usageApplication", e.target.value)}
                      />
                    </div>
                    <div className="col-6">
                      <label className="pm-label">Model Name / Number</label>
                      <input
                        className="pm-input"
                        placeholder="e.g. LOHIYA 0007"
                        value={specification.modelNumber}
                        onChange={(e) => updateSpecField("modelNumber", e.target.value)}
                      />
                    </div>
                    <div className="col-6">
                      <label className="pm-label">Machine Type</label>
                      <input
                        className="pm-input"
                        placeholder="e.g. AUTOMATIC"
                        value={specification.machineType}
                        onChange={(e) => updateSpecField("machineType", e.target.value)}
                      />
                    </div>
                    <div className="col-6">
                      <label className="pm-label">Brand</label>
                      <input
                        className="pm-input"
                        placeholder="e.g. LOHIYA"
                        value={specification.brand}
                        onChange={(e) => updateSpecField("brand", e.target.value)}
                      />
                    </div>
                    <div className="col-6">
                      <label className="pm-label">Automation Grade</label>
                      <input
                        className="pm-input"
                        placeholder="e.g. Automatic"
                        value={specification.automationGrade}
                        onChange={(e) => updateSpecField("automationGrade", e.target.value)}
                      />
                    </div>
                    <div className="col-6">
                      <label className="pm-label">Weight</label>
                      <input
                        className="pm-input"
                        placeholder="e.g. 71 kg"
                        value={specification.weight}
                        onChange={(e) => updateSpecField("weight", e.target.value)}
                      />
                    </div>
                    <div className="col-12">
                      <label className="pm-label">Features</label>
                      <input
                        className="pm-input"
                        placeholder="e.g. OCA PURPOSE"
                        value={specification.features}
                        onChange={(e) => updateSpecField("features", e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Extra spec rows — for anything product-specific that doesn't
                      fit the fixed fields above, e.g. "Laminating Film: WHITE" */}
                  <div className="mt-3">
                    {specExtra.map((row, idx) => (
                      <div className="pm-row-inline" key={idx}>
                        <input
                          className="pm-input"
                          placeholder="Label (e.g. Laminating Film)"
                          value={row.label}
                          onChange={(e) => updateSpecExtraRow(idx, "label", e.target.value)}
                        />
                        <input
                          className="pm-input"
                          placeholder="Value (e.g. WHITE)"
                          value={row.value}
                          onChange={(e) => updateSpecExtraRow(idx, "value", e.target.value)}
                        />
                        <button
                          type="button"
                          className="pm-btn-icon-danger"
                          style={{ flexShrink: 0 }}
                          onClick={() => removeSpecExtraRow(idx)}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <button type="button" className="pm-btn-outline-secondary" onClick={addSpecExtraRow}>
                      + Add spec row
                    </button>
                  </div>
                </div>

                <div className="pm-field">
                  <label className="pm-label">Applications</label>
                  <textarea
                    className="pm-textarea"
                    name="applications"
                    rows="2"
                    value={form.applications}
                    onChange={handleChange}
                  />
                </div>

                <div className="pm-field">
                  <label className="pm-label">Operating Procedure</label>
                  <textarea
                    className="pm-textarea"
                    name="operatingProcedure"
                    rows="3"
                    value={form.operatingProcedure}
                    onChange={handleChange}
                  />
                </div>

                <div className="pm-field">
                  <label className="pm-label">Safety Instructions</label>
                  <textarea
                    className="pm-textarea"
                    name="safetyInstructions"
                    rows="2"
                    value={form.safetyInstructions}
                    onChange={handleChange}
                  />
                </div>

                <div className="row">
                  <div className="col-6 pm-field">
                    <label className="pm-label">Skill Level</label>
                    <select
                      className="pm-select"
                      name="skillLevel"
                      value={form.skillLevel}
                      onChange={handleChange}
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>
                  <div className="col-6 pm-field">
                    <label className="pm-label">Training Video URL</label>
                    <input
                      className="pm-input"
                      name="trainingVideoUrl"
                      value={form.trainingVideoUrl}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="pm-field">
                  <label className="pm-label">SOP Document</label>
                  <select
                    className="pm-select"
                    name="sopId"
                    value={form.sopId}
                    onChange={handleChange}
                  >
                    <option value="">No SOP linked</option>
                    {sopList.map((s) => (
                      <option key={s._id} value={s._id}>{s.title || s.fileName}</option>
                    ))}
                  </select>
                  <small className="pm-hint">From existing SOP library — upload new SOPs from SOP Management.</small>
                </div>

                {/* TROUBLESHOOTING */}
                <div className="pm-section">
                  <p className="pm-section-eyebrow">Troubleshooting</p>
                  {troubleshooting.map((row, idx) => (
                    <div className="pm-row-inline" key={idx}>
                      <input
                        className="pm-input"
                        placeholder="Issue"
                        value={row.issue}
                        onChange={(e) => updateTroubleshootingRow(idx, "issue", e.target.value)}
                      />
                      <input
                        className="pm-input"
                        placeholder="Solution"
                        value={row.solution}
                        onChange={(e) => updateTroubleshootingRow(idx, "solution", e.target.value)}
                      />
                      <button
                        type="button"
                        className="pm-btn-icon-danger"
                        style={{ flexShrink: 0 }}
                        onClick={() => removeTroubleshootingRow(idx)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button type="button" className="pm-btn-outline-secondary" onClick={addTroubleshootingRow}>
                    + Add row
                  </button>
                </div>

                {/* MAINTENANCE */}
                <div className="pm-section">
                  <p className="pm-section-eyebrow">Maintenance Schedule</p>
                  {maintenanceSchedule.map((row, idx) => (
                    <div className="pm-row-inline" key={idx}>
                      <input
                        className="pm-input"
                        placeholder="Task (e.g. Clean rollers)"
                        value={row.task}
                        onChange={(e) => updateMaintenanceRow(idx, "task", e.target.value)}
                      />
                      <input
                        className="pm-input"
                        placeholder="Frequency (e.g. Weekly)"
                        value={row.frequency}
                        onChange={(e) => updateMaintenanceRow(idx, "frequency", e.target.value)}
                      />
                      <button
                        type="button"
                        className="pm-btn-icon-danger"
                        style={{ flexShrink: 0 }}
                        onClick={() => removeMaintenanceRow(idx)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button type="button" className="pm-btn-outline-secondary" onClick={addMaintenanceRow}>
                    + Add row
                  </button>
                </div>

                {/* RELATED PRODUCTS */}
                <div className="pm-field">
                  <label className="pm-label">Related Products</label>
                  <div className="pm-checklist">
                    {products.filter((p) => p._id !== editingId).map((p) => (
                      <div className="pm-check-row" key={p._id}>
                        <input
                          type="checkbox"
                          id={`rel-${p._id}`}
                          checked={relatedProducts.includes(p._id)}
                          onChange={() => toggleRelatedProduct(p._id)}
                        />
                        <label htmlFor={`rel-${p._id}`}>
                          {p.productName}
                        </label>
                      </div>
                    ))}
                    {products.length === 0 && <small className="pm-hint">No other products yet</small>}
                  </div>
                </div>

                <div className="pm-field">
                  <label className="pm-label">Trainer Notes (internal)</label>
                  <textarea
                    className="pm-textarea"
                    name="trainerNotes"
                    rows="2"
                    value={form.trainerNotes}
                    onChange={handleChange}
                  />
                </div>

                <div className="pm-form-actions">
                  <button
                    type="button"
                    className="pm-btn-outline-secondary"
                    onClick={() => setShowForm(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="pm-btn pm-btn-primary" disabled={saving}>
                    {saving ? "Saving..." : editingId ? "Update Product" : "Create Product"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------ VIEW MODAL ------------------------ */}
      {viewData && (
        <div style={overlayStyle}>
          <div style={{ ...popupStyle, maxHeight: "85vh", display: "flex", flexDirection: "column" }}>
            <div className="pm-modal-head">
              <h4 className="pm-modal-title">{viewData.productName}</h4>
              <button className="pm-close" onClick={() => setViewData(null)}>×</button>
            </div>

            <div className="pm-modal-body" style={{ overflowY: "auto" }}>
              {viewData.images?.length > 0 && (
                <div className="d-flex gap-2 mb-3 flex-wrap">
                  {viewData.images.map((img, idx) => (
                    <img
                      key={idx}
                      src={img.url}
                      alt=""
                      onClick={() => setLightboxImage(img.url)}
                      className="pm-view-thumb"
                    />
                  ))}
                </div>
              )}

              <p className="pm-view-row"><strong>Product Code:</strong> <span className="pm-code">{viewData.productCode}</span></p>
              <p className="pm-view-row"><strong>Category:</strong> {viewData.category}</p>
              <p className="pm-view-row"><strong>Skill Level:</strong> {viewData.skillLevel}</p>
              {viewData.specification && (
                (() => {
                  const s = viewData.specification;
                  const rows = [
                    ["Usage/Application", s.usageApplication],
                    ["Model Name/Number", s.modelNumber],
                    ["Machine Type", s.machineType],
                    ["Brand", s.brand],
                    ["Automation Grade", s.automationGrade],
                    ["Weight", s.weight],
                    ["Features", s.features],
                    ...(s.extra || []).map((r) => [r.label, r.value]),
                  ].filter(([, v]) => v);

                  if (!rows.length) return null;

                  return (
                    <div className="pm-section mb-3">
                      <p className="pm-section-eyebrow">Specification</p>
                      <table className="pm-view-table">
                        <tbody>
                          {rows.map(([label, value]) => (
                            <tr key={label}>
                              <td className="pm-view-label">{label}</td>
                              <td>{value}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })()
              )}
              {viewData.applications && <p className="pm-view-row"><strong>Applications:</strong> {viewData.applications}</p>}
              {viewData.operatingProcedure && <p className="pm-view-row"><strong>Operating Procedure:</strong> {viewData.operatingProcedure}</p>}
              {viewData.safetyInstructions && <p className="pm-view-row"><strong>Safety Instructions:</strong> {viewData.safetyInstructions}</p>}

              {viewData.sopId && (
                <p className="pm-view-row">
                  <strong>SOP Document:</strong>{" "}
                  <a className="pm-link" href={viewData.sopId.fileUrl || viewData.sopId.url} target="_blank" rel="noreferrer">
                    {viewData.sopId.title || viewData.sopId.fileName || "View SOP"}
                  </a>
                </p>
              )}

              {viewData.trainingVideoUrl && (
                <p className="pm-view-row">
                  <strong>Training Video:</strong>{" "}
                  <a className="pm-link" href={viewData.trainingVideoUrl} target="_blank" rel="noreferrer">Watch video</a>
                </p>
              )}

              {viewData.troubleshooting?.length > 0 && (
                <div className="pm-section mb-3">
                  <p className="pm-section-eyebrow">Troubleshooting</p>
                  <ul className="mb-0 ps-3" style={{ fontSize: "13.5px" }}>
                    {viewData.troubleshooting.map((t, i) => (
                      <li key={i}><strong>{t.issue}:</strong> {t.solution}</li>
                    ))}
                  </ul>
                </div>
              )}

              {viewData.maintenanceSchedule?.length > 0 && (
                <div className="pm-section mb-3">
                  <p className="pm-section-eyebrow">Maintenance Schedule</p>
                  <ul className="mb-0 ps-3" style={{ fontSize: "13.5px" }}>
                    {viewData.maintenanceSchedule.map((m, i) => (
                      <li key={i}>{m.task} — {m.frequency}</li>
                    ))}
                  </ul>
                </div>
              )}

              {viewData.relatedProducts?.length > 0 && (
                <p className="pm-view-row">
                  <strong>Related Products:</strong>{" "}
                  {viewData.relatedProducts.map((rp) => rp.productName || rp).join(", ")}
                </p>
              )}

              <hr className="pm-divider" />
              <p className="pm-meta">
                <strong>Last Updated:</strong> {new Date(viewData.updatedAt).toLocaleString()}
              </p>
              <p className="pm-meta">
                <strong>Updated By:</strong> {viewData.updatedBy?.name || viewData.updatedBy || "—"}
              </p>

              {viewData.qrCodeUrl && (
                <div className="text-center my-3">
                  <img src={viewData.qrCodeUrl} alt="QR Code" style={{ width: "140px" }} />
                  <p className="pm-hint mt-1">Scan to open this product's page</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------ IMAGE LIGHTBOX ------------------------ */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(10,12,20,0.9)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 4000,
            cursor: "zoom-out",
          }}
        >
          <button
            onClick={() => setLightboxImage(null)}
            style={{
              position: "fixed",
              top: "20px",
              right: "24px",
              border: "none",
              background: "rgba(255,255,255,0.12)",
              color: "#fff",
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              fontSize: "18px",
              cursor: "pointer",
            }}
          >
            ×
          </button>
          <img
            src={lightboxImage}
            alt=""
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "90vw",
              maxHeight: "90vh",
              objectFit: "contain",
              borderRadius: "10px",
              cursor: "default",
              boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
            }}
          />
        </div>
      )}
    </div>
    </EmployeeLayout>
  );
}