import { useMutation } from "@tanstack/react-query";

export function useStartMission() {
  return useMutation({
    mutationFn: async (data) => {
      // fake backend API
      return new Promise((resolve) => {
        setTimeout(() => resolve(data), 1500);
      });
    },
  });
}
