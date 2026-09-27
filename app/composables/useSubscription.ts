import type { MySubscriptionResponse } from "~/types";

/**
 * Owner subscription state. Without an active plan the account is read-only:
 * pages stay viewable and the API rejects changes.
 */
export const useSubscription = () => {
  const { api } = useApi();

  const state = useState<MySubscriptionResponse | null>("mySubscription", () => null);
  const hasSubscription = computed<boolean | null>(() =>
    state.value === null ? null : !!state.value.data
  );
  const isReadOnly = computed(() => state.value !== null && !state.value.data);
  const daysLeft = computed(() => {
    const end = state.value?.data?.billingCycleEnd;
    if (!end) return 0;
    return Math.ceil((new Date(end).getTime() - Date.now()) / 86_400_000);
  });

  const checkSubscription = async () => {
    try {
      state.value = await api<MySubscriptionResponse>(
        "/v1/app/subscriptions/my-subscription"
      );
    } catch {
      state.value = null;
    }
    return hasSubscription.value;
  };

  const resetSubscription = () => {
    state.value = null;
  };

  return {
    subscriptionState: state,
    hasSubscription,
    isReadOnly,
    daysLeft,
    checkSubscription,
    resetSubscription,
  };
};
