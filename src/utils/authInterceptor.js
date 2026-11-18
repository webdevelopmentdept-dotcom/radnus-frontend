import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

function pickToken() {
  const p = window.location.pathname;
  if (p.startsWith("/admin")) return localStorage.getItem("adminToken");
  if (p.startsWith("/hr")) return localStorage.getItem("hrToken");
   if (p.startsWith("/employee"))
    return localStorage.getItem("employeeToken") || sessionStorage.getItem("employeeToken");
  return null;
}

function isApiUrl(url) {
  return !!API_BASE && typeof url === "string" && url.startsWith(API_BASE);
}

/* ---------- axios ---------- */
axios.interceptors.request.use((config) => {
  try {
    const full = /^https?:\/\//.test(config.url || "")
      ? config.url
      : (config.baseURL || "") + (config.url || "");
    if (isApiUrl(full)) {
      const token = pickToken();
      if (token) {
        const has = config.headers?.has
          ? config.headers.has("Authorization")
          : !!config.headers?.Authorization;
        if (!has) {
          if (config.headers?.set) config.headers.set("Authorization", `Bearer ${token}`);
          else config.headers = { ...(config.headers || {}), Authorization: `Bearer ${token}` };
        }
      }
    }
  } catch (e) { /* never break a request */ }
  return config;
});

/* ---------- admin: expired / invalid token → login ---------- */
         const isAdminArea = () =>
           window.location.pathname.startsWith("/admin") &&
           !window.location.pathname.startsWith("/admin/login");

         axios.interceptors.response.use(
           (r) => r,
           (err) => {
             try {
               if (err?.response?.status === 401 && isAdminArea() && isApiUrl(err.config?.url)) {
                 localStorage.removeItem("adminToken");
                 window.location.replace("/login");
               }
             } catch (e) { /* ignore */ }
             return Promise.reject(err);
           }
         );

/* ---------- fetch ---------- */
const originalFetch = window.fetch.bind(window);
window.fetch = (input, init = {}) => {
  try {
    const url = typeof input === "string" ? input : input?.url;
    if (isApiUrl(url)) {
      const token = pickToken();
      if (token) {
        const headers = new Headers(
          init.headers || (typeof input !== "string" ? input.headers : undefined)
        );
        if (!headers.has("Authorization")) {
          headers.set("Authorization", `Bearer ${token}`);
          init = { ...init, headers };
        }
      }
    }
  } catch (e) { /* never break a request */ }
  return originalFetch(input, init).then((res) => {
           try {
             const u = typeof input === "string" ? input : input?.url;
             if (res.status === 401 && isAdminArea() && isApiUrl(u)) {
               localStorage.removeItem("adminToken");
               window.location.replace("/login");
             }
           } catch (e) { /* ignore */ }
           return res;
         });
};