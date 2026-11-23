import { useMutation, useQuery } from "@tanstack/react-query";
import {
  createPublicOrder,
  fetchLocalInfo,
  fetchOrderTracking,
} from "../api/client";

const LAST_ORDER_KEY = "vc_last_order_code_v1";

export function getLastOrderCode() {
  try {
    return localStorage.getItem(LAST_ORDER_KEY) || "";
  } catch {
    return "";
  }
}

export function saveLastOrderCode(codigo) {
  try {
    if (codigo) {
      localStorage.setItem(LAST_ORDER_KEY, codigo);
    }
  } catch {
    // ignore storage errors
  }
}

export function useLocalInfo() {
  return useQuery({
    queryKey: ["local-info"],
    queryFn: fetchLocalInfo,
    staleTime: 60_000,
    retry: 1,
  });
}

export function useCreateOrder() {
  return useMutation({
    mutationFn: createPublicOrder,
    onSuccess: (data) => {
      if (data?.codigo) {
        saveLastOrderCode(data.codigo);
      }
    },
  });
}

export function useOrderTracking(codigo) {
  return useQuery({
    queryKey: ["order-tracking", codigo],
    queryFn: () => fetchOrderTracking(codigo),
    enabled: Boolean(codigo),
    refetchInterval: (query) => {
      const estado = query.state.data?.estado;
      if (estado === "entregado" || estado === "cancelado") return false;
      return 15_000;
    },
    retry: 1,
  });
}
