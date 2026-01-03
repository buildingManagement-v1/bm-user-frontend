export default defineNuxtRouteMiddleware((to) => {
  const { isAuthenticated, user } = useAuth();

  const publicRoutes = [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
  ];
  const isPublicRoute = publicRoutes.includes(to.path);

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
});
