import { useQuery } from "@tanstack/react-query";
import { getAnalyticsApi } from "../../api/analyticsApi";

export function useAnalytics() {
  return useQuery({
    queryKey: ["analytics"],
    queryFn: async () => {
      const res = await getAnalyticsApi();
      return res.data;
    },
  });
}