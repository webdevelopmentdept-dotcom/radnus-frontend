import React, { useState, useEffect } from "react";
import { Eye, Download } from "lucide-react";
import EmployeeLayout from "./EmployeeLayout";

// ── Static config ────────────────────────────────────────────────────────
const DOC_FIELDS = [
    { key: "aadharCard", label: "Aadhar Card" },
    { key: "passportPhoto", label: "Passport Photo" },
    { key: "signature", label: "Customer Signature" },
    { key: "study10th12th", label: "Study 10th / 12th" },
    { key: "community", label: "Community Certificate" },
    { key: "pancard", label: "Pancard" },
    { key: "rationCard", label: "Ration Card" },
    { key: "bankPassbook", label: "Bank Pass Book" },
    { key: "gasBill", label: "Gas Bill" },
    { key: "ebBill", label: "EB Bill" },
];

const CHECKLIST_STAGES = [
    { key: "cibilVerification", label: "CIBIL Verification" },
    { key: "documentCollection", label: "Document Collection" },
    { key: "applicationProcess", label: "Application Process" },
    { key: "quotation", label: "Quotation" },
    { key: "auditorReference", label: "Auditor Reference" },
    { key: "documentPayment", label: "Document Payment" },
    { key: "finalisationVerification", label: "Finalisation & Verification" },
    { key: "finalSubmission", label: "Final Submission" },
    { key: "courier", label: "Courier" },
    { key: "completed", label: "Completed" },
];

const SCHEME_OPTIONS = [
    { value: "PMEGP", label: "PMEGP - Prime Minister's Employment Generation Programme" },
    { value: "UYEGP", label: "UYEGP - Unemployed Youth Employment Generation Programme" },
    { value: "AABCS", label: "AABCS - Annal Ambedkar Business Champions Scheme" },
];

const BLANK_FORM = {
    customerName: "",
    communicationAddress: "",
    unitAddress: "",
    businessType: "",
    scheme: "",
    loanValue: "",
    contactNo: "",
    mailId: "",
    bankName: "",
    ifscCode: "",
};

