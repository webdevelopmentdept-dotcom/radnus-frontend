import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";

// Shared Components
import RadnusNavbar from "./components/shared/RadnusNavbar";
import RadnusFooter from "./components/shared/RadnusFooter";
import jobsData  from '../src/components/jobsData'
// Public Pages
import RadnusHome from "./components/RadnusHome";
import RadnusAbout from "./components/RadnusAbout";
import RadnusAcademy from "./components/Services/RadnusAcademy";
import WhiteLabelPage from "./components/Services/WhiteLabelPage";
import ToolsTech from "./components/Services/ToolstTech";
import Accessories from "./components/Services/Accessories";
import Service from "./components/Services/Services";
import Placement from "./components/Services/Placement";
import Timeline from "./components/Services/Timeline";
import Startup from "./components/Services/Startup";
import Career from "./components/Career";
import CareerDetail from "./components/shared/CareerDetail";
import ThankYou from "./ThankYou";

// Auth
import Login from "./pages/auth/Login";

// Admin
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ApplicantList from "./pages/admin/ApplicantList";
import AdminLayout from "./pages/layouts/AdminLayout";
import PartnerList from "./pages/admin/PartnerList";
import LeadList from "./pages/admin/LeadList";
import AdvanceRecords from "./pages/admin/AdvanceRecords";
import SystemSettings from "./pages/admin/SystemSetting";
import AdminUpdates from "./pages/admin/AdminUpdates";
import CourseManagement from "./pages/admin/CourseManagement";

// HR
import HrApplicants from "./pages/hr/HrApplicants";
import HrLogin from "./pages/hr/HrLogin";

// Channel Partner Pages
import ChannelLogin from "./pages/channel/ChannelLogin";
import ChannelDashboard from "./pages/Channel/ChannelDashboard";
import AddLead from "./pages/Channel/AddLead";
import MyLeads from "./pages/Channel/MyLeads";  // ← Correct import
import DashboardOverview from "./pages/Channel/DashboardOverview";
import Courses from "./pages/Channel/Courses";
import CourseDetail from "./pages/Channel/CourseDetail";
import PartnerProfile from "./pages/Channel/ProfilePartner";

function App() {
  const location = useLocation();

  // UPDATED CONDITION (Case insensitive + removes header/footer for all channel pages)
  const hideHeaderFooter =
    (location.pathname.startsWith("/admin") &&
      location.pathname !== "/admin/login") ||
    (location.pathname.startsWith("/hr") &&
      location.pathname !== "/hr/login") ||
    (location.pathname.toLowerCase().startsWith("/channel") &&
      location.pathname.toLowerCase() !== "/channel/login");

  return (
    <>
      <ScrollToTop />

      {!hideHeaderFooter && <RadnusNavbar />}

      <Routes>

        {/* PUBLIC */}
        <Route path="/" element={<RadnusHome />} />
        <Route path="/about" element={<RadnusAbout />} />
        <Route path="/academy" element={<RadnusAcademy />} />
        <Route path="/thank-you" element={<ThankYou />} />
        <Route path="/whitelabel" element={<WhiteLabelPage />} />
       <Route path="/careers" element={<Career jobsData={jobsData} />} />

        <Route path="/careers/:jobTitle" element={<CareerDetail />} />
        <Route path="/tools-tech" element={<ToolsTech />} />
        <Route path="/accessories" element={<Accessories />} />
        <Route path="/service" element={<Service />} />
        <Route path="/placement" element={<Placement />} />
        <Route path="/timeline" element={<Timeline />} />
        <Route path="/startup" element={<Startup />} />

        {/* AUTH */}
        <Route path="/login" element={<Login />} />

        {/* ADMIN */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="applicants" element={<ApplicantList />} />
          <Route path="partners" element={<PartnerList />} />
          <Route path="leads" element={<LeadList />} />
          <Route path="advance-records" element={<AdvanceRecords />} />
          <Route path="courses" element={<CourseManagement />} />
          <Route path="settings" element={<SystemSettings />} />
          <Route path="updates" element={<AdminUpdates />} />
        </Route>

        {/* HR */}
        <Route path="/hr/login" element={<HrLogin />} />
        <Route path="/hr/applicants" element={<HrApplicants />} />

        {/* CHANNEL PARTNER */}
        <Route path="/channel/login" element={<ChannelLogin />} />

        <Route path="/channel" element={<ChannelDashboard />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardOverview />} />
          <Route path="add-lead" element={<AddLead />} />
          <Route path="leads" element={<MyLeads />} />
          <Route path="courses" element={<Courses />} />
          <Route path="course/:id" element={<CourseDetail />} />
          <Route path="profile" element={<PartnerProfile />} />
        </Route>

      </Routes>

      {!hideHeaderFooter && <RadnusFooter />}
    </>
  );
}

export default App;
