import React, { useState } from "react";
import { Form, Row, Col, Button } from "react-bootstrap";
import { Helmet } from "react-helmet";
import Swal from "sweetalert2";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const CORE_AREAS = [
  "Business Management", "Marketing", "Digital Marketing", "Sales",
  "Finance / Accounts", "HR", "Operations", "Supply Chain",
  "Business Analytics", "Data Science", "AI / Machine Learning",
  "Software Development", "UI/UX", "Electronics", "Mobile Technology",
  "Manufacturing", "Entrepreneurship", "Other",
];

const DURATIONS = ["1 Week", "2 Weeks", "1 Month", "2 Months", "3 Months", "One Semester", "Other"];
const MODES = ["On-site – Pondicherry", "Hybrid", "Remote"];

// ─── convert resume file to base64 data URI ─────────────────────────────
// Same pattern as compressImage() in src/pages/hr/Hrannouncements.jsx —
// FileReader → base64 string, sent as a normal JSON field. No FormData /
// multipart involved, so multer/busboy never touches this request.
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result); // "data:application/pdf;base64,...."
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const InternshipApply = () => {
  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    email: "",
    collegeAndYear: "",
    cgpa: "",
    coreArea: "",
    duration: "",
    mode: "",
    processImprovement: "",
    resume: null,
    declarationAccepted: false,
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value, files, type, checked } = e.target;

    if (files) {
      setFormData((prev) => ({ ...prev, [name]: files[0] }));
      return;
    }
    if (type === "checkbox") {
      setFormData((prev) => ({ ...prev, [name]: checked }));
      return;
    }

    // Full Name — allow only letters, spaces, dots, apostrophes (no digits)
    if (name === "name") {
      const cleaned = value.replace(/[^A-Za-z\s.'-]/g, "");
      setFormData((prev) => ({ ...prev, name: cleaned }));
      return;
    }

    // Mobile Number — digits only, max 10
    if (name === "mobile") {
      const cleaned = value.replace(/[^0-9]/g, "").slice(0, 10);
      setFormData((prev) => ({ ...prev, mobile: cleaned }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Simple, solid email format check (used on submit, on top of type="email")
  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim() || formData.name.trim().length < 3) {
      Swal.fire("Please enter your full name (letters only).", "", "warning");
      return;
    }
    if (formData.mobile.length !== 10) {
      Swal.fire("Please enter a valid 10-digit mobile number.", "", "warning");
      return;
    }
    if (!isValidEmail(formData.email)) {
      Swal.fire("Please enter a valid email address (e.g. name@example.com).", "", "warning");
      return;
    }
    if (!formData.declarationAccepted) {
      Swal.fire("Please accept the declaration before submitting.", "", "warning");
      return;
    }
    if (!formData.resume) {
      Swal.fire("Please upload your Resume / CV.", "", "warning");
      return;
    }
    // Backend caps resumes at 10MB — check here first so the person gets a
    // clear message immediately instead of a vague network/server error.
    const MAX_RESUME_BYTES = 10 * 1024 * 1024;
    if (formData.resume.size > MAX_RESUME_BYTES) {
      Swal.fire("Resume file is too large. Please upload a file under 10MB.", "", "warning");
      return;
    }

    setSubmitting(true);
    try {
      // Convert resume to base64 first, then send everything as a plain
      // JSON body — no FormData/multipart, so no multer/busboy parsing.
      const resumeBase64 = await fileToBase64(formData.resume);

      const payload = {
        name: formData.name,
        mobile: formData.mobile,
        email: formData.email,
        collegeAndYear: formData.collegeAndYear,
        cgpa: formData.cgpa,
        coreArea: formData.coreArea,
        duration: formData.duration,
        mode: formData.mode,
        processImprovement: formData.processImprovement,
        declarationAccepted: formData.declarationAccepted,
        resumeBase64,
        resumeFilename: formData.resume.name,
      };

      const res = await fetch(`${API_BASE}/api/internship/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();

      if (res.ok && result.success) {
        Swal.fire("Application Submitted!", "We'll get back to you soon.", "success");
        setFormData({
          name: "", mobile: "", email: "", collegeAndYear: "", cgpa: "",
          coreArea: "", duration: "", mode: "", processImprovement: "",
          resume: null, declarationAccepted: false,
        });
        e.target.reset();
      } else {
        Swal.fire(result.msg || "Something went wrong", "", "error");
      }
    } catch (err) {
      Swal.fire("Server error, please try again.", "", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Internship Application | Radnus Communication</title>
        <meta name="description" content="Apply for an internship at Radnus Communication, Puducherry." />
      </Helmet>

      <section
        className="d-flex align-items-center"
        style={{
          background: "linear-gradient(135deg, #b30000, #660000)",
          height: "35vh",
        }}
      >
        <div className="container text-white">
          <h1 className="display-6 fw-bold mb-2">Radnus Internship Application</h1>
          <p className="lead mb-0" style={{ maxWidth: 500 }}>
            Learn → Research → Solve → Implement → Present. Real projects, real impact.
          </p>
        </div>
      </section>

      <section className="py-5 bg-light">
        <div className="container" style={{ maxWidth: 700 }}>
          <Form onSubmit={handleSubmit} className="bg-white p-4 p-md-5 rounded shadow-sm">
            <Row className="mb-3">
              <Col md={12}>
                <Form.Label>Full Name *</Form.Label>
                <Form.Control name="name" value={formData.name} onChange={handleChange} placeholder="e.g. Karthik Raja" required />
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={6}>
                <Form.Label>Mobile Number *</Form.Label>
                <Form.Control
                  name="mobile" value={formData.mobile} onChange={handleChange}
                  required inputMode="numeric" maxLength={10}
                  placeholder="10-digit mobile number"
                />
                <Form.Text muted>WhatsApp assumed same as mobile.</Form.Text>
              </Col>
              <Col md={6}>
                <Form.Label>Email ID *</Form.Label>
                <Form.Control type="email" name="email" value={formData.email} onChange={handleChange} required />
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={8}>
                <Form.Label>College / University & Year (or "Graduated - 2025") *</Form.Label>
                <Form.Control
                  name="collegeAndYear" value={formData.collegeAndYear} onChange={handleChange}
                  placeholder="e.g. SASTRA – 3rd Year" required
                />
                <Form.Text muted>Currently studying or already graduated — both can apply.</Form.Text>
              </Col>
              <Col md={4}>
                <Form.Label>Current CGPA</Form.Label>
                <Form.Control name="cgpa" value={formData.cgpa} onChange={handleChange} placeholder="e.g. 8.2" />
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={12}>
                <Form.Label>Core Area / Specialization Interested In *</Form.Label>
                <Form.Select name="coreArea" value={formData.coreArea} onChange={handleChange} required>
                  <option value="">Select</option>
                  {CORE_AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
                </Form.Select>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={6}>
                <Form.Label>Preferred Internship Duration *</Form.Label>
                <Form.Select name="duration" value={formData.duration} onChange={handleChange} required>
                  <option value="">Select</option>
                  {DURATIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                </Form.Select>
              </Col>
              <Col md={6}>
                <Form.Label>Internship Mode</Form.Label>
                <Form.Select name="mode" value={formData.mode} onChange={handleChange}>
                  <option value="">Select</option>
                  {MODES.map((m) => <option key={m} value={m}>{m}</option>)}
                </Form.Select>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={12}>
                <Form.Label>Have you worked on any real project or solved a practical problem before? Briefly describe it. *</Form.Label>
                <Form.Control
                  as="textarea" rows={4}
                  name="processImprovement" value={formData.processImprovement} onChange={handleChange}
                  required
                />
                <Form.Text muted>Academic, personal, or work-related — any real project counts.</Form.Text>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={12}>
                <Form.Label>Resume / CV Upload *</Form.Label>
                <Form.Control type="file" name="resume" onChange={handleChange} accept=".pdf,.doc,.docx" required />
              </Col>
            </Row>

            <Row className="mb-4">
              <Col md={12}>
                <Form.Check
                  type="checkbox"
                  id="declarationAccepted"
                  name="declarationAccepted"
                  checked={formData.declarationAccepted}
                  onChange={handleChange}
                  label="I confirm the above information is accurate and agree to work on a real Radnus project under guidance, including submitting a final report/presentation."
                  required
                />
              </Col>
            </Row>

            <Button type="submit" variant="danger" className="w-100 fw-semibold py-2" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Application"}
            </Button>
          </Form>
        </div>
      </section>
    </>
  );
};

export default InternshipApply;