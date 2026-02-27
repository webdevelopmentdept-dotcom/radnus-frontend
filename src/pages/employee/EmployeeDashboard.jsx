import React, { useEffect, useState } from "react";
import axios from "axios";
import { 
  User, 
  Mail, 
  Phone, 
  Briefcase, 
  Building, 
  FileText, 
  CheckCircle, 
  Clock, 
  ExternalLink,
  LogOut,
  Plus,
  Trash2,
  LayoutDashboard,
  Settings,
  Bell,
  Menu,
  X
} from "lucide-react";

export default function EmployeeDashboard() {
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [showSidebar, setShowSidebar] = useState(false);

useEffect(() => {
  const fetchData = async () => {
    try {
      const id = localStorage.getItem("employeeId");

      if (!id) {
        window.location.href = "/login";
        return;
      }

      const res = await axios.get(
        `${API_BASE}/api/employee/me/${id}`
      );

      setEmployee(res.data);
      setEditData(res.data);
      setLoading(false);

    } catch (err) {
      console.log(err);
    }
  };

  fetchData();

  // 🔥 AUTO REFRESH EVERY 5 SEC
  const interval = setInterval(fetchData, 5000);

  return () => clearInterval(interval);

}, []);

  const handleLogout = () => {
    localStorage.removeItem("employeeId");
    window.location.href = "/login";
  };

const handleEditToggle = () => {
  console.log("EDIT CLICKED", employee);

  if (!employee) {
    alert("Employee data load ஆகல");
    return;
  }

  setEditData(JSON.parse(JSON.stringify(employee)));
  setIsEditing(true);
};

  const handleCancel = () => {
    setIsEditing(false);
  };
 const handleDocReplace = async (index, file) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("docId", editData.documents[index]._id);

  const res = await axios.post(
    `${API_BASE}/api/employee/replace-doc`,
    formData
  );

  // 🔥 IMPORTANT FIX
  const updatedDocs = [...editData.documents];
  updatedDocs[index] = res.data;



  // 👉 ALSO update main employee state
  setEmployee(prev => ({
    ...prev,
    documents: updatedDocs
  }));
};
const handleSave = async () => {
  try {
  await axios.put(`${API_BASE}/api/employee/update-profile`, {
  employeeId: employee.id,
  ...editData   // 🔥 FULL DATA
});

    // 🔥 refetch மட்டும் போதும்
    const updated = await axios.get(
      `${API_BASE}/api/employee/me/${employee.id}`
    );

    setEmployee(updated.data);
    setEditData(updated.data);
    setIsEditing(false);

  } catch (err) {
    console.log(err);
  }
};
  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: value }));
  };

  const handleDocChange = (index, field, value) => {
    const updatedDocs = [...editData.documents];
    updatedDocs[index] = { ...updatedDocs[index], [field]: value };
    setEditData(prev => ({ ...prev, documents: updatedDocs }));
  };

  const handleAddDoc = () => {
    setEditData(prev => ({
      ...prev,
      documents: [...prev.documents, { docType: "New Document", fileUrl: "" }]
    }));
  };



  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

if (!employee) {
  return (
    <div className="container mt-5 text-center">
      <h3>Employee not found</h3>
    </div>
  );
}

    const isApproved = employee.status === "approved";
