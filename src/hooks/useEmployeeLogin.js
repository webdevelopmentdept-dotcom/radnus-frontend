import { useMutation } from "@tanstack/react-query";
import axios from "axios";

export const useEmployeeLogin = () => {
  return useMutation({
    mutationFn: async (data) => {
      const res = await axios.post(
        `${API_BASE}/api/employee/login`,
        data
      );
      return res.data;
    },
  });
};