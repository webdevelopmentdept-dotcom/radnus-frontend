import { useMutation } from "@tanstack/react-query";
import axios from "axios";

export const useEmployeeRegister = () => {
  const API_BASE = import.meta.env.VITE_API_BASE_URL;
  return useMutation({
    mutationFn: async (data) => {
      const res = await axios.post(
        `${API_BASE}/api/employee/register`,
        data
      );
      return res.data;
    },
  });
};