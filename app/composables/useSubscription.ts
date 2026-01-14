import type { ApiResponse } from "~/types";

export const useSubscription = () => {
  const { api } = useApi();

  const hasSubscription = useState<boolean | null>(
    "hasSubscription",
    () => null
  );

  const checkSubscription = async () => {
    try {
      const response = await api<ApiResponse<any>>(
        "/v1/app/subscriptions/my-subscription"
      );
      hasSubscription.value = !!response.data;
      return hasSubscription.value;
    } catch (error) {
      hasSubscription.value = false;
      return false;
    }
  };

  const resetSubscription = () => {
    hasSubscription.value = null;
  };

  return {
    hasSubscription,
    checkSubscription,
    resetSubscription,
  };
};
