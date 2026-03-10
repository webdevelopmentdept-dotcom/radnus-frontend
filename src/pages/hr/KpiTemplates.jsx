import { useState, useEffect } from "react";

const API_BASE = `${import.meta.env.VITE_API_BASE_URL}/api/kpi-templates`;

const DEPARTMENTS = ["IT", "Sales", "HR", "Marketing", "Finance", "Support"];
const ROLES = ["Developer", "Sales Executive", "HR Manager", "Marketing Executive", "Accountant", "Support Agent"];
const UNITS = ["tasks", "₹", "%", "hours", "tickets", "calls", "deals", "score"];
const FREQUENCIES = ["daily", "weekly", "monthly", "quarterly"];

const defaultItem = { kpi_name: "", target: "", unit: "tasks", weight: "", frequency: "monthly" };
const defaultForm = { template_name: "", role: "", department: "", description: "", kpi_items: [{ ...defaultItem }] };

export default function KpiTemplates() {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(defaultForm);
    const [viewTemplate, setViewTemplate] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [toast, setToast] = useState(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => { fetchTemplates(); }, []);

    const fetchTemplates = async () => {
        try {
            const res = await fetch(API_BASE);
            const data = await res.json();
            if (data.success) setTemplates(data.data);
        } catch {
            showToast("Failed to load templates", "error");
        } finally {
            setLoading(false);
        }
    };

    const showToast = (msg, type = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const openCreate = () => {
        setForm(defaultForm);
        setEditingId(null);
        setShowModal(true);
    };

    const openEdit = (t) => {
        setForm({
            template_name: t.template_name,
            role: t.role,
            department: t.department,
            description: t.description || "",
            kpi_items: t.kpi_items.map(i => ({ ...i }))
        });
        setEditingId(t._id);
        setShowModal(true);
    };

    const closeModal = () => { setShowModal(false); setEditingId(null); setForm(defaultForm); };

    const handleFormChange = (field, value) => setForm(f => ({ ...f, [field]: value }));

    const handleItemChange = (idx, field, value) => {
        setForm(f => {
            const items = [...f.kpi_items];
            items[idx] = { ...items[idx], [field]: value };
            return { ...f, kpi_items: items };
        });
    };

    const addItem = () => setForm(f => ({ ...f, kpi_items: [...f.kpi_items, { ...defaultItem }] }));

    const removeItem = (idx) => setForm(f => ({ ...f, kpi_items: f.kpi_items.filter((_, i) => i !== idx) }));

    const totalWeight = form.kpi_items.reduce((s, i) => s + (parseFloat(i.weight) || 0), 0);

    const handleSubmit = async () => {
        if (!form.template_name || !form.role || !form.department) return showToast("Fill all required fields", "error");
        if (form.kpi_items.length === 0) return showToast("Add at least one KPI", "error");
        if (totalWeight !== 100) return showToast(`Total weight must be 100%. Currently: ${totalWeight}%`, "error");
        setSaving(true);
        try {
            const url = editingId ? `${API_BASE}/${editingId}` : API_BASE;
            const method = editingId ? "PUT" : "POST";
            const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
            const data = await res.json();
            if (data.success) {
                showToast(editingId ? "Template updated!" : "Template created!");
                fetchTemplates();
                closeModal();
            } else showToast(data.message || "Error", "error");
        } catch {
            showToast("Server error", "error");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            const res = await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
            const data = await res.json();
            if (data.success) { showToast("Template deleted"); fetchTemplates(); }
        } catch { showToast("Delete failed", "error"); }
        setDeleteConfirm(null);
    };

    return (
        <div style={{ fontFamily: "'Segoe UI', sans-serif", minHeight: "100vh", background: "#f4f6fb", padding: "28px 32px" }}>

            {/* Toast */}
            {toast && (
                <div style={{
                    position: "fixed", top: 20, right: 24, zIndex: 9999,
                    background: toast.type === "error" ? "#ff4d4f" : "#52c41a",
                    color: "#fff", padding: "12px 20px", borderRadius: 8,
                    boxShadow: "0 4px 16px rgba(0,0,0,0.15)", fontWeight: 500, fontSize: 14
                }}>{toast.msg}</div>
            )}

            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#1a1a2e" }}>KPI Templates</h2>
                    <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 14 }}>Create and manage KPI templates for each role</p>
                </div>
                <button onClick={openCreate} style={{
                    background: "#2563eb", color: "#fff", border: "none", borderRadius: 8,
                    padding: "10px 20px", fontWeight: 600, fontSize: 14, cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 8
                }}>
                    + Create Template
                </button>
            </div>

            {/* Templates Grid */}
            {loading ? (
                <div style={{ textAlign: "center", padding: 60, color: "#6b7280" }}>Loading templates...</div>
            ) : templates.length === 0 ? (
                <div style={{
                    background: "#fff", borderRadius: 12, padding: "60px 0", textAlign: "center",
                    border: "1px solid #e5e7eb"
                }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
                    <p style={{ color: "#6b7280", fontSize: 15 }}>No KPI templates yet. Create your first one!</p>
                    <button onClick={openCreate} style={{
                        background: "#2563eb", color: "#fff", border: "none", borderRadius: 8,
                        padding: "10px 20px", fontWeight: 600, cursor: "pointer", marginTop: 8
                    }}>Create Template</button>
                </div>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
                    {templates.map(t => (
                        <div key={t._id} style={{
                            background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb",
                            overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)"
                        }}>
                            {/* Card Header */}
                            <div style={{ background: "#2563eb", padding: "16px 20px" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                    <div>
                                        <h3 style={{ margin: 0, color: "#fff", fontSize: 15, fontWeight: 700 }}>{t.template_name}</h3>
                                        <p style={{ margin: "4px 0 0", color: "#bfdbfe", fontSize: 13 }}>{t.role} · {t.department}</p>
                                    </div>
                                    <span style={{
                                        background: "rgba(255,255,255,0.2)", color: "#fff",
                                        padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600
                                    }}>{t.kpi_items?.length || 0} KPIs</span>
                                </div>
                            </div>

                            {/* KPI List Preview */}
                            <div style={{ padding: "16px 20px" }}>
                                {t.description && <p style={{ margin: "0 0 12px", color: "#6b7280", fontSize: 13 }}>{t.description}</p>}
                                {t.kpi_items?.slice(0, 3).map((item, i) => (
                                    <div key={i} style={{
                                        display: "flex", justifyContent: "space-between", alignItems: "center",
                                        padding: "8px 0", borderBottom: "1px solid #f3f4f6"
                                    }}>
                                        <span style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>{item.kpi_name}</span>
                                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                            <span style={{ fontSize: 12, color: "#6b7280" }}>Target: {item.target} {item.unit}</span>
                                            <span style={{
                                                background: "#eff6ff", color: "#2563eb", fontSize: 11,
                                                fontWeight: 700, padding: "2px 7px", borderRadius: 4
                                            }}>{item.weight}%</span>
                                        </div>
                                    </div>
                                ))}
                                {t.kpi_items?.length > 3 && (
                                    <p style={{ margin: "8px 0 0", fontSize: 12, color: "#9ca3af" }}>+{t.kpi_items.length - 3} more KPIs</p>
                                )}
                            </div>

                            {/* Actions */}
                            <div style={{ padding: "12px 20px", borderTop: "1px solid #f3f4f6", display: "flex", gap: 8 }}>
                                <button onClick={() => setViewTemplate(t)} style={{
                                    flex: 1, padding: "8px 0", border: "1px solid #e5e7eb", borderRadius: 7,
                                    background: "#fff", color: "#374151", fontSize: 13, fontWeight: 500, cursor: "pointer"
                                }}>View</button>
                                <button onClick={() => openEdit(t)} style={{
                                    flex: 1, padding: "8px 0", border: "1px solid #2563eb", borderRadius: 7,
                                    background: "#eff6ff", color: "#2563eb", fontSize: 13, fontWeight: 500, cursor: "pointer"
                                }}>Edit</button>
                                <button onClick={() => setDeleteConfirm(t._id)} style={{
                                    flex: 1, padding: "8px 0", border: "1px solid #fecaca", borderRadius: 7,
                                    background: "#fff5f5", color: "#ef4444", fontSize: 13, fontWeight: 500, cursor: "pointer"
                                }}>Delete</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create/Edit Modal */}
            {showModal && (
                <div style={{
                    position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000,
                    display: "flex", alignItems: "center", justifyContent: "center", padding: 20
                }}>
                    <div style={{
                        background: "#fff", borderRadius: 14, width: "100%", maxWidth: 680,
                        maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)"
                    }}>
                        {/* Modal Header */}
                        <div style={{ padding: "20px 24px", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#1a1a2e" }}>
                                {editingId ? "Edit KPI Template" : "Create KPI Template"}
                            </h3>
                            <button onClick={closeModal} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#6b7280" }}>✕</button>
                        </div>

                        <div style={{ padding: "24px" }}>
                            {/* Basic Info */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                                <div>
                                    <label style={labelStyle}>Template Name *</label>
                                    <input value={form.template_name} onChange={e => handleFormChange("template_name", e.target.value)}
                                        placeholder="e.g. Developer KPI Template" style={inputStyle} />
                                </div>
                                <div>
                                    <label style={labelStyle}>Role *</label>
                                    <select value={form.role} onChange={e => handleFormChange("role", e.target.value)} style={inputStyle}>
                                        <option value="">Select Role</option>
                                        {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={labelStyle}>Department *</label>
                                    <select value={form.department} onChange={e => handleFormChange("department", e.target.value)} style={inputStyle}>
                                        <option value="">Select Department</option>
                                        {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={labelStyle}>Description</label>
                                    <input value={form.description} onChange={e => handleFormChange("description", e.target.value)}
                                        placeholder="Optional description" style={inputStyle} />
                                </div>
                            </div>

                            {/* KPI Items */}
                            <div style={{ marginTop: 8 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                                    <label style={{ fontWeight: 700, fontSize: 14, color: "#1a1a2e" }}>KPI Items</label>
                                    <span style={{
                                        fontSize: 13, fontWeight: 600,
                                        color: totalWeight === 100 ? "#16a34a" : totalWeight > 100 ? "#ef4444" : "#f59e0b"
                                    }}>Total Weight: {totalWeight}% {totalWeight === 100 ? "✓" : totalWeight > 100 ? "(Over!)" : "(Need 100%)"}</span>
                                </div>

                                {form.kpi_items.map((item, idx) => (
                                    <div key={idx} style={{
                                        background: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: 10,
                                        padding: 16, marginBottom: 12
                                    }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                                            <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>KPI #{idx + 1}</span>
                                            {form.kpi_items.length > 1 && (
                                                <button onClick={() => removeItem(idx)} style={{
                                                    background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 13, fontWeight: 500
                                                }}>Remove</button>
                                            )}
                                        </div>
                                        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", gap: 10 }}>
                                            <div>
                                                <label style={labelStyle}>KPI Name *</label>
                                                <input value={item.kpi_name} onChange={e => handleItemChange(idx, "kpi_name", e.target.value)}
                                                    placeholder="e.g. Tasks Completed" style={inputStyle} />
                                            </div>
                                            <div>
                                                <label style={labelStyle}>Target *</label>
                                                <input type="number" value={item.target} onChange={e => handleItemChange(idx, "target", e.target.value)}
                                                    placeholder="20" style={inputStyle} />
                                            </div>
                                            <div>
                                                <label style={labelStyle}>Unit</label>
                                                <select value={item.unit} onChange={e => handleItemChange(idx, "unit", e.target.value)} style={inputStyle}>
                                                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label style={labelStyle}>Weight %</label>
                                                <input type="number" value={item.weight} onChange={e => handleItemChange(idx, "weight", e.target.value)}
                                                    placeholder="40" style={inputStyle} />
                                            </div>
                                            <div>
                                                <label style={labelStyle}>Frequency</label>
                                                <select value={item.frequency} onChange={e => handleItemChange(idx, "frequency", e.target.value)} style={inputStyle}>
                                                    {FREQUENCIES.map(f => <option key={f} value={f}>{f}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                <button onClick={addItem} style={{
                                    width: "100%", padding: "10px 0", border: "2px dashed #d1d5db", borderRadius: 8,
                                    background: "none", color: "#6b7280", fontSize: 14, cursor: "pointer", fontWeight: 500
                                }}>+ Add KPI Item</button>
                            </div>

                            {/* Footer Buttons */}
                            <div style={{ display: "flex", gap: 12, marginTop: 24, justifyContent: "flex-end" }}>
                                <button onClick={closeModal} style={{
                                    padding: "10px 24px", border: "1px solid #e5e7eb", borderRadius: 8,
                                    background: "#fff", color: "#374151", fontWeight: 600, cursor: "pointer"
                                }}>Cancel</button>
                                <button onClick={handleSubmit} disabled={saving} style={{
                                    padding: "10px 28px", border: "none", borderRadius: 8,
                                    background: saving ? "#93c5fd" : "#2563eb", color: "#fff",
                                    fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", fontSize: 14
                                }}>{saving ? "Saving..." : editingId ? "Update Template" : "Create Template"}</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* View Modal */}
            {viewTemplate && (
                <div style={{
                    position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000,
                    display: "flex", alignItems: "center", justifyContent: "center", padding: 20
                }}>
                    <div style={{
                        background: "#fff", borderRadius: 14, width: "100%", maxWidth: 600,
                        maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)"
                    }}>
                        <div style={{ background: "#2563eb", padding: "20px 24px", borderRadius: "14px 14px 0 0" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                <div>
                                    <h3 style={{ margin: 0, color: "#fff", fontSize: 18, fontWeight: 700 }}>{viewTemplate.template_name}</h3>
                                    <p style={{ margin: "4px 0 0", color: "#bfdbfe", fontSize: 13 }}>{viewTemplate.role} · {viewTemplate.department}</p>
                                </div>
                                <button onClick={() => setViewTemplate(null)} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 16 }}>✕</button>
                            </div>
                        </div>
                        <div style={{ padding: 24 }}>
                            {viewTemplate.description && <p style={{ color: "#6b7280", marginBottom: 20 }}>{viewTemplate.description}</p>}
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                                <thead>
                                    <tr style={{ background: "#f8fafc" }}>
                                        {["KPI Name", "Target", "Unit", "Weight", "Frequency"].map(h => (
                                            <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, color: "#374151", borderBottom: "2px solid #e5e7eb" }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {viewTemplate.kpi_items.map((item, i) => (
                                        <tr key={i} style={{ borderBottom: "1px solid #f3f4f6" }}>
                                            <td style={{ padding: "10px 12px", fontWeight: 500, color: "#1a1a2e" }}>{item.kpi_name}</td>
                                            <td style={{ padding: "10px 12px", color: "#374151" }}>{item.target}</td>
                                            <td style={{ padding: "10px 12px", color: "#374151" }}>{item.unit}</td>
                                            <td style={{ padding: "10px 12px" }}>
                                                <span style={{ background: "#eff6ff", color: "#2563eb", fontWeight: 700, padding: "3px 8px", borderRadius: 4, fontSize: 12 }}>{item.weight}%</span>
                                            </td>
                                            <td style={{ padding: "10px 12px", color: "#6b7280", textTransform: "capitalize" }}>{item.frequency}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div style={{ marginTop: 16, padding: "10px 12px", background: "#f0fdf4", borderRadius: 8, display: "flex", justifyContent: "space-between" }}>
                                <span style={{ fontWeight: 700, color: "#16a34a" }}>Total Weight</span>
                                <span style={{ fontWeight: 700, color: "#16a34a" }}>{viewTemplate.kpi_items.reduce((s, i) => s + i.weight, 0)}%</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirm */}
            {deleteConfirm && (
                <div style={{
                    position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000,
                    display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                    <div style={{ background: "#fff", borderRadius: 12, padding: 28, maxWidth: 360, width: "100%", textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
                        <div style={{ fontSize: 36, marginBottom: 12 }}>🗑️</div>
                        <h3 style={{ margin: "0 0 8px", color: "#1a1a2e" }}>Delete Template?</h3>
                        <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 20 }}>This action cannot be undone.</p>
                        <div style={{ display: "flex", gap: 12 }}>
                            <button onClick={() => setDeleteConfirm(null)} style={{
                                flex: 1, padding: "10px 0", border: "1px solid #e5e7eb", borderRadius: 8,
                                background: "#fff", fontWeight: 600, cursor: "pointer"
                            }}>Cancel</button>
                            <button onClick={() => handleDelete(deleteConfirm)} style={{
                                flex: 1, padding: "10px 0", border: "none", borderRadius: 8,
                                background: "#ef4444", color: "#fff", fontWeight: 700, cursor: "pointer"
                            }}>Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const labelStyle = { display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 5 };
const inputStyle = {
    width: "100%", padding: "9px 11px", border: "1px solid #d1d5db", borderRadius: 7,
    fontSize: 13, color: "#1a1a2e", background: "#fff", boxSizing: "border-box", outline: "none"
};