import { useMutation } from "@tanstack/react-query";
import axios from "axios";

export const useEmployeeRegister = () => {
  return useMutation((data) =>
    axios
      .post(
        "http://localhost:5000/api/employee/register", // ✅ REGISTER API
        data
      )
      .then((res) => res.data)
  );
};
