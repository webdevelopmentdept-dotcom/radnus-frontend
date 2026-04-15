import { useState } from "react";

// ─── MOCK DATA (replace with your API calls) ───────────────────────────────
const MOCK_EMPLOYEES = [
    { _id: "emp001", name: "Testdata", email: "test@company.com", department: "IT", designation: "Developer", status: "kyc_approved" },
    { _id: "emp002", name: "SampleData", email: "sample@gmail.com", department: "Sales", designation: "BDA", status: "kyc_approved" },
];

const KPI_TEMPLATES = ["Sales KPI Template", "Developer KPI Template", "Manager KPI Template", "Support KPI Template"];
const MANAGERS = ["Rahul Sharma (IT Head)", "Priya Mehta (Sales Manager)", "Amit Verma (HR Head)"];

// ─── STEP CONFIG ────────────────────────────────────────────────────────────
const STEPS = [
    { id: 1, label: "Employment", icon: "🏢" },
    { id: 2, label: "Salary", icon: "💰" },
    { id: 3, label: "Incentives", icon: "🎯" },
    { id: 4, label: "Benefits", icon: "🌿" },
    { id: 5, label: "Access", icon: "🔐" },
    { id: 6, label: "Documents", icon: "📄" },
    { id: 7, label: "Activate", icon: "🚀" },
];

const initialForm = {
    // Step 1
    employeeCode: "", department: "", designation: "", reportingManager: "",
    employmentType: "Full-time", workLocation: "", dateOfJoining: "",
    probationPeriod: "3", workShift: "General",
    // Step 2
    ctc: "", basicSalary: "", hra: "", specialAllowance: "",
    conveyanceAllowance: "", performancePay: "", pfApplicable: true,
    esiApplicable: false, professionalTax: true, tdsApplicable: true,
    // Step 3
    incentiveEligible: false, incentiveModel: "Sales based",
    incentiveFrequency: "Monthly",
    incentiveProducts: [
        { product: "Certificate", amount: "300" },
        { product: "RDS", amount: "500" },
        { product: "Loan", amount: "300" },
        { product: "Tools", amount: "250" },
    ],
    // Step 4
    leavePolicy: "Standard", annualLeave: "12", sickLeave: "6",
    casualLeave: "6", healthInsurance: false, mobileAllowance: false,
    travelAllowance: false, laptopProvided: false, companySIM: false,
    // Step 5
    systemRole: "Employee",
    moduleAccess: { hrDashboard: true, salesDashboard: false, inventory: false, payroll: false, reports: false },
    // Step 6
    offerLetter: null, appointmentLetter: null, ndaAgreement: null,
    employmentContract: null, hrPolicy: null, salaryStructureDoc: null,
    // Step 7
    kpiTemplate: "", targetCycle: "Monthly", pmsLinked: true, reviewCycle: "Monthly",
    hrNotes: "", sendWelcomeEmail: true,
};

