import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const API = `${API_BASE}/api/advance`;

// ── Employee: submit a new advance request ──────────────────
export const useRequestAdvance = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ employee_id, amount, reason }) => {
      const res = await axios.post(`${API}/request`, { employee_id, amount, reason });
      return res.data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["my-advances", vars.employee_id] });
    },
  });
};

// ── Employee: view own advance requests ──────────────────────
export const useMyAdvances = (employeeId) => {
  return useQuery({
    queryKey: ["my-advances", employeeId],
    queryFn: async () => {
      const res = await axios.get(`${API}/employee/${employeeId}`);
      return res.data.data;
    },
    enabled: !!employeeId,
  });
};

// ── Employee: withdraw a still-pending request ────────────────
export const useWithdrawAdvance = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }) => {
      const res = await axios.delete(`${API}/${id}`);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-advances"] }),
  });
};

// ── HR: list all advance requests (optionally filtered by status) ──
export const useAllAdvances = (status) => {
  return useQuery({
    queryKey: ["all-advances", status || "all"],
    queryFn: async () => {
      const res = await axios.get(`${API}/all`, { params: status ? { status } : {} });
      return res.data.data;
    },
  });
};

// ── HR: approve an advance request ────────────────────────────
export const useApproveAdvance = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, approved_by, amount, recovery_month, recovery_year, hr_remarks }) => {
      const res = await axios.put(`${API}/${id}/approve`, {
        approved_by, amount, recovery_month, recovery_year, hr_remarks,
      });
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["all-advances"] });
      qc.invalidateQueries({ queryKey: ["my-advances"] });
    },
  });
};

// ── HR: reject an advance request ─────────────────────────────
export const useRejectAdvance = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, approved_by, hr_remarks }) => {
      const res = await axios.put(`${API}/${id}/reject`, { approved_by, hr_remarks });
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["all-advances"] });
      qc.invalidateQueries({ queryKey: ["my-advances"] });
    },
  });
};