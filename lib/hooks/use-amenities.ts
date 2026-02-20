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
    queryFn: () => amenitiesApi.listAll({ page_size: 200 }),
  });
}

export function useGymAmenities() {
  return useQuery({
    queryKey: amenityKeys.gym(),
    queryFn: () => amenitiesApi.listGym(),
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
