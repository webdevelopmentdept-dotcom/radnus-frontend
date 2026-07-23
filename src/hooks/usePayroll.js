import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const API = `${API_BASE}/api/payroll`;

// ── HR: list all payroll runs ───────────────────────────────
export const usePayrollRuns = () => {
  return useQuery({
    queryKey: ["payroll-runs"],
    queryFn: async () => {
      const res = await axios.get(`${API}/runs`);
      return res.data.data;
    },
  });
};

// ── HR: payslips for a specific run ─────────────────────────
export const usePayslipsByRun = (runId) => {
  return useQuery({
    queryKey: ["payroll-payslips", runId],
    queryFn: async () => {
      const res = await axios.get(`${API}/runs/${runId}/payslips`);
      return res.data.data;
    },
    enabled: !!runId,
  });
};

// ── HR: generate payroll for a month ────────────────────────
export const useGeneratePayroll = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ month, year, generated_by, statutory_rates }) => {
      const res = await axios.post(`${API}/generate`, { month, year, generated_by, statutory_rates });
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["payroll-runs"] }),
  });
};

// ── HR: approve a payroll run ───────────────────────────────
export const useApprovePayroll = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, approved_by }) => {
      const res = await axios.put(`${API}/runs/${id}/approve`, { approved_by });
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["payroll-runs"] }),
  });
};

// ── HR: revert an approved payroll run back to draft ────────
export const useRevertPayrollApproval = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const res = await axios.put(`${API}/runs/${id}/revert-approval`);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payroll-runs"] });
      qc.invalidateQueries({ queryKey: ["payroll-payslips"] });
    },
  });
};

// ── HR: mark a payroll run as paid ──────────────────────────
export const useMarkPayrollPaid = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const res = await axios.put(`${API}/runs/${id}/mark-paid`);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["payroll-runs"] }),
  });
};

// ── HR: delete a draft payroll run ──────────────────────────
export const useDeletePayrollRun = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const res = await axios.delete(`${API}/runs/${id}`);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["payroll-runs"] }),
  });
};

export const useMarkPayslipPaid = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payment_ref }) => {
      const res = await axios.put(`${API}/payslip/${id}/mark-paid`, { payment_ref });
      return res.data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["payroll-payslips"] });
      qc.invalidateQueries({ queryKey: ["payroll-runs"] });
      qc.invalidateQueries({ queryKey: ["payslip", vars.id] });
    },
  });
};

export const useMarkPayslipPending = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const res = await axios.put(`${API}/payslip/${id}/mark-pending`);
      return res.data;
    },
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ["payroll-payslips"] });
      qc.invalidateQueries({ queryKey: ["payroll-runs"] });
      qc.invalidateQueries({ queryKey: ["payslip", id] });
    },
  });
};

// ── Single payslip detail ───────────────────────────────────
export const usePayslipDetail = (payslipId) => {
  return useQuery({
    queryKey: ["payslip", payslipId],
    queryFn: async () => {
      const res = await axios.get(`${API}/payslip/${payslipId}`);
      return res.data.data;
    },
    enabled: !!payslipId,
  });
};

// ── Employee: own payslips ──────────────────────────────────
export const useMyPayslips = (employeeId) => {
  return useQuery({
    queryKey: ["my-payslips", employeeId],
    queryFn: async () => {
      const res = await axios.get(`${API}/employee/${employeeId}`);
      return res.data.data;
    },
    enabled: !!employeeId,
  });
};