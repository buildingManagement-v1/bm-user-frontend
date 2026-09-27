export default defineNuxtRouteMiddleware(async (to) => {
  const { isAuthenticated, user } = useAuth();

  const publicRoutes = [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
  ];
  const isPublicRoute = publicRoutes.includes(to.path);

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

  // Load the owner's plan once; without one the app is read-only (a banner
  // explains it) rather than locked, so data stays reachable
  if (isAuthenticated.value && userType === "user") {
    const { hasSubscription, checkSubscription } = useSubscription();
    if (hasSubscription.value === null) {
      await checkSubscription();
    }
  }
});
