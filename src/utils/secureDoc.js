export const getSecureUrl = async (docId) => {
  const token = localStorage.getItem("token");
  const API_BASE = import.meta.env.VITE_API_BASE_URL;
  
  const res = await fetch(`${API_BASE}/api/employee/view-doc/${docId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  return data.url;
};