export default function LoanProcess() {
    const API = import.meta.env.VITE_API_BASE_URL;
    const authHeaders = () => ({
        Authorization: `Bearer ${localStorage.getItem("employeeToken") || sessionStorage.getItem("employeeToken")}`,
    });

    const [tab, setTab] = useState("form"); // "form" | "checklist"
    const [form, setForm] = useState(BLANK_FORM);
    const [files, setFiles] = useState({}); // { aadharCard: File, ... }
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");
    const [fieldErrors, setFieldErrors] = useState({}); // { customerName: "message", ... }
    const [docErrors, setDocErrors] = useState({}); // { aadharCard: "message", ... }

    const [customers, setCustomers] = useState([]);
    const [loadingList, setLoadingList] = useState(false);
    const [expandedId, setExpandedId] = useState(null);
    const [reasonDraft, setReasonDraft] = useState({}); // { [customerId]: text }

    /* ------------------------ TAB 2 — CUSTOMER DATA (view/edit/delete) --- */
    const [expandedDataId, setExpandedDataId] = useState(null);
    const [editingId, setEditingId] = useState(null); // customerId currently in edit mode
    const [editForm, setEditForm] = useState(BLANK_FORM);
    const [editFiles, setEditFiles] = useState({}); // new files chosen to replace existing docs
    const [editFieldErrors, setEditFieldErrors] = useState({});
    const [editDocErrors, setEditDocErrors] = useState({});
    const [editSaving, setEditSaving] = useState(false);
    const [editError, setEditError] = useState("");
    const [deletingId, setDeletingId] = useState(null);
    const [rowMsg, setRowMsg] = useState({}); // { [customerId]: "Saved" | "Deleted" }
    const [isHead, setIsHead] = useState(false);
    const [allCustomers, setAllCustomers] = useState([]);
    const [loadingAll, setLoadingAll] = useState(false);
    const [expandedViewAllId, setExpandedViewAllId] = useState(null);


    /* ------------------------ LOAD CHECKLIST TAB ------------------------ */
    const loadCustomers = async () => {
        setLoadingList(true);
        try {
            const res = await fetch(`${API}/api/loan-process/all`, { headers: authHeaders() });
            const data = await res.json();
            if (data.success) setCustomers(data.data || []);
        } catch (err) {
            console.error("LOAD LOAN CUSTOMERS ERROR", err);
        } finally {
            setLoadingList(false);
        }
    };

    useEffect(() => {
        if (tab === "checklist" || tab === "data") loadCustomers();
        if (tab === "viewAll") loadAllCustomers();
    }, [tab]);

    // Check once on mount whether this employee is the Loan Process Head
    useEffect(() => {
        const empId = localStorage.getItem("employeeId");
        if (!empId) return;
        fetch(`${API}/api/employee/me/${empId}`)
            .then((r) => r.json())
            .then((data) => setIsHead(!!data?.isLoanProcessHead))
            .catch(() => { });
    }, []);

    const loadAllCustomers = async () => {
        setLoadingAll(true);
        try {
            const res = await fetch(`${API}/api/loan-process/all?viewAll=true`, { headers: authHeaders() });
            const data = await res.json();
            if (data.success) setAllCustomers(data.data || []);
        } catch (err) {
            console.error("LOAD ALL LOAN CUSTOMERS ERROR", err);
        } finally {
            setLoadingAll(false);
        }
    };

    /* ------------------------ TAB 1 — FORM ------------------------ */
    const handleChange = (e) => {
        const { name, value } = e.target;
        const nextValue = name === "ifscCode" ? value.toUpperCase() : value;
        setForm({ ...form, [name]: nextValue });
        // clear the error for this field as soon as the user edits it
        if (fieldErrors[name]) {
            setFieldErrors((prev) => {
                const next = { ...prev };
                delete next[name];
                return next;
            });
        }
    };

    const handleFile = (key, file) => {
        setFiles({ ...files, [key]: file });
        if (docErrors[key]) {
            setDocErrors((prev) => {
                const next = { ...prev };
                delete next[key];
                return next;
            });
        }
    };

    const resetForm = () => {
        setForm(BLANK_FORM);
        setFiles({});
        setFieldErrors({});
        setDocErrors({});
    };

    /* ------------------------ VALIDATION ------------------------ */
    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const IFSC_RE = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    const PHONE_RE = /^[6-9]\d{9}$/; // 10 digit Indian mobile number

    const downloadDoc = async (url, filename) => {
        try {
            const res = await fetch(url);
            const blob = await res.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = blobUrl;
            link.download = filename || "document";
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(blobUrl);
        } catch (err) {
            console.error("DOC DOWNLOAD ERROR", err);
            window.open(url, "_blank"); // fallback — at least let them see it
        }
    };

    const validateForm = () => {
        const fErrs = {};
        const dErrs = {};

        // ---- Customer Details: every field mandatory + format checks ----
        if (!form.customerName.trim()) {
            fErrs.customerName = "Customer Name is required.";
        }

        if (!form.contactNo.trim()) {
            fErrs.contactNo = "Contact No is required.";
        } else if (!PHONE_RE.test(form.contactNo.trim())) {
            fErrs.contactNo = "Enter a valid 10 digit mobile number.";
        }

        if (!form.mailId.trim()) {
            fErrs.mailId = "Mail ID is required.";
        } else if (!EMAIL_RE.test(form.mailId.trim())) {
            fErrs.mailId = "Enter a valid email address.";
        }

        if (!form.businessType.trim()) {
            fErrs.businessType = "Business Type is required.";
        }

        if (!form.scheme.trim()) {
            fErrs.scheme = "Scheme is required.";
        }

        if (!String(form.loanValue).trim()) {
            fErrs.loanValue = "Loan Value is required.";
        } else if (Number(form.loanValue) <= 0 || Number.isNaN(Number(form.loanValue))) {
            fErrs.loanValue = "Enter a valid loan amount.";
        }

        if (!form.bankName.trim()) {
            fErrs.bankName = "Bank Name is required.";
        }

        if (!form.ifscCode.trim()) {
            fErrs.ifscCode = "IFSC Code is required.";
        } else if (!IFSC_RE.test(form.ifscCode.trim())) {
            fErrs.ifscCode = "Enter a valid IFSC code (e.g. ABCD0123456).";
        }

        if (!form.communicationAddress.trim()) {
            fErrs.communicationAddress = "Communication Address is required.";
        }

        if (!form.unitAddress.trim()) {
            fErrs.unitAddress = "Unit Address is required.";
        }

        // ---- Govt Documents: every document upload mandatory ----
        DOC_FIELDS.forEach((doc) => {
            if (!files[doc.key]) {
                dErrs[doc.key] = `${doc.label} is required.`;
            }
        });

        return { fErrs, dErrs };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccessMsg("");

        const { fErrs, dErrs } = validateForm();
        setFieldErrors(fErrs);
        setDocErrors(dErrs);

        if (Object.keys(fErrs).length > 0 || Object.keys(dErrs).length > 0) {
            setError("Please fill all required fields and upload all documents correctly.");
            return;
        }

        setSaving(true);
        try {
            const fd = new FormData();
            Object.entries(form).forEach(([k, v]) => fd.append(k, v));
            Object.entries(files).forEach(([k, file]) => {
                if (file) fd.append(k, file);
            });

            const res = await fetch(`${API}/api/loan-process/create`, {
                method: "POST",
                headers: authHeaders(), // NOTE: don't set Content-Type — browser sets multipart boundary
                body: fd,
            });
            const data = await res.json();

            if (!data.success) {
                setError(data.message || "Something went wrong. Please try again.");
                setSaving(false);
                return;
            }

            setSuccessMsg(`${form.customerName} saved. Switching to Checklist…`);
            resetForm();
            setSaving(false);

            setTimeout(() => {
                setSuccessMsg("");
                setTab("checklist");
            }, 900);
        } catch (err) {
            console.error("LOAN CUSTOMER SUBMIT ERROR", err);
            setError("Server error. Please try again.");
            setSaving(false);
        }
    };

    /* ------------------------ TAB 2 — CHECKLIST ------------------------ */
    const toggleStage = async (customerId, field, currentValue) => {
        // optimistic update
        setCustomers((prev) =>
            prev.map((c) =>
                c._id === customerId ? { ...c, checklist: { ...c.checklist, [field]: !currentValue } } : c
            )
        );
        try {
            const res = await fetch(`${API}/api/loan-process/${customerId}/checklist`, {
                method: "PATCH",
                headers: { ...authHeaders(), "Content-Type": "application/json" },
                body: JSON.stringify({ field, value: !currentValue }),
            });
            const data = await res.json();
            if (data.success) {
                setCustomers((prev) => prev.map((c) => (c._id === customerId ? data.customer : c)));
            } else {
                loadCustomers(); // revert on failure
            }
        } catch (err) {
            console.error("CHECKLIST TOGGLE ERROR", err);
            loadCustomers();
        }
    };

    const saveReason = async (customerId) => {
        const current = customers.find((c) => c._id === customerId);
        const reasonForPending = reasonDraft[customerId] ?? current?.reasonForPending ?? "";
        try {
            // Reuse the "completed" field's current value so the PATCH doesn't
            // accidentally flip a checklist stage while only saving the reason text.
            const currentCompleted = !!current?.checklist?.completed;
            await fetch(`${API}/api/loan-process/${customerId}/checklist`, {
                method: "PATCH",
                headers: { ...authHeaders(), "Content-Type": "application/json" },
                body: JSON.stringify({ field: "completed", value: currentCompleted, reasonForPending }),
            });
        } catch (err) {
            console.error("REASON SAVE ERROR", err);
        }
    };

    /* ------------------------ TAB 2 — CUSTOMER DATA (edit/delete) ------- */
    const startEdit = (customer) => {
        setExpandedDataId(customer._id);
        setEditingId(customer._id);
        setEditForm({
            customerName: customer.customerName || "",
            communicationAddress: customer.communicationAddress || "",
            unitAddress: customer.unitAddress || "",
            businessType: customer.businessType || "",
            scheme: customer.scheme || "",
            loanValue: customer.loanValue ?? "",
            contactNo: customer.contactNo || "",
            mailId: customer.mailId || "",
            bankName: customer.bankName || "",
            ifscCode: customer.ifscCode || "",
        });
        setEditFiles({});
        setEditFieldErrors({});
        setEditDocErrors({});
        setEditError("");
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditForm(BLANK_FORM);
        setEditFiles({});
        setEditFieldErrors({});
        setEditDocErrors({});
        setEditError("");
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        const nextValue = name === "ifscCode" ? value.toUpperCase() : value;
        setEditForm((prev) => ({ ...prev, [name]: nextValue }));
        if (editFieldErrors[name]) {
            setEditFieldErrors((prev) => {
                const next = { ...prev };
                delete next[name];
                return next;
            });
        }
    };

    const handleEditFile = (key, file) => {
        setEditFiles((prev) => ({ ...prev, [key]: file }));
        if (editDocErrors[key]) {
            setEditDocErrors((prev) => {
                const next = { ...prev };
                delete next[key];
                return next;
            });
        }
    };

    const validateEditForm = (customer) => {
        const fErrs = {};
        const dErrs = {};

        if (!editForm.customerName.trim()) fErrs.customerName = "Customer Name is required.";

        if (!editForm.contactNo.trim()) {
            fErrs.contactNo = "Contact No is required.";
        } else if (!PHONE_RE.test(editForm.contactNo.trim())) {
            fErrs.contactNo = "Enter a valid 10 digit mobile number.";
        }

        if (!editForm.mailId.trim()) {
            fErrs.mailId = "Mail ID is required.";
        } else if (!EMAIL_RE.test(editForm.mailId.trim())) {
            fErrs.mailId = "Enter a valid email address.";
        }

        if (!editForm.businessType.trim()) fErrs.businessType = "Business Type is required.";

        if (!editForm.scheme.trim()) fErrs.scheme = "Scheme is required.";

        if (!String(editForm.loanValue).trim()) {
            fErrs.loanValue = "Loan Value is required.";
        } else if (Number(editForm.loanValue) <= 0 || Number.isNaN(Number(editForm.loanValue))) {
            fErrs.loanValue = "Enter a valid loan amount.";
        }

        if (!editForm.bankName.trim()) fErrs.bankName = "Bank Name is required.";

        if (!editForm.ifscCode.trim()) {
            fErrs.ifscCode = "IFSC Code is required.";
        } else if (!IFSC_RE.test(editForm.ifscCode.trim())) {
            fErrs.ifscCode = "Enter a valid IFSC code (e.g. ABCD0123456).";
        }

        if (!editForm.communicationAddress.trim()) fErrs.communicationAddress = "Communication Address is required.";
        if (!editForm.unitAddress.trim()) fErrs.unitAddress = "Unit Address is required.";

        // A document is "missing" only if there's no existing uploaded doc AND no new file chosen now
        DOC_FIELDS.forEach((doc) => {
            const alreadyUploaded = !!customer?.documents?.[doc.key]?.url;
            if (!alreadyUploaded && !editFiles[doc.key]) {
                dErrs[doc.key] = `${doc.label} is required.`;
            }
        });

        return { fErrs, dErrs };
    };

    const saveEdit = async (customer) => {
        const { fErrs, dErrs } = validateEditForm(customer);
        setEditFieldErrors(fErrs);
        setEditDocErrors(dErrs);
        if (Object.keys(fErrs).length > 0 || Object.keys(dErrs).length > 0) {
            setEditError("Please fill all required fields correctly.");
            return;
        }

        setEditSaving(true);
        setEditError("");
        try {
            // 1) Save basic details
            const res = await fetch(`${API}/api/loan-process/${customer._id}`, {
                method: "PUT",
                headers: { ...authHeaders(), "Content-Type": "application/json" },
                body: JSON.stringify(editForm),
            });
            const data = await res.json();
            if (!data.success) {
                setEditError(data.message || "Failed to save changes.");
                setEditSaving(false);
                return;
            }
            let updatedCustomer = data.customer;

            // 2) If any documents were replaced, upload them
            const changedDocKeys = Object.keys(editFiles).filter((k) => editFiles[k]);
            if (changedDocKeys.length > 0) {
                const fd = new FormData();
                changedDocKeys.forEach((k) => fd.append(k, editFiles[k]));
                const docRes = await fetch(`${API}/api/loan-process/${customer._id}/documents`, {
                    method: "PATCH",
                    headers: authHeaders(),
                    body: fd,
                });
                const docData = await docRes.json();
                if (docData.success) updatedCustomer = docData.customer;
            }

            setCustomers((prev) => prev.map((c) => (c._id === customer._id ? updatedCustomer : c)));
            setRowMsg((prev) => ({ ...prev, [customer._id]: "Saved successfully." }));
            setTimeout(() => setRowMsg((prev) => ({ ...prev, [customer._id]: "" })), 2500);
            cancelEdit();
        } catch (err) {
            console.error("CUSTOMER EDIT SAVE ERROR", err);
            setEditError("Server error. Please try again.");
        } finally {
            setEditSaving(false);
        }
    };

    const deleteCustomer = async (customerId) => {
        if (!window.confirm("Delete this customer record permanently? This cannot be undone.")) return;
        setDeletingId(customerId);
        try {
            const res = await fetch(`${API}/api/loan-process/${customerId}`, {
                method: "DELETE",
                headers: authHeaders(),
            });
            const data = await res.json();
            if (data.success) {
                setCustomers((prev) => prev.filter((c) => c._id !== customerId));
                if (expandedDataId === customerId) setExpandedDataId(null);
                if (editingId === customerId) cancelEdit();
            } else {
                alert(data.message || "Failed to delete customer.");
            }
        } catch (err) {
            console.error("CUSTOMER DELETE ERROR", err);
            alert("Server error. Please try again.");
        } finally {
            setDeletingId(null);
        }
    };

    /* ------------------------ RENDER ------------------------ */
    return (
        <EmployeeLayout>
            <div className="lp-root container-fluid px-4 py-4">
                <style>{`
          .lp-root {
            --lp-bg: #F6F7FB;
            --lp-surface: #FFFFFF;
            --lp-border: #E4E7EE;
            --lp-text: #101828;
            --lp-text-muted: #64748B;
            --lp-primary: #2A3EB1;
            --lp-primary-dark: #212F8B;
            --lp-primary-soft: #EEF1FD;
            --lp-accent: #0F9D80;
            --lp-accent-soft: #E7F7F2;
            --lp-danger: #D8434B;
            --lp-danger-soft: #FDEEEE;
            --lp-radius-lg: 16px;
            --lp-radius-md: 12px;
            --lp-radius-sm: 8px;
            --lp-shadow-sm: 0 1px 2px rgba(16, 24, 40, 0.06);
            --lp-shadow-md: 0 8px 24px rgba(16, 24, 40, 0.08);
            background: var(--lp-bg);
            min-height: 100vh;
            font-family: "Inter", "Segoe UI", system-ui, -apple-system, sans-serif;
            color: var(--lp-text);
          }
          .lp-tabs { display: flex; gap: 8px; margin-bottom: 24px; border-bottom: 1px solid var(--lp-border); }
          .lp-tab-btn {
            padding: 12px 20px; border: none; background: none; cursor: pointer;
            font-weight: 600; font-size: 14px; color: var(--lp-text-muted);
            border-bottom: 2px solid transparent; margin-bottom: -1px;
          }
          .lp-tab-btn.active { color: var(--lp-primary); border-bottom-color: var(--lp-primary); }
          .lp-card {
            background: var(--lp-surface); border: 1px solid var(--lp-border);
            border-radius: var(--lp-radius-lg); box-shadow: var(--lp-shadow-sm);
            padding: 24px; margin-bottom: 20px;
          }
          .lp-section-title { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: var(--lp-text-muted); margin-bottom: 14px; }
          .lp-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; }
          .lp-field label { font-size: 13px; font-weight: 600; margin-bottom: 6px; display: block; }
         .lp-field input, .lp-field select {
  width: 100%; padding: 10px 12px; border: 1px solid var(--lp-border);
  border-radius: var(--lp-radius-sm); font-size: 14px; background: var(--lp-bg);
}
.lp-field input:focus, .lp-field select:focus { outline: none; border-color: var(--lp-primary); background: var(--lp-surface); }
.lp-field input.lp-input-invalid, .lp-field select.lp-input-invalid { border-color: var(--lp-danger); background: var(--lp-danger-soft); }
          .lp-field-error { color: var(--lp-danger); font-size: 12px; margin-top: 4px; }
          .lp-doc-box.invalid { border-color: var(--lp-danger); background: var(--lp-danger-soft); border-style: solid; }
          .lp-doc-error { color: var(--lp-danger); font-size: 11px; margin-top: 2px; font-weight: 600; }
          .lp-row-actions { display: flex; gap: 8px; }
          .lp-btn-sm {
            padding: 6px 14px; border-radius: var(--lp-radius-sm); font-size: 12px; font-weight: 600;
            cursor: pointer; border: 1px solid var(--lp-border); background: var(--lp-surface);
          }
          .lp-btn-sm.edit { color: var(--lp-primary); border-color: var(--lp-primary); }
          .lp-btn-sm.edit:hover { background: var(--lp-primary-soft); }
          .lp-btn-sm.delete { color: var(--lp-danger); border-color: var(--lp-danger); }
          .lp-btn-sm.delete:hover { background: var(--lp-danger-soft); }
          .lp-btn-sm:disabled { opacity: 0.5; cursor: not-allowed; }
          .lp-view-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px 20px; }
          .lp-view-item .lp-view-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.03em; color: var(--lp-text-muted); font-weight: 700; margin-bottom: 3px; }
          .lp-view-item .lp-view-value { font-size: 14px; color: var(--lp-text); }
          .lp-view-doc-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-top: 10px; }
          @media (max-width: 1200px) { .lp-view-doc-grid { grid-template-columns: repeat(4, 1fr); } }
          @media (max-width: 992px) { .lp-view-doc-grid { grid-template-columns: repeat(3, 1fr); } }
          @media (max-width: 700px) { .lp-view-doc-grid { grid-template-columns: repeat(2, 1fr); } }
          @media (max-width: 460px) { .lp-view-doc-grid { grid-template-columns: 1fr; } }
          .lp-view-doc { border: 1px solid var(--lp-border); border-radius: var(--lp-radius-sm); padding: 12px 14px; font-size: 12px; background: var(--lp-surface); }
          .lp-view-doc a { color: var(--lp-primary); font-weight: 600; text-decoration: none; }
          .lp-view-doc a:hover { text-decoration: underline; }
          .lp-view-doc.missing { color: var(--lp-danger); border-color: var(--lp-danger-soft); background: var(--lp-danger-soft); }
          .lp-doc-icon-row { display: flex; gap: 8px; }
          .lp-icon-btn {
            display: flex; align-items: center; justify-content: center; padding: 7px;
            border: 1px solid var(--lp-border); border-radius: var(--lp-radius-sm);
            background: var(--lp-bg); color: var(--lp-primary); cursor: pointer; transition: 0.15s;
          }
          .lp-icon-btn:hover { background: var(--lp-primary-soft); border-color: var(--lp-primary); }
          .lp-icon-btn svg { flex-shrink: 0; }
          .lp-row-msg { font-size: 12px; color: var(--lp-accent); font-weight: 600; margin-top: 4px; }
          .lp-doc-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
          @media (max-width: 1200px) { .lp-doc-grid { grid-template-columns: repeat(3, 1fr); } }
          @media (max-width: 992px) { .lp-doc-grid { grid-template-columns: repeat(2, 1fr); } }
          @media (max-width: 460px) { .lp-doc-grid { grid-template-columns: 1fr; } }
          .lp-doc-box {
            border: 1.5px dashed var(--lp-border); border-radius: var(--lp-radius-sm);
            padding: 14px; text-align: center; cursor: pointer; transition: 0.15s;
            background: var(--lp-bg); display: block;
          }
          .lp-doc-box:hover { border-color: var(--lp-primary); background: var(--lp-primary-soft); }
          .lp-doc-box.filled { border-style: solid; border-color: var(--lp-accent); background: var(--lp-accent-soft); }
          .lp-doc-label { font-size: 13px; font-weight: 600; margin-bottom: 4px; }
          .lp-doc-status { font-size: 12px; color: var(--lp-text-muted); }
          .lp-doc-box.filled .lp-doc-status { color: var(--lp-accent); font-weight: 600; }
          .lp-btn-primary {
            background: var(--lp-primary); color: #fff; border: none; padding: 12px 28px;
            border-radius: var(--lp-radius-sm); font-weight: 600; font-size: 14px; cursor: pointer;
          }
          .lp-btn-primary:hover { background: var(--lp-primary-dark); }
          .lp-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
          .lp-alert-error { background: var(--lp-danger-soft); color: var(--lp-danger); padding: 10px 14px; border-radius: var(--lp-radius-sm); font-size: 13px; margin-bottom: 16px; }
          .lp-alert-success { background: var(--lp-accent-soft); color: var(--lp-accent); padding: 10px 14px; border-radius: var(--lp-radius-sm); font-size: 13px; margin-bottom: 16px; }
          .lp-cust-card { border: 1px solid var(--lp-border); border-radius: var(--lp-radius-md); margin-bottom: 14px; overflow: hidden; }
          .lp-cust-head { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; cursor: pointer; background: var(--lp-surface); }
          .lp-cust-head:hover { background: var(--lp-bg); }
          .lp-progress-bar { height: 6px; background: var(--lp-border); border-radius: 4px; overflow: hidden; width: 140px; }
          .lp-progress-fill { height: 100%; background: var(--lp-accent); transition: width 0.3s; }
          .lp-checklist-body { padding: 16px 20px; border-top: 1px solid var(--lp-border); background: var(--lp-bg); }
          .lp-stage-row { display: flex; align-items: center; gap: 10px; padding: 8px 0; font-size: 14px; cursor: pointer; }
          .lp-stage-row input[type="checkbox"] { width: 18px; height: 18px; cursor: pointer; accent-color: var(--lp-accent); }
          .lp-badge { font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 20px; }
          .lp-badge.done { background: var(--lp-accent-soft); color: var(--lp-accent); }
          .lp-badge.progress { background: var(--lp-primary-soft); color: var(--lp-primary); }
        `}</style>

                <h4 style={{ fontWeight: 700, marginBottom: 4 }}>Loan Process</h4>
                <p style={{ color: "var(--lp-text-muted)", fontSize: 14, marginBottom: 24 }}>
                    Add customer details and documents, then track the process through checklist.
                </p>

                <div className="lp-tabs">
                    <button className={`lp-tab-btn ${tab === "form" ? "active" : ""}`} onClick={() => setTab("form")}>
                        Customer Details
                    </button>
                    <button className={`lp-tab-btn ${tab === "data" ? "active" : ""}`} onClick={() => setTab("data")}>
                        Customer Data {customers.length > 0 && `(${customers.length})`}
                    </button>
                    <button className={`lp-tab-btn ${tab === "checklist" ? "active" : ""}`} onClick={() => setTab("checklist")}>
                        Checklist {customers.length > 0 && `(${customers.length})`}
                    </button>
                    {isHead && (
                        <button className={`lp-tab-btn ${tab === "viewAll" ? "active" : ""}`} onClick={() => setTab("viewAll")}>
                            View Details
                        </button>
                    )}
                </div>

                {/* ══════════════ TAB 1 — CUSTOMER FORM ══════════════ */}
                {tab === "form" && (
                    <form onSubmit={handleSubmit}>
                        {error && <div className="lp-alert-error">{error}</div>}
                        {successMsg && <div className="lp-alert-success">{successMsg}</div>}

                        <div className="lp-card">
                            <div className="lp-section-title">Customer Basic Details</div>
                            <div className="lp-grid">
                                <div className="lp-field">
                                    <label>Customer Name *</label>
                                    <input
                                        name="customerName"
                                        value={form.customerName}
                                        onChange={handleChange}
                                        required
                                        className={fieldErrors.customerName ? "lp-input-invalid" : ""}
                                    />
                                    {fieldErrors.customerName && <div className="lp-field-error">{fieldErrors.customerName}</div>}
                                </div>
                                <div className="lp-field">
                                    <label>Contact No *</label>
                                    <input
                                        name="contactNo"
                                        value={form.contactNo}
                                        onChange={handleChange}
                                        required
                                        maxLength={10}
                                        inputMode="numeric"
                                        className={fieldErrors.contactNo ? "lp-input-invalid" : ""}
                                    />
                                    {fieldErrors.contactNo && <div className="lp-field-error">{fieldErrors.contactNo}</div>}
                                </div>
                                <div className="lp-field">
                                    <label>Mail ID *</label>
                                    <input
                                        name="mailId"
                                        type="email"
                                        value={form.mailId}
                                        onChange={handleChange}
                                        required
                                        className={fieldErrors.mailId ? "lp-input-invalid" : ""}
                                    />
                                    {fieldErrors.mailId && <div className="lp-field-error">{fieldErrors.mailId}</div>}
                                </div>
                                <div className="lp-field">
                                    <label>Business Type *</label>
                                    <input
                                        name="businessType"
                                        value={form.businessType}
                                        onChange={handleChange}
                                        required
                                        className={fieldErrors.businessType ? "lp-input-invalid" : ""}
                                    />
                                    {fieldErrors.businessType && <div className="lp-field-error">{fieldErrors.businessType}</div>}
                                </div>

                                <div className="lp-field">
                                    <label>Scheme *</label>
                                    <select
                                        name="scheme"
                                        value={form.scheme}
                                        onChange={handleChange}
                                        required
                                        className={fieldErrors.scheme ? "lp-input-invalid" : ""}
                                    >
                                        <option value="">Select Scheme</option>
                                        {SCHEME_OPTIONS.map((opt) => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                    {fieldErrors.scheme && <div className="lp-field-error">{fieldErrors.scheme}</div>}
                                </div>

                                <div className="lp-field">
                                    <label>Loan Value *</label>
                                    <input
                                        name="loanValue"
                                        type="number"
                                        value={form.loanValue}
                                        onChange={handleChange}
                                        required
                                        min="1"
                                        className={fieldErrors.loanValue ? "lp-input-invalid" : ""}
                                    />
                                    {fieldErrors.loanValue && <div className="lp-field-error">{fieldErrors.loanValue}</div>}
                                </div>
                                <div className="lp-field">
                                    <label>Bank Name *</label>
                                    <input
                                        name="bankName"
                                        value={form.bankName}
                                        onChange={handleChange}
                                        required
                                        className={fieldErrors.bankName ? "lp-input-invalid" : ""}
                                    />
                                    {fieldErrors.bankName && <div className="lp-field-error">{fieldErrors.bankName}</div>}
                                </div>
                                <div className="lp-field">
                                    <label>IFSC Code *</label>
                                    <input
                                        name="ifscCode"
                                        value={form.ifscCode}
                                        onChange={handleChange}
                                        required
                                        maxLength={11}
                                        style={{ textTransform: "uppercase" }}
                                        className={fieldErrors.ifscCode ? "lp-input-invalid" : ""}
                                    />
                                    {fieldErrors.ifscCode && <div className="lp-field-error">{fieldErrors.ifscCode}</div>}
                                </div>
                                <div className="lp-field" style={{ gridColumn: "span 2" }}>
                                    <label>Communication Address *</label>
                                    <input
                                        name="communicationAddress"
                                        value={form.communicationAddress}
                                        onChange={handleChange}
                                        required
                                        className={fieldErrors.communicationAddress ? "lp-input-invalid" : ""}
                                    />
                                    {fieldErrors.communicationAddress && (
                                        <div className="lp-field-error">{fieldErrors.communicationAddress}</div>
                                    )}
                                </div>
                                <div className="lp-field" style={{ gridColumn: "span 2" }}>
                                    <label>Unit Address *</label>
                                    <input
                                        name="unitAddress"
                                        value={form.unitAddress}
                                        onChange={handleChange}
                                        required
                                        className={fieldErrors.unitAddress ? "lp-input-invalid" : ""}
                                    />
                                    {fieldErrors.unitAddress && <div className="lp-field-error">{fieldErrors.unitAddress}</div>}
                                </div>
                            </div>
                        </div>

                        <div className="lp-card">
                            <div className="lp-section-title">Govt Documents</div>
                            <div className="lp-doc-grid">
                                {DOC_FIELDS.map((doc) => (
                                    <div key={doc.key}>
                                        <label
                                            className={`lp-doc-box ${files[doc.key] ? "filled" : ""} ${docErrors[doc.key] ? "invalid" : ""
                                                }`}
                                        >
                                            <div className="lp-doc-label">{doc.label} *</div>
                                            <div className="lp-doc-status">
                                                {files[doc.key] ? `✅ ${files[doc.key].name}` : "Click to upload"}
                                            </div>
                                            <input
                                                type="file"
                                                accept="image/*,application/pdf"
                                                style={{ display: "none" }}
                                                onChange={(e) => handleFile(doc.key, e.target.files[0])}
                                            />
                                        </label>
                                        {docErrors[doc.key] && <div className="lp-doc-error">{docErrors[doc.key]}</div>}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button type="submit" className="lp-btn-primary" disabled={saving}>
                            {saving ? "Saving…" : "Submit"}
                        </button>
                    </form>
                )}

                {/* ══════════════ TAB 2 — CUSTOMER DATA (view / edit / delete) ══════════════ */}
                {tab === "data" && (
                    <div className="lp-card">
                        {loadingList && <p style={{ color: "var(--lp-text-muted)" }}>Loading…</p>}
                        {!loadingList && customers.length === 0 && (
                            <p style={{ color: "var(--lp-text-muted)" }}>
                                No customers yet. Add one from the "Customer Details" tab.
                            </p>
                        )}

                        {customers.map((c) => {
                            const isOpen = expandedDataId === c._id;
                            const isEditing = editingId === c._id;

                            return (
                                <div className="lp-cust-card" key={c._id}>
                                    <div
                                        className="lp-cust-head"
                                        onClick={() => {
                                            if (isEditing) return; // don't collapse while editing
                                            setExpandedDataId(isOpen ? null : c._id);
                                        }}
                                    >
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: 15 }}>{c.customerName}</div>
                                            <div style={{ fontSize: 12, color: "var(--lp-text-muted)" }}>
                                                {c.contactNo} {c.businessType && `· ${c.businessType}`}
                                            </div>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                            <div className="lp-row-actions" onClick={(e) => e.stopPropagation()}>
                                                {!isEditing && (
                                                    <button type="button" className="lp-btn-sm edit" onClick={() => startEdit(c)}>
                                                        Edit
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    className="lp-btn-sm delete"
                                                    disabled={deletingId === c._id}
                                                    onClick={() => deleteCustomer(c._id)}
                                                >
                                                    {deletingId === c._id ? "Deleting…" : "Delete"}
                                                </button>
                                            </div>
                                            <span style={{ fontSize: 18, color: "var(--lp-text-muted)" }}>{isOpen ? "▲" : "▼"}</span>
                                        </div>
                                    </div>

                                    {isOpen && !isEditing && (
                                        <div className="lp-checklist-body">
                                            <div className="lp-view-grid">
                                                <div className="lp-view-item">
                                                    <div className="lp-view-label">Mail ID</div>
                                                    <div className="lp-view-value">{c.mailId || "—"}</div>
                                                </div>
                                                <div className="lp-view-item">
                                                    <div className="lp-view-label">Scheme</div>
                                                    <div className="lp-view-value">{c.scheme || "—"}</div>
                                                </div>
                                                <div className="lp-view-item">
                                                    <div className="lp-view-label">Loan Value</div>
                                                    <div className="lp-view-value">{c.loanValue || "—"}</div>
                                                </div>
                                                <div className="lp-view-item">
                                                    <div className="lp-view-label">Bank Name</div>
                                                    <div className="lp-view-value">{c.bankName || "—"}</div>
                                                </div>
                                                <div className="lp-view-item">
                                                    <div className="lp-view-label">IFSC Code</div>
                                                    <div className="lp-view-value">{c.ifscCode || "—"}</div>
                                                </div>
                                                <div className="lp-view-item" style={{ gridColumn: "span 2" }}>
                                                    <div className="lp-view-label">Communication Address</div>
                                                    <div className="lp-view-value">{c.communicationAddress || "—"}</div>
                                                </div>
                                                <div className="lp-view-item" style={{ gridColumn: "span 2" }}>
                                                    <div className="lp-view-label">Unit Address</div>
                                                    <div className="lp-view-value">{c.unitAddress || "—"}</div>
                                                </div>
                                            </div>

                                            <div style={{ marginTop: 16 }}>
                                                <div className="lp-section-title">Govt Documents</div>
                                                <div className="lp-view-doc-grid">
                                                    {DOC_FIELDS.map((doc) => {
                                                        const uploaded = c.documents?.[doc.key]?.url;
                                                        return (
                                                            <div className={`lp-view-doc ${uploaded ? "" : "missing"}`} key={doc.key}>
                                                                <div style={{ fontWeight: 600, marginBottom: 6 }}>{doc.label}</div>
                                                                {uploaded ? (
                                                                    <div className="lp-doc-icon-row">
                                                                        <button
                                                                            type="button"
                                                                            className="lp-icon-btn"
                                                                            title="View"
                                                                            onClick={() => window.open(uploaded, "_blank", "noopener,noreferrer")}
                                                                        >
                                                                            <Eye size={16} />
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            className="lp-icon-btn"
                                                                            title="Download"
                                                                            onClick={() => downloadDoc(uploaded, `${c.customerName}_${doc.label}`)}
                                                                        >
                                                                            <Download size={16} />
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    "Not uploaded"
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {rowMsg[c._id] && <div className="lp-row-msg">{rowMsg[c._id]}</div>}
                                        </div>
                                    )}

                                    {isOpen && isEditing && (
                                        <div className="lp-checklist-body">
                                            {editError && <div className="lp-alert-error">{editError}</div>}

                                            <div className="lp-section-title">Customer Basic Details</div>
                                            <div className="lp-grid" style={{ marginBottom: 20 }}>
                                                <div className="lp-field">
                                                    <label>Customer Name *</label>
                                                    <input
                                                        name="customerName"
                                                        value={editForm.customerName}
                                                        onChange={handleEditChange}
                                                        className={editFieldErrors.customerName ? "lp-input-invalid" : ""}
                                                    />
                                                    {editFieldErrors.customerName && (
                                                        <div className="lp-field-error">{editFieldErrors.customerName}</div>
                                                    )}
                                                </div>
                                                <div className="lp-field">
                                                    <label>Contact No *</label>
                                                    <input
                                                        name="contactNo"
                                                        value={editForm.contactNo}
                                                        onChange={handleEditChange}
                                                        maxLength={10}
                                                        inputMode="numeric"
                                                        className={editFieldErrors.contactNo ? "lp-input-invalid" : ""}
                                                    />
                                                    {editFieldErrors.contactNo && (
                                                        <div className="lp-field-error">{editFieldErrors.contactNo}</div>
                                                    )}
                                                </div>
                                                <div className="lp-field">
                                                    <label>Mail ID *</label>
                                                    <input
                                                        name="mailId"
                                                        type="email"
                                                        value={editForm.mailId}
                                                        onChange={handleEditChange}
                                                        className={editFieldErrors.mailId ? "lp-input-invalid" : ""}
                                                    />
                                                    {editFieldErrors.mailId && <div className="lp-field-error">{editFieldErrors.mailId}</div>}
                                                </div>
                                                <div className="lp-field">
                                                    <label>Business Type *</label>
                                                    <input
                                                        name="businessType"
                                                        value={editForm.businessType}
                                                        onChange={handleEditChange}
                                                        className={editFieldErrors.businessType ? "lp-input-invalid" : ""}
                                                    />
                                                    {editFieldErrors.businessType && (
                                                        <div className="lp-field-error">{editFieldErrors.businessType}</div>
                                                    )}
                                                </div>
                                                <div className="lp-field">
                                                    <label>Loan Value *</label>
                                                    <input
                                                        name="loanValue"
                                                        type="number"
                                                        value={editForm.loanValue}
                                                        onChange={handleEditChange}
                                                        min="1"
                                                        className={editFieldErrors.loanValue ? "lp-input-invalid" : ""}
                                                    />
                                                    {editFieldErrors.loanValue && (
                                                        <div className="lp-field-error">{editFieldErrors.loanValue}</div>
                                                    )}
                                                </div>
                                                <div className="lp-field">
                                                    <label>Bank Name *</label>
                                                    <input
                                                        name="bankName"
                                                        value={editForm.bankName}
                                                        onChange={handleEditChange}
                                                        className={editFieldErrors.bankName ? "lp-input-invalid" : ""}
                                                    />
                                                    {editFieldErrors.bankName && (
                                                        <div className="lp-field-error">{editFieldErrors.bankName}</div>
                                                    )}
                                                </div>
                                                <div className="lp-field">
                                                    <label>IFSC Code *</label>
                                                    <input
                                                        name="ifscCode"
                                                        value={editForm.ifscCode}
                                                        onChange={handleEditChange}
                                                        maxLength={11}
                                                        style={{ textTransform: "uppercase" }}
                                                        className={editFieldErrors.ifscCode ? "lp-input-invalid" : ""}
                                                    />
                                                    {editFieldErrors.ifscCode && (
                                                        <div className="lp-field-error">{editFieldErrors.ifscCode}</div>
                                                    )}
                                                </div>
                                                <div className="lp-field" style={{ gridColumn: "span 2" }}>
                                                    <label>Communication Address *</label>
                                                    <input
                                                        name="communicationAddress"
                                                        value={editForm.communicationAddress}
                                                        onChange={handleEditChange}
                                                        className={editFieldErrors.communicationAddress ? "lp-input-invalid" : ""}
                                                    />
                                                    {editFieldErrors.communicationAddress && (
                                                        <div className="lp-field-error">{editFieldErrors.communicationAddress}</div>
                                                    )}
                                                </div>
                                                <div className="lp-field" style={{ gridColumn: "span 2" }}>
                                                    <label>Unit Address *</label>
                                                    <input
                                                        name="unitAddress"
                                                        value={editForm.unitAddress}
                                                        onChange={handleEditChange}
                                                        className={editFieldErrors.unitAddress ? "lp-input-invalid" : ""}
                                                    />
                                                    {editFieldErrors.unitAddress && (
                                                        <div className="lp-field-error">{editFieldErrors.unitAddress}</div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="lp-section-title">
                                                Govt Documents{" "}
                                                <span style={{ textTransform: "none", fontWeight: 400 }}>
                                                    (click a box to replace that document)
                                                </span>
                                            </div>
                                            <div className="lp-doc-grid">
                                                {DOC_FIELDS.map((doc) => {
                                                    const uploaded = c.documents?.[doc.key]?.url;
                                                    const newFile = editFiles[doc.key];
                                                    return (
                                                        <div key={doc.key}>
                                                            <label
                                                                className={`lp-doc-box ${uploaded || newFile ? "filled" : ""} ${editDocErrors[doc.key] ? "invalid" : ""
                                                                    }`}
                                                            >
                                                                <div className="lp-doc-label">{doc.label} *</div>
                                                                <div className="lp-doc-status">
                                                                    {newFile
                                                                        ? `✅ New: ${newFile.name}`
                                                                        : uploaded
                                                                            ? "✅ Uploaded — click to replace"
                                                                            : "Click to upload"}
                                                                </div>
                                                                <input
                                                                    type="file"
                                                                    accept="image/*,application/pdf"
                                                                    style={{ display: "none" }}
                                                                    onChange={(e) => handleEditFile(doc.key, e.target.files[0])}
                                                                />
                                                            </label>
                                                            {editDocErrors[doc.key] && (
                                                                <div className="lp-doc-error">{editDocErrors[doc.key]}</div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                                                <button
                                                    type="button"
                                                    className="lp-btn-primary"
                                                    disabled={editSaving}
                                                    onClick={() => saveEdit(c)}
                                                >
                                                    {editSaving ? "Saving…" : "Save Changes"}
                                                </button>
                                                <button
                                                    type="button"
                                                    className="lp-btn-sm"
                                                    style={{ padding: "12px 20px" }}
                                                    disabled={editSaving}
                                                    onClick={cancelEdit}
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* ══════════════ TAB 3 — CHECKLIST ══════════════ */}
                {tab === "checklist" && (
                    <div className="lp-card">
                        {loadingList && <p style={{ color: "var(--lp-text-muted)" }}>Loading…</p>}
                        {!loadingList && customers.length === 0 && (
                            <p style={{ color: "var(--lp-text-muted)" }}>
                                No customers yet. Add one from the "Customer Details" tab.
                            </p>
                        )}

                        {customers.map((c) => {
                            const total = CHECKLIST_STAGES.length;
                            const doneCount = Object.values(c.checklist || {}).filter(Boolean).length;
                            const pct = c.processPercent ?? Math.round((doneCount / total) * 100);
                            const isOpen = expandedId === c._id;

                            return (
                                <div className="lp-cust-card" key={c._id}>
                                    <div className="lp-cust-head" onClick={() => setExpandedId(isOpen ? null : c._id)}>
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: 15 }}>{c.customerName}</div>
                                            <div style={{ fontSize: 12, color: "var(--lp-text-muted)" }}>{c.contactNo}</div>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                                            <span className={`lp-badge ${c.status === "COMPLETED" ? "done" : "progress"}`}>
                                                {c.status === "COMPLETED" ? "Completed" : `${pct}%`}
                                            </span>
                                            <div className="lp-progress-bar">
                                                <div className="lp-progress-fill" style={{ width: `${pct}%` }} />
                                            </div>
                                            <span style={{ fontSize: 18, color: "var(--lp-text-muted)" }}>{isOpen ? "▲" : "▼"}</span>
                                        </div>
                                    </div>

                                    {isOpen && (
                                        <div className="lp-checklist-body">
                                            {CHECKLIST_STAGES.map((stage) => (
                                                <label className="lp-stage-row" key={stage.key}>
                                                    <input
                                                        type="checkbox"
                                                        checked={!!c.checklist?.[stage.key]}
                                                        onChange={() => toggleStage(c._id, stage.key, c.checklist?.[stage.key])}
                                                    />
                                                    {stage.label}
                                                </label>
                                            ))}

                                            <div style={{ marginTop: 12 }}>
                                                <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>
                                                    Reason for Pending
                                                </label>
                                                <input
                                                    defaultValue={c.reasonForPending || ""}
                                                    onChange={(e) => setReasonDraft({ ...reasonDraft, [c._id]: e.target.value })}
                                                    onBlur={() => saveReason(c._id)}
                                                    style={{
                                                        width: "100%", padding: "8px 12px", border: "1px solid var(--lp-border)",
                                                        borderRadius: "8px", fontSize: 13, background: "var(--lp-surface)",
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* ══════════════ TAB 4 — VIEW DETAILS (Head only, all staff) ══════════════ */}
                {tab === "viewAll" && (
                    <div className="lp-card">
                        {loadingAll && <p style={{ color: "var(--lp-text-muted)" }}>Loading…</p>}
                        {!loadingAll && allCustomers.length === 0 && (
                            <p style={{ color: "var(--lp-text-muted)" }}>No customer records found.</p>
                        )}

                        {allCustomers.map((c) => {
                            const total = CHECKLIST_STAGES.length;
                            const doneCount = Object.values(c.checklist || {}).filter(Boolean).length;
                            const pct = c.processPercent ?? Math.round((doneCount / total) * 100);
                            const isOpen = expandedViewAllId === c._id;
                            const staffLabel = c.staffId?.name || c.staffName || "Unknown";

                            return (
                                <div className="lp-cust-card" key={c._id}>
                                    <div
                                        className="lp-cust-head"
                                        onClick={() => setExpandedViewAllId(isOpen ? null : c._id)}
                                    >
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: 15 }}>{c.customerName}</div>
                                            <div style={{ fontSize: 12, color: "var(--lp-text-muted)" }}>
                                                {c.contactNo} · {staffLabel}
                                            </div>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                                            <span className={`lp-badge ${c.status === "COMPLETED" ? "done" : "progress"}`}>
                                                {c.status === "COMPLETED" ? "Completed" : `${pct}%`}
                                            </span>
                                            <div className="lp-progress-bar">
                                                <div className="lp-progress-fill" style={{ width: `${pct}%` }} />
                                            </div>
                                            <span style={{ fontSize: 18, color: "var(--lp-text-muted)" }}>{isOpen ? "▲" : "▼"}</span>
                                        </div>
                                    </div>

                                    {isOpen && (
                                        <div className="lp-checklist-body">
                                            <div className="lp-view-grid">
                                                <div className="lp-view-item">
                                                    <div className="lp-view-label">Mail ID</div>
                                                    <div className="lp-view-value">{c.mailId || "—"}</div>
                                                </div>
                                                <div className="lp-view-item">
                                                    <div className="lp-view-label">Loan Value</div>
                                                    <div className="lp-view-value">{c.loanValue || "—"}</div>
                                                </div>
                                                <div className="lp-view-item">
                                                    <div className="lp-view-label">Bank Name</div>
                                                    <div className="lp-view-value">{c.bankName || "—"}</div>
                                                </div>
                                                <div className="lp-view-item">
                                                    <div className="lp-view-label">IFSC Code</div>
                                                    <div className="lp-view-value">{c.ifscCode || "—"}</div>
                                                </div>
                                                <div className="lp-view-item" style={{ gridColumn: "span 2" }}>
                                                    <div className="lp-view-label">Communication Address</div>
                                                    <div className="lp-view-value">{c.communicationAddress || "—"}</div>
                                                </div>
                                                <div className="lp-view-item" style={{ gridColumn: "span 2" }}>
                                                    <div className="lp-view-label">Unit Address</div>
                                                    <div className="lp-view-value">{c.unitAddress || "—"}</div>
                                                </div>
                                            </div>

                                            <div style={{ marginTop: 16 }}>
                                                <div className="lp-section-title">Govt Documents</div>
                                                <div className="lp-view-doc-grid">
                                                    {DOC_FIELDS.map((doc) => {
                                                        const uploaded = c.documents?.[doc.key]?.url;
                                                        return (
                                                            <div className={`lp-view-doc ${uploaded ? "" : "missing"}`} key={doc.key}>
                                                                <div style={{ fontWeight: 600, marginBottom: 6 }}>{doc.label}</div>
                                                                {uploaded ? (
                                                                    <div className="lp-doc-icon-row">
                                                                        <button
                                                                            type="button"
                                                                            className="lp-icon-btn"
                                                                            title="View"
                                                                            onClick={() => window.open(uploaded, "_blank", "noopener,noreferrer")}
                                                                        >
                                                                            <Eye size={16} />
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            className="lp-icon-btn"
                                                                            title="Download"
                                                                            onClick={() => downloadDoc(uploaded, `${c.customerName}_${doc.label}`)}
                                                                        >
                                                                            <Download size={16} />
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    "Not uploaded"
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </EmployeeLayout>
    );
}