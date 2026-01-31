import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";
import Gallery from "./components/shared/Gallery";
/* Shared */
import RadnusNavbar from "./components/shared/RadnusNavbar";
import RadnusFooter from "./components/shared/RadnusFooter";

/* Public */
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
import jobsData from "./components/jobsData";

/* Auth */
import Login from "./pages/auth/Login";
import EmployeeLogin from "./EmployeeLogin";
import HrLogin from "./pages/hr/HrLogin";
import AdminLogin from "./pages/admin/AdminLogin";
import PartnerLogin from "./pages/Channel/PartnerLogin";

/* Employee */
import EmployeeDashboard from "./pages/employee/EmployeeDashboard";

/* HR */
import HrDashboard from "./pages/hr/HrDashboard";
import HrApplicants from "./pages/hr/HrApplicants";
import HrEmployees from "./pages/hr/HrEmployees";

/* Admin */
import AdminLayout from "./pages/layouts/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ApplicantList from "./pages/admin/ApplicantList";
import PartnerList from "./pages/admin/PartnerList";
import LeadList from "./pages/admin/LeadList";
import AdvanceRecords from "./pages/admin/AdvanceRecords";
import SystemSettings from "./pages/admin/SystemSetting";
import AdminUpdates from "./pages/admin/AdminUpdates";
import CourseManagement from "./pages/admin/CourseManagement";
import ShopOwnerList from "./pages/admin/ShopOwnerList";
import TechnicianList from "./pages/admin/TechnicianList";

/* Channel */
import ChannelDashboard from "./pages/Channel/ChannelDashboard";
import DashboardOverview from "./pages/Channel/DashboardOverview";
import AddLead from "./pages/Channel/AddLead";
import MyLeads from "./pages/Channel/MyLeads";
import Courses from "./pages/Channel/Courses";
import CourseDetail from "./pages/Channel/CourseDetail";
import PartnerProfile from "./pages/Channel/ProfilePartner";

/* Radnus Connect */
import RadnusConnectHome from "./components/radnusconnect/RadnusConnectHome";
import TechnicianForm from "./components/radnusconnect/TechnicianForm";
import ShopOwnerForm from "./components/radnusconnect/ShopOwnerForm";

/* 🔐 EMPLOYEE PROTECTED ROUTE */
const EmployeeProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("employeeToken");
  return token ? children : <Navigate to="/employee/login" replace />;
};

function App() {
  const location = useLocation();

  const hideHeaderFooter =
    (location.pathname.startsWith("/admin") &&
      location.pathname !== "/admin/login") ||
    (location.pathname.startsWith("/hr") &&
      location.pathname !== "/hr/login") ||
    (location.pathname.startsWith("/employee") &&
      location.pathname !== "/employee/login") ||
    (location.pathname.toLowerCase().startsWith("/channel") &&
      location.pathname.toLowerCase() !== "/channel/login") ||
    location.pathname.startsWith("/radnus-connect/technician") ||
    location.pathname.startsWith("/radnus-connect/shop-owner");

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
<Route path="/gallery" element={<Gallery />} />
        {/* AUTH */}
        <Route path="/login" element={<Login />} />
        {/* <Route path="/employee/login" element={<EmployeeLogin />} /> */}
        <Route path="/hr/login" element={<HrLogin />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/channel/login" element={<PartnerLogin />} />

        {/* ✅ EMPLOYEE DASHBOARD */}
        <Route
          path="/employee/dashboard"
          element={
            <EmployeeProtectedRoute>
              <EmployeeDashboard />
            </EmployeeProtectedRoute>
          }
        />

        {/* HR */}
        <Route path="/hr/dashboard" element={<HrDashboard />}>
          <Route path="applicants" element={<HrApplicants />} />
          <Route path="employees" element={<HrEmployees />} />
        </Route>

        {/* ADMIN */}
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
          <Route
            path="radnus-connect/shop-owners"
            element={<ShopOwnerList />}
          />
          <Route
            path="radnus-connect/technicians"
            element={<TechnicianList />}
          />
        </Route>

        {/* CHANNEL */}
        <Route path="/channel" element={<ChannelDashboard />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardOverview />} />
          <Route path="add-lead" element={<AddLead />} />
          <Route path="leads" element={<MyLeads />} />
          <Route path="courses" element={<Courses />} />
          <Route path="course/:id" element={<CourseDetail />} />
          <Route path="profile" element={<PartnerProfile />} />
        </Route>

        {/* RADNUS CONNECT */}
        <Route path="/radnus-connect" element={<RadnusConnectHome />} />
        <Route path="/radnus-connect/technician" element={<TechnicianForm />} />
        <Route path="/radnus-connect/shop-owner" element={<ShopOwnerForm />} />
      </Routes>

      {!hideHeaderFooter && <RadnusFooter />}
    </>
  );
}

export default App;
