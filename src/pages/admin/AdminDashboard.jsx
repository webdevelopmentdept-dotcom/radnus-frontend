import React, { useEffect, useState } from "react";
import CourseGraph from "./CoursePieChart";
import MonthlyLeadBarChart from "./LeadBarChart";

export default function AdminDashboard() {
  const API_BASE = import.meta.env.VITE_API_BASE_URL;

  const [applicants, setApplicants] = useState([]);
  const [partners, setPartners] = useState(0);
  const [leads, setLeads] = useState(0);
  const [monthlyLeads, setMonthlyLeads] = useState([]);

  const [courseData, setCourseData] = useState([
    { course: "SEMP", count: 0 },
    { course: "Hybrid", count: 0 },
    { course: "LASP", count: 0 },
  ]);

  /* ================= MONTHLY LEAD CALCULATION ================= */
  const getMonthlyLeads = (list) => {
    const months = Array(12).fill(0);

    list.forEach((lead) => {
      if (!lead.createdAt) return;
      const date = new Date(lead.createdAt);
      const month = date.getMonth();
      if (!isNaN(month)) months[month]++;
    });

    return months;
  };

  useEffect(() => {
    fetchCounts();
  }, []);

  /* ================= FETCH DASHBOARD DATA ================= */
  const fetchCounts = async () => {
    try {
      const appRes = await fetch(`${API_BASE}/api/applicants`);
      const appData = await appRes.json();
      const applicantList = appData?.applicants || [];
      setApplicants(applicantList);

      const partnerRes = await fetch(`${API_BASE}/api/partners/all`);
      const partnerData = await partnerRes.json();
      setPartners(Array.isArray(partnerData) ? partnerData.length : 0);

      const leadRes = await fetch(`${API_BASE}/api/lead/all`);
      const leadData = await leadRes.json();
      const leadList = leadData?.leads || [];

      setLeads(leadList.length);
      setMonthlyLeads(getMonthlyLeads(leadList));

      const courseCounts = { SEMP: 0, Hybrid: 0, LASP: 0 };

      applicantList.forEach((a) => {
        const c = a.course?.toLowerCase() || "";
        if (c.includes("lasp")) courseCounts.LASP++;
        else if (c.includes("hybrid")) courseCounts.Hybrid++;
        else if (c.includes("semp")) courseCounts.SEMP++;
      });

      setCourseData([
        { course: "SEMP", count: courseCounts.SEMP },
        { course: "Hybrid", count: courseCounts.Hybrid },
        { course: "LASP", count: courseCounts.LASP },
      ]);
    } catch (error) {
      console.log("Dashboard Error:", error);
    }
  };

  return (
    <div className="container mt-4 pb-5">

      {/* ================= HEADER ================= */}
      <div
        className="p-4 mb-5 rounded-4 shadow-lg d-flex flex-column flex-md-row gap-3 justify-content-between align-items-start align-items-md-center"
        style={{
        background: "linear-gradient(135deg, #ffffff 40%, #5A2EF9 40%)",
          border: "1px solid #eee",
        }}
      >
        <div className="d-flex align-items-center">
          <div
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "14px",
              background: "#5A2EF9",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginRight: "14px",
            }}
          >
            <img
              src="https://img.icons8.com/fluency/48/combo-chart.png"
              style={{ width: "34px" }}
            />
          </div>

          <div>
            <h2 className="fw-bold m-0 text-dark">Admin Dashboard</h2>
            <p className="m-0 text-secondary">Premium Analytics Panel</p>
          </div>
        </div>

      </div>

      {/* ================= STATS ================= */}
      <div className="row g-4 mb-4">

        <div className="col-lg-4 col-md-6">
          <div className="p-4 text-center rounded-4" style={{ background: "#FFF6ED" }}>
            <h6 className="text-muted">Total Applicants</h6>
            <h1 className="fw-bold text-danger">{applicants.length}</h1>
          </div>
        </div>

        <div className="col-lg-4 col-md-6">
          <div className="p-4 text-center rounded-4" style={{ background: "#EBF5FF" }}>
            <h6 className="text-muted">Channel Partners</h6>
            <h1 className="fw-bold text-primary">{partners}</h1>
          </div>
        </div>

        <div className="col-lg-4 col-md-6">
          <div className="p-4 text-center rounded-4" style={{ background: "#FFEAF3" }}>
            <h6 className="text-muted">Total Leads</h6>
            <h1 className="fw-bold text-warning">{leads}</h1>
          </div>
        </div>

      </div>

      {/* ================= CHARTS ================= */}
      <div className="row g-4">

        <div className="col-lg-4 col-md-12">
          <div className="card shadow-lg border-0 rounded-4 p-4">
            <h4 className="fw-bold text-secondary mb-3">Course Distribution</h4>
            <div style={{ height: "230px" }}>
              <CourseGraph data={courseData} />
            </div>
          </div>
        </div>

        <div className="col-lg-8 col-md-12">
          <div className="card shadow-lg border-0 rounded-4 p-4">
            <h4 className="fw-bold text-secondary mb-3">
              Monthly Lead Improvement
            </h4>
            <div style={{ height: "230px" }}>
              <MonthlyLeadBarChart data={monthlyLeads} />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
