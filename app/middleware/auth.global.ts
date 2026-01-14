export default defineNuxtRouteMiddleware(async (to) => {
  const { isAuthenticated, user } = useAuth();

  const publicRoutes = [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
  ];
  const isPublicRoute = publicRoutes.includes(to.path);
  const plansRoute = "/dashboard/plans";

  if (isAuthenticated.value && isPublicRoute) {
    return navigateTo("/");
  }

  if (!isAuthenticated.value && !isPublicRoute) {
    return navigateTo("/login");
  }

  if (
    isAuthenticated.value &&
    user.value &&
    "mustResetPassword" in user.value &&
    user.value.mustResetPassword &&
    to.path !== "/change-password"
  ) {
    return navigateTo("/change-password");
  }

  const userType = useCookie("user_type").value;

  if (isAuthenticated.value && userType === "user" && to.path !== plansRoute) {
    const { hasSubscription, checkSubscription } = useSubscription();

    if (hasSubscription.value === null) {
      await checkSubscription();
    }

    if (hasSubscription.value === false) {
      return navigateTo(plansRoute);
    }
  }
});