const isRejected = employee.status === "rejected";

  const styles = `
    .profile-header {
      position: relative;
    }

    .profile-header::before,
    .profile-header::after {
      pointer-events: none;
    }

    .profile-header * {
      position: relative;
      z-index: 2;
    }
  `;

  return (
    <div className="dashboard-wrapper">
      {/* SIDEBAR */}
      <div className="d-md-none text-end p-2">

  
</div>
      <aside className={`sidebar ${showSidebar ? 'show' : ''}`}>
         <button onClick={() => setShowSidebar(false)}>
      <X size={20} />
    </button>
        <div className="sidebar-brand">
          <Building size={24} />
          <span>Employee Portal</span>
        </div>
        <nav className="sidebar-nav">
          <a href="#" className="nav-link-custom active">
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </a>
          <a href="#" className="nav-link-custom">
            <User size={20} />
            <span>My Profile</span>
          </a>
          <a href="#" className="nav-link-custom">
            <FileText size={20} />
            <span>Documents</span>
          </a>
          <a href="#" className="nav-link-custom">
            <Bell size={20} />
            <span>Notifications</span>
          </a>
          <a href="#" className="nav-link-custom">
            <Settings size={20} />
            <span>Settings</span>
          </a>
          <div className="mt-auto pt-4">
            <button onClick={handleLogout} className="nav-link-custom border-0 bg-transparent w-100 text-start">
              <LogOut size={20} />
              <span>Sign Out</span>
            </button>
          </div>
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      {showSidebar && (
  <div 
    className="overlay"
    onClick={() => setShowSidebar(false)}
  ></div>
)}
      <main className="main-content">
        {/* TOPBAR */}
        <header className="topbar">
          <div className="d-flex align-items-center gap-3">
           <button 
  className="menu-btn d-md-none"
  onClick={() => setShowSidebar(true)}
>
  <Menu size={22} />
</button>
            <div className="d-flex align-items-center gap-2">
              <span className="fw-bold text-primary d-none d-sm-inline">Welcome back, {employee.name.split(' ')[0]}!</span>
              <div className="bg-light rounded-circle p-2">
                <Bell size={20} className="text-secondary" />
              </div>
              <div className="bg-primary text-white rounded-circle p-2 d-flex align-items-center justify-content-center" style={{width: '40px', height: '40px'}}>
                {employee.name.charAt(0)}
              </div>
            </div>
          </div>
        </header>

        <div className="dashboard-container container-fluid">
          {/* TOP PROFILE HEADER */}
          <div className="profile-header d-md-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-4 flex-grow-1">
             <div className="profile-avatar-wrapper">
  <img
    src={
      employee.profileImage ||
      "https://ui-avatars.com/api/?name=" + employee.name
    }
    alt="profile"
    className="profile-img"
  />

  {isEditing && (
<input
  type="file"
  onChange={async (e) => {
    const file = e.target.files[0];

    const formData = new FormData();
    formData.append("file", file);

    // ❗ FIX 1: correct ID
    formData.append("employeeId", employee.id);

    // ❗ STEP 1: upload image
    await axios.post(
      `${API_BASE}/api/employee/upload-profile`,
      formData
    );

    // ❗ STEP 2: refetch full data
    const res = await axios.get(
      `${API_BASE}/api/employee/me/${employee.id}`
    );

    // ❗ STEP 3: update UI
    setEmployee(res.data);
  }}
/>
  )}
</div>
              <div className="flex-grow-1">
              {isEditing ? (
                  <div className="row g-2">
                    <div className="col-md-6">
                      <input 
                        type="text" 
                        className="form-control form-control-lg mb-2" 
                        name="name" 
                        value={editData.name || ""} 
                        onChange={handleChange}
                        placeholder="Full Name"
                      />
                    </div>
                    <div className="col-md-6">
                      <input 
                        type="text" 
                        className="form-control mb-2" 
                        name="designation" 
                        value={editData.designation || ""} 
                        onChange={handleChange}
                        placeholder="Designation"
                      />
                    </div>
                    <div className="col-md-6">
                      <input 
                        type="text" 
                        className="form-control" 
                        name="department" 
                        value={editData.department || ""} 
                        onChange={handleChange}
                        placeholder="Department"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <h1 className="h2 mb-1 fw-bold">{employee.name}</h1>
                    <p className="mb-0 opacity-75 d-flex align-items-center gap-2">
                      <Briefcase size={18} /> {employee.designation}
                    </p>
                    <p className="mb-0 opacity-75 d-flex align-items-center gap-2">
                      <Building size={18} /> {employee.department}
                    </p>
                  </>
                )}
              </div>
            </div>
            <div className="mt-4 mt-md-0 d-flex gap-2">
              {isEditing ? (
                <>
                  <button onClick={handleSave} className="btn btn-success d-flex align-items-center gap-2 fw-semibold">
                    <CheckCircle size={18} /> Save
                  </button>
                  <button onClick={handleCancel} className="btn btn-danger d-flex align-items-center gap-2 fw-semibold">
                    <Clock size={18} /> Cancel
                  </button>
                </>
              ) : (
                <>
<button 
  type="button"   // 🔥 ADD THIS
  onClick={handleEditToggle} 
  className="btn btn-light d-flex align-items-center gap-2 fw-semibold text-primary"
>
                    <User size={18} /> Edit Profile
                  </button>
                  
                </>
              )}
            </div>
          </div>

          <div className="row g-4">
            {/* LEFT COLUMN: CONTACT INFO & STATUS */}
            <div className="col-lg-4">
              <div className="card mb-4">
                <div className="card-body">
                  <h5 className="section-title">
                    <User size={20} /> Contact Information
                  </h5>
                  <div className="mb-3">
                    <label className="text-muted small text-uppercase fw-bold">Email Address</label>
                    {isEditing ? (
                      <input 
                        type="email" 
                        className="form-control" 
                        name="email" 
                        value={editData.email || ""} 
                        onChange={handleChange}
                      />
                    ) : (
                      <p className="d-flex align-items-center gap-2 mb-0">
                        <Mail size={16} className="text-primary" /> {employee.email}
                      </p>
                    )}
                  </div>
                  <div className="mb-0">
                    <label className="text-muted small text-uppercase fw-bold">Mobile Number</label>
                    {isEditing ? (
                      <input 
                        type="text" 
                        className="form-control" 
                        name="mobile" 
                        value={editData.mobile || ""} 
                        onChange={handleChange}
                      />
                    ) : (
                      <p className="d-flex align-items-center gap-2 mb-0">
                        <Phone size={16} className="text-primary" /> {employee.mobile}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-body">
                  <h5 className="section-title">
                    <CheckCircle size={20} /> Onboarding Status
                  </h5>
        <div className="text-center py-3">
  {isApproved ? (
    <div>
      <div className="status-badge status-completed d-inline-block mb-3">
        <CheckCircle size={16} className="me-1" /> APPROVED
      </div>
      <p className="small text-muted mb-0">
        Your documents have been approved by HR ✅
      </p>
    </div>
  ) : isRejected ? (
    <div>
      <div className="status-badge status-rejected d-inline-block mb-3">
        ❌ REJECTED
      </div>

      <p className="small text-danger mb-0">
        {employee.remarks || "Rejected by HR"}
      </p>
    </div>
  ) : (
    <div>
      <div className="status-badge status-pending d-inline-block mb-3">
        <Clock size={16} className="me-1" /> PENDING
      </div>
      <p className="small text-muted mb-0">
        Waiting for HR approval ⏳
      </p>
    </div>
  )}
</div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: DOCUMENTS */}
            <div className="col-lg-8">
              <div className="card h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="section-title mb-0">
                      <FileText size={20} /> Uploaded Documents
                    </h5>
                    {isEditing && (
                      <button onClick={handleAddDoc} className="btn btn-sm btn-primary d-flex align-items-center gap-1">
                        <Plus size={16} /> Add Document
                      </button>
                    )}
                  </div>
                  
                  {((isEditing ? editData.documents : employee.documents) || []).length === 0 ? (
                    <div className="text-center py-5">
                      <FileText size={48} className="text-muted opacity-25 mb-3" />
                      <p className="text-muted">No documents uploaded yet.</p>
                    </div>
                  ) : (
                    <div className="mt-3">
                     {((isEditing ? editData.documents : employee.documents) || []).map((doc, index) => (
                        <div key={index} className="doc-item">
                          <div className="d-flex align-items-center gap-3 flex-grow-1">
                            <div className="bg-light p-2 rounded">
                              <FileText size={20} className="text-primary" />
                            </div>
                            <div className="flex-grow-1">
                              {isEditing ? (
                                <div className="row g-2">
                                  <div className="col-md-6">
                                    <input 
                                      type="text" 
                                      className="form-control form-control-sm" 
                                      value={doc.docType} 
                                      onChange={(e) => handleDocChange(index, 'docType', e.target.value)}
                                      placeholder="Document Type"
                                    />
                                  </div>
                                  <div className="col-md-6">
                                 <input 
  type="file"
  onChange={(e) => handleDocReplace(index, e.target.files[0])}
/>
                                      
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <h6 className="mb-0 fw-bold">{doc.docType}</h6>
                                  <span className="text-muted small">PDF Document</span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="ms-3 d-flex gap-2">
                            {!isEditing && (
  <a 
    href={doc.fileUrl} 
    target="_blank" 
    rel="noopener noreferrer"
    className="btn-view d-flex align-items-center gap-2"
  >
    View <ExternalLink size={14} />
  </a>
)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
