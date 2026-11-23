import { useQuery } from "@tanstack/react-query";
import { fetchHealth } from "../api/client";

export function useHealthCheck() {
  return useQuery({
    queryKey: ["system-health"],
    queryFn: fetchHealth,
    retry: 1,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}
