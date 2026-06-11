import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { amenitiesApi } from "../api/amenities";

export const amenityKeys = {
  all: ["amenities"] as const,
  catalog: () => [...amenityKeys.all, "catalog"] as const,
  gym: () => [...amenityKeys.all, "gym"] as const,
};

export function useAmenityCatalog() {
  return useQuery({
    queryKey: amenityKeys.catalog(),
    queryFn: () => amenitiesApi.listAll({ page_size: 50 }),
    staleTime: 5 * 60 * 1000,
  });
}

export function useGymAmenities() {
  return useQuery({
    queryKey: amenityKeys.gym(),
    queryFn: () => amenitiesApi.listGym(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAddGymAmenity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (amenityId: string) => amenitiesApi.addToGym({ amenity_id: amenityId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: amenityKeys.gym() }),
  });
}

export function useRemoveGymAmenity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (amenityId: string) => amenitiesApi.removeFromGym(amenityId),
    onSuccess: () => qc.invalidateQueries({ queryKey: amenityKeys.gym() }),
  });
}

export function useUpdateAmenity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => amenitiesApi.update(id, name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: amenityKeys.gym() });
      qc.invalidateQueries({ queryKey: amenityKeys.catalog() });
    },
  });
}

export function useCreateAndAddAmenity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => amenitiesApi.createAndAdd(name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: amenityKeys.gym() });
      qc.invalidateQueries({ queryKey: amenityKeys.catalog() });
    },
  });
}
