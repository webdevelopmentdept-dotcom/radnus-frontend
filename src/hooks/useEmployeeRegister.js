import { useMutation } from "@tanstack/react-query";
import axios from "axios";

export const useEmployeeRegister = () => {
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