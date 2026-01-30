import { useMutation } from "@tanstack/react-query";
import axios from "axios";

export const useEmployeeLogin = () => {
  return useMutation((data) =>
    axios
      .post("http://localhost:5000/api/employee/login", data)
      .then((res) => res.data)
  );
};
