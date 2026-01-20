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

  // Redirect authenticated users from auth pages to dashboard
  if (isAuthenticated.value && isPublicRoute) {
    return navigateTo("/dashboard");
  }

  // Redirect authenticated users from landing page to dashboard
  if (isAuthenticated.value && to.path === "/") {
    return navigateTo("/dashboard");
  }

  // Redirect unauthenticated users to login (except public routes and landing)
  if (!isAuthenticated.value && !isPublicRoute && to.path !== "/") {
    return navigateTo("/login");
  }

  // Force password reset
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

  // Check subscription for authenticated users
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