export default function HRActivationForm() {
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [step, setStep] = useState(1);
    const [form, setForm] = useState(initialForm);
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const filtered = MOCK_EMPLOYEES.filter(e =>
        e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.department.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const set = (field, value) => setForm(f => ({ ...f, [field]: value }));
    const setModule = (mod, val) => setForm(f => ({ ...f, moduleAccess: { ...f.moduleAccess, [mod]: val } }));
    const setIncentive = (idx, field, val) => setForm(f => {
        const arr = [...f.incentiveProducts];
        arr[idx] = { ...arr[idx], [field]: val };
        return { ...f, incentiveProducts: arr };
    });

    // Auto-calculate gross
    const gross = [form.basicSalary, form.hra, form.specialAllowance, form.conveyanceAllowance, form.performancePay]
        .reduce((a, v) => a + (parseFloat(v) || 0), 0);

    const handleActivate = async () => {
        setLoading(true);
        await new Promise(r => setTimeout(r, 2000)); // simulate API call
        setSubmitted(true);
        setLoading(false);
    };

    if (submitted) return <SuccessScreen employee={selectedEmployee} form={form} onReset={() => { setSubmitted(false); setSelectedEmployee(null); setStep(1); setForm(initialForm); }} />;

    return (
        <div style={styles.root}>
            {/* Header */}
            <div style={styles.header}>
                <div style={styles.headerLeft}>
                    <div style={styles.logo}>HR</div>
                    <div>
                        <div style={styles.headerTitle}>Employee Activation Portal</div>
                        <div style={styles.headerSub}>HR Panel · Finalize Employment Setup</div>
                    </div>
                </div>
                <div style={styles.headerBadge}>🔒 Secure HR Access</div>
            </div>

            <div style={styles.body}>
                {!selectedEmployee ? (
                    // ── EMPLOYEE SELECTION SCREEN ──
                    <div style={styles.selectScreen}>
                        <div style={styles.selectTitle}>Select Employee to Activate</div>
                        <div style={styles.selectSub}>These employees have completed KYC verification and are ready for HR setup</div>
                        <input
                            style={styles.searchInput}
                            placeholder="🔍  Search by name or department..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                        <div style={styles.empGrid}>
                            {filtered.map(emp => (
                                <div key={emp._id} style={styles.empCard} onClick={() => {
                                    setSelectedEmployee(emp);
                                    set("department", emp.department);
                                    set("designation", emp.designation);
                                    set("employeeCode", `RAD-2026-00${emp._id.slice(-1)}`);
                                }}>
                                    <div style={styles.empAvatar}>{emp.name[0]}</div>
                                    <div style={styles.empInfo}>
                                        <div style={styles.empName}>{emp.name}</div>
                                        <div style={styles.empDept}>{emp.designation} · {emp.department}</div>
                                        <div style={styles.empEmail}>{emp.email}</div>
                                    </div>
                                    <div style={styles.kycBadge}>✅ KYC Verified</div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    // ── MAIN FORM ──
                    <div style={styles.formContainer}>
                        {/* Employee Banner */}
                        <div style={styles.empBanner}>
                            <div style={styles.bannerAvatar}>{selectedEmployee.name[0]}</div>
                            <div>
                                <div style={styles.bannerName}>{selectedEmployee.name}</div>
                                <div style={styles.bannerRole}>{selectedEmployee.designation} · {selectedEmployee.department}</div>
                            </div>
                            <div style={styles.empCodeBadge}>ID: {form.employeeCode}</div>
                            <button style={styles.changeBtn} onClick={() => setSelectedEmployee(null)}>← Change</button>
                        </div>

                        {/* Step Progress */}
                        <div style={styles.stepper}>
                            {STEPS.map((s, i) => (
                                <div key={s.id} style={styles.stepItem} onClick={() => setStep(s.id)}>
                                    <div style={{ ...styles.stepCircle, ...(step === s.id ? styles.stepActive : step > s.id ? styles.stepDone : {}) }}>
                                        {step > s.id ? "✓" : s.icon}
                                    </div>
                                    <div style={{ ...styles.stepLabel, ...(step === s.id ? { color: "#2563eb", fontWeight: 700 } : {}) }}>{s.label}</div>
                                    {i < STEPS.length - 1 && <div style={{ ...styles.stepLine, ...(step > s.id ? styles.stepLineDone : {}) }} />}
                                </div>
                            ))}
                        </div>

                        {/* Step Content */}
                        <div style={styles.stepContent}>
                            {step === 1 && <Step1 form={form} set={set} managers={MANAGERS} />}
                            {step === 2 && <Step2 form={form} set={set} gross={gross} />}
                            {step === 3 && <Step3 form={form} set={set} setIncentive={setIncentive} />}
                            {step === 4 && <Step4 form={form} set={set} />}
                            {step === 5 && <Step5 form={form} set={set} setModule={setModule} />}
                            {step === 6 && <Step6 form={form} set={set} />}
                            {step === 7 && <Step7 form={form} set={set} employee={selectedEmployee} kpiTemplates={KPI_TEMPLATES} onActivate={handleActivate} loading={loading} />}
                        </div>

                        {/* Navigation */}
                        <div style={styles.navBar}>
                            <button style={styles.navBtnSecondary} onClick={() => step > 1 && setStep(s => s - 1)} disabled={step === 1}>
                                ← Previous
                            </button>
                            <div style={styles.stepCounter}>Step {step} of {STEPS.length}</div>
                            {step < 7
                                ? <button style={styles.navBtnPrimary} onClick={() => setStep(s => s + 1)}>Next →</button>
                                : <button style={{ ...styles.navBtnPrimary, background: "#16a34a" }} onClick={handleActivate} disabled={loading}>
                                    {loading ? "⏳ Activating..." : "🚀 Activate Employee"}
                                </button>
                            }
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── STEP 1: Employment Details ─────────────────────────────────────────────
function Step1({ form, set, managers }) {
    return (
        <StepWrapper title="🏢 Employment Details" desc="Set up core employment information for the employee">
            <Row>
                <Field label="Employee Code" required>
                    <input style={inp} value={form.employeeCode} onChange={e => set("employeeCode", e.target.value)} />
                </Field>
                <Field label="Department" required>
                    <input style={inp} value={form.department} onChange={e => set("department", e.target.value)} />
                </Field>
            </Row>
            <Row>
                <Field label="Designation" required>
                    <input style={inp} value={form.designation} onChange={e => set("designation", e.target.value)} />
                </Field>
                <Field label="Reporting Manager">
                    <select style={inp} value={form.reportingManager} onChange={e => set("reportingManager", e.target.value)}>
                        <option value="">Select Manager</option>
                        {managers.map(m => <option key={m}>{m}</option>)}
                    </select>
                </Field>
            </Row>
            <Row>
                <Field label="Employment Type">
                    <select style={inp} value={form.employmentType} onChange={e => set("employmentType", e.target.value)}>
                        {["Full-time", "Part-time", "Contract", "Intern"].map(t => <option key={t}>{t}</option>)}
                    </select>
                </Field>
                <Field label="Work Location / Branch">
                    <input style={inp} value={form.workLocation} onChange={e => set("workLocation", e.target.value)} placeholder="e.g. Mumbai HQ" />
                </Field>
            </Row>
            <Row>
                <Field label="Date of Joining" required>
                    <input style={inp} type="date" value={form.dateOfJoining} onChange={e => set("dateOfJoining", e.target.value)} />
                </Field>
                <Field label="Probation Period">
                    <select style={inp} value={form.probationPeriod} onChange={e => set("probationPeriod", e.target.value)}>
                        <option value="3">3 Months</option>
                        <option value="6">6 Months</option>
                        <option value="0">No Probation</option>
                    </select>
                </Field>
            </Row>
            <Row>
                <Field label="Work Shift">
                    <select style={inp} value={form.workShift} onChange={e => set("workShift", e.target.value)}>
                        {["General", "Field Employee", "Rotational"].map(s => <option key={s}>{s}</option>)}
                    </select>
                </Field>
                <Field label="Confirmation Date">
                    <input style={{ ...inp, background: "#f8fafc", color: "#64748b" }} value={
                        form.dateOfJoining && form.probationPeriod !== "0"
                            ? (() => { const d = new Date(form.dateOfJoining); d.setMonth(d.getMonth() + parseInt(form.probationPeriod)); return d.toISOString().split("T")[0]; })()
                            : "Auto calculated"
                    } readOnly />
                </Field>
            </Row>
        </StepWrapper>
    );
}

// ─── STEP 2: Salary ──────────────────────────────────────────────────────────
function Step2({ form, set, gross }) {
    const net = gross - (form.pfApplicable ? gross * 0.12 : 0) - (form.professionalTax ? 200 : 0);
    return (
        <StepWrapper title="💰 Salary Structure" desc="Define the complete salary breakdown for this employee">
            <Row>
                <Field label="CTC (Annual)" required>
                    <div style={styles.inputWithPrefix}><span style={styles.prefix}>₹</span><input style={{ ...inp, paddingLeft: 32 }} value={form.ctc} onChange={e => set("ctc", e.target.value)} placeholder="e.g. 360000" /></div>
                </Field>
                <Field label="Basic Salary (Monthly)">
                    <div style={styles.inputWithPrefix}><span style={styles.prefix}>₹</span><input style={{ ...inp, paddingLeft: 32 }} value={form.basicSalary} onChange={e => set("basicSalary", e.target.value)} placeholder="e.g. 15000" /></div>
                </Field>
            </Row>
            <Row>
                <Field label="HRA">
                    <div style={styles.inputWithPrefix}><span style={styles.prefix}>₹</span><input style={{ ...inp, paddingLeft: 32 }} value={form.hra} onChange={e => set("hra", e.target.value)} placeholder="e.g. 5000" /></div>
                </Field>
                <Field label="Special Allowance">
                    <div style={styles.inputWithPrefix}><span style={styles.prefix}>₹</span><input style={{ ...inp, paddingLeft: 32 }} value={form.specialAllowance} onChange={e => set("specialAllowance", e.target.value)} placeholder="e.g. 3000" /></div>
                </Field>
            </Row>
            <Row>
                <Field label="Conveyance Allowance">
                    <div style={styles.inputWithPrefix}><span style={styles.prefix}>₹</span><input style={{ ...inp, paddingLeft: 32 }} value={form.conveyanceAllowance} onChange={e => set("conveyanceAllowance", e.target.value)} placeholder="e.g. 1600" /></div>
                </Field>
                <Field label="Performance Pay">
                    <div style={styles.inputWithPrefix}><span style={styles.prefix}>₹</span><input style={{ ...inp, paddingLeft: 32 }} value={form.performancePay} onChange={e => set("performancePay", e.target.value)} placeholder="e.g. 2000" /></div>
                </Field>
            </Row>

            {/* Summary Card */}
            <div style={styles.salaryCard}>
                <div style={styles.salaryCardTitle}>📊 Salary Summary</div>
                <div style={styles.salaryRow}><span>Gross Monthly</span><span style={{ color: "#2563eb", fontWeight: 700 }}>₹{gross.toLocaleString()}</span></div>
                <div style={styles.salaryRow}><span>PF Deduction (12%)</span><span style={{ color: "#dc2626" }}>- ₹{form.pfApplicable ? Math.round(gross * 0.12).toLocaleString() : 0}</span></div>
                <div style={styles.salaryRow}><span>Professional Tax</span><span style={{ color: "#dc2626" }}>- ₹{form.professionalTax ? "200" : "0"}</span></div>
                <div style={{ ...styles.salaryRow, borderTop: "1px solid #e2e8f0", paddingTop: 10, marginTop: 4 }}><span style={{ fontWeight: 700 }}>Net Take Home</span><span style={{ color: "#16a34a", fontWeight: 800, fontSize: 18 }}>₹{Math.round(net).toLocaleString()}</span></div>
            </div>

            <div style={styles.checkRow}>
                {[["pfApplicable", "PF Applicable"], ["esiApplicable", "ESI Applicable"], ["professionalTax", "Professional Tax"], ["tdsApplicable", "TDS Applicable"]].map(([k, l]) => (
                    <label key={k} style={styles.checkLabel}>
                        <input type="checkbox" checked={form[k]} onChange={e => set(k, e.target.checked)} style={{ marginRight: 6 }} />
                        {l}
                    </label>
                ))}
            </div>
        </StepWrapper>
    );
}

// ─── STEP 3: Incentives ──────────────────────────────────────────────────────
function Step3({ form, set, setIncentive }) {
    return (
        <StepWrapper title="🎯 Incentive Structure" desc="Configure variable pay and incentive models">
            <label style={styles.toggleRow}>
                <input type="checkbox" checked={form.incentiveEligible} onChange={e => set("incentiveEligible", e.target.checked)} />
                <span style={styles.toggleLabel}>Employee is Incentive Eligible</span>
            </label>

            {form.incentiveEligible && (
                <>
                    <Row>
                        <Field label="Incentive Model">
                            <select style={inp} value={form.incentiveModel} onChange={e => set("incentiveModel", e.target.value)}>
                                {["Sales based", "Task based", "Performance score based"].map(m => <option key={m}>{m}</option>)}
                            </select>
                        </Field>
                        <Field label="Incentive Frequency">
                            <select style={inp} value={form.incentiveFrequency} onChange={e => set("incentiveFrequency", e.target.value)}>
                                <option>Monthly</option>
                                <option>Weekly</option>
                            </select>
                        </Field>
                    </Row>

                    <div style={styles.tableLabel}>Incentive Product Table</div>
                    <table style={styles.table}>
                        <thead>
                            <tr>{["Product / Category", "Incentive Amount (₹)"].map(h => <th key={h} style={styles.th}>{h}</th>)}</tr>
                        </thead>
                        <tbody>
                            {form.incentiveProducts.map((row, i) => (
                                <tr key={i}>
                                    <td style={styles.td}><input style={{ ...inp, marginBottom: 0 }} value={row.product} onChange={e => setIncentive(i, "product", e.target.value)} /></td>
                                    <td style={styles.td}><div style={styles.inputWithPrefix}><span style={styles.prefix}>₹</span><input style={{ ...inp, paddingLeft: 32, marginBottom: 0 }} value={row.amount} onChange={e => setIncentive(i, "amount", e.target.value)} /></div></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <button style={styles.addRowBtn} onClick={() => set("incentiveProducts", [...form.incentiveProducts, { product: "", amount: "" }])}>+ Add Row</button>
                </>
            )}

            {!form.incentiveEligible && (
                <div style={styles.infoBox}>ℹ️ This employee will receive fixed salary only. Enable above to add variable incentive structure.</div>
            )}
        </StepWrapper>
    );
}

// ─── STEP 4: Benefits ────────────────────────────────────────────────────────
function Step4({ form, set }) {
    return (
        <StepWrapper title="🌿 Benefits & Leave Policy" desc="Assign leave entitlements and additional employee benefits">
            <Row>
                <Field label="Leave Policy Type">
                    <select style={inp} value={form.leavePolicy} onChange={e => set("leavePolicy", e.target.value)}>
                        {["Standard", "Senior", "Contract", "Intern"].map(p => <option key={p}>{p}</option>)}
                    </select>
                </Field>
                <Field label="Annual Leave (days)">
                    <input style={inp} type="number" value={form.annualLeave} onChange={e => set("annualLeave", e.target.value)} />
                </Field>
            </Row>
            <Row>
                <Field label="Sick Leave (days)">
                    <input style={inp} type="number" value={form.sickLeave} onChange={e => set("sickLeave", e.target.value)} />
                </Field>
                <Field label="Casual Leave (days)">
                    <input style={inp} type="number" value={form.casualLeave} onChange={e => set("casualLeave", e.target.value)} />
                </Field>
            </Row>

            <div style={styles.tableLabel}>Optional Benefits</div>
            <div style={styles.benefitsGrid}>
                {[
                    ["healthInsurance", "🏥 Health Insurance"],
                    ["mobileAllowance", "📱 Mobile Allowance"],
                    ["travelAllowance", "✈️ Travel Allowance"],
                    ["laptopProvided", "💻 Laptop Provided"],
                    ["companySIM", "📞 Company SIM"],
                ].map(([k, l]) => (
                    <label key={k} style={{ ...styles.benefitCard, ...(form[k] ? styles.benefitCardActive : {}) }}>
                        <input type="checkbox" checked={form[k]} onChange={e => set(k, e.target.checked)} style={{ marginRight: 8 }} />
                        {l}
                    </label>
                ))}
            </div>
        </StepWrapper>
    );
}

// ─── STEP 5: System Access ───────────────────────────────────────────────────
function Step5({ form, set, setModule }) {
    return (
        <StepWrapper title="🔐 Role & System Access" desc="Define system role and module-level access permissions">
            <Field label="System Role">
                <div style={styles.roleGrid}>
                    {["Employee", "Manager", "Admin"].map(role => (
                        <button key={role} style={{ ...styles.roleBtn, ...(form.systemRole === role ? styles.roleBtnActive : {}) }} onClick={() => set("systemRole", role)}>
                            {role === "Employee" ? "👤" : role === "Manager" ? "👔" : "⚙️"} {role}
                        </button>
                    ))}
                </div>
            </Field>

            <div style={styles.tableLabel}>Module Access</div>
            <table style={styles.table}>
                <thead>
                    <tr>{["Module", "Access"].map(h => <th key={h} style={styles.th}>{h}</th>)}</tr>
                </thead>
                <tbody>
                    {Object.entries(form.moduleAccess).map(([mod, val]) => (
                        <tr key={mod}>
                            <td style={styles.td}>{mod.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}</td>
                            <td style={styles.td}>
                                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                                    <div style={{ ...styles.toggle, ...(val ? styles.toggleOn : {}) }} onClick={() => setModule(mod, !val)}>
                                        <div style={{ ...styles.toggleThumb, ...(val ? styles.toggleThumbOn : {}) }} />
                                    </div>
                                    <span style={{ color: val ? "#16a34a" : "#94a3b8", fontWeight: 600 }}>{val ? "Enabled" : "Disabled"}</span>
                                </label>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </StepWrapper>
    );
}

// ─── STEP 6: Documents ───────────────────────────────────────────────────────
function Step6({ form, set }) {
    const docs = [
        ["offerLetter", "Offer Letter", true],
        ["appointmentLetter", "Appointment Letter", true],
        ["ndaAgreement", "NDA Agreement", false],
        ["employmentContract", "Employment Contract", false],
        ["hrPolicy", "HR Policy Document", false],
        ["salaryStructureDoc", "Salary Structure Document", false],
    ];
    return (
        <StepWrapper title="📄 HR Documents Upload" desc="Upload all official employment documents for this employee">
            <div style={styles.docsGrid}>
                {docs.map(([key, label, required]) => (
                    <div key={key} style={styles.docCard}>
                        <div style={styles.docIcon}>{form[key] ? "✅" : "📋"}</div>
                        <div style={styles.docLabel}>{label} {required && <span style={{ color: "#dc2626" }}>*</span>}</div>
                        <input type="file" accept=".pdf,.doc,.docx" style={{ display: "none" }} id={key}
                            onChange={e => set(key, e.target.files[0]?.name || null)} />
                        <label htmlFor={key} style={styles.uploadBtn}>
                            {form[key] ? `✓ ${form[key]}` : "Upload PDF"}
                        </label>
                    </div>
                ))}
            </div>
        </StepWrapper>
    );
}

// ─── STEP 7: Activate ────────────────────────────────────────────────────────
function Step7({ form, set, employee, kpiTemplates, onActivate, loading }) {
    return (
        <StepWrapper title="🚀 Final Activation" desc="Review PMS settings and activate the employee account">
            <Row>
                <Field label="KPI Template">
                    <select style={inp} value={form.kpiTemplate} onChange={e => set("kpiTemplate", e.target.value)}>
                        <option value="">Select KPI Template</option>
                        {kpiTemplates.map(t => <option key={t}>{t}</option>)}
                    </select>
                </Field>
                <Field label="Target Cycle">
                    <select style={inp} value={form.targetCycle} onChange={e => set("targetCycle", e.target.value)}>
                        <option>Monthly</option>
                        <option>Quarterly</option>
                    </select>
                </Field>
            </Row>
            <Row>
                <Field label="Performance Review Cycle">
                    <select style={inp} value={form.reviewCycle} onChange={e => set("reviewCycle", e.target.value)}>
                        <option>Monthly</option>
                        <option>Quarterly</option>
                        <option>Bi-Annual</option>
                        <option>Annual</option>
                    </select>
                </Field>
                <Field label="Incentive Linked to PMS">
                    <select style={inp} value={form.pmsLinked} onChange={e => set("pmsLinked", e.target.value === "true")}>
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                    </select>
                </Field>
            </Row>

            <Field label="HR Internal Notes">
                <textarea style={{ ...inp, height: 80, resize: "vertical" }} value={form.hrNotes} onChange={e => set("hrNotes", e.target.value)} placeholder="Internal HR remarks about this employee..." />
            </Field>

            <label style={styles.toggleRow}>
                <input type="checkbox" checked={form.sendWelcomeEmail} onChange={e => set("sendWelcomeEmail", e.target.checked)} />
                <span style={styles.toggleLabel}>Send Welcome Email with Login Credentials</span>
            </label>

            {/* Final Summary */}
            <div style={styles.summaryBox}>
                <div style={styles.summaryTitle}>📋 Activation Summary</div>
                <div style={styles.summaryGrid}>
                    {[
                        ["Employee", employee.name],
                        ["Code", form.employeeCode],
                        ["Department", form.department],
                        ["Role", form.systemRole],
                        ["CTC", `₹${form.ctc || "—"}`],
                        ["DOJ", form.dateOfJoining || "—"],
                    ].map(([l, v]) => (
                        <div key={l} style={styles.summaryItem}>
                            <div style={styles.summaryKey}>{l}</div>
                            <div style={styles.summaryVal}>{v}</div>
                        </div>
                    ))}
                </div>
            </div>
        </StepWrapper>
    );
}

// ─── SUCCESS SCREEN ──────────────────────────────────────────────────────────
function SuccessScreen({ employee, form, onReset }) {
    return (
        <div style={styles.root}>
            <div style={{ ...styles.body, justifyContent: "center", alignItems: "center" }}>
                <div style={styles.successCard}>
                    <div style={styles.successIcon}>🎉</div>
                    <div style={styles.successTitle}>Employee Activated!</div>
                    <div style={styles.successSub}>{employee.name} is now an active employee</div>
                    <div style={styles.successDetails}>
                        <div style={styles.successRow}><span>Employee Code</span><strong>{form.employeeCode}</strong></div>
                        <div style={styles.successRow}><span>Department</span><strong>{form.department}</strong></div>
                        <div style={styles.successRow}><span>Designation</span><strong>{form.designation}</strong></div>
                        <div style={styles.successRow}><span>Status</span><strong style={{ color: "#16a34a" }}>🟢 ACTIVE</strong></div>
                        {form.sendWelcomeEmail && <div style={styles.successRow}><span>Welcome Email</span><strong style={{ color: "#2563eb" }}>✉️ Sent</strong></div>}
                    </div>
                    <button style={styles.navBtnPrimary} onClick={onReset}>Activate Another Employee</button>
                </div>
            </div>
        </div>
    );
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function StepWrapper({ title, desc, children }) {
    return (
        <div>
            <div style={styles.stepTitle}>{title}</div>
            <div style={styles.stepDesc}>{desc}</div>
            <div style={{ marginTop: 24 }}>{children}</div>
        </div>
    );
}
function Row({ children }) { return <div style={styles.row}>{children}</div>; }
function Field({ label, required, children }) {
    return (
        <div style={styles.field}>
            <label style={styles.fieldLabel}>{label}{required && <span style={{ color: "#dc2626" }}> *</span>}</label>
            {children}
        </div>
    );
}
const inp = {
    width: "100%", padding: "10px 14px", border: "1.5px solid #e2e8f0",
    borderRadius: 8, fontSize: 14, color: "#1e293b", background: "#fff",
    outline: "none", boxSizing: "border-box", marginBottom: 0,
    fontFamily: "inherit", transition: "border 0.2s",
};

// ─── STYLES ──────────────────────────────────────────────────────────────────
const styles = {
    root: { fontFamily: "'Segoe UI', system-ui, sans-serif", background: "#f1f5f9", minHeight: "100vh" },
    header: { background: "#1e3a5f", color: "#fff", padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" },
    headerLeft: { display: "flex", alignItems: "center", gap: 14 },
    logo: { background: "#2563eb", borderRadius: 10, width: 42, height: 42, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 16 },
    headerTitle: { fontWeight: 700, fontSize: 18 },
    headerSub: { fontSize: 12, color: "#93c5fd", marginTop: 2 },
    headerBadge: { background: "rgba(255,255,255,0.1)", borderRadius: 20, padding: "6px 14px", fontSize: 13 },
    body: { padding: 32, maxWidth: 960, margin: "0 auto" },

    // Select Screen
    selectScreen: { background: "#fff", borderRadius: 16, padding: 32, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" },
    selectTitle: { fontSize: 22, fontWeight: 700, color: "#1e293b" },
    selectSub: { color: "#64748b", marginTop: 6, marginBottom: 20 },
    searchInput: { width: "100%", padding: "12px 16px", border: "1.5px solid #e2e8f0", borderRadius: 10, fontSize: 14, outline: "none", boxSizing: "border-box", marginBottom: 20 },
    empGrid: { display: "flex", flexDirection: "column", gap: 12 },
    empCard: { display: "flex", alignItems: "center", gap: 16, padding: "16px 20px", border: "1.5px solid #e2e8f0", borderRadius: 12, cursor: "pointer", transition: "all 0.2s", background: "#fff" },
    empAvatar: { width: 48, height: 48, borderRadius: "50%", background: "#2563eb", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 20, flexShrink: 0 },
    empInfo: { flex: 1 },
    empName: { fontWeight: 700, fontSize: 16, color: "#1e293b" },
    empDept: { color: "#64748b", fontSize: 13, marginTop: 2 },
    empEmail: { color: "#94a3b8", fontSize: 12, marginTop: 1 },
    kycBadge: { background: "#dcfce7", color: "#16a34a", padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600 },

    // Form Container
    formContainer: { background: "#fff", borderRadius: 16, padding: 32, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" },
    empBanner: { background: "linear-gradient(135deg, #1e3a5f, #2563eb)", borderRadius: 12, padding: "16px 24px", display: "flex", alignItems: "center", gap: 16, marginBottom: 28, color: "#fff" },
    bannerAvatar: { width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 20 },
    bannerName: { fontWeight: 700, fontSize: 17 },
    bannerRole: { fontSize: 13, color: "#93c5fd", marginTop: 2 },
    empCodeBadge: { background: "rgba(255,255,255,0.15)", padding: "4px 12px", borderRadius: 20, fontSize: 12, marginLeft: "auto" },
    changeBtn: { background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", padding: "6px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13 },

    // Stepper
    stepper: { display: "flex", alignItems: "flex-start", marginBottom: 28, overflowX: "auto", paddingBottom: 4 },
    stepItem: { display: "flex", flexDirection: "column", alignItems: "center", position: "relative", flex: 1, cursor: "pointer" },
    stepCircle: { width: 40, height: 40, borderRadius: "50%", background: "#f1f5f9", border: "2px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, zIndex: 1, transition: "all 0.2s" },
    stepActive: { background: "#eff6ff", border: "2px solid #2563eb" },
    stepDone: { background: "#dcfce7", border: "2px solid #16a34a", color: "#16a34a" },
    stepLabel: { fontSize: 11, color: "#94a3b8", marginTop: 6, textAlign: "center", whiteSpace: "nowrap" },
    stepLine: { position: "absolute", top: 20, left: "50%", width: "100%", height: 2, background: "#e2e8f0", zIndex: 0 },
    stepLineDone: { background: "#16a34a" },

    // Step Content
    stepContent: { minHeight: 300, marginBottom: 24 },
    stepTitle: { fontSize: 20, fontWeight: 700, color: "#1e293b" },
    stepDesc: { color: "#64748b", marginTop: 4, fontSize: 14 },

    // Form elements
    row: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 },
    field: { display: "flex", flexDirection: "column", gap: 6 },
    fieldLabel: { fontSize: 13, fontWeight: 600, color: "#374151" },
    inputWithPrefix: { position: "relative" },
    prefix: { position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#64748b", fontWeight: 600, zIndex: 1 },

    // Salary
    salaryCard: { background: "#f8fafc", borderRadius: 12, padding: "16px 20px", border: "1px solid #e2e8f0", marginTop: 8, marginBottom: 16 },
    salaryCardTitle: { fontWeight: 700, marginBottom: 12, color: "#1e293b" },
    salaryRow: { display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 14, color: "#374151" },

    // Checkboxes
    checkRow: { display: "flex", gap: 20, flexWrap: "wrap" },
    checkLabel: { display: "flex", alignItems: "center", fontSize: 14, color: "#374151", cursor: "pointer" },

    // Toggle
    toggleRow: { display: "flex", alignItems: "center", gap: 12, cursor: "pointer", marginBottom: 16, padding: "12px 16px", background: "#f8fafc", borderRadius: 10, border: "1px solid #e2e8f0" },
    toggleLabel: { fontWeight: 600, fontSize: 14, color: "#1e293b" },
    toggle: { width: 44, height: 24, borderRadius: 12, background: "#e2e8f0", position: "relative", cursor: "pointer", transition: "background 0.2s" },
    toggleOn: { background: "#2563eb" },
    toggleThumb: { width: 18, height: 18, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: 3, transition: "left 0.2s" },
    toggleThumbOn: { left: 23 },

    // Tables
    tableLabel: { fontWeight: 700, fontSize: 14, color: "#374151", marginBottom: 8, marginTop: 8 },
    table: { width: "100%", borderCollapse: "collapse", marginBottom: 12 },
    th: { background: "#f8fafc", padding: "10px 14px", textAlign: "left", fontSize: 13, fontWeight: 700, color: "#374151", border: "1px solid #e2e8f0" },
    td: { padding: "8px 14px", border: "1px solid #f1f5f9", fontSize: 14 },
    addRowBtn: { background: "#eff6ff", border: "1px solid #bfdbfe", color: "#2563eb", padding: "6px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 },

    // Benefits
    benefitsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 },
    benefitCard: { display: "flex", alignItems: "center", padding: "12px 16px", border: "1.5px solid #e2e8f0", borderRadius: 10, cursor: "pointer", fontSize: 14, fontWeight: 500, transition: "all 0.2s" },
    benefitCardActive: { background: "#eff6ff", border: "1.5px solid #2563eb", color: "#2563eb" },

    // Role
    roleGrid: { display: "flex", gap: 12 },
    roleBtn: { flex: 1, padding: "12px 16px", border: "1.5px solid #e2e8f0", borderRadius: 10, cursor: "pointer", fontSize: 14, fontWeight: 600, background: "#fff", transition: "all 0.2s" },
    roleBtnActive: { background: "#eff6ff", border: "1.5px solid #2563eb", color: "#2563eb" },

    // Docs
    docsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 },
    docCard: { border: "1.5px dashed #cbd5e1", borderRadius: 12, padding: 20, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, textAlign: "center" },
    docIcon: { fontSize: 28 },
    docLabel: { fontSize: 13, fontWeight: 600, color: "#374151" },
    uploadBtn: { background: "#eff6ff", border: "1px solid #bfdbfe", color: "#2563eb", padding: "6px 16px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600 },

    // Info box
    infoBox: { background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, padding: 16, color: "#92400e", fontSize: 14 },

    // Summary
    summaryBox: { background: "#f8fafc", borderRadius: 12, padding: 20, border: "1px solid #e2e8f0", marginTop: 20 },
    summaryTitle: { fontWeight: 700, marginBottom: 14, fontSize: 15 },
    summaryGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 },
    summaryItem: { background: "#fff", borderRadius: 8, padding: "10px 14px", border: "1px solid #e2e8f0" },
    summaryKey: { fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase" },
    summaryVal: { fontSize: 14, color: "#1e293b", fontWeight: 700, marginTop: 2 },

    // Navigation
    navBar: { display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 20, borderTop: "1px solid #e2e8f0" },
    navBtnPrimary: { background: "#2563eb", color: "#fff", border: "none", padding: "10px 24px", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 14 },
    navBtnSecondary: { background: "#fff", color: "#374151", border: "1.5px solid #e2e8f0", padding: "10px 24px", borderRadius: 10, cursor: "pointer", fontWeight: 600, fontSize: 14 },
    stepCounter: { fontSize: 13, color: "#64748b", fontWeight: 600 },

    // Success
    successCard: { background: "#fff", borderRadius: 20, padding: 48, textAlign: "center", maxWidth: 480, width: "100%", boxShadow: "0 4px 24px rgba(0,0,0,0.1)" },
    successIcon: { fontSize: 64, marginBottom: 16 },
    successTitle: { fontSize: 28, fontWeight: 800, color: "#1e293b" },
    successSub: { color: "#64748b", marginTop: 8, marginBottom: 24 },
    successDetails: { background: "#f8fafc", borderRadius: 12, padding: 20, marginBottom: 24, textAlign: "left" },
    successRow: { display: "flex", justifyContent: "space-between", padding: "8px 0", fontSize: 14, color: "#374151", borderBottom: "1px solid #e2e8f0" },
};