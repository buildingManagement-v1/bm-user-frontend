import type {
  User,
  Manager,
  TenantAuthData,
  LoginResponse,
  ApiResponse,
  PasswordChangeResponse,
} from "~/types";
import { toApiError } from "./useApi";

export type UserType = "user" | "manager" | "tenant";

const endpoints: Record<UserType, { login: string; refresh: string; changePassword: string }> = {
  user: {
    login: "/v1/app/auth/login",
    refresh: "/v1/app/auth/refresh",
    changePassword: "/v1/app/auth/change-password",
  },
  manager: {
    login: "/v1/manager/auth/login",
    refresh: "/v1/manager/auth/refresh",
    changePassword: "/v1/manager/auth/change-password",
  },
  tenant: {
    login: "/v1/tenant/auth/login",
    refresh: "/v1/tenant/auth/refresh",
    changePassword: "/v1/tenant/auth/change-password",
  },
};

/** Matches the backend's 30-day refresh token for remembered sessions. */
const REMEMBERED_MAX_AGE = 60 * 60 * 24 * 30;

/**
 * "Remember me" keeps the session for 30 days; without it every auth cookie
 * is a session cookie that ends when the browser closes (and the backend
 * issues a 24h refresh token).
 */
const authCookieOptions = (remember: boolean) => ({
  maxAge: remember ? REMEMBERED_MAX_AGE : undefined,
});

export const useAuth = () => {
  const config = useRuntimeConfig();
  const router = useRouter();

  // Sessions from before the flag existed count as remembered
  const remembered = useCookie<boolean | null>("remember_me").value !== false;
  const cookieOptions = authCookieOptions(remembered);

  const userCookie = useCookie<User | Manager | TenantAuthData | null>(
    "user",
    cookieOptions
  );

  const user = useState<User | Manager | TenantAuthData | null>(
    "user",
    () => userCookie.value
  );
  const token = useCookie<string | null>("token", cookieOptions);
  const refreshToken = useCookie<string | null>("refresh_token", cookieOptions);
  const userType = useCookie<UserType | null>("user_type", cookieOptions);

  const setUser = (value: User | Manager | TenantAuthData | null) => {
    user.value = value;
    userCookie.value = value;
  };

  /**
   * Signs in. A tenant whose email exists in several buildings gets a 409
   * ApiError with code BUILDING_SELECTION_REQUIRED and the building list;
   * retry with `buildingId`.
   */
  const login = async (
    email: string,
    password: string,
    type: UserType = "user",
    rememberMe: boolean = true,
    buildingId?: string
  ) => {
    try {
      const response = await $fetch<ApiResponse<LoginResponse>>(
        `${config.public.apiUrl}${endpoints[type].login}`,
        {
          method: "POST",
          body: {
            email,
            password,
            rememberMe,
            ...(type === "tenant" && buildingId ? { buildingId } : {}),
          },
        }
      );

      const mustResetPassword = response.data.mustResetPassword || false;
      let userData: User | Manager | TenantAuthData;
      if (type === "user") {
        userData = { ...response.data.user!, mustResetPassword };
      } else if (type === "manager") {
        userData = { ...response.data.manager!, mustResetPassword };
      } else {
        userData = { ...response.data.tenant!, mustResetPassword };
      }

      // This instance's cookies were opened with the previous session's
      // lifetime, so write the new session through ones that use the
      // chosen lifetime; other instances pick the values up automatically
      const options = authCookieOptions(rememberMe);
      useCookie<boolean>("remember_me", options).value = rememberMe;
      useCookie<string>("token", options).value = response.data.accessToken;
      useCookie<string>("refresh_token", options).value =
        response.data.refreshToken;
      useCookie<User | Manager | TenantAuthData>("user", options).value =
        userData;
      useCookie<UserType>("user_type", options).value = type;
      user.value = userData;

      return response;
    } catch (error) {
      throw toApiError(error, "Login failed");
    }
  };

  /** Creates an owner account; the caller sends them to sign in. */
  const register = async (
    name: string,
    email: string,
    password: string,
    phone?: string
  ) => {
    try {
      return await $fetch<ApiResponse<{ id: string; name: string; email: string }>>(
        `${config.public.apiUrl}/v1/app/auth/register`,
        {
          method: "POST",
          body: { name, email, password, phone },
        }
      );
    } catch (error) {
      throw toApiError(error, "Registration failed");
    }
  };

  const logout = () => {
    token.value = null;
    refreshToken.value = null;
    setUser(null);
    userType.value = null;
    useCookie<boolean | null>("remember_me").value = null;
    const selectedBuildingId = useCookie<string>("selectedBuildingId");
    selectedBuildingId.value = "";
    const { resetSubscription } = useSubscription();
    resetSubscription();
    router.push("/login");
  };

  const refresh = async () => {
    if (!refreshToken.value || !userType.value) {
      throw new Error("No refresh token available");
    }

    const response = await $fetch<ApiResponse<{ accessToken: string }>>(
      `${config.public.apiUrl}${endpoints[userType.value].refresh}`,
      {
        method: "POST",
        body: { refreshToken: refreshToken.value },
      }
    );

    token.value = response.data.accessToken;
    return response.data.accessToken;
  };

  /**
   * Changing the password revokes every other session; the server hands this
   * session fresh tokens, which are stored here.
   */
  const changePassword = async (oldPassword: string, newPassword: string) => {
    if (!userType.value) throw new Error("Not signed in");
    try {
      const response = await $fetch<ApiResponse<PasswordChangeResponse>>(
        `${config.public.apiUrl}${endpoints[userType.value].changePassword}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token.value}`,
          },
          body: { currentPassword: oldPassword, newPassword },
        }
      );

      if (response.data?.accessToken) {
        token.value = response.data.accessToken;
        refreshToken.value = response.data.refreshToken;
      }

      if (user.value) {
        setUser({ ...user.value, mustResetPassword: false });
      }
    } catch (error) {
      throw toApiError(error, "Password change failed");
    }
  };

  /** Owners and managers; the current password confirms the change. */
  const updateEmail = async (newEmail: string, currentPassword: string) => {
    if (userType.value !== "user" && userType.value !== "manager") {
      throw new Error("Not available");
    }
    const endpoint =
      userType.value === "user" ? "/v1/app/auth/me" : "/v1/manager/auth/me";

    try {
      const response = await $fetch<ApiResponse<{ email: string }>>(
        `${config.public.apiUrl}${endpoint}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token.value}`,
          },
          body: { email: newEmail, currentPassword },
        }
      );

      const newEmailValue = response.data?.email ?? newEmail;
      if (user.value) {
        setUser({ ...user.value, email: newEmailValue });
      }
    } catch (error) {
      throw toApiError(error, "Email update failed");
    }
  };

  const deleteAccount = async (password: string) => {
    if (userType.value !== "user") {
      throw new Error("Not available");
    }
    try {
      const response = await $fetch<ApiResponse<{ purgeAt: string }>>(
        `${config.public.apiUrl}/v1/app/auth/account`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token.value}`,
          },
          body: { password },
        }
      );
      return response.data;
    } catch (error) {
      throw toApiError(error, "Account deletion failed");
    }
  };

  const isAuthenticated = computed(() => !!token.value);

  return {
    user,
    userCookie,
    userType,
    token,
    refreshToken,
    setUser,
    login,
    register,
    logout,
    refresh,
    changePassword,
    updateEmail,
    deleteAccount,
    isAuthenticated,
  };
};
