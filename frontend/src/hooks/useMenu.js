import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminMenuApi, fetchPublicMenu } from "../api/client";

export function usePublicMenu() {
  return useQuery({
    queryKey: ["public-menu"],
    queryFn: fetchPublicMenu,
    staleTime: 60_000,
  });
}

export function useAdminMenuData(enabled = true) {
  const categorias = useQuery({
    queryKey: ["admin-categorias"],
    queryFn: adminMenuApi.listCategorias,
    enabled,
  });
  const productos = useQuery({
    queryKey: ["admin-productos"],
    queryFn: adminMenuApi.listProductos,
    enabled,
  });
  const adicionales = useQuery({
    queryKey: ["admin-adicionales"],
    queryFn: adminMenuApi.listAdicionales,
    enabled,
  });

  return { categorias, productos, adicionales };
}

export function useAdminMenuMutations() {
  const queryClient = useQueryClient();

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["public-menu"] });
    queryClient.invalidateQueries({ queryKey: ["admin-categorias"] });
    queryClient.invalidateQueries({ queryKey: ["admin-productos"] });
    queryClient.invalidateQueries({ queryKey: ["admin-adicionales"] });
  };

  return {
    createProducto: useMutation({
      mutationFn: adminMenuApi.createProducto,
      onSuccess: invalidateAll,
    }),
    updateProducto: useMutation({
      mutationFn: ({ id, data }) => adminMenuApi.updateProducto(id, data),
      onSuccess: invalidateAll,
    }),
    deleteProducto: useMutation({
      mutationFn: adminMenuApi.deleteProducto,
      onSuccess: invalidateAll,
    }),
    toggleProducto: useMutation({
      mutationFn: adminMenuApi.toggleProductoDisponible,
      onSuccess: invalidateAll,
    }),
    createCategoria: useMutation({
      mutationFn: adminMenuApi.createCategoria,
      onSuccess: invalidateAll,
    }),
    updateCategoria: useMutation({
      mutationFn: ({ id, data }) => adminMenuApi.updateCategoria(id, data),
      onSuccess: invalidateAll,
    }),
    deleteCategoria: useMutation({
      mutationFn: adminMenuApi.deleteCategoria,
      onSuccess: invalidateAll,
    }),
    createAdicional: useMutation({
      mutationFn: adminMenuApi.createAdicional,
      onSuccess: invalidateAll,
    }),
    updateAdicional: useMutation({
      mutationFn: ({ id, data }) => adminMenuApi.updateAdicional(id, data),
      onSuccess: invalidateAll,
    }),
    deleteAdicional: useMutation({
      mutationFn: adminMenuApi.deleteAdicional,
      onSuccess: invalidateAll,
    }),
    toggleAdicional: useMutation({
      mutationFn: adminMenuApi.toggleAdicionalDisponible,
      onSuccess: invalidateAll,
    }),
  };
}
