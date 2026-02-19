import { useQuery } from "@tanstack/react-query";
import { staffApi } from "../api/staff";
import type { StaffListParams } from "@/types/api";

export const staffKeys = {
  all: ["staff"] as const,
  list: (params: StaffListParams) => [...staffKeys.all, "list", params] as const,
};

export function useStaff(params: StaffListParams = {}) {
  return useQuery({
    queryKey: staffKeys.list(params),
    queryFn: () => staffApi.list(params),
  });
}
