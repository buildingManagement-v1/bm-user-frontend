import type {
  User,
  Manager,
  TenantAuthData,
  LoginResponse,
  ApiResponse,
} from "~/types";

export type UserType = "user" | "manager" | "tenant";

export const useAuth = () => {
  const config = useRuntimeConfig();
  const router = useRouter();

  const userCookie = useCookie<User | Manager | TenantAuthData | null>("user", {
    maxAge: 60 * 60 * 24 * 7,
  });

  const user = useState<User | Manager | TenantAuthData | null>(
    "user",
    () => userCookie.value
  );
  const token = useCookie("token", {
    maxAge: 60 * 60 * 24 * 7,
  });

  const refreshToken = useCookie("refresh_token", {
    maxAge: 60 * 60 * 24 * 30,
  });

  const userType = useCookie<UserType | null>("user_type", {
    maxAge: 60 * 60 * 24 * 7,
  });

  const login = async (
    email: string,
    password: string,
    type: UserType = "user"
  ) => {
    try {
      const endpoint =
        type === "user"
          ? "/v1/app/auth/login"
          : type === "manager"
          ? "/v1/manager/auth/login"
          : "/v1/tenant/auth/login";

      const response = await $fetch<ApiResponse<LoginResponse>>(
        `${config.public.apiUrl}${endpoint}`,
        {
          method: "POST",
          body: { email, password },
        }
      );

      token.value = response.data.accessToken;
      refreshToken.value = response.data.refreshToken;

      let userData: User | Manager | TenantAuthData;
      if (type === "user") {
        userData = response.data.user!;
      } else if (type === "manager") {
        userData = {
          ...response.data.manager!,
          mustResetPassword: response.data.mustResetPassword || false,
        };
      } else {
        userData = response.data.tenant!;
      }

      user.value = userData;
      userCookie.value = userData;
      userType.value = type;

      return response;
    } catch (error: any) {
      const message = error.data?.message || error.message || "Login failed";
      throw new Error(message);
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    phone?: string
  ) => {
    try {
      const response = await $fetch<ApiResponse<LoginResponse>>(
        `${config.public.apiUrl}/v1/app/auth/register`,
        {
          method: "POST",
          body: { name, email, password, phone },
        }
      );

      token.value = response.data.accessToken;
      refreshToken.value = response.data.refreshToken;

      const userData = response.data.user;
      user.value = userData!;
      userCookie.value = userData!;
      userType.value = "user";

      return response;
    } catch (error: any) {
      const message =
        error.data?.message || error.message || "Registration failed";
      throw new Error(message);
    }
  };

  const logout = () => {
    token.value = null;
    refreshToken.value = null;
    user.value = null;
    userCookie.value = null;
    userType.value = null;
    router.push("/login");
  };

  const refresh = async () => {
    if (!refreshToken.value || !userType.value) {
      throw new Error("No refresh token available");
    }

    const endpoint =
      userType.value === "user"
        ? "/v1/app/auth/refresh"
        : "/v1/manager/auth/refresh";

    const response = await $fetch<ApiResponse<{ accessToken: string }>>(
      `${config.public.apiUrl}${endpoint}`,
      {
        method: "POST",
        body: { refreshToken: refreshToken.value },
      }
    );

    token.value = response.data.accessToken;
    return response.data.accessToken;
  };

  const changePassword = async (oldPassword: string, newPassword: string) => {
    try {
      const endpoint =
        userType.value === "user"
          ? "/v1/app/auth/change-password"
          : "/v1/manager/auth/change-password";

      await $fetch(`${config.public.apiUrl}${endpoint}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token.value}`,
        },
        body: { currentPassword: oldPassword, newPassword },
      });

      // Update mustResetPassword flag for managers
      if (
        userType.value === "manager" &&
        user.value &&
        "mustResetPassword" in user.value
      ) {
        const updatedUser = { ...user.value, mustResetPassword: false };
        user.value = updatedUser;
        userCookie.value = updatedUser;
      }
    } catch (error: any) {
      const message =
        error.data?.message || error.message || "Password change failed";
      throw new Error(message);
    }
  };

  const isAuthenticated = computed(() => !!token.value);

  return {
    user,
    userType,
    token,
    refreshToken,
    login,
    register,
    logout,
    refresh,
    changePassword,
    isAuthenticated,
  };
};
