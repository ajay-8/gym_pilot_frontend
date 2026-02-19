import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { profileApi } from "../api/profile";
import type { UserProfileUpdateRequest, ChangePasswordRequest } from "@/types/api";

export const profileKeys = {
  me: ["profile", "me"] as const,
};

export function useProfile() {
  return useQuery({
    queryKey: profileKeys.me,
    queryFn: () => profileApi.get(),
  });
}

export function useProfileUpdate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UserProfileUpdateRequest) => profileApi.update(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.me });
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (payload: ChangePasswordRequest) => profileApi.changePassword(payload),
  });
}
