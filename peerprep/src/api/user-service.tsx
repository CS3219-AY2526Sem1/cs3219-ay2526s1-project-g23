import { request } from "@/api";

const userServiceRequest = async (
  props: Pick<RequestOptions, "url" | "method" | "data" | "includeToken">
) => {
  return await request({ ...props, port: 3001 });
};

export const signUp = async (data: {
  username: string;
  email: string;
  password: string;
}) => {
  const { message } = await userServiceRequest({
    url: "/auth/signup",
    method: "post",
    data,
  });
  return message;
};

export const forgotPassword = async (data: { email: string }) => {
  await userServiceRequest({
    url: "/auth/forgot-password",
    method: "post",
    data,
  });
};

export const resetPassword = async (data: {
  token: string;
  password: string;
}) => {
  const { message } = await userServiceRequest({
    url: "/auth/reset-password",
    method: "post",
    data,
  });
  return message;
};

export const login = async (data: {
  username?: string;
  email?: string;
  password: string;
}) => {
  const { token, user } = await userServiceRequest({
    url: "/auth/login",
    method: "post",
    data,
  });
  const { id, username, email, isAdmin, stats } = user;
  localStorage.setItem("jwtToken", token);
  localStorage.setItem("userId", id);
  localStorage.setItem("username", username);
  localStorage.setItem("email", email);
  localStorage.setItem("isAdmin", isAdmin);
  localStorage.setItem("statistics", JSON.stringify(stats));
};

export const verifyToken = async () => {
  try {
    const { user } = await userServiceRequest({
      url: "/auth/verify-token",
      method: "get",
      includeToken: true,
    });
    const { id, username, email, isAdmin, stats } = user;
    localStorage.setItem("userId", id);
    localStorage.setItem("username", username);
    localStorage.setItem("email", email);
    localStorage.setItem("isAdmin", isAdmin);
    localStorage.setItem("statistics", JSON.stringify(stats));
  } catch (error) {
    localStorage.removeItem("jwtToken");
    localStorage.removeItem("userId");
    localStorage.removeItem("username");
    localStorage.removeItem("email");
    localStorage.removeItem("isAdmin");
    localStorage.removeItem("statistics");
    throw error;
  }
};

export const logout = async () => {
  try {
    await userServiceRequest({
      url: "/users/logout",
      method: "post",
    });
  } catch (error) {
    console.error(error.message);
  } finally {
    localStorage.removeItem("jwtToken");
    localStorage.removeItem("userId");
    localStorage.removeItem("username");
    localStorage.removeItem("email");
    localStorage.removeItem("isAdmin");
    localStorage.removeItem("statistics");
  }
};

export const getUserStats = async (userId: string) => {
  const stats = await userServiceRequest({
    url: `/users/${userId}/stats`,
    method: "get",
    includeToken: true,
  });
  // Optionally cache the latest stats locally
  localStorage.setItem("statistics", JSON.stringify(stats));
  return stats;
};

export const changePassword = async (data: {
  currentPassword: string;
  newPassword: string;
}) => {
  const { message } = await userServiceRequest({
    url: "/auth/change-password",
    method: "post",
    data,
    includeToken: true,
  });
  return message;
};